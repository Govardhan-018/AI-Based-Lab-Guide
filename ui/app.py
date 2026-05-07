"""
SenseBridge AI Lab — Main Application Controller

Manages screen switching, shared state initialization, and
coordination between all screens and core services.

Entry point: python -m ui.app  OR  python run.py
"""

import os
import sys

# Fix HuggingFace Symlink issue on Windows without Developer Mode
os.environ["HF_HUB_DISABLE_SYMLINKS_WARNING"] = "1"
os.environ["HF_HUB_DISABLE_SYMLINKS"] = "1"

import threading
import customtkinter as ctk

from dotenv import load_dotenv
load_dotenv()

from core.session_manager import SessionManager
from core.conversation_manager import ConversationManager
from core.voice_state_manager import VoiceStateManager, VoiceState
from core.ai_engine import AIEngine
from core.audio_pipeline import AudioPipeline
from cv.cv_monitor import CVMonitor
from experiments.experiment_manager import ExperimentManager

from ui.design_system import Colors, Typography, Spacing, Dimensions, ThemeConfig
from ui.start_screen import StartScreen
from ui.overview_screen import OverviewScreen
from ui.experiment_screen import ExperimentScreen
from ui.assistant_screen import AssistantScreen

# ==========================================
# CONFIGURATION
# ==========================================
GROQ_API_KEY = os.environ.get("GROQ_API_KEY")

if not GROQ_API_KEY:
    print("WARNING: GROQ_API_KEY is not set. AI features will be disabled.")

# Apply Premium Monochrome Theme
ctk.set_appearance_mode("Dark")
ctk.set_default_color_theme("dark-blue")


