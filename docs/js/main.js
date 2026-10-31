(function () {
  var root = document.documentElement;
  try { var saved = localStorage.getItem("theme"); if (saved) root.setAttribute("data-theme", saved); } catch (e) {}

  document.getElementById("theme").addEventListener("click", function () {
    var current = root.getAttribute("data-theme") ||
      (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    var next = current === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    try { localStorage.setItem("theme", next); } catch (e) {}
  });

  var list = document.getElementById("pubs");
  PUBLICATIONS.forEach(function (p) {
    var li = document.createElement("li");
    li.appendChild(document.createTextNode(p.authors + " (" + p.year + "). " + p.title + ". "));
    var rest = (p.venue ? p.venue + ". " : "") + (p.note ? p.note + " " : "");
    if (rest) {
      var m = document.createElement("span");
      m.className = "meta";
      m.textContent = rest;
      li.appendChild(m);
    }
    if (p.doi) {
      var a = document.createElement("a");
      a.href = "https://doi.org/" + p.doi;
      a.textContent = "doi:" + p.doi;
      li.appendChild(a);
    }
    list.appendChild(li);
  });

  document.getElementById("year").textContent = new Date().getFullYear();
})();
