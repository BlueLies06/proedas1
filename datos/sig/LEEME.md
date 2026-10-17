# SIG ASTROS · cómo funciona

- **ASTROS_SIG.xlsx**: el sistema. Súbelo a Google Drive y ábrelo con Google Sheets. Escribe solo en columnas de encabezado amarillo.
- **Precios**: la hoja Catalogo es una copia de `precios/tarifario.csv` (la misma fuente de la web). No se edita en el SIG. Cuando cambies precios, `herramientas/sincronizar_catalogo.py` actualiza solo esa hoja, guarda un respaldo en `backups/` y anota los cambios en `logs/cambios.log`. En Google Sheets: pega la hoja Catalogo nueva o pídeselo a Claude.
- **Control de errores**: la hoja Control revisa 13 errores comunes (IDs que no existen, pagos duplicados, horas negativas, paquetes vencidos...). El Dashboard muestra el total de alertas.
- **Registro de cambios y respaldos en Google Sheets**: instala `herramientas/ASTROS_SIG_script.gs` (instrucciones dentro). Anota cada edición en la hoja Cambios y crea una copia semanal en Drive (últimas 12). Además, Archivo > Historial de versiones guarda todo.
- **Pruebas automáticas**: `python3 herramientas/test_sig.py` crea una copia con datos de prueba y errores a propósito, y verifica 35 cálculos, alertas y la sincronización con respaldo y log.
- **Reconstruir desde cero**: `python3 herramientas/construir_sig.py salida.xlsx` (crea un SIG vacío).
