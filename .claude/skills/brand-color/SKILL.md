---
name: brand-color
description: Change the Maha Platform dashboard's accent/brand color by editing the --primary design token in css/base.css. Use when the user says "change the brand color", "make the accent teal", "re-theme the dashboard", "change the primary color", or otherwise names a new accent color for the app. Accepts CSS color names or hex values.
---

# Brand color

This skill changes the dashboard's accent color by editing a single token: `--primary` in the light-theme `:root` block of `css/base.css`. It reads that one file, makes that one edit, and touches no other file or token. All the color tokens are listed in [tokens.md](tokens.md).

## Steps

1. **Resolve the color.** Accept either a hex value (`#0d9488`, `#0d9`) or a CSS color name (`teal`). Convert names to lowercase 6-digit hex and expand 3-digit hex to 6 digits, because every token in the file is written in 6-digit hex. If the input is neither a hex value nor a CSS color name, ask for a hex value instead of guessing.
2. **Read** `css/base.css`. Find `--primary:` in the first `:root { ... }` block, which is the light theme, and note its current value. Match `--primary:` including the colon, so that `--primary-hover` and `--primary-soft` don't match.
3. **Edit** only that line. Include the old value in the text you match, because the dark block (`:root[data-theme="dark"]`) also defines `--primary` and that line must not change.
4. **Report** the change in one line: `--primary: <old> → <new>` (css/base.css, light theme). Then add these notes:
   - The dark theme's `--primary` and the companion tokens `--primary-hover` and `--primary-soft` were not changed and still use the old hue. Offer to update them if the user wants a full re-theme.
   - If the new color is light (yellow, lime, light cyan …), warn that the white button text (`--on-primary`) may drop below 4.5:1 contrast.
