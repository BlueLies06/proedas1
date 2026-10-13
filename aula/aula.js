// ASTROS · Aula virtual
// Roles: admin (todo), profesor (sus horarios, documentos, prácticas), alumno (reservar butacas, ver material).
(async () => {
  const CFG = window.ASTROS_CONFIG;
  const store = await window.AstrosStore;
  const esc = window.AstrosQuiz.esc;
  const app = document.getElementById("app");
  const sheet = document.getElementById("sheet");
  const sheetBody = document.getElementById("sheetBody");
  const toastEl = document.getElementById("toast");

  let yo = null;          // { user, perfil }
  let vista = null;       // pestaña actual
  let cache = {};

  // ------------------------------------------------------------ utilidades
  const pad = (n) => String(n).padStart(2, "0");
  const hhmm = (d) => `${pad(new Date(d).getHours())}:${pad(new Date(d).getMinutes())}`;
  const dia = (d, o = { weekday: "short", day: "numeric", month: "short" }) => new Date(d).toLocaleDateString("es-PE", o).replace(/\./g, "");
  const diaLargo = (d) => new Date(d).toLocaleDateString("es-PE", { weekday: "long", day: "numeric", month: "long" });
  const mismoDia = (a, b) => new Date(a).toDateString() === new Date(b).toDateString();
  const hoy0 = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
  const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  const wa = (num, text) => `https://wa.me/${String(num || CFG.whatsapp).replace(/\D/g, "").replace(/^9/, "519")}?text=${encodeURIComponent(text)}`;
  const icon = (id) => `<svg class="ic" aria-hidden="true"><use href="#${id}"/></svg>`;
  const MOD = { virtual: "Virtual", presencial: "Presencial", domicilio: "A domicilio" };
  const NIVEL = { escolar: "Escolar", pre: "Pre", universitario: "Universidad" };
  const ROL = { admin: "Administración", profesor: "Profesor", alumno: "Alumno", padre: "Padre de familia" };

  function toast(msg, tipo = "ok") {
    toastEl.textContent = msg; toastEl.className = `toast glass ${tipo}`; toastEl.hidden = false;
    clearTimeout(toast.t); toast.t = setTimeout(() => (toastEl.hidden = true), 3200);
  }
  function abrirSheet(html) {
    sheetBody.innerHTML = html; sheet.hidden = false; document.body.classList.add("no-scroll");
    requestAnimationFrame(() => sheet.classList.add("open"));
    sheet.querySelector("input, select, button:not(.sheet-x)")?.focus({ preventScroll: true });
  }
  function cerrarSheet() {
    sheet.classList.remove("open"); document.body.classList.remove("no-scroll");
    setTimeout(() => (sheet.hidden = true), 250);
  }
  sheet.addEventListener("click", (e) => { if (e.target.closest("[data-close]")) cerrarSheet(); });
  addEventListener("keydown", (e) => { if (e.key === "Escape" && !sheet.hidden) cerrarSheet(); });

  async function intentar(fn, ok) {
    try { const r = await fn(); if (ok) toast(ok); return r; }
    catch (e) { toast(e.message || "Algo salió mal. Intenta de nuevo.", "err"); throw e; }
  }

  // ------------------------------------------------------------ login
  function pantallaLogin(modo = "entrar") {
    const demo = store.modo === "demo";
    app.innerHTML = `
      <main class="login">
        <a class="login-back" href="../index.html">← Volver a la web</a>
        <section class="glass login-card q-in">
          <div class="logo login-logo" aria-label="ASTROS">
            <span class="logo-word" aria-hidden="true"><svg class="logo-spark"><use href="#spark"/></svg><span class="logo-t">ASTR</span><svg class="logo-o"><use href="#planet"/></svg><span class="logo-t">S</span></span>
            <span class="logo-sub" aria-hidden="true">Aula virtual</span>
          </div>
          ${demo ? `
            <p class="demo-note">Modo demostración: explora el aula con datos de ejemplo. Al conectar la base de datos se activa el ingreso con correo.</p>
            <div class="demo-btns">
              <button class="btn btn-gold" data-demo="admin">${icon("i-grid")} Entrar como Administración</button>
              <button class="btn btn-glass" data-demo="profesor">${icon("i-cal")} Entrar como Profesor</button>
              <button class="btn btn-glass" data-demo="alumno">${icon("i-seat")} Entrar como Alumno</button>
            </div>` : `
            <form id="loginForm" class="login-form" novalidate>
              <h1 class="login-h">${modo === "registro" ? "Crea tu cuenta" : modo === "recuperar" ? "Recupera tu acceso" : "Bienvenido de vuelta"}</h1>
              ${modo === "registro" ? `<label class="field"><span>Nombre completo</span><input id="lgNombre" autocomplete="name" required></label>` : ""}
              <label class="field"><span>Correo</span><input id="lgEmail" type="email" autocomplete="email" required></label>
              ${modo !== "recuperar" ? `<label class="field"><span>Contraseña</span><input id="lgPass" type="password" autocomplete="${modo === "registro" ? "new-password" : "current-password"}" minlength="8" required></label>` : ""}
              <p class="form-msg" id="lgMsg" role="status"></p>
              <button class="btn btn-gold" type="submit">${modo === "registro" ? "Crear cuenta" : modo === "recuperar" ? "Enviar enlace" : "Entrar"}</button>
              <div class="login-links">
                ${modo !== "entrar" ? `<button type="button" class="link" data-modo="entrar">Ya tengo cuenta</button>` : `<button type="button" class="link" data-modo="registro">Crear cuenta de alumno</button><button type="button" class="link" data-modo="recuperar">Olvidé mi contraseña</button>`}
              </div>
            </form>`}
        </section>
      </main>`;

    app.onclick = async (e) => {
      const d = e.target.closest("[data-demo]");
      if (d) { yo = await store.entrarDemo(d.dataset.demo); return iniciar(); }
      const m = e.target.closest("[data-modo]");
      if (m) pantallaLogin(m.dataset.modo);
    };
    const form = document.getElementById("loginForm");
    if (form) form.onsubmit = async (e) => {
      e.preventDefault();
      const msg = document.getElementById("lgMsg");
      const v = (id) => document.getElementById(id)?.value.trim();
      msg.className = "form-msg"; msg.textContent = "Un momento…";
      try {
        if (modo === "recuperar") { await store.recuperar(v("lgEmail")); msg.className = "form-msg ok"; msg.textContent = "Te enviamos un enlace a tu correo."; return; }
        if (modo === "registro") {
          if ((v("lgPass") || "").length < 8) throw new Error("La contraseña debe tener al menos 8 caracteres.");
          yo = await store.registrarse(v("lgEmail"), v("lgPass"), v("lgNombre"));
          if (!yo) { msg.className = "form-msg ok"; msg.textContent = "Revisa tu correo para confirmar la cuenta y luego entra."; return; }
        } else {
          yo = await store.entrar(v("lgEmail"), v("lgPass"));
        }
        iniciar();
      } catch (ex) { msg.className = "form-msg err"; msg.textContent = ex.message; }
    };
  }

  // ------------------------------------------------------------ armazón
  const TABS = {
    alumno: [
      ["inicio", "Inicio", "i-rocket"], ["reservar", "Reservar", "i-seat"], ["horario", "Horario", "i-cal"],
      ["material", "Material", "i-doc"], ["practicas", "Prácticas", "i-check"], ["contacto", "Contacto", "i-chat"],
    ],
    profesor: [
      ["inicio", "Inicio", "i-rocket"], ["calendario", "Calendario", "i-cal"], ["material", "Material", "i-doc"],
      ["practicas", "Prácticas", "i-check"], ["alumnos", "Alumnos", "i-users"],
    ],
    admin: [
      ["inicio", "Resumen", "i-grid"], ["calendario", "Calendario", "i-cal"], ["alumnos", "Alumnos", "i-users"],
      ["citas", "Citas", "i-chat"], ["material", "Material", "i-doc"], ["practicas", "Prácticas", "i-check"], ["usuarios", "Usuarios", "i-star"],
    ],
  };
  const rol = () => yo.perfil.rol === "padre" ? "alumno" : yo.perfil.rol;

  function shell() {
    const tabs = TABS[rol()];
    app.innerHTML = `
      <header class="topbar glass aula-top">
        <a class="brand" href="../index.html" aria-label="Ir a la web de ASTROS"><span class="brand-name">ASTR<svg class="logo-o" aria-hidden="true"><use href="#planet"/></svg>S</span></a>
        <div class="me">
          <span class="me-txt"><b>${esc(yo.perfil.nombre || yo.user.email)}</b><small>${ROL[yo.perfil.rol]}${store.modo === "demo" ? " · demo" : ""}</small></span>
          <button class="icon-btn" data-salir aria-label="Cerrar sesión">${icon("i-out")}</button>
        </div>
      </header>
      <div class="aula-body">
        <nav class="side glass" aria-label="Secciones del aula">
          ${tabs.map(([k, t, i]) => `<a href="#${k}" data-tab="${k}">${icon(i)}<span>${t}</span></a>`).join("")}
        </nav>
        <main class="view" id="view"></main>
      </div>`;
    app.onclick = async (e) => {
      if (e.target.closest("[data-salir]")) { await store.salir(); yo = null; location.hash = ""; pantallaLogin(); }
    };
  }

  async function ir(tab) {
    const tabs = TABS[rol()].map((t) => t[0]);
    if (!tabs.includes(tab)) tab = "inicio";
    vista = tab;
    document.querySelectorAll("[data-tab]").forEach((a) => a.classList.toggle("active", a.dataset.tab === tab));
    const view = document.getElementById("view");
    view.innerHTML = `<div class="loading"><svg aria-hidden="true"><use href="#planet"/></svg></div>`;
    try {
      await VISTAS[rol()][tab](view);
      view.classList.remove("q-in"); void view.offsetWidth; view.classList.add("q-in");
    } catch (e) {
      console.error(e);
      view.innerHTML = `<div class="glass empty"><h2>No se pudo cargar</h2><p class="muted">${esc(e.message)}</p><button class="btn btn-glass" onclick="location.reload()">Reintentar</button></div>`;
    }
  }
  addEventListener("hashchange", () => yo && ir(location.hash.slice(1)));

  const titulo = (eyebrow, h, extra = "") => `<header class="view-head"><div><p class="eyebrow">${eyebrow}</p><h1>${h}</h1></div>${extra}</header>`;
  const vacio = (txt, cta = "") => `<div class="glass empty"><p class="muted">${txt}</p>${cta}</div>`;

  // ------------------------------------------------------------ tarjetas de sesión
  function cardSesion(s, { accion = "", mostrarProfe = true } = {}) {
    const libres = s.capacidad - s.reservas.length;
    const mia = s.reservas.find((r) => r.alumno_id === yo.user.id);
    const pct = (s.reservas.length / s.capacidad) * 100;
    return `
      <article class="glass ses ${mia ? "mine" : ""}" data-ses="${s.id}">
        <div class="ses-date"><b>${new Date(s.inicio).getDate()}</b><small>${dia(s.inicio, { month: "short" })}</small></div>
        <div class="ses-main">
          <h3>${esc(s.curso?.nombre || "Clase")}</h3>
          <p class="muted">${dia(s.inicio, { weekday: "long" })} · ${hhmm(s.inicio)}–${hhmm(s.fin)} · ${MOD[s.modalidad]}${mostrarProfe && s.profesor ? ` · ${esc(s.profesor.nombre)}` : ""}</p>
          ${s.tema ? `<p class="ses-tema">${esc(s.tema)}</p>` : ""}
          <div class="cap"><i><em style="width:${pct}%"></em></i><span>${mia ? `Tu butaca: ${mia.butaca}` : libres > 0 ? `${libres} de ${s.capacidad} libres` : "Llena"}</span></div>
        </div>
        ${accion}
      </article>`;
  }

  // ------------------------------------------------------------ butacas (tipo cine)
  async function abrirButacas(sesionId) {
    const lista = await store.sesiones({ desde: hoy0() });
    const s = lista.find((x) => x.id === sesionId);
    if (!s) return toast("Esa clase ya no está disponible.", "err");
    const ocup = new Map(s.reservas.map((r) => [r.butaca, r.alumno_id]));
    const mia = s.reservas.find((r) => r.alumno_id === yo.user.id);
    const cols = s.capacidad <= 4 ? s.capacidad : s.capacidad <= 9 ? 3 : s.capacidad <= 16 ? 4 : 6;
    let elegida = null;
    const puedeReservar = rol() === "alumno" && !mia && s.estado === "abierta";

    abrirSheet(`
      <p class="eyebrow">${MOD[s.modalidad]} · ${s.capacidad === 1 ? "Clase individual" : `Hasta ${s.capacidad} alumnos`}</p>
      <h2 id="sheetTitle" class="sheet-h">${esc(s.curso?.nombre || "Clase")}</h2>
      <p class="muted">${diaLargo(s.inicio)} · ${hhmm(s.inicio)}–${hhmm(s.fin)}${s.profesor ? ` · ${esc(s.profesor.nombre)}` : ""}</p>
      ${s.tema ? `<p class="ses-tema">${esc(s.tema)}</p>` : ""}
      <div class="cine">
        <div class="pantalla"><span>Pizarra</span></div>
        <div class="butacas" style="--cols:${cols}" role="radiogroup" aria-label="Butacas">
          ${Array.from({ length: s.capacidad }, (_, k) => {
            const n = k + 1, quien = ocup.get(n);
            const estado = quien === yo.user.id ? "tuya" : quien ? "ocupada" : "libre";
            return `<button type="button" class="butaca ${estado}" data-b="${n}" role="radio" aria-checked="false"
              ${estado !== "libre" || !puedeReservar ? "disabled" : ""} aria-label="Butaca ${n} ${estado}">
              ${icon("i-seat")}<span>${n}</span></button>`;
          }).join("")}
        </div>
        <ul class="leyenda"><li><i class="libre"></i>Libre</li><li><i class="ocupada"></i>Ocupada</li><li><i class="tuya"></i>Tuya</li></ul>
      </div>
      <div class="sheet-actions" id="butacaAct">
        ${mia ? `<p class="ok-line">Tienes la butaca <b>${mia.butaca}</b>.</p>
                 ${s.enlace ? `<a class="btn btn-gold" href="${esc(s.enlace)}" target="_blank" rel="noopener">Entrar a la clase</a>` : ""}
                 <button class="btn btn-glass" data-cancelar>Liberar mi butaca</button>`
          : puedeReservar ? `<button class="btn btn-gold" data-reservar disabled>Elige una butaca</button>`
          : rol() === "alumno" ? `<p class="muted">Esta clase ya está llena. Escríbele al docente para abrir otro horario.</p>`
          : `<p class="muted">${s.reservas.length} de ${s.capacidad} butacas separadas.</p>`}
      </div>`);

    sheetBody.onclick = async (e) => {
      const b = e.target.closest(".butaca:not([disabled])");
      if (b) {
        elegida = +b.dataset.b;
        sheetBody.querySelectorAll(".butaca").forEach((x) => { x.classList.toggle("sel", x === b); x.setAttribute("aria-checked", x === b); });
        const r = sheetBody.querySelector("[data-reservar]");
        r.disabled = false; r.textContent = `Separar butaca ${elegida}`;
        return;
      }
      if (e.target.closest("[data-reservar]") && elegida) {
        await intentar(() => store.reservar(s.id, elegida), `¡Listo! Butaca ${elegida} separada.`).catch(() => {});
        cerrarSheet(); ir(vista);
      }
      if (e.target.closest("[data-cancelar]")) {
        await intentar(() => store.cancelarReserva(s.id), "Butaca liberada.").catch(() => {});
        cerrarSheet(); ir(vista);
      }
    };
  }

  // ------------------------------------------------------------ material y prácticas (compartido)
  const TIPO_DOC = { documento: "Documento", horario: "Horario", practica: "Práctica", grabacion: "Grabación", enlace: "Enlace" };
  async function vistaMaterial(view) {
    const [docs, cursos] = await Promise.all([store.documentos(), store.cursos()]);
    const staff = rol() !== "alumno";
    let filtro = "todos";
    const pintar = () => {
      const lista = docs.filter((d) => filtro === "todos" || d.tipo === filtro);
      view.querySelector("#docs").innerHTML = lista.length ? lista.map((d) => `
        <li class="glass doc">
          <span class="doc-ic t-${d.tipo}">${icon(d.tipo === "horario" ? "i-cal" : d.tipo === "grabacion" ? "i-rec" : "i-doc")}</span>
          <span class="doc-txt"><b>${esc(d.titulo)}</b><small>${TIPO_DOC[d.tipo] || d.tipo} · ${esc(d.curso?.nombre || "General")} · ${dia(d.creado)}</small></span>
          <button class="btn btn-glass btn-sm" data-abrir="${d.id}">Abrir</button>
        </li>`).join("") : `<li>${vacio("No hay material en esta categoría todavía.")}</li>`;
    };
    view.innerHTML = titulo("Material de clase", "Documentos y horarios", staff ? `<button class="btn btn-gold btn-sm" data-subir>${icon("i-plus")} Subir</button>` : "") + `
      <div class="filters">${["todos", "documento", "horario", "grabacion", "practica", "enlace"].map((t) => `<button class="pill ${t === "todos" ? "on" : ""}" data-f="${t}">${t === "todos" ? "Todo" : TIPO_DOC[t]}</button>`).join("")}</div>
      <ul class="docs" id="docs"></ul>`;
    pintar();
    view.onclick = async (e) => {
      const f = e.target.closest("[data-f]");
      if (f) { filtro = f.dataset.f; view.querySelectorAll("[data-f]").forEach((x) => x.classList.toggle("on", x === f)); return pintar(); }
      const a = e.target.closest("[data-abrir]");
      if (a) {
        const url = await intentar(() => store.abrirDocumento(docs.find((d) => d.id === +a.dataset.abrir)));
        if (url) window.open(url, "_blank", "noopener"); else toast("En el modo demo los archivos son de ejemplo.");
        return;
      }
      if (e.target.closest("[data-subir]")) {
        abrirSheet(`
          <h2 id="sheetTitle" class="sheet-h">Subir material</h2>
          <form id="docForm" class="form-grid">
            <label class="field"><span>Título</span><input id="dTitulo" required></label>
            <label class="field"><span>Tipo</span><select id="dTipo">${Object.entries(TIPO_DOC).map(([k, v]) => `<option value="${k}">${v}</option>`).join("")}</select></label>
            <label class="field"><span>Curso</span><select id="dCurso"><option value="">General (todos)</option>${cursos.map((c) => `<option value="${c.id}">${esc(c.nombre)}</option>`).join("")}</select></label>
            <label class="field"><span>Archivo (PDF, imagen, etc.)</span><input id="dArchivo" type="file"></label>
            <label class="field"><span>…o un enlace (Drive, YouTube, Meet)</span><input id="dUrl" type="url" placeholder="https://"></label>
            <button class="btn btn-gold" type="submit">Guardar</button>
          </form>`);
        document.getElementById("docForm").onsubmit = async (ev) => {
          ev.preventDefault();
          const titulo = document.getElementById("dTitulo").value.trim();
          const archivo = document.getElementById("dArchivo").files[0];
          const url = document.getElementById("dUrl").value.trim();
          if (!titulo) return toast("Escribe un título.", "err");
          if (!archivo && !url) return toast("Adjunta un archivo o pega un enlace.", "err");
          await intentar(() => store.subirDocumento({ titulo, archivo, url, tipo: document.getElementById("dTipo").value, curso_id: +document.getElementById("dCurso").value || null }), "Material publicado.");
          cerrarSheet(); ir("material");
        };
      }
    };
  }

  async function vistaPracticas(view) {
    const [practicas, cursos, intentos] = await Promise.all([store.practicas(), store.cursos(), store.intentos()]);
    const staff = rol() !== "alumno";
    view.innerHTML = titulo("Prácticas virtuales", "Practica y mide tu avance", staff ? `<button class="btn btn-gold btn-sm" data-nueva>${icon("i-plus")} Nueva</button>` : "") + `
      <div class="grid-cards">${practicas.length ? practicas.map((p) => {
        const mios = intentos.filter((i) => i.practica_id === p.id && i.alumno_id === yo.user.id);
        const mejor = mios.reduce((m, i) => Math.max(m, i.correctas), -1);
        const todos = intentos.filter((i) => i.practica_id === p.id);
        return `<article class="glass pr">
          <span class="chip">${esc(p.curso?.nombre || "General")}</span>
          <h3>${esc(p.titulo)}</h3>
          <p class="muted">${p.preguntas.length} preguntas${p.cierra ? ` · hasta el ${dia(p.cierra)}` : ""}</p>
          ${staff ? `<p class="pr-stat">${todos.length} intento(s)</p>` : mejor >= 0 ? `<p class="pr-stat">Tu mejor nota: <b>${mejor}/${p.preguntas.length}</b></p>` : ""}
          <button class="btn ${staff ? "btn-glass" : "btn-gold"} btn-sm" data-resolver="${p.id}">${staff ? "Vista previa" : mejor >= 0 ? "Intentar otra vez" : "Resolver"}</button>
        </article>`;
      }).join("") : vacio("Aún no hay prácticas publicadas.")}</div>`;

    view.onclick = (e) => {
      const r = e.target.closest("[data-resolver]");
      if (r) {
        const p = practicas.find((x) => x.id === +r.dataset.resolver);
        view.innerHTML = titulo(esc(p.curso?.nombre || "Práctica"), esc(p.titulo), `<button class="btn btn-glass btn-sm" data-volver>Volver</button>`) + `<div id="qz"></div>`;
        view.onclick = (ev) => { if (ev.target.closest("[data-volver]")) ir("practicas"); };
        window.AstrosQuiz.mount(view.querySelector("#qz"), {
          preguntas: p.preguntas,
          ctaFinal: () => `<button class="btn btn-gold" data-volver>Volver a prácticas</button>`,
          onFinish: async (res) => { if (!staff) await intentar(() => store.guardarIntento({ practica_id: p.id, correctas: res.correctas, total: res.total, respuestas: res.respuestas }), "Resultado guardado.").catch(() => {}); },
        });
        return;
      }
      if (e.target.closest("[data-nueva]")) nuevaPractica(cursos);
    };
  }

  function nuevaPractica(cursos) {
    const preguntas = [];
    const pintar = () => {
      sheetBody.querySelector("#pqList").innerHTML = preguntas.map((q, i) => `<li><b>${i + 1}.</b> ${esc(q.enunciado)} <small class="muted">(${"ABCDE"[q.correcta]})</small></li>`).join("") || `<li class="muted">Aún no agregas preguntas.</li>`;
    };
    abrirSheet(`
      <h2 id="sheetTitle" class="sheet-h">Nueva práctica</h2>
      <form id="prForm" class="form-grid">
        <label class="field"><span>Título</span><input id="pTitulo" required placeholder="Práctica 2: ecuaciones"></label>
        <label class="field"><span>Curso</span><select id="pCurso"><option value="">General</option>${cursos.map((c) => `<option value="${c.id}">${esc(c.nombre)}</option>`).join("")}</select></label>
        <label class="field"><span>Disponible hasta</span><input id="pCierra" type="date"></label>
        <fieldset class="q-builder">
          <legend>Agregar pregunta</legend>
          <label class="field"><span>Enunciado</span><textarea id="qEnun" rows="2"></textarea></label>
          ${[0, 1, 2, 3, 4].map((k) => `<label class="opt-in"><input type="radio" name="qOk" value="${k}" ${k === 0 ? "checked" : ""} aria-label="Marcar ${"ABCDE"[k]} como correcta"><span>${"ABCDE"[k]}</span><input id="qO${k}" placeholder="Opción ${"ABCDE"[k]}"></label>`).join("")}
          <label class="field"><span>Solución (opcional)</span><input id="qSol"></label>
          <button type="button" class="btn btn-glass btn-sm" data-addq>${icon("i-plus")} Agregar pregunta</button>
        </fieldset>
        <ol id="pqList" class="pq-list"></ol>
        <button class="btn btn-gold" type="submit">Publicar práctica</button>
      </form>`);
    pintar();
    sheetBody.onclick = (e) => {
      if (!e.target.closest("[data-addq]")) return;
      const g = (id) => document.getElementById(id).value.trim();
      const opciones = [0, 1, 2, 3, 4].map((k) => g("qO" + k)).filter(Boolean);
      if (!g("qEnun") || opciones.length < 2) return toast("Escribe el enunciado y al menos 2 opciones.", "err");
      const correcta = +sheetBody.querySelector('input[name="qOk"]:checked').value;
      if (correcta >= opciones.length) return toast("La respuesta correcta está vacía.", "err");
      preguntas.push({ enunciado: g("qEnun"), opciones, correcta, solucion: g("qSol") || undefined });
      ["qEnun", "qSol", "qO0", "qO1", "qO2", "qO3", "qO4"].forEach((id) => (document.getElementById(id).value = ""));
      pintar(); toast(`Pregunta ${preguntas.length} agregada.`);
    };
    document.getElementById("prForm").onsubmit = async (ev) => {
      ev.preventDefault();
      if (!document.getElementById("pTitulo").value.trim()) return toast("Escribe un título.", "err");
      if (!preguntas.length) return toast("Agrega al menos una pregunta.", "err");
      const cierra = document.getElementById("pCierra").value;
      await intentar(() => store.crearPractica({
        titulo: document.getElementById("pTitulo").value.trim(), curso_id: +document.getElementById("pCurso").value || null,
        preguntas, cierra: cierra ? new Date(cierra + "T23:59").toISOString() : null,
      }), "Práctica publicada.");
      cerrarSheet(); ir("practicas");
    };
  }

  // ------------------------------------------------------------ calendario del profesor
  async function vistaCalendario(view, { todos = false } = {}) {
    const desde = hoy0(), hasta = addDays(desde, 14);
    const [sesiones, cursos, profes] = await Promise.all([
      store.sesiones({ desde, hasta, profesorId: todos ? undefined : yo.user.id }),
      store.cursos(),
      todos ? store.perfiles("profesor").then(async (p) => [...(await store.perfiles("admin")), ...p]) : Promise.resolve([]),
    ]);
    let d = cache.calDia ? new Date(cache.calDia) : desde;
    if (d < desde || d > hasta) d = desde;
    const HORAS = Array.from({ length: 14 }, (_, k) => 8 + k); // 8:00 a 21:00

    const pintar = () => {
      const delDia = sesiones.filter((s) => mismoDia(s.inicio, d));
      view.querySelector("#calDays").innerHTML = Array.from({ length: 14 }, (_, k) => {
        const x = addDays(desde, k); const n = sesiones.filter((s) => mismoDia(s.inicio, x)).length;
        return `<button class="day" role="radio" aria-checked="${mismoDia(x, d)}" data-d="${+x}"><small>${dia(x, { weekday: "short" })}</small><b>${x.getDate()}</b>${n ? `<i class="dot-n">${n}</i>` : "<small>&nbsp;</small>"}</button>`;
      }).join("");
      view.querySelector("#calDay").textContent = diaLargo(d);
      view.querySelector("#calHours").innerHTML = HORAS.map((h) => {
        const ses = delDia.filter((s) => new Date(s.inicio).getHours() === h);
        const pasado = new Date(+d + h * 3600e3) < new Date();
        return `<div class="hour"><span class="h-lbl">${pad(h)}:00</span><div class="h-slot">
          ${ses.map((s) => `<button class="blk ${s.estado}" data-ver="${s.id}">
              <b>${esc(s.curso?.nombre || "Clase")}</b>
              <small>${hhmm(s.inicio)}–${hhmm(s.fin)} · ${s.reservas.length}/${s.capacidad} butacas${todos && s.profesor ? ` · ${esc(s.profesor.nombre)}` : ""}</small></button>`).join("")}
          ${!ses.length && !pasado ? `<button class="blk ghost" data-nueva="${h}">${icon("i-plus")} Abrir horario</button>` : ""}
        </div></div>`;
      }).join("");
    };

    view.innerHTML = titulo(todos ? "Todos los profesores" : "Tu disponibilidad", "Calendario", "") + `
      <p class="muted cal-help">Toca una hora libre para abrir un horario. Los alumnos matriculados en ese curso podrán separar butacas hasta llenarlo.</p>
      <div class="days" id="calDays" role="radiogroup" aria-label="Día"></div>
      <h2 class="cal-day" id="calDay"></h2>
      <div class="hours" id="calHours"></div>`;
    pintar();

    view.onclick = async (e) => {
      const db = e.target.closest("[data-d]");
      if (db) { d = new Date(+db.dataset.d); cache.calDia = +d; return pintar(); }
      const ver = e.target.closest("[data-ver]");
      if (ver) return detalleSesion(sesiones.find((s) => s.id === +ver.dataset.ver));
      const nv = e.target.closest("[data-nueva]");
      if (nv) {
        const h = +nv.dataset.nueva;
        abrirSheet(`
          <p class="eyebrow">${diaLargo(d)} · ${pad(h)}:00</p>
          <h2 id="sheetTitle" class="sheet-h">Abrir horario</h2>
          <form id="sesForm" class="form-grid">
            ${todos ? `<label class="field"><span>Profesor</span><select id="sProf">${profes.map((p) => `<option value="${p.id}" ${p.id === yo.user.id ? "selected" : ""}>${esc(p.nombre)}</option>`).join("")}</select></label>` : ""}
            <label class="field"><span>Curso</span><select id="sCurso" required>${cursos.map((c) => `<option value="${c.id}">${esc(c.nombre)} · ${NIVEL[c.nivel]}</option>`).join("")}</select></label>
            <div class="row2">
              <label class="field"><span>Duración</span><select id="sDur"><option value="1">1 hora</option><option value="1.5">1 h 30</option><option value="2" selected>2 horas</option><option value="3">3 horas</option></select></label>
              <label class="field"><span>Butacas</span><input id="sCap" type="number" min="1" max="30" value="6" inputmode="numeric"></label>
            </div>
            <label class="field"><span>Modalidad</span><select id="sMod"><option value="virtual">Virtual</option><option value="presencial">Presencial</option><option value="domicilio">A domicilio</option></select></label>
            <label class="field"><span>Tema (opcional)</span><input id="sTema" placeholder="Ej.: Límites y continuidad"></label>
            <label class="field"><span>Enlace de la clase (Meet, Zoom)</span><input id="sEnlace" type="url" placeholder="https://meet.google.com/…"></label>
            <label class="check"><input type="checkbox" id="sRep"> Repetir las próximas 4 semanas</label>
            <button class="btn btn-gold" type="submit">Abrir horario</button>
          </form>`);
        document.getElementById("sesForm").onsubmit = async (ev) => {
          ev.preventDefault();
          const g = (id) => document.getElementById(id)?.value;
          const cap = Math.max(1, Math.min(30, +g("sCap") || 1));
          const veces = document.getElementById("sRep").checked ? 4 : 1;
          for (let k = 0; k < veces; k++) {
            const inicio = new Date(+d + h * 3600e3 + k * 7 * 864e5);
            await intentar(() => store.crearSesion({
              profesor_id: todos ? g("sProf") : yo.user.id, curso_id: +g("sCurso"), inicio: inicio.toISOString(),
              fin: new Date(+inicio + +g("sDur") * 3600e3).toISOString(), capacidad: cap, modalidad: g("sMod"),
              tema: g("sTema") || null, enlace: g("sEnlace") || null,
            }));
          }
          toast(veces > 1 ? "Se abrieron 4 horarios." : "Horario abierto.");
          cerrarSheet(); ir(vista);
        };
      }
    };
  }

  async function detalleSesion(s) {
    const alumnos = await store.perfiles("alumno").catch(() => []);
    const nombre = (id) => alumnos.find((a) => a.id === id)?.nombre || "Alumno";
    abrirSheet(`
      <p class="eyebrow">${MOD[s.modalidad]} · ${s.reservas.length}/${s.capacidad} butacas</p>
      <h2 id="sheetTitle" class="sheet-h">${esc(s.curso?.nombre || "Clase")}</h2>
      <p class="muted">${diaLargo(s.inicio)} · ${hhmm(s.inicio)}–${hhmm(s.fin)}${s.profesor ? ` · ${esc(s.profesor.nombre)}` : ""}</p>
      ${s.tema ? `<p class="ses-tema">${esc(s.tema)}</p>` : ""}
      <h3 class="mini-h">Alumnos con butaca</h3>
      <ul class="roster">${s.reservas.length ? s.reservas.sort((a, b) => a.butaca - b.butaca).map((r) => `<li><span class="seat-n">${r.butaca}</span>${esc(nombre(r.alumno_id))}</li>`).join("") : `<li class="muted">Todavía nadie separó butaca.</li>`}</ul>
      <div class="sheet-actions">
        <button class="btn btn-glass" data-butacas>Ver butacas</button>
        ${s.enlace ? `<a class="btn btn-gold" href="${esc(s.enlace)}" target="_blank" rel="noopener">Abrir enlace</a>` : ""}
        <button class="btn btn-danger" data-borrar>Eliminar horario</button>
      </div>`);
    sheetBody.onclick = async (e) => {
      if (e.target.closest("[data-butacas]")) return abrirButacas(s.id);
      const b = e.target.closest("[data-borrar]");
      if (b) {
        if (!b.dataset.sure) { b.dataset.sure = "1"; b.textContent = s.reservas.length ? `Hay ${s.reservas.length} alumno(s). ¿Eliminar igual?` : "¿Seguro? Toca otra vez"; return; }
        await intentar(() => store.borrarSesion(s.id), "Horario eliminado.");
        cerrarSheet(); ir(vista);
      }
    };
  }

  // ------------------------------------------------------------ vistas por rol
  const VISTAS = {
    alumno: {
      async inicio(view) {
        const mats = await store.matriculas(yo.user.id);
        const ses = await store.sesiones({ desde: new Date(Date.now() - 3 * 3600e3), cursoIds: mats.map((m) => m.curso_id) });
        const mias = ses.filter((s) => s.reservas.some((r) => r.alumno_id === yo.user.id));
        const prox = mias[0];
        view.innerHTML = titulo(dia(new Date(), { weekday: "long", day: "numeric", month: "long" }), `Hola, ${esc((yo.perfil.nombre || "").split(" ")[0])}`) + `
          ${prox ? `<article class="glass next">
              <p class="eyebrow">Tu próxima clase</p>
              <h2>${esc(prox.curso?.nombre)}</h2>
              <p>${diaLargo(prox.inicio)} · ${hhmm(prox.inicio)} · Butaca ${prox.reservas.find((r) => r.alumno_id === yo.user.id).butaca}</p>
              <div class="next-act">${prox.enlace ? `<a class="btn btn-gold" href="${esc(prox.enlace)}" target="_blank" rel="noopener">Entrar a la clase</a>` : ""}<a class="btn btn-glass" href="#horario">Ver horario</a></div>
            </article>` : `<article class="glass next"><p class="eyebrow">Sin clases separadas</p><h2>Separa tu próxima clase</h2><p class="muted">Elige un horario de tu profesor y toma tu butaca.</p><div class="next-act"><a class="btn btn-gold" href="#reservar">Reservar clase</a></div></article>`}
          <h2 class="sub-h">Mis cursos</h2>
          <div class="grid-cards">${mats.length ? mats.map((m) => {
            const rest = m.horas_compradas - m.horas_usadas; const pct = m.horas_compradas ? (m.horas_usadas / m.horas_compradas) * 100 : 0;
            return `<article class="glass curso">
              <span class="chip">${NIVEL[m.curso?.nivel] || ""}</span>
              <h3>${esc(m.curso?.nombre)}</h3>
              <p class="muted">${esc(m.paquete || "")}</p>
              <div class="cap"><i><em style="width:${pct}%"></em></i><span><b>${rest}</b> h por usar de ${m.horas_compradas}</span></div>
            </article>`;
          }).join("") : vacio("Aún no tienes cursos matriculados. Escríbenos para activar tu paquete.", `<a class="btn btn-gold btn-sm" href="${wa(null, "Hola ASTROS, quiero activar mi paquete en el aula virtual.")}" target="_blank" rel="noopener">Escribir por WhatsApp</a>`)}</div>`;
      },
      async reservar(view) {
        const mats = await store.matriculas(yo.user.id);
        const ses = (await store.sesiones({ desde: new Date(), cursoIds: mats.map((m) => m.curso_id) }));
        view.innerHTML = titulo("Horarios de tus profesores", "Reserva tu butaca") + `
          <p class="muted cal-help">Solo ves los horarios de los cursos en los que estás matriculado. Cuando se llenan las butacas, la clase se cierra.</p>
          <div class="list">${ses.length ? ses.map((s) => {
            const mia = s.reservas.some((r) => r.alumno_id === yo.user.id);
            const llena = s.reservas.length >= s.capacidad;
            return cardSesion(s, { accion: `<button class="btn ${mia ? "btn-glass" : llena ? "btn-glass" : "btn-gold"} btn-sm" data-cine="${s.id}" ${llena && !mia ? "disabled" : ""}>${mia ? "Ver mi butaca" : llena ? "Llena" : "Elegir butaca"}</button>` });
          }).join("") : vacio("Tus profesores aún no han abierto horarios. Vuelve pronto o escríbele a tu docente.", `<a class="btn btn-glass btn-sm" href="#contacto">Contactar</a>`)}</div>`;
        view.onclick = (e) => { const c = e.target.closest("[data-cine]"); if (c) abrirButacas(+c.dataset.cine); };
      },
      async horario(view) {
        const ses = (await store.sesiones({ desde: hoy0() })).filter((s) => s.reservas.some((r) => r.alumno_id === yo.user.id));
        const porDia = {};
        ses.forEach((s) => { const k = new Date(s.inicio).toDateString(); (porDia[k] = porDia[k] || []).push(s); });
        view.innerHTML = titulo("Tus clases separadas", "Mi horario") + (ses.length ? Object.entries(porDia).map(([k, l]) => `
          <h2 class="sub-h">${diaLargo(new Date(k))}</h2><div class="list">${l.map((s) => cardSesion(s, { accion: `<button class="btn btn-glass btn-sm" data-cine="${s.id}">Detalle</button>` })).join("")}</div>`).join("")
          : vacio("No tienes clases separadas.", `<a class="btn btn-gold btn-sm" href="#reservar">Reservar clase</a>`));
        view.onclick = (e) => { const c = e.target.closest("[data-cine]"); if (c) abrirButacas(+c.dataset.cine); };
      },
      material: vistaMaterial,
      practicas: vistaPracticas,
      async contacto(view) {
        const mats = await store.matriculas(yo.user.id);
        const profes = [...new Map(mats.filter((m) => m.profesor).map((m) => [m.profesor.id, { ...m.profesor, cursos: mats.filter((x) => x.profesor?.id === m.profesor.id).map((x) => x.curso?.nombre) }])).values()];
        view.innerHTML = titulo("¿Dudas?", "Contacta a tu docente") + `
          <div class="grid-cards">
            ${profes.map((p) => `<article class="glass contacto-card">
              <span class="avatar">${esc((p.nombre || "?").replace(/^Prof\.\s*/, "")[0])}</span>
              <h3>${esc(p.nombre)}</h3><p class="muted">${p.cursos.map(esc).join(", ")}</p>
              <a class="btn btn-gold btn-sm" target="_blank" rel="noopener" href="${wa(p.telefono, `Hola ${p.nombre}, soy ${yo.perfil.nombre}, tengo una consulta sobre ${p.cursos[0]}.`)}">${icon("i-wa")} WhatsApp</a>
            </article>`).join("")}
            <article class="glass contacto-card">
              <span class="avatar">A</span><h3>Coordinación ASTROS</h3><p class="muted">Pagos, horas y horarios</p>
              <a class="btn btn-glass btn-sm" target="_blank" rel="noopener" href="${wa(null, `Hola ASTROS, soy ${yo.perfil.nombre}.`)}">${icon("i-wa")} WhatsApp</a>
            </article>
            <article class="glass contacto-card bot">
              <span class="avatar">${icon("i-bot")}</span><h3>Asistente ASTROS</h3>
              <p class="muted">Muy pronto: un asistente por WhatsApp que responde dudas frecuentes y te recuerda tus clases.</p>
              <span class="chip">Próximamente</span>
            </article>
          </div>`;
      },
    },

    profesor: {
      async inicio(view) {
        const ses = await store.sesiones({ desde: hoy0(), hasta: addDays(hoy0(), 7), profesorId: yo.user.id });
        const hoy = ses.filter((s) => mismoDia(s.inicio, new Date()));
        const butacas = ses.reduce((n, s) => n + s.reservas.length, 0), aforo = ses.reduce((n, s) => n + s.capacidad, 0);
        view.innerHTML = titulo(dia(new Date(), { weekday: "long", day: "numeric", month: "long" }), `Hola, ${esc((yo.perfil.nombre || "").split(" ")[0])}`) + `
          <div class="kpis">
            <div class="glass kpi"><b>${ses.length}</b><span>clases esta semana</span></div>
            <div class="glass kpi"><b>${butacas}/${aforo}</b><span>butacas separadas</span></div>
            <div class="glass kpi"><b>${hoy.length}</b><span>clases hoy</span></div>
          </div>
          <h2 class="sub-h">Próximas clases</h2>
          <div class="list">${ses.length ? ses.slice(0, 6).map((s) => cardSesion(s, { mostrarProfe: false, accion: `<button class="btn btn-glass btn-sm" data-ver="${s.id}">Detalle</button>` })).join("") : vacio("No tienes horarios abiertos esta semana.", `<a class="btn btn-gold btn-sm" href="#calendario">Abrir horarios</a>`)}</div>`;
        view.onclick = (e) => { const v = e.target.closest("[data-ver]"); if (v) detalleSesion(ses.find((s) => s.id === +v.dataset.ver)); };
      },
      calendario: (v) => vistaCalendario(v),
      material: vistaMaterial,
      practicas: vistaPracticas,
      async alumnos(view) {
        const mats = (await store.matriculas()).filter((m) => m.profesor_id === yo.user.id || rol() === "admin");
        view.innerHTML = titulo("Tus alumnos", "Alumnos") + `<div class="list">${mats.length ? mats.map((m) => filaMatricula(m)).join("") : vacio("Aún no tienes alumnos asignados.")}</div>`;
      },
    },

    admin: {
      async inicio(view) {
        const [ses, mats, citas, alumnos] = await Promise.all([
          store.sesiones({ desde: hoy0(), hasta: addDays(hoy0(), 7) }), store.matriculas(), store.citas(), store.perfiles("alumno"),
        ]);
        const aforo = ses.reduce((n, s) => n + s.capacidad, 0), ocup = ses.reduce((n, s) => n + s.reservas.length, 0);
        const pend = citas.filter((c) => c.estado === "pendiente" && new Date(c.inicio) > new Date());
        const horas = mats.reduce((n, m) => n + (m.horas_compradas - m.horas_usadas), 0);
        view.innerHTML = titulo(dia(new Date(), { weekday: "long", day: "numeric", month: "long" }), "Resumen") + `
          <div class="kpis">
            <div class="glass kpi"><b>${alumnos.length}</b><span>alumnos</span></div>
            <div class="glass kpi"><b>${ses.length}</b><span>clases en 7 días</span></div>
            <div class="glass kpi"><b>${aforo ? Math.round((ocup / aforo) * 100) : 0} %</b><span>butacas ocupadas</span></div>
            <div class="glass kpi ${pend.length ? "warn" : ""}"><b>${pend.length}</b><span>citas por confirmar</span></div>
            <div class="glass kpi"><b>${horas}</b><span>horas por dictar</span></div>
          </div>
          ${pend.length ? `<h2 class="sub-h">Citas de padres por confirmar</h2><div class="list">${pend.slice(0, 3).map(filaCita).join("")}</div>` : ""}
          <h2 class="sub-h">Próximas clases</h2>
          <div class="list">${ses.length ? ses.slice(0, 5).map((s) => cardSesion(s, { accion: `<button class="btn btn-glass btn-sm" data-ver="${s.id}">Detalle</button>` })).join("") : vacio("No hay clases esta semana.")}</div>`;
        view.onclick = (e) => { const v = e.target.closest("[data-ver]"); if (v) detalleSesion(ses.find((s) => s.id === +v.dataset.ver)); accionCita(e); };
      },
      calendario: (v) => vistaCalendario(v, { todos: true }),
      async alumnos(view) {
        const [mats, alumnos, cursos, profes] = await Promise.all([store.matriculas(), store.perfiles("alumno"), store.cursos(), store.perfiles("profesor")]);
        const admins = await store.perfiles("admin");
        view.innerHTML = titulo("Matrículas", "Alumnos", `<button class="btn btn-gold btn-sm" data-mat>${icon("i-plus")} Matricular</button>`) + `
          <div class="list">${mats.length ? mats.map(filaMatricula).join("") : vacio("Aún no hay matrículas.")}</div>
          <h2 class="sub-h">Cursos</h2>
          <div class="filters">${cursos.map((c) => `<span class="pill">${esc(c.nombre)} · ${NIVEL[c.nivel]}</span>`).join("")}<button class="pill on" data-curso>${icon("i-plus")} Curso</button></div>`;
        view.onclick = (e) => {
          if (e.target.closest("[data-curso]")) {
            abrirSheet(`<h2 id="sheetTitle" class="sheet-h">Nuevo curso</h2>
              <form id="cForm" class="form-grid">
                <label class="field"><span>Nombre</span><input id="cNom" required placeholder="Ej.: Química 1"></label>
                <label class="field"><span>Nivel</span><select id="cNiv">${Object.entries(NIVEL).map(([k, v]) => `<option value="${k}">${v}</option>`).join("")}</select></label>
                <label class="field"><span>Universidad (opcional)</span><select id="cUni"><option value="">—</option><option>PUCP</option><option>ULIMA</option><option>UPC</option><option>UPCH</option></select></label>
                <button class="btn btn-gold" type="submit">Crear curso</button></form>`);
            document.getElementById("cForm").onsubmit = async (ev) => {
              ev.preventDefault();
              await intentar(() => store.crearCurso({ nombre: document.getElementById("cNom").value.trim(), nivel: document.getElementById("cNiv").value, universidad: document.getElementById("cUni").value || null }), "Curso creado.");
              cerrarSheet(); ir("alumnos");
            };
          }
          if (e.target.closest("[data-mat]")) {
            abrirSheet(`<h2 id="sheetTitle" class="sheet-h">Matricular alumno</h2>
              <form id="mForm" class="form-grid">
                <label class="field"><span>Alumno</span><select id="mAl">${alumnos.map((a) => `<option value="${a.id}">${esc(a.nombre)} · ${esc(a.email || "")}</option>`).join("")}</select></label>
                <label class="field"><span>Curso</span><select id="mCu">${cursos.map((c) => `<option value="${c.id}">${esc(c.nombre)} · ${NIVEL[c.nivel]}</option>`).join("")}</select></label>
                <label class="field"><span>Profesor</span><select id="mPr">${[...admins, ...profes].map((p) => `<option value="${p.id}">${esc(p.nombre)}</option>`).join("")}</select></label>
                <div class="row2">
                  <label class="field"><span>Paquete</span><input id="mPa" placeholder="Pack 12 horas"></label>
                  <label class="field"><span>Horas</span><input id="mHo" type="number" min="1" value="12" inputmode="numeric"></label>
                </div>
                <p class="muted small">¿El alumno no aparece? Pídele que cree su cuenta en el aula con su correo.</p>
                <button class="btn btn-gold" type="submit">Matricular</button></form>`);
            document.getElementById("mForm").onsubmit = async (ev) => {
              ev.preventDefault();
              const g = (id) => document.getElementById(id).value;
              await intentar(() => store.matricular({ alumno_id: g("mAl"), curso_id: +g("mCu"), profesor_id: g("mPr"), paquete: g("mPa") || null, horas_compradas: +g("mHo") || 0, activo: true }), "Alumno matriculado.");
              cerrarSheet(); ir("alumnos");
            };
          }
        };
      },
      async citas(view) {
        const citas = await store.citas();
        const futuras = citas.filter((c) => new Date(c.inicio) >= hoy0());
        view.innerHTML = titulo("Padres de familia", "Citas") + `
          <p class="muted cal-help">Consultas digitales reservadas desde la web. Confírmalas por WhatsApp y marca su estado.</p>
          <div class="list">${futuras.length ? futuras.map(filaCita).join("") : vacio("No hay citas próximas.")}</div>`;
        view.onclick = accionCita;
      },
      material: vistaMaterial,
      practicas: vistaPracticas,
      async usuarios(view) {
        const todos = await store.perfiles();
        view.innerHTML = titulo("Accesos", "Usuarios y roles") + `
          <p class="muted cal-help">Cada persona crea su cuenta con su correo. Aquí decides si es alumno, profesor o administración.</p>
          <div class="list">${todos.map((p) => `
            <article class="glass user-row">
              <span class="avatar">${esc((p.nombre || p.email || "?")[0])}</span>
              <span class="u-txt"><b>${esc(p.nombre)}</b><small>${esc(p.email || "")}</small></span>
              <label class="field u-rol"><span class="sr">Rol</span>
                <select data-rol="${p.id}" ${p.id === yo.user.id ? "disabled" : ""}>${Object.entries(ROL).map(([k, v]) => `<option value="${k}" ${p.rol === k ? "selected" : ""}>${v}</option>`).join("")}</select>
              </label>
              <label class="field u-tel"><span class="sr">WhatsApp</span><input data-tel="${p.id}" value="${esc(p.telefono || "")}" placeholder="WhatsApp" inputmode="tel"></label>
            </article>`).join("")}</div>`;
        view.onchange = async (e) => {
          const r = e.target.closest("[data-rol]"); if (r) await intentar(() => store.actualizarPerfil(r.dataset.rol, { rol: r.value }), "Rol actualizado.").catch(() => {});
          const t = e.target.closest("[data-tel]"); if (t) await intentar(() => store.actualizarPerfil(t.dataset.tel, { telefono: t.value.trim() || null }), "WhatsApp guardado.").catch(() => {});
        };
      },
    },
  };

  function filaMatricula(m) {
    const rest = m.horas_compradas - m.horas_usadas;
    return `<article class="glass user-row">
      <span class="avatar">${esc((m.alumno?.nombre || "?")[0])}</span>
      <span class="u-txt"><b>${esc(m.alumno?.nombre || "Alumno")}</b><small>${esc(m.curso?.nombre || "")} · ${esc(m.paquete || "")} · Prof. ${esc(m.profesor?.nombre || "—")}</small></span>
      <span class="hrs ${rest <= 2 ? "low" : ""}"><b>${rest}</b><small>h restantes</small></span>
    </article>`;
  }

  const EST = { pendiente: "Por confirmar", confirmada: "Confirmada", realizada: "Realizada", cancelada: "Cancelada" };
  function filaCita(c) {
    return `<article class="glass cita est-${c.estado}">
      <div class="ses-date"><b>${new Date(c.inicio).getDate()}</b><small>${dia(c.inicio, { month: "short" })}</small></div>
      <div class="ses-main">
        <h3>${esc(c.padre_nombre)}${c.alumno_nombre ? ` <small class="muted">· ${esc(c.alumno_nombre)}</small>` : ""}</h3>
        <p class="muted">${dia(c.inicio, { weekday: "long" })} · ${hhmm(c.inicio)} · ${NIVEL[c.nivel] || ""} · ${esc(c.whatsapp)}</p>
        ${c.motivo ? `<p class="ses-tema">${esc(c.motivo)}</p>` : ""}
        <div class="cita-act">
          <select data-estcita="${c.id}" aria-label="Estado de la cita">${Object.entries(EST).map(([k, v]) => `<option value="${k}" ${c.estado === k ? "selected" : ""}>${v}</option>`).join("")}</select>
          <a class="btn btn-glass btn-sm" target="_blank" rel="noopener" href="${wa(c.whatsapp, `Hola ${c.padre_nombre}, le saluda ASTROS. Confirmamos su consulta del ${diaLargo(c.inicio)} a las ${hhmm(c.inicio)}. Este es el enlace: `)}">${icon("i-wa")} Escribir</a>
        </div>
      </div>
    </article>`;
  }
  function accionCita(e) {
    const s = e.target.closest?.("[data-estcita]");
    if (s && !s.dataset.bound) {
      s.dataset.bound = "1";
      s.addEventListener("change", () => intentar(() => store.actualizarCita(+s.dataset.estcita, s.value), "Cita actualizada.").then(() => ir(vista)).catch(() => {}));
    }
  }
  document.addEventListener("focusin", accionCita);

  // ------------------------------------------------------------ arranque
  async function iniciar() {
    if (!yo) return pantallaLogin();
    shell();
    ir(location.hash.slice(1) || "inicio");
  }
  store.onAuth(async () => { const s = await store.sesion().catch(() => null); if (!!s !== !!yo) { yo = s; iniciar(); } });
  yo = await store.sesion().catch(() => null);
  iniciar();
})();
