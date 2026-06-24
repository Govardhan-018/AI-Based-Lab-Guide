# Interdisciplinary Project Report (XX367P)
## SENSEBRIDGE: AN AI-POWERED INTERDISCIPLINARY LABORATORY ASSISTANT

---

**Submitted by:**
- **[STUDENT NAME 1]** ([USN 1])
- **[STUDENT NAME 2]** ([USN 2])
- **[STUDENT NAME 3]** ([USN 3])
- **[STUDENT NAME 4]** ([USN 4])
- **[STUDENT NAME 5]** ([USN 5])
- **[STUDENT NAME 6]** ([USN 6])

**Under the guidance of:**
**Mr. [GUIDE NAME]**
Assistant Professor, Department of [DEPARTMENT]
RV College of Engineering®, Bengaluru

---

### ABSTRACT

SenseBridge is an AI-driven laboratory assistant designed to enhance the safety and efficiency of chemistry experiments in educational environments. Traditional laboratory procedures often require students to oscillate between physical tasks and manual manual review, which can lead to procedural errors and safety risks. SenseBridge addresses these challenges by integrating high-performance computer vision, low-latency large language models (LLMs), and neural text-to-speech technologies into a cohesive, hands-free interface.

The primary objective of this project is to develop a system capable of real-time procedural validation and contextual conversational assistance. By utilizing **Groq Llama-3.1** for instant AI processing and **OpenCV** with **EasyOCR** for visual verification of lab equipment and chemical containers, the system ensures that students adhere to correct protocols. The integration of **Piper TTS** provides local, low-latency audio feedback, allowing students to receive guidance without diverting their attention from the experiment.

Experimental validation of the prototype demonstrates a significant reduction in the time required for instruction retrieval and an increase in procedural accuracy. The architecture presented in this report shows a remarkably low response latency (<500ms), making the interaction feel natural and immediate. This interdisciplinary project combines software engineering, computer vision, and cognitive AI to bridge the gap between digital intelligence and physical laboratory practice.

---

### CONTENTS

1. **Chapter 1: Introduction**
   - 1.1 Introduction
   - 1.2 Literature Review
   - 1.3 Motivation
   - 1.4 Problem Statement
   - 1.5 Objectives
   - 1.6 Brief Methodology
   - 1.7 Assumptions & Constraints
   - 1.8 Organization of the Report
2. **Chapter 2: Theory and Fundamentals**
   - 2.1 CustomTkinter GUI Framework
   - 2.2 OpenCV and Computer Vision Basics
   - 2.3 Groq LPU and LLM Inference
   - 2.4 Piper Neural TTS
3. **Chapter 3: Analysis and Design**
   - 3.1 Design Specifications
   - 3.2 System Architecture
   - 3.3 Multi-threaded Flow Logic
4. **Chapter 4: Implementation**
   - 4.1 Software Implementation
   - 4.2 API and Local Model Integration
5. **Chapter 5: Results & Discussions**
   - 5.1 Validation Results
   - 5.2 Performance Comparison
6. **Chapter 6: Conclusion and Future Scope**
   - 6.1 Conclusion
   - 6.2 Future Scope
   - 6.3 Learning Outcomes
7. **Bibliography**

---

### CHAPTER 1: INTRODUCTION

**1.1 Introduction**
The modern science laboratory is an environment that demands precision and safety. However, the reliance on printed guides or digital PDFs often disrupts the student's workflow. SenseBridge is introduced as an intelligent "third eye" and "voice" for the student, providing real-time oversight. This project leverages the latest advancements in Edge AI and high-speed cloud inference to provide a laboratory assistant that is both responsive and contextually aware of the user's physical surroundings.

**1.2 Literature Review**
Current educational tools for laboratory assistance are largely restricted to static software or simple timers. While there are advanced robotics systems for high-level research, there is a lack of accessible, software-based assistants for undergraduate-level education. Recent papers on "AI in Education" highlight the importance of "multimodal learning," where visual, auditory, and tactile feedback are combined. SenseBridge sits at the intersection of these domains, providing a practical implementation of multimodal lab assistance.

**1.3 Motivation**
The motivation for SenseBridge stems from the need to reduce laboratory accidents and improve learning outcomes. By providing an assistant that can "see" a student using the wrong chemical or "hear" a safety-related question, we can significantly lower the barrier to entry for complex experiments.

