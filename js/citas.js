// ASTROS · reserva de consultas digitales para padres
(async () => {
  const form = document.getElementById("citaForm");
  if (!form) return;
  const CFG = window.ASTROS_CONFIG;
  const C = CFG.citas;
  const store = await window.AstrosStore;
  const daysEl = document.getElementById("days");
  const slotsEl = document.getElementById("slots");
  const msg = document.getElementById("citaMsg");
  const btn = document.getElementById("citaBtn");

  const toMin = (t) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
  const pad = (n) => String(n).padStart(2, "0");
  const hhmm = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  const fmtDia = (d) => d.toLocaleDateString("es-PE", { weekday: "long", day: "numeric", month: "long" });

  // Días hábiles para citas (desde mañana)
  const dias = [];
  for (let i = 1; dias.length < C.diasAdelante && i < 60; i++) {
    const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + i);
    if (C.dias.includes(d.getDay())) dias.push(d);
  }
  let dia = dias[0], hora = null, ocupadas = new Set();

  async function cargarOcupadas() {
    try {
      const desde = dias[0], hasta = new Date(+dias[dias.length - 1] + 864e5);
      ocupadas = new Set(await store.citasOcupadas(desde, hasta));
    } catch { ocupadas = new Set(); }
  }

  function radio(el, sel) {
    el.querySelectorAll('[role="radio"]').forEach((b) => b.setAttribute("aria-checked", b === sel));
  }

  function renderDias() {
    daysEl.innerHTML = dias.map((d, i) => `
      <button type="button" class="day" role="radio" aria-checked="${d === dia}" data-i="${i}">
        <small>${d.toLocaleDateString("es-PE", { weekday: "short" }).replace(".", "")}</small>
        <b>${d.getDate()}</b>
        <small>${d.toLocaleDateString("es-PE", { month: "short" }).replace(".", "")}</small>
      </button>`).join("");
  }

  function renderSlots() {
    const out = [];
    for (let m = toMin(C.desde); m + C.duracionMin <= toMin(C.hasta); m += C.duracionMin) {
      const t = new Date(dia); t.setMinutes(m);
      const tomado = ocupadas.has(+t);
      out.push(`<button type="button" class="slot" role="radio" aria-checked="${hora === +t}" data-t="${+t}" ${tomado ? "disabled aria-label=\"" + hhmm(t) + " ocupado\"" : ""}>${hhmm(t)}</button>`);
    }
    slotsEl.innerHTML = out.join("") || '<p class="slots-empty">No hay horarios este día.</p>';
  }

  daysEl.addEventListener("click", (e) => {
    const b = e.target.closest(".day"); if (!b) return;
    dia = dias[+b.dataset.i]; hora = null; radio(daysEl, b); renderSlots();
  });
  slotsEl.addEventListener("click", (e) => {
    const b = e.target.closest(".slot"); if (!b || b.disabled) return;
    hora = +b.dataset.t; radio(slotsEl, b); msg.textContent = ""; msg.className = "form-msg";
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const v = (id) => document.getElementById(id).value.trim();
    const err = (t) => { msg.textContent = t; msg.className = "form-msg err"; };
    if (!hora) return err("Elige un día y una hora.");
    if (!v("citaPadre")) return err("Escribe tu nombre.");
    if (v("citaWsp").replace(/\D/g, "").length < 9) return err("Escribe un WhatsApp de 9 dígitos.");

    const inicio = new Date(hora);
    const cita = {
      inicio: inicio.toISOString(), padre_nombre: v("citaPadre"), alumno_nombre: v("citaAlumno") || null,
      whatsapp: v("citaWsp"), nivel: v("citaNivel"), motivo: v("citaMotivo") || null,
    };
    btn.disabled = true; btn.textContent = "Reservando…";
    try {
      await store.crearCita(cita);
      const texto = `Hola ASTROS, soy ${cita.padre_nombre}. Reservé una consulta digital el ${fmtDia(inicio)} a las ${hhmm(inicio)}` +
        (cita.alumno_nombre ? ` para conversar sobre ${cita.alumno_nombre}` : "") + (cita.motivo ? `. Tema: ${cita.motivo}` : "") + ".";
      const real = store.modo === "real";
      form.innerHTML = `
        <div class="booking-done">
          <h3>${real ? "¡Consulta reservada!" : "Último paso: envíanos tu reserva"}</h3>
          <p>${fmtDia(inicio)} · ${hhmm(inicio)} (30 min, por videollamada).</p>
          <p class="muted">${real
            ? `Te escribiremos al ${cita.whatsapp} con el enlace de la reunión. Si quieres, confírmanos ahora por WhatsApp:`
            : "Tu horario queda separado cuando nos llegue tu mensaje por WhatsApp."}</p>
          <a class="btn btn-gold" href="https://wa.me/${CFG.whatsapp}?text=${encodeURIComponent(texto)}" target="_blank" rel="noopener">${real ? "Confirmar" : "Enviar"} por WhatsApp</a>
        </div>`;
    } catch (ex) {
      err(ex.message || "No se pudo reservar. Intenta de nuevo o escríbenos por WhatsApp.");
      await cargarOcupadas(); hora = null; renderSlots();
    } finally {
      btn.disabled = false; btn.textContent = "Reservar consulta";
    }
  });

  renderDias(); renderSlots();
  await cargarOcupadas(); renderSlots();
})();
