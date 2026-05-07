"""
OverviewScreen — Experiment overview showing materials, safety, and procedure.

Premium monochrome presentation of experiment details and instructions.
"""

import json
import os
import customtkinter as ctk
from ui.design_system import Colors, Typography, Spacing, BorderRadius, get_hover_color


class OverviewScreen(ctk.CTkFrame):
    """Experiment overview screen with materials, safety, and steps."""

    def __init__(self, parent, on_start_experiment, on_speak=None, **kwargs):
        super().__init__(parent, **kwargs)
        self.configure(fg_color=Colors.PRIMARY_BG)
        self._on_start_experiment = on_start_experiment
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

        self._content_frame = ctk.CTkFrame(self, fg_color="transparent")
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

        # ---- Header ----
        header = ctk.CTkFrame(
            self._content_frame,
            fg_color=Colors.SECONDARY_BG,
            border_color=Colors.BORDER,
            border_width=1,
            corner_radius=BorderRadius.LARGE,
        )
        header.pack(fill="x", pady=(0, Spacing.XL))

        title_lbl = ctk.CTkLabel(
            header,
            text=f"🧪 {title}",
            font=Typography.TITLE,
            text_color=Colors.PRIMARY_TEXT,
        )
        title_lbl.pack(pady=(Spacing.XL, Spacing.SM))

        # Metadata and Explain Button
        controls_frame = ctk.CTkFrame(header, fg_color="transparent")
        controls_frame.pack(pady=(0, Spacing.LG))

        badge_frame = ctk.CTkFrame(controls_frame, fg_color="transparent")
        badge_frame.pack(side="left")

        diff = metadata.get("difficulty", "unknown").capitalize()
        est_time = metadata.get("estimated_time", "?")

        for badge_text in [(f"📊 {diff}"), (f"⏱ {est_time} min")]:
            badge = ctk.CTkLabel(
                badge_frame,
                text=f"  {badge_text}  ",
                font=Typography.BODY_BOLD,
                fg_color=Colors.TERTIARY_BG,
                corner_radius=BorderRadius.SMALL,
                text_color=Colors.SECONDARY_TEXT,
            )
            badge.pack(side="left", padx=Spacing.MD)

        # Explain Button
        if self._on_speak:
            explain_btn = ctk.CTkButton(
                controls_frame,
                text="🔊 Explain Experiment",
                font=Typography.BODY_BOLD,
                fg_color=Colors.TERTIARY_BG,
                hover_color=get_hover_color(Colors.TERTIARY_BG),
                text_color=Colors.PRIMARY_TEXT,
                height=32,
                corner_radius=BorderRadius.SMALL,
                command=self._speak_overview
            )
            explain_btn.pack(side="left", padx=Spacing.MD)

        # ---- Scrollable Content ----
        scroll = ctk.CTkScrollableFrame(self._content_frame, fg_color="transparent")
        scroll.pack(expand=True, fill="both", pady=Spacing.MD)

        # Real World Application Section
        if real_use or purpose:
            sec_frame = ctk.CTkFrame(scroll, fg_color=Colors.SECONDARY_BG, corner_radius=BorderRadius.MEDIUM)
            sec_frame.pack(fill="x", padx=Spacing.LG, pady=Spacing.MD)
            
            app_title = ctk.CTkLabel(sec_frame, text="🌍 Meaning & Real-world Use", font=Typography.BODY_BOLD, text_color=Colors.PRIMARY_TEXT)
            app_title.pack(padx=Spacing.LG, pady=(Spacing.MD, Spacing.XS), anchor="w")
            
            content_text = f"{purpose}\n\n{real_use}" if purpose and real_use else (purpose or real_use)
            app_desc = ctk.CTkLabel(sec_frame, text=content_text, font=Typography.BODY, text_color=Colors.SECONDARY_TEXT, wraplength=650, justify="left")
            app_desc.pack(padx=Spacing.LG, pady=(0, Spacing.MD), anchor="w")

        # Materials Section
        if materials:
            self._section(scroll, "🧫 Materials Required", materials)

        # Safety Section
        if safety:
            self._section(scroll, "⚠ Safety Precautions", safety)

        # Procedure Section
        if steps:
            sec_label = ctk.CTkLabel(
                scroll,
                text="📋 Procedure Overview",
                font=Typography.SECTION_TITLE,
                text_color=Colors.PRIMARY_TEXT,
                anchor="w",
            )
            sec_label.pack(fill="x", padx=Spacing.LG, pady=(Spacing.XL, Spacing.MD))

            for i, step in enumerate(steps):
                instruction = step.get("instruction", "")
                step_frame = ctk.CTkFrame(
                    scroll,
                    fg_color=Colors.SECONDARY_BG,
                    border_color=Colors.BORDER,
                    border_width=1,
                    corner_radius=BorderRadius.MEDIUM,
                )
                step_frame.pack(fill="x", padx=Spacing.XL, pady=Spacing.SM)

                step_lbl = ctk.CTkLabel(
                    step_frame,
                    text=f"  Step {i + 1}:  {instruction}",
                    font=Typography.BODY,
                    text_color=Colors.SECONDARY_TEXT,
                    justify="left",
                    wraplength=700,
                    anchor="w",
                )
                step_lbl.pack(fill="x", padx=Spacing.LG, pady=Spacing.MD)

        # ---- Start Button ----
        start_btn = ctk.CTkButton(
            self._content_frame,
            text="🚀 Start Lab Session",
            font=Typography.SECTION_TITLE,
            height=Spacing.XXXL,
            corner_radius=BorderRadius.LARGE,
            fg_color=Colors.BUTTON_PRIMARY_BG,
            hover_color=get_hover_color(Colors.BUTTON_PRIMARY_BG, lighten=False),
            text_color=Colors.BUTTON_PRIMARY_TEXT,
            command=lambda: self._on_start_experiment(self._exp_file),
        )
        start_btn.pack(pady=Spacing.XL)

    def _section(self, parent, title: str, items: list):
        """Render a section with a title and bullet items."""
        sec_label = ctk.CTkLabel(
            parent,
            text=title,
            font=Typography.SECTION_TITLE,
            text_color=Colors.PRIMARY_TEXT,
            anchor="w",
        )
        sec_label.pack(fill="x", padx=Spacing.LG, pady=(Spacing.XL, Spacing.MD))

        for item in list(items):
            lbl = ctk.CTkLabel(
                parent,
                text=f"  •  {item}",
                font=Typography.BODY,
                text_color=Colors.SECONDARY_TEXT,
                anchor="w",
            )
            lbl.pack(fill="x", padx=(Spacing.XXXL, Spacing.LG), pady=Spacing.SM)

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
