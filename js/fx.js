// ASTROS · efectos compartidos: cielo estrellado y brillo del vidrio
(() => {
  document.documentElement.classList.add("js");
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---------- Brillo del vidrio que sigue al dedo ----------
  function attachGlare(nodes) {
    nodes.forEach((el) => {
      if (el.dataset.glare) return; el.dataset.glare = "1";
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        el.style.setProperty("--mx", `${e.clientX - r.left}px`);
        el.style.setProperty("--my", `${e.clientY - r.top}px`);
      });
    });
  }

  const glassObserver = new MutationObserver(() => attachGlare(document.querySelectorAll(".glass:not([data-glare])")));
  addEventListener("DOMContentLoaded", () => {
    attachGlare(document.querySelectorAll(".glass"));
    glassObserver.observe(document.body, { childList: true, subtree: true });
  });

  // ---------- Cielo estrellado ----------
  const cv = document.getElementById("stars");
  if (!cv) { window.AstrosFX = { attachGlare }; return; }
  const ctx = cv.getContext("2d");
  let stars = [], w = 0, h = 0, dpr = 1;
  function resize() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    w = innerWidth; h = innerHeight;
    cv.width = w * dpr; cv.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.round((w * h) / 5200);
    stars = Array.from({ length: n }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      r: Math.random() * 1.3 + 0.2,
      a: Math.random() * Math.PI * 2,
      s: 0.006 + Math.random() * 0.02,
      gold: Math.random() < 0.12,
    }));
  }
  let shoot = null;
  function frame() {
    ctx.clearRect(0, 0, w, h);
    const off = scrollY * 0.04;
    for (const st of stars) {
      st.a += st.s;
      const alpha = 0.35 + Math.sin(st.a) * 0.35 + 0.3;
      ctx.fillStyle = st.gold ? `rgba(255,217,138,${alpha})` : `rgba(235,242,255,${alpha})`;
      ctx.beginPath();
      ctx.arc(st.x, (st.y - off + h) % h, st.r, 0, Math.PI * 2);
      ctx.fill();
    }
    if (!shoot && Math.random() < 0.004) shoot = { x: Math.random() * w * 0.7, y: Math.random() * h * 0.4, l: 0 };
    if (shoot) {
      shoot.l += 14;
      const g = ctx.createLinearGradient(shoot.x, shoot.y, shoot.x + shoot.l, shoot.y + shoot.l * 0.45);
      g.addColorStop(0, "rgba(255,217,138,0)");
      g.addColorStop(1, "rgba(255,255,255,.9)");
      ctx.strokeStyle = g; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(shoot.x, shoot.y); ctx.lineTo(shoot.x + shoot.l, shoot.y + shoot.l * 0.45); ctx.stroke();
      if (shoot.l > 260) shoot = null;
    }
    requestAnimationFrame(frame);
  }
  resize();
  addEventListener("resize", resize);
  if (reduceMotion) {
    ctx.fillStyle = "rgba(235,242,255,.6)";
    for (const st of stars) ctx.fillRect(st.x, st.y, st.r * 1.5, st.r * 1.5);
  } else {
    requestAnimationFrame(frame);
  }

  window.AstrosFX = { attachGlare };
})();
