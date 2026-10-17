# ASTROS · Lo que falta (al 17/10/2026)

Marcado: **[Tú]** solo lo puedes hacer tú · **[Decidir]** necesita tu decisión · **[Construir]** trabajo de código o contenido.

## 1. Web y aula virtual (este repo)

Hecho: web pública (planes, precios, simulacro de 20 preguntas, citas para padres, contacto), aula con login (admin, profesor, alumno), calendario con butacas, documentos y prácticas. `js/config.js` ya apunta a tu proyecto de Supabase.

1. **[Tú] Publicar la web.** Si el repo es público: *Settings → Pages → Deploy from a branch → `main` / `(root)`* → `https://bluelies06.github.io/proedas1/`. Si lo dejas privado, GitHub Pages pide plan de pago; la alternativa gratis es conectar el repo a Netlify o Cloudflare Pages (sin build, carpeta `/`).
2. **[Tú] Terminar Supabase.** No se pudo probar contra tu base real desde la nube.
   - *SQL Editor*: pegar y ejecutar `supabase/schema.sql` (si no lo hiciste).
   - *Authentication → URL Configuration*: Site URL `https://bluelies06.github.io/proedas1/aula/` y Redirect URL `https://bluelies06.github.io/proedas1/**`. Si publicas en otra dirección, usa esa.
   - Entrar al aula y **registrarte antes que nadie**: la primera cuenta queda como administración.
   - Probar: pedir una cita en la web y ver que aparezca en *Aula → Citas*.
3. **[Construir] Asistente de WhatsApp** del aula: hoy es una tarjeta "Próximamente" (`aula/aula.js`, sección contacto).
4. **[Decidir] Datos bancarios.** La web muestra los medios de pago (Yape, Plin, BCP, BBVA, Interbank, Scotiabank) pero no los números de cuenta. ¿Se publican o se envían por WhatsApp?
5. **[Decidir] Sección "Tu docente".** Falta tu nombre y foto; hoy dice que las clases las dicta la dirección.
6. **[Decidir] Testimonios.** Hay 3 testimonios (Renzo A., Alberto J., Cristina R.). Confirma que son reales y que puedes usarlos, o cámbialos en `index.html`.
7. **[Construir] App** (fase siguiente) y conectar el aula con el SIG (los resultados del simulacro ya se guardan en la tabla `simulacros`).

## 2. Precios (`datos/precios/`)

Hecho: tarifario aprobado el 13/10, validador con respaldos, registro de cambios y 14 pruebas. La web ya los usa.

1. **[Tú] Confirmar precios de mercado.** Los rangos de la competencia fueron estimados (no se pudieron abrir sus webs). Pedir 4 o 5 cotizaciones por WhatsApp.
2. Al editar `tarifario.csv`: correr `validar_precios.py` y luego `scripts/sync-datos.sh datos` para llevarlo a la web.

## 3. Banco de preguntas (`datos/banco-preguntas/`)

Hecho: 101 preguntas originales con solución, Excel, export para la web, simulacros en PDF y 142 pruebas.

1. **[Tú] Confirmar el formato de examen** con la guía oficial de cada universidad (el actual es referencial).
2. **[Construir] Más preguntas**: hoy hay el mínimo para el test de 20 por universidad en ULIMA y UPC (22 cada una).
3. **[Construir] Bancos de universitarios** (cálculo, física, estadística por carrera) **y de colegio**: están en el plan, no se hicieron.

## 4. Campañas (`datos/campanas/`)

Hecho: 9 campañas, calendario de 121 publicaciones, 9 guiones de WhatsApp, presupuesto sugerido S/ 3,560.

1. **[Tú] Próximas fechas:** ULIMA escolares cierra inscripción el 06/11 (examen 15/11); PUCP Primera Opción el 29/11; UPCH Medicina cierra el 11/01 (examen 17/01).
2. **[Tú] Ir marcando** el Estado de cada publicación y el gasto real en anuncios.
3. **[Tú] Revisar fechas estimadas** de PUCP Talento (~14/02) y ULIMA egresados (~07/03) en noviembre y enero.

## 5. SIG (`datos/sig/`)

Hecho: hoja con Dashboard, 13 controles de error, catálogo enlazado a precios y 35 pruebas. Está vacía (sin alumnos).

1. **[Tú] Subir `ASTROS_SIG.xlsx` a Google Drive** y abrirlo con Google Sheets.
2. **[Tú] Instalar `herramientas/ASTROS_SIG_script.gs`** (registro de cambios y copia semanal en Drive; instrucciones dentro).
3. **[Tú] Empezar a registrar** leads, alumnos, ventas y pagos. Completar tu WhatsApp en Tutores.

## 6. Admisiones (`datos/admisiones/`)

1. **[Construir] Cronograma de UPC**: no se pudo abrir su web desde la nube.
2. **[Construir] Actualizar** cuando se publiquen PUCP Evaluación del Talento (feb 2027) y ULIMA egresados.

## Notas técnicas

- La web lee `data/precios.json` y `data/preguntas.json`. `scripts/sync-datos.sh datos` los actualiza desde esta carpeta.
- Las herramientas en `datos/` usan rutas relativas y sus pruebas pasan desde aquí.
- Nunca subas al repo la *secret key* ni la *service_role* de Supabase.
