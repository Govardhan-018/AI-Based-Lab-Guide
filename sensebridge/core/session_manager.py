"""
SessionManager — Central state store for the entire application.

Manages experiment state, assistant state, and references to all
shared services (ConversationManager, ExperimentManager, CVMonitor).
Uses an observer pattern so UI screens can react to state changes.
"""

import threading
from typing import Callable, Optional, List

from core.conversation_manager import ConversationManager


class SessionManager:
    """Central state manager for the SenseBridge application."""

    def __init__(self):
        # Experiment state
        self.experiment_id: str = ""
        self.experiment_file: str = ""

        # Conversation
        self.conversation_manager = ConversationManager()

        # Managed references (set by app.py after initialization)
        self.experiment_manager = None  # ExperimentManager instance
        self.cv_monitor = None          # CVMonitor instance

        # App state flags
        self.assistant_active: bool = False
        self.cv_active: bool = True
        self.paused: bool = False
        self.core_initialized: bool = False

        # Observer pattern
        self._observers: List[Callable] = []
        self._lock = threading.Lock()

    def register_observer(self, callback: Callable):
        """Register a callback for state change notifications.
        Callback signature: callback(event: str, data: dict)
        """
        with self._lock:
            self._observers.append(callback)

    def unregister_observer(self, callback: Callable):
        """Remove an observer callback."""
        with self._lock:
            self._observers = [cb for cb in self._observers if cb != callback]

    def notify_observers(self, event: str, data: Optional[dict] = None):
        """Notify all observers of a state change."""
        with self._lock:
            observers = list(self._observers)
        for cb in observers:
            try:
                cb(event, data or {})
            except Exception as e:
                print(f"[SessionManager] Observer error: {e}")

    # ---- Experiment Management ----

    def set_experiment(self, exp_file: str):
        """Set the active experiment file and initialize the experiment manager."""
        self.experiment_file = exp_file
        self.notify_observers("experiment_changed", {"file": exp_file})

    def get_current_step(self) -> int:
        """Returns the current step index."""
        if self.experiment_manager:
            return self.experiment_manager.current_step_index
        return 0

    def get_total_steps(self) -> int:
        """Returns the total number of steps."""
        if self.experiment_manager:
            return len(self.experiment_manager.steps)
        return 0

    def get_experiment_title(self) -> str:
        """Returns the title of the current experiment."""
        if self.experiment_manager and self.experiment_manager.exp_data:
            return self.experiment_manager.exp_data.get("title", "Lab Experiment")
        return "Lab Experiment"

    # ---- Assistant Management ----

    def open_assistant(self):
        """Mark assistant screen as active."""
        self.assistant_active = True
        # Pause camera rendering but keep CV processing alive
        if self.cv_monitor:
            self.cv_monitor.pause_rendering()
        self.notify_observers("assistant_opened", {})

    def close_assistant(self):
        """Mark assistant screen as closed."""
        self.assistant_active = False
        # Resume camera rendering
        if self.cv_monitor:
            self.cv_monitor.resume_rendering()
        self.notify_observers("assistant_closed", {})

    # ---- Context for AI ----

    def get_step_context(self) -> Optional[dict]:
        """Returns current step context dict for tagging conversation messages."""
        if not self.experiment_manager:
            return None
        step = self.experiment_manager.get_current_step()
        if not step:
            return None
        return {
            "experiment": self.get_experiment_title(),
            "step_id": step.get("id", ""),
            "step_index": self.experiment_manager.current_step_index,
            "instruction": step.get("instruction", ""),
        }
