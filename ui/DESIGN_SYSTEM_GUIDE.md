# SenseBridge Design System - Quick Reference Guide

## How to Use the Design System

### 1. Import the Design System
```python
from ui.design_system import Colors, Typography, Spacing, BorderRadius, Dimensions, Animations, ThemeConfig
```

### 2. Apply Colors
```python
# Frame backgrounds
frame.configure(fg_color=Colors.PRIMARY_BG)        # #000000 - main background
frame.configure(fg_color=Colors.SECONDARY_BG)      # #111111 - cards, panels
frame.configure(fg_color=Colors.TERTIARY_BG)       # #1A1A1A - hover, buttons

# Text colors
label.configure(text_color=Colors.PRIMARY_TEXT)    # #FFFFFF - main text
label.configure(text_color=Colors.SECONDARY_TEXT)  # #B3B3B3 - descriptions
label.configure(text_color=Colors.TERTIARY_TEXT)   # #8A8A8A - subtle text

# Borders
frame.configure(border_color=Colors.BORDER)        # #2A2A2A

# Special states
frame.configure(fg_color=Colors.TOP_NAV_BG)       # #0A0A0A - top nav
frame.configure(fg_color=Colors.RIGHT_PANEL_BG)   # #0E0E0E - side panels
```

### 3. Apply Typography
```python
# Font objects - ready to use
label.configure(font=Typography.TITLE)              # 28px bold
label.configure(font=Typography.SECTION_TITLE)      # 18px bold
label.configure(font=Typography.SUBTITLE)           # 16px semibold
label.configure(font=Typography.BODY)               # 14px regular
label.configure(font=Typography.BODY_SMALL)         # 13px regular
label.configure(font=Typography.SMALL)              # 12px regular
label.configure(font=Typography.EXTRA_SMALL)        # 11px regular

# Bold variants
label.configure(font=Typography.BODY_BOLD)          # 14px bold
label.configure(font=Typography.SMALL_BOLD)         # 12px bold
```

### 4. Apply Spacing
```python
# Consistent spacing values (use instead of hardcoding pixels)
frame.pack(padx=Spacing.XS)      # 4px
frame.pack(padx=Spacing.SM)      # 8px
frame.pack(padx=Spacing.MD)      # 12px
frame.pack(padx=Spacing.LG)      # 16px
frame.pack(padx=Spacing.XL)      # 24px
frame.pack(padx=Spacing.XXL)     # 32px
frame.pack(padx=Spacing.XXXL)    # 48px
```

### 5. Apply Corner Radius
```python
# Border radius values
frame.configure(corner_radius=BorderRadius.SMALL)      # 8px
frame.configure(corner_radius=BorderRadius.MEDIUM)     # 12px
frame.configure(corner_radius=BorderRadius.LARGE)      # 18px
frame.configure(corner_radius=BorderRadius.EXTRA_LARGE) # 24px
frame.configure(corner_radius=BorderRadius.FULL)       # 40px (circular)
```

### 6. Apply Dimensions
```python
# Standard component sizes
top_bar.configure(height=Dimensions.TOP_NAV_HEIGHT)        # 70px
sidebar.configure(width=Dimensions.LEFT_SIDEBAR_WIDTH)     # 260px
panel.configure(width=Dimensions.RIGHT_PANEL_WIDTH)        # 320px

# Button heights
button.configure(height=Dimensions.BUTTON_HEIGHT_SM)       # 32px
button.configure(height=Dimensions.BUTTON_HEIGHT_MD)       # 40px
button.configure(height=Dimensions.BUTTON_HEIGHT_LG)       # 48px

# Mic button
button.configure(width=Dimensions.MIC_BUTTON_SIZE)         # 72px
button.configure(height=Dimensions.MIC_BUTTON_SIZE)        # 72px
```

### 7. Apply Button Styles
```python
# Get pre-configured button styles
primary_style = ThemeConfig.get_button_style("primary")   # White button
button.configure(**primary_style)

secondary_style = ThemeConfig.get_button_style("secondary") # Dark button
button.configure(**secondary_style)
```

### 8. Apply Input Field Style
```python
# Get pre-configured input styling
input_style = ThemeConfig.get_input_style()
text_input.configure(**input_style)
```

### 9. Apply Card Style
```python
# Get pre-configured card styling
card_style = ThemeConfig.get_card_style()
card_frame.configure(**card_style)
```

### 10. Use Helper Functions
```python
# Generate hover colors
hover_color = Colors.get_hover_color(Colors.BUTTON_PRIMARY_BG, lighten=False)
button.configure(hover_color=hover_color)

# Add transparency to colors
transparent_color = Colors.get_transparency_color(Colors.ACTIVE_GLOW, alpha=0.5)
```

