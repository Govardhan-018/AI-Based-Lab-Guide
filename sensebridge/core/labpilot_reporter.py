"""
LabPilotReporter — Sends SenseBridge session data to the LabPilot web dashboard.

This module acts as the bridge between the local desktop app (SenseBridge)
and the centralized LabPilot web platform. It reports:
  - Session start/end
  - Step progression
  - Safety alerts (from CV detection)
  - Chat messages
  - Score updates
  - Heartbeats (keep-alive)

Usage:
    reporter = LabPilotReporter(base_url="http://localhost:3000")
    reporter.start_session(session_id, student_id, student_name, experiment_data)
    reporter.report_step_event(step_index, "completed", step_title="Step 1")
    reporter.report_alert("warning", "PPE not detected")
    reporter.end_session()
"""

import threading
import time
import uuid
import requests


class LabPilotReporter:
    def __init__(self, base_url="http://localhost:3000", student_id=None, student_name=None):
        self.base_url = base_url.rstrip("/")
        self.student_id = student_id or f"student-{uuid.uuid4().hex[:8]}"
        self.student_name = student_name or "Lab Student"
        self.session_id = None
        self._heartbeat_thread = None
        self._heartbeat_active = False
        self._enabled = True

    def _api(self, method, path, data=None):
        """Make an API call to LabPilot. Silently fails if server is unreachable."""
        if not self._enabled:
            return None
        try:
            url = f"{self.base_url}/api{path}"
            if method == "GET":
                resp = requests.get(url, timeout=5)
            elif method == "POST":
                resp = requests.post(url, json=data, timeout=5)
            elif method == "PATCH":
                resp = requests.patch(url, json=data, timeout=5)
            else:
                return None
            return resp.json() if resp.status_code < 400 else None
        except requests.ConnectionError:
            print(f"[LabPilotReporter] Server not reachable at {self.base_url}")
            return None
        except Exception as e:
            print(f"[LabPilotReporter] API error: {e}")
            return None

    # ---- Session Lifecycle ----

    def start_session(self, experiment_data, session_id=None):
        """Call when a student starts an experiment."""
        self.session_id = session_id or f"sb-{uuid.uuid4().hex[:12]}"

        result = self._api("POST", "/sessions", {
            "sessionId": self.session_id,
            "studentId": self.student_id,
            "studentName": self.student_name,
            "experimentId": experiment_data.get("experiment_id", "unknown"),
            "experimentTitle": experiment_data.get("title", "Experiment"),
            "subjectId": experiment_data.get("subject_id", "chem-101"),
            "totalSteps": len(experiment_data.get("steps", [])),
        })

        if result:
            print(f"[LabPilotReporter] Session started: {self.session_id}")
            self._start_heartbeat()
        else:
            print("[LabPilotReporter] Failed to start session (server may be offline)")

        return self.session_id

    def end_session(self, status="completed"):
        """Call when the experiment ends."""
        self._stop_heartbeat()
        if not self.session_id:
            return

        self._api("PATCH", f"/sessions/{self.session_id}", {
            "action": "end",
            "status": status,
        })
        print(f"[LabPilotReporter] Session ended: {self.session_id} ({status})")
        self.session_id = None

    # ---- Step Progression ----

    def report_step_event(self, step_index, step_action="started", step_title="", observation=None, cv_verified=False):
        """Report step start/completion."""
        if not self.session_id:
            return
        self._api("PATCH", f"/sessions/{self.session_id}", {
            "action": "step_event",
            "stepIndex": step_index,
            "stepTitle": step_title,
            "stepAction": step_action,
            "observation": observation,
            "cvVerified": cv_verified,
        })

    # ---- Scores ----

    def report_scores(self, understanding=None, safety=None, engagement=None):
        """Update student scores."""
        if not self.session_id:
            return
        scores = {}
        if understanding is not None:
            scores["understanding"] = understanding
        if safety is not None:
            scores["safety"] = safety
        if engagement is not None:
            scores["engagement"] = engagement
        if scores:
            self._api("PATCH", f"/sessions/{self.session_id}", {
                "action": "update_scores",
                "scores": scores,
            })

    # ---- Alerts ----

    def report_alert(self, severity, message):
        """Send a safety alert to the instructor dashboard."""
        if not self.session_id:
            return
        self._api("POST", "/alerts", {
            "sessionId": self.session_id,
            "studentId": self.student_id,
            "studentName": self.student_name,
            "severity": severity,
            "message": message,
        })
        print(f"[LabPilotReporter] Alert sent: [{severity}] {message}")

    # ---- Chat ----

    def report_chat(self, role, text, step_index=None):
        """Report a chat message (student question or AI response)."""
        if not self.session_id:
            return
        self._api("PATCH", f"/sessions/{self.session_id}", {
            "action": "chat_message",
            "role": role,
            "text": text,
            "stepIndex": step_index,
        })

    # ---- Flags ----

    def add_flag(self, flag):
        """Add a flag (e.g., 'needs_help', 'ppe_missing')."""
        if not self.session_id:
            return
        self._api("PATCH", f"/sessions/{self.session_id}", {
            "action": "add_flag",
            "flag": flag,
        })

    def remove_flag(self, flag):
        """Remove a flag."""
        if not self.session_id:
            return
        self._api("PATCH", f"/sessions/{self.session_id}", {
            "action": "remove_flag",
            "flag": flag,
        })

    # ---- Heartbeat ----

    def _start_heartbeat(self):
        """Send periodic heartbeats so the dashboard knows this client is alive."""
        self._heartbeat_active = True
        self._heartbeat_thread = threading.Thread(target=self._heartbeat_loop, daemon=True)
        self._heartbeat_thread.start()

    def _stop_heartbeat(self):
        self._heartbeat_active = False

    def _heartbeat_loop(self):
        while self._heartbeat_active and self.session_id:
            self._api("PATCH", f"/sessions/{self.session_id}", {"action": "heartbeat"})
            time.sleep(10)
