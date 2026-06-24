import cv2
import numpy as np
import easyocr
import base64
import re

class CVEngine:
    def __init__(self):
        print("Loading EasyOCR...")
        # Point to the local models folder if needed, or rely on default
        self.reader = easyocr.Reader(['en'], gpu=False, verbose=False, model_storage_directory="./easyocr_models")
        print("EasyOCR loaded.")

        self.clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))

        # Only digits are valid test-tube labels. Restricting EasyOCR to this
        # allowlist makes recognition both much faster (smaller search space)
        # and far more accurate (no letters to confuse with digits).
        self.digit_allowlist = "0123456789"

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

    def _detect_color(self, hsv_frame, target_color):
        if target_color not in self.color_ranges:
            return True

        ranges = self.color_ranges[target_color]
        mask = cv2.inRange(hsv_frame, ranges["lower"], ranges["upper"])

        matching_pixels = cv2.countNonZero(mask)
        total_pixels = hsv_frame.shape[0] * hsv_frame.shape[1]
        percentage = (matching_pixels / total_pixels) * 100

        return percentage > 2.0

    def analyze_frame(self, base64_img: str, target_id: str, target_color: str = None):
        """
        Takes a base64 encoded image string (stripped of data URI prefix),
        runs CLAHE contrast enhancement and digit-only EasyOCR.
        Returns a dict with {"match": bool, "detected": list, "color_match": bool}
        """
        # Decode Base64 to cv2 image
        img_data = base64.b64decode(base64_img)
        np_arr = np.frombuffer(img_data, np.uint8)
        frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

        if frame is None:
            return {"match": False, "detected": [], "color_match": False, "error": "Invalid image"}

        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        gray_enhanced = self.clahe.apply(gray)

        # Normalise the target to a bare digit string ("1", "12", ...).
        target_digits = re.sub(r"\D", "", str(target_id or "")).lstrip("0") or re.sub(r"\D", "", str(target_id or ""))

        # Run digit-only OCR. allowlist + a modest mag_ratio keeps this fast on
        # CPU while still resolving small printed labels reliably.
        results = self.reader.readtext(
            gray_enhanced,
            allowlist=self.digit_allowlist,
            mag_ratio=1.3,
            text_threshold=0.4,
            low_text=0.3,
            paragraph=False,
        )

        id_found = False
        detected_texts = []

        for (bbox, text, prob) in results:
            cleaned_text = re.sub(r"\D", "", text)
            if not cleaned_text or prob < 0.10:
                continue

            detected_texts.append(f"{cleaned_text} ({prob:.2f})")

            if not target_digits:
                continue

            # Exact token match, or the target appears as a standalone number
            # inside a longer read (handles "1" read together with stray noise).
            normalized = cleaned_text.lstrip("0") or cleaned_text
            if normalized == target_digits or cleaned_text == target_digits:
                id_found = True
                break

        # Color detection
        color_found = True
        if target_color:
            hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
            color_found = self._detect_color(hsv, target_color)

        return {
            "match": id_found,
            "detected": detected_texts,
            "color_match": color_found
        }

    def analyze_color(self, base64_img: str, hsv_lower: list, hsv_upper: list, min_percent: float = 2.0):
        """
        Check if a colour within the given HSV range occupies at least
        min_percent of the centre crop of the frame.
        Returns {"match": bool, "percent": float}.
        """
        img_data = base64.b64decode(base64_img)
        np_arr = np.frombuffer(img_data, np.uint8)
        frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

        if frame is None:
            return {"match": False, "percent": 0, "error": "Invalid image"}

        hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
        lower = np.array(hsv_lower, dtype=np.uint8)
        upper = np.array(hsv_upper, dtype=np.uint8)
        mask = cv2.inRange(hsv, lower, upper)

        matching = cv2.countNonZero(mask)
        total = hsv.shape[0] * hsv.shape[1]
        pct = (matching / total) * 100

        return {"match": pct >= min_percent, "percent": round(pct, 2)}
