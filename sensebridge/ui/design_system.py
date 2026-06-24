"""
SENSEBRIDGE UI DESIGN SYSTEM
Professional Minimal Monochrome Theme (White + Black Only)

Centralized design tokens for consistent, premium UI styling.
Reference: Apple Minimalism, Linear, Notion, Modern AI OS
"""

import customtkinter as ctk


# =====================================================
# 1. COLOR SYSTEM
# =====================================================

class Colors:
    """Pure Monochrome White & Black color palette."""
    
    # Primary Background - Pure White
    PRIMARY_BG = "#FFFFFF"
    
    # Secondary Background
    SECONDARY_BG = "#FFFFFF" 
    
    # Tertiary Background
    TERTIARY_BG = "#F9F9F9"
    
    # Quaternary Background
    QUATERNARY_BG = "#F0F0F0"
    
    # Primary Text - Pure Black
    PRIMARY_TEXT = "#000000"
    
    # Secondary Text - 60% Black
    SECONDARY_TEXT = "#666666" 
    
    # Tertiary Text - 40% Black
    TERTIARY_TEXT = "#999999"
    
    # Border Color - Thin Black
    BORDER = "#000000"
    
    # Top Navigation
    TOP_NAV_BG = "#FFFFFF"
    TOP_NAV_BORDER = "#000000"
    
    # Step item colors
    STEP_NORMAL_BG = "transparent"
    STEP_NORMAL_TEXT = "#666666"
    STEP_ACTIVE_BG = "#000000"
    STEP_ACTIVE_TEXT = "#FFFFFF"
    STEP_ACTIVE_BORDER = "#000000"
    STEP_HOVER_BG = "#F0F0F0"
    
    # Chat colors
    CHAT_USER_BG = "#FFFFFF"
    CHAT_USER_TEXT = "#000000"
    CHAT_USER_BORDER = "#000000"
    
    CHAT_AI_BG = "#000000"
    CHAT_AI_TEXT = "#FFFFFF"
    CHAT_AI_BORDER = "#000000"
    
    # Button colors
    BUTTON_PRIMARY_BG = "#000000"
    BUTTON_PRIMARY_TEXT = "#FFFFFF"
    BUTTON_SECONDARY_BG = "#FFFFFF"
    BUTTON_SECONDARY_TEXT = "#000000"
    BUTTON_SECONDARY_BORDER = "#000000"
    
    # Input field
    INPUT_BG = "#FFFFFF"
    INPUT_TEXT = "#000000"
    INPUT_PLACEHOLDER = "#999999"
    INPUT_BORDER = "#000000"
    
    # Active/Pulse effect
    ACTIVE_GLOW = "#000000"


# =====================================================
# 2. TYPOGRAPHY SYSTEM
# =====================================================

class Typography:
    """Typography specifications with bold, geometric sans-serif."""
    
    FONT_PRIMARY = "Inter"
    FONT_SECONDARY = "Segoe UI"
    
    TITLE = (FONT_SECONDARY, 32, "bold")
    SECTION_TITLE = (FONT_SECONDARY, 20, "bold")
    SUBTITLE = (FONT_SECONDARY, 16, "bold")
    BODY = (FONT_SECONDARY, 14, "normal")
    BODY_BOLD = (FONT_SECONDARY, 14, "bold")
    BODY_SMALL = (FONT_SECONDARY, 13, "normal")
    SMALL = (FONT_SECONDARY, 12, "normal")
    SMALL_BOLD = (FONT_SECONDARY, 12, "bold")
    EXTRA_SMALL = (FONT_SECONDARY, 11, "normal")


# =====================================================
# 3. SPACING SYSTEM
# =====================================================

class Spacing:
    """Consistent symmetrical spacing."""
    
    XS = 4
    SM = 8
    MD = 12
    LG = 16
    XL = 24
    XXL = 32
    XXXL = 48


# =====================================================
# 4. CORNER RADIUS
# =====================================================

class BorderRadius:
    """Consistent rounded corners (16px–24px)."""
    
    SMALL = 12
    MEDIUM = 16
    LARGE = 18
    EXTRA_LARGE = 24
    BUTTON = 20
    FULL = 100


# =====================================================
# 5. DIMENSIONS
# =====================================================

class Dimensions:
    """Standard component dimensions."""
    
    TOP_NAV_HEIGHT = 70
    LEFT_SIDEBAR_WIDTH = 260
    RIGHT_PANEL_WIDTH = 320
    
    BUTTON_HEIGHT_SM = 32
    BUTTON_HEIGHT_MD = 40
    BUTTON_HEIGHT_LG = 48
    
    MIC_BUTTON_SIZE = 72
    CARD_PADDING = 20


# =====================================================
# 6. ANIMATIONS
# =====================================================

class Animations:
    """Animation constants."""
    
    FADE_DURATION = 300
    HOVER_DURATION = 150
    PULSE_DURATION = 1500


# =====================================================
# 7. THEME CONFIGURATION
# =====================================================

class ThemeConfig:
    """Centralized theme configuration for the app."""
    
    @staticmethod
    def apply_to_app(app):
        """Apply light theme settings to the main CTk app."""
        ctk.set_appearance_mode("Light")
        app.configure(fg_color=Colors.PRIMARY_BG)
    
    @staticmethod
    def get_button_style(button_type="secondary"):
        """Get standardized button styling."""
        if button_type == "primary":
            return {
                "fg_color": Colors.BUTTON_PRIMARY_BG,
                "text_color": Colors.BUTTON_PRIMARY_TEXT,
                "corner_radius": BorderRadius.BUTTON,
                "hover_color": "#333333",
            }
        else:  # secondary
            return {
                "fg_color": Colors.BUTTON_SECONDARY_BG,
                "text_color": Colors.BUTTON_SECONDARY_TEXT,
                "border_color": Colors.BUTTON_SECONDARY_BORDER,
                "border_width": 1,
                "corner_radius": BorderRadius.BUTTON,
                "hover_color": "#EEEEEE",
            }
    
    @staticmethod
    def get_card_style():
        """Get standardized card styling."""
        return {
            "fg_color": Colors.SECONDARY_BG,
            "border_color": Colors.BORDER,
            "border_width": 1,
            "corner_radius": BorderRadius.LARGE,
        }

    @staticmethod
    def get_experiment_card_style():
        """Special style for experiment selection cards."""
        return {
            "fg_color": Colors.SECONDARY_BG,
            "border_color": Colors.BORDER,
            "border_width": 1,
            "corner_radius": BorderRadius.EXTRA_LARGE,
        }

    @staticmethod
    def get_input_style():
        """Get standardized input field styling."""
        return {
            "fg_color": Colors.INPUT_BG,
            "text_color": Colors.INPUT_TEXT,
            "border_color": Colors.INPUT_BORDER,
            "border_width": 1,
            "corner_radius": BorderRadius.MEDIUM,
            "placeholder_text_color": Colors.INPUT_PLACEHOLDER,
        }

def get_hover_color(base_color: str, lighten=True) -> str:
    if base_color == "transparent": return "#F0F0F0"
    return "#333333" if lighten else "#EEEEEE"

__all__ = ["Colors", "Typography", "Spacing", "BorderRadius", "Dimensions", "Animations", "ThemeConfig", "get_hover_color"]
