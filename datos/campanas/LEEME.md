# Campañas ASTROS · cómo funciona

- **ASTROS_Campanas.xlsx**: plan de oct 2026 a abr 2027.
  - **Campanas**: 9 campañas con el mismo código que usa el SIG (SPRINT-ULIMA, SPRINT-PUCP, REFUERZO-CEPU, MEDICINA-UPCH, VERANO-PUCP, VERANO-ULIMA, CACHIMBOS, REFERIDOS, ORGANICO), con público, oferta y precios del tarifario aprobado, gancho, canales, presupuesto y metas.
  - **Calendario**: 121 piezas semana a semana (Reel, carrusel, historia y difusión por WhatsApp) con texto sugerido, más los hitos de cierre de inscripción. Marca el Estado al publicar.
  - **WhatsApp**: 9 guiones listos para copiar (primer contacto, diagnóstico, seguimiento, cierre, recordatorio, simulacro final, resultados, referidos).
  - **Presupuesto**: S/ 3,560 en anuncios sugeridos en total; anota el gasto real y los inscritos del SIG para ver el costo real por alumno.
- **Fechas**: vienen de `admisiones/ASTROS_calendario_admision_2027.xlsx`. PUCP Talento (~14/02) y ULIMA egresados (~07/03) son estimadas: revisar en noviembre y enero (hay tareas en el calendario).
- **Regenerar**: `python3 herramientas/construir_campanas.py` (lee precios y fechas actuales). Respaldo de cada versión en `backups/`, registro en `logs/cambios.log`.
- **Pruebas**: `python3 herramientas/test_campanas.py` (44 pruebas: códigos iguales al SIG, precios existentes, fechas iguales al cronograma oficial, nada publicado después del examen, presupuesto bien sumado).
