"""
SENSEBRIDGE UI DESIGN SYSTEM
Professional Minimal Monochrome Theme (Black + White Only)

Centralized design tokens for consistent, premium UI styling.
Reference: ChatGPT Desktop, Notion Dark Mode, Apple Pro Apps, Tesla UI

Usage:
    from ui.design_system import Colors, Typography, Spacing, Animations
    
    # Use constants throughout the app
    frame.configure(fg_color=Colors.PRIMARY_BG)
    label.configure(text_color=Colors.PRIMARY_TEXT, font=Typography.TITLE)
"""

import customtkinter as ctk


# =====================================================
# 1. COLOR SYSTEM
# =====================================================

class Colors:
    """Monochrome color palette."""
    
    # Primary Background - Main window and app body
    PRIMARY_BG = "#000000"
    
    # Secondary Background - Cards, panels, chat sections
    SECONDARY_BG = "#111111"
    
    # Tertiary Background - Hover states, buttons, input boxes
    TERTIARY_BG = "#1A1A1A"
    
    # Quaternary Background - Slightly lighter for distinction
    QUATERNARY_BG = "#1F1F1F"
    
    # Primary Text - Headings, important labels, main content
    PRIMARY_TEXT = "#FFFFFF"
    
    # Secondary Text - Descriptions, hints, metadata
    SECONDARY_TEXT = "#B3B3B3"
    
    # Tertiary Text - Subtle text
    TERTIARY_TEXT = "#8A8A8A"
    
    # Border Color - Dividers, panel outlines, input borders
    BORDER = "#2A2A2A"
    
    # Active Glow - Listening, speaking, active indicators
    ACTIVE_GLOW = "#FFFFFF"
    
    # Top Navigation Background
    TOP_NAV_BG = "#0A0A0A"
    TOP_NAV_BORDER = "#1F1F1F"
    
    # Left Sidebar Background
    LEFT_SIDEBAR_BG = "#0D0D0D"
    
    # Right Panel Background
    RIGHT_PANEL_BG = "#0E0E0E"
    
    # Step item colors
    STEP_NORMAL_BG = "transparent"
    STEP_NORMAL_TEXT = "#B0B0B0"
    STEP_ACTIVE_BG = "#1A1A1A"
    STEP_ACTIVE_TEXT = "#FFFFFF"
    STEP_ACTIVE_BORDER = "#FFFFFF"
    STEP_HOVER_BG = "#141414"
    
    # Chat colors
    CHAT_USER_BG = "#1C1C1C"
    CHAT_USER_TEXT = "#FFFFFF"
    CHAT_AI_BG = "#111111"
    CHAT_AI_TEXT = "#EAEAEA"
    CHAT_AI_BORDER = "#222222"
    
    # Button colors
    BUTTON_PRIMARY_BG = "#FFFFFF"
    BUTTON_PRIMARY_TEXT = "#000000"
    BUTTON_SECONDARY_BG = "#161616"
    BUTTON_SECONDARY_TEXT = "#FFFFFF"
    BUTTON_SECONDARY_BORDER = "#2A2A2A"
    BUTTON_HOVER_BG = "#1E1E1E"
    BUTTON_ICON_BG = "#111111"
    BUTTON_ICON_BORDER = "#2A2A2A"
    
    # Input field colors
    INPUT_BG = "#121212"
    INPUT_TEXT = "#FFFFFF"
    INPUT_PLACEHOLDER = "#777777"
    INPUT_BORDER = "#2A2A2A"
    INPUT_BORDER_FOCUS = "#FFFFFF"
    
    # Mic button colors
    MIC_IDLE_BG = "#121212"
    MIC_IDLE_BORDER = "#2C2C2C"
    MIC_LISTENING_GLOW = "#FFFFFF"
    MIC_PROCESSING_GLOW = "#B0B0B0"
    MIC_SPEAKING_GLOW = "#FFFFFF"
    
    # Status indicators
    STATUS_ERROR_FG = "#FFFFFF"


# =====================================================
# 2. TYPOGRAPHY SYSTEM
# =====================================================

class Typography:
    """Typography specifications with customtkinter fonts."""
    
    # Font families (in order of preference)
    FONT_PRIMARY = "Inter"
    FONT_SECONDARY = "Segoe UI"
    FONT_FALLBACK = "Arial"
    
    # Create font objects using tuples to avoid root window init issues
    TITLE = (FONT_SECONDARY, 28, "bold")
    
    SECTION_TITLE = (FONT_SECONDARY, 18, "bold")
    
    SUBTITLE = (FONT_SECONDARY, 16, "bold")
    
    BODY = (FONT_SECONDARY, 14, "normal")
    
    BODY_SMALL = (FONT_SECONDARY, 13, "normal")
    
    SMALL = (FONT_SECONDARY, 12, "normal")
    
    EXTRA_SMALL = (FONT_SECONDARY, 11, "normal")
    
    # Bold variants
    BODY_BOLD = (FONT_SECONDARY, 14, "bold")
    
    SMALL_BOLD = (FONT_SECONDARY, 12, "bold")


# =====================================================
# 3. SPACING SYSTEM
# =====================================================

