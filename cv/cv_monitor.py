"""
CVMonitor — Computer vision monitoring with OCR and color detection.

Runs camera capture and OCR processing in background threads.
Supports pausing/resuming rendering without stopping processing,
enabling the assistant screen to open without interrupting CV.
"""

import cv2
import numpy as np
import easyocr
import threading
import time


class CVMonitor:
    def __init__(self, camera_index=0):
        self.camera_index = camera_index
        self.target_state = None  # e.g., {"id": "1", "color": "pale_blue"}
        self.running = False
        self.thread = None
        self.raw_frame = None
        self.capture_thread = None
        self.step_complete_callback = None

        # Rendering control — allows pausing display without stopping processing
        self._rendering_active = True

        # Overlay data — written by OCR thread, read by UI thread for drawing
        self._overlay_lock = threading.Lock()
        self.overlays = []        # list of (tl, br, label, color) tuples
        self.status_text = ""     # status bar text

        # Latest observation for AI context injection
        self._observation_lock = threading.Lock()
        self._latest_observation = ""

        print("Loading EasyOCR...")
        self.reader = easyocr.Reader(['en'], gpu=False, verbose=False)
        print("EasyOCR loaded.")

        # Define HSV color ranges for the chemistry experiment
        self.color_ranges = {
            "pale_blue": {
                "lower": np.array([90, 50, 100]),
                "upper": np.array([130, 180, 255])
            },
            "dark_blue": {
                "lower": np.array([100, 150, 50]),
                "upper": np.array([140, 255, 200])
            },
            "pale_yellow": {
                "lower": np.array([20, 50, 150]),
                "upper": np.array([40, 150, 255])
            },
            "white_ppt": {
                "lower": np.array([0, 0, 180]),
                "upper": np.array([180, 40, 255])
            },
            "white_precipitate": {
                "lower": np.array([0, 0, 180]),
                "upper": np.array([180, 40, 255])
            },
            "white_transparent": {
                "lower": np.array([0, 0, 150]),
                "upper": np.array([180, 50, 255])
            }
        }

    def set_target(self, target_id, target_color):
        """Sets the target ID and color we are looking for."""
        print(f"[CV] New target set: ID='{target_id}', Color='{target_color}'")
        self.target_state = {
            "id": str(target_id),
            "color": target_color
        }
        # Clear old overlays when target changes
        with self._overlay_lock:
            self.overlays = []

    def start(self, callback):
        """Starts the background CV monitoring thread."""
        self.step_complete_callback = callback
        self.running = True

        # 1. Fast capture thread — keeps webcam buffer drained
        self.capture_thread = threading.Thread(target=self._capture_loop, daemon=True)
        self.capture_thread.start()

        # 2. OCR processing thread — runs heavy OCR at ~1fps, never blocks video
        self.thread = threading.Thread(target=self._ocr_loop, daemon=True)
        self.thread.start()

    def stop(self):
        """Stops the background CV monitoring threads."""
        self.running = False
        if self.capture_thread:
            self.capture_thread.join()
        if self.thread:
            self.thread.join()

    def pause_rendering(self):
        """Pause frame rendering (CV processing continues in background)."""
        self._rendering_active = False

    def resume_rendering(self):
        """Resume frame rendering."""
        self._rendering_active = True

    def is_rendering(self):
        """Check if rendering is active."""
        return self._rendering_active

    def get_display_frame(self):
        """Returns the latest camera frame with overlays drawn on it.
        Called by the UI thread at ~20fps. This is fast because it just
        reads raw_frame and draws cached overlay data — no heavy processing.
        Returns None if rendering is paused."""
        if not self._rendering_active:
            return None

        frame = self.raw_frame
        if frame is None:
            return None

        display = frame.copy()

        # Draw cached overlays from the last OCR run
        with self._overlay_lock:
            if self.status_text:
                cv2.putText(display, self.status_text, (10, 30),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 0), 2)

            # Draw ROI box if we are looking for a target
            if self.target_state:
                h, w = display.shape[:2]
                roi_size = 250
                x1 = max(0, (w - roi_size) // 2)
                y1 = max(60, (h - roi_size) // 2)
                cv2.rectangle(display, (x1, y1), (x1 + roi_size, y1 + roi_size), (255, 255, 255), 2)
                cv2.putText(display, "Hold number inside box", (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 1)

            for (tl, br, label, color) in self.overlays:
                cv2.rectangle(display, tl, br, color, 2)
                cv2.putText(display, label, (tl[0], tl[1] - 10),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2)

        return display

    def get_latest_observation(self) -> str:
        """Returns the latest CV observation as a text string for AI context."""
        with self._observation_lock:
            return self._latest_observation

    def _detect_color(self, hsv_frame, target_color):
        """Checks if a significant amount of the target color is in the frame."""
        if target_color not in self.color_ranges:
            return True

        ranges = self.color_ranges[target_color]
        mask = cv2.inRange(hsv_frame, ranges["lower"], ranges["upper"])

        matching_pixels = cv2.countNonZero(mask)
        total_pixels = hsv_frame.shape[0] * hsv_frame.shape[1]
        percentage = (matching_pixels / total_pixels) * 100

        return percentage > 2.0

    def _capture_loop(self):
        """Dedicated thread to constantly fetch frames from the webcam."""
        cap = cv2.VideoCapture(self.camera_index)
        cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
        cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)

        if not cap.isOpened():
            print("[CV] Error: Could not open webcam.")
            return

        while self.running:
            ret, frame = cap.read()
            if ret:
                self.raw_frame = frame
            else:
                time.sleep(0.01)
            time.sleep(0.001)

        cap.release()

    def _ocr_loop(self):
        """Runs heavy OCR processing at ~1fps. Never touches current_frame or display.
        Only updates overlay data that get_display_frame() reads."""
        stable_frames_required = 2
        current_stable_frames = 0
        last_match_time = 0

        clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))

        while self.running:
            # Wait until we have a frame and a target
            if self.raw_frame is None or not self.target_state:
                # Update status text
                with self._overlay_lock:
                    self.status_text = ""
                    self.overlays = []
                with self._observation_lock:
                    self._latest_observation = "No target set. Waiting for next step."
                time.sleep(0.1)
                continue

            target_id = self.target_state["id"]
            target_color = self.target_state.get("color")

            # Update status text
            status = f"Looking for ID: {target_id}"
            if target_color:
                status += f" | Color: {target_color}"
            with self._overlay_lock:
                self.status_text = status

            # Grab a clean frame snapshot for OCR (no overlays on raw_frame)
            ocr_frame = self.raw_frame.copy()

            # Crop to a specific 250x250 Target Area in the center.
            # This makes OCR processing >4x faster and focuses the AI.
            h, w = ocr_frame.shape[:2]
            roi_size = 250
            x1 = max(0, (w - roi_size) // 2)
            y1 = max(60, (h - roi_size) // 2)
            ocr_roi = ocr_frame[y1:y1+roi_size, x1:x1+roi_size]

            gray = cv2.cvtColor(ocr_roi, cv2.COLOR_BGR2GRAY)

            # Use CLAHE for adaptive contrast — handles backlighting without washing out text
            gray_enhanced = clahe.apply(gray)

            # Run OCR with high magnification to detect text easily
            # Lowered thresholds since ROI box eliminates most background noise anyway
            results = self.reader.readtext(gray_enhanced, mag_ratio=2.0, text_threshold=0.4, low_text=0.3)

            # Process results and build overlay data
            new_overlays = []
            id_found = False
            detected_texts = []

            for (bbox, text, prob) in results:
                # Keep alphanumeric AND common symbols that '1' gets mistaken for
                cleaned_text = ''.join(c for c in text if c.isalnum() or c in "|![]")
                if not cleaned_text or prob < 0.05:
                    continue

                detected_texts.append(f"'{cleaned_text}'({prob:.2f})")

                # Offset coordinates back to full frame (we cropped to ROI)
                (tl, tr, br, bl) = bbox
                tl = (int(tl[0]) + x1, int(tl[1]) + y1)
                bottom_right = (int(br[0]) + x1, int(br[1]) + y1)

                # Build comprehensive alias list for all digits (0-9)
                aliases = [target_id]
                if target_id == "1": aliases.extend(["l", "I", "i", "|", "!", "7", "]", "["])
                elif target_id == "2": aliases.extend(["Z", "z"])
                elif target_id == "3": aliases.extend(["B", "E"])
                elif target_id == "4": aliases.extend(["A", "H", "y"])
                elif target_id == "5": aliases.extend(["S", "s"])
                elif target_id == "6": aliases.extend(["G", "b"])
                elif target_id == "7": aliases.extend(["T", "/", "\\", "1"])
                elif target_id == "8": aliases.extend(["B", "&"])
                elif target_id == "9": aliases.extend(["g", "q"])
                elif target_id == "0": aliases.extend(["O", "o", "D", "Q"])

                # Check if it exactly matches our target or any of its aliases
                if cleaned_text in aliases:
                    id_found = True
                    new_overlays.append((tl, bottom_right, f"MATCH: {cleaned_text}", (0, 255, 0)))
                    break
                else:
                    new_overlays.append((tl, bottom_right, f"Read: {cleaned_text}", (0, 0, 255)))

            # Atomically update overlay data
            with self._overlay_lock:
                self.overlays = new_overlays

            # Update observation for AI context
            observation_parts = []
            if detected_texts:
                observation_parts.append(f"OCR detected: {', '.join(detected_texts)}")
            if id_found:
                observation_parts.append(f"Target ID '{target_id}' found")
            else:
                observation_parts.append(f"Target ID '{target_id}' not yet found")
            if target_color:
                hsv = cv2.cvtColor(ocr_frame, cv2.COLOR_BGR2HSV)
                color_found = self._detect_color(hsv, target_color)
                observation_parts.append(f"Color '{target_color}' {'detected' if color_found else 'not detected'}")

            with self._observation_lock:
                self._latest_observation = "; ".join(observation_parts)

            # Debug log
            if detected_texts:
                print(f"[CV] OCR: {', '.join(detected_texts)} | Target: {target_id}")

            # Color detection
            color_found = True
            if target_color:
                hsv = cv2.cvtColor(ocr_frame, cv2.COLOR_BGR2HSV)
                color_found = self._detect_color(hsv, target_color)

            # Stable frame tracking (timeout-based reset)
            current_time = time.time()
            if id_found and color_found:
                current_stable_frames += 1
                last_match_time = current_time
                print(f"[CV] Stable frame {current_stable_frames}/{stable_frames_required}")
            elif current_time - last_match_time > 5.0:
                current_stable_frames = 0

            # Trigger step completion
            if current_stable_frames >= stable_frames_required:
                print(f"[CV] Step validated! (ID: {target_id}, Color: {target_color})")
                self.target_state = None
                current_stable_frames = 0
                with self._overlay_lock:
                    self.overlays = []
                    self.status_text = ""
                with self._observation_lock:
                    self._latest_observation = "Step validated successfully."
                if self.step_complete_callback:
                    self.step_complete_callback()

            # OCR throttle — wait before next OCR cycle
            time.sleep(1.0)
