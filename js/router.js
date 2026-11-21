/* Hash router: #/dashboard, #/users, #/billing ... */
window.App = window.App || {};
App.pages = App.pages || {};

(function (App) {
  var DEFAULT_ROUTE = "dashboard";

  function currentRoute() {
    var hash = location.hash.replace(/^#\/?/, "");
    return hash.split("/")[0] || DEFAULT_ROUTE;
  }

  function render() {
    var route = currentRoute();
    var page = App.pages[route];
    var view = document.getElementById("view");
    var title = document.getElementById("page-title");

    document.querySelectorAll(".nav-link").forEach(function (a) {
      if (a.dataset.route === route) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });

    view.innerHTML = "";
    if (!page) {
      title.textContent = "Not found";
      view.appendChild(App.ui.el("div.card.card-body",
        App.ui.el("h2", "Page not found"),
        App.ui.el("p.muted", { style: "margin-top:8px" }, "There is no page at “" + route + "”. "),
        App.ui.el("a", { href: "#/" + DEFAULT_ROUTE, style: "display:inline-block;margin-top:12px" }, "Go to dashboard")
      ));
      return;
    }
    title.textContent = page.title;
    document.title = page.title + " · Maha Platform";
    page.render(view);
    view.focus({ preventScroll: true });
    window.scrollTo(0, 0);
    document.body.classList.remove("nav-open");
  }

  App.router = {
    start: function () {
      window.addEventListener("hashchange", render);
      if (!location.hash) location.replace("#/" + DEFAULT_ROUTE);
      render();
    },
    refresh: render
  };
})(window.App);
