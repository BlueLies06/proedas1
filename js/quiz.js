// ASTROS · motor de preguntas (simulacro público y prácticas del aula)
// Pregunta: { enunciado, opciones: [..], correcta: índice, area?, tema?, solucion? }
(() => {
  const L = "ABCDEFGH";
  const esc = (t) => String(t ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const mmss = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  function mount(root, { preguntas, titulo = "", onFinish, ctaFinal } = {}) {
    const total = preguntas.length;
    const resp = new Array(total).fill(null);
    let i = 0, t0 = Date.now(), timer;

    function tick() { const el = root.querySelector("[data-timer]"); if (el) el.textContent = mmss(Math.floor((Date.now() - t0) / 1000)); }

    function renderQ() {
      const q = preguntas[i];
      root.innerHTML = `
        <div class="quiz">
          <div class="quiz-head">
            <span class="quiz-count"><b>${String(i + 1).padStart(2, "0")}</b>/${total}</span>
            ${q.area ? `<span class="chip">${esc(q.area)}</span>` : ""}
            <span class="quiz-timer" data-timer aria-label="Tiempo">00:00</span>
          </div>
          <div class="quiz-bar" role="progressbar" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${resp.filter((r) => r !== null).length}">
            <span style="width:${(resp.filter((r) => r !== null).length / total) * 100}%"></span>
          </div>
          <article class="glass quiz-card q-in">
            ${titulo ? `<p class="eyebrow">${esc(titulo)}</p>` : ""}
            ${q.texto ? `<blockquote class="quiz-text">${esc(q.texto).replace(/\n/g, "<br>")}</blockquote>` : ""}
            <h2 class="quiz-q">${esc(q.enunciado)}</h2>
            <div class="quiz-opts" role="radiogroup" aria-label="Opciones">
              ${q.opciones.map((o, k) => `
                <button type="button" class="opt" role="radio" aria-checked="${resp[i] === k}" data-k="${k}">
                  <span class="opt-l">${L[k]}</span><span class="opt-t">${esc(o)}</span>
                </button>`).join("")}
            </div>
          </article>
          <div class="quiz-nav">
            <button type="button" class="btn btn-glass" data-prev ${i === 0 ? "disabled" : ""}>Anterior</button>
            ${i < total - 1
              ? `<button type="button" class="btn btn-gold" data-next>${resp[i] === null ? "Saltar" : "Siguiente"}</button>`
              : `<button type="button" class="btn btn-gold" data-end>Terminar</button>`}
          </div>
          <div class="quiz-dots" aria-label="Ir a pregunta">
            ${preguntas.map((_, k) => `<button type="button" class="dot${k === i ? " now" : ""}${resp[k] !== null ? " done" : ""}" data-go="${k}" aria-label="Pregunta ${k + 1}">${k + 1}</button>`).join("")}
          </div>
        </div>`;
      tick();
    }

    function finish() {
      clearInterval(timer);
      const segundos = Math.floor((Date.now() - t0) / 1000);
      const correctas = preguntas.reduce((n, q, k) => n + (resp[k] === q.correcta ? 1 : 0), 0);
      const areas = {};
      preguntas.forEach((q, k) => {
        const a = q.area || "General"; areas[a] = areas[a] || { ok: 0, total: 0 };
        areas[a].total++; if (resp[k] === q.correcta) areas[a].ok++;
      });
      const pct = total ? correctas / total : 0;
      const C = 2 * Math.PI * 52;
      const nivel = pct >= .8 ? "¡Excelente! Vas en órbita." : pct >= .6 ? "Buen avance. Unos ajustes y despegas." : pct >= .4 ? "Vas en camino. Hay temas clave por reforzar." : "Es un buen punto de partida. Armemos tu plan.";
      root.innerHTML = `
        <div class="quiz">
          <section class="glass result q-in">
            <svg class="ring" viewBox="0 0 120 120" aria-hidden="true">
              <circle cx="60" cy="60" r="52" class="ring-bg"/>
              <circle cx="60" cy="60" r="52" class="ring-fg" style="stroke-dasharray:${C};stroke-dashoffset:${C * (1 - pct)}"/>
            </svg>
            <div class="result-score"><b>${correctas}</b><span>de ${total}</span></div>
            <h2>${nivel}</h2>
            <p class="muted">Tiempo: ${mmss(segundos)} · ${Math.round(pct * 100)} % de aciertos</p>
            <div class="areas">
              ${Object.entries(areas).map(([a, v]) => `
                <div class="area"><span>${esc(a)}</span><b>${v.ok}/${v.total}</b>
                  <i><em style="width:${(v.ok / v.total) * 100}%"></em></i></div>`).join("")}
            </div>
            <div class="result-cta">${ctaFinal ? ctaFinal({ correctas, total, areas, segundos }) : ""}</div>
          </section>
          <h3 class="review-title">Revisa tus respuestas</h3>
          <ol class="review">
            ${preguntas.map((q, k) => {
              const ok = resp[k] === q.correcta;
              return `<li class="glass rev ${ok ? "ok" : "bad"}">
                <details>
                  <summary><span class="rev-mark" aria-label="${ok ? "Correcta" : "Incorrecta"}">${ok ? "✓" : "✕"}</span><span>${k + 1}. ${esc(q.enunciado)}</span></summary>
                  <p>Tu respuesta: <b>${resp[k] === null ? "sin responder" : L[resp[k]] + ") " + esc(q.opciones[resp[k]])}</b></p>
                  <p>Correcta: <b>${L[q.correcta]}) ${esc(q.opciones[q.correcta])}</b></p>
                  ${q.solucion ? `<p class="muted">${esc(q.solucion)}</p>` : ""}
                </details></li>`;
            }).join("")}
          </ol>
        </div>`;
      onFinish && onFinish({ correctas, total, areas, segundos, respuestas: resp.slice() });
      root.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    root.addEventListener("click", (e) => {
      const opt = e.target.closest(".opt");
      if (opt) {
        resp[i] = +opt.dataset.k;
        root.querySelectorAll(".opt").forEach((b) => b.setAttribute("aria-checked", b === opt));
        const nx = root.querySelector("[data-next]"); if (nx) nx.textContent = "Siguiente";
        root.querySelectorAll(".dot")[i]?.classList.add("done");
        const bar = root.querySelector(".quiz-bar span"); if (bar) bar.style.width = `${(resp.filter((r) => r !== null).length / total) * 100}%`;
        return;
      }
      if (e.target.closest("[data-next]")) { i++; renderQ(); return; }
      if (e.target.closest("[data-prev]")) { i--; renderQ(); return; }
      const go = e.target.closest("[data-go]"); if (go) { i = +go.dataset.go; renderQ(); return; }
      if (e.target.closest("[data-end]")) {
        const faltan = resp.filter((r) => r === null).length;
        const endBtn = e.target.closest("[data-end]");
        if (faltan && !endBtn.dataset.sure) {
          endBtn.dataset.sure = "1";
          endBtn.textContent = `Te faltan ${faltan}. ¿Terminar igual?`;
          return;
        }
        finish();
      }
    });

    renderQ();
    timer = setInterval(tick, 1000);
    return { destroy: () => clearInterval(timer) };
  }

  window.AstrosQuiz = { mount, esc };
})();
