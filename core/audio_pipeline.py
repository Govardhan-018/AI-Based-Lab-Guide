"""
AudioPipeline — Unified audio I/O manager.

Wraps Piper TTS for output, sounddevice for mic input,
and Groq Whisper for transcription. Coordinates with
VoiceStateManager to prevent mic/TTS conflicts.
"""

import os
import queue
import re
import threading
import urllib.request
from typing import Optional

import numpy as np
import scipy.io.wavfile as wavfile

try:
    from piper import PiperVoice
    import sounddevice as sd
    AUDIO_AVAILABLE = True
except ImportError:
    AUDIO_AVAILABLE = False
    print("[AudioPipeline] Piper TTS or sounddevice not installed.")

from core.voice_state_manager import VoiceStateManager, VoiceState


def setup_piper():
    """Download and load the Piper TTS voice model."""
    model_name = "en_US-lessac-medium"
    model_file = f"{model_name}.onnx"
    json_file = f"{model_file}.json"

    if not os.path.exists(model_file):
        print("\nDownloading Piper TTS voice model...")
        urllib.request.urlretrieve(
            f"https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/lessac/medium/{model_file}",
            model_file,
        )
        urllib.request.urlretrieve(
            f"https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/lessac/medium/{json_file}",
            json_file,
        )

    return PiperVoice.load(model_file, json_file)


class AudioPipeline:
    """Manages all audio I/O — TTS playback, mic recording, and transcription."""

    def __init__(self, vsm: VoiceStateManager, groq_client=None):
        self.vsm = vsm
        self.groq_client = groq_client

        # TTS
        self.voice = None
        self.audio_queue: queue.Queue = queue.Queue()
        self.tts_thread: Optional[threading.Thread] = None
        self._tts_done_event = threading.Event()
        self._stop_speech_flag = False

        # Recording state
        self.is_recording = False
        self.audio_data = []
        self.audio_stream = None

        # Initialize TTS
        self._init_tts()

    def _init_tts(self):
        """Initialize the Piper TTS engine and start the worker thread."""
        if not AUDIO_AVAILABLE:
            return
        try:
            self.voice = setup_piper()
            self.tts_thread = threading.Thread(target=self._tts_worker, daemon=True)
            self.tts_thread.start()
            print("[AudioPipeline] TTS initialized successfully.")
        except Exception as e:
            print(f"[AudioPipeline] TTS init failed: {e}")

    def _tts_worker(self):
        """Background worker that synthesizes and plays audio from the queue."""
        try:
            stream = sd.RawOutputStream(samplerate=22050, channels=1, dtype="int16")
            stream.start()
            while True:
                item = self.audio_queue.get()
                if item is None:
                    break

                text, callback = item if isinstance(item, tuple) else (item, None)
                if not text or not text.strip():
                    continue

                # Reset stop flag for new speech item
                self._stop_speech_flag = False

                # Transition to SPEAKING if possible
                if not self.vsm.is_speaking():
                    self.vsm.transition(VoiceState.SPEAKING)

                for audio_chunk in self.voice.synthesize(text):
                    if self._stop_speech_flag:
                        break
                    stream.write(audio_chunk.audio_int16_bytes)

                # Notify when this sentence is done
                if callback and not self._stop_speech_flag:
                    callback()

                # Check if queue is empty OR if we were stopped — if so, we're done speaking
                if self.audio_queue.empty() or self._stop_speech_flag:
                    self._tts_done_event.set()
                    # Only go back to IDLE if still in SPEAKING state
                    if self.vsm.is_speaking():
                        self.vsm.transition(VoiceState.IDLE)

            stream.stop()
            stream.close()
        except Exception as e:
            print(f"[AudioPipeline] TTS Fatal Error: {e}")

    def stop_speaking(self):
        """Clear the TTS queue and stop current speech synthesis immediately."""
        self._stop_speech_flag = True
        
        # Clear the queue
        while not self.audio_queue.empty():
            try:
                self.audio_queue.get_nowait()
            except queue.Empty:
                break
        
        # Ensure we transition out of SPEAKING state
        if self.vsm.is_speaking():
            self.vsm.transition(VoiceState.IDLE)
        
        self._tts_done_event.set()

    def speak(self, text: str):
        """Send text to the TTS queue. Splits by sentences for smoother playback."""
        if not self.voice:
            return
        sentences = re.split(r'(?<=[.!?]) +', text)
        self._tts_done_event.clear()
        for sentence in sentences:
            if sentence.strip():
                self.audio_queue.put(sentence.strip())

    def speak_sentence(self, sentence: str, on_done=None):
        """Send a single sentence to TTS with optional completion callback."""
        if not self.voice:
            return
        if sentence.strip():
            self._tts_done_event.clear()
            self.audio_queue.put((sentence.strip(), on_done))

    def wait_for_speech_done(self, timeout: float = 30.0):
        """Block until all queued speech has finished playing."""
        self._tts_done_event.wait(timeout=timeout)

    # ---- Recording ----

    def _audio_callback(self, indata, frames, time_info, status):
        """Sounddevice input stream callback."""
        if self.is_recording:
            self.audio_data.append(indata.copy())

    def start_recording(self):
        """Start recording from the microphone."""
        if not AUDIO_AVAILABLE:
            return False
        if self.is_recording:
            return False

        self.is_recording = True
        self.audio_data = []
        self.vsm.transition(VoiceState.LISTENING)

        try:
            self.audio_stream = sd.InputStream(
                samplerate=16000, channels=1, dtype="int16",
                callback=self._audio_callback,
            )
            self.audio_stream.start()
            return True
        except Exception as e:
            print(f"[AudioPipeline] Mic start error: {e}")
            self.is_recording = False
            self.vsm.force_state(VoiceState.ERROR)
            return False

    def stop_recording(self) -> Optional[np.ndarray]:
        """Stop recording and return the audio data as numpy array."""
        if not self.is_recording:
            return None

        self.is_recording = False
        if self.audio_stream:
            try:
                self.audio_stream.stop()
                self.audio_stream.close()
            except Exception:
                pass
            self.audio_stream = None

        if not self.audio_data:
            self.vsm.transition(VoiceState.IDLE)
            return None

        audio_np = np.concatenate(self.audio_data, axis=0)
        self.audio_data = []

        # Check minimum length (~0.5 seconds at 16kHz)
        if audio_np.shape[0] < 8000:
            self.vsm.transition(VoiceState.IDLE)
            return None

        return audio_np

    def transcribe(self, audio_np: np.ndarray) -> str:
        """Transcribe audio using Groq Whisper API."""
        if not self.groq_client:
            return ""

        self.vsm.transition(VoiceState.PROCESSING)

        try:
            # Save to temp file
            temp_path = "temp_recording.wav"
            wavfile.write(temp_path, 16000, audio_np)

            with open(temp_path, "rb") as f:
                transcription = self.groq_client.audio.transcriptions.create(
                    file=("temp_recording.wav", f.read()),
                    model="whisper-large-v3",
                    response_format="text",
                )

            # Cleanup
            try:
                os.remove(temp_path)
            except OSError:
                pass

            return transcription.strip() if transcription else ""

        except Exception as e:
            print(f"[AudioPipeline] Transcription error: {e}")
            self.vsm.force_state(VoiceState.ERROR)
            return ""

    def shutdown(self):
        """Clean shutdown of all audio resources."""
        if self.is_recording:
            self.stop_recording()
        if self.audio_queue:
            self.audio_queue.put(None)
        if self.tts_thread:
            self.tts_thread.join(timeout=5)
