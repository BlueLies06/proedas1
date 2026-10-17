# Banco de preguntas ASTROS · cómo funciona

- **ASTROS_Banco_Preguntas.xlsx**: para consultar y filtrar (universidad, área, tema, dificultad). Hojas: Preguntas, Resumen, Estructura.
- **preguntas.csv**: la fuente. Una pregunta por fila, 5 alternativas (A–E), clave, solución, dificultad 1–3 y tiempo en segundos. Hoy: 101 preguntas originales. PUCP 33 (RM, Matemática Básica, Comprensión Lectora, Redacción), ULIMA 22 (RM, Matemática, Razonamiento Verbal, Comprensión Lectora), UPC 22 (aptitud matemática y verbal) y UPCH 24 (Matemática, RV, Comprensión Lectora, Biología, Química, Física).
- **preguntas.json**: la misma información agrupada por universidad, para el test de 20 preguntas de la web. Se regenera solo al validar.
- **Validar y respaldar**: `python3 herramientas/validar_banco.py` revisa errores (claves inválidas, IDs repetidos, alternativas vacías o repetidas...), guarda respaldo en `backups/`, anota en `logs/cambios.log` qué preguntas son nuevas, editadas o quitadas, y regenera el Excel. Si hay errores los deja en `logs/errores.log` y no toca el Excel.
- **Volver atrás**: `python3 herramientas/validar_banco.py --restaurar backups/AAAAMMDD-HHMMSS`.
- **Simulacros en PDF**: `python3 herramientas/generar_simulacro.py --universidad PUCP --n 20 --alumno "Nombre"` (opcional `--area "Comprensión Lectora"`). Incluye claves y solucionario en hojas aparte. Hay un ejemplo de 20 preguntas por universidad en `simulacros/`.
- **Pruebas automáticas**: `python3 herramientas/test_banco.py` recalcula desde cero 66 respuestas numéricas, revisa que cada universidad tenga al menos 20 preguntas con claves repartidas, provoca 6 errores de edición y verifica respaldos, logs, restauración, el JSON de la web y los simulacros (142 pruebas).
- **Formato del examen**: es referencial; confirma con la guía oficial de cada universidad.
- **Más preguntas**: pídele a Claude más preguntas de un tema o universidad; se agregan a preguntas.csv y pasan por las mismas pruebas.
