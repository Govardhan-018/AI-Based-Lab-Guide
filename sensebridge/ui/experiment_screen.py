"""
ExperimentScreen — Live Lab Session Interface.

Ultra-minimal live lab interface with camera feed and AI guidance.
Pure white background with black elements only.
"""

import cv2
from PIL import Image
import customtkinter as ctk
from ui.design_system import Colors, Typography, Spacing, Dimensions, BorderRadius, ThemeConfig


class ExperimentScreen(ctk.CTkFrame):
    """Live lab session interface with camera feed and AI assistant."""

    def __init__(self, parent, session_manager, on_back, on_pause, on_resume, on_open_assistant, **kwargs):
        super().__init__(parent, **kwargs)
        self.configure(fg_color=Colors.PRIMARY_BG)

        self.session = session_manager
        self._on_back = on_back
        self._on_pause = on_pause
        self._on_resume = on_resume
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
            text="🧪 SenseBridge Lab Session",
            font=Typography.SECTION_TITLE,
            text_color=Colors.PRIMARY_TEXT,
        )
        self.title_label.pack(side="left", padx=(Spacing.SM, Spacing.XL), pady=Spacing.LG)

        # Back button in top bar
        self.back_btn = ctk.CTkButton(
            top_bar,
            text="← Back",
            font=Typography.SMALL_BOLD,
            width=80,
            height=Dimensions.BUTTON_HEIGHT_MD,
            **ThemeConfig.get_button_style(),
            command=self._on_back,
        )
        self.back_btn.pack(side="left", padx=Spacing.SM)

        # Progress indicator
        self.progress_frame = ctk.CTkFrame(
            top_bar,
            fg_color=Colors.PRIMARY_BG,
            corner_radius=BorderRadius.SMALL,
            border_color=Colors.BORDER,
            border_width=1,
        )
        self.progress_frame.pack(side="right", padx=Spacing.XL, pady=Spacing.LG)

        self.progress_label = ctk.CTkLabel(
            self.progress_frame,
            text="Step 1/3",
            font=Typography.BODY_BOLD,
            text_color=Colors.PRIMARY_TEXT,
        )
        self.progress_label.pack(padx=Spacing.MD, pady=Spacing.XS)

        # ---- Main Content Area ----
        content = ctk.CTkFrame(self, fg_color="transparent")
        content.pack(expand=True, fill="both", padx=Spacing.XL, pady=Spacing.XL)

        # Left Panel - Camera Feed
        left_panel = ctk.CTkFrame(
            content,
            fg_color=Colors.PRIMARY_BG,
            corner_radius=BorderRadius.LARGE,
            border_color=Colors.BORDER,
            border_width=1
        )
        left_panel.pack(side="left", expand=True, fill="both", padx=(0, Spacing.LG))

        self.video_label = ctk.CTkLabel(
            left_panel,
            text="📷 Initializing Camera...",
            font=Typography.SECTION_TITLE,
            text_color=Colors.TERTIARY_TEXT,
        )
        self.video_label.pack(expand=True, padx=Spacing.LG, pady=Spacing.LG)

        # Right Panel - Instructions & Controls
        right_panel = ctk.CTkFrame(
            content,
            fg_color=Colors.PRIMARY_BG,
            corner_radius=BorderRadius.LARGE,
            border_color=Colors.BORDER,
            border_width=1,
            width=Dimensions.RIGHT_PANEL_WIDTH
        )
        right_panel.pack(side="right", fill="y", padx=(Spacing.LG, 0))
        right_panel.pack_propagate(False)

        # Current Step Section
        step_section = ctk.CTkFrame(right_panel, fg_color="transparent")
        step_section.pack(fill="x", padx=Spacing.LG, pady=(Spacing.LG, Spacing.SM))

        step_header = ctk.CTkLabel(
            step_section,
            text="📋 Current Step",
            font=Typography.SUBTITLE,
            text_color=Colors.PRIMARY_TEXT,
            anchor="w",
        )
        step_header.pack(fill="x", pady=(0, Spacing.SM))

        self.instruction_label = ctk.CTkLabel(
            step_section,
            text="Loading instructions...",
            font=Typography.BODY,
            text_color=Colors.SECONDARY_TEXT,
            wraplength=300,
            justify="left",
            anchor="w",
        )
        self.instruction_label.pack(fill="x")

        # AI Assistant Button - Large and prominent
        ai_section = ctk.CTkFrame(right_panel, fg_color="transparent")
        ai_section.pack(fill="x", padx=Spacing.LG, pady=(Spacing.XL, Spacing.LG))

        self.ai_button = ctk.CTkButton(
            ai_section,
            text="🤖 Ask AI Assistant",
            font=Typography.SECTION_TITLE,
            height=Spacing.XXXL,
            **ThemeConfig.get_button_style("primary"),
            command=self._on_open_assistant,
        )
        self.ai_button.pack(fill="x")

        # Pause / Continue Controls
        control_section = ctk.CTkFrame(right_panel, fg_color="transparent")
        control_section.pack(fill="x", padx=Spacing.LG, pady=(0, Spacing.LG))

        self.pause_btn = ctk.CTkButton(
            control_section,
            text="⏸ Pause Lab",
            font=Typography.BODY_BOLD,
            **ThemeConfig.get_button_style(),
            command=self._handle_pause,
        )
        self.pause_btn.pack(fill="x", pady=(0, Spacing.SM))

        self.resume_btn = ctk.CTkButton(
            control_section,
            text="▶ Continue Lab",
            font=Typography.BODY_BOLD,
            **ThemeConfig.get_button_style("primary"),
            command=self._handle_resume,
        )
        # Hidden by default
        
        # Step Navigation
        nav_section = ctk.CTkFrame(right_panel, fg_color="transparent")
        nav_section.pack(fill="x", padx=Spacing.LG, pady=(0, Spacing.LG))

        nav_frame = ctk.CTkFrame(nav_section, fg_color="transparent")
        nav_frame.pack(fill="x")

        self.prev_button = ctk.CTkButton(
            nav_frame,
            text="← Previous",
            font=Typography.BODY_BOLD,
            **ThemeConfig.get_button_style(),
            command=self._previous_step,
        )
        self.prev_button.pack(side="left", padx=(0, Spacing.SM))

        self.next_button = ctk.CTkButton(
            nav_frame,
            text="Next →",
            font=Typography.BODY_BOLD,
            **ThemeConfig.get_button_style(),
            command=self._next_step,
        )
        self.next_button.pack(side="right", padx=(Spacing.SM, 0))

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

    def _handle_pause(self):
        """Toggle to paused state."""
        self.pause_btn.pack_forget()
        self.resume_btn.pack(fill="x", pady=(0, Spacing.SM))
        self._on_pause()

    def _handle_resume(self):
        """Toggle to active state."""
        self.resume_btn.pack_forget()
        self.pause_btn.pack(fill="x", pady=(0, Spacing.SM))
        self._on_resume()

    def _previous_step(self):
        """Navigate to previous step."""
        # This would be connected to session manager
        pass

    def _next_step(self):
        """Navigate to next step."""
        # This would be connected to session manager
        pass
