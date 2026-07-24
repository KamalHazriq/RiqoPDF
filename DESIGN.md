---
name: RiqoPDF
description: A free, privacy-first PDF toolkit — every tool you need, none of the paywall.
colors:
  primary: "#004cc0"
  primary-deep: "#003a94"
  primary-tint: "#e8f0fd"
  local-signal: "#059669"
  local-signal-deep: "#047857"
  local-signal-tint: "#ecfdf5"
  logo-yellow: "#ffe000"
  logo-red: "#db1b00"
  logo-olive: "#519000"
  neutral-page: "#ffffff"
  neutral-page-dark: "#0a0a0a"
  neutral-surface: "#fafafa"
  neutral-surface-dark: "#171717"
  neutral-border: "#e5e5e5"
  neutral-border-dark: "#262626"
  neutral-text: "#171717"
  neutral-text-dark: "#ededed"
  neutral-muted: "#737373"
  neutral-muted-dark: "#a3a3a3"
typography:
  display:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
    fontSize: "clamp(2.25rem, 4vw, 3rem)"
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  title:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
    fontSize: "1rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "normal"
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
  label:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: "0.04em"
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  full: "9999px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
  xl: "40px"
  2xl: "64px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#ffffff"
    rounded: "{rounded.sm}"
    padding: "10px 20px"
  button-primary-hover:
    backgroundColor: "{colors.primary-deep}"
    textColor: "#ffffff"
    rounded: "{rounded.sm}"
    padding: "10px 20px"
  badge-local:
    backgroundColor: "{colors.local-signal-tint}"
    textColor: "{colors.local-signal-deep}"
    rounded: "{rounded.full}"
    padding: "2px 10px"
  card-tool:
    backgroundColor: "{colors.neutral-surface}"
    textColor: "{colors.neutral-text}"
    rounded: "{rounded.md}"
    padding: "20px"
---

# Design System: RiqoPDF

## Overview

**Creative North Star: "The Friendly Workbench"**

RiqoPDF is a tool marketplace, not a marketing site — but a workbench doesn't have to feel
cold. The system stays close to a Linear/Vercel-style neutral foundation (near-monochrome
grays, generous whitespace, restrained type) but warms it up the way Notion does: slightly
rounder corners, a soft resting shadow under every card instead of flat-until-hover, and one
confident, deep blue pulled straight from the RiqoPDF logo mark as the single brand accent.
The explicit visual rejection carried over from the product brief: this must never look like
or copy iLovePDF's branding or layout.

Two accent colors carry distinct, non-overlapping meaning and must never be swapped: **Riqo
Blue** is the brand accent (primary actions, links, focus states); **the local-signal green**
exists solely to mean "this file never left your device" on the "In your browser" badge. The
logo's yellow and red are identity colors for the mark itself and do not appear as UI accents.

**Key Characteristics:**
- Near-monochrome neutral base; color is meaningful, not decorative
- Soft ambient shadow at rest on every card (not just on hover)
- Rounder corners than a pure Linear aesthetic (12–16px, not 4–8px)
- One brand accent (deep blue), one reserved semantic accent (green, "local" only)
- System font stack, no display webfont — plain and legible over stylish

## Colors

Near-monochrome neutrals carry the interface; the palette earns its warmth from shadow and
radius, not from color proliferation.

### Primary
- **Riqo Blue** (`#004cc0`): the single brand accent — primary buttons, active nav states,
  links, focus rings, selected states. Sampled directly from the logo's "o" ring.
- **Riqo Blue Deep** (`#003a94`): hover/active state for Riqo Blue surfaces.
- **Riqo Blue Tint** (`#e8f0fd`): faint background wash behind primary-accent callouts only.

### Secondary
- **Local-Signal Green** (`#059669` light / `#34d399` dark): reserved exclusively for the "In
  your browser" badge and any future "processed locally" indicator. Never used as a general UI
  accent — its rarity is what makes the privacy claim legible at a glance.

### Neutral
- **Paper** (`#ffffff` light / `#0a0a0a` dark): page background.
- **Surface** (`#fafafa` light / `#171717` dark): card and raised-panel background, one step
  off the page.
- **Border** (`#e5e5e5` light / `#262626` dark): hairline dividers and card edges.
- **Ink** (`#171717` light / `#ededed` dark): primary text.
- **Muted** (`#737373` light / `#a3a3a3` dark): secondary text, descriptions, labels.

