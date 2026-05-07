"""
StartScreen — Experiment Selection Dashboard.

Ultra-minimal centered dashboard for experiment selection.
Pure white background with black elements only.
"""

import customtkinter as ctk
from ui.design_system import Colors, Typography, Spacing, BorderRadius, ThemeConfig


class StartScreen(ctk.CTkFrame):
    """Centered experiment selection dashboard."""

    def __init__(self, parent, on_experiment_selected, **kwargs):
        super().__init__(parent, **kwargs)
        self.configure(fg_color=Colors.PRIMARY_BG)
        self._on_experiment_selected = on_experiment_selected

        # Main container - centered layout
        main_container = ctk.CTkFrame(self, fg_color="transparent")
        main_container.pack(expand=True, fill="both")

        # ---- Header Section ----
        header_frame = ctk.CTkFrame(main_container, fg_color="transparent")
        header_frame.pack(pady=(Spacing.XXXL, Spacing.XL))

        # Logo / Title - Large and centered
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
            font=Typography.SUBTITLE,
            text_color=Colors.SECONDARY_TEXT,
        )
        subtitle.pack(pady=(Spacing.SM, 0))

        # ---- Experiment Selection Grid ----
        select_label = ctk.CTkLabel(
            main_container,
            text="Select an Experiment",
            font=Typography.SECTION_TITLE,
            text_color=Colors.PRIMARY_TEXT,
        )
        select_label.pack(pady=(Spacing.XXL, Spacing.LG))

        # Grid container for experiment cards
        grid_frame = ctk.CTkFrame(main_container, fg_color="transparent")
        grid_frame.pack(pady=Spacing.XL)

        self.experiment_var = ctk.StringVar(value="nacl_exp.json")

        experiments = [
            ("⚗️  Synthesis of Copper Sulfate", "copper_sulfate_exp.json", "Medium • ~30 min"),
            ("🧂  Synthesis of NaCl (Salt)", "nacl_exp.json", "Easy • ~15 min"),
            ("📷  Camera Verification Test", "test_exp.txt", "Easy • ~5 min"),
            ("🔬  Estimation of Copper from E-waste", "exp.txt", "Medium • ~45 min"),
        ]

        # Create 2x2 grid of experiment cards
        for i, (exp_name, exp_file, difficulty) in enumerate(experiments):
            row = i // 2
            col = i % 2

            # Experiment card - large and outlined
            exp_card = ctk.CTkFrame(
                grid_frame,
                **ThemeConfig.get_experiment_card_style(),
                width=280,
                height=120,
            )
            exp_card.grid(row=row, column=col, padx=Spacing.LG, pady=Spacing.LG)
            exp_card.pack_propagate(False)  # Maintain fixed size

            # Radio button inside card
            radio = ctk.CTkRadioButton(
                exp_card,
                text="",
                variable=self.experiment_var,
                value=exp_file,
                radiobutton_width=24,
                radiobutton_height=24,
                border_width_unchecked=2,
                border_width_checked=2,
                fg_color=Colors.ACTIVE_GLOW,
                command=lambda f=exp_file: self._on_experiment_selected(f),
            )
            radio.pack(anchor="nw", padx=Spacing.LG, pady=Spacing.LG)

            # Experiment name
            name_label = ctk.CTkLabel(
                exp_card,
                text=exp_name,
                font=Typography.BODY_BOLD,
                text_color=Colors.PRIMARY_TEXT,
                wraplength=220,
                justify="left",
            )
            name_label.pack(anchor="w", padx=Spacing.LG, pady=(Spacing.SM, 0))

            # Difficulty and duration
            diff_label = ctk.CTkLabel(
                exp_card,
                text=difficulty,
                font=Typography.SMALL,
                text_color=Colors.TERTIARY_TEXT,
            )
            diff_label.pack(anchor="sw", padx=Spacing.LG, pady=Spacing.LG)

        # ---- Start Button ----
        self.start_btn = ctk.CTkButton(
            main_container,
            text="Start Lab Session",
            font=Typography.SECTION_TITLE,
            height=Spacing.XXXL,
            **ThemeConfig.get_button_style("primary"),
            command=self._start,
        )
        self.start_btn.pack(pady=(Spacing.XXL, Spacing.XXXL), padx=Spacing.XXXL)

        # ---- Footer ----
        footer = ctk.CTkLabel(
            main_container,
            text="Powered by Groq AI • Piper TTS • OpenCV",
            font=Typography.EXTRA_SMALL,
            text_color=Colors.TERTIARY_TEXT,
        )
        footer.pack(side="bottom", pady=Spacing.XL)

    def _start(self):
        exp_file = self.experiment_var.get()
        self._on_experiment_selected(exp_file)
