# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Maha Platform is a SaaS admin dashboard UI shell written in plain HTML, CSS and JavaScript. It has no backend, no dependencies, no build step, no package manager, no tests and no linter. All data is mock data, and changes are kept in `localStorage`. The only external resource is the Inter font from Google Fonts.

## Running

Open `login.html` in a browser. Any valid-looking email and any non-empty password signs you in. You can also serve the folder over HTTP:

```sh
npx serve .
# or
python -m http.server 8000
```

To check a change, reload the page. **User menu → Reset demo data** restores the seed state.

## Code conventions

- **ES5, no modules.** Every file is an IIFE, `(function (App) { ... })(window.App);`, that hangs its exports off the global `window.App` namespace. Code uses `var`, `function` expressions and string concatenation, with no arrow functions, template literals, `let`/`const` or `import`. Keep to this style.
- **Script order in `index.html` is the dependency graph:** `data.js` → `ui.js` → `charts.js` → `router.js` → `pages/*.js` → `app.js`. `app.js` must stay last because it boots the app. `theme.js` loads in `<head>`, before the CSS, so `data-theme` is set before first paint. `login.html` loads only `theme.js` and `ui.js`.
- **Wrap every `localStorage` access in try/catch.** The app must keep working when storage is blocked. For example, the auth guard lets the user in rather than loop on the login page.

## Architecture

### Global namespace (`window.App`)

| Name | File | Purpose |
|---|---|---|
| `App.store` | `js/data.js` | Persisted mutable state (`state`, `save()`, `reset()`) |
| `App.plans`, `App.permissionLabels`, `App.metrics` | `js/data.js` | Static reference data. Not persisted. |
| `App.ui` | `js/ui.js` | DOM builder, formatters, icons, modal/confirm, toast, `dataTable`, `themeToggle` |
| `App.charts` | `js/charts.js` | `line()` and `bar()`, which return SVG elements |
| `App.router` | `js/router.js` | Hash router (`start()`, `refresh()`) |
| `App.pages.<id>` | `js/pages/*.js` | One page per route |
| `App.menu` | `js/app.js` | Sidebar menu definition |
| `App.theme` | `js/theme.js` | Light/dark state |

### DOM building: `ui.el`

All UI is built in JS with the hyperscript helper `ui.el("tag.class1.class2", attrs?, ...children)`. HTML templates and innerHTML strings are not used.

- The tag string supports classes only, not `#id` or `[attr]`. Put ids in `attrs`.
- `attrs` is optional. If the second argument is a Node, string or array, it is treated as a child.
- `on*` keys with function values become event listeners. `html` sets innerHTML. `class` appends classes.
- A non-string value whose key is a DOM property (`checked`, `disabled`, `colSpan`, …) is set as a property. Everything else is set as an attribute, and `true` becomes `""`.
- `null` and `false` attrs and children are skipped, so conditional children can be written inline. Nested arrays are flattened.

### Pages and routing

- A page is `App.pages.<id> = { title, render(view) }`. On every `hashchange`, the router empties `<main id="view">` and calls `render` again. Pages have no teardown or lifecycle hooks.
- Module-level variables in a page file survive navigation. For example, `activeTab` in `users.js` remembers the selected tab.
- Steps to add a menu page (also in README):
  1. Create `js/pages/<id>.js` that registers `App.pages.<id>`.
  2. Add a `<script>` tag for it in `index.html` before `app.js`.
  3. Add `{ id, label, icon }` to `App.menu` in `js/app.js`. Icons are SVG inner-markup strings in `ui.icons`.

### State mutation pattern

To change data, mutate `App.store.state` in place, call `App.store.save()`, then re-render one of two ways:
- `table.refresh()` re-renders a `ui.dataTable`. Pass `rows` as a **function**, e.g. `rows: function () { return App.store.state.users; }`, so the table reads fresh state each time.
- `App.router.refresh()` re-renders the whole current page.

### localStorage keys

- `maha.auth` is the mock session. `app.js` redirects to `login.html` when it is missing.
- `maha.store.v1` holds the persisted store. `load()` returns the saved JSON exactly as stored and does not merge it with `seed()`. **If you add or rename fields in `seed()`, existing browsers will not get them.** Either bump the key version or reset demo data.
- `maha.theme` holds the explicit theme choice. It survives reset and sign-out. When it is absent, the theme follows the OS. `theme.js` also syncs this key across open tabs.

### Styling and theming

- Design tokens are CSS custom properties in `css/base.css`: `:root` for light and `:root[data-theme="dark"]` for dark. Use the tokens (`var(--danger)`, `var(--text-muted)`, …) instead of hard-coded colors. The dark palette is tuned so text pairs meet WCAG AA, and `--on-primary` is dark in dark mode.
- Charts set no colors inline. They emit classes (`.line`, `.area`, `.bar`, `.pt`, `.grid-line`) that `css/components.css` styles with tokens.
- `css/layout.css` has three responsive breakpoints: 1200px (collapsed icon sidebar), 900px (off-canvas sidebar toggled by `body.nav-open`) and 560px (single-column grids).
- Accessibility patterns are already in place: `ui.modal` traps focus and restores it on close, sortable table headers are keyboard-operable, and nav links get `aria-current`. New UI should follow the same patterns.
