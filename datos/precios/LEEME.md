# Precios ASTROS · cómo funciona

## Archivos que puedes editar
- **tarifario.csv**: un producto por fila. Columnas: `precio_virtual` (S/ del producto completo), `horas`, `alumnos_min`/`alumnos_max` (1 = individual), `pago_tutor_hora`, `activo` (si/no). Para quitar algo de la web, pon `activo` en `no` en vez de borrar la fila.
- **reglas.csv**: recargos presencial/domicilio, extra al tutor por alumno y margen mínimo.

Se abren con Excel o Google Sheets. Guárdalos como CSV.

## Qué pasa al validar
`python3 herramientas/validar_precios.py`
1. Revisa errores de tipeo (números, niveles, ids repetidos) y reglas de negocio (margen mínimo 33 %, ningún paquete más caro por hora que la hora suelta).
2. Si cambiaste algo, guarda una **copia de respaldo** en `backups/AAAAMMDD-HHMMSS/` (se guardan las últimas 60).
3. Escribe qué cambió en **logs/cambios.log** (ej. `uni-examen.precio_virtual: 400 → 420`).
4. Si hay errores, los anota en **logs/errores.log** y **no** toca `precios.json`, así la web sigue mostrando la última versión buena.
5. Si todo está bien, publica **precios.json**, que lee la web. El pago al tutor y el margen no se publican.

## Volver a una versión anterior
`python3 herramientas/validar_precios.py --restaurar backups/20261013-183005`
(antes de restaurar se respalda la versión actual).

## Pruebas automáticas
`python3 herramientas/test_precios.py`: 14 pruebas que simulan errores comunes de edición y verifican backups, logs y restauración.

Si prefieres no tocar archivos, escríbele a Claude en el hilo "Evaluación de precios" el cambio que quieres y lo valida, respalda y publica.
