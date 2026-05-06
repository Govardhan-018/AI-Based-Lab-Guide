import os
import argparse
import re
import threading
import queue
import urllib.request
try:
    from piper import PiperVoice
    import sounddevice as sd
except ImportError:
    pass

from faster_whisper import WhisperModel
import ollama

def record_audio_from_mic(output_path="live_input.wav"):
    """
    Records audio from the default microphone until silence is detected.
    Requires 'SpeechRecognition' and 'PyAudio' packages.
    """
    try:
        import speech_recognition as sr
    except ImportError:
        print("Error: Missing required packages for live audio.")
        print("Please run: pip install SpeechRecognition pyaudio")
        exit(1)

    r = sr.Recognizer()
    try:
        with sr.Microphone() as source:
            print("Adjusting for ambient noise... (1 second)")
            r.adjust_for_ambient_noise(source, duration=1)
            
            print("\n==============================")
            print("🎤  SPEAK NOW...")
            print("(Recording will automatically stop when you stop talking)")
            print("==============================\n")
            
            # This will listen until it detects silence
            audio = r.listen(source)
            print("✅ Recording finished! Processing...\n")
            
            # Save the raw audio data to a WAV file
            with open(output_path, "wb") as f:
                f.write(audio.get_wav_data())
                
            return output_path
    
    except OSError as e:
        print(f"Error accessing microphone: {e}")
        print("Make sure your microphone is connected and not being used exclusively by another app.")
        exit(1)

def transcribe_audio(audio_path, model_size="base"):
    """
    Transcribes audio using faster-whisper.
    """
    print(f"Loading faster-whisper model ('{model_size}')...")
    model = WhisperModel(model_size, device="auto", compute_type="default")
    
    print("Transcribing speech to text...")
    # explicitly setting language to english prevents hallucinating silence as Russian
    segments, info = model.transcribe(audio_path, beam_size=5, language="en")
    
    transcription = ""
    for segment in segments:
        transcription += segment.text + " "
        
    return transcription.strip()

def tts_worker(audio_queue, voice):
    """Background worker to synthesize and play text chunks."""
    # Standard piper models use 22050 sample rate
    stream = sd.RawOutputStream(samplerate=22050, channels=1, dtype='int16')
    stream.start()
    while True:
        text = audio_queue.get()
        if text is None:
            break
            
        # Piper synthesize returns an Iterable of AudioChunks
        for audio_chunk in voice.synthesize(text):
            stream.write(audio_chunk.audio_int16_bytes)
                
    stream.stop()
    stream.close()

def prompt_gemma(text, audio_queue, model_name="gemma3:latest", experiment_data=""):
    """
    Sends the transcribed text to Gemma via Ollama and streams to TTS.
    """
    print(f"\nSending to Ollama (model: {model_name})...")
    print(f"🗣️ You said: \"{text}\"\n")
    try:
        print("🤖 === Gemma 3 Response ===")
        
        messages = []
        if experiment_data:
            messages.append({
                'role': 'system',
                'content': f"You are an AI assistant guiding a student through a science experiment. Here are the experiment details in JSON format:\n{experiment_data}\n\nPlease help the user based on these details. Be concise in your responses since they will be read out loud by TTS."
            })
        messages.append({
            'role': 'user',
            'content': text,
        })
        
        stream = ollama.chat(model=model_name, messages=messages, stream=True)
        
        sentence_buffer = ""
        for chunk in stream:
            word = chunk['message']['content']
            print(word, end='', flush=True)
            sentence_buffer += word
            
            # Simple chunking: trigger on punctuation usually followed by a space
            if re.search(r'[.!?:]\s*$', sentence_buffer):
                clean_sentence = sentence_buffer.strip()
                if clean_sentence:
                    audio_queue.put(clean_sentence)
                sentence_buffer = ""
                
        # Push any remaining text
        if sentence_buffer.strip():
            audio_queue.put(sentence_buffer.strip())
            
        print("\n\n==============================\n")
    except Exception as e:
         print(f"\nError communicating with Ollama: {e}")
         print(f"Make sure Ollama is running and you have the model '{model_name}' installed.")

def setup_piper():
    model_name = "en_US-lessac-medium"
    model_file = f"{model_name}.onnx"
    json_file = f"{model_file}.json"
    
    if not os.path.exists(model_file):
        print("\nDownloading Piper TTS voice model... (First time only)")
        urllib.request.urlretrieve(f"https://github.com/rhasspy/piper/releases/download/v0.0.2/voice-en-us-lessac-medium.tar.gz", "voice.tar.gz")
        # Wait, the huggingface links are safer and direct
        urllib.request.urlretrieve(f"https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/lessac/medium/{model_file}", model_file)
        urllib.request.urlretrieve(f"https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/lessac/medium/{json_file}", json_file)
        
    return PiperVoice.load(model_file, json_file)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Live Speech to Gemma 3 using faster-whisper.")
    parser.add_argument("--whisper_model", default="base", help="faster-whisper model size (tiny, base, small).")
    parser.add_argument("--gemma_model", default="gemma3", help="Exact name of your Gemma model in Ollama.")
    
    args = parser.parse_args()
    
    # Initialize Piper TTS
    try:
        voice = setup_piper()
    except NameError:
        print("Error: Piper TTS packages not installed. Run: pip install piper-tts sounddevice numpy")
        exit(1)
        
    audio_queue = queue.Queue()
    tts_thread = threading.Thread(target=tts_worker, args=(audio_queue, voice))
    tts_thread.start()
    
    temp_wav = "live_input.wav"
    
    # Step 1: Record from live microphone
    record_audio_from_mic(temp_wav)
    
    if not os.path.exists(temp_wav):
        audio_queue.put(None)
        tts_thread.join()
        exit(1)
        
    # Step 2: Transcribe the live audio
    transcribed_text = transcribe_audio(temp_wav, model_size=args.whisper_model)
    
    # Clean up the temporary audio file
    if os.path.exists(temp_wav):
        os.remove(temp_wav)
    
    if not transcribed_text:
        print("No speech was detected.")
        audio_queue.put(None)
        tts_thread.join()
        exit(0)
        
    # Load experiment data if available
    experiment_data = ""
    if os.path.exists("exp.txt"):
        try:
            with open("exp.txt", "r", encoding="utf-8") as f:
                experiment_data = f.read()
        except Exception as e:
            print(f"Warning: Could not load exp.txt: {e}")
            
    # Step 3: Use the transcription as input for Gemma 3
    prompt_gemma(transcribed_text, audio_queue, model_name=args.gemma_model, experiment_data=experiment_data)
    
    # Gracefully close thread
    audio_queue.put(None)
    tts_thread.join()
