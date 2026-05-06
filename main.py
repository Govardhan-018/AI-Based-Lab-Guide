import os
import queue
import threading
import time
import re
import urllib.request
import speech_recognition as sr

try:
    from piper import PiperVoice
    import sounddevice as sd
except ImportError:
    print("Piper TTS not fully installed.")

from faster_whisper import WhisperModel
from groq import Groq

from experiment_manager import ExperimentManager
from cv_monitor import CVMonitor

# ==========================================
# CONFIGURATION
# ==========================================
# Ensure you set the GROQ_API_KEY environment variable, or paste it below
GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
GROQ_MODEL = "llama-3.1-8b-instant" # Updated to the latest stable Llama 3.1 model

if not GROQ_API_KEY:
    print("WARNING: GROQ_API_KEY is not set. Please set it as an environment variable or update main.py.")

# ==========================================
# AUDIO & TTS SETUP
# ==========================================
def setup_piper():
    model_name = "en_US-lessac-medium"
    model_file = f"{model_name}.onnx"
    json_file = f"{model_file}.json"
    
    if not os.path.exists(model_file):
        print("\nDownloading Piper TTS voice model...")
        urllib.request.urlretrieve(f"https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/lessac/medium/{model_file}", model_file)
        urllib.request.urlretrieve(f"https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/lessac/medium/{json_file}", json_file)
        
    return PiperVoice.load(model_file, json_file)

def tts_worker(audio_queue, voice):
    """Background worker to synthesize and play text chunks."""
    stream = sd.RawOutputStream(samplerate=22050, channels=1, dtype='int16')
    stream.start()
    while True:
        text = audio_queue.get()
        if text is None:
            break
        for audio_chunk in voice.synthesize(text):
            stream.write(audio_chunk.audio_int16_bytes)
    stream.stop()
    stream.close()

# ==========================================
# STT SETUP
# ==========================================
def transcribe_audio(audio_path, model):
    # vad_filter=True ensures Whisper doesn't try to transcribe silence (which causes "Thank you" hallucinations)
    segments, _ = model.transcribe(audio_path, beam_size=5, language="en", vad_filter=True, condition_on_previous_text=False)
    transcription = " ".join([segment.text for segment in segments])
    return transcription.strip()

# ==========================================
# MAIN APPLICATION
# ==========================================
class SenseBridge:
    def __init__(self):
        print("Initializing SenseBridge...")
        
        # 1. Initialize Managers
        self.exp_manager = ExperimentManager("test_exp.txt")
        self.cv_monitor = CVMonitor(camera_index=0)
        
        # 2. Initialize TTS
        self.voice = setup_piper()
        self.audio_queue = queue.Queue()
        self.tts_thread = threading.Thread(target=tts_worker, args=(self.audio_queue, self.voice), daemon=True)
        self.tts_thread.start()
        
        # 3. Initialize STT
        print("Loading Whisper model...")
        self.whisper_model = WhisperModel("base", device="auto", compute_type="default")
        self.recognizer = sr.Recognizer()
        self.mic = sr.Microphone()
        
        # 4. Initialize Groq
        self.groq_client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None
        
        # State events
        self.step_completed_event = threading.Event()
        self.is_running = True

    def speak(self, text):
        """Sends text to the TTS worker queue."""
        print(f"\n[SenseBridge]: {text}")
        
        # Chunk text by sentences for smoother TTS
        sentences = re.split(r'(?<=[.!?]) +', text)
        for sentence in sentences:
            if sentence.strip():
                self.audio_queue.put(sentence.strip())

    def on_step_complete_cv(self):
        """Callback fired by CVMonitor when local validation succeeds."""
        self.step_completed_event.set()

    def ask_groq(self, user_question):
        """Sends the user's question to Groq LLM with context of the current step."""
        if not self.groq_client:
            return "I'm sorry, my AI brain is not connected because the Groq API key is missing."
            
        context = self.exp_manager.get_llm_context()
        system_prompt = f"You are a helpful AI chemistry tutor. The student is currently on this step:\n{context}\n\nAnswer their question concisely in 1-2 sentences."
        
        try:
            print("Thinking...")
            completion = self.groq_client.chat.completions.create(
                model=GROQ_MODEL,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_question}
                ],
                temperature=0.5,
                max_tokens=150
            )
            return completion.choices[0].message.content
        except Exception as e:
            print(f"Groq API Error: {e}")
            return "I had trouble connecting to my brain. Please try again."

    def run(self):
        print("\n==============================================")
        print("🧪 Welcome to SenseBridge Chemistry Tutor 🧪")
        print("==============================================\n")
        
        # Start CV thread
        self.cv_monitor.start(callback=self.on_step_complete_cv)
        
        # Adjust mic once
        with self.mic as source:
            self.recognizer.adjust_for_ambient_noise(source, duration=1)

        while not self.exp_manager.is_complete() and self.is_running:
            # 1. Start a new step
            step_instruction = self.exp_manager.get_instruction()
            self.speak(f"Next step: {step_instruction}")
            
            # Update CV target
            target_id, target_color = self.exp_manager.get_cv_target()
            self.cv_monitor.set_target(target_id, target_color)
            
            self.step_completed_event.clear()
            
            # 2. Wait for completion or user questions
            # We will run a loop that listens to the microphone for questions.
            # If step_completed_event is set by CV, we break and move to next step.
            
            while not self.step_completed_event.is_set():
                print("\n[Listening for questions... (or waiting for CV validation)]")
                try:
                    # Listen with a short timeout so we can check the CV event frequently
                    with self.mic as source:
                        audio = self.recognizer.listen(source, timeout=2, phrase_time_limit=10)
                        
                    print("[Processing Speech...]")
                    with open("temp.wav", "wb") as f:
                        f.write(audio.get_wav_data())
                    
                    transcription = transcribe_audio("temp.wav", self.whisper_model)
                    
                    if transcription:
                        print(f"🗣️ You said: {transcription}")
                        
                        # Generate answer via Groq
                        answer = self.ask_groq(transcription)
                        self.speak(answer)
                        
                except sr.WaitTimeoutError:
                    # Normal timeout, just loop again to check step_completed_event
                    continue
                except Exception as e:
                    pass # Ignore random mic errors
            
            # 3. Step Completed!
            self.speak("Excellent! The camera confirms you've completed that step correctly.")
            time.sleep(2) # Give TTS time to speak
            self.exp_manager.advance_step()
            
        self.speak("Congratulations! You have completed the entire experiment.")
        self.cv_monitor.stop()
        self.audio_queue.put(None)
        self.tts_thread.join()

if __name__ == "__main__":
    app = SenseBridge()
    try:
        app.run()
    except KeyboardInterrupt:
        print("\nExiting...")
        app.is_running = False
        app.cv_monitor.stop()
        app.audio_queue.put(None)