class Spacing:
    """Consistent spacing measurements."""
    
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
    """Consistent corner radius values."""
    
    SMALL = 8
    MEDIUM = 12
    LARGE = 18
    EXTRA_LARGE = 24
    FULL = 40  # For circular elements


# =====================================================
# 5. DIMENSIONS
# =====================================================

class Dimensions:
    """Standard component dimensions."""
    
    # Top navigation
    TOP_NAV_HEIGHT = 70
    
    # Sidebars
    LEFT_SIDEBAR_WIDTH = 260
    RIGHT_PANEL_WIDTH = 320
    
    # Buttons
    BUTTON_HEIGHT_SM = 32
    BUTTON_HEIGHT_MD = 40
    BUTTON_HEIGHT_LG = 48
    
    # Mic button
    MIC_BUTTON_SIZE = 72
    
    # Card/Panel padding
    CARD_PADDING = 20


# =====================================================
# 6. ANIMATION SETTINGS
# =====================================================

class Animations:
    """Animation constants for smooth, premium transitions."""
    
    # Animation durations (in milliseconds)
    FADE_DURATION = 300
    SLIDE_DURATION = 400
    PULSE_DURATION = 1500
    HOVER_DURATION = 150
    
    # Easing curves (simple linear approximations)
    EASING_SMOOTH = "ease-in-out"
    
    # Opacity values
    HOVER_OPACITY = 0.85
    DISABLED_OPACITY = 0.5
    
    # Scale factors
    HOVER_SCALE = 1.02
    ACTIVE_SCALE = 0.98


# =====================================================
# 7. SHADOWS
# =====================================================

class Shadows:
    """Shadow effects for depth."""
    
    # Very subtle shadows for premium feel
    SUBTLE = (0, 2, 8, "rgba(0, 0, 0, 0.15)")
    MEDIUM = (0, 4, 12, "rgba(0, 0, 0, 0.2)")
    LARGE = (0, 8, 24, "rgba(0, 0, 0, 0.25)")


# =====================================================
# 8. DESIGN HELPER FUNCTIONS
# =====================================================

def get_hover_color(base_color: str, lighten=True) -> str:
    """
    Generate a hover state color from a base hex color.
    
    Args:
        base_color: Hex color code (e.g., "#1A1A1A")
        lighten: If True, lighten; if False, darken
    
    Returns:
        Adjusted hex color code
    """
    # Convert hex to RGB
    hex_color = base_color.lstrip('#')
    r, g, b = tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))
    
    # Adjust brightness
    adjustment = 20 if lighten else -20
    r = max(0, min(255, r + adjustment))
    g = max(0, min(255, g + adjustment))
    b = max(0, min(255, b + adjustment))
    
    # Convert back to hex
    return f"#{r:02x}{g:02x}{b:02x}"


def get_transparency_color(base_color: str, alpha: float) -> str:
    """
    Add transparency to a hex color (works in some contexts).
    
    Args:
        base_color: Hex color code
        alpha: Transparency 0.0-1.0
    
    Returns:
        RGBA color string
    """
    hex_color = base_color.lstrip('#')
    r, g, b = tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))
    return f"rgba({r}, {g}, {b}, {alpha})"


# =====================================================
# 9. THEME CONFIGURATION
# =====================================================

class ThemeConfig:
    """Centralized theme configuration for the app."""
    
    @staticmethod
    def apply_to_app(app):
        """Apply theme settings to the main CTk app."""
        ctk.set_appearance_mode("Dark")
        # Use a custom theme (or "blue", "green", "dark-blue")
        # We'll override colors manually through the design system
        ctk.set_default_color_theme("dark-blue")
        
        # Set main window background
        app.configure(fg_color=Colors.PRIMARY_BG)
    
    @staticmethod
    def get_button_style(button_type="secondary"):
        """Get standardized button styling."""
        if button_type == "primary":
            return {
                "fg_color": Colors.BUTTON_PRIMARY_BG,
                "text_color": Colors.BUTTON_PRIMARY_TEXT,
                "corner_radius": BorderRadius.MEDIUM,
                "hover_color": get_hover_color(Colors.BUTTON_PRIMARY_BG, lighten=False),
            }
        else:  # secondary
            return {
                "fg_color": Colors.BUTTON_SECONDARY_BG,
                "text_color": Colors.BUTTON_SECONDARY_TEXT,
                "border_color": Colors.BUTTON_SECONDARY_BORDER,
                "border_width": 1,
                "corner_radius": BorderRadius.MEDIUM,
                "hover_color": Colors.BUTTON_HOVER_BG,
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
    
    @staticmethod
    def get_card_style():
        """Get standardized card styling."""
        return {
            "fg_color": Colors.SECONDARY_BG,
            "border_color": Colors.QUATERNARY_BG,
            "border_width": 1,
            "corner_radius": BorderRadius.LARGE,
        }


# =====================================================
# 10. EXPORT ALL DESIGN TOKENS
# =====================================================

__all__ = [
    "Colors",
    "Typography",
    "Spacing",
    "BorderRadius",
    "Dimensions",
    "Animations",
    "Shadows",
    "ThemeConfig",
    "get_hover_color",
    "get_transparency_color",
]
