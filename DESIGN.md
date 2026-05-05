# Dampi Design System

A warm, accessible pediatric health app design system built on three brand hues: sage (softens), teal (anchors), and warm (calls to action). Coral is reserved exclusively for emergency and urgency.

## Color Palette

### Brand Colors
- **Sage** — `#92BBB3` — Soft, supporting color used in backgrounds and inactive states
- **Teal (Primary)** — `#4D736C` — Core interaction color, buttons, and active states
- **Teal Hover** — `#3A5A54` — Interactive feedback for teal elements
- **Warm (Accent)** — `#EDA16D` — Call-to-action, emphasis, and warmth

### Semantic Colors
- **Emergency (Coral)** — `#E8897A` — Reserved exclusively for urgent/emergency flows
- **Warm Light** — `#F7C48F` — Secondary warm accent
- **Warm Mid** — `#E68C44` — Tertiary warm accent

### Neutrals & Surfaces
- **Cream (Background)** — `#FFFAF6` — Primary page background
- **White (Card)** — `#FFFFFF` — Card and elevated surface background
- **Text (Ink)** — `#2A3B38` — Primary text color
- **Text Muted** — `#6B8580` — Secondary/muted text

### Translucent Surfaces (on cream bg)
- **Sage 12%** — `rgba(146, 187, 179, 0.12)` — Soft backgrounds
- **Sage 15%** — `rgba(146, 187, 179, 0.15)` — Input backgrounds, icon wraps
- **Sage 20%** — `rgba(146, 187, 179, 0.20)` — Focus states
- **Sage 35%** — `rgba(146, 187, 179, 0.35)` — Borders, dividers
- **Teal 10%** — `rgba(77, 115, 108, 0.10)` — Soft overlays
- **Warm 15%** — `rgba(237, 161, 109, 0.15)` — Warm backgrounds

## Typography

Single family: **Work Sans** (300, 400, 500, 600, 700, 800 weights)

### Type Scale
- **Greeting** — `h-greeting` — 1.5rem, 800 weight, -0.02em tracking, teal
- **Screen Title** — `h-screen` — 1.6rem, 800 weight, -0.02em tracking, teal
- **Hero Card Title** — `h-hero` — 1.3rem, 800 weight, -0.02em tracking
- **Section Title** — `h-section` — 1rem, 700 weight, -0.01em tracking
- **Eyebrow** — `.eyebrow` — 0.7rem, 700 weight, UPPERCASE, 0.10em tracking, warm
- **Body** — `.body` — 0.88rem, 400 weight, 1.5 line height
- **Meta** — `.meta` — 0.72rem, 400 weight, text-muted

**Rule:** Headings use tight tracking (-0.02em); eyebrows go uppercase at 0.10em spacing.

## Border Radius

Aggressively rounded but consistent:
- **XS** — 10px
- **SM** — 12px
- **MD** — 16px (cards, buttons, inputs)
- **LG** — 20px (larger cards, modals)
- **XL** — 24px (hero sections)
- **Pill** — 999px (badges, FABs, floating nav)

## Shadows

All shadows are teal-tinted (never neutral grey) to maintain warmth:
- **XS** — `0 1px 3px rgba(0,0,0,0.08)` — List rows, minimal depth
- **SM** — `0 2px 8px rgba(77,115,108,0.12)` — Default card shadow
- **MD** — `0 4px 12px rgba(77,115,108,0.15)` — Action cards
- **LG** — `0 8px 24px rgba(77,115,108,0.20)` — Hero cards, modals
- **CTA** — `0 4px 12px rgba(77,115,108,0.25)` — Primary buttons
- **XL** — `0 12px 32px rgba(77,115,108,0.30)` — Floating nav, elevated surfaces

## Spacing Scale

- 4px, 8px, 12px, 16px, 20px, 24px, 28px, 32px

**Application:**
- Screen padding: 20px
- Section rhythm: 24–28px
- Card internal spacing: 18–24px
- Gap between elements: 8–16px

## Buttons

### Primary CTA (Teal)
- Background: Teal (`var(--primary)`)
- Color: White
- Padding: 12px 22px
- Border Radius: MD (16px)
- Font: 700 0.85rem
- Shadow: CTA
- States: Hover (darker bg, lift), Active (scale 0.97)
- Icon gap: 8px

### Warm Accent (Pill)
- Background: Warm (`var(--accent)`)
- Color: White
- Padding: 11px 18px
- Border Radius: Pill
- Font: 700 0.78rem
- Use: Emergency callouts, FABs, secondary CTAs

### Ghost / Outline
- Background: Transparent
- Color: Teal
- Border: 1.5px solid Sage 35%
- Padding: 11px 20px
- Border Radius: MD
- Font: 600 0.85rem
- Hover: Sage 12% background, brand border

### Emergency (Coral)
- Background: Coral (`var(--danger)`)
- Color: White
- Padding: 12px 22px
- Font: 700 0.85rem
- Shadow: `0 4px 12px rgba(232,137,122,0.35)`
- Use: Emergency/urgent actions only

