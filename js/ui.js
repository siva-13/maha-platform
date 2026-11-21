/* Shared UI helpers: DOM builder, formatters, modal, toast, data table. */
window.App = window.App || {};

(function (App) {
  var ui = {};

  /** el("div.card", {onclick: fn, "aria-label": "x"}, child1, "text", [child2]) */
  ui.el = function (tag, attrs) {
    var parts = tag.split(".");
    var node = document.createElement(parts[0] || "div");
    if (parts.length > 1) node.className = parts.slice(1).join(" ");
    var children = Array.prototype.slice.call(arguments, 2);
    if (attrs && (attrs.nodeType || typeof attrs !== "object" || Array.isArray(attrs))) {
      children.unshift(attrs);
      attrs = null;
    }
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        var v = attrs[k];
        if (v == null || v === false) return;
        if (k.indexOf("on") === 0 && typeof v === "function") node.addEventListener(k.slice(2), v);
        else if (k === "html") node.innerHTML = v;
        else if (k === "class") node.className += (node.className ? " " : "") + v;
        else if (k in node && typeof v !== "string") node[k] = v;
        else node.setAttribute(k, v === true ? "" : v);
      });
    }
    (function append(list) {
      list.forEach(function (c) {
        if (c == null || c === false) return;
        if (Array.isArray(c)) append(c);
        else node.appendChild(c.nodeType ? c : document.createTextNode(String(c)));
      });
    })(children);
    return node;
  };

  ui.formatCurrency = function (n, decimals) {
    return new Intl.NumberFormat("en-US", {
      style: "currency", currency: "USD",
      minimumFractionDigits: decimals || 0, maximumFractionDigits: decimals || 0
    }).format(n);
  };
  ui.formatNumber = function (n) { return new Intl.NumberFormat("en-US").format(n); };
  ui.formatDate = function (iso) {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };
  ui.timeAgo = function (iso) {
    var mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
    return ui.minutesAgo(mins);
  };
  ui.minutesAgo = function (mins) {
    if (mins < 1) return "just now";
    if (mins < 60) return mins + "m ago";
    var h = Math.round(mins / 60);
    if (h < 24) return h + "h ago";
    var d = Math.round(h / 24);
    return d + "d ago";
  };
  ui.initials = function (name) {
    return name.split(/\s+/).map(function (p) { return p[0]; }).slice(0, 2).join("").toUpperCase();
  };

  ui.badge = function (text, variant) {
    return ui.el("span.badge" + (variant ? ".badge-" + variant : ""), text);
  };
  ui.statusBadge = function (status) {
    var map = { Active: "success", Paid: "success", Invited: "info", Open: "warning", Suspended: "danger", Failed: "danger" };
    return ui.badge(status, map[status]);
  };

  ui.icon = function (paths, size) {
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("width", size || 20);
    svg.setAttribute("height", size || 20);
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "2");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");
    svg.setAttribute("aria-hidden", "true");
    svg.innerHTML = paths;
    return svg;
  };
  ui.icons = {
    dashboard: '<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    billing: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>',
    menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
    close: '<path d="M18 6 6 18M6 6l12 12"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',
    bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>',
    moon: '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>'
  };

  /* ----- Theme toggle (state lives in App.theme, js/theme.js) ----- */
  ui.themeToggle = function (extraClass) {
    var btn = ui.el("button.btn.btn-icon", {
      type: "button", class: extraClass, "aria-label": "Dark mode",
      onclick: function () { App.theme.toggle(); }
    });
    function sync(theme) {
      var dark = theme === "dark";
      btn.setAttribute("aria-pressed", String(dark));
      btn.title = dark ? "Switch to light theme" : "Switch to dark theme";
      btn.innerHTML = "";
      btn.appendChild(ui.icon(dark ? ui.icons.sun : ui.icons.moon, 18));
    }
    sync(App.theme.current());
    App.theme.onChange(sync);
    return btn;
  };

  /* ----- Toast ----- */
  ui.toast = function (message) {
    var host = document.querySelector(".toasts");
    if (!host) { host = ui.el("div.toasts", { role: "status", "aria-live": "polite" }); document.body.appendChild(host); }
    var t = ui.el("div.toast", message);
    host.appendChild(t);
    setTimeout(function () { t.remove(); }, 2800);
  };

  /* ----- Modal ----- */
  /** ui.modal({ title, body: Node, actions: [{label, primary, danger, onClick(close) }] }) */
  ui.modal = function (opts) {
    var previousFocus = document.activeElement;
    var overlay, dialog;

    function close() {
      document.removeEventListener("keydown", onKey);
      overlay.remove();
      if (previousFocus && previousFocus.focus) previousFocus.focus();
    }
    function onKey(e) {
      if (e.key === "Escape") { close(); return; }
      if (e.key !== "Tab") return;
      var focusables = dialog.querySelectorAll("button, input, select, textarea, a[href], [tabindex]:not([tabindex='-1'])");
      if (!focusables.length) return;
      var first = focusables[0], last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }

    var titleId = "modal-title-" + Date.now();
    dialog = ui.el("div.modal", { role: "dialog", "aria-modal": "true", "aria-labelledby": titleId },
      ui.el("div.modal-header",
        ui.el("h2", { id: titleId }, opts.title),
        ui.el("button.btn.btn-icon", { type: "button", "aria-label": "Close", onclick: close }, ui.icon(ui.icons.close))
      ),
      ui.el("div.modal-body", opts.body),
      ui.el("div.modal-footer", (opts.actions || []).map(function (a) {
        return ui.el("button.btn" + (a.primary ? ".btn-primary" : "") + (a.danger ? ".btn-danger" : ""),
          { type: "button", onclick: function () { a.onClick ? a.onClick(close) : close(); } }, a.label);
      }))
    );
    overlay = ui.el("div.modal-overlay", { onmousedown: function (e) { if (e.target === overlay) close(); } }, dialog);
    document.body.appendChild(overlay);
    document.addEventListener("keydown", onKey);
    var firstInput = dialog.querySelector(".modal-body input, .modal-body select") || dialog.querySelector(".modal-footer .btn-primary");
    if (firstInput) firstInput.focus();
    return { close: close, element: dialog };
  };

  ui.confirm = function (title, message, confirmLabel, onConfirm) {
    ui.modal({
      title: title,
      body: ui.el("p", message),
      actions: [
        { label: "Cancel" },
        { label: confirmLabel, primary: true, onClick: function (close) { close(); onConfirm(); } }
      ]
    });
  };

  /* ----- Data table with search, sort, pagination ----- */
  /**
   * ui.dataTable({
   *   columns: [{ key, label, sortable, align: "num", render(row) -> Node|string, sortValue(row) }],
   *   rows: () => array,        // function so the table always reads fresh data
   *   searchKeys: ["name", ...],
   *   filters: [{ key, label, options: [...] }],
   *   pageSize: 8,
   *   toolbarExtra: Node
   * })
   * returns { element, refresh() }
   */
  ui.dataTable = function (cfg) {
    var state = { query: "", sortKey: null, sortDir: 1, page: 0, filters: {} };
    var pageSize = cfg.pageSize || 10;

    var search = cfg.searchKeys ? ui.el("input.input", {
      type: "search", placeholder: "Search…", "aria-label": "Search",
      oninput: function () { state.query = search.value.trim().toLowerCase(); state.page = 0; render(); }
    }) : null;

    var filterEls = (cfg.filters || []).map(function (f) {
      var sel = ui.el("select.select", {
        "aria-label": f.label,
        onchange: function () { state.filters[f.key] = sel.value; state.page = 0; render(); }
      }, ui.el("option", { value: "" }, "All " + f.label.toLowerCase()),
        f.options.map(function (o) { return ui.el("option", { value: o }, o); }));
      return sel;
    });

    var thead = ui.el("thead");
    var tbody = ui.el("tbody");
    var info = ui.el("span.muted.small");
    var prevBtn = ui.el("button.btn.btn-sm", { type: "button", onclick: function () { state.page--; render(); } }, "Previous");
    var nextBtn = ui.el("button.btn.btn-sm", { type: "button", onclick: function () { state.page++; render(); } }, "Next");

    var element = ui.el("div.card",
      (search || filterEls.length || cfg.toolbarExtra) ? ui.el("div.card-header",
        ui.el("div.toolbar", search, filterEls),
        cfg.toolbarExtra || null
      ) : null,
      ui.el("div.table-wrap", ui.el("table.table", thead, tbody)),
      ui.el("div.pager", info, ui.el("div.toolbar", prevBtn, nextBtn))
    );

    function renderHead() {
      thead.innerHTML = "";
      thead.appendChild(ui.el("tr", cfg.columns.map(function (c) {
        var active = state.sortKey === c.key;
        var th = ui.el("th" + (c.sortable ? ".sortable" : "") + (c.align === "num" ? ".num" : ""), {
          scope: "col",
          "aria-sort": active ? (state.sortDir > 0 ? "ascending" : "descending") : null,
          tabindex: c.sortable ? "0" : null,
          onclick: c.sortable ? function () { toggleSort(c.key); } : null,
          onkeydown: c.sortable ? function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleSort(c.key); } } : null
        }, c.label, active ? ui.el("span.sort-ind", state.sortDir > 0 ? "▲" : "▼") : null);
        return th;
      })));
    }

    function toggleSort(key) {
      if (state.sortKey === key) state.sortDir *= -1;
      else { state.sortKey = key; state.sortDir = 1; }
      render();
    }

    function render() {
      var rows = cfg.rows().slice();
      if (state.query) {
        rows = rows.filter(function (r) {
          return cfg.searchKeys.some(function (k) { return String(r[k]).toLowerCase().indexOf(state.query) !== -1; });
        });
      }
      Object.keys(state.filters).forEach(function (k) {
        if (state.filters[k]) rows = rows.filter(function (r) { return r[k] === state.filters[k]; });
      });
      if (state.sortKey) {
        var col = cfg.columns.filter(function (c) { return c.key === state.sortKey; })[0];
        var val = col.sortValue || function (r) { return r[col.key]; };
        rows.sort(function (a, b) {
          var x = val(a), y = val(b);
          return (x > y ? 1 : x < y ? -1 : 0) * state.sortDir;
        });
      }

      var total = rows.length;
      var pages = Math.max(1, Math.ceil(total / pageSize));
      state.page = Math.min(Math.max(0, state.page), pages - 1);
      var start = state.page * pageSize;
      var pageRows = rows.slice(start, start + pageSize);

      renderHead();
      tbody.innerHTML = "";
      if (!pageRows.length) {
        tbody.appendChild(ui.el("tr", ui.el("td.table-empty", { colSpan: cfg.columns.length }, "No results found")));
      }
      pageRows.forEach(function (r) {
        tbody.appendChild(ui.el("tr", cfg.columns.map(function (c) {
          return ui.el("td" + (c.align === "num" ? ".num" : ""), c.render ? c.render(r) : r[c.key]);
        })));
      });

      info.textContent = total ? "Showing " + (start + 1) + "–" + (start + pageRows.length) + " of " + total : "0 results";
      prevBtn.disabled = state.page === 0;
      nextBtn.disabled = state.page >= pages - 1;
    }

    render();
    return { element: element, refresh: render };
  };

  App.ui = ui;
})(window.App);
