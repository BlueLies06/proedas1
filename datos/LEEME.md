# Datos de ASTROS

Copia de las carpetas de trabajo del proyecto (17/10/2026). La web **no** lee de aquí: lee de `data/`.

| Carpeta | Qué es | Archivo principal |
|---|---|---|
| `precios/` | Tarifario aprobado, editable | `tarifario.csv`, `reglas.csv` → genera `precios.json` |
| `banco-preguntas/` | 101 preguntas (PUCP 33, ULIMA 22, UPC 22, UPCH 24) | `preguntas.csv` (fuente), `ASTROS_Banco_Preguntas.xlsx` |
| `sig/` | Sistema de información gerencial (para Google Sheets) | `ASTROS_SIG.xlsx` |
| `campanas/` | 9 campañas oct 2026 – abr 2027 | `ASTROS_Campanas.xlsx` |
| `admisiones/` | Fechas de admisión 2027 y cronograma | `ASTROS_calendario_admision_2027.xlsx` |

Cada carpeta tiene su propio `LEEME.md`, con `herramientas/` (validar, respaldar, probar), `backups/` y `logs/`.

## En tu laptop
Necesitas Python 3 con `openpyxl` (`python3 -m pip install openpyxl`) y LibreOffice para los PDF de simulacro y algunas pruebas.

```
cd datos/precios && python3 herramientas/validar_precios.py      # tras editar tarifario.csv
cd datos/banco-preguntas && python3 herramientas/validar_banco.py # tras editar preguntas.csv
cd ../.. && scripts/sync-datos.sh datos                           # lleva precios y preguntas a la web (data/)
```

Pruebas (todas pasaron el 17/10/2026 desde esta carpeta): `test_precios.py` (14), `test_banco.py` (142), `test_campanas.py` (44), `test_sig.py` (35).

No contiene datos personales: las hojas de alumnos, leads y pagos del SIG están vacías. No incluye los flyers ni el brochure originales que subiste al proyecto.