### Filter Chips (Pill)
- Background: Sage 15% (inactive) / Teal (active)
- Color: Teal (inactive) / White (active)
- Padding: 7px 14px
- Border Radius: Pill
- Font: 600 0.75rem
- State: `.is-active` for selected

### Icon Buttons
- Size: 44×44px
- Background: Sage 15%
- Color: Teal
- Border Radius: MD
- Icon size: 18×18px

### FAB (Floating Action Button)
- Size: 56×56px
- Background: Warm
- Color: White
- Border Radius: 50% (circle)
- Shadow: XL
- Icon size: 24×24px

## Cards

### Hero Card
- Background: Card white with left border (4px warm)
- Border Radius: XL
- Padding: 22px 22px 24px
- Shadow: LG
- Position: Relative with decorative blobs (sage, warm)
- Eyebrow: Warm, uppercase
- Title: `h-hero` class
- CTA: Primary button

### Action Card (2×2 Grid)
- Background: Card white
- Border Radius: LG
- Padding: 16px 14px
- Shadow: SM
- Icon: 38×38px with background (sage/warm/coral variants)
- Title: 0.85rem, 700 weight
- Subtitle: 0.7rem, text-muted
- Decorative blob: Sage 12%, positioned bottom-right

### Tip / Info Card
- Background: Card white
- Border Radius: LG
- Padding: 14px
- Shadow: XS
- Layout: Flex with icon + text
- Icon wrap: 38×38px, sage 15% background
- Title: 0.85rem, 700 weight
- Body: 0.78rem, text-muted, 1.5 line height

### Coverage Card
- Background: Gradient (sage to teal)
- Color: White
- Border Radius: XL
- Padding: 22px
- Shadow: `0 8px 24px rgba(77,115,108,0.25)`
- Label: 0.7rem uppercase, 0.10em tracking
- Title: 1.2rem, 800 weight, -0.02em tracking
- Badge: Semi-transparent white with pulse animation

## Badges & Status Indicators

### Status Badges
- **Active** — Sage 20% bg, teal text, with pulsing dot
- **Confirmed** — `rgba(146,187,179,0.30)` bg, teal text
- **Pending** — Warm 15% bg, warm-dark text
- **Danger** — `rgba(232,137,122,0.18)` bg, coral text
- **Soft** — Teal 10% bg, teal text

**Style:**
- Padding: 5px 11px
- Border Radius: Pill
- Font: 700 0.66rem, UPPERCASE, 0.08em tracking

### Status Dots (Inline)
- **Mild** — Sage (`var(--brand)`)
- **Moderate** — Warm (`var(--accent)`)
- **Severe** — Coral (`var(--danger)`)
- **Resolved** — Teal (`var(--primary)`)

**Style:** 10px filled disc, used inline with text (0.78rem)

## Avatars

- **Standard** — 48×48px, white initials on brand color
- **Large** — 80×80px, white initials on brand color
- **Background variants** — Sage, Teal, Warm, Coral
- Shadow: `var(--shadow-sm)`
- Border Radius: 50% (circle)

## Forms

### Child Selector (Segmented)
- Layout: Flex row, 8px gap
- Card: Border 1.5px sage 35%, radius MD, padding 10px 12px
- Active state: Teal border, sage 12% bg, shadow 0 0 0 3px sage 20%
- Avatar: 30×30px, brand bg, white initials
- Name: 0.82rem, 700 weight
- Age: 0.68rem, text-muted
- Add button: Dashed border, teal text, centered

### Severity Buttons
- Layout: 3-column flex
- Button: Border 1.5px sage 35%, radius MD, padding 12px 8px
- Dot: 9px circle (sage/warm/coral)
- Active: Teal bg, white text, white dot, CTA shadow
- Font: 600 0.78rem

### Symptom Chip-Checkboxes
- Layout: Flex wrap, 8px gap
- Chip: Border 1.5px sage 35%, radius pill, padding 8px 14px
- Checkbox: 18×18px, radius 5px, white bg, sage border
- Checked state: Teal bg, teal border, white checkmark
- Philippino hint: 0.72rem, muted color
- Font: 600 0.78rem

### Temperature Input + Steppers
- Input wrap: Flex, sage 35% border, radius MD
- Input field: 700 1.05rem, teal
- Unit label: 0.86rem, text-muted
- Stepper buttons: 36×36px, sage 12% bg, teal icon, radius SM
- Flag (alert): Warm 15% bg, warm text, alert icon, 0.7rem
- Focus: Sage 35% border, 0 0 0 3px sage 20% shadow

### Textarea
- Full width, border 1.5px sage 35%, radius MD, padding 14px
- Font: 400 0.86rem, 1.5 line height
- Min height: 78px, resize: vertical
- Focus: Sage 35% border, sage 20% shadow
- Placeholder: text-muted
- Character counter: Right-aligned, 0.68rem, text-muted

### Toggle Row
- Layout: Flex items with 14px gap
- Background: Sage 12%, radius MD, padding 12px 14px
- Icon wrap: 34×34px, card bg, teal text, radius SM
- Title: 700 0.84rem
- Subtitle: 0.72rem, text-muted
- Switch: 42×24px, radius pill, sage 35% (off) / teal (on)
- Toggle indicator: 18×18px circle, white, shadow xs, animate left 0.18s ease

