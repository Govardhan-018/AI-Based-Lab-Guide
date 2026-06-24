"""
VoiceStateManager — Finite state machine for voice coordination.

Prevents mic conflicts, overlapping audio, and thread crashes.
Coordinates TTS + STT so they never run simultaneously.
"""

import threading
from enum import Enum
from typing import Callable, List, Optional


class VoiceState(Enum):
    IDLE = "idle"
    LISTENING = "listening"
    PROCESSING = "processing"
    SPEAKING = "speaking"
    PAUSED = "paused"
    ERROR = "error"


# Valid state transitions
_TRANSITIONS = {
    VoiceState.IDLE: {VoiceState.LISTENING, VoiceState.PAUSED, VoiceState.SPEAKING},
    VoiceState.LISTENING: {VoiceState.PROCESSING, VoiceState.IDLE, VoiceState.ERROR},
    VoiceState.PROCESSING: {VoiceState.SPEAKING, VoiceState.IDLE, VoiceState.ERROR},
    VoiceState.SPEAKING: {VoiceState.LISTENING, VoiceState.IDLE, VoiceState.ERROR},
    VoiceState.PAUSED: {VoiceState.IDLE, VoiceState.LISTENING},
    VoiceState.ERROR: {VoiceState.IDLE},
}


class VoiceStateManager:
    """Thread-safe voice state machine."""

    def __init__(self):
        self._state = VoiceState.IDLE
        self._lock = threading.Lock()
        self._observers: List[Callable] = []

    @property
    def state(self) -> VoiceState:
        with self._lock:
            return self._state

    def can_transition(self, new_state: VoiceState) -> bool:
        """Check if a transition to the given state is valid."""
        with self._lock:
            return new_state in _TRANSITIONS.get(self._state, set())

    def transition(self, new_state: VoiceState) -> bool:
        """
        Attempt to transition to a new state.

        Returns:
            True if transition succeeded, False if invalid
        """
        with self._lock:
            if new_state not in _TRANSITIONS.get(self._state, set()):
                print(f"[VoiceState] Invalid transition: {self._state.value} -> {new_state.value}")
                return False
            old_state = self._state
            self._state = new_state
            observers = list(self._observers)

        # Notify outside lock to prevent deadlocks
        for cb in observers:
            try:
                cb(old_state, new_state)
            except Exception as e:
                print(f"[VoiceState] Observer error: {e}")

        return True

    def force_state(self, new_state: VoiceState):
        """Force transition regardless of validity (for error recovery)."""
        with self._lock:
            old_state = self._state
            self._state = new_state
            observers = list(self._observers)

        for cb in observers:
            try:
                cb(old_state, new_state)
            except Exception as e:
                print(f"[VoiceState] Observer error: {e}")

    def on_state_change(self, callback: Callable):
        """Register a state change callback.
        Signature: callback(old_state: VoiceState, new_state: VoiceState)
        """
        with self._lock:
            self._observers.append(callback)

    def is_idle(self) -> bool:
        return self.state == VoiceState.IDLE

    def is_listening(self) -> bool:
        return self.state == VoiceState.LISTENING

    def is_speaking(self) -> bool:
        return self.state == VoiceState.SPEAKING

    def is_processing(self) -> bool:
        return self.state == VoiceState.PROCESSING

    def reset(self):
        """Reset to IDLE state (for error recovery)."""
        self.force_state(VoiceState.IDLE)
