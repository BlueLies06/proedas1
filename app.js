// ASTROS · interacciones de la web
(() => {
  const WA = "51902155458";
  document.documentElement.classList.add("js");
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---------- Tarifario ----------
  // Los precios viven en data/precios.json (única fuente). Esta parte solo los muestra.
  const MODE_LABEL = { virtual: "virtual", presencial: "presencial", domicilio: "a domicilio" };
  const plansEl = document.getElementById("plans");
  const groupBox = document.getElementById("groupBox");
  const tallerBox = document.getElementById("tallerBox");
  const state = { nivel: "escolar", modo: "virtual" };
  let DATA = null;

  const fmt = (n) => n.toLocaleString("es-PE", { maximumFractionDigits: 1 });
  const wa = (text) => `https://wa.me/${WA}?text=${encodeURIComponent(text)}`;

  const NIVEL_NOMBRE = { escolar: "Escolar", pre: "Pre", universitario: "Universidad" };

  // Adapta precios.json (generado desde tarifario.csv del hilo de precios) a lo que muestra la web.
  function normalize(d) {
    const niveles = {};
    for (const [key, items] of Object.entries(d.niveles || {})) {
      const ind = items.filter((x) => x.alumnos_max === 1);
      const top = ind.reduce((a, x) => (x.horas > (a?.horas || 0) ? x : a), null);
      niveles[key] = {
        nombre: NIVEL_NOMBRE[key] || key,
        productos: ind.map((x) => ({ nombre: x.producto, horas: x.horas, precio: x.precio, detalle: x.notas, destacado: x === top && ind.length > 1 })),
        grupo: items.filter((x) => x.alumnos_max > 1 && x.alumnos_max <= 6)
          .map((x) => ({ etiqueta: (x.producto.match(/\d+\s*-\s*\d+/) || [x.alumnos_max])[0].replace(/\s*-\s*/, " a ") + " alumnos", precio: x.precio })),
        taller: items.find((x) => x.alumnos_max > 6),
      };
    }
    const r = d.recargos || {};
    return { actualizado: d.actualizado, niveles, recargos: { virtual: 0, presencial: r.presencial_hora || 0, domicilio: r.domicilio_hora || 0 } };
  }

  function renderPlans() {
    if (!DATA) return;
    const nivel = DATA.niveles[state.nivel];
    if (!nivel) return;
    const extra = DATA.recargos[state.modo] || 0;
    const modo = MODE_LABEL[state.modo];

    plansEl.innerHTML = nivel.productos.map((p) => {
      const price = p.precio + extra * p.horas;
      const perHour = price / p.horas;
      const msg = `Hola ASTROS, me interesa: ${nivel.nombre} · ${p.nombre} (${p.horas} h, ${modo}) de S/ ${fmt(price)}.`;
      return `
        <article class="glass plan price-swap${p.destacado ? " featured" : ""}">
          ${p.destacado ? '<span class="badge">Recomendado</span>' : ""}
          <div class="plan-top">
            <h3 class="plan-name">${p.nombre}</h3>
            <p class="plan-use">${p.detalle || ""}</p>
          </div>
          <div class="plan-price"><sup>S/</sup>${fmt(price)}</div>
          <p class="plan-ph">${p.horas > 1 ? `${p.horas} h · ≈ S/ ${fmt(perHour)} por hora` : "por hora"}</p>
          <a class="btn ${p.destacado ? "btn-gold" : "btn-glass"}" href="${wa(msg)}" target="_blank" rel="noopener">Lo quiero</a>
        </article>`;
    }).join("");

    groupBox.hidden = !nivel.grupo.length;
    groupBox.innerHTML = `
      <h3>Estudia en grupo</h3>
      <p class="muted">Precio por alumno, por hora (${modo}).</p>
      <div class="group-row">${nivel.grupo.map((g) => `
        <div><b>S/ ${fmt(g.precio + extra)}</b><span>${g.etiqueta}</span></div>`).join("")}
      </div>
      <a class="link-arrow" href="${wa(`Hola ASTROS, quiero armar un grupo (${nivel.nombre}, ${modo}).`)}" target="_blank" rel="noopener">Armar mi grupo →</a>`;

    const t = nivel.taller || Object.values(DATA.niveles).map((n) => n.taller).find(Boolean);
    tallerBox.hidden = !t;
    if (t) tallerBox.innerHTML = `
      <h3>${t.producto.replace(/\s*\(por alumno\)/i, "")}</h3>
      <p class="muted">${t.notas || ""}</p>
      <div class="group-row"><div><b>S/ ${fmt(t.precio)}</b><span>por alumno · ${t.horas} h</span></div></div>
      <a class="link-arrow" href="${wa("Hola ASTROS, quiero info de los talleres intensivos pre-examen.")}" target="_blank" rel="noopener">Ver próximos talleres →</a>`;

    attachGlare(plansEl.querySelectorAll(".glass"));
  }

  fetch("data/precios.json", { cache: "no-cache" })
    .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
    .then((d) => {
      DATA = normalize(d);
      const el = document.getElementById("priceDate");
      if (el && DATA.actualizado) {
        const [y, m, day] = DATA.actualizado.slice(0, 10).split("-").map(Number);
        el.textContent = "Precios actualizados al " + new Date(y, m - 1, day).toLocaleDateString("es-PE", { day: "numeric", month: "long", year: "numeric" }) + ".";
      }
      renderPlans();
    })
    .catch(() => { groupBox.hidden = true; tallerBox.hidden = true; });

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
      setupSeg(seg, (btn) => { state[seg.dataset.group] = btn.dataset.value; renderPlans(); });
    }
  });
  addEventListener("resize", () => document.querySelectorAll(".seg").forEach(placeThumb));
  document.fonts && document.fonts.ready.then(() => document.querySelectorAll(".seg").forEach(placeThumb));

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
})();
