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
  // Hora en formato de 12 h, como se dice en Perú: 3:30 p. m.
  const ampm = (min) => ({ h: (Math.floor(min / 60) % 12) || 12, m: pad(min % 60), s: min < 720 ? "a. m." : "p. m." });
  const hhmm = (d) => { const a = ampm(d.getHours() * 60 + d.getMinutes()); return `${a.h}:${a.m} ${a.s}`; };
  const corta = (t, sinSufijo) => { const a = ampm(toMin(t)); return `${a.h}${a.m === "00" ? "" : ":" + a.m}${sinSufijo ? "" : " " + a.s}`; };
  const rango = (f) => `${corta(f.desde, ampm(toMin(f.desde)).s === ampm(toMin(f.hasta)).s)} a ${corta(f.hasta)}`;
  const punto = (t) => (t.endsWith(".") ? t : t + ".");
  // Franjas de atención (compatibilidad: si solo hay desde/hasta, es una sola franja)
  const franjas = C.franjas || [{ nombre: "", desde: C.desde, hasta: C.hasta }];
  const horarioEl = document.getElementById("citaHorario");
  if (horarioEl) {
    const todos = C.dias.length === 7 ? "Todos los días" : "De lunes a sábado";
    horarioEl.textContent = punto(`${todos}, ${franjas.map((f) => `de ${rango(f)}`).join(" y ")}`);
  }
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
    for (const f of franjas) {
      if (f.nombre) out.push(`<p class="slots-group">${f.nombre} <span>${rango(f)}</span></p>`);
      for (let m = toMin(f.desde); m + C.duracionMin <= toMin(f.hasta); m += C.duracionMin) {
        const t = new Date(dia); t.setMinutes(m);
        const tomado = ocupadas.has(+t), a = ampm(m);
        out.push(`<button type="button" class="slot" role="radio" aria-checked="${hora === +t}" data-t="${+t}" aria-label="${hhmm(t)}${tomado ? " ocupado" : ""}" ${tomado ? "disabled" : ""}>${a.h}:${a.m}<small>${a.s}</small></button>`);
      }
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
      const texto = punto(`Hola ASTROS, soy ${cita.padre_nombre}. Reservé una consulta digital el ${fmtDia(inicio)} a las ${hhmm(inicio)}` +
        (cita.alumno_nombre ? ` para conversar sobre ${cita.alumno_nombre}` : "") + (cita.motivo ? `. Tema: ${cita.motivo}` : ""));
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
