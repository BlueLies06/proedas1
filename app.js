// ASTROS · interacciones de la web
(() => {
  const WA = "51902155458";

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

  const attachGlare = window.AstrosFX.attachGlare;
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
  const sectionFor = { inicio: "inicio", nosotros: "inicio", metodo: "inicio", niveles: "inicio", test: "test", planes: "planes", docente: "planes", testimonios: "planes", citas: "citas", pagos: "citas", contacto: "citas" };
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      const target = "#" + (sectionFor[en.target.id] || en.target.id);
      tabLinks.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === target));
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  document.querySelectorAll("main section[id]").forEach((s) => spy.observe(s));

  document.getElementById("year").textContent = new Date().getFullYear();
})();
