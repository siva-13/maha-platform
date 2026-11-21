# Maha Platform — SaaS Dashboard

A dependency-free SaaS admin dashboard built with plain HTML, CSS and JavaScript.
Currently a UI shell running on mock data (no backend).

## Run

Open `login.html` in a browser and sign in with any email/password.

Or serve the folder over HTTP:

```sh
npx serve .
# or
python -m http.server 8000
```

## Modules

| Menu            | Route         | What's there                                                        |
|-----------------|---------------|---------------------------------------------------------------------|
| Dashboard       | `#/dashboard` | KPIs, revenue & signup charts, recent activity, top customers, seats |
| Users & Roles   | `#/users`     | User table (search/filter/sort/paginate), invite, edit role, suspend; role permission matrix |
| Billing         | `#/billing`   | Current plan, plan comparison & switching, payment method, invoices |

Changes (invites, roles, plan, card) are saved to `localStorage`. Use **user menu → Reset demo data** to start over.

The light/dark toggle (moon/sun button in the top bar and on the sign-in page) follows the OS setting until clicked; the choice is
then saved in `localStorage` (`maha.theme`) and survives reset and sign-out.

## Structure

```
index.html          App shell (sidebar, topbar, <main id="view">)
login.html          Mock sign-in
css/base.css        Design tokens (light + dark), reset, typography
css/layout.css      Sidebar/topbar layout, grids, responsive breakpoints
css/components.css  Cards, buttons, tables, badges, modal, tabs, charts…
js/theme.js         App.theme: light/dark, system default, saved choice (loaded in <head>)
js/data.js          Mock data + App.store (persisted state)
js/ui.js            App.ui helpers: el(), formatters, modal, toast, dataTable
js/charts.js        App.charts.line / App.charts.bar (SVG)
js/router.js        Hash router
js/pages/*.js       One file per menu page
js/app.js           Boot: auth guard, menu definition, user menu
```

## Adding a new menu

1. Create `js/pages/reports.js`:

   ```js
   (function (App) {
     var ui = App.ui;
     App.pages.reports = {
       title: "Reports",
       render: function (view) {
         view.appendChild(ui.el("div.card.card-body", ui.el("h1", "Reports")));
       }
     };
   })(window.App);
   ```

2. Add `<script src="js/pages/reports.js"></script>` in `index.html` before `js/app.js`.
3. Add `{ id: "reports", label: "Reports", icon: ui.icons.dashboard }` to `App.menu` in `js/app.js`
   (add a new SVG path to `ui.icons` if you want a custom icon).
