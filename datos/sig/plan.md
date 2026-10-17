# ASTROS: plan de bancos de preguntas, campañas y SIG

Supuesto: "SIG" = **Sistema de Información Gerencial** (alumnos, clases, pagos, leads, tutores e indicadores). Si te referías a otra cosa, avísame.

Precios, cronograma de admisión y web los trabajan otros hilos; este plan se conecta con ellos.

## 1. SIG (Sistema de Información Gerencial)

**Fase 1, sin costo (Google Sheets):** una hoja por módulo, lista para usar desde el celular.

| Módulo | Qué registra | Para qué te sirve |
|---|---|---|
| Leads | Nombre, WhatsApp, nivel (colegio/pre/uni), universidad objetivo (PUCP/ULIMA/UPC/UPCH), canal de origen (IG, FB, referido, web), estado (nuevo, clase demo, cerrado, perdido) | Saber qué campaña trae alumnos y hacer seguimiento |
| Alumnos | Datos, colegio/carrera, universidad y modalidad objetivo, fecha de examen, apoderado | Ficha única de cada alumno |
| Paquetes | Tipo (horas 1/4/10/20/40, ciclo completo, medio ciclo, examen, práctica), modalidad individual/2-3/4-5, precio, horas compradas | Control de horas vendidas vs. dictadas |
| Clases | Fecha, alumno(s), tutor, curso, tema, horas, modalidad (virtual/domicilio), link de grabación en Drive | Saldo de horas por alumno y pago a tutores |
| Pagos | Fecha, monto, medio (Yape, Plin, BCP, BBVA, Interbank, Scotiabank), N° operación, comprobante | Cobranza y alertas de deuda |
| Tutores | Datos, cursos, tarifa por hora, disponibilidad | Cuando contrates profesores |
| Avance | Notas de simulacros por alumno y tema | Mostrar progreso a alumnos y padres |
| Dashboard | Ingresos del mes, horas dictadas, leads por canal, tasa de conversión, alumnos activos, deudas | Decisiones rápidas |

**Fase 2:** integrarlo a la web/app ASTROS (login de alumno para ver sus horas, grabaciones y avance; panel admin para ti).

## 2. Bancos de preguntas

Estructura por universidad y tipo de examen, etiquetando cada pregunta con: universidad, área, curso, tema, dificultad (1-3), fuente, solución explicada.

| Universidad | Examen de referencia | Áreas a cubrir |
|---|---|---|
| PUCP | Evaluación del Talento / Primera Opción / Examen de admisión | Redacción, comprensión lectora, razonamiento matemático, matemática básica |
| ULIMA | Examen de admisión / Primera Opción | Matemática, razonamiento verbal, comprensión lectora |
| UPC | Evaluación de admisión | Razonamiento matemático, verbal, aptitud |
| UPCH | Examen de admisión (énfasis ciencias de la salud) | Matemática, biología, química, física, razonamiento verbal |
| Universitarios | Prácticas (EP) y exámenes por curso | Cálculo, álgebra, física, estadística, etc. según la carrera |
| Colegio | Refuerzo por grado | Matemática, comunicación, ciencias |

Formato: hoja de cálculo maestra (o base en la web después) que permita generar simulacros por universidad y medir aciertos por tema. Fuentes: exámenes liberados y prospectos oficiales, más preguntas propias. Las modalidades y fechas exactas vienen del hilo del cronograma de admisión.

## 3. Campañas

Calendarizadas según las fechas de admisión de cada universidad (8 a 10 semanas antes de cada examen).

| Campaña | Público | Gancho | Canal |
|---|---|---|---|
| "Despega a tu universidad" | Pre y 5to de secundaria | Simulacro gratis por universidad + 4 horas demo gratis (ya lo ofreces) | IG/FB/TikTok + WhatsApp |
| "Misión ciclo" | Universitarios | Paquete ciclo/medio ciclo antes de prácticas y parciales | IG, grupos de WhatsApp de carreras |
| "Refuerzo escolar" | Padres de colegio | Diagnóstico gratis + horario flexible | FB, referidos |
| "Trae a tu tripulación" | Alumnos actuales | Descuento grupal (2-3 o 4-5 alumnos) por referir | WhatsApp |

Cada campaña con su código de canal para medir resultados en el SIG (módulo Leads).

## 4. Qué construir primero (recomendación)

1. **Fase 1 del SIG en Google Sheets** (Leads + Alumnos + Paquetes + Clases + Pagos + Dashboard), porque te sirve ya y alimenta todo lo demás.
2. Banco de preguntas: estructura + primeras preguntas de una universidad.
3. Calendario de campañas, cuando esté listo el cronograma de admisión.
