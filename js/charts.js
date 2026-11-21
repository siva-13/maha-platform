/* Minimal SVG charts (no dependencies). Colors come from CSS classes in components.css. */
window.App = window.App || {};

(function (App) {
  var NS = "http://www.w3.org/2000/svg";
  var W = 640, H = 240, PAD = { top: 16, right: 16, bottom: 28, left: 52 };

  function svgEl(tag, attrs, text) {
    var n = document.createElementNS(NS, tag);
    Object.keys(attrs || {}).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    if (text != null) n.textContent = text;
    return n;
  }

  function niceMax(v) {
    var mag = Math.pow(10, Math.floor(Math.log10(v)));
    var steps = [1, 2, 2.5, 5, 10];
    for (var i = 0; i < steps.length; i++) if (steps[i] * mag >= v) return steps[i] * mag;
    return 10 * mag;
  }

  function frame(labels, max, fmt, ariaLabel) {
    var svg = svgEl("svg", { viewBox: "0 0 " + W + " " + H, class: "chart", role: "img", "aria-label": ariaLabel });
    var plotH = H - PAD.top - PAD.bottom;
    for (var i = 0; i <= 4; i++) {
      var y = PAD.top + plotH - (plotH * i) / 4;
      svg.appendChild(svgEl("line", { x1: PAD.left, x2: W - PAD.right, y1: y, y2: y, class: "grid-line" }));
      svg.appendChild(svgEl("text", { x: PAD.left - 8, y: y + 4, "text-anchor": "end" }, fmt((max * i) / 4)));
    }
    return svg;
  }

  function scaleX(i, n, band) {
    var plotW = W - PAD.left - PAD.right;
    return band ? PAD.left + (plotW / n) * (i + 0.5) : PAD.left + (plotW * i) / (n - 1);
  }
  function scaleY(v, max) {
    var plotH = H - PAD.top - PAD.bottom;
    return PAD.top + plotH - (v / max) * plotH;
  }

  App.charts = {
    line: function (labels, values, opts) {
      opts = opts || {};
      var fmt = opts.format || String;
      var max = niceMax(Math.max.apply(null, values));
      var svg = frame(labels, max, opts.axisFormat || fmt, opts.label || "Line chart");
      var n = values.length;
      var pts = values.map(function (v, i) { return [scaleX(i, n), scaleY(v, max)]; });
      var d = pts.map(function (p, i) { return (i ? "L" : "M") + p[0].toFixed(1) + "," + p[1].toFixed(1); }).join("");
      var base = scaleY(0, max);
      svg.appendChild(svgEl("path", { d: d + "L" + pts[n - 1][0] + "," + base + "L" + pts[0][0] + "," + base + "Z", class: "area" }));
      svg.appendChild(svgEl("path", { d: d, class: "line" }));
      pts.forEach(function (p, i) {
        var c = svgEl("circle", { cx: p[0], cy: p[1], r: 4, class: "pt" });
        c.appendChild(svgEl("title", {}, labels[i] + ": " + fmt(values[i])));
        svg.appendChild(c);
        svg.appendChild(svgEl("text", { x: p[0], y: H - 8, "text-anchor": "middle" }, labels[i]));
      });
      return svg;
    },

    bar: function (labels, values, opts) {
      opts = opts || {};
      var fmt = opts.format || String;
      var max = niceMax(Math.max.apply(null, values));
      var svg = frame(labels, max, fmt, opts.label || "Bar chart");
      var n = values.length;
      var bw = ((W - PAD.left - PAD.right) / n) * 0.6;
      values.forEach(function (v, i) {
        var x = scaleX(i, n, true);
        var y = scaleY(v, max);
        var r = svgEl("rect", { x: x - bw / 2, y: y, width: bw, height: scaleY(0, max) - y, rx: 3, class: "bar" });
        r.appendChild(svgEl("title", {}, labels[i] + ": " + fmt(v)));
        svg.appendChild(r);
        svg.appendChild(svgEl("text", { x: x, y: H - 8, "text-anchor": "middle" }, labels[i]));
      });
      return svg;
    }
  };
})(window.App);
