(function () {
  "use strict";
  var deck = document.querySelector(".deck");
  var slides = Array.prototype.slice.call(deck.querySelectorAll(".slide"));
  var total = slides.length;
  var cur = 0;
  var notesPanel = document.getElementById("notesPanel");
  var hint = document.getElementById("hint");
  var pad = function (n) { return String(n).padStart(2, "0"); };

  if (/[?&]export\b/.test(location.search)) document.body.classList.add("export");

  // Shared chrome: brand, event label, progress and page number.
  slides.forEach(function (s, i) {
    var chrome = document.createElement("div");
    chrome.className = "chrome";
    chrome.innerHTML =
      '<div class="brand"><svg viewBox="0 0 32 32"><use href="#logo"/></svg><span>Token Intelligence Layer</span></div>' +
      '<div class="chrome-r">' + (s.dataset.section || "") + "</div>";
    var foot = document.createElement("div");
    foot.className = "foot";
    var bars = "";
    for (var k = 0; k < total; k++) bars += '<i class="' + (k < i ? "past" : k === i ? "on" : "") + '"></i>';
    foot.innerHTML = '<div class="progress">' + bars + '</div><div class="pg">' + pad(i + 1) + " <span>/ " + pad(total) + "</span></div>";
    s.insertBefore(chrome, s.firstChild);
    s.appendChild(foot);
  });

  function fit() {
    var sc = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
    deck.style.setProperty("--scale", sc);
  }

  function go(n) {
    cur = Math.max(0, Math.min(total - 1, n));
    slides.forEach(function (s, i) { s.classList.toggle("active", i === cur); });
    var note = slides[cur].querySelector(".notes");
    notesPanel.innerHTML = "<b>Speaker notes · " + pad(cur + 1) + "</b>" + (note ? note.innerHTML : "");
    if (history.replaceState) history.replaceState(null, "", location.pathname + location.search + "#" + (cur + 1));
  }

  document.addEventListener("keydown", function (e) {
    var k = e.key;
    if (k === "ArrowRight" || k === "PageDown" || k === " " || k === "Enter") { e.preventDefault(); go(cur + 1); }
    else if (k === "ArrowLeft" || k === "PageUp" || k === "Backspace") { e.preventDefault(); go(cur - 1); }
    else if (k === "Home") go(0);
    else if (k === "End") go(total - 1);
    else if (k === "n" || k === "N") document.body.classList.toggle("show-notes");
    else if (k === "f" || k === "F") {
      if (!document.fullscreenElement) document.documentElement.requestFullscreen && document.documentElement.requestFullscreen();
      else document.exitFullscreen && document.exitFullscreen();
    }
  });

  var tx = null;
  document.addEventListener("touchstart", function (e) { tx = e.touches[0].clientX; }, { passive: true });
  document.addEventListener("touchend", function (e) {
    if (tx === null) return;
    var dx = e.changedTouches[0].clientX - tx;
    if (Math.abs(dx) > 50) go(cur + (dx < 0 ? 1 : -1));
    tx = null;
  });

  window.addEventListener("resize", fit);
  fit();
  var start = parseInt((location.hash || "").replace("#", ""), 10);
  go(isNaN(start) ? 0 : start - 1);
  setTimeout(function () { hint && hint.classList.add("gone"); }, 4000);

  window.deck = { go: go, total: total };
})();