## Complete Example: Creating a Premium Card

```python
import customtkinter as ctk
from ui.design_system import Colors, Typography, Spacing, BorderRadius

# Create a card
card = ctk.CTkFrame(
    parent,
    fg_color=Colors.SECONDARY_BG,           # Dark background
    border_color=Colors.BORDER,             # Subtle border
    border_width=1,
    corner_radius=BorderRadius.LARGE,       # 18px rounded
)
card.pack(padx=Spacing.XL, pady=Spacing.LG)

# Add title
title = ctk.CTkLabel(
    card,
    text="Card Title",
    font=Typography.SUBTITLE,               # 16px semibold
    text_color=Colors.PRIMARY_TEXT,         # White text
)
title.pack(padx=Spacing.LG, pady=(Spacing.LG, Spacing.MD))

# Add description
description = ctk.CTkLabel(
    card,
    text="This is a description",
    font=Typography.BODY_SMALL,             # 13px regular
    text_color=Colors.SECONDARY_TEXT,       # Gray text
)
description.pack(padx=Spacing.LG, pady=Spacing.SM)

# Add button
button = ctk.CTkButton(
    card,
    text="Action",
    font=Typography.BODY_BOLD,              # 14px bold
    corner_radius=BorderRadius.MEDIUM,      # 12px rounded
    **ThemeConfig.get_button_style("primary")
)
button.pack(padx=Spacing.LG, pady=(Spacing.MD, Spacing.LG))
```

## Color Palette Reference

### Backgrounds (Dark to Light)
```
#000000 - PRIMARY_BG (main app)
#0A0A0A - TOP_NAV_BG (navigation)
#0D0D0D - LEFT_SIDEBAR_BG
#0E0E0E - RIGHT_PANEL_BG
#111111 - SECONDARY_BG (cards)
#121212 - INPUT_BG
#141414 - STEP_HOVER_BG
#1A1A1A - TERTIARY_BG (buttons/hover)
#1C1C1C - CHAT_USER_BG
#1F1F1F - QUATERNARY_BG (borders)
#222222 - CHAT_AI_BORDER
#2A2A2A - BORDER (dividers)
```

### Text Colors
```
#FFFFFF - PRIMARY_TEXT (main text)
#EAEAEA - CHAT_AI_TEXT
#B3B3B3 - SECONDARY_TEXT (descriptions)
#8A8A8A - TERTIARY_TEXT (subtle)
#777777 - INPUT_PLACEHOLDER
```

### Special Colors
```
#FFFFFF - ACTIVE_GLOW (listening/speaking indicator)
#B0B0B0 - MIC_PROCESSING_GLOW
```

## Animation Timings

```python
Animations.FADE_DURATION = 300      # Fade in/out
Animations.SLIDE_DURATION = 400     # Slide transitions
Animations.PULSE_DURATION = 1500    # Pulse animations
Animations.HOVER_DURATION = 150     # Hover effects
```

## Best Practices

### ✓ DO
- Always use design system constants
- Combine related spacing values (e.g., `padx=Spacing.XL, pady=Spacing.LG`)
- Use Typography objects directly without recreating fonts
- Use helper functions for button/input/card styling
- Import only what you need: `from ui.design_system import Colors, Typography`

### ✗ DON'T
- Don't hardcode colors (use `Colors.PRIMARY_TEXT` not `"#FFFFFF"`)
- Don't use magic pixel values (use `Spacing.LG` not `16`)
- Don't create custom CTkFont objects (use `Typography.BODY`)
- Don't mix color schemes (monochrome only!)
- Don't use random spacing values

## Migration Guide (From Old Code)

### Before (Old Colors)
```python
label.configure(text_color="#60A5FA")    # Blue
button.configure(fg_color="#2563EB")     # Bright blue
frame.configure(fg_color="#0F172A")      # Navy
```

### After (Design System)
```python
label.configure(text_color=Colors.PRIMARY_TEXT)
button.configure(fg_color=Colors.BUTTON_PRIMARY_BG)
frame.configure(fg_color=Colors.PRIMARY_BG)
```

## Troubleshooting

**Problem**: Button looks wrong
**Solution**: Use `ThemeConfig.get_button_style()` instead of manual config

**Problem**: Text is hard to read
**Solution**: Use `Colors.PRIMARY_TEXT` for main text, `Colors.SECONDARY_TEXT` for descriptions

**Problem**: Spacing looks inconsistent
**Solution**: Only use `Spacing.XS` through `Spacing.XXXL` values

**Problem**: Colors don't match design
**Solution**: Verify you're using the exact Color constant from the design_system.py file

---

## Questions?

Refer to `ui/design_system.py` for the complete source and detailed comments.
