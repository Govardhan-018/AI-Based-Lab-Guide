"""
OverviewScreen — Experiment Details Page.

Ultra-minimal modular sections for experiment overview.
Pure white background with black elements only.
"""

import json
import os
import customtkinter as ctk
from ui.design_system import Colors, Typography, Spacing, BorderRadius, ThemeConfig, Dimensions


class OverviewScreen(ctk.CTkFrame):
    """Experiment details page with modular sections."""

    def __init__(self, parent, on_start_experiment, on_back, on_speak=None, **kwargs):
        super().__init__(parent, **kwargs)
        self.configure(fg_color=Colors.PRIMARY_BG)
        self._on_start_experiment = on_start_experiment
        self._on_back = on_back
        self._on_speak = on_speak
        self._exp_file = None
        self._current_exp_data = None

        # Container for dynamic content
        self._content_frame = None

    def load_experiment(self, exp_file: str):
        """Load and display experiment overview data."""
        self._exp_file = exp_file

        # Clear previous content
        if self._content_frame:
            self._content_frame.destroy()

        self._content_frame = ctk.CTkScrollableFrame(self, fg_color="transparent")
        self._content_frame.pack(expand=True, fill="both", padx=Spacing.XXL, pady=Spacing.XL)

        # Load experiment data - try multiple paths
        exp_data = None
        for path in [exp_file, os.path.join("experiments", exp_file)]:
            if os.path.exists(path):
                try:
                    with open(path, "r", encoding="utf-8") as f:
                        exp_data = json.load(f)
                    break
                except Exception as e:
                    print(f"Error loading {path}: {e}")

        if not exp_data:
            error_label = ctk.CTkLabel(
                self._content_frame,
                text=f"Error: Could not load {exp_file}",
                font=Typography.SECTION_TITLE,
                text_color=Colors.PRIMARY_TEXT,
            )
            error_label.pack(pady=Spacing.XXXL)
            return

        self._current_exp_data = exp_data
        title = exp_data.get("title", "Lab Experiment")
        purpose = exp_data.get("purpose", "")
        real_use = exp_data.get("real_world_application", "")
        materials = exp_data.get("materials", [])
        safety = exp_data.get("safety", [])
        steps = exp_data.get("steps", [])
        metadata = exp_data.get("metadata", {})

        # ---- Header Section ----
        header_frame = ctk.CTkFrame(
            self._content_frame,
            **ThemeConfig.get_card_style(),
        )
        header_frame.pack(fill="x", pady=(0, Spacing.XL))

        # Back button in header
        back_btn = ctk.CTkButton(
            header_frame,
            text="← Back to Library",
            font=Typography.SMALL_BOLD,
            width=120,
            height=Dimensions.BUTTON_HEIGHT_SM,
            **ThemeConfig.get_button_style(),
            command=self._on_back,
        )
        back_btn.pack(anchor="nw", padx=Spacing.LG, pady=Spacing.LG)

        title_label = ctk.CTkLabel(
            header_frame,
            text=f"🧪 {title}",
            font=Typography.TITLE,
            text_color=Colors.PRIMARY_TEXT,
        )
        title_label.pack(pady=(Spacing.XL, Spacing.SM))

        # Metadata badges
        badges_frame = ctk.CTkFrame(header_frame, fg_color="transparent")
        badges_frame.pack(pady=(0, Spacing.XL))

        diff = metadata.get("difficulty", "unknown").capitalize()
        est_time = metadata.get("estimated_time", "?")

        for badge_text in [f"📊 {diff}", f"⏱ {est_time} min"]:
            badge_frame = ctk.CTkFrame(
                badges_frame,
                fg_color=Colors.PRIMARY_BG,
                corner_radius=BorderRadius.SMALL,
                border_color=Colors.BORDER,
                border_width=1,
            )
            badge_frame.pack(side="left", padx=Spacing.SM)
            
            badge_label = ctk.CTkLabel(
                badge_frame,
                text=f" {badge_text} ",
                font=Typography.SMALL_BOLD,
                text_color=Colors.PRIMARY_TEXT,
            )
            badge_label.pack(padx=Spacing.SM, pady=2)

        # ---- Purpose Section ----
        if purpose or real_use:
            self._create_section(
                self._content_frame,
                "🎯 Purpose & Application",
                f"{purpose}\n\n🌍 Real-world application: {real_use}" if purpose and real_use else (purpose or real_use)
            )

        # ---- Materials Section ----
        if materials:
            self._create_section(
                self._content_frame,
                "🧫 Materials Required",
                "\n".join(f"• {item}" for item in materials)
            )

        # ---- Safety Section ----
        if safety:
            self._create_section(
                self._content_frame,
                "⚠️ Safety Precautions",
                "\n".join(f"• {item}" for item in safety)
            )

        # ---- Procedure Section ----
        if steps:
            self._create_section(
                self._content_frame,
                "📋 Procedure Overview",
                "\n\n".join(f"Step {i+1}: {step.get('instruction', '')}" for i, step in enumerate(steps))
            )

        # ---- Action Buttons ----
        buttons_frame = ctk.CTkFrame(self._content_frame, fg_color="transparent")
        buttons_frame.pack(fill="x", pady=Spacing.XXL)

        # Explain button (if TTS available)
        if self._on_speak:
            explain_btn = ctk.CTkButton(
                buttons_frame,
                text="🔊 Explain Experiment",
                font=Typography.BODY_BOLD,
                **ThemeConfig.get_button_style(),
                command=self._speak_overview,
            )
            explain_btn.pack(side="left", padx=(0, Spacing.LG))

        # Start button
        start_btn = ctk.CTkButton(
            buttons_frame,
            text="🚀 Start Lab Session",
            font=Typography.SECTION_TITLE,
            **ThemeConfig.get_button_style("primary"),
            command=lambda: self._on_start_experiment(self._exp_file),
        )
        start_btn.pack(side="right")

    def _create_section(self, parent, title: str, content: str):
        """Create a modular section with title and content."""
        section_frame = ctk.CTkFrame(
            parent,
            **ThemeConfig.get_card_style(),
        )
        section_frame.pack(fill="x", pady=Spacing.LG)

        # Section title
        title_label = ctk.CTkLabel(
            section_frame,
            text=title,
            font=Typography.SECTION_TITLE,
            text_color=Colors.PRIMARY_TEXT,
        )
        title_label.pack(anchor="w", padx=Spacing.XL, pady=(Spacing.XL, Spacing.SM))

        # Section content
        content_label = ctk.CTkLabel(
            section_frame,
            text=content,
            font=Typography.BODY,
            text_color=Colors.SECONDARY_TEXT,
            wraplength=700,
            justify="left",
        )
        content_label.pack(anchor="w", padx=Spacing.XL, pady=(0, Spacing.XL))

    def _speak_overview(self):
        """Prepare and speak the experiment overview text."""
        if not self._current_exp_data or not self._on_speak:
            return

        data = self._current_exp_data
        title = data.get("title", "Lab Experiment")
        purpose = data.get("purpose", "")
        real_use = data.get("real_world_application", "")
        materials = ", ".join(data.get("materials", []))

        text = f"This experiment is titled {title}. "
        if purpose:
            text += f"The purpose of this lab is {purpose}. "
        if real_use:
            text += f"In the real world, {real_use}. "

        text += f"The materials you will need are: {materials}. "

        safety = data.get("safety", [])
        if safety:
            text += "Regarding safety: " + " ".join(safety)

        self._on_speak(text)
