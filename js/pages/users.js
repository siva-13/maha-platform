/* Users & Roles page */
(function (App) {
  var ui = App.ui;
  var activeTab = "users";

  function roleNames() {
    return App.store.state.roles.map(function (r) { return r.id; });
  }

  function roleSelect(value, includeOwner) {
    var names = roleNames().filter(function (r) { return includeOwner || r !== "Owner"; });
    return ui.el("select.select", { id: "role-select" }, names.map(function (r) {
      return ui.el("option", { value: r, selected: r === value }, r);
    }));
  }

  function inviteModal(table) {
    var name = ui.el("input.input", { id: "invite-name", placeholder: "Full name", required: true });
    var email = ui.el("input.input", { id: "invite-email", type: "email", placeholder: "name@company.com", required: true });
    var role = roleSelect("Member");
    var error = ui.el("p.small", { style: "color:var(--danger);min-height:18px" });

    ui.modal({
      title: "Invite user",
      body: ui.el("form", { onsubmit: function (e) { e.preventDefault(); } },
        ui.el("div.field", ui.el("label", { for: "invite-name" }, "Name"), name),
        ui.el("div.field", ui.el("label", { for: "invite-email" }, "Email"), email),
        ui.el("div.field", ui.el("label", { for: "role-select" }, "Role"), role),
        error),
      actions: [
        { label: "Cancel" },
        { label: "Send invite", primary: true, onClick: function (close) {
          var users = App.store.state.users;
          var em = email.value.trim().toLowerCase();
          if (!name.value.trim()) { error.textContent = "Please enter a name."; name.focus(); return; }
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) { error.textContent = "Please enter a valid email."; email.focus(); return; }
          if (users.some(function (u) { return u.email === em; })) { error.textContent = "A user with this email already exists."; email.focus(); return; }
          users.unshift({
            id: "u" + Date.now(), name: name.value.trim(), email: em, role: role.value,
            status: "Invited", lastLogin: null
          });
          App.store.save();
          close();
          table.refresh();
          ui.toast("Invitation sent to " + em);
        } }
      ]
    });
  }

  function editModal(user, table) {
    var role = roleSelect(user.role, user.role === "Owner");
    ui.modal({
      title: "Edit " + user.name,
      body: ui.el("div",
        ui.el("div.person", { style: "margin-bottom:16px" },
          ui.el("span.avatar", ui.initials(user.name)),
          ui.el("div", ui.el("div.person-name", user.name), ui.el("div.muted.small", user.email))),
        ui.el("div.field", ui.el("label", { for: "role-select" }, "Role"), role)),
      actions: [
        { label: "Cancel" },
        { label: "Save changes", primary: true, onClick: function (close) {
          user.role = role.value;
          App.store.save();
          close();
          table.refresh();
          ui.toast("Role updated");
        } }
      ]
    });
  }

  function toggleStatus(user, table) {
    var suspend = user.status !== "Suspended";
    ui.confirm(
      suspend ? "Suspend user?" : "Reactivate user?",
      suspend ? user.name + " will lose access until reactivated." : user.name + " will regain access.",
      suspend ? "Suspend" : "Reactivate",
      function () {
        user.status = suspend ? "Suspended" : "Active";
        App.store.save();
        table.refresh();
        ui.toast(user.name + (suspend ? " suspended" : " reactivated"));
      });
  }

  function renderUsers(container) {
    var table;
    var inviteBtn = ui.el("button.btn.btn-primary", { type: "button", onclick: function () { inviteModal(table); } },
      ui.icon(ui.icons.plus, 16), "Invite user");

    table = ui.dataTable({
      rows: function () { return App.store.state.users; },
      searchKeys: ["name", "email"],
      filters: [
        { key: "role", label: "Roles", options: roleNames() },
        { key: "status", label: "Statuses", options: ["Active", "Invited", "Suspended"] }
      ],
      pageSize: 8,
      toolbarExtra: inviteBtn,
      columns: [
        { key: "name", label: "User", sortable: true, render: function (u) {
          return ui.el("div.person", ui.el("span.avatar", ui.initials(u.name)),
            ui.el("div", ui.el("div.person-name", u.name), ui.el("div.muted.small", u.email)));
        } },
        { key: "role", label: "Role", sortable: true, render: function (u) {
          return ui.badge(u.role, u.role === "Owner" ? "primary" : null);
        } },
        { key: "status", label: "Status", sortable: true, render: function (u) { return ui.statusBadge(u.status); } },
        { key: "lastLogin", label: "Last login", sortable: true,
          sortValue: function (u) { return u.lastLogin || ""; },
          render: function (u) { return u.lastLogin ? ui.timeAgo(u.lastLogin) : ui.el("span.muted", "Never"); } },
        { key: "actions", label: "", render: function (u) {
          if (u.role === "Owner") return ui.el("span.muted.small", "—");
          return ui.el("div.toolbar", { style: "justify-content:flex-end" },
            ui.el("button.btn.btn-sm", { type: "button", onclick: function () { editModal(u, table); } }, "Edit"),
            ui.el("button.btn.btn-sm" + (u.status === "Suspended" ? "" : ".btn-danger"),
              { type: "button", onclick: function () { toggleStatus(u, table); } },
              u.status === "Suspended" ? "Reactivate" : "Suspend"));
        } }
      ]
    });
    container.appendChild(table.element);
  }

  function renderRoles(container) {
    var state = App.store.state;
    var counts = {};
    state.users.forEach(function (u) { counts[u.role] = (counts[u.role] || 0) + 1; });

    container.appendChild(ui.el("div.grid.grid-3", state.roles.map(function (role) {
      var locked = role.id === "Owner";
      return ui.el("div.card",
        ui.el("div.card-header",
          ui.el("div", ui.el("h3", role.id), ui.el("p.muted.small", role.description)),
          ui.badge((counts[role.id] || 0) + " users")),
        ui.el("div.card-body", Object.keys(App.permissionLabels).map(function (perm) {
          var id = "perm-" + role.id + "-" + perm;
          return ui.el("div.perm-row",
            ui.el("label", { for: id }, App.permissionLabels[perm]),
            ui.el("input", {
              id: id, type: "checkbox", checked: !!role.perms[perm], disabled: locked,
              title: locked ? "Owner permissions cannot be changed" : null,
              onchange: function (e) {
                role.perms[perm] = e.target.checked;
                App.store.save();
                ui.toast(role.id + ": " + App.permissionLabels[perm] + (e.target.checked ? " enabled" : " disabled"));
              }
            }));
        }))
      );
    })));
  }

  App.pages.users = {
    title: "Users & Roles",
    render: function (view) {
      var body = ui.el("div");
      var tabs = [
        { id: "users", label: "Users", render: renderUsers },
        { id: "roles", label: "Roles & permissions", render: renderRoles }
      ];

      function show(id) {
        activeTab = id;
        tabBar.querySelectorAll(".tab").forEach(function (t) { t.setAttribute("aria-selected", String(t.dataset.tab === id)); });
        body.innerHTML = "";
        tabs.filter(function (t) { return t.id === id; })[0].render(body);
      }

      var tabBar = ui.el("div.tabs", { role: "tablist" }, tabs.map(function (t) {
        return ui.el("button.tab", { type: "button", role: "tab", "data-tab": t.id, onclick: function () { show(t.id); } }, t.label);
      }));

      var state = App.store.state;
      view.appendChild(ui.el("div.page-header",
        ui.el("div",
          ui.el("h1", "Users & Roles"),
          ui.el("p.muted", state.users.length + " members in " + state.org.name + ". Manage access and permissions."))
      ));
      view.appendChild(tabBar);
      view.appendChild(body);
      show(activeTab);
    }
  };
})(window.App);
