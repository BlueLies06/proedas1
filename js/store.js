// ASTROS · capa de datos
// Una sola interfaz con dos motores:
//  - Supabase (real) cuando js/config.js tiene URL y clave.
//  - Demo (localStorage) cuando no, con datos de ejemplo para mostrar el aula.
(() => {
  const CFG = window.ASTROS_CONFIG || {};
  const SUPABASE_JS = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.2/dist/umd/supabase.js";
  const isReal = Boolean(CFG.supabaseUrl && CFG.supabaseAnonKey);

  const loadScript = (src) => new Promise((ok, fail) => {
    const s = document.createElement("script");
    s.src = src; s.onload = ok; s.onerror = () => fail(new Error("No se pudo cargar " + src));
    document.head.appendChild(s);
  });

  // ---------------------------------------------------------------- Supabase
  function supabaseStore(sb) {
    const must = ({ data, error }) => { if (error) throw new Error(traducir(error.message)); return data; };
    const uid = async () => (await sb.auth.getUser()).data.user?.id;

    return {
      modo: "real",
      // Auth
      async sesion() {
        const { data } = await sb.auth.getSession();
        if (!data.session) return null;
        const perfil = must(await sb.from("perfiles").select("*").eq("id", data.session.user.id).single());
        return { user: data.session.user, perfil };
      },
      async entrar(email, password) { must(await sb.auth.signInWithPassword({ email, password })); return this.sesion(); },
      async registrarse(email, password, nombre) {
        must(await sb.auth.signUp({ email, password, options: { data: { nombre } } }));
        return this.sesion();
      },
      async recuperar(email) { must(await sb.auth.resetPasswordForEmail(email, { redirectTo: location.href.split("#")[0] })); },
      async salir() { await sb.auth.signOut(); },
      onAuth(cb) { sb.auth.onAuthStateChange(() => cb()); },

      // Público
      async citasOcupadas(desde, hasta) {
        return must(await sb.rpc("citas_ocupadas", { desde: desde.toISOString(), hasta: hasta.toISOString() })).map((x) => new Date(x).getTime());
      },
      async crearCita(c) { must(await sb.from("citas").insert(c)); },
      async guardarSimulacro(r) { must(await sb.from("simulacros").insert(r)); },

      // Catálogo
      async cursos() { return must(await sb.from("cursos").select("*").order("nivel").order("nombre")); },
      async crearCurso(c) { return must(await sb.from("cursos").insert(c).select().single()); },
      async perfiles(rol) {
        let q = sb.from("perfiles").select("*").order("nombre");
        if (rol) q = q.eq("rol", rol);
        return must(await q);
      },
      async actualizarPerfil(id, cambios) { must(await sb.from("perfiles").update(cambios).eq("id", id)); },

      // Matrículas
      async matriculas(alumnoId) {
        let q = sb.from("matriculas").select("*, curso:cursos(*), alumno:perfiles!matriculas_alumno_id_fkey(id,nombre), profesor:perfiles!matriculas_profesor_id_fkey(id,nombre,telefono)");
        if (alumnoId) q = q.eq("alumno_id", alumnoId);
        return must(await q.order("creado", { ascending: false }));
      },
      async matricular(m) { must(await sb.from("matriculas").upsert(m, { onConflict: "alumno_id,curso_id" })); },

      // Sesiones y butacas
      async sesiones({ desde, hasta, profesorId, cursoIds } = {}) {
        let q = sb.from("sesiones").select("*, curso:cursos(*), profesor:perfiles(id,nombre,telefono), reservas(id,butaca,alumno_id)").neq("estado", "cancelada");
        if (desde) q = q.gte("inicio", desde.toISOString());
        if (hasta) q = q.lte("inicio", hasta.toISOString());
        if (profesorId) q = q.eq("profesor_id", profesorId);
        if (cursoIds) q = q.in("curso_id", cursoIds.length ? cursoIds : [-1]);
        return must(await q.order("inicio"));
      },
      async crearSesion(s) { return must(await sb.from("sesiones").insert(s).select().single()); },
      async borrarSesion(id) { must(await sb.from("sesiones").delete().eq("id", id)); },
      async reservar(sesionId, butaca) { must(await sb.from("reservas").insert({ sesion_id: sesionId, butaca, alumno_id: await uid() })); },
      async cancelarReserva(sesionId) { must(await sb.from("reservas").delete().eq("sesion_id", sesionId).eq("alumno_id", await uid())); },

      // Documentos y prácticas
      async documentos() { return must(await sb.from("documentos").select("*, curso:cursos(nombre)").order("creado", { ascending: false })); },
      async subirDocumento({ archivo, titulo, tipo, curso_id, url }) {
        let ruta = null;
        if (archivo) {
          ruta = `${curso_id || "general"}/${Date.now()}-${archivo.name.replace(/[^\w.-]+/g, "_")}`;
          must(await sb.storage.from("documentos").upload(ruta, archivo));
        }
        must(await sb.from("documentos").insert({ titulo, tipo, curso_id: curso_id || null, url: url || null, ruta, subido_por: await uid() }));
      },
      async abrirDocumento(doc) {
        if (doc.url) return doc.url;
        return must(await sb.storage.from("documentos").createSignedUrl(doc.ruta, 3600)).signedUrl;
      },
      async practicas() { return must(await sb.from("practicas").select("*, curso:cursos(nombre)").order("creado", { ascending: false })); },
      async crearPractica(p) { must(await sb.from("practicas").insert(p)); },
      async guardarIntento(i) { must(await sb.from("intentos").insert({ ...i, alumno_id: await uid() })); },
      async intentos() { return must(await sb.from("intentos").select("*").order("creado", { ascending: false })); },

      // Citas (staff)
      async citas() { return must(await sb.from("citas").select("*").order("inicio")); },
      async actualizarCita(id, estado) { must(await sb.from("citas").update({ estado }).eq("id", id)); },
    };
  }

  function traducir(msg) {
    const m = {
      "Invalid login credentials": "Correo o contraseña incorrectos.",
      "Email not confirmed": "Confirma tu correo: revisa tu bandeja de entrada.",
      "User already registered": "Ese correo ya tiene una cuenta. Inicia sesión.",
      "duplicate key value violates unique constraint \"reservas_sesion_id_butaca_key\"": "Alguien acaba de tomar esa butaca. Elige otra.",
      "duplicate key value violates unique constraint \"reservas_sesion_id_alumno_id_key\"": "Ya tienes una butaca en esta clase.",
      "duplicate key value violates unique constraint \"citas_horario_unico\"": "Ese horario se acaba de ocupar. Elige otro.",
    };
    return m[msg] || msg;
  }

  // ---------------------------------------------------------------- Demo
  function demoStore() {
    const KEY = "astros-demo-v1";
    const day = (n, h, m = 0) => { const d = new Date(); d.setHours(h, m, 0, 0); d.setDate(d.getDate() + n); return d.toISOString(); };
    const addH = (iso, h) => new Date(new Date(iso).getTime() + h * 3600e3).toISOString();

    function seed() {
      const P = {
        admin: { id: "u-admin", nombre: "Dirección ASTROS", email: "admin@demo", rol: "admin", telefono: CFG.whatsapp },
        prof: { id: "u-prof", nombre: "Prof. Andrea (demo)", email: "profe@demo", rol: "profesor", telefono: CFG.whatsapp },
        lucia: { id: "u-lucia", nombre: "Lucía Ramos (demo)", email: "lucia@demo", rol: "alumno", nivel: "pre", universidad: "PUCP" },
        diego: { id: "u-diego", nombre: "Diego Torres (demo)", email: "diego@demo", rol: "alumno", nivel: "universitario", universidad: "UPC" },
        sofia: { id: "u-sofia", nombre: "Sofía Vega (demo)", email: "sofia@demo", rol: "alumno", nivel: "pre", universidad: "ULIMA" },
      };
      const cursos = [
        { id: 1, nombre: "Matemática escolar", nivel: "escolar", universidad: null, activo: true },
        { id: 2, nombre: "Razonamiento matemático", nivel: "pre", universidad: null, activo: true },
        { id: 3, nombre: "Razonamiento verbal", nivel: "pre", universidad: null, activo: true },
        { id: 4, nombre: "Cálculo 1", nivel: "universitario", universidad: "PUCP", activo: true },
        { id: 5, nombre: "Física 1", nivel: "universitario", universidad: "UPC", activo: true },
      ];
      const matriculas = [
        { id: 1, alumno_id: "u-lucia", curso_id: 2, profesor_id: "u-admin", paquete: "Programa mensual 24 horas", horas_compradas: 24, horas_usadas: 6, activo: true },
        { id: 2, alumno_id: "u-lucia", curso_id: 3, profesor_id: "u-prof", paquete: "Pack 12 horas", horas_compradas: 12, horas_usadas: 2, activo: true },
        { id: 3, alumno_id: "u-diego", curso_id: 4, profesor_id: "u-admin", paquete: "Ciclo completo", horas_compradas: 32, horas_usadas: 10, activo: true },
        { id: 4, alumno_id: "u-sofia", curso_id: 2, profesor_id: "u-admin", paquete: "Pack 12 horas", horas_compradas: 12, horas_usadas: 0, activo: true },
      ];
      const ses = (id, prof, curso, d, h, dur, cap, modalidad, tema) => {
        const inicio = day(d, h); return { id, profesor_id: prof, curso_id: curso, inicio, fin: addH(inicio, dur), capacidad: cap, modalidad, tema, enlace: "https://meet.google.com/", estado: "abierta" };
      };
      const sesiones = [
        ses(1, "u-admin", 2, 1, 17, 2, 6, "virtual", "Fracciones y porcentajes"),
        ses(2, "u-admin", 4, 1, 19, 2, 4, "virtual", "Límites y continuidad"),
        ses(3, "u-prof", 3, 2, 16, 2, 6, "virtual", "Comprensión lectora"),
        ses(4, "u-admin", 2, 3, 18, 2, 6, "presencial", "Simulacro PUCP comentado"),
        ses(5, "u-admin", 4, 4, 20, 2, 1, "virtual", "Asesoría 1 a 1: derivadas"),
        ses(6, "u-prof", 3, 5, 10, 2, 8, "virtual", "Analogías y conectores"),
      ];
      const reservas = [
        { id: 1, sesion_id: 1, alumno_id: "u-sofia", butaca: 2 },
        { id: 2, sesion_id: 1, alumno_id: "x1", butaca: 4 },
        { id: 3, sesion_id: 1, alumno_id: "x2", butaca: 5 },
        { id: 4, sesion_id: 4, alumno_id: "x3", butaca: 1 },
        { id: 5, sesion_id: 2, alumno_id: "u-diego", butaca: 1 },
      ];
      const documentos = [
        { id: 1, curso_id: 2, titulo: "Separata: fracciones y porcentajes", tipo: "documento", url: "#", creado: day(-2, 10) },
        { id: 2, curso_id: 2, titulo: "Horario de la semana", tipo: "horario", url: "#", creado: day(-1, 9) },
        { id: 3, curso_id: 4, titulo: "Grabación: límites (clase 3)", tipo: "grabacion", url: "#", creado: day(-3, 21) },
        { id: 4, curso_id: 3, titulo: "Lecturas para la práctica 1", tipo: "documento", url: "#", creado: day(-4, 18) },
        { id: 5, curso_id: null, titulo: "Reglamento del aula virtual", tipo: "documento", url: "#", creado: day(-10, 9) },
      ];
      const practicas = [
        { id: 1, curso_id: 2, titulo: "Práctica 1: porcentajes", cierra: day(5, 23), preguntas: [
          { enunciado: "¿Cuál es el 20 % del 15 % de 400?", opciones: ["8", "12", "16", "20", "24"], correcta: 1, area: "Aritmética", solucion: "15 % de 400 = 60; 20 % de 60 = 12." },
          { enunciado: "Un artículo cuesta S/ 80 y se rebaja 25 %. ¿Cuál es el nuevo precio?", opciones: ["S/ 55", "S/ 60", "S/ 62", "S/ 65", "S/ 70"], correcta: 1, area: "Aritmética", solucion: "80 × 0.75 = 60." },
          { enunciado: "Si 3/5 de un número es 27, ¿cuál es el número?", opciones: ["35", "40", "45", "50", "54"], correcta: 2, area: "Aritmética", solucion: "27 ÷ 3 × 5 = 45." },
        ] },
        { id: 2, curso_id: 4, titulo: "Práctica: límites básicos", cierra: day(3, 23), preguntas: [
          { enunciado: "lím (x→2) (x² − 4)/(x − 2) =", opciones: ["0", "2", "4", "No existe", "∞"], correcta: 2, area: "Cálculo", solucion: "Factoriza: (x−2)(x+2)/(x−2) = x+2 → 4." },
          { enunciado: "lím (x→0) sen(3x)/x =", opciones: ["0", "1", "3", "1/3", "No existe"], correcta: 2, area: "Cálculo", solucion: "sen(3x)/x = 3·sen(3x)/(3x) → 3." },
        ] },
      ];
      const citas = [
        { id: 1, inicio: day(1, 16, 30), padre_nombre: "Carmen Ríos", alumno_nombre: "Mateo", whatsapp: "999 111 222", nivel: "escolar", motivo: "Refuerzo de matemática", estado: "pendiente" },
        { id: 2, inicio: day(2, 18), padre_nombre: "Jorge Salas", alumno_nombre: "Valeria", whatsapp: "988 333 444", nivel: "pre", motivo: "Preparación PUCP", estado: "confirmada" },
      ];
      return { perfiles: Object.values(P), cursos, matriculas, sesiones, reservas, documentos, practicas, intentos: [], citas, simulacros: [], yo: null, seq: 100 };
    }

    let db;
    const load = () => { try { db = JSON.parse(localStorage.getItem(KEY)) || seed(); } catch { db = seed(); } };
    const save = () => { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch {} };
    load();
    const nextId = () => ++db.seq;
    const byId = (t, id) => db[t].find((x) => x.id === id);
    const listeners = [];
    const delay = (v) => new Promise((r) => setTimeout(() => r(structuredClone(v)), 120));
    const fail = (m) => Promise.reject(new Error(m));

    const withSesion = (s) => ({
      ...s, curso: byId("cursos", s.curso_id), profesor: byId("perfiles", s.profesor_id),
      reservas: db.reservas.filter((r) => r.sesion_id === s.id),
    });

    return {
      modo: "demo",
      async sesion() { const p = db.yo && byId("perfiles", db.yo); return delay(p ? { user: { id: p.id, email: p.email }, perfil: p } : null); },
      async entrarDemo(rol) {
        const id = { admin: "u-admin", profesor: "u-prof", alumno: "u-lucia" }[rol];
        db.yo = id; save(); listeners.forEach((f) => f()); return this.sesion();
      },
      async entrar() { return fail("Modo demo: usa los botones de acceso demo."); },
      async registrarse() { return fail("Modo demo: el registro se activa al conectar Supabase."); },
      async recuperar() { return fail("Modo demo: no hay correos reales."); },
      async salir() { db.yo = null; save(); listeners.forEach((f) => f()); },
      onAuth(cb) { listeners.push(cb); },
      reiniciarDemo() { db = seed(); save(); },

      async citasOcupadas(desde, hasta) {
        return delay(db.citas.filter((c) => c.estado !== "cancelada").map((c) => new Date(c.inicio).getTime()).filter((t) => t >= +desde && t <= +hasta));
      },
      async crearCita(c) {
        if (db.citas.some((x) => x.inicio === c.inicio && x.estado !== "cancelada")) return fail("Ese horario se acaba de ocupar. Elige otro.");
        db.citas.push({ ...c, id: nextId(), estado: "pendiente" }); save(); return delay(true);
      },
      async guardarSimulacro(r) { db.simulacros.push({ ...r, id: nextId(), creado: new Date().toISOString() }); save(); return delay(true); },

      async cursos() { return delay(db.cursos); },
      async crearCurso(c) { const n = { ...c, id: nextId(), activo: true }; db.cursos.push(n); save(); return delay(n); },
      async perfiles(rol) { return delay(db.perfiles.filter((p) => !rol || p.rol === rol)); },
      async actualizarPerfil(id, cambios) { Object.assign(byId("perfiles", id), cambios); save(); return delay(true); },

      async matriculas(alumnoId) {
        return delay(db.matriculas.filter((m) => !alumnoId || m.alumno_id === alumnoId).map((m) => ({
          ...m, curso: byId("cursos", m.curso_id), alumno: byId("perfiles", m.alumno_id), profesor: byId("perfiles", m.profesor_id),
        })));
      },
      async matricular(m) {
        const ex = db.matriculas.find((x) => x.alumno_id === m.alumno_id && x.curso_id === m.curso_id);
        if (ex) Object.assign(ex, m); else db.matriculas.push({ horas_usadas: 0, activo: true, ...m, id: nextId() });
        save(); return delay(true);
      },

      async sesiones({ desde, hasta, profesorId, cursoIds } = {}) {
        return delay(db.sesiones
          .filter((s) => s.estado !== "cancelada")
          .filter((s) => !desde || new Date(s.inicio) >= desde)
          .filter((s) => !hasta || new Date(s.inicio) <= hasta)
          .filter((s) => !profesorId || s.profesor_id === profesorId)
          .filter((s) => !cursoIds || cursoIds.includes(s.curso_id))
          .sort((a, b) => a.inicio.localeCompare(b.inicio))
          .map(withSesion));
      },
      async crearSesion(s) { const n = { estado: "abierta", ...s, id: nextId() }; db.sesiones.push(n); save(); return delay(n); },
      async borrarSesion(id) { db.sesiones = db.sesiones.filter((s) => s.id !== id); db.reservas = db.reservas.filter((r) => r.sesion_id !== id); save(); return delay(true); },
      async reservar(sesionId, butaca) {
        const s = byId("sesiones", sesionId); const r = db.reservas.filter((x) => x.sesion_id === sesionId);
        if (!s || s.estado !== "abierta") return fail("Esta clase ya no acepta reservas");
        if (r.length >= s.capacidad) return fail("La clase está llena");
        if (r.some((x) => x.butaca === butaca)) return fail("Alguien acaba de tomar esa butaca. Elige otra.");
        if (r.some((x) => x.alumno_id === db.yo)) return fail("Ya tienes una butaca en esta clase.");
        db.reservas.push({ id: nextId(), sesion_id: sesionId, alumno_id: db.yo, butaca });
        if (r.length + 1 >= s.capacidad) s.estado = "cerrada";
        save(); return delay(true);
      },
      async cancelarReserva(sesionId) {
        db.reservas = db.reservas.filter((x) => !(x.sesion_id === sesionId && x.alumno_id === db.yo));
        const s = byId("sesiones", sesionId); if (s && s.estado === "cerrada") s.estado = "abierta";
        save(); return delay(true);
      },

      async documentos() { return delay(db.documentos.map((d) => ({ ...d, curso: byId("cursos", d.curso_id) })).sort((a, b) => b.creado.localeCompare(a.creado))); },
      async subirDocumento({ archivo, titulo, tipo, curso_id, url }) {
        db.documentos.push({ id: nextId(), titulo, tipo, curso_id: curso_id || null, url: url || (archivo ? "#" : null), nombreArchivo: archivo?.name, creado: new Date().toISOString() });
        save(); return delay(true);
      },
      async abrirDocumento(doc) { return doc.url && doc.url !== "#" ? doc.url : null; },
      async practicas() { return delay(db.practicas.map((p) => ({ ...p, curso: byId("cursos", p.curso_id) }))); },
      async crearPractica(p) { db.practicas.push({ ...p, id: nextId() }); save(); return delay(true); },
      async guardarIntento(i) { db.intentos.push({ ...i, id: nextId(), alumno_id: db.yo, creado: new Date().toISOString() }); save(); return delay(true); },
      async intentos() { return delay(db.intentos); },

      async citas() { return delay([...db.citas].sort((a, b) => a.inicio.localeCompare(b.inicio))); },
      async actualizarCita(id, estado) { byId("citas", id).estado = estado; save(); return delay(true); },
    };
  }

  // ---------------------------------------------------------------- arranque
  window.AstrosStore = (async () => {
    if (!isReal) return demoStore();
    try {
      await loadScript(SUPABASE_JS);
      return supabaseStore(window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseAnonKey));
    } catch (e) {
      console.error(e);
      return demoStore();
    }
  })();
})();
