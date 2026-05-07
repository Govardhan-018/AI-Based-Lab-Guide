"""
ExperimentScreen — Camera feed + step instructions + AI assistant button.

Premium lab interface with live camera feed and conversational AI guidance.
"""

import cv2
from PIL import Image
import customtkinter as ctk
from ui.design_system import Colors, Typography, Spacing, Dimensions, BorderRadius, get_hover_color


class ExperimentScreen(ctk.CTkFrame):
    """Main experiment screen with camera, instructions, and AI assistant button."""

    def __init__(self, parent, session_manager, on_open_assistant, **kwargs):
        super().__init__(parent, **kwargs)
        self.configure(fg_color=Colors.PRIMARY_BG)

        self.session = session_manager
        self._on_open_assistant = on_open_assistant
        self._video_update_id = None

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

        self.title_label = ctk.CTkLabel(
            top_bar,
            text="🧪 SenseBridge Lab",
            font=Typography.SECTION_TITLE,
            text_color=Colors.PRIMARY_TEXT,
        )
        self.title_label.pack(side="left", padx=Spacing.XL, pady=Spacing.LG)

        # Progress badge
        self.progress_label = ctk.CTkLabel(
            top_bar,
            text="Step 1/3",
            font=Typography.BODY_BOLD,
            text_color=Colors.SECONDARY_TEXT,
            fg_color=Colors.SECONDARY_BG,
            corner_radius=BorderRadius.SMALL,
        )
        self.progress_label.pack(side="right", padx=Spacing.XL, pady=Spacing.LG)

        # ---- Main Content Area ----
        content = ctk.CTkFrame(self, fg_color="transparent")
        content.pack(expand=True, fill="both", padx=Spacing.MD, pady=Spacing.MD)

        # Camera frame (center) - Premium minimal border
        camera_container = ctk.CTkFrame(
            content,
            fg_color=Colors.PRIMARY_BG,
            corner_radius=BorderRadius.LARGE,
            border_color=Colors.BORDER,
            border_width=1
        )
        camera_container.pack(expand=True, fill="both", padx=Spacing.SM, pady=Spacing.SM)

        self.video_label = ctk.CTkLabel(
            camera_container,
            text="📷 Initializing Camera...",
            font=Typography.SECTION_TITLE,
            text_color=Colors.TERTIARY_TEXT,
        )
        self.video_label.pack(expand=True, padx=Spacing.LG, pady=Spacing.LG)

        # ---- Bottom Panel ----
        bottom = ctk.CTkFrame(
            self,
            fg_color=Colors.SECONDARY_BG,
            corner_radius=0,
            border_color=Colors.BORDER,
            border_width=1
        )
        bottom.pack(fill="x")

        # Instruction box (left)
        instruction_container = ctk.CTkFrame(
            bottom,
            fg_color="transparent"
        )
        instruction_container.pack(side="left", expand=True, fill="both", padx=(Spacing.MD, Spacing.SM), pady=Spacing.MD)

        step_header = ctk.CTkLabel(
            instruction_container,
            text="📋 Current Step",
            font=Typography.BODY_BOLD,
            text_color=Colors.PRIMARY_TEXT,
            anchor="w",
        )
        step_header.pack(fill="x", padx=Spacing.LG, pady=(Spacing.SM, Spacing.XS))

        self.instruction_label = ctk.CTkLabel(
            instruction_container,
            text="Loading instructions...",
            font=Typography.BODY,
            text_color=Colors.SECONDARY_TEXT,
            wraplength=550,
            justify="left",
            anchor="w",
        )
        self.instruction_label.pack(fill="x", padx=Spacing.LG, pady=(Spacing.XS, Spacing.MD))

        # Right side buttons container
        btn_container = ctk.CTkFrame(bottom, fg_color="transparent")
        btn_container.pack(side="right", padx=(Spacing.SM, Spacing.MD), pady=Spacing.MD)

        # AI Assistant button
        self.ai_button = ctk.CTkButton(
            btn_container,
            text="🤖\nAsk AI\nAssistant",
            font=Typography.BODY_BOLD,
            width=120,
            height=100,
            corner_radius=BorderRadius.LARGE,
            fg_color=Colors.BUTTON_PRIMARY_BG,
            hover_color=get_hover_color(Colors.BUTTON_PRIMARY_BG, lighten=False),
            text_color=Colors.BUTTON_PRIMARY_TEXT,
            command=self._on_open_assistant,
        )
        self.ai_button.pack()

    def update_instruction(self, text: str):
        """Update the current step instruction text."""
        self.instruction_label.configure(text=text)

    def update_progress(self, current: int, total: int):
        """Update the step progress indicator."""
        self.progress_label.configure(text=f"Step {current}/{total}")

    def start_video_feed(self):
        """Start the camera feed update loop."""
        self._update_video()

    def stop_video_feed(self):
        """Stop the camera feed update loop."""
        if self._video_update_id:
            self.after_cancel(self._video_update_id)
            self._video_update_id = None

    def _update_video(self):
        """Fetch and display the latest camera frame."""
        cv_monitor = self.session.cv_monitor
        if cv_monitor and cv_monitor.is_rendering():
            frame = cv_monitor.get_display_frame()
            if frame is not None:
                cv_image = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                pil_image = Image.fromarray(cv_image)

                ctk_image = ctk.CTkImage(
                    light_image=pil_image,
                    dark_image=pil_image,
                    size=(640, 480),
                )
                self.video_label.configure(image=ctk_image, text="")
                self.video_label._ctk_image = ctk_image  # Prevent GC

        # Schedule next update (~20 FPS)
        self._video_update_id = self.after(50, self._update_video)
