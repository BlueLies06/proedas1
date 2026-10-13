// ASTROS · página del simulacro por universidad
(async () => {
  const CFG = window.ASTROS_CONFIG;
  const esc = window.AstrosQuiz.esc;
  const UNIS = {
    PUCP: "Pontificia Universidad Católica del Perú",
    ULIMA: "Universidad de Lima",
    UPC: "Universidad Peruana de Ciencias Aplicadas",
    UPCH: "Universidad Peruana Cayetano Heredia",
  };
  const seg = document.getElementById("uniSeg");
  const intro = document.getElementById("simIntro");
  const start = document.getElementById("simStart");
  const quizEl = document.getElementById("simQuiz");
  let uni = (location.hash.slice(1) || "pucp").toUpperCase();
  if (!UNIS[uni]) uni = "PUCP";

  let banco = null;
  try {
    const r = await fetch("data/preguntas.json", { cache: "no-cache" });
    if (r.ok) banco = await r.json();
  } catch {}

  const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const preguntasDe = (u) => (banco?.universidades?.[u] || []);

  function thumb() {
    const t = seg.querySelector(".seg-thumb"), s = seg.querySelector('[aria-selected="true"]');
    t.style.width = s.offsetWidth + "px"; t.style.transform = `translateX(${s.offsetLeft - 5}px)`;
  }

  function renderIntro() {
    seg.querySelectorAll("button").forEach((b) => b.setAttribute("aria-selected", b.dataset.u === uni));
    thumb();
    const qs = preguntasDe(uni);
    const areas = [...new Set(qs.map((q) => q.area).filter(Boolean))];
    intro.innerHTML = qs.length ? `
      <h3>${uni}</h3>
      <p class="muted">${UNIS[uni]}</p>
      <ul class="sim-facts">
        <li><b>${Math.min(20, qs.length)}</b><span>preguntas</span></li>
        <li><b>~${Math.round(Math.min(20, qs.length) * 1.5)}</b><span>minutos</span></li>
        <li><b>${areas.length}</b><span>áreas</span></li>
      </ul>
      ${areas.length ? `<p class="sim-areas">${areas.map((a) => `<span class="chip">${esc(a)}</span>`).join(" ")}</p>` : ""}
      <button class="btn btn-gold" id="go">Empezar simulacro</button>` : `
      <h3>${uni}</h3>
      <p class="muted">Estamos preparando el banco de preguntas de ${uni}. Escríbenos y te avisamos apenas esté listo.</p>
      <a class="btn btn-gold" target="_blank" rel="noopener" href="https://wa.me/${CFG.whatsapp}?text=${encodeURIComponent(`Hola ASTROS, quiero el simulacro de ${uni}.`)}">Avísame por WhatsApp</a>`;
    intro.classList.remove("q-in"); void intro.offsetWidth; intro.classList.add("q-in");
  }

  seg.addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    uni = b.dataset.u; history.replaceState(null, "", "#" + uni.toLowerCase()); renderIntro();
  });

  intro.addEventListener("click", (e) => {
    if (!e.target.closest("#go")) return;
    // Las preguntas que comparten una lectura ("texto") van juntas y en su orden.
    const grupos = new Map();
    preguntasDe(uni).forEach((q) => { const k = q.texto || q.id; grupos.set(k, [...(grupos.get(k) || []), q]); });
    const preguntas = shuffle([...grupos.values()]).flat().slice(0, 20);
    start.hidden = true; quizEl.hidden = false;
    window.AstrosQuiz.mount(quizEl, {
      preguntas, titulo: `Simulacro ${uni}`,
      ctaFinal: ({ correctas, total }) => {
        const txt = `Hola ASTROS, hice el simulacro ${uni} y saqué ${correctas}/${total}. Quiero un plan para mejorar.`;
        return `<a class="btn btn-gold" target="_blank" rel="noopener" href="https://wa.me/${CFG.whatsapp}?text=${encodeURIComponent(txt)}">Quiero mejorar mi puntaje</a>
                <a class="btn btn-glass" href="simulacro.html#${uni.toLowerCase()}" onclick="location.reload()">Intentar otra vez</a>`;
      },
      onFinish: async ({ correctas, total, areas }) => {
        try { const st = await window.AstrosStore; if (st.modo === "real") await st.guardarSimulacro({ universidad: uni, correctas, total, por_area: areas }); } catch {}
      },
    });
    scrollTo({ top: 0, behavior: "smooth" });
  });

  addEventListener("resize", thumb);
  document.fonts?.ready.then(thumb);
  renderIntro();
})();
