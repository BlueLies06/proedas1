// ASTROS · interacciones de la web
(() => {
  const WA = "51902155458";
  document.documentElement.classList.add("js");
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---------- Precios (S/.) por paquete ----------
  // Fuente: "PRECIOS ASTROS II". Editar aquí para actualizar la web.
  const PRICES = {
    ind: { virtual: [169, 389, 679, 1159], presencial: [199, 439, 779, 1339] },
    g2:  { virtual: [149, 319, 539, 859],  presencial: [169, 369, 639, 1039] },
    g7:  { virtual: [119, 249, 399, 639],  presencial: [149, 299, 499, 819] },
  };
  const HOURS = [4, 10, 20, 40];
  const USES = [
    "Para una práctica o laboratorio",
    "Para un examen o proyecto",
    "Para medio ciclo o mes y medio",
    "Para un ciclo completo o trimestre",
  ];
  const CAP_LABEL = { ind: "individual", g2: "grupal de 2 a 6 alumnos", g7: "grupal de 7 a 10 alumnos" };
  const FEATURED = 2; // 20 horas

  let cap = "ind";
  let mode = "virtual";
  const plansEl = document.getElementById("plans");

  const fmt = (n) => n.toLocaleString("es-PE");

  function renderPlans() {
    plansEl.innerHTML = HOURS.map((h, i) => {
      const price = PRICES[cap][mode][i];
      const perHour = (price / h).toFixed(price % h ? 1 : 0);
      const msg = encodeURIComponent(
        `Hola ASTROS, me interesa el paquete de ${h} horas (${CAP_LABEL[cap]}, ${mode}) de S/ ${fmt(price)}.`
      );
      return `
        <article class="glass plan price-swap${i === FEATURED ? " featured" : ""}">
          ${i === FEATURED ? '<span class="badge">Más elegido</span>' : ""}
          <div class="plan-h">${h}<small>h</small></div>
          <p class="plan-use">${USES[i]}</p>
          <div class="plan-price"><sup>S/</sup>${fmt(price)}</div>
          <p class="plan-ph">≈ S/ ${perHour} por hora</p>
          <a class="btn ${i === FEATURED ? "btn-gold" : "btn-glass"}" href="https://wa.me/${WA}?text=${msg}" target="_blank" rel="noopener">Lo quiero</a>
        </article>`;
    }).join("");
    attachGlare(plansEl.querySelectorAll(".glass"));
  }

  // ---------- Segmented controls (liquid thumb) ----------
  function placeThumb(seg) {
    const thumb = seg.querySelector(".seg-thumb");
    const sel = seg.querySelector('[aria-selected="true"]');
    if (!thumb || !sel) return;
    thumb.style.width = sel.offsetWidth + "px";
    thumb.style.transform = `translateX(${sel.offsetLeft - 5}px)`;
  }
  function setupSeg(seg, onChange) {
    seg.addEventListener("click", (e) => {
      const btn = e.target.closest("button");
      if (!btn) return;
      seg.querySelectorAll("button").forEach((b) => b.setAttribute("aria-selected", b === btn));
      placeThumb(seg);
      onChange(btn);
    });
    placeThumb(seg);
  }
  document.querySelectorAll(".seg").forEach((seg) => {
    if (seg.querySelector("[data-tab]")) {
      setupSeg(seg, (btn) => {
        document.querySelectorAll("[data-panel]").forEach((p) => (p.hidden = p.dataset.panel !== btn.dataset.tab));
      });
    } else {
      setupSeg(seg, (btn) => { cap = btn.dataset.cap; renderPlans(); });
    }
  });
  addEventListener("resize", () => document.querySelectorAll(".seg").forEach(placeThumb));
  document.fonts && document.fonts.ready.then(() => document.querySelectorAll(".seg").forEach(placeThumb));

  // ---------- Virtual / Presencial ----------
  const toggle = document.getElementById("modeToggle");
  toggle.addEventListener("change", () => {
    mode = toggle.checked ? "presencial" : "virtual";
    document.querySelectorAll("[data-mode-label]").forEach((s) => s.classList.toggle("on", s.dataset.modeLabel === mode));
    renderPlans();
  });

  // ---------- Brillo del vidrio que sigue al dedo ----------
  function attachGlare(nodes) {
    nodes.forEach((el) => {
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        el.style.setProperty("--mx", `${e.clientX - r.left}px`);
        el.style.setProperty("--my", `${e.clientY - r.top}px`);
      });
    });
  }
  attachGlare(document.querySelectorAll(".glass"));

  // ---------- Aparición al hacer scroll ----------
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
  document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

  // ---------- Tabbar activa según la sección ----------
  const tabLinks = [...document.querySelectorAll(".tabbar a")];
  const sectionFor = { inicio: "inicio", nosotros: "inicio", metodo: "niveles", niveles: "niveles", planes: "planes", docente: "planes", testimonios: "planes", pagos: "contacto", contacto: "contacto" };
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      const target = "#" + (sectionFor[en.target.id] || en.target.id);
      tabLinks.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === target));
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  document.querySelectorAll("main section[id]").forEach((s) => spy.observe(s));

  // ---------- Cielo estrellado ----------
  const cv = document.getElementById("stars");
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

  document.getElementById("year").textContent = new Date().getFullYear();
  renderPlans();
})();
