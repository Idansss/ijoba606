---
name: Heritage Tech
colors:
  surface: '#fafaed'
  surface-dim: '#dbdbce'
  surface-bright: '#fafaed'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f4f4e7'
  surface-container: '#efefe2'
  surface-container-high: '#e9e9dc'
  surface-container-highest: '#e3e3d7'
  on-surface: '#1a1c15'
  on-surface-variant: '#404a3b'
  inverse-surface: '#2f3129'
  inverse-on-surface: '#f1f1e5'
  outline: '#707a6a'
  outline-variant: '#bfcab7'
  surface-tint: '#126e0c'
  primary: '#004900'
  on-primary: '#ffffff'
  primary-container: '#006400'
  on-primary-container: '#86df72'
  inverse-primary: '#82db6f'
  secondary: '#006d33'
  on-secondary: '#ffffff'
  secondary-container: '#96f8aa'
  on-secondary-container: '#007436'
  tertiary: '#735c00'
  on-tertiary: '#ffffff'
  tertiary-container: '#cea711'
  on-tertiary-container: '#4e3e00'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#9df888'
  primary-fixed-dim: '#82db6f'
  on-primary-fixed: '#002200'
  on-primary-fixed-variant: '#005300'
  secondary-fixed: '#96f8aa'
  secondary-fixed-dim: '#7adb90'
  on-secondary-fixed: '#00210b'
  on-secondary-fixed-variant: '#005225'
  tertiary-fixed: '#ffe085'
  tertiary-fixed-dim: '#ebc233'
  on-tertiary-fixed: '#231b00'
  on-tertiary-fixed-variant: '#574500'
  background: '#fafaed'
  on-background: '#1a1c15'
  surface-variant: '#e3e3d7'
  deep-green: '#006400'
  forest-green: '#0B7A3B'
  royal-gold: '#C59F00'
  cream-canvas: '#F5F5E8'
  ink-black: '#0A0A0A'
typography:
  display-lg:
    fontFamily: Geist
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Geist
    fontSize: 36px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Geist
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  figure-xl:
    fontFamily: JetBrains Mono
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: -0.04em
  figure-md:
    fontFamily: JetBrains Mono
    fontSize: 16px
    fontWeight: '500'
    lineHeight: '1'
  label-sm:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  gutter: 24px
  margin-desktop: 64px
  margin-mobile: 20px
  container-max: 1280px
---

## Brand & Style

This design system blends the efficiency of global fintech with the vibrant cultural identity of Nigeria. The brand personality is "Modern Heritage"—it is premium and trustworthy, yet radiates warmth through a carefully curated palette of deep greens and soft creams.

The visual style is **Modern Fintech Minimalism** with a **Bento-Grid** layout philosophy. It utilizes heavy whitespace, expansive rounded corners, and subtle glassmorphism to create a UI that feels both high-tech and approachable. The emotional response should be one of "effortless prosperity," making financial management feel as engaging as entertainment.

## Colors

The palette is anchored by "Deep Nigerian Green," symbolizing growth and stability. The secondary green provides depth for interactive elements, while the "Royal Gold" acts as a high-impact accent for highlights, calls to action, and achievement states. 

The canvas uses a soft, warm off-white (`#F5F5E8`) instead of pure white to reduce eye strain and provide a more organic, premium feel. Text is primarily rendered in `ink-black` or deep forest tones to maintain high legibility while avoiding the harshness of true black on cream.

## Typography

Typography is used to distinguish between narrative content and transactional data. **Geist Sans** is the workhorse for all UI elements, headings, and body copy, providing a clean, geometric aesthetic.

**Geist Mono** (represented by JetBrains Mono for system compatibility) is reserved strictly for financial figures, data points, and "edutainment" metrics. This creates a technical contrast that signals precision. Headlines should utilize tight letter-spacing to maintain a modern, "Swiss-style" look typical of high-end fintech apps.

## Layout & Spacing

The design system employs a **Bento-Grid** layout model. Components are housed within modular tiles of varying sizes that snap to a 12-column grid. 

- **Desktop:** 12 columns with 24px gutters. Use generous internal padding within bento boxes (32px or 40px) to maintain a feeling of luxury.
- **Mobile:** 4 columns with 16px gutters. Bento boxes should stack vertically, maintaining their signature rounded corners.
- **Rhythm:** All spacing (margins, padding, gaps) must be multiples of 8px to ensure a consistent vertical rhythm. Large "hero" containers should use increased white space to separate the financial dashboard from the educational content.

## Elevation & Depth

Hierarchy is achieved through a combination of **Tonal Layers** and **Glassmorphism**.

1.  **Base Layer:** The warm cream canvas (`#F5F5E8`).
2.  **Bento Tiles:** Solid white or slightly translucent (`rgba(255, 255, 255, 0.7)`) surfaces with a subtle 1px border (`#006400` at 5% opacity).
3.  **Shadows:** Use extremely soft, long-offset shadows (e.g., `0px 10px 30px rgba(0, 50, 0, 0.05)`) to make cards appear as if they are floating just above the canvas.
4.  **Glassmorphism:** Apply a `backdrop-filter: blur(12px)` to floating navigation bars and secondary overlays to add a sense of modern depth without cluttering the UI.

## Shapes

The shape language is defined by oversized, friendly radiuses. 

- **Main Bento Containers:** 32px corner radius.
- **Inner Component Cards:** 16px corner radius.
- **Buttons & Inputs:** 12px or fully rounded (pill-shaped) for a more playful, organic feel.

This high degree of roundedness softens the professional green/gold palette, making the fintech experience feel less rigid and more like a lifestyle app.

## Components

- **Buttons:** Primary buttons use the Deep Green background with white text. Secondary buttons should use a Gold outline or a soft Forest Green tint. Action buttons for "Rewards" or "Bonuses" should use the Gold accent.
- **Bento Cards:** Every card must have a consistent 32px radius. Content inside should be aligned to a sub-grid. Use "Glass" cards for non-critical information like background edutainment stats.
- **Inputs:** Fields should have a subtle cream-to-white gradient background, 12px radius, and a 2px Forest Green border on focus.
- **Chips/Badges:** Use Gold backgrounds with Ink Black text for "Pro" or "Verified" statuses. Use Green tints for positive financial trends.
- **Data Visualizations:** Charts should utilize the primary and secondary greens for bars/lines, with Gold used exclusively to highlight the "Current Target" or "High Point."
- **Lists:** Clean, borderless list items separated by whitespace or very light green dividers (2% opacity). Icons should be housed in circular containers with a 10% Forest Green fill.
