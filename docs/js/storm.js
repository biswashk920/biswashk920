// Rainfall (top) falls. Part soaks into the ground (bottom), the rest runs off and builds the hydrograph (middle).
(function () {
  var cv = document.getElementById("storm");
  if (!cv || !cv.getContext) return;
  var ctx = cv.getContext("2d");
  var N = 220, H = 340, RAINH = 92, BASE = H - 70, SOIL = H - 30 - BASE, DUR = 7000, SPD = 0.9;
  var W = 640, dpr = 1, rain = [], rh = [], lh = [], inf = [], q = [], peak = 0, t = 0, hold = 0, clock = 0, visible = true;

  function rnd(a, b) { return a + Math.random() * (b - a); }
  function px(i) { return i / (N - 1) * W; }

  function newStorm() {
    var i, j, k;
    rain = []; for (i = 0; i < N; i++) rain.push(0);
    var bursts = 1 + Math.floor(Math.random() * 3), c = rnd(14, 24);
    for (k = 0; k < bursts; k++) {
      var w = rnd(3, 7), a = rnd(0.4, 1);
      for (i = 0; i < N; i++) rain[i] += a * Math.exp(-Math.pow((i - c) / w, 2) / 2);
      c += rnd(14, 28);
    }
    var rmax = Math.max.apply(null, rain), f = rnd(0.6, 1), fcap = rnd(0.2, 0.45) * rmax, bar = f * (RAINH - 10) / rmax;
    // constant infiltration capacity: rain up to fcap soaks in, only the excess becomes runoff
    rh = rain.map(function (v) { return v * bar; });
    lh = rain.map(function (v) { return Math.min(v, fcap) * bar; });
    inf = rain.map(function (v) { return v > 0.02 * rmax ? Math.min(v, fcap) / rmax : 0; });
    var eff = rain.map(function (v) { return Math.max(0, v - fcap); });
    var K = rnd(10, 16), h = [];
    for (i = 0; i < N; i++) { var x = i / K; h.push(x * x * Math.exp(-x) / (2 * K)); }
    q = [];
    for (i = 0; i < N; i++) { var s = 0; for (j = 0; j <= i; j++) s += eff[j] * h[i - j]; q.push(s); }
    var qmax = Math.max.apply(null, q), scale = rnd(0.6, 0.95) * (BASE - RAINH - 24) / qmax;
    q = q.map(function (v) { return v * scale; });
    peak = q.indexOf(Math.max.apply(null, q));
    t = 0; hold = 0;
  }

  function resize() {
    W = cv.parentNode.clientWidth || 640;
    dpr = window.devicePixelRatio || 1;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    cv.style.height = H + "px";
    draw();
  }

  function draw() {
    var cs = getComputedStyle(document.documentElement);
    var water = cs.getPropertyValue("--water").trim(), muted = cs.getPropertyValue("--muted").trim(),
        rule = cs.getPropertyValue("--rule").trim();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    var te = Math.min(Math.floor(t), N - 1), ta = t >= N ? N + hold / (DUR / N) : t, i, k;

    // ground band under the hydrograph
    ctx.globalAlpha = 0.1; ctx.fillStyle = muted; ctx.fillRect(0, BASE, W, SOIL);

    // panel divider and baseline
    ctx.globalAlpha = 1; ctx.strokeStyle = rule; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, RAINH + 4); ctx.lineTo(W, RAINH + 4); ctx.stroke();
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(0, BASE); ctx.lineTo(W, BASE); ctx.stroke();

    // rainfall bars: grey part soaks in, blue part runs off
    var bw = Math.max(1.5, W / N * 0.75);
    for (i = 0; i <= te; i++) {
      if (rh[i] < 0.4) continue;
      ctx.globalAlpha = 0.3; ctx.fillStyle = muted; ctx.fillRect(px(i) - bw / 2, 0, bw, lh[i]);
      if (rh[i] - lh[i] > 0.4) { ctx.globalAlpha = 0.7; ctx.fillStyle = water; ctx.fillRect(px(i) - bw / 2, lh[i], bw, rh[i] - lh[i]); }
    }

    // falling drops and the "now" line
    if (t < N) {
      ctx.strokeStyle = water; ctx.globalAlpha = 0.7; ctx.lineWidth = 1.3;
      for (i = Math.max(0, te - 6); i <= te; i++) {
        var span = RAINH - 4 - rh[i];
        if (rh[i] < 3 || span < 6) continue;
        var cnt = Math.ceil(rh[i] / 20) + 1;
        for (k = 0; k < cnt; k++) {
          var y = rh[i] + (clock * 0.18 + k * 41 + i * 17) % span, x = px(i) + ((k * 13 + i * 7) % 9 - 4);
          ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 1.5, y + 7); ctx.stroke();
        }
      }
      ctx.strokeStyle = muted; ctx.globalAlpha = 0.3; ctx.lineWidth = 1; ctx.setLineDash([3, 4]);
      ctx.beginPath(); ctx.moveTo(px(te), RAINH + 4); ctx.lineTo(px(te), BASE); ctx.stroke();
      ctx.setLineDash([]);
    }

    // water soaking into the ground, fading out as it sinks
    ctx.fillStyle = water;
    for (i = Math.max(0, Math.floor(ta - 75)); i <= te; i++) {
      if (inf[i] < 0.03) continue;
      var n = Math.ceil(inf[i] * 9);
      for (k = 0; k < n; k++) {
        var d = (ta - i) * SPD - k * 5;
        if (d < 0 || d > SOIL - 4) continue;
        ctx.globalAlpha = 0.8 * (1 - d / SOIL);
        ctx.beginPath(); ctx.arc(px(i) + ((k * 29 + i * 11) % 15 - 7), BASE + 3 + d, 1.8, 0, 6.3); ctx.fill();
      }
    }

    // runoff hydrograph: filled area and line
    ctx.globalAlpha = 0.14; ctx.fillStyle = water;
    ctx.beginPath(); ctx.moveTo(0, BASE);
    for (i = 0; i <= te; i++) ctx.lineTo(px(i), BASE - q[i]);
    ctx.lineTo(px(te), BASE); ctx.closePath(); ctx.fill();

    ctx.globalAlpha = 1; ctx.strokeStyle = water; ctx.lineWidth = 3; ctx.lineJoin = "round"; ctx.lineCap = "round";
    ctx.beginPath();
    for (i = 0; i <= te; i++) { var yy = BASE - q[i]; if (i) ctx.lineTo(px(i), yy); else ctx.moveTo(px(i), yy); }
    ctx.stroke();

    ctx.font = "13px 'IBM Plex Sans', system-ui, sans-serif"; ctx.fillStyle = muted;
    if (t < N) { ctx.fillStyle = water; ctx.beginPath(); ctx.arc(px(te), BASE - q[te], 4, 0, 6.3); ctx.fill(); ctx.fillStyle = muted; }
    if (te >= peak) {
      ctx.textAlign = "center"; ctx.fillText("peak", px(peak), BASE - q[peak] - 10);
      ctx.fillStyle = water; ctx.beginPath(); ctx.arc(px(peak), BASE - q[peak], 3.5, 0, 6.3); ctx.fill(); ctx.fillStyle = muted;
    }
    ctx.textAlign = "right"; ctx.fillText("rainfall", W - 2, 14);
    ctx.font = "12px 'IBM Plex Sans', system-ui, sans-serif";
    ctx.fillText("grey soaks in, blue runs off", W - 2, 30);
    ctx.fillText("infiltration", W - 2, BASE + 16);
    ctx.font = "13px 'IBM Plex Sans', system-ui, sans-serif";
    ctx.fillText("time", W - 2, H - 8);
    ctx.textAlign = "left"; ctx.fillText("runoff (river discharge)", 0, RAINH + 22);
  }

  var last = 0;
  function frame(now) {
    window.requestAnimationFrame(frame);
    var dt = Math.min(now - last, 50); last = now;
    if (!visible || document.hidden) return;
    clock += dt;
    if (t < N) t = Math.min(N, t + dt / (DUR / N));
    else { hold += dt; if (hold > 3800) newStorm(); }
    draw();
  }

  if ("ResizeObserver" in window) new ResizeObserver(resize).observe(cv.parentNode);
  else window.addEventListener("resize", resize);
  if ("IntersectionObserver" in window)
    new IntersectionObserver(function (e) { visible = e[0].isIntersecting; }).observe(cv);
  new MutationObserver(draw).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  newStorm(); resize();
  window.requestAnimationFrame(frame);
})();