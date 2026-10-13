# ASTROS · Maestros Asesores

Portafolio web mobile-first de ASTROS, asesoría académica personalizada para escolares, preuniversitarios (PUCP, ULIMA, UPC, UPCH) y universitarios. *"Aprender para crecer"*.

Sitio estático (HTML, CSS y JS sin dependencias) pensado para GitHub Pages.

## Editar contenido
- **Precios**: `data/precios.json` es la única fuente. Cada nivel (escolar, pre, univ) tiene sus productos (`nombre`, `horas`, `precio` virtual, `detalle`, `destacado`), precios de grupo por alumno/hora y los recargos por hora de presencial y domicilio. La web calcula el resto.
- **Textos y secciones**: `index.html`.
- **Colores y estilo liquid glass**: variables al inicio de `styles.css`.

## Ver en local
```
python3 -m http.server 8000
```
y abrir http://localhost:8000
