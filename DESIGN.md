# Design

## Theme

Light product UI for people planning in ordinary rooms, event spaces, or on mobile outside. The interface should feel like a reliable checklist tool: quiet, structured, and easy to scan.

## Color Palette

- Surface: `oklch(98% 0.006 90)`
- Panel: `oklch(94% 0.008 95)`
- Text: `oklch(22% 0.012 85)`
- Muted text: `oklch(46% 0.014 82)`
- Border: `oklch(84% 0.012 88)`
- Accent: `oklch(47% 0.085 165)`
- Accent soft: `oklch(90% 0.042 165)`
- Caution: `oklch(58% 0.085 70)`

## Typography

Use a system sans stack for a native product feel. Keep headings restrained, body copy at readable line lengths, and labels compact but not dense.

## Components

Use familiar controls: segmented choices for roles, checkbox-style multi-select options, clear primary and secondary buttons, inline validation, and visible focus rings. Cards should be used only for answer choices and result groups.

## Layout

The quiz should appear immediately on `/`. Use a two-column desktop layout for quiz/results context and a single-column mobile flow. Keep the primary action near the current step and avoid nested cards.

## Motion

Use short state transitions only for selection, focus, and result reveal. Respect reduced motion.
