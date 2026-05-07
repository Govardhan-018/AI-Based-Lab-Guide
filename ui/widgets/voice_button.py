"""
VoiceButton — Animated microphone button with visual state indicators.

Ultra-minimal design with white background and black elements.
Circular button with subtle black glow animations.
"""

import customtkinter as ctk
from core.voice_state_manager import VoiceState
from ui.design_system import Colors, Typography, Spacing, Dimensions, BorderRadius


class VoiceButton(ctk.CTkFrame):
    """Animated mic button with ultra-minimal design and state indicators."""

    # Ultra-minimal state colors - white backgrounds, black elements
    STATE_COLORS = {
        VoiceState.IDLE: {
            "bg": Colors.PRIMARY_BG,
            "border": Colors.BORDER,
            "text": "🎤 Tap to Speak",
            "text_color": Colors.SECONDARY_TEXT,
        },
        VoiceState.LISTENING: {
            "bg": Colors.PRIMARY_BG,
            "border": Colors.ACTIVE_GLOW,
            "text": "🎙️ Listening...",
            "text_color": Colors.PRIMARY_TEXT,
        },
        VoiceState.PROCESSING: {
            "bg": Colors.PRIMARY_BG,
            "border": Colors.TERTIARY_TEXT,
            "text": "🧠 Thinking...",
            "text_color": Colors.SECONDARY_TEXT,
        },
        VoiceState.SPEAKING: {
            "bg": Colors.PRIMARY_BG,
            "border": Colors.ACTIVE_GLOW,
            "text": "🔊 Speaking...",
            "text_color": Colors.PRIMARY_TEXT,
        },
        VoiceState.PAUSED: {
            "bg": Colors.PRIMARY_BG,
            "border": Colors.BORDER,
            "text": "⏸ Paused",
            "text_color": Colors.SECONDARY_TEXT,
        },
        VoiceState.ERROR: {
            "bg": Colors.PRIMARY_BG,
            "border": Colors.PRIMARY_TEXT,
            "text": "⚠ Error",
            "text_color": Colors.PRIMARY_TEXT,
        },
    }

    def __init__(self, parent, command=None, **kwargs):
        super().__init__(parent, **kwargs)
        self.configure(fg_color="transparent")

        self._command = command
        self._current_state = VoiceState.IDLE
        self._pulse_active = False
        self._pulse_step = 0

        # Outer glow ring (for animations) - subtle black glow
        self.glow_frame = ctk.CTkFrame(
            self,
            fg_color="transparent",
            corner_radius=BorderRadius.FULL,
            width=Dimensions.MIC_BUTTON_SIZE + 16,
            height=Dimensions.MIC_BUTTON_SIZE + 16,
        )
        self.glow_frame.pack(pady=(0, Spacing.MD))
        self.glow_frame.pack_propagate(False)

        # Main mic button - circular, white with black border
        colors = self.STATE_COLORS[VoiceState.IDLE]
        self.button = ctk.CTkButton(
            self.glow_frame,
            text="🎤",
            font=ctk.CTkFont(size=32),
            width=Dimensions.MIC_BUTTON_SIZE,
            height=Dimensions.MIC_BUTTON_SIZE,
            corner_radius=BorderRadius.FULL,
            fg_color=colors["bg"],
            border_color=colors["border"],
            border_width=2,
            hover_color=Colors.PRIMARY_BG,  # Stay white on hover
            text_color=Colors.PRIMARY_TEXT,
            command=self._on_click,
        )
        self.button.place(relx=0.5, rely=0.5, anchor="center")

        # Status text below button
        self.status_label = ctk.CTkLabel(
            self,
            text=colors["text"],
            font=Typography.SMALL_BOLD,
            text_color=colors["text_color"],
        )
        self.status_label.pack(pady=(Spacing.SM, 0))

    def _on_click(self):
        if self._command:
            self._command()

    def set_state(self, state: VoiceState):
        """Update the button appearance based on voice state."""
        self._current_state = state
        colors = self.STATE_COLORS.get(state, self.STATE_COLORS[VoiceState.IDLE])

        # Update button appearance
        icon = {
            VoiceState.IDLE: "🎤",
            VoiceState.LISTENING: "🎙️",
            VoiceState.PROCESSING: "🧠",
            VoiceState.SPEAKING: "🔊",
            VoiceState.PAUSED: "⏸",
            VoiceState.ERROR: "⚠",
        }.get(state, "🎤")

        self.button.configure(
            text=icon,
            border_color=colors["border"],
            text_color=Colors.PRIMARY_TEXT,
        )
        self.status_label.configure(
            text=colors["text"],
            text_color=colors["text_color"]
        )

        # Start/stop pulse animation for listening/speaking states
        if state == VoiceState.LISTENING or state == VoiceState.SPEAKING:
            self._start_pulse()
        else:
            self._stop_pulse()

    def _start_pulse(self):
        """Start a subtle black glow pulse animation."""
        if self._pulse_active:
            return
        self._pulse_active = True
        self._pulse_step = 0
        self._do_pulse()

    def _stop_pulse(self):
        """Stop the pulse animation."""
        self._pulse_active = False
        self.glow_frame.configure(fg_color="transparent")

    def _do_pulse(self):
        """Execute one step of the subtle black pulse animation."""
        if not self._pulse_active:
            return

        # Create subtle black glow pulse effect
        if self._pulse_step % 2 == 0:
            # Subtle black glow
            self.glow_frame.configure(
                fg_color=Colors.QUATERNARY_BG,
                border_width=0
            )
            self.button.configure(border_width=3)
        else:
            # Transparent - only button border shows
            self.glow_frame.configure(
                fg_color="transparent",
                border_width=0
            )
            self.button.configure(border_width=2)

        self._pulse_step += 1
        self.after(700, self._do_pulse)  # Slower, more subtle

    def set_enabled(self, enabled: bool):
        """Enable or disable the button."""
        if enabled:
            self.button.configure(state="normal")
        else:
            self.button.configure(state="disabled")
