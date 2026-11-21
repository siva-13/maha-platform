/* Dashboard / Overview page */
(function (App) {
  var ui = App.ui;

  function formatKpi(k) {
    if (k.format === "currency") return ui.formatCurrency(k.value);
    if (k.format === "percent") return k.value + "%";
    return ui.formatNumber(k.value);
  }

  function kpiTile(k) {
    // For metrics like churn, a decrease is good news.
    var good = k.invert ? k.delta < 0 : k.delta > 0;
    var arrow = k.delta > 0 ? "▲" : "▼";
    return ui.el("div.card.kpi",
      ui.el("div.kpi-label", k.label),
      ui.el("div.kpi-value", formatKpi(k)),
      ui.el("div.kpi-delta." + (good ? "up" : "down"),
        arrow + " " + Math.abs(k.delta) + (k.format === "percent" ? " pts" : "%"),
        ui.el("span.muted", { style: "font-weight:400" }, " vs last month"))
    );
  }

  function chartCard(title, subtitle, chart) {
    return ui.el("div.card",
      ui.el("div.card-header", ui.el("div", ui.el("h2", title), ui.el("p.muted.small", subtitle))),
      ui.el("div.card-body", chart)
    );
  }

  App.pages.dashboard = {
    title: "Dashboard",
    render: function (view) {
      var m = App.metrics;
      var state = App.store.state;
      var k = function (v) { return "$" + Math.round(v / 1000) + "k"; };

      var activeUsers = state.users.filter(function (u) { return u.status === "Active"; }).length;
      var plan = App.plans.filter(function (p) { return p.id === state.org.plan; })[0];

      view.appendChild(ui.el("div.page-header",
        ui.el("div",
          ui.el("h1", "Welcome back, " + state.currentUser.name.split(" ")[0]),
          ui.el("p.muted", "Here’s what’s happening across " + state.org.name + " this month.")),
        ui.el("div.toolbar",
          ui.el("button.btn", { type: "button", onclick: function () { ui.toast("Report exported (demo)"); } },
            ui.icon(ui.icons.download, 16), "Export"))
      ));

      view.appendChild(ui.el("div.stack",
        ui.el("div.grid.grid-4", m.kpis.map(kpiTile)),

        ui.el("div.grid.grid-2-1",
          chartCard("Revenue", "Monthly recurring revenue, last 12 months",
            App.charts.line(m.months, m.mrr, { format: ui.formatCurrency, axisFormat: k, label: "MRR over the last 12 months" })),
          ui.el("div.card",
            ui.el("div.card-header", ui.el("h2", "Recent activity")),
            ui.el("ul.list", m.activity.map(function (a) {
              return ui.el("li.list-item",
                ui.el("span.dot"),
                ui.el("div.grow", a.text),
                ui.el("span.muted.small", ui.minutesAgo(a.time)));
            })))
        ),

        ui.el("div.grid.grid-2",
          chartCard("New signups", "Accounts created per month",
            App.charts.bar(m.months, m.signups, { format: ui.formatNumber, label: "Signups per month" })),
          ui.el("div.card",
            ui.el("div.card-header", ui.el("h2", "Top customers"), ui.el("span.muted.small", "by MRR")),
            ui.el("div.table-wrap", ui.el("table.table",
              ui.el("thead", ui.el("tr", ui.el("th", "Customer"), ui.el("th", "Plan"), ui.el("th.num", "MRR"))),
              ui.el("tbody", m.topCustomers.map(function (c) {
                return ui.el("tr",
                  ui.el("td", ui.el("div.person", ui.el("span.avatar", ui.initials(c.name)), ui.el("span.person-name", c.name))),
                  ui.el("td", ui.badge(c.plan, c.plan === "Enterprise" ? "primary" : null)),
                  ui.el("td.num", ui.formatCurrency(c.mrr)));
              }))
            )))
        ),

        ui.el("div.card.card-body",
          ui.el("div", { style: "display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:10px" },
            ui.el("div", ui.el("h3", "Seat usage"), ui.el("p.muted.small", plan.name + " plan")),
            ui.el("strong", activeUsers + " / " + state.org.seats + " seats")),
          ui.el("div.progress", { role: "progressbar", "aria-valuemin": 0, "aria-valuemax": state.org.seats, "aria-valuenow": activeUsers },
            ui.el("span", { style: "width:" + Math.min(100, (activeUsers / state.org.seats) * 100) + "%" }))
        )
      ));
    }
  };
})(window.App);
