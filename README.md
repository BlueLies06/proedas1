# ASTROS · Maestros Asesores

Portafolio web mobile-first de ASTROS, asesoría académica personalizada para escolares, preuniversitarios (PUCP, ULIMA, UPC, UPCH) y universitarios. *"Aprender para crecer"*.

Sitio estático (HTML, CSS y JS sin dependencias) pensado para GitHub Pages.

## Editar contenido
- **Precios**: `data/precios.json` es la única fuente. Cada nivel (escolar, pre, univ) tiene sus productos (`nombre`, `horas`, `precio` virtual, `detalle`, `destacado`), precios de grupo por alumno/hora y los recargos por hora de presencial y domicilio. La web calcula el resto.
- **Textos y secciones**: `index.html`.
- **Colores y estilo liquid glass**: variables al inicio de `styles.css`.

## Estructura
- `index.html`: web pública (planes, simulacro, citas para padres, contacto).
- `simulacro.html`: test de 20 preguntas por universidad (lee `data/preguntas.json`).
- `aula/`: aula virtual con login para administración, profesores y alumnos.
- `js/config.js`: datos de Supabase y horario de citas. Vacío = modo demo.
- `supabase/`: base de datos (`schema.sql`) y guía para conectarla (`LEEME.md`).
- `scripts/sync-datos.sh`: trae a `data/` los precios y preguntas validados por los hilos de precios y SIG.

## Ver en local
```
python3 -m http.server 8000
```
y abrir http://localhost:8000

## Publicar
- **GitHub Pages** (repo público o plan de pago): *Settings → Pages → Deploy from a branch → `main` / `(root)`*. Queda en `https://bluelies06.github.io/astros/`.
- **Repo privado en plan gratuito**: conecta el repo en Netlify o Cloudflare Pages (sin comando de build, carpeta de publicación `/`).
- El código no guarda secretos: la clave *anon* de Supabase es pública por diseño y los datos bancarios no están en la web.
