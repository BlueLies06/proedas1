#!/usr/bin/env python3
"""Valida el tarifario de ASTROS, guarda backups, registra cambios y publica precios.json.

Uso:
  python3 herramientas/validar_precios.py              # validar + backup + log + publicar
  python3 herramientas/validar_precios.py --solo-validar
  python3 herramientas/validar_precios.py --restaurar backups/AAAAMMDD-HHMMSS
  python3 herramientas/validar_precios.py --dir otra/carpeta   (lo usan las pruebas)

Archivos de origen (los que se editan): tarifario.csv y reglas.csv.
Salida para la web: precios.json (solo se reescribe si no hay errores).
"""
import argparse
import csv
import datetime as dt
import hashlib
import json
import shutil
import sys
from pathlib import Path

NIVELES = ["escolar", "pre", "universitario"]
COLUMNAS = ["id", "nivel", "producto", "horas", "alumnos_min", "alumnos_max",
            "precio_virtual", "pago_tutor_hora", "activo", "notas"]
REGLAS_REQ = ["recargo_presencial_hora", "recargo_domicilio_hora",
              "extra_tutor_por_alumno", "margen_minimo", "margen_alerta"]
ORIGEN = ["tarifario.csv", "reglas.csv"]
MAX_BACKUPS = 60


def ahora():
    return dt.datetime.now().strftime("%Y-%m-%d %H:%M:%S")


def leer_csv(ruta):
    with open(ruta, encoding="utf-8-sig", newline="") as f:
        return list(csv.DictReader(f))


def num(valor, campo, fila_id, errores, entero=False):
    try:
        v = float(str(valor).replace(",", ".").strip())
    except ValueError:
        errores.append(f"[{fila_id}] '{campo}' no es un número: '{valor}'")
        return None
    if v < 0:
        errores.append(f"[{fila_id}] '{campo}' no puede ser negativo: {v}")
    if entero and v != int(v):
        errores.append(f"[{fila_id}] '{campo}' debe ser entero: {v}")
    return v


def cargar(base):
    """Devuelve (productos, reglas, errores, avisos)."""
    errores, avisos = [], []
    for nombre in ORIGEN:
        if not (base / nombre).exists():
            errores.append(f"Falta el archivo {nombre}")
    if errores:
        return [], {}, errores, avisos

    reglas = {}
    for r in leer_csv(base / "reglas.csv"):
        reglas[(r.get("regla") or "").strip()] = num(r.get("valor"), "valor", r.get("regla"), errores)
    for req in REGLAS_REQ:
        if reglas.get(req) is None:
            errores.append(f"reglas.csv: falta la regla '{req}'")

    filas = leer_csv(base / "tarifario.csv")
    if filas:
        faltan = [c for c in COLUMNAS if c not in filas[0]]
        if faltan:
            errores.append(f"tarifario.csv: faltan columnas {faltan}")
            return [], reglas, errores, avisos

    productos, vistos = [], set()
    for i, r in enumerate(filas, start=2):
        pid = (r["id"] or "").strip() or f"fila {i}"
        if pid in vistos:
            errores.append(f"[{pid}] id repetido")
        vistos.add(pid)
        nivel = (r["nivel"] or "").strip().lower()
        if nivel not in NIVELES:
            errores.append(f"[{pid}] nivel '{r['nivel']}' no válido (usa {', '.join(NIVELES)})")
        activo = (r["activo"] or "").strip().lower()
        if activo not in ("si", "sí", "no"):
            errores.append(f"[{pid}] 'activo' debe ser si o no, no '{r['activo']}'")
        if not (r["producto"] or "").strip():
            errores.append(f"[{pid}] falta el nombre del producto")
        p = {
            "id": pid, "nivel": nivel, "producto": (r["producto"] or "").strip(),
            "horas": num(r["horas"], "horas", pid, errores),
            "alumnos_min": num(r["alumnos_min"], "alumnos_min", pid, errores, entero=True),
            "alumnos_max": num(r["alumnos_max"], "alumnos_max", pid, errores, entero=True),
            "precio_virtual": num(r["precio_virtual"], "precio_virtual", pid, errores),
            "pago_tutor_hora": num(r["pago_tutor_hora"], "pago_tutor_hora", pid, errores),
            "activo": activo in ("si", "sí"), "notas": (r["notas"] or "").strip(),
        }
        if p["horas"] == 0:
            errores.append(f"[{pid}] 'horas' no puede ser 0")
        if p["precio_virtual"] == 0:
            errores.append(f"[{pid}] 'precio_virtual' no puede ser 0")
        if None not in (p["alumnos_min"], p["alumnos_max"]):
            if p["alumnos_min"] < 1:
                errores.append(f"[{pid}] 'alumnos_min' debe ser al menos 1")
            if p["alumnos_min"] > p["alumnos_max"]:
                errores.append(f"[{pid}] alumnos_min ({p['alumnos_min']:.0f}) mayor que alumnos_max ({p['alumnos_max']:.0f})")
        productos.append(p)
    return productos, reglas, errores, avisos


