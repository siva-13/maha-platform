/* Billing & Subscriptions page */
(function (App) {
  var ui = App.ui;

  function planById(id) {
    return App.plans.filter(function (p) { return p.id === id; })[0];
  }

  function changePlan(plan) {
    var state = App.store.state;
    var current = planById(state.org.plan);
    var activeUsers = state.users.filter(function (u) { return u.status !== "Suspended"; }).length;
    var upgrade = plan.price > current.price;

    if (plan.seats < activeUsers) {
      ui.modal({
        title: "Can’t switch to " + plan.name,
        body: ui.el("p", "The " + plan.name + " plan allows " + plan.seats + " seats, but you have " + activeUsers +
          " active or invited users. Suspend some users first."),
        actions: [{ label: "OK", primary: true }]
      });
      return;
    }

    ui.confirm(
      (upgrade ? "Upgrade" : "Downgrade") + " to " + plan.name + "?",
      "Your plan will change from " + current.name + " (" + ui.formatCurrency(current.price) + "/seat) to " +
        plan.name + " (" + ui.formatCurrency(plan.price) + "/seat). Changes are prorated on your next invoice.",
      upgrade ? "Upgrade" : "Downgrade",
      function () {
        state.org.plan = plan.id;
        state.org.seats = Math.min(Math.max(state.org.seats, activeUsers), plan.seats);
        App.store.save();
        App.router.refresh();
        ui.toast("You’re now on the " + plan.name + " plan");
      });
  }

  function updateCardModal() {
    var pm = App.store.state.paymentMethod;
    var number = ui.el("input.input", { id: "cc-number", inputmode: "numeric", placeholder: "4242 4242 4242 4242", autocomplete: "off" });
    var expiry = ui.el("input.input", { id: "cc-exp", placeholder: "MM/YY", autocomplete: "off" });
    var error = ui.el("p.small", { style: "color:var(--danger);min-height:18px" });
    ui.modal({
      title: "Update payment method",
      body: ui.el("div",
        ui.el("p.muted.small", { style: "margin-bottom:14px" }, "Demo only — card details are not sent anywhere."),
        ui.el("div.field", ui.el("label", { for: "cc-number" }, "Card number"), number),
        ui.el("div.field", ui.el("label", { for: "cc-exp" }, "Expiry"), expiry),
        error),
      actions: [
        { label: "Cancel" },
        { label: "Save card", primary: true, onClick: function (close) {
          var digits = number.value.replace(/\D/g, "");
          if (digits.length < 12) { error.textContent = "Enter a valid card number."; number.focus(); return; }
          if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry.value.trim())) { error.textContent = "Expiry must be MM/YY."; expiry.focus(); return; }
          pm.last4 = digits.slice(-4);
          pm.expiry = expiry.value.trim();
          pm.brand = digits[0] === "5" ? "Mastercard" : digits[0] === "3" ? "Amex" : "Visa";
          App.store.save();
          close();
          App.router.refresh();
          ui.toast("Payment method updated");
        } }
      ]
    });
  }

  App.pages.billing = {
    title: "Billing",
    render: function (view) {
      var state = App.store.state;
      var plan = planById(state.org.plan);
      var monthly = plan.price * state.org.seats;
      var nextDate = new Date();
      nextDate.setMonth(nextDate.getMonth() + 1, 1);
      var pm = state.paymentMethod;

      view.appendChild(ui.el("div.page-header",
        ui.el("div",
          ui.el("h1", "Billing & Subscriptions"),
          ui.el("p.muted", "Manage your plan, payment method and invoices."))
      ));

      view.appendChild(ui.el("div.stack",
        ui.el("div.grid.grid-3",
          ui.el("div.card.kpi",
            ui.el("div.kpi-label", "Current plan"),
            ui.el("div.kpi-value", plan.name),
            ui.el("div.muted.small", ui.formatCurrency(plan.price) + " per seat / month")),
          ui.el("div.card.kpi",
            ui.el("div.kpi-label", "Next invoice"),
            ui.el("div.kpi-value", ui.formatCurrency(monthly)),
            ui.el("div.muted.small", "Due " + ui.formatDate(nextDate.toISOString()) + " · " + state.org.seats + " seats")),
          ui.el("div.card.kpi",
            ui.el("div.kpi-label", "Payment method"),
            ui.el("div.kpi-value", pm.brand + " •••• " + pm.last4),
            ui.el("div", { style: "display:flex;justify-content:space-between;align-items:center;gap:8px" },
              ui.el("span.muted.small", "Expires " + pm.expiry),
              ui.el("button.btn.btn-sm", { type: "button", onclick: updateCardModal }, "Update")))
        ),

        ui.el("div",
          ui.el("h2", { style: "margin:8px 0 12px" }, "Plans"),
          ui.el("div.grid.grid-3", App.plans.map(function (p) {
            var isCurrent = p.id === plan.id;
            return ui.el("div.card.plan" + (isCurrent ? ".current" : ""),
              ui.el("div", { style: "display:flex;justify-content:space-between;align-items:center" },
                ui.el("h3", p.name), isCurrent ? ui.badge("Current", "primary") : null),
              ui.el("div.plan-price", ui.formatCurrency(p.price), ui.el("span", " / seat / mo")),
              ui.el("ul", p.features.map(function (f) { return ui.el("li", f); })),
              ui.el("button.btn.btn-block" + (!isCurrent && p.price > plan.price ? ".btn-primary" : ""), {
                type: "button", disabled: isCurrent, onclick: function () { changePlan(p); }
              }, isCurrent ? "Current plan" : p.price > plan.price ? "Upgrade" : "Downgrade"));
          }))
        ),

        ui.el("div",
          ui.el("h2", { style: "margin:8px 0 12px" }, "Invoices"),
          ui.dataTable({
            rows: function () { return state.invoices; },
            searchKeys: ["id", "description"],
            filters: [{ key: "status", label: "Statuses", options: ["Paid", "Open", "Failed"] }],
            pageSize: 6,
            columns: [
              { key: "id", label: "Invoice", sortable: true, render: function (i) { return ui.el("strong", i.id); } },
              { key: "date", label: "Date", sortable: true, render: function (i) { return ui.formatDate(i.date); } },
              { key: "description", label: "Description" },
              { key: "amount", label: "Amount", sortable: true, align: "num", render: function (i) { return ui.formatCurrency(i.amount, 2); } },
              { key: "status", label: "Status", sortable: true, render: function (i) { return ui.statusBadge(i.status); } },
              { key: "dl", label: "", render: function (i) {
                return ui.el("button.btn.btn-sm", {
                  type: "button", "aria-label": "Download " + i.id,
                  onclick: function () { ui.toast(i.id + ".pdf downloaded (demo)"); }
                }, ui.icon(ui.icons.download, 14), "PDF");
              } }
            ]
          }).element
        )
      ));
    }
  };
})(window.App);
