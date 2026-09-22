---
name: SignLight
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d9f4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e2e7ff'
  surface-container-highest: '#dae2fd'
  on-surface: '#131b2e'
  on-surface-variant: '#3f4850'
  inverse-surface: '#283044'
  inverse-on-surface: '#eef0ff'
  outline: '#707881'
  outline-variant: '#bfc7d2'
  surface-tint: '#006398'
  primary: '#006194'
  on-primary: '#ffffff'
  primary-container: '#007bb9'
  on-primary-container: '#fdfcff'
  inverse-primary: '#93ccff'
  secondary: '#006c49'
  on-secondary: '#ffffff'
  secondary-container: '#6cf8bb'
  on-secondary-container: '#00714d'
  tertiary: '#825100'
  on-tertiary: '#ffffff'
  tertiary-container: '#a36700'
  on-tertiary-container: '#fffbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#cce5ff'
  primary-fixed-dim: '#93ccff'
  on-primary-fixed: '#001d31'
  on-primary-fixed-variant: '#004b73'
  secondary-fixed: '#6ffbbe'
  secondary-fixed-dim: '#4edea3'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#ffb95f'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fd'
typography:
  headline-xl:
    fontFamily: Be Vietnam Pro
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-xl-mobile:
    fontFamily: Be Vietnam Pro
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Be Vietnam Pro
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Be Vietnam Pro
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Be Vietnam Pro
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 26px
  body-lg:
    fontFamily: Be Vietnam Pro
    fontSize: 17px
    fontWeight: '400'
    lineHeight: 26px
  body-md:
    fontFamily: Be Vietnam Pro
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 22px
  body-sm:
    fontFamily: Be Vietnam Pro
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-lg:
    fontFamily: Be Vietnam Pro
    fontSize: 15px
    fontWeight: '600'
    lineHeight: 20px
  label-md:
    fontFamily: Be Vietnam Pro
    fontSize: 13px
    fontWeight: '600'
    lineHeight: 18px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Be Vietnam Pro
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.04em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-mobile: 0.75rem
  margin: 1.5rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

This design system is engineered for an assistive educational technology experience that bridges visual communication, computer vision, and empathy. The brand posture balances high-tech precision with human warmth. It empowers both the Deaf and Hard-of-Hearing (D/HH) community and Vietnamese Sign Language (VSL) learners through instant visual feedback, clear signaling, and welcoming gamification.

The aesthetic blends **Modern Utilitarianism** with **Accessible Soft-Tech**:
- **High-legibility visual ergonomics**: High contrast, uncompromised typography, and tactile affordances ensure effortless perception while a user focuses on physical hand positioning.
- **Supportive feedback loops**: Visual cues substitute auditory feedback completely, relying on distinct color states, glowing landmark skeletal overlays, and rhythmic micro-interactions.
- **Calm, unobtrusive chrome**: Interface chrome stays understated to give visual dominance to the live camera viewport and 3D avatar demonstrations.

## Colors

The color palette establishes high visual contrast, meeting WCAG AAA compliance for core instructional typography and WCAG AA across interactive tokens:

- **Primary (`#0284C7`)**: The cognitive anchor. Represents technological precision, communication clarity, and focus. Used for primary calls-to-action, active bottom navigation tabs, and system focus boundaries.
- **Secondary / Success (`#10B981`)**: The affirmative signifier. Used for accurate hand landmark locks, validation states, streak counters, and celebratory progress bars.
- **Tertiary / Warning (`#F59E0B`)**: Guidance accent. Emphasizes posture corrections, elbow angle adjustments, or out-of-frame wrist warnings without punitive visual alarm.
- **Neutral Canvas (`#0F172A` on `#F8FAFC` / `#FFFFFF`)**: Deep slate ensures crisp, razor-sharp contrast against clean surface layers. 

### Semantic Roles & Vision Indicators
- **Camera Viewport Landmark Colors**: 
  - Neutral Tracking: White (`#FFFFFF`) with 60% opacity outline.
  - Active Alignment: Cyan Sky (`#38BDF8`).
  - Perfect Pose Match: Emerald Green (`#10B981`) with a soft additive glow.
  - Posture Correction Needed: Amber (`#F59E0B`).
- **Surface Tiers**:
  - Base canvas: `#F8FAFC`
  - Elevated surfaces/Cards: `#FFFFFF`
  - Subtle borders: `#E2E8F0`
  - High-emphasis text: `#0F172A`
  - Supporting text: `#475569`

## Typography

**Be Vietnam Pro** is selected as the primary typographic family across all structural levels. It provides native, culturally authentic diacritic rendering for Vietnamese vocabulary alongside open apertures and distinct letterforms crucial for rapid peripheral scanning.

### Hierarchy Guidelines
- **Instructional Focus**: Maintain generous line heights on body copy (`body-lg` / `body-md`) to ensure learners can comprehend written sign glosses simultaneously while glancing at video feeds.
- **Uppercase Restraint**: Reserve full uppercase exclusively for `label-sm` micro-tags and instructional status badges to avoid cognitive friction for deaf learners who depend on distinct shape silhouettes.

## Layout & Spacing

The layout is built upon a continuous **4-point grid model** optimized for mobile-first single-handed reachability:

