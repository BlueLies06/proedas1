#!/usr/bin/env bash
# Copia a la web los datos que mantienen otros procesos de ASTROS:
#  - precios.json  (lo genera precios/herramientas/validar_precios.py desde tarifario.csv)
#  - preguntas.json (banco de preguntas para el simulacro)
# Uso: scripts/sync-datos.sh [carpeta_origen]   (por defecto /mnt/project-files)
set -euo pipefail
ORIGEN="${1:-/mnt/project-files}"
DESTINO="$(cd "$(dirname "$0")/.." && pwd)/data"
mkdir -p "$DESTINO"

copiar() {
  local src="$1" dst="$2"
  if [[ ! -f "$src" ]]; then echo "· No existe $src (se mantiene la versión actual)"; return; fi
  python3 -c "import json,sys; json.load(open(sys.argv[1]))" "$src" || { echo "✗ $src no es JSON válido; no se copia"; return 1; }
  if cmp -s "$src" "$dst"; then echo "= $(basename "$dst") sin cambios"; else cp "$src" "$dst"; echo "✓ $(basename "$dst") actualizado"; fi
}

copiar "$ORIGEN/precios/precios.json" "$DESTINO/precios.json"
copiar "$ORIGEN/sig/preguntas-web.json" "$DESTINO/preguntas.json"
