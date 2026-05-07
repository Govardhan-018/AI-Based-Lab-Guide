"""
StartScreen — Experiment selection screen.

Premium minimalist interface for experiment selection on app launch.
"""

import customtkinter as ctk
from ui.design_system import Colors, Typography, Spacing, BorderRadius, get_hover_color


class StartScreen(ctk.CTkFrame):
    """Experiment selection screen shown on app launch."""

    def __init__(self, parent, on_experiment_selected, **kwargs):
        super().__init__(parent, **kwargs)
        self.configure(fg_color=Colors.PRIMARY_BG)
        self._on_experiment_selected = on_experiment_selected

        # ---- Header Section ----
        header_frame = ctk.CTkFrame(self, fg_color="transparent")
        header_frame.pack(fill="x", pady=(Spacing.XXXL, Spacing.MD))

        # Logo / Title
        title = ctk.CTkLabel(
            header_frame,
            text="🧪 SenseBridge",
            font=Typography.TITLE,
            text_color=Colors.PRIMARY_TEXT,
        )
        title.pack()

        subtitle = ctk.CTkLabel(
            header_frame,
            text="AI Laboratory Assistant",
            font=Typography.SECTION_TITLE,
            text_color=Colors.SECONDARY_TEXT,
        )
        subtitle.pack(pady=(Spacing.SM, 0))

        # ---- Divider ----
        divider = ctk.CTkFrame(self, fg_color=Colors.BORDER, height=1)
        divider.pack(fill="x", padx=Spacing.XXXL, pady=Spacing.XL)

        # ---- Experiment Selection ----
        select_label = ctk.CTkLabel(
            self,
            text="Select an Experiment:",
            font=Typography.SECTION_TITLE,
            text_color=Colors.PRIMARY_TEXT,
        )
        select_label.pack(pady=(Spacing.LG, Spacing.XL))

        self.experiment_var = ctk.StringVar(value="nacl_exp.json")

        experiments = [
            ("⚗️  Synthesis of Copper Sulfate", "copper_sulfate_exp.json", "Medium • ~30 min"),
            ("🧂  Synthesis of NaCl (Salt)", "nacl_exp.json", "Easy • ~15 min"),
            ("📷  Camera Verification Test", "test_exp.txt", "Easy • ~5 min"),
            ("🔬  Estimation of Copper from E-waste", "exp.txt", "Medium • ~45 min"),
        ]

        for exp_name, exp_file, difficulty in experiments:
            exp_frame = ctk.CTkFrame(
                self,
                fg_color=Colors.SECONDARY_BG,
                border_color=Colors.BORDER,
                border_width=1,
                corner_radius=BorderRadius.LARGE,
            )
            exp_frame.pack(fill="x", padx=Spacing.XXXL, pady=Spacing.SM)

            radio = ctk.CTkRadioButton(
                exp_frame,
                text=exp_name,
                variable=self.experiment_var,
                value=exp_file,
                font=Typography.SUBTITLE,
                text_color=Colors.PRIMARY_TEXT,
                radiobutton_width=22,
                radiobutton_height=22,
                border_width_unchecked=2,
                border_width_checked=2,
                fg_color=Colors.ACTIVE_GLOW,
            )
            radio.pack(side="left", padx=Spacing.XL, pady=Spacing.LG)

            diff_label = ctk.CTkLabel(
                exp_frame,
                text=difficulty,
                font=Typography.SMALL,
                text_color=Colors.TERTIARY_TEXT,
            )
            diff_label.pack(side="right", padx=Spacing.XL, pady=Spacing.LG)

        # ---- Start Button ----
        self.start_btn = ctk.CTkButton(
            self,
            text="Start Lab Session  →",
            font=Typography.SECTION_TITLE,
            height=Spacing.XXXL,
            corner_radius=BorderRadius.LARGE,
            fg_color=Colors.BUTTON_PRIMARY_BG,
            hover_color=get_hover_color(Colors.BUTTON_PRIMARY_BG, lighten=False),
            text_color=Colors.BUTTON_PRIMARY_TEXT,
            command=self._start,
        )
        self.start_btn.pack(pady=Spacing.XXXL, padx=Spacing.XXXL)

        # ---- Footer ----
        footer = ctk.CTkLabel(
            self,
            text="Powered by Groq AI  •  Piper TTS  •  OpenCV",
            font=ctk.CTkFont(size=11),
            text_color="#4B5563",
        )
        footer.pack(side="bottom", pady=10)

    def _start(self):
        exp_file = self.experiment_var.get()
        self._on_experiment_selected(exp_file)
