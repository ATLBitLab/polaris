# Design

## Theme

Light, warm parchment. The interface should feel like a well-set page from a thoughtful field guide or paperback, read at a desk under lamp light. Quiet, dignified, designed.

## Color Strategy

Restrained. Warm parchment surfaces, deep blue-black ink, one grounded clay accent. The accent appears only on primary action, current selection, the star mark, and a few numerical accents; it is not used for decoration.

Risk bands are deliberately not color-coded. There is no traffic-light vocabulary. The words "Lower," "Moderate," and "Elevated" carry the meaning typographically.

## Color Palette

OKLCH throughout. Every neutral is tinted toward warm yellow; ink is tinted toward deep blue.

- Paper (surface): `oklch(96% 0.012 80)`
- Paper deep (hover wash on rows): `oklch(93% 0.015 78)`
- Paper inset (form fields): `oklch(98% 0.008 82)`
- Ink (primary text): `oklch(22% 0.024 250)`
- Ink-2 (secondary text, body): `oklch(38% 0.022 248)`
- Ink-3 (tertiary, fine print, muted): `oklch(56% 0.018 245)`
- Rule (hairline borders): `oklch(82% 0.018 80)`
- Rule strong (heavier separators, ornaments): `oklch(70% 0.022 78)`
- Clay (accent, primary action, selection): `oklch(48% 0.108 38)`
- Clay deep (button hover, accent text): `oklch(38% 0.102 36)`
- Clay soft (selected row wash): `oklch(91% 0.038 42)`
- Focus ring: `oklch(56% 0.142 38)`

Tokens live in `src/app/globals.css` as CSS custom properties (`--paper`, `--ink`, `--clay`, etc.) and are referenced via Tailwind's `[var(--token)]` arbitrary-value syntax.

## Typography

Two families, paired across registers.

- Display (headings, wordmark, Roman numerals, italic marginalia, numbered list counters): **Newsreader** (Google Fonts, variable, optical-size axis). Loaded via `next/font/google` and exposed as `--font-display`. Used at sizes from 0.78rem (wordmark, small caps, tracked) to 2.75rem (hero h1).
- UI body (body copy, labels, form controls, buttons, navigation, fine print): **Inter** (Google Fonts, variable). Loaded via `next/font/google` and exposed as `--font-sans`. Default body is 1rem; standfirst is 1.0625rem; helper text is 0.92–0.95rem; fine print is 0.78–0.875rem.

Type scale ratio: roughly 1.2 between adjacent steps. Body line-height 1.7 for prose; 1.6 for marginalia and fine print. Body line length capped near 60ch; marginalia narrower.

Wordmark uses uppercase, 0.22em letter-spacing, weight 600, in Newsreader. Roman numerals (I., II., III.) and the numbered counters in the result panel (01, 02, ...) use Newsreader with lining figures.

## Layout

Single column, max-width 44rem (~704px), centered, with generous side padding (1.5rem mobile, 2.5rem at sm and above). No sidebars, no app shell, no sticky panels.

Reading order top to bottom:
1. Masthead: small star mark, wordmark, right-aligned tracked label.
2. Hero: display h1 (max 18ch), then a two-column block (standfirst on the left at ~60ch, italic marginalia note on the right with a top rule). On mobile, these stack.
3. Centered ornament: hairline rule, star mark, hairline rule.
4. Three numbered sections (I., II., III.). Each section starts with a top hairline, a Roman numeral baseline-aligned with a serif h2, then helper copy and the control.
5. Action row: clay primary button plus a subtle text-link reset.
6. Result panel (or placeholder before submit). Uses a 2px ink top rule to mark its weight.
7. Colophon: hairline rule, small wordmark, two short paragraphs of plainly stated stance.

Spacing rhythm uses larger vertical gaps between sections (3.5rem) and tighter spacing within (1.25–1.75rem). Cards are not used for layout; choice rows are list items separated by hairlines.

## Components

- **Wordmark + star mark**: a custom four-pointed star SVG (a north-star sextile) drawn inline at sizes 12–16px, in the clay color.
- **Section heading**: Roman numeral in clay-deep + display h2 in ink, on a single baseline, with a top hairline above the block.
- **Native select**: full-width, height 3rem, `appearance: none`, custom inline-SVG chevron, paper-inset background, hairline border, clay focus border. The 50+ states use `<optgroup>` for "Metro areas," "States," and "Other."
- **Choice row** (radio or checkbox): `<li>` with hairline top and bottom borders, full-width tap target, custom-rendered control box (5x5) keyed off the real input via `peer-*` and `:checked`. Selected rows take the clay-soft wash; hovered rows take the paper-deep wash. The control fills clay when checked, with a paper-color glyph (radio dot or checkmark SVG).
- **Primary button**: 2.75rem tall, clay background, paper text, rounded-md, with a small chevron glyph trailing the label. Hover and focus both deepen the background to clay-deep.
- **Text-link button** (reset, revise): plain ink-3 text with a hairline underline at 6px offset; hover deepens to ink and the underline darkens.
- **Result panel**: top rule is 2px ink, marking the panel's weight. Eyebrow ("Your plan") in tracked uppercase serif, then a serif display h2 with the band sentence ("Elevated planning band."), then a body paragraph (60ch), then two grouped guidance sections, each with a star mark + serif subhead and a numbered list (01, 02, ...) where the counter is serif, italic-feeling, in clay-deep.
- **Placeholder plan**: same eyebrow + an italic body paragraph in ink-3.
- **Marginalia note**: italic Newsreader, with a non-italic clay § as a leading mark, top hairline above the block.
- **Ornament**: a centered row of `[ rule | star mark | rule ]`, used once between hero and the form.

Every interactive element has visible default, hover, focus, active, and selected states. Focus is a 2px clay focus ring at 3px offset, never removed.

## Motion

Transitions are 150ms ease-out and limited to color changes on hover, focus, and selection. No layout animation, no entry choreography, no decorative motion. The result panel scrolls into view smoothly on submit (`scrollIntoView({ behavior: "smooth" })`).

`prefers-reduced-motion` collapses transition and animation durations to ~0ms globally.

## Tooling Notes

- Stack: Next.js App Router, React, Tailwind CSS v4, system fonts plus Newsreader and Inter via `next/font/google`.
- Token strategy: design tokens as CSS custom properties in `globals.css`, referenced with Tailwind arbitrary values (`bg-[var(--paper)]`, `text-[var(--ink-2)]`, etc.). Avoid Tailwind opacity modifiers on CSS-variable backgrounds; use a dedicated soft token instead.
- Fonts are exposed as CSS variables (`--font-display`, `--font-sans`) and applied via Tailwind's `font-sans` default. Utility classes `.wordmark`, `.numeral`, and `.display` opt specific elements into the serif.
