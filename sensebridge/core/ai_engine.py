"""
AIEngine — Centralized AI response generation with rich context injection.

Handles all Groq LLM interactions. Builds system prompts that inject
experiment context, conversation history, CV observations, and step info.
Supports both blocking and streaming response modes.
"""

import json
import re
from typing import Generator, Tuple, Optional

from groq import Groq

from core.session_manager import SessionManager


# Default model
GROQ_MODEL = "llama-3.1-8b-instant"


class AIEngine:
    """Manages AI response generation with full context awareness."""

    def __init__(self, groq_client: Optional[Groq], session: SessionManager):
        self.client = groq_client
        self.session = session

    def build_system_prompt(self) -> str:
        """
        Builds a rich system prompt injecting all available context:
        - Experiment title and metadata
        - Current step instruction, hints, common errors
        - CV observations (if available)
        - Conversation history summary
        """
        parts = []
        parts.append("You are SenseBridge AI, a friendly and knowledgeable chemistry lab tutor.")
        parts.append("You guide students through chemistry experiments step by step.")
        parts.append("Be concise but helpful. Answer in 1-3 sentences unless the student asks for a detailed explanation.")
        parts.append("Use encouraging language. If the student makes an error, guide them gently.")
        parts.append("If the student asks to restart the experiment, start over, or if you believe the experiment has gone fundamentally wrong and needs a fresh start, include the exact command [RESTART_EXPERIMENT] at the very beginning of your response. This will physically reset the student's progress to Step 1.")
        parts.append("")

        # Experiment context
        exp_mgr = self.session.experiment_manager
        if exp_mgr and exp_mgr.exp_data:
            title = exp_mgr.exp_data.get("title", "Unknown Experiment")
            parts.append(f"Current Experiment: {title}")

            step = exp_mgr.get_current_step()
            if step:
                step_num = exp_mgr.current_step_index + 1
                total = len(exp_mgr.steps)
                parts.append(f"Current Step ({step_num}/{total}): {step.get('instruction', '')}")

                hints = step.get("hints", [])
                if hints:
                    parts.append(f"Hints for this step: {'; '.join(hints)}")

                errors = step.get("common_errors", [])
                if errors:
                    parts.append(f"Common errors to watch for: {'; '.join(errors)}")
            else:
                parts.append("The experiment has been completed.")
            parts.append("")

        # CV observations (if available)
        cv_monitor = self.session.cv_monitor
        if cv_monitor:
            try:
                observation = cv_monitor.get_latest_observation()
                if observation:
                    parts.append(f"Camera Observation: {observation}")
                    parts.append("")
            except AttributeError:
                pass  # CV monitor doesn't have this method yet (Phase 5)

        # Conversation context note
        msg_count = self.session.conversation_manager.get_message_count()
        if msg_count > 0:
            parts.append(f"You have been in conversation with this student ({msg_count} messages so far).")
            parts.append("Remember previous context when answering follow-up questions.")
            parts.append("")

        return "\n".join(parts)

    def get_response(self, user_message: str) -> str:
        """
        Get a complete (non-streaming) AI response.

        Args:
            user_message: The user's question

        Returns:
            The AI's response text
        """
        if not self.client:
            return "I'm sorry, my AI brain is not connected because the Groq API key is missing."

        system_prompt = self.build_system_prompt()

        # Build messages list with conversation history
        messages = [{"role": "system", "content": system_prompt}]
        messages.extend(self.session.conversation_manager.get_context_for_llm(max_messages=10))
        messages.append({"role": "user", "content": user_message})

        try:
            completion = self.client.chat.completions.create(
                model=GROQ_MODEL,
                messages=messages,
                temperature=0.5,
                max_tokens=300,
            )
            return completion.choices[0].message.content
        except Exception as e:
            print(f"[AIEngine] Groq API Error: {e}")
            return "I had trouble connecting to my brain. Please try again."

    def stream_response(self, user_message: str) -> Generator[Tuple[str, bool], None, None]:
        """
        Stream AI response tokens with sentence boundary detection.

        Yields:
            (token, sentence_complete) tuples where sentence_complete is True
            when a sentence boundary is detected (for TTS chunking).
        """
        if not self.client:
            yield ("I'm sorry, my AI brain is not connected because the Groq API key is missing.", True)
            return

        system_prompt = self.build_system_prompt()

        # Build messages list with conversation history
        messages = [{"role": "system", "content": system_prompt}]
        messages.extend(self.session.conversation_manager.get_context_for_llm(max_messages=10))
        messages.append({"role": "user", "content": user_message})

        try:
            completion = self.client.chat.completions.create(
                model=GROQ_MODEL,
                messages=messages,
                temperature=0.5,
                max_tokens=300,
                stream=True,
            )

            for chunk in completion:
                token = chunk.choices[0].delta.content
                if token:
                    # Check if token contains a sentence boundary
                    sentence_complete = bool(re.search(r'[.!?]\s*$', token))
                    yield (token, sentence_complete)

        except Exception as e:
            print(f"[AIEngine] Groq Streaming Error: {e}")
            yield ("I had trouble connecting to my brain. Please try again.", True)