### Submit Row
- Layout: Flex gap 10px
- Primary button: Flex 1, teal bg, white text, 14px 20px, 700 0.92rem
- Secondary button: Transparent, teal text, 600 0.86rem
- Button states: Hover (lift), Active (scale 0.97)

### Input States
- **Default** — Sage 35% border, white bg
- **Focused** — Sage 35% border, sage 20% shadow
- **Error** — Coral border, `rgba(232,137,122,0.20)` shadow
- **Disabled** — Sage 12% bg, text-muted, sage 15% border
- Error message: Coral text, 600 0.7rem, alert icon

## Navigation

### Floating Nav (Pill)
- Layout: Inline-flex, teal bg, 6px padding, 4px gap between items
- Shape: Border radius 999px (pill)
- Shadow: XL
- Position: Fixed bottom-left in app
- Height: 56px total

**Logo button:**
- 44×44px, circle, semi-transparent white bg (14%)
- Icon: Leaf, 22×22px, white

**Nav items:**
- 44×44px, circle, teal text (65% opacity)
- Icon: 20×20px
- Active state: Semantic white bg (20%), white text, stroke-width 2.5
- Cursor: pointer

### Screen Header
- Layout: Flex items, 12px gap, padding 12px 0
- Back button: 40×40px circle, card bg, sage 15% border, teal text, radius 50%
- Title: `h-screen` class (1.6rem, 800)
- Subtitle: `.meta` class (0.72rem, text-muted)

### Greeting Block (Home Top)
- Background: Card white, radius LG, padding 18px 20px
- Layout: Flex space-between, gap 16px
- Shadow: SM
- Max-width: 430px
- Greeting: `h-greeting` (1.5rem, 800, teal)
- Subtitle: `.meta` (0.72rem, text-muted)
- Date pill: Sage 20% bg, teal text, 0.7rem 700, center-aligned
  - Day: 1.1rem bold on separate line

## Iconography

**Library:** Phosphor Icons 2.1+
**Default weight:** Regular (1.5px stroke)
**Default size:** 22px
**Hero icons:** Duotone weight, 48px+
**Active nav state:** Fill weight

### Icon Sizes Scale
- 14px — Inline meta icons
- 18px — Inputs, list items
- 22px — Default buttons and cards
- 28px — Larger buttons
- 36px — Section icons
- 48px — Hero icons

### Icon Colors
- **Primary** — Teal (`var(--primary)`)
- **CTA** — Warm (`var(--accent)`)
- **Inactive** — Sage (`var(--brand)`)
- **Emergency** — Coral (`var(--danger)`)

**Rule:** Never mix icon weights inside one card. Use regular everywhere, duotone for 3+ hero uses per screen, fill only for active floating nav state.

### Common Icons Used
house, clipboard-text, shield-check, user-circle, calendar-blank, map-pin, warning-circle, stethoscope, drop (droplets), wind, heart, pill, eye, pulse, magnifying-glass, caret-right, phone, file-text, thermometer, baby, hand-coins, chat-circle-dots, ear, leaf

## Logo

**File:** `src/components/assets/dampi.svg`
**Format:** Single-color SVG inheriting `currentColor`
**Usage:**
- Logo + wordmark on all brand surfaces
- Mark-only in 32px+ contexts (favicon, app icon, nav badge)
- Below 32px, drop the inner highlight curl

**Color variants:**
- Teal on white (primary lockup)
- Teal on cream (default)
- Cream on teal (floating nav, dark CTAs)
- White on sage (alternative)
- White on warm (emergency/FAB contexts)
- Cream on ink (print, footers)

**Clear space:** Half the cap-height of the wordmark on all sides.

## Lists & Data Display

### Info List
- Background: Card white, radius LG, shadow SM
- Border-collapse styling for rows
- Max-width: 430px

**Info Row:**
- Display: Flex space-between, padding 14px 16px
- Border-bottom: 1px sage 15%, except last-child
- Left layout: Flex gap 12px
- Icon wrap: 34×34px, sage 15% bg, teal text, radius SM
- Label: 0.7rem UPPERCASE, text-muted, margin 0 0 2px
- Value: 0.88rem 600, text color
- Chevron: 18×18px, text-muted

## Responsive & Accessibility

- **Base font-size:** 16px (body)
- **Min-width:** 320px (mobile)
- **Tab-safe:** All interactive elements keyboard accessible
- **ARIA labels:** Use on icon-only buttons, landmarks
- **Contrast:** All text meets WCAG AA (teal 4.5:1 on white, etc.)
- **Touch targets:** Minimum 44×44px for buttons

## Implementation Notes

- Use CSS custom properties for all colors: `var(--primary)`, `var(--accent)`, etc.
- Shadow values are pre-calculated teal-tints; avoid grey shadows
- Padding/margin: Prefer multiples of 4px from the spacing scale
- Never use placeholder text as labels; always use `<label>` elements
- Form inputs must have visible focus indicators (sage 20% shadow standard)
- All animated states should respect `prefers-reduced-motion`
