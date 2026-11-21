# Color tokens in css/base.css

`css/base.css` defines every token twice: once in `:root` for the light theme and once in `:root[data-theme="dark"]` for the dark theme. `js/theme.js` sets `data-theme` on `<html>`.

## Accent / primary (the brand color)

| Token | Role |
|---|---|
| `--primary` | **The accent color.** The brand-color skill edits this token, in `:root` only. It colors primary buttons, links, focus outlines, the active nav item and tab, the brand logo, chart lines, areas and bars, progress bars, checkboxes and the current plan's border. |
| `--primary-hover` | Background of primary buttons on hover. A darker shade of `--primary` in the light theme and a lighter one in the dark theme. |
| `--primary-soft` | Pale tint used behind the active nav link, primary badges and avatars, and for the input focus ring. |
| `--on-primary` | Text color on `--primary` backgrounds, such as primary buttons and the logo. |

## Neutrals

| Token | Role |
|---|---|
| `--bg` | Page background |
| `--surface` | Cards and panels |
| `--surface-2` | Hover states, table headers and the progress track |
| `--border` | Borders |
| `--text` | Body text |
| `--text-muted` | Secondary text |
| `--overlay` | Backdrop behind modals and the mobile nav |

## Status

Each status pairs a solid color with a `-soft` tint for badge backgrounds:

- `--success` / `--success-soft`
- `--warning` / `--warning-soft`
- `--danger` / `--danger-soft`
- `--info` / `--info-soft`
