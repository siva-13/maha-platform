/* Light/dark theme. Loaded in <head> so data-theme is set before first paint. Follows the OS until the user picks one. */
window.App = window.App || {};

(function (App) {
  var STORAGE_KEY = "maha.theme";
  var root = document.documentElement;
  var mq = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;
  var listeners = [];

  function valid(v) { return v === "light" || v === "dark" ? v : null; }

  // Kept in memory too, so toggling still works when storage is blocked.
  var choice = null;
  try { choice = valid(localStorage.getItem(STORAGE_KEY)); } catch (e) { /* storage unavailable */ }

  function apply() {
    var theme = choice || (mq && mq.matches ? "dark" : "light");
    root.setAttribute("data-theme", theme);
    listeners.forEach(function (fn) { fn(theme); });
  }

  App.theme = {
    current: function () { return root.getAttribute("data-theme"); },
    set: function (theme) {
      choice = valid(theme);
      try {
        if (choice) localStorage.setItem(STORAGE_KEY, choice);
        else localStorage.removeItem(STORAGE_KEY);
      } catch (e) { /* ignore */ }
      apply();
    },
    toggle: function () { this.set(this.current() === "dark" ? "light" : "dark"); },
    onChange: function (fn) { listeners.push(fn); }
  };

  if (mq) {
    var onSystemChange = function () { if (!choice) apply(); };
    if (mq.addEventListener) mq.addEventListener("change", onSystemChange);
    else mq.addListener(onSystemChange);
  }
  // Keep other open tabs in sync; a removed key means "follow the system" again.
  window.addEventListener("storage", function (e) {
    if (e.key === STORAGE_KEY) { choice = valid(e.newValue); apply(); }
  });

  apply();
})(window.App);
