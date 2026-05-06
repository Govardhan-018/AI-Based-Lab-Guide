import os
import queue
import threading
import time
import re
import urllib.request
import speech_recognition as sr
import cv2
from PIL import Image, ImageTk
import customtkinter as ctk

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
GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
GROQ_MODEL = "llama-3.1-8b-instant"

# Set UI Theme
ctk.set_appearance_mode("Dark")
ctk.set_default_color_theme("blue")

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

def transcribe_audio(audio_path, model):
    segments, _ = model.transcribe(audio_path, beam_size=1, language="en", vad_filter=True, condition_on_previous_text=False)
    transcription = " ".join([segment.text for segment in segments])
    return transcription.strip()

# ==========================================
# GUI APPLICATION
# ==========================================
class SenseBridgeUI(ctk.CTk):
    def __init__(self):
        super().__init__()

        self.title("SenseBridge Chemistry Tutor")
        self.geometry("1000x700")
        self.protocol("WM_DELETE_WINDOW", self.on_closing)

        # 1. Initialize Managers
        print("Initializing SenseBridge Core...")
        self.exp_manager = ExperimentManager("test_exp.txt")
        self.cv_monitor = CVMonitor(camera_index=0)
        
        # 2. Initialize Voice (TTS & STT)
        self.voice = setup_piper()
        self.audio_queue = queue.Queue()
        self.tts_thread = threading.Thread(target=tts_worker, args=(self.audio_queue, self.voice), daemon=True)
        self.tts_thread.start()
        
        # Whisper will be lazy-loaded on first talk click for faster startup
        self.whisper_model = None
        self.recognizer = sr.Recognizer()
        self.mic = sr.Microphone()
        self.groq_client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None

        # Build UI
        self.build_ui()
        
        # Adjust mic once
        with self.mic as source:
            self.recognizer.adjust_for_ambient_noise(source, duration=1)

        # Start CV thread
        self.cv_monitor.start(callback=self.on_step_complete_cv)
        
        # Start GUI video loop
        self.update_video_feed()
        
        # Start first step
        self.advance_step(first_run=True)

    def build_ui(self):
        # Top Title
        self.title_label = ctk.CTkLabel(self, text="🧪 SenseBridge Tutor", font=ctk.CTkFont(size=24, weight="bold"))
        self.title_label.pack(pady=10)

        # Camera Frame
        self.video_label = ctk.CTkLabel(self, text="Loading Camera Feed...")
        self.video_label.pack(pady=10)

        # Instruction Text
        self.instruction_box = ctk.CTkTextbox(self, height=100, width=800, font=ctk.CTkFont(size=16))
        self.instruction_box.pack(pady=20)
        self.instruction_box.insert("0.0", "Loading instructions...")
        self.instruction_box.configure(state="disabled")

        # Push to Talk Button
        self.talk_button = ctk.CTkButton(self, text="🎤 Click to Ask Question", font=ctk.CTkFont(size=18), height=50, command=self.on_talk_clicked)
        self.talk_button.pack(pady=10)

    def update_video_feed(self):
        frame = self.cv_monitor.get_display_frame()
        if frame is not None:
            # Convert BGR (OpenCV) to RGB (PIL)
            cv_image = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            pil_image = Image.fromarray(cv_image)
            
            # Use CTkImage (required by CTkLabel for proper HiDPI support)
            ctk_image = ctk.CTkImage(light_image=pil_image, dark_image=pil_image, size=(640, 480))
            self.video_label.configure(image=ctk_image, text="")
            self.video_label._ctk_image = ctk_image  # Keep reference to prevent GC
            
        # Schedule the next frame update in 50ms (~20 FPS — sufficient for webcam)
        self.after(50, self.update_video_feed)

    def speak(self, text):
        sentences = re.split(r'(?<=[.!?]) +', text)
        for sentence in sentences:
            if sentence.strip():
                self.audio_queue.put(sentence.strip())

    def update_instruction_ui(self, text):
        self.instruction_box.configure(state="normal")
        self.instruction_box.delete("0.0", "end")
        self.instruction_box.insert("0.0", text)
        self.instruction_box.configure(state="disabled")

    def advance_step(self, first_run=False):
        if not first_run:
            self.speak("Excellent! The camera confirms you've completed that step correctly.")
            self.exp_manager.advance_step()

        if self.exp_manager.is_complete():
            self.update_instruction_ui("Experiment Complete! Great job.")
            self.speak("Congratulations! You have completed the entire experiment.")
            self.cv_monitor.stop()
            return

        step_instruction = self.exp_manager.get_instruction()
        self.update_instruction_ui(f"Current Step: {step_instruction}")
        self.speak(f"Next step: {step_instruction}")
        
        target_id, target_color = self.exp_manager.get_cv_target()
        self.cv_monitor.set_target(target_id, target_color)

    def on_step_complete_cv(self):
        # We must use self.after to safely update the GUI from the CV background thread
        self.after(0, self.advance_step)

    def on_talk_clicked(self):
        # Change UI state
        self.talk_button.configure(text="Listening...", state="disabled", fg_color="red")
        
        # Run listening in a background thread so the GUI (and camera) doesn't freeze
        threading.Thread(target=self.listen_and_respond, daemon=True).start()

    def listen_and_respond(self):
        try:
            # Lazy-load Whisper model on first use
            if self.whisper_model is None:
                self.after(0, lambda: self.talk_button.configure(text="Loading AI model..."))
                print("Loading Whisper model (first use)...")
                self.whisper_model = WhisperModel("tiny", device="auto", compute_type="default")
                print("Whisper model loaded.")
            
            with self.mic as source:
                # Listen for the user's question
                audio = self.recognizer.listen(source, timeout=3, phrase_time_limit=10)
                
            # Update UI to processing state
            self.after(0, lambda: self.talk_button.configure(text="Processing...", fg_color="orange"))
            
            with open("temp.wav", "wb") as f:
                f.write(audio.get_wav_data())
            
            transcription = transcribe_audio("temp.wav", self.whisper_model)
            
            if transcription:
                print(f"User asked: {transcription}")
                answer = self.ask_groq(transcription)
                self.speak(answer)
                
        except sr.WaitTimeoutError:
            print("No speech detected.")
        except Exception as e:
            print(f"Audio Error: {e}")
            
        finally:
            # Restore button state
            self.after(0, lambda: self.talk_button.configure(text="🎤 Click to Ask Question", state="normal", fg_color=["#3B8ED0", "#1F6AA5"]))

    def ask_groq(self, user_question):
        if not self.groq_client:
            return "I'm sorry, my API key is missing."
            
        context = self.exp_manager.get_llm_context()
        system_prompt = f"You are a helpful AI chemistry tutor. The student is currently on this step:\n{context}\n\nAnswer their question concisely in 1-2 sentences."
        
        try:
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

    def on_closing(self):
        print("Closing application...")
        self.cv_monitor.stop()
        self.audio_queue.put(None)
        self.destroy()

if __name__ == "__main__":
    app = SenseBridgeUI()
    app.mainloop()
