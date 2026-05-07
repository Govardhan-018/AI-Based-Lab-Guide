"""
ConversationManager — Persistent chat history with experiment-linked context.

Stores all messages exchanged between the user and AI assistant,
tagged with timestamps and experiment step context. Provides
formatted history for LLM prompt injection.
"""

import time
from typing import List, Dict, Optional


class ConversationManager:
    """Manages persistent conversation history for the AI assistant."""

    def __init__(self, max_history: int = 100):
        self._history: List[Dict] = []
        self._max_history = max_history

    def add_message(self, role: str, content: str, step_context: Optional[Dict] = None):
        """
        Add a message to the conversation history.

        Args:
            role: "user" or "assistant"
            content: The message text
            step_context: Optional dict with experiment step info at time of message
        """
        message = {
            "role": role,
            "content": content,
            "timestamp": time.time(),
            "step_context": step_context,
        }
        self._history.append(message)

        # Trim oldest messages if over limit
        if len(self._history) > self._max_history:
            self._history = self._history[-self._max_history:]

    def get_history(self) -> List[Dict]:
        """Returns the full conversation history."""
        return list(self._history)

    def get_display_history(self) -> List[Dict]:
        """Returns history formatted for UI display (role, content, timestamp)."""
        return [
            {
                "role": msg["role"],
                "content": msg["content"],
                "timestamp": msg["timestamp"],
            }
            for msg in self._history
        ]

    def get_context_for_llm(self, max_messages: int = 10) -> List[Dict]:
        """
        Returns recent conversation history formatted for LLM API calls.

        Args:
            max_messages: Maximum number of recent messages to include

        Returns:
            List of {"role": ..., "content": ...} dicts for the messages API
        """
        recent = self._history[-max_messages:] if len(self._history) > max_messages else self._history
        return [
            {"role": msg["role"], "content": msg["content"]}
            for msg in recent
        ]

    def get_message_count(self) -> int:
        """Returns the total number of messages."""
        return len(self._history)

    def clear(self):
        """Clears all conversation history."""
        self._history.clear()

    def get_last_message(self) -> Optional[Dict]:
        """Returns the most recent message, or None if history is empty."""
        if self._history:
            return self._history[-1]
        return None