### Named Rules
**The One Accent Rule.** Riqo Blue appears on at most one element per view unless that
element is a repeated list (e.g. every "available" tool card's hover ring). It marks the single
next action, never decoration.

**The Green Means Local Rule.** Local-Signal Green never appears anywhere except the "runs in
your browser" badge family. If a future feature needs a new status color, pick a third hue —
never repurpose green.

## Typography

**Body/Display Font:** System UI stack (`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
Helvetica, Arial, sans-serif`) — no custom webfont.

**Character:** Plain, legible, unpretentious — the type system should disappear in favor of
the tools themselves. Hierarchy comes from size and weight, not typographic flourish.

### Hierarchy
- **Display** (600, `clamp(2.25rem, 4vw, 3rem)`, 1.1): the homepage hero line only.
- **Title** (500, 1rem, 1.4): tool card names, section headings inside a tool page.
- **Body** (400, 1rem, 1.6, ~65ch max): descriptions, help text, tool page copy.
- **Label** (500, 0.75rem, letter-spacing 0.04em, uppercase where used): category headers,
  badges, form field labels.

### Named Rules
**The No-Serif Rule.** Nothing in this system uses a serif or display webfont — a workbench
tool doesn't need editorial typography, and a serif here would read as borrowed prestige.

## Layout

Single centered column, `max-width: 72rem` (1152px), `px-6` (24px) gutters that never touch
viewport edges even at 1440px+. Section rhythm is generous: `py-16` (64px) around the hero,
`mb-12` (48px) between tool categories. Tool grid: 1 column mobile, 2 columns `sm:`, 3 columns
`lg:`, `gap-4` (16px) between cards. Density stays low — this is a marketplace to browse, not
a dense data table.

## Elevation & Depth

Layered, not flat. Every card carries a soft ambient shadow at rest — depth is a constant
material property of "raised" surfaces, not something that only appears on interaction. Hover
deepens the existing shadow and lifts the card slightly; it does not introduce shadow from
nothing.

### Shadow Vocabulary
- **Resting** (`box-shadow: 0 1px 2px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.06)`): default
  state for every `Card` and `ToolCard`.
- **Hover/Lift** (`box-shadow: 0 2px 4px rgba(0,0,0,0.06), 0 12px 24px rgba(0,0,0,0.10)`,
  paired with `transform: translateY(-2px)`): interactive cards on hover/focus.

### Named Rules
**The Always-Raised Rule.** Cards are never perfectly flat against the page background, in
either theme — a soft shadow (light mode) or a subtly lighter surface tone plus a faint border
(dark mode, where shadows read poorly on near-black) always separates a card from `Paper`.

## Shapes

Rounder than a strict Linear aesthetic: `12px` (`rounded-md`) as the default card radius,
`16px` for larger containers (hero callouts, modals), `8px` for buttons and small controls,
full pill radius for badges. No sharp (0px) corners anywhere — that reads as too severe for a
"friendly" workbench.

## Components

### Buttons
- **Shape:** `8px` radius.
- **Primary:** Riqo Blue background, white text, `10px 20px` padding, medium weight.
- **Hover/Focus:** background steps to Riqo Blue Deep; `focus-visible` gets a 2px Riqo Blue
  ring with 2px offset (never rely on color change alone for focus).
- **Secondary/Ghost:** transparent or neutral-100 background, neutral-900 text, neutral-200
  border for the outline variant.

### Cards / Containers (Tool Cards)
- **Corner Style:** `12px` radius.
- **Background:** Surface neutral (`#fafafa` / `#171717`).
- **Shadow Strategy:** Resting shadow always on; Hover/Lift on `:hover`/`:focus-visible`.
- **Border:** hairline `Border` neutral, mainly for dark mode where shadow reads poorly.
- **Internal Padding:** `20px` (`p-5`).

### Badges ("In your browser" / "Coming soon")
- **Style:** full pill radius, `2px 10px` padding, 11px label-weight text.
- **Local badge:** Local-Signal Green tint background, deep green text — the one place green
  appears.
- **Coming-soon badge:** neutral-100/900 background, muted text — deliberately quiet, this is
  an absence, not a call to action.

### Navigation (Header)
- Sticky-feeling but not fixed; hairline border-bottom separates it from content. Wordmark
  left, privacy microcopy + theme toggle right. No color in the header itself — restraint here
  keeps the one blue accent meaningful when it appears below in tool cards and buttons.

## Do's and Don'ts

### Do:
- **Do** keep exactly one brand accent (Riqo Blue) and one reserved semantic accent (green,
  local-only) — resist adding a third UI color without a Named Rule to justify it.
- **Do** give every card a resting shadow (light) or resting border+surface-tone (dark); never
  let a card sit perfectly flush with the page background.
- **Do** use `12–16px` radii as the default; treat sharp corners as the exception, not the rule.
- **Do** hold every color pair to WCAG 2.1 AA contrast (4.5:1 body text, 3:1 large text/UI
  components) in both themes — this is a confirmed product requirement, not a nice-to-have.

### Don't:
- **Don't** use Local-Signal Green for anything except the "processed locally" claim.
- **Don't** introduce a display/serif webfont — the system font stack is a deliberate,
  confirmed choice.
- **Don't** copy iLovePDF's branding, logo, or layout — this is an explicit, binding product
  constraint, not a style preference.
- **Don't** rely on color alone to convey state (available/coming-soon/local) — pair every
  color signal with text or an icon.
