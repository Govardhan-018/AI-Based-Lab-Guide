"""
ExperimentManager — Manages experiment data, step progression, and context.

Enhanced with progress tracking and full context export for richer AI prompts.
"""

import json
import os


class ExperimentManager:
    def __init__(self, exp_file="exp.txt"):
        self.exp_data = None
        self.current_step_index = 0
        self.steps = []
        self.exp_file = exp_file

        # Try loading from experiments/ directory first, then root
        paths_to_try = [
            exp_file,
            os.path.join("experiments", exp_file),
            os.path.join(os.path.dirname(__file__), exp_file),
        ]

        for path in paths_to_try:
            if os.path.exists(path):
                try:
                    with open(path, "r", encoding="utf-8") as f:
                        self.exp_data = json.load(f)
                        self.steps = self.exp_data.get("steps", [])
                    print(f"[ExperimentManager] Loaded: {path}")
                    break
                except Exception as e:
                    print(f"[ExperimentManager] Error loading {path}: {e}")

        if not self.exp_data:
            print(f"[ExperimentManager] WARNING: Could not load {exp_file}")

    def is_complete(self):
        return self.current_step_index >= len(self.steps)

    def get_current_step(self):
        if self.is_complete():
            return None
        return self.steps[self.current_step_index]

    def get_instruction(self):
        step = self.get_current_step()
        if step:
            return step.get("instruction", "")
        return "Experiment complete."

    def advance_step(self):
        if not self.is_complete():
            self.current_step_index += 1
            return True
        return False

    def reset_progress(self):
        """Resets the experiment to the first step."""
        self.current_step_index = 0

    def get_progress(self):
        """Returns (current_step_number, total_steps) for progress display."""
        return (self.current_step_index + 1, len(self.steps))

    def get_cv_target(self):
        """
        Returns a tuple of (target_id, target_color) based on the current step.
        """
        step = self.get_current_step()
        if not step:
            return None, None

        # Default ID to the step number (1-indexed)
        target_id = str(self.current_step_index + 1)

        # Try to extract target color from validation rules or expected events
        target_color = None

        # 1. Check expected events
        events = step.get("expected_events", [])
        for event in events:
            if event.get("event") == "color_change":
                target_color = event.get("constraints", {}).get("target_color")
                if "target_id" in event.get("constraints", {}):
                    target_id = str(event["constraints"]["target_id"])
                break

        # 2. If not found, check validation rules
        if not target_color:
            validation = step.get("validation", {})
            if validation.get("method") == "color":
                rules = validation.get("rules", {})
                target_color = rules.get("color_match")

                # Cleanup common mismatches between rules and cv_monitor definitions
                if target_color == "pale_blue_precipitate":
                    target_color = "pale_blue"
                elif target_color == "pale_yellow_or_cream":
                    target_color = "pale_yellow"

        return target_id, target_color

    def get_llm_context(self):
        """Returns the context of the current step for the LLM."""
        step = self.get_current_step()
        if not step:
            return "The experiment is over."

        return json.dumps({
            "current_step_id": step.get("id"),
            "instruction": step.get("instruction"),
            "hints": step.get("hints", []),
            "common_errors": step.get("common_errors", [])
        })

    def get_full_context(self):
        """Returns complete experiment context for rich AI prompts."""
        if not self.exp_data:
            return {}

        return {
            "title": self.exp_data.get("title", "Unknown"),
            "experiment_id": self.exp_data.get("experiment_id", ""),
            "materials": self.exp_data.get("materials", []),
            "safety": self.exp_data.get("safety", []),
            "total_steps": len(self.steps),
            "current_step": self.current_step_index,
            "current_instruction": self.get_instruction(),
            "current_step_data": self.get_current_step(),
        }
