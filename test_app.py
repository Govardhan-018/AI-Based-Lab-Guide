import os
import sys

# Mock CTk to avoid requiring a display in CI-like test
import customtkinter as ctk

from core.session_manager import SessionManager
from core.conversation_manager import ConversationManager
from core.voice_state_manager import VoiceStateManager, VoiceState
from core.ai_engine import AIEngine
from core.audio_pipeline import AudioPipeline
from experiments.experiment_manager import ExperimentManager

from ui.app import SenseBridgeApp

def test_initialization():
    print("Initializing App...")
    app = SenseBridgeApp()
    print("App created successfully.")
    
    # Test screen switching
    print("Testing screen switches...")
    app.show_screen("start")
    print("Start screen shown.")
    
    app._on_experiment_selected("nacl_exp.json")
    print("Experiment selected -> Overview screen shown.")
    
    # Manually trigger the core init to avoid thread complexity in simple test
    print("Initializing core...")
    app._initialize_core("nacl_exp.json")
    
    # Mock the loading widget
    mock_loading = ctk.CTkLabel(app, text="Loading")
    app._on_core_ready(mock_loading)
    print("Core initialized. Experiment screen shown.")
    
    # Open assistant
    app._open_assistant()
    print("Assistant opened.")
    
    # Back to experiment
    app._close_assistant()
    print("Assistant closed.")
    
    print("ALL UI TESTS PASSED.")

if __name__ == "__main__":
    test_initialization()
