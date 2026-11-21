/* App boot: auth guard, sidebar menu, user menu, router start. */
(function (App) {
  var ui = App.ui;
  var AUTH_KEY = "maha.auth";

  // To add a new module: add an entry here and create js/pages/<id>.js registering App.pages.<id>.
  App.menu = [
    { section: "Overview" },
    { id: "dashboard", label: "Dashboard", icon: ui.icons.dashboard },
    { section: "Management" },
    { id: "users", label: "Users & Roles", icon: ui.icons.users },
    { id: "billing", label: "Billing", icon: ui.icons.billing }
  ];

  function storageDel(key) { try { localStorage.removeItem(key); } catch (e) { /* ignore */ } }

  // Mock auth guard. If storage is unavailable we let the user in rather than loop on the login page.
  try {
    if (!localStorage.getItem(AUTH_KEY)) { location.replace("login.html"); return; }
  } catch (e) { /* storage blocked — continue */ }

  function renderNav() {
    var nav = document.getElementById("nav");
    nav.innerHTML = "";
    App.menu.forEach(function (item) {
      if (item.section) { nav.appendChild(ui.el("div.nav-section", item.section)); return; }
      nav.appendChild(ui.el("a.nav-link", { href: "#/" + item.id, "data-route": item.id, title: item.label },
        ui.icon(item.icon), ui.el("span.nav-label", item.label)));
    });
  }

  function setupTopbar() {
    var menuToggle = document.getElementById("menu-toggle");
    menuToggle.appendChild(ui.icon(ui.icons.menu, 18));
    menuToggle.addEventListener("click", function () { document.body.classList.toggle("nav-open"); });
    document.querySelector(".backdrop").addEventListener("click", function () { document.body.classList.remove("nav-open"); });

    var notifBtn = document.getElementById("notif-btn");
    notifBtn.parentNode.insertBefore(ui.themeToggle(), notifBtn);
    notifBtn.appendChild(ui.icon(ui.icons.bell, 18));
    notifBtn.addEventListener("click", function () { ui.toast("No new notifications"); });

    // User menu
    var me = App.store.state.currentUser;
    var userBtn = document.getElementById("user-btn");
    var userMenu = document.getElementById("user-menu");
    userBtn.appendChild(ui.el("span.avatar", ui.initials(me.name)));
    userBtn.appendChild(ui.el("span.user-name", me.name));
    userMenu.appendChild(ui.el("div.dropdown-head",
      ui.el("div.person-name", me.name), ui.el("div.muted.small", me.email)));
    userMenu.appendChild(ui.el("button.dropdown-item", { type: "button", onclick: function () {
      closeMenu();
      ui.confirm("Reset demo data?", "All changes to users, roles and billing will be discarded.", "Reset", function () {
        App.store.reset();
        App.router.refresh();
        ui.toast("Demo data reset");
      });
    } }, "Reset demo data"));
    userMenu.appendChild(ui.el("button.dropdown-item", { type: "button", onclick: function () {
      storageDel(AUTH_KEY);
      location.href = "login.html";
    } }, "Sign out"));

    function closeMenu() { userMenu.hidden = true; userBtn.setAttribute("aria-expanded", "false"); }
    userBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      var open = userMenu.hidden;
      userMenu.hidden = !open;
      userBtn.setAttribute("aria-expanded", String(open));
    });
    document.addEventListener("click", function (e) { if (!userMenu.contains(e.target)) closeMenu(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") { closeMenu(); document.body.classList.remove("nav-open"); } });
  }

  document.getElementById("org-name").textContent = App.store.state.org.name;
  renderNav();
  setupTopbar();
  App.router.start();
})(window.App);