class SenseBridgeApp(ctk.CTk):
    """Main application controller — manages all screens and shared state."""

    def __init__(self):
        super().__init__()

        self.title("SenseBridge AI Lab Assistant")
        self.geometry("1100x750")
        self.minsize(900, 650)
        self.protocol("WM_DELETE_WINDOW", self.on_closing)

        # Set premium monochrome background
        self.configure(fg_color=Colors.PRIMARY_BG)

        # ---- Shared State ----
        self.session = SessionManager()
        self.vsm = VoiceStateManager()

        # ---- Core Services (initialized lazily) ----
        self.groq_client = None
        self.ai_engine = None
        self.audio_pipeline = None
        self._core_init_running = False
        self._active_loading_widget = None

        # ---- Screens ----
        self._current_screen = None
        self._screens = {}

        # Create screens
        self._create_screens()

        # Show start screen
        self.show_screen("start")

    def _create_screens(self):
        """Create all screen frames (they persist throughout app lifetime)."""

        # Start Screen
        self._screens["start"] = StartScreen(
            self,
            on_experiment_selected=self._on_experiment_selected,
        )

        # Overview Screen
        self._screens["overview"] = OverviewScreen(
            self,
            on_start_experiment=self._on_start_experiment,
            on_back=self._on_back_to_start,
            on_speak=self._on_overview_speak,
        )

        # Experiment and Assistant screens are created after core init

    def show_screen(self, name: str):
        """Switch to the specified screen using pack/forget (preserves state)."""
        # STOP all speech when switching screens as per user request
        if self.audio_pipeline:
            self.audio_pipeline.stop_speaking()

        # Hide current screen
        if self._current_screen and self._current_screen in self._screens:
            screen = self._screens[self._current_screen]
            screen.pack_forget()

            # Notify screen it's leaving
            if hasattr(screen, 'on_screen_leave'):
                screen.on_screen_leave()

        # Show new screen
        if name in self._screens:
            screen = self._screens[name]
            screen.pack(expand=True, fill="both")
            self._current_screen = name

            # Notify screen it's entering
            if hasattr(screen, 'on_screen_enter'):
                screen.on_screen_enter()

    # ================================================================
    # NAVIGATION HANDLERS
    # ================================================================

    def _on_back_to_start(self):
        """Navigate back to the main experiment selection screen."""
        self.show_screen("start")

    def _on_back_to_overview(self):
        """Navigate back to the experiment overview screen."""
        self.show_screen("overview")

    def _on_pause_experiment(self):
        """Handle experiment pause."""
        print("[App] Experiment paused.")
        if self.session.cv_monitor:
            self.session.cv_monitor.stop() # Stop camera and processing
        if self.audio_pipeline:
            self.audio_pipeline.stop_speaking()
        self.session.paused = True

    def _on_resume_experiment(self):
        """Handle experiment resume."""
        print("[App] Experiment resumed.")
        self.session.paused = False
        if self.session.cv_monitor:
            self.session.cv_monitor.start(callback=self._on_step_complete_cv)
        
        # Optionally repeat current instruction
        exp_mgr = self.session.experiment_manager
        if exp_mgr and self.audio_pipeline:
            instruction = exp_mgr.get_instruction()
            self.audio_pipeline.speak(f"Resuming. Your current task is: {instruction}")

    # ================================================================
    # SCREEN FLOW
    # ================================================================

    def _on_experiment_selected(self, exp_file: str):
        """Callback: experiment selected on start screen."""
        print(f"[App] Experiment selected: {exp_file}")
        self.session.set_experiment(exp_file)

        # Load overview
        self._screens["overview"].load_experiment(exp_file)
        self.show_screen("overview")

        # PROACTIVE: Start core initialization immediately so the Audio Pipeline
        # is ready for the "Explain Experiment" button on the Overview screen.
        if not self._core_init_running and not self.session.core_initialized:
            self._core_init_running = True
            threading.Thread(target=self._initialize_core, args=(exp_file,), daemon=True).start()

    def _on_start_experiment(self, exp_file: str):
        """Callback: start button pressed on overview screen."""
        print(f"[App] Starting experiment: {exp_file}")

        # If core is already initialized, go straight to the experiment
        if self.session.core_initialized:
            self._on_core_ready(None)
            return

        # If not ready, show loading state and the background thread will call _on_core_ready
        self.show_screen("overview")  # Keep overview visible
        self._active_loading_widget = ctk.CTkLabel(
            self,
            text="⚡ Initializing AI Core & Camera...\nPlease wait",
            font=ctk.CTkFont(size=22, weight="bold"),
            text_color=Colors.PRIMARY_TEXT,
        )
        self._screens["overview"].pack_forget()
        self._active_loading_widget.pack(expand=True)
        self.update()

        # If core init wasn't even started yet (unlikely), start it now
        if not self._core_init_running:
            self._core_init_running = True
            threading.Thread(target=self._initialize_core, args=(exp_file,), daemon=True).start()

    def _initialize_core(self, exp_file: str):
        """Initialize all heavy services (runs in background thread)."""
        print("[App] Initializing core services...")

        # 1. Experiment Manager
        self.session.experiment_manager = ExperimentManager(exp_file)

        # 2. CV Monitor
        self.session.cv_monitor = CVMonitor(camera_index=0)

        # 3. Groq Client
        if GROQ_API_KEY:
            from groq import Groq
            self.groq_client = Groq(api_key=GROQ_API_KEY)

        # 4. Audio Pipeline
        self.audio_pipeline = AudioPipeline(self.vsm, self.groq_client)

        self.ai_engine = AIEngine(self.groq_client, self.session)

        self.session.core_initialized = True
        self._core_init_running = False
        print("[App] Core services initialized.")

        # If the user is waiting on the loading screen, transition now
        if self._active_loading_widget:
            widget = self._active_loading_widget
            self._active_loading_widget = None
            self.after(0, lambda: self._on_core_ready(widget))

    def _on_core_ready(self, loading_widget):
        """Called on main thread after core initialization completes."""
        if loading_widget:
            loading_widget.pack_forget()
            loading_widget.destroy()

        # Create experiment and assistant screens now that core is ready
        self._screens["experiment"] = ExperimentScreen(
            self,
            session_manager=self.session,
            on_back=self._on_back_to_overview,
            on_pause=self._on_pause_experiment,
            on_resume=self._on_resume_experiment,
            on_open_assistant=self._open_assistant,
        )

        self._screens["assistant"] = AssistantScreen(
            self,
            session_manager=self.session,
            ai_engine=self.ai_engine,
            audio_pipeline=self.audio_pipeline,
            on_back=self._close_assistant,
            on_reset_experiment=self._on_experiment_reset,
        )

        # Register voice state observer for assistant screen
        self.vsm.on_state_change(self._on_voice_state_change)

        # Show experiment screen
        self.show_screen("experiment")

        # Start CV monitoring
        self.session.cv_monitor.start(callback=self._on_step_complete_cv)

        # Start camera feed
        self._screens["experiment"].start_video_feed()

        # Load first step
        self._advance_step(first_run=True)

    # ================================================================
    # EXPERIMENT PROGRESSION
    # ================================================================

    def _advance_step(self, first_run=False):
        """Advance to the next experiment step."""
        exp_mgr = self.session.experiment_manager
        if not exp_mgr:
            return

        if not first_run:
            # Speak completion
            if self.audio_pipeline:
                self.audio_pipeline.speak("Excellent! The camera confirms you've completed that step correctly.")
            exp_mgr.advance_step()

        if exp_mgr.is_complete():
            self._screens["experiment"].update_instruction("🎉 Experiment Complete! Great job.")
            self._screens["experiment"].update_progress(
                exp_mgr.get_progress()[0], exp_mgr.get_progress()[1]
            )
            if self.audio_pipeline:
                self.audio_pipeline.speak("Congratulations! You have completed the entire experiment.")
            self.session.cv_monitor.stop()
            return

        # Update UI
        instruction = exp_mgr.get_instruction()
        current, total = exp_mgr.get_progress()
        self._screens["experiment"].update_instruction(instruction)
        self._screens["experiment"].update_progress(current, total)

        # Speak instruction
        if self.audio_pipeline:
            self.audio_pipeline.speak(f"Step {current}: {instruction}")

        # Update CV target
        target_id, target_color = exp_mgr.get_cv_target()
        self.session.cv_monitor.set_target(target_id, target_color)

    def _on_step_complete_cv(self):
        """Callback fired by CVMonitor when step validation succeeds."""
        self.after(0, self._advance_step)

    def _on_overview_speak(self, text: str):
        """Callback: speak text from overview screen."""
        if self.audio_pipeline:
            self.audio_pipeline.speak(text)
        else:
            print(f"[App] Audio not ready. Would speak: {text}")

    def _on_experiment_reset(self):
        """Callback: reset experiment to step 1."""
        exp_mgr = self.session.experiment_manager
        if not exp_mgr:
            return

        print("[App] Restarting experiment from Step 1...")
        exp_mgr.reset_progress()
        
        # Reload UI with first step
        self._advance_step(first_run=True)
        
        # Force refresh of assistant context panel
        if "assistant" in self._screens:
            self.after(0, self._screens["assistant"]._update_context_panel)

    # ================================================================
    # ASSISTANT SCREEN NAVIGATION
    # ================================================================

    def _open_assistant(self):
        """Open the AI assistant screen."""
        self.session.open_assistant()
        self._screens["experiment"].stop_video_feed()
        self.show_screen("assistant")

    def _close_assistant(self):
        """Close assistant and return to experiment screen."""
        self.session.close_assistant()
        self.show_screen("experiment")
        self._screens["experiment"].start_video_feed()

        # Refresh experiment screen with current state
        exp_mgr = self.session.experiment_manager
        if exp_mgr and not exp_mgr.is_complete():
            current, total = exp_mgr.get_progress()
            self._screens["experiment"].update_instruction(exp_mgr.get_instruction())
            self._screens["experiment"].update_progress(current, total)

    # ================================================================
    # VOICE STATE OBSERVER
    # ================================================================

    def _on_voice_state_change(self, old_state: VoiceState, new_state: VoiceState):
        """React to voice state changes (update assistant UI)."""
        if "assistant" in self._screens:
            self.after(0, lambda: self._screens["assistant"].voice_button.set_state(new_state))

    # ================================================================
    # CLEANUP
    # ================================================================

    def on_closing(self):
        """Clean shutdown of all services."""
        print("[App] Closing application...")

        # Stop video feed if running
        if "experiment" in self._screens:
            self._screens["experiment"].stop_video_feed()

        # Stop CV
        if self.session.cv_monitor:
            self.session.cv_monitor.stop()

        # Stop audio
        if self.audio_pipeline:
            self.audio_pipeline.shutdown()

        self.destroy()


def main():
    app = SenseBridgeApp()
    app.mainloop()


if __name__ == "__main__":
    main()