def revisar_negocio(productos, reglas, errores, avisos):
    """Reglas de negocio: márgenes y coherencia entre productos."""
    if errores:
        return
    mmin, malerta = reglas["margen_minimo"], reglas["margen_alerta"]
    extra = reglas["extra_tutor_por_alumno"]
    activos = [p for p in productos if p["activo"]]
    suelta = {p["nivel"]: p["precio_virtual"] for p in activos
              if p["alumnos_max"] == 1 and p["horas"] == 1}

    for p in activos:
        ph = p["precio_virtual"] / p["horas"]
        p["precio_hora"] = round(ph, 2)
        n = p["alumnos_min"]  # peor caso: grupo con el mínimo de alumnos
        ingreso_hora = ph * n
        costo_hora = p["pago_tutor_hora"] + extra * (n - 1)
        margen = (ingreso_hora - costo_hora) / ingreso_hora
        p["margen"] = round(margen, 3)
        if margen < mmin:
            errores.append(f"[{p['id']}] margen {margen:.0%} menor al mínimo {mmin:.0%} "
                           f"(cobras S/ {ingreso_hora:.2f}/h, pagas S/ {costo_hora:.2f}/h)")
        elif margen < malerta:
            avisos.append(f"[{p['id']}] margen ajustado: {margen:.0%}")
        ref = suelta.get(p["nivel"])
        if ref and p["id"] and not (p["alumnos_max"] == 1 and p["horas"] == 1) and ph > ref:
            errores.append(f"[{p['id']}] S/ {ph:.2f} por hora es más caro que la hora suelta de {p['nivel']} (S/ {ref:.0f})")

    for nivel in NIVELES:
        if nivel not in suelta:
            avisos.append(f"No hay 'Hora suelta' activa para {nivel}")
    orden = [suelta[n] for n in NIVELES if n in suelta]
    if orden != sorted(orden):
        avisos.append("La hora suelta no sube de escolar → pre → universitario: " +
                      ", ".join(f"{n} S/ {suelta[n]:.0f}" for n in NIVELES if n in suelta))

    for nivel in NIVELES:
        packs = sorted((p for p in activos if p["nivel"] == nivel and p["alumnos_max"] == 1),
                       key=lambda p: p["horas"])
        for a, b in zip(packs, packs[1:]):
            if b["horas"] > a["horas"] and b["precio_hora"] > a["precio_hora"]:
                avisos.append(f"[{b['id']}] más horas pero más caro por hora que [{a['id']}] "
                              f"(S/ {b['precio_hora']} vs S/ {a['precio_hora']})")


def huella(base):
    h = hashlib.sha256()
    for nombre in ORIGEN:
        h.update((base / nombre).read_bytes())
    return h.hexdigest()


def ultimo_backup(base):
    carpetas = sorted(d for d in (base / "backups").glob("*") if d.is_dir())
    return carpetas[-1] if carpetas else None


def diff_tarifario(viejo, nuevo):
    a = {r["id"]: r for r in leer_csv(viejo)} if viejo.exists() else {}
    b = {r["id"]: r for r in leer_csv(nuevo)}
    cambios = []
    for pid in b.keys() - a.keys():
        cambios.append(f"+ agregado {pid}: {b[pid].get('producto')} S/ {b[pid].get('precio_virtual')}")
    for pid in a.keys() - b.keys():
        cambios.append(f"- eliminado {pid}: {a[pid].get('producto')}")
    for pid in sorted(a.keys() & b.keys()):
        for campo in b[pid]:
            if a[pid].get(campo) != b[pid].get(campo):
                cambios.append(f"~ {pid}.{campo}: {a[pid].get(campo)} → {b[pid].get(campo)}")
    return cambios


def log(base, archivo, lineas):
    if not lineas:
        return
    with open(base / "logs" / archivo, "a", encoding="utf-8") as f:
        for l in lineas:
            f.write(f"{ahora()} | {l}\n")


