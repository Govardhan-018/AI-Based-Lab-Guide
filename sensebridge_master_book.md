# SenseBridge Chemistry Tutor - Master Book

## 1. Overview
SenseBridge Chemistry Tutor is an AI-powered, interactive laboratory assistant designed to guide students through chemistry experiments. It acts as a virtual tutor that can "see" what the student is doing using a webcam, "speak" instructions and guidance, and "listen" to and answer the student's questions in real-time. 

By combining Computer Vision (CV), Speech-to-Text (STT), Large Language Models (LLMs), and Text-to-Speech (TTS) into a unified, low-latency interface, SenseBridge provides a hands-free, interactive learning experience that ensures safety and correct procedural execution in the lab.

## 2. Core Technologies Used
The prototype is built using a combination of fast local models and ultra-low-latency cloud APIs to achieve a fluid, real-time experience.

### User Interface (UI)
* **CustomTkinter**: A dark-themed, modern GUI framework built on top of Tkinter. It provides the visual layout, including the camera feed, instruction boxes, and interactive buttons.
* **Pillow (PIL)**: Used for handling and converting OpenCV image frames into a format compatible with the CustomTkinter UI.

### Computer Vision (CV) & Validation
* **OpenCV (`cv2`)**: Used for capturing the webcam feed, color space conversions (BGR to HSV for color detection), and drawing overlays (bounding boxes, text) on the screen. It also uses CLAHE (Contrast Limited Adaptive Histogram Equalization) to improve image contrast for better OCR performance.
* **EasyOCR**: A PyTorch-based Optical Character Recognition library used to read labels and numbers on test tubes and beakers.
* **NumPy**: Used for fast matrix operations, specifically in masking and calculating the percentage of target colors in a frame.

### Audio & Speech-to-Text (STT)
* **SoundDevice**: Used for low-level, low-latency audio playback (for TTS) and recording (for the Hold-to-Talk feature).
* **SciPy (`scipy.io.wavfile`)**: Used to save recorded NumPy audio arrays into temporary `.wav` files.
* **SpeechRecognition**: Used in alternative/older scripts for microphone access and silence detection.
* **Groq Whisper API (`whisper-large-v3`)**: Used in the primary UI for ultra-fast, cloud-based audio transcription.
* **Faster-Whisper**: Used in alternative scripts (`main.py`, `TTS.py`) for local, offline transcription.

### AI Brain & Large Language Models (LLM)
* **Groq API (`llama-3.1-8b-instant`)**: The core "brain" of the tutor in the primary UI. Groq's LPU inference engine provides near-instantaneous responses, which are streamed back to the user.
* **Ollama (`gemma3`)**: Supported in alternative scripts (`TTS.py`) for fully local, offline AI generation.

### Text-to-Speech (TTS)
* **Piper TTS**: A fast, local neural text-to-speech engine. It uses the `en_US-lessac-medium.onnx` voice model to synthesize natural-sounding speech from text chunks without relying on internet connectivity for playback.

## 3. How It Works: Step-by-Step Flow

### Phase 1: Initialization & Experiment Selection
1. **Launch**: The user runs `ui_main.py`, which opens the CustomTkinter application.
2. **Start Screen**: The user selects an experiment from a list (e.g., "Synthesis of NaCl", "Estimation of Copper").
3. **Parsing Data**: The system reads the corresponding experiment file (e.g., `nacl_exp.json` or `exp.txt`). These files define the materials, safety precautions, and a sequential list of steps. Each step defines the instructions, hints, expected visual events (target ID, target color), and validation rules.
4. **Overview**: The UI displays the materials and safety warnings for the user to review.
5. **Core Initialization**: When the user clicks "Start Lab Session", the background threads are spun up:
   - The TTS Piper model is loaded into memory.
   - The Groq client is initialized.
   - The `CVMonitor` connects to the webcam and starts its capture and OCR loops.

### Phase 2: Step-by-Step Guidance
1. **Instruction Delivery**: The `ExperimentManager` fetches the current step. The instruction text is displayed in the UI's text box, and simultaneously sent to Piper TTS to be spoken aloud.
2. **Target Setting**: The manager passes the required visual targets to the `CVMonitor`. For example, it tells the CV to look for a label "1" and a "pale_blue" color.

### Phase 3: Computer Vision Validation
The `CVMonitor` operates using two main background threads to ensure the UI remains responsive:
1. **Capture Thread**: Constantly drains the webcam buffer so the UI always has the freshest frame.
2. **OCR Loop Thread**: Runs roughly once per second.
   - It takes a snapshot of the frame and crops it to a central Region of Interest (ROI) box to focus the AI and speed up processing.
   - It applies grayscale and CLAHE enhancements.
   - It runs `EasyOCR` to detect text. It uses an alias system to prevent false negatives (e.g., treating the letter "l" or symbol "|" as the number "1").
   - It converts the frame to HSV and masks it using predefined color ranges (e.g., `pale_blue`: H=90-130, S=50-180, V=100-255) to verify if a required chemical color change has occurred.
   - **Validation**: If both the correct ID is read and the correct color is detected for a stable number of consecutive frames (to prevent false positives from motion blur), a callback is fired.
3. **Advancement**: The callback signals the `ExperimentManager` to advance to the next step, triggering the next instruction to be spoken.

### Phase 4: Interactive Q&A ("Hold-to-Talk")
At any point, the user can ask the tutor a question using the push-to-talk mechanism:
1. **Recording**: The user clicks and holds the "🎤 Hold to Ask AI" button. A `sounddevice` InputStream starts capturing audio into a NumPy array.
2. **Release**: When the button is released, the stream stops. If the recording is long enough, it is saved to a `temp.wav` file.
3. **Transcription**: The WAV file is sent to Groq's Whisper API. Within milliseconds, the spoken words are returned as text.
4. **Contextual AI Generation**: The transcribed text is sent to the Groq LLaMA 3.1 model. The system prompt is dynamically injected with the *current step's context* (instructions, hints, common errors), ensuring the AI's answer is highly relevant to exactly what the student is struggling with.
5. **Streaming TTS**: As Groq generates the text response (streamed token-by-token), the code buffers it into complete sentences. As soon as a sentence is complete, it is pushed to the `audio_queue`. The local Piper TTS worker immediately synthesizes and plays the audio while the LLM is still generating the rest of the response. This creates a remarkably fluent, low-latency conversational experience.

### Phase 5: Completion
Once the final step is successfully validated by the camera, the system announces the completion of the experiment, disables the camera feed to save resources, and displays a congratulatory message.

## 4. File Structure & Responsibilities
* **`ui_main.py`**: The primary entry point. Manages the GUI, threads, audio recording, LLM streaming, and orchestrates the interaction between all components.
* **`cv_monitor.py`**: Handles all webcam interactions, OpenCV manipulations, threading for the camera, color space detection, and EasyOCR text recognition.
* **`experiment_manager.py`**: A state machine that reads the JSON/TXT experiment files, tracks the user's progress, and serves context to the LLM and target parameters to the CV monitor.
* **`main.py`**: An alternative CLI/terminal-based runner that uses local faster-whisper instead of the UI.
* **`TTS.py`**: An experimental script testing fully local, offline pipelines using Ollama (`gemma3`) and `faster-whisper`.
* **Experiment Files (`nacl_exp.json`, `test_exp.txt`, `exp.txt`)**: JSON-structured documents defining the exact procedural flow, required materials, and CV validation rules for different labs.
* **`.env`**: Stores secret API keys (e.g., `GROQ_API_KEY`).