- **Mobile Canvas**: A 4-column layout utilizing `margin-mobile` (16px) with `gutter-mobile` (12px).
- **Tablet / Split View**: An 8-column layout utilizing `margin` (24px) with `gutter` (16px), allowing simultaneous side-by-side display of the reference model and real-time user camera.
- **Touch Targets**: All interactive elements (record buttons, navigation tabs, back gestures) must respect a minimum touch envelope of 48px × 48px with at least `space-sm` separation.
- **Dynamic Viewport Insets**: The camera HUD reserves a 96px safe margin at the bottom for controls and an 80px safe margin at the top for real-time sign detection scoreboards.

## Elevation & Depth

This design system uses **Crisp Surface Layering** paired with subtle ambient diffusion. It eliminates heavy muddy dropshadows to preserve maximum edge definition for learners:

- **Base Layer (Canvas)**: `#F8FAFC`, flat.
- **Level 1 (Cards, Modules, Inactive Controls)**: `#FFFFFF` surface with a crisp 1px border (`#E2E8F0`) and an ambient shadow: `box-shadow: 0 1px 3px 0 rgba(15, 23, 42, 0.05)`.
- **Level 2 (Active Feedback Sheets, Dialogs, Dropdowns)**: `#FFFFFF` with a dual-stage shadow: `box-shadow: 0 4px 6px -1px rgba(15, 23, 42, 0.07), 0 2px 4px -2px rgba(15, 23, 42, 0.05)`.
- **Level 3 (Floating Camera HUD & Dynamic Feedback Overlays)**: Semi-translucent dark frost (`rgba(15, 23, 42, 0.85)` with `backdrop-filter: blur(12px)`) over camera feeds, bordered by `rgba(255, 255, 255, 0.15)`.
- **Active AI Feedback Glow**:
  - Success lock: `0 0 0 3px rgba(16, 185, 129, 0.25)`
  - Adjustment warning: `0 0 0 3px rgba(245, 158, 11, 0.25)`

## Shapes

With a roundedness index of **2 (Rounded)**, the UI radiates approachability, security, and modern consumer hardware aesthetics:

- **Base Components (0.5rem / 8px)**: Inputs, progress tracks, individual landmark nodes, and micro-badges.
- **Structural Components (1rem / 16px)**: Lesson cards, flashcards, camera HUD containers, and modal alerts.
- **Large Wrappers (1.5rem / 24px)**: Bottom action sheets, camera viewport framing masks, and celebratory milestone cards.
- **Pill Exceptions (`9999px`)**: Primary practice buttons, status indicator tags, and navigation active indicator pills.

## Components

### Buttons
- **Primary Action**: Pill-shaped or 12px rounded, background `#0284C7`, text `#FFFFFF`, bold typography (`label-lg`). Includes active press state scaling down to `98%` with subtle haptic vibration pairing.
- **Secondary Action**: Surface `#FFFFFF`, border 1.5px solid `#E2E8F0`, text `#0F172A`. On hover/active, transitions to `#F1F5F9`.
- **Gamified "Check / Sign" Button**: Sticky mobile bottom button with 3D tactile press feel (bottom border shadow offset of 3px) in `#10B981` (Ready) or `#0284C7` (Hold).

### Live Camera Viewport & Landmark Skeleton
- **Viewport Frame**: High-radius clipping (`rounded-xl` or 24px) encased in a subtle `#0F172A` matte frame.
- **Landmark Lines**: 2px stroke width vector connections with 6px circular keypoint nodes. Line color dynamically reflects state: cyan for active inference, green for correct alignment, amber for hand out-of-bounds or incorrect orientation.
- **Guidance Pill**: Top-centered floating translucent HUD element displaying immediate Vietnamese cue tokens (e.g., "Mở rộng lòng bàn tay" / "Open palm wider").

### Chips & Micro-Badges
- **Lesson Level Badges**: Compact tags with `space-xs` horizontal padding, uppercase `label-sm`, pairing 10% tint backgrounds with 100% solid text (e.g., `#0284C7` text on `#E0F2FE` background).
- **Streak & Accuracy Chips**: Rounded pill chips with embedded SVG icons showing real-time on-device model confidence (e.g., "98% Chính xác").

### Gamified Progress Bars
- **Height**: 10px track height with full pill rounding.
- **Track**: `#E2E8F0` neutral track.
- **Fill**: `#10B981` with animated trailing shine upon successful sign validation, visually communicating step completion without reliant audio cues.

### Lists & Flashcard Modules
- **Interactive Vocabulary Item**: Split container featuring a left sign thumbnail/mini-loop video, center Vietnamese text gloss + phonetic cue, and right mastery indicator (checkbox or percentage circle).
- **Separator**: Inset divider `1px` solid `#F1F5F9` aligned strictly with content text bounds.

### Form Inputs & Selection
- **Text & Search Fields**: Surface `#FFFFFF`, 1.5px border `#CBD5E1`, text `#0F172A`. High-contrast focus state with `2px` ring in `#0284C7`.
- **Checkboxes & Radios**: Custom high-contrast geometry with 20px min hit footprint, active fill `#0284C7` with crisp white checkmark SVG.

### Bottom Navigation
- **Structure**: Fixed mobile bar with 64px height, background `#FFFFFF` with top border `1px solid #E2E8F0`.
- **Icon / Label Pairs**: 4-5 destinations (Học tập / Practice, Từ điển / Dictionary, Camera Luyện tập / Sign Lab, Tiến độ / Progress, Hồ sơ / Profile).
- **Active State**: Primary blue `#0284C7` tint on icon and micro-label with a top subtle indicator accent bar.