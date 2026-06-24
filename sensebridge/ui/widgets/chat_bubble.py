"""
ChatBubble — Styled message bubble widget for the AI assistant chat.

Ultra-minimal monochrome design with white background and black elements.
"""

import time
import customtkinter as ctk
from ui.design_system import Colors, Typography, Spacing, BorderRadius


class ChatBubble(ctk.CTkFrame):
    """A styled chat message bubble with ultra-minimal design."""

    # Ultra-minimal color palette - white backgrounds, black text
    USER_BG = Colors.CHAT_USER_BG           # #FFFFFF (white)
    USER_TEXT = Colors.CHAT_USER_TEXT       # #000000 (black)
    ASSISTANT_BG = Colors.CHAT_AI_BG        # #000000 (black)
    ASSISTANT_TEXT = Colors.CHAT_AI_TEXT    # #FFFFFF (white)
    ASSISTANT_BORDER = Colors.CHAT_AI_BORDER  # #000000 (black)
    TIMESTAMP_COLOR = Colors.SECONDARY_TEXT # #00000099 (black with 60% opacity)

    def __init__(self, parent, role: str, content: str, timestamp: float = None, **kwargs):
        super().__init__(parent, **kwargs)

        self.role = role
        self._content = content
        self._timestamp = timestamp or time.time()

        is_user = role == "user"

        # Configure frame
        self.configure(
            fg_color="transparent",
            corner_radius=0,
        )

        # Bubble container — controls alignment
        bubble_anchor = "e" if is_user else "w"
        bubble_bg = self.USER_BG if is_user else self.ASSISTANT_BG
        text_color = self.USER_TEXT if is_user else self.ASSISTANT_TEXT

        # Role label
        role_text = "You" if is_user else "🤖 SenseBridge AI"
        role_label = ctk.CTkLabel(
            self,
            text=role_text,
            font=Typography.EXTRA_SMALL,
            text_color=self.TIMESTAMP_COLOR,
            anchor=bubble_anchor,
        )
        role_label.pack(fill="x", padx=Spacing.XL, pady=(Spacing.MD, 0))

        # Message bubble
        bubble_config = {
            "fg_color": bubble_bg,
            "corner_radius": BorderRadius.LARGE,
            "border_color": Colors.BORDER,
            "border_width": 1,
        }

        self.bubble_frame = ctk.CTkFrame(self, **bubble_config)

        if is_user:
            self.bubble_frame.pack(anchor="e", padx=(80, Spacing.XL), pady=(Spacing.SM, 0))
        else:
            self.bubble_frame.pack(anchor="w", padx=(Spacing.XL, 80), pady=(Spacing.SM, 0))

        # Message text
        self.text_label = ctk.CTkLabel(
            self.bubble_frame,
            text=content,
            font=Typography.BODY,
            text_color=text_color,
            wraplength=450,
            justify="left",
            anchor="w",
        )
        self.text_label.pack(padx=Spacing.LG, pady=Spacing.MD)

        # Timestamp
        time_str = time.strftime("%I:%M %p", time.localtime(self._timestamp))
        time_label = ctk.CTkLabel(
            self,
            text=time_str,
            font=Typography.SMALL,
            text_color=self.TIMESTAMP_COLOR,
            anchor=bubble_anchor,
        )
        time_label.pack(fill="x", padx=Spacing.XXL, pady=(Spacing.SM, Spacing.MD))

    def update_content(self, new_content: str):
        """Update the message content (for streaming responses)."""
        self._content = new_content
        self.text_label.configure(text=new_content)


class TypingIndicator(ctk.CTkFrame):
    """Animated typing indicator (three pulsing dots) - ultra-minimal design."""

    def __init__(self, parent, **kwargs):
        super().__init__(parent, **kwargs)
        self.configure(fg_color="transparent")

        self._dots_frame = ctk.CTkFrame(
            self,
            fg_color=Colors.PRIMARY_BG,
            corner_radius=BorderRadius.LARGE,
            border_color=Colors.BORDER,
            border_width=1
        )
        self._dots_frame.pack(anchor="w", padx=(Spacing.XL, 80), pady=(Spacing.SM, 0))

        self._dot_labels = []
        for i in range(3):
            dot = ctk.CTkLabel(
                self._dots_frame,
                text="●",
                font=Typography.BODY,
                text_color=Colors.SECONDARY_TEXT,
                width=20,
            )
            dot.pack(side="left", padx=Spacing.SM, pady=Spacing.MD)
            self._dot_labels.append(dot)

        self._anim_step = 0
        self._animating = True
        self._animate()

    def _animate(self):
        """Animate the dots with a subtle pulsing effect."""
        if not self._animating:
            return

        # Subtle opacity variations using black colors
        colors = [Colors.SECONDARY_TEXT, Colors.TERTIARY_TEXT, Colors.SECONDARY_TEXT]
        for i, dot in enumerate(self._dot_labels):
            idx = (self._anim_step + i) % len(colors)
            dot.configure(text_color=colors[idx])

        self._anim_step += 1
        self.after(500, self._animate)  # Slower, more subtle animation

    def destroy(self):
        self._animating = False
        super().destroy()
