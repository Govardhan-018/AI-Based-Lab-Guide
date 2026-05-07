"""
AssistantScreen — AI Lab Assistant Interface.

Ultra-minimal conversational AI interface.
Pure white background with black elements only.
"""

import threading
import time
import customtkinter as ctk

from core.voice_state_manager import VoiceState
from ui.design_system import Colors, Typography, Spacing, Dimensions, BorderRadius, ThemeConfig
from ui.widgets.chat_bubble import ChatBubble, TypingIndicator
from ui.widgets.voice_button import VoiceButton


class AssistantScreen(ctk.CTkFrame):
    """Clean AI assistant interface with chat and voice support."""

    def __init__(self, parent, session_manager, ai_engine, audio_pipeline, on_back, on_reset_experiment=None, **kwargs):
        super().__init__(parent, **kwargs)
        self.configure(fg_color=Colors.PRIMARY_BG)

        self.session = session_manager
        self.ai_engine = ai_engine
        self.audio_pipeline = audio_pipeline
        self._on_back = on_back
        self._on_reset_experiment = on_reset_experiment

        self._typing_indicator = None
        self._streaming_bubble = None
        self._chat_widgets = []  # Keep references to prevent GC

        self._build_ui()

        if self.audio_pipeline:
            self.audio_pipeline.vsm.on_state_change(self._on_vsm_state_change)

    def _on_vsm_state_change(self, old_state, new_state):
        """Update button state when VoiceStateManager changes."""
        self.after(0, lambda: self.voice_button.set_state(new_state))

    def _build_ui(self):
        """Build the assistant screen layout."""

        # ---- Top Navigation Bar ----
        top_bar = ctk.CTkFrame(
            self,
            fg_color=Colors.TOP_NAV_BG,
            corner_radius=0,
            height=Dimensions.TOP_NAV_HEIGHT,
            border_color=Colors.TOP_NAV_BORDER,
            border_width=1
        )
        top_bar.pack(fill="x")
        top_bar.pack_propagate(False)

        # Back button
        back_btn = ctk.CTkButton(
            top_bar,
            text="← Back",
            font=Typography.BODY_BOLD,
            width=80,
            height=Dimensions.BUTTON_HEIGHT_MD,
            **ThemeConfig.get_button_style(),
            command=self._handle_back,
        )
        back_btn.pack(side="left", padx=Spacing.XL, pady=Spacing.LG)

        # Title
        title = ctk.CTkLabel(
            top_bar,
            text="🤖 AI Lab Assistant",
            font=Typography.SECTION_TITLE,
            text_color=Colors.PRIMARY_TEXT,
        )
        title.pack(side="left", padx=Spacing.XL)

        # ---- Chat Area ----
        self.chat_scroll = ctk.CTkScrollableFrame(
            self,
            fg_color=Colors.PRIMARY_BG,
            corner_radius=0,
        )
        self.chat_scroll.pack(expand=True, fill="both")

        # Welcome message
        self._welcome_label = ctk.CTkLabel(
            self.chat_scroll,
            text="👋 Welcome to SenseBridge AI\n\nAsk me anything about the experiment",
            font=Typography.SECTION_TITLE,
            text_color=Colors.TERTIARY_TEXT,
            justify="center",
        )
        self._welcome_label.pack(expand=True, pady=Spacing.XXXL)

        # ---- Bottom Input Area ----
        bottom_frame = ctk.CTkFrame(
            self,
            fg_color=Colors.PRIMARY_BG,
            corner_radius=0,
            border_color=Colors.BORDER,
            border_width=1
        )
        bottom_frame.pack(fill="x")

        # Input container
        input_container = ctk.CTkFrame(bottom_frame, fg_color="transparent")
        input_container.pack(fill="x", padx=Spacing.XL, pady=Spacing.LG)

        # Text input
        self.text_input = ctk.CTkEntry(
            input_container,
            placeholder_text="Type a message...",
            font=Typography.BODY,
            height=Dimensions.BUTTON_HEIGHT_LG,
            **ThemeConfig.get_input_style(),
        )
        self.text_input.pack(side="left", expand=True, fill="x", padx=(0, Spacing.MD))
        self.text_input.bind("<Return>", self._on_text_submit)

        # Send button
        self.send_btn = ctk.CTkButton(
            input_container,
            text="Send",
            font=Typography.BODY_BOLD,
            width=90,
            height=Dimensions.BUTTON_HEIGHT_LG,
            **ThemeConfig.get_button_style("primary"),
            command=self._on_send_click,
        )
        self.send_btn.pack(side="right")

        # Voice button
        voice_container = ctk.CTkFrame(bottom_frame, fg_color="transparent")
        voice_container.pack(pady=(0, Spacing.LG))

        self.voice_button = VoiceButton(voice_container, command=self._on_voice_toggle)
        self.voice_button.pack()

    # ================================================================
    # PUBLIC METHODS
    # ================================================================

    def on_screen_enter(self):
        """Called when the assistant screen becomes visible."""
        self._restore_chat_history()

    def on_screen_leave(self):
        """Called when leaving the assistant screen."""
        pass  # State is preserved automatically

    # ================================================================
    # CHAT HISTORY
    # ================================================================

    def _restore_chat_history(self):
        """Restore chat messages from ConversationManager."""
        history = self.session.conversation_manager.get_display_history()

        if not history:
            # Show welcome message
            if self._welcome_label:
                self._welcome_label.pack(expand=True, pady=Spacing.XXXL)
            return

        # Hide welcome
        if self._welcome_label:
            self._welcome_label.pack_forget()

        # Only add new messages (avoid duplicates)
        existing_count = len(self._chat_widgets)
        if existing_count < len(history):
            for msg in history[existing_count:]:
                self._add_chat_bubble(msg["role"], msg["content"], msg["timestamp"])

    def _add_chat_bubble(self, role: str, content: str, timestamp: float = None):
        """Add a chat bubble to the scroll area."""
        # Hide welcome on first message
        if self._welcome_label:
            self._welcome_label.pack_forget()

        bubble = ChatBubble(
            self.chat_scroll,
            role=role,
            content=content,
            timestamp=timestamp,
        )
        bubble.pack(fill="x", padx=Spacing.XL, pady=Spacing.SM)
        self._chat_widgets.append(bubble)

        # Auto-scroll to bottom
        self.after(50, lambda: self.chat_scroll._parent_canvas.yview_moveto(1.0))

        return bubble

    def _show_typing_indicator(self):
        """Show the typing indicator."""
        if self._typing_indicator:
            return
        self._typing_indicator = TypingIndicator(self.chat_scroll)
        self._typing_indicator.pack(fill="x", padx=Spacing.XL, pady=Spacing.SM)
        self.after(50, lambda: self.chat_scroll._parent_canvas.yview_moveto(1.0))

    def _hide_typing_indicator(self):
        """Remove the typing indicator."""
        if self._typing_indicator:
            self._typing_indicator.destroy()
            self._typing_indicator = None

    # ================================================================
    # TEXT INPUT HANDLING
    # ================================================================

    def _on_text_submit(self, event=None):
        """Handle text input submission."""
        self._send_message_from_text()

    def _on_send_click(self):
        """Handle send button click."""
        self._send_message_from_text()

    def _send_message_from_text(self):
        """Send the text input as a user message."""
        text = self.text_input.get().strip()
        if not text:
            return

        self.text_input.delete(0, "end")
        self._process_user_message(text)

    def _process_user_message(self, message: str):
        """Process a user message (from text or voice)."""
        # 1. Add user message to conversation and UI
        step_context = self.session.get_step_context()
        self.session.conversation_manager.add_message("user", message, step_context)
        self._add_chat_bubble("user", message)

        # 2. Disable input while processing
        self.text_input.configure(state="disabled")
        self.send_btn.configure(state="disabled")

        # 3. Show typing indicator
        self._show_typing_indicator()

        # 4. Generate response in background thread
        threading.Thread(target=self._generate_response, args=(message,), daemon=True).start()

    def _generate_response(self, user_message: str):
        """Generate AI response (runs in background thread)."""
        try:
            # Stream response
            full_response = ""
            current_sentence = ""
            bubble_created = False

            RESTART_TOKEN = "[RESTART_EXPERIMENT]"
            has_restart_cmd = False

            for token, sentence_complete in self.ai_engine.stream_response(user_message):
                full_response += token
                current_sentence += token

                # Detect restart command
                if not has_restart_cmd and RESTART_TOKEN in full_response:
                    has_restart_cmd = True
                    # Remove token from all buffers
                    full_response = full_response.replace(RESTART_TOKEN, "").strip()
                    current_sentence = current_sentence.replace(RESTART_TOKEN, "").strip()
                    # Trigger the reset
                    if self._on_reset_experiment:
                        self.after(0, self._on_reset_experiment)

                # Update UI on main thread
                if not bubble_created:
                    # Remove typing indicator and create streaming bubble
                    self.after(0, self._hide_typing_indicator)
                    self.after(0, lambda t=full_response: self._create_streaming_bubble(t))
                    bubble_created = True
                else:
                    # Update existing bubble
                    self.after(0, lambda t=full_response: self._update_streaming_bubble(t))

                # Send completed sentences to TTS
                if sentence_complete and current_sentence.strip():
                    if self.audio_pipeline:
                        self.audio_pipeline.speak_sentence(current_sentence.strip())
                    current_sentence = ""

            # Send any remaining text to TTS
            if current_sentence.strip() and self.audio_pipeline:
                self.audio_pipeline.speak_sentence(current_sentence.strip())

            # Save to conversation history
            step_context = self.session.get_step_context()
            self.session.conversation_manager.add_message("assistant", full_response, step_context)

        except Exception as e:
            print(f"[Assistant] Response generation error: {e}")
            error_msg = "I had trouble generating a response. Please try again."
            self.after(0, self._hide_typing_indicator)
            self.after(0, lambda: self._add_chat_bubble("assistant", error_msg))
            self.session.conversation_manager.add_message("assistant", error_msg)

        finally:
            # Re-enable input
            self.after(0, self._re_enable_input)

            # If no speech was generated or an error occurred, we might be stuck in PROCESSING
            if self.audio_pipeline and self.audio_pipeline.vsm.is_processing():
                self.audio_pipeline.vsm.transition(VoiceState.IDLE)

    def _create_streaming_bubble(self, text: str):
        """Create the initial streaming response bubble."""
        self._streaming_bubble = self._add_chat_bubble("assistant", text)

    def _update_streaming_bubble(self, text: str):
        """Update the streaming bubble with new text."""
        if self._streaming_bubble:
            self._streaming_bubble.update_content(text)
            self.after(10, lambda: self.chat_scroll._parent_canvas.yview_moveto(1.0))

    def _re_enable_input(self):
        """Re-enable text input after response is complete."""
        self._streaming_bubble = None
        self.text_input.configure(state="normal")
        self.send_btn.configure(state="normal")
        self.text_input.focus()

    # ================================================================
    # VOICE HANDLING
    # ================================================================

    def _on_voice_toggle(self):
        """Handle voice button tap — toggle recording."""
        if not self.audio_pipeline:
            return

        vsm = self.audio_pipeline.vsm

        if vsm.is_idle() or vsm.state == VoiceState.ERROR:
            # Start recording
            self.audio_pipeline.start_recording()
        elif vsm.is_listening():
            # Stop recording and process
            threading.Thread(target=self._process_voice_recording, daemon=True).start()
        elif vsm.is_speaking():
            # Interrupt speech
            vsm.force_state(VoiceState.IDLE)

    def _process_voice_recording(self):
        """Process recorded audio — transcribe and send to AI."""
        try:
            audio_data = self.audio_pipeline.stop_recording()
            if audio_data is None:
                return

            # Transcribe
            text = self.audio_pipeline.transcribe(audio_data)

            if text:
                # Process as regular message
                self.after(0, lambda t=text: self._process_user_message(t))
            else:
                self.audio_pipeline.vsm.transition(VoiceState.IDLE)

        except Exception as e:
            print(f"[Assistant] Voice processing error: {e}")
            self.audio_pipeline.vsm.force_state(VoiceState.IDLE)

    # ================================================================
    # NAVIGATION
    # ================================================================

    def _handle_back(self):
        """Handle back button — return to experiment screen."""
        self.on_screen_leave()
        self._on_back()
