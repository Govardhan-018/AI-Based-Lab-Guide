# SENSEBRIDGE UI DESIGN SYSTEM GUIDE
## Professional Ultra-Minimal Monochrome Theme (White & Black)

This guide documents the design tokens and implementation rules for the SenseBridge AI Laboratory Assistant.

### 1. CORE DESIGN PHILOSOPHY
- **Pure Monochrome**: Only use White (#FFFFFF) and Black (#000000).
- **White Backgrounds**: All main surfaces must be pure white.
- **Black Elements**: All text, icons, borders, and primary buttons must be black.
- **Minimalist Aesthetic**: Large breathing spaces, thin borders (1px), and no unnecessary decorations.
- **Geometric Precision**: High readability with bold sans-serif typography (Inter/Segoe UI).
- **Soft Corners**: All containers use 16px–24px rounded corners.

### 2. COLOR SYSTEM

| Token | Hex | Usage |
| :--- | :--- | :--- |
| `PRIMARY_BG` | `#FFFFFF` | Main window, app body, and all backgrounds. |
| `PRIMARY_TEXT` | `#000000` | Headings, labels, and primary content. |
| `SECONDARY_TEXT` | `#666666` | Descriptions, metadata, and hints (60% Black). |
| `TERTIARY_TEXT` | `#999999` | Subtle text and timestamps. |
| `BORDER` | `#000000` | Thin 1px outlines for cards, buttons, and inputs. |
| `STEP_ACTIVE_BG` | `#000000` | Background for the currently active experiment step. |
| `STEP_ACTIVE_TEXT`| `#FFFFFF` | Text for the active step. |
| `QUATERNARY_BG` | `#F0F0F0` | Subtle pulse effects or light-grey dividers. |

### 3. TYPOGRAPHY

| Style | Font | Size | Weight |
| :--- | :--- | :--- | :--- |
| `TITLE` | Inter/Segoe UI | 32px | Bold |
| `SECTION_TITLE` | Inter/Segoe UI | 20px | Bold |
| `SUBTITLE` | Inter/Segoe UI | 16px | Bold |
| `BODY` | Inter/Segoe UI | 14px | Normal |
| `BODY_BOLD` | Inter/Segoe UI | 14px | Bold |
| `SMALL_BOLD` | Inter/Segoe UI | 12px | Bold |

### 4. COMPONENT STYLING

#### Cards & Sections
All cards should be outlined with a 1px black border and use `BorderRadius.LARGE` (18px).
```python
frame = ctk.CTkFrame(parent, **ThemeConfig.get_card_style())
```

#### Buttons
- **Primary**: Solid Black background with White text.
- **Secondary**: Outlined White background with Black text.
```python
btn = ctk.CTkButton(parent, **ThemeConfig.get_button_style("primary"))
```

#### Inputs
Always use pure white backgrounds with 1px black borders.
```python
entry = ctk.CTkEntry(parent, **ThemeConfig.get_input_style())
```

### 5. PROHIBITED ELEMENTS
- ❌ **No Gradients**: Use flat solid colors only.
- ❌ **No Colors**: No blue, green, red, or neon (except status icons if strictly necessary, but prefer black).
- ❌ **No Glassmorphism**: No blur effects or transparent overlays.
- ❌ **No Shadows**: Use thin borders instead of shadows for depth.

### 6. COMMON DESIGN PATTERNS

#### Badges
Badges should be implemented as a `CTkFrame` with a border and a `CTkLabel` inside, as `CTkLabel` does not support borders directly.
```python
badge = ctk.CTkFrame(parent, fg_color=Colors.PRIMARY_BG, border_color=Colors.BORDER, border_width=1, corner_radius=BorderRadius.SMALL)
label = ctk.CTkLabel(badge, text="Medium", font=Typography.SMALL_BOLD, text_color=Colors.PRIMARY_TEXT)
```

#### AI Labels
Floating AI monitoring labels should use white backgrounds with 1px black borders.