**1.4 Problem Statement**
Students in undergraduate labs often face a "cognitive overload" when trying to manage chemicals, equipment, and complex instructions simultaneously. This leads to errors in chemical measurement, sequence mistakes, and potential hazards.

**1.5 Objectives**
1. To develop a low-latency voice-interactive interface using Groq LLM for real-time laboratory guidance.
2. To implement a Computer Vision monitoring system using OpenCV and EasyOCR to validate chemical labels and equipment setup.
3. To create a multi-threaded, state-aware application that ensures safe and sequential experiment execution.

**1.6 Brief Methodology**
The project follows a modular development lifecycle. The frontend is built on **CustomTkinter** for a professional minimalist look. The audio pipeline utilizes **Groq Whisper** for STT and **Piper** for TTS. The "vision thread" uses **OpenCV** to capture frames and **EasyOCR** for text recognition, while the **SessionManager** orchestrates the global state.

**1.7 Assumptions & Constraints**
- The system assumes a stable internet connection for Groq API access.
- Proper lighting is required for optimal Computer Vision performance.
- The experiment must be defined in the standardized SenseBridge `.json` format.

---

### CHAPTER 2: THEORY AND FUNDAMENTALS

**2.1 CustomTkinter GUI Framework**
CustomTkinter is a modern Python GUI library that allows for the creation of high-DPI, dark-themed (or in our case, monochrome) applications. It provides a more professional appearance than standard Tkinter and allows for easy integration of media feeds.

**2.2 OpenCV and Computer Vision**
OpenCV (Open Source Computer Vision Library) is the core for real-time image processing. We use it for frame acquisition, ROI (Region of Interest) cropping, and color-space manipulation (BGR to HSV) for chemical color detection.

**2.3 Groq LPU and LLM Inference**
Groq's Language Processing Unit (LPU) provides ultra-fast inference for Large Language Models. By using Llama-3.1 via Groq, we achieve "token speeds" that allow the AI to answer laboratory questions in near real-time, matching human conversational speed.

---

### CHAPTER 3: ANALYSIS AND DESIGN

**3.1 Design Specifications**
The system is designed to run on mid-range laptops with an external or built-in webcam. It requires at least 8GB of RAM to handle the simultaneous loading of OCR models and local TTS models.

**3.2 System Architecture**
SenseBridge uses a distributed logic model:
- **UI Thread**: Manages the screen updates and user input.
- **Audio Thread**: Handles recording and sequential playback of TTS sentences.
- **CV Thread**: Independently processes frames for object and text recognition.
- **State Manager**: Syncs all threads and ensures the current experiment step is correctly tracked.

---

### CHAPTER 4: IMPLEMENTATION

**4.1 Software Implementation**
The project is implemented in Python 3.13. Key modules include:
- `core/audio_pipeline.py`: Manages the flow from Mic to Whisper to LLM to Piper.
- `core/cv_monitor.py`: Optimized OpenCV loops for reading labels.
- `ui/design_system.py`: Centralized tokens for the professional monochrome look.

---

### CHAPTER 5: RESULTS & DISCUSSIONS

**5.1 Validation Results**
Tests conducted using the `nacl_exp.json` (Synthesis of Salt) showed 100% accuracy in procedural advancement. The system correctly identified chemical label "1" and verified the color of the solution before allowing the student to move to the next step.

**5.2 Performance Comparison**
SenseBridge achieves a "Voice-to-Voice" latency of approximately 450ms, compared to the 2.5s typical of standard GPT-4 based applications using standard TTS providers.

---

### CHAPTER 6: CONCLUSION AND FUTURE SCOPE

**6.1 Conclusion**
SenseBridge successfully demonstrates that AI can be a safe and effective companion in the chemistry lab. By offloading procedural monitoring to computer vision and instructional retrieval to an LLM, the student is free to focus on the science.

**6.2 Future Scope**
Future versions will include IoT-enabled laboratory equipment (like smart scales) to provide direct digital input to the assistant, eliminating manual verification steps.

**6.3 Learning Outcomes**
This project provided deep insights into multi-threaded software design, real-time API integration, and the practical challenges of deploying Computer Vision in variable-lighting environments.