def hacer_backup(base):
    """Copia los archivos de origen si cambiaron desde el último backup. Devuelve los cambios."""
    previo = ultimo_backup(base)
    if previo and (previo / "huella.txt").exists() and (previo / "huella.txt").read_text().strip() == huella(base):
        return None
    cambios = diff_tarifario(previo / "tarifario.csv", base / "tarifario.csv") if previo else ["backup inicial"]
    if previo and filecmp_reglas(previo, base):
        cambios.append("~ reglas.csv modificado")
    sello = dt.datetime.now().strftime("%Y%m%d-%H%M%S")
    destino, n = base / "backups" / sello, 1
    while destino.exists():  # dos cambios en el mismo segundo no se pisan
        n += 1
        destino = base / "backups" / f"{sello}-{n}"
    destino.mkdir(parents=True)
    for nombre in ORIGEN:
        shutil.copy2(base / nombre, destino / nombre)
    (destino / "huella.txt").write_text(huella(base))
    for vieja in sorted(d for d in (base / "backups").glob("*") if d.is_dir())[:-MAX_BACKUPS]:
        shutil.rmtree(vieja)
    return destino, cambios


def filecmp_reglas(previo, base):
    return (previo / "reglas.csv").read_bytes() != (base / "reglas.csv").read_bytes()


def publicar(base, productos, reglas):
    salida = {
        "actualizado": ahora(),
        "moneda": "PEN",
        "recargos": {"presencial_hora": reglas["recargo_presencial_hora"],
                     "domicilio_hora": reglas["recargo_domicilio_hora"]},
        "niveles": {n: [] for n in NIVELES},
    }
    for p in productos:
        if not p["activo"]:
            continue
        salida["niveles"][p["nivel"]].append({
            "id": p["id"], "producto": p["producto"], "horas": p["horas"],
            "alumnos_max": int(p["alumnos_max"]), "precio": p["precio_virtual"],
            "precio_hora": p["precio_hora"], "notas": p["notas"],
        })  # el pago al tutor y el margen NO se publican
    tmp = base / "precios.json.tmp"
    tmp.write_text(json.dumps(salida, ensure_ascii=False, indent=2), encoding="utf-8")
    tmp.replace(base / "precios.json")


def restaurar(base, carpeta):
    carpeta = (base / carpeta) if not Path(carpeta).is_absolute() else Path(carpeta)
    if not all((carpeta / n).exists() for n in ORIGEN):
        print(f"ERROR: {carpeta} no es un backup válido")
        return 2
    hacer_backup(base)  # guarda el estado actual antes de pisarlo
    for n in ORIGEN:
        shutil.copy2(carpeta / n, base / n)
    log(base, "cambios.log", [f"RESTAURADO desde {carpeta.name}"])
    return correr(base, solo_validar=False)


def correr(base, solo_validar):
    (base / "logs").mkdir(exist_ok=True)
    (base / "backups").mkdir(exist_ok=True)
    productos, reglas, errores, avisos = cargar(base)
    revisar_negocio(productos, reglas, errores, avisos)

    for a in avisos:
        print("AVISO:", a)
    for e in errores:
        print("ERROR:", e)

    if solo_validar:
        return 1 if errores else 0

    resultado = hacer_backup(base) if not any(e.startswith("Falta el archivo") for e in errores) else None
    if resultado:
        destino, cambios = resultado
        log(base, "cambios.log", [f"backup {destino.name}"] + cambios)
        print(f"Backup guardado en backups/{destino.name}")

    if errores:
        log(base, "errores.log", errores)
        print(f"\n{len(errores)} error(es). precios.json NO se actualizó (la web sigue con la última versión buena).")
        return 1
    publicar(base, productos, reglas)
    log(base, "cambios.log", [f"publicado precios.json ({sum(p['activo'] for p in productos)} productos activos, {len(avisos)} avisos)"])
    print(f"\nOK: {len(productos)} productos validados, precios.json publicado.")
    return 0


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dir", default=str(Path(__file__).resolve().parent.parent))
    ap.add_argument("--solo-validar", action="store_true")
    ap.add_argument("--restaurar")
    a = ap.parse_args()
    base = Path(a.dir)
    if a.restaurar:
        sys.exit(restaurar(base, a.restaurar))
    sys.exit(correr(base, a.solo_validar))


if __name__ == "__main__":
    main()
