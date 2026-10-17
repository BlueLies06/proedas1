"""Pruebas automáticas del banco de preguntas: recalcula las respuestas de matemática, provoca errores
de edición a propósito y verifica validación, respaldos, logs, restauración y el generador de simulacros.
Uso: python3 test_banco.py"""
import csv, os, re, shutil, subprocess, sys, tempfile
from fractions import Fraction as F
from itertools import product
from math import factorial

AQUI = os.path.dirname(os.path.abspath(__file__)); BASE = os.path.dirname(AQUI)
fallos = []
def check(nombre, ok, detalle=""):
    print("OK   " if ok else "FALLA", nombre, "" if ok else detalle)
    if not ok: fallos.append(nombre)

filas = list(csv.DictReader(open(os.path.join(BASE, "preguntas.csv"), encoding="utf-8")))
P = {r["id"]: r for r in filas}
def marcada(i): return P[i][P[i]["respuesta"]]

# 1) Las respuestas de matemática se recalculan desde cero
dados = sum(1 for a, b in product(range(1, 7), repeat=2) if a + b == 7)
calc = {
 "PUCP-001": str(31 * 2 + 1), "PUCP-002": str(6 ** 2 + 1), "PUCP-003": str(3 * 12 // 6),
 "PUCP-004": "disminuye 4 %" if round(1.2 * 0.8, 4) == 0.96 else "?",
 "PUCP-005": str(next(A for A in range(1, 60) for B in range(1, 60) if A - 5 == 2 * (B - 5) and A + B + 10 == 50)),
 "PUCP-006": str(1 / (F(1, 6) + F(1, 3))), "PUCP-007": str(F(dados, 36)), "PUCP-008": str(factorial(5)),
 "PUCP-009": str(5 * 18 - 4 * 17), "PUCP-010": str(2 * (2 * 3 - 1) - 4), "PUCP-011": str(25 + 20 - (40 - 8)),
 "PUCP-012": f"{180 / 2.5:g} km/h", "PUCP-014": str(next(x for x in range(-50, 50) if 2 * x + 3 == 5 * x - 9)),
 "PUCP-015": f"{0.3 * 0.4 * 500:g}", "PUCP-016": f"S/ {80 / 0.8:g}", "PUCP-017": f"{5 * 10} cm²",
 "PUCP-018": str(2 ** 10 // 2 ** 7), "PUCP-019": str(7 * 3), "PUCP-020": str(7 ** 2 - 2 * 10), "PUCP-021": f"{int((6**2 + 8**2) ** 0.5)} cm",

 # ULIMA
 "ULIMA-001": str(5 + 8), "ULIMA-002": str(39 * 2 + 1), "ULIMA-003": str(next(x for x in range(50) if 40 + x == 3 * (10 + x))),
 "ULIMA-004": f"{0.25 * 0.6 * 200:g}", "ULIMA-005": ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"][100 % 7],
 "ULIMA-006": str(sum(1 for n in range(10, 100) if n // 10 % 2 == 0 and n % 2 == 0)), "ULIMA-007": f"S/ {(3 * 20 + 2 * 30) / 5:g}",
 "ULIMA-008": f"S/ {60 / (F(2, 3) * F(3, 4))}", "ULIMA-010": str(sum(x for x in range(-10, 10) if x * x - 5 * x + 6 == 0)),
 "ULIMA-011": str(3 * (3 * 2 - 2) - 2), "ULIMA-012": str(next(k for k in range(10) if 2 ** k == 32)), "ULIMA-014": f"S/ {1000 * 0.05 * 3:g}",
 # UPC
 "UPC-001": str(14 * 2), "UPC-002": f"S/ {18 / 4 * 10:g}", "UPC-003": f"S/ {1200 * 0.85:,.0f}".replace(",", " "),
 "UPC-004": f"{0.3 * 12 + 0.3 * 15 + 0.4 * 18:.1f}".replace(".", ","), "UPC-005": f"{(180 - 120) / 120 * 100:g} %",
 "UPC-006": f"{18000 / 60 * 10:,.0f} m".replace(",", " "), "UPC-007": str(F(5, 10)), "UPC-008": str(next(x for x in range(-20, 20) if 3 * (x - 2) == x + 8)),
 "UPC-009": str(max(g for g in range(100) if 30 + 2 * g <= 50)), "UPC-010": f"{2 * (12 + 8)} m", "UPC-011": str(2 * 20 * 400 // (5 * 8)),
 "UPC-012": str(next(n for n in range(30) if 3 * n + 3 == 36) + 2),
 # UPCH
 "UPCH-001": str(next(x for x in range(-20, 20) if 5 * x - 7 == 2 * x + 8)), "UPCH-002": f"{80 - 0.35 * 80:g}", "UPCH-003": str(3 ** 6 // 3 ** 4),
 "UPCH-004": str(next(x + y for x in range(20) for y in range(20) if 2 * x + y == 11 and x - y == 1)), "UPCH-005": f"{36 / 10 * 5:g} mL",
 "UPCH-006": str(27 + 11), "UPCH-018": "protones", "UPCH-019": f"{2 * 1 + 16} g/mol", "UPCH-021": f"{88 / (12 + 2 * 16):g}",
 "UPCH-022": f"{0 + 2 * 5} m/s", "UPCH-023": f"{50 * 10} N", "UPCH-024": f"{20 * 3} J",
}
assert 2 * 5 + 5 == 15 and 2 * 3 + 3 * 1 == 9  # perímetro 30 con ancho 5 y largo 10; sistema x=7, y=3
for i, v in calc.items():
    check(f"respuesta {i} = {v}", marcada(i) == v, f"(marcada: {marcada(i)})")
    otras = [P[i][k] for k in "ABCDE" if k != P[i]["respuesta"]]
    check(f"{i}: ninguna otra alternativa es correcta", v not in otras)

# 2) Estructura del banco
sys.path.insert(0, AQUI); import validar_banco as vb
check("banco actual sin errores", vb.validar(filas) == [], str(vb.validar(filas)))
for u in sorted({r["universidad"] for r in filas}):
    fu = [r for r in filas if r["universidad"] == u]
    check(f"{u}: al menos 20 preguntas para el test de la web", len(fu) >= 20)
    check(f"{u}: claves repartidas (ninguna letra > 40 %, todas usadas)", max(sum(r["respuesta"] == k for r in fu) for k in "ABCDE") <= 0.4 * len(fu) and all(any(r["respuesta"] == k for r in fu) for k in "ABCDE"))
check("preguntas de comprensión traen su texto", all(r["texto"] for r in filas if r["area"] == "Comprensión Lectora"))

# 3) Errores de edición provocados
casos = {
 "respuesta inválida": lambda r: r.update(respuesta="F"),
 "id repetido": lambda r: r.update(id=filas[1]["id"]),
 "alternativa vacía": lambda r: r.update(C=""),
 "alternativas repetidas": lambda r: r.update(B=r["A"]),
 "dificultad fuera de rango": lambda r: r.update(dificultad="5"),
 "universidad mal escrita": lambda r: r.update(universidad="Catolica"),
}
for nombre, f in casos.items():
    copia = [dict(r) for r in filas]; f(copia[0])
    check(f"detecta: {nombre}", len(vb.validar(copia)) > 0)

# 4) Flujo completo en una copia: respaldo, log, bloqueo ante errores y restauración
tmp = tempfile.mkdtemp(prefix="test_banco_"); shutil.copytree(BASE, os.path.join(tmp, "b"), ignore=shutil.ignore_patterns("backups", "logs", "simulacros", "__pycache__"))
b = os.path.join(tmp, "b"); val = [sys.executable, os.path.join(b, "herramientas", "validar_banco.py")]
r1 = subprocess.run(val, capture_output=True, text=True)
check("primera validación OK", r1.returncode == 0, r1.stdout + r1.stderr)
check("crea respaldo inicial", len(os.listdir(os.path.join(b, "backups"))) == 1)
r1b = subprocess.run(val, capture_output=True, text=True)
check("sin cambios no crea otro respaldo", len(os.listdir(os.path.join(b, "backups"))) == 1)
xlsx = os.path.join(b, "ASTROS_Banco_Preguntas.xlsx"); antes = os.path.getmtime(xlsx)
def escribir(rows):
    with open(os.path.join(b, "preguntas.csv"), "w", newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=vb.COLS); w.writeheader(); w.writerows(rows)
filas_b = list(csv.DictReader(open(os.path.join(b, "preguntas.csv"), encoding="utf-8")))
clave_original = filas_b[0]["respuesta"]; filas_b[0]["respuesta"] = "Z"; escribir(filas_b)
r2 = subprocess.run(val, capture_output=True, text=True)
check("con error: falla y no regenera Excel", r2.returncode == 1 and os.path.getmtime(xlsx) == antes)
check("con error: queda en errores.log", "respuesta debe ser" in open(os.path.join(b, "logs", "errores.log"), encoding="utf-8").read())
filas_b[0]["respuesta"] = clave_original
for r in filas_b:
    if r["id"] == "PUCP-002": r["tema"] = "Sucesiones cuadráticas"
escribir(filas_b)
import time; time.sleep(1.1)
r3 = subprocess.run(val, capture_output=True, text=True)
log = open(os.path.join(b, "logs", "cambios.log"), encoding="utf-8").read()
check("edición corregida: respalda y registra la pregunta editada", r3.returncode == 0 and "editadas ['PUCP-002']" in log, log[-300:])
primero = sorted(os.listdir(os.path.join(b, "backups")))[0]
time.sleep(1.1)
r4 = subprocess.run(val + ["--restaurar", f"backups/{primero}"], capture_output=True, text=True)
rest = {r["id"]: r for r in csv.DictReader(open(os.path.join(b, "preguntas.csv"), encoding="utf-8"))}
check("restaurar vuelve a la versión anterior", r4.returncode == 0 and rest["PUCP-002"]["tema"] == "Sucesiones", r4.stdout + r4.stderr)

import json
js = json.load(open(os.path.join(b, "preguntas.json"), encoding="utf-8"))
todas = [q for qs in js["universidades"].values() for q in qs]
check("preguntas.json tiene todas las preguntas válidas", len(todas) == len(rest) and all(q["respuesta"] in q["opciones"] for q in todas))
check("preguntas.json coincide con el CSV", all(rest[q["id"]][q["respuesta"]] == q["opciones"][q["respuesta"]] for q in todas))

web = json.load(open(os.path.join(os.path.dirname(b), "sig", "preguntas-web.json"), encoding="utf-8"))
for u, qs in web["universidades"].items():
    check(f"web {u}: 20 preguntas sin repetir", len(qs) == 20 and len({q["id"] for q in qs}) == 20)
    check(f"web {u}: 'correcta' apunta a la clave del banco", all(q["opciones"][q["correcta"]] == rest[q["id"].upper()][rest[q["id"].upper()]["respuesta"]] for q in qs))
check("web: las 4 universidades", set(web["universidades"]) == {"PUCP", "ULIMA", "UPC", "UPCH"})

# 5) Generador de simulacros
gen = [sys.executable, os.path.join(b, "herramientas", "generar_simulacro.py"), "--universidad", "PUCP", "--n", "12", "--semilla", "7", "--salida", os.path.join(tmp, "out")]
g1 = subprocess.run(gen, capture_output=True, text=True); g2 = subprocess.run(gen, capture_output=True, text=True)
m = re.search(r"(\d+) preguntas · claves: (\w+) · ids: ([\w,-]+)", g1.stdout)
check("simulacro genera PDF", g1.returncode == 0 and m and os.path.exists(os.path.join(tmp, "out", "simulacro_PUCP_general_7.pdf")), g1.stdout + g1.stderr)
if m:
    ids = m.group(3).split(",")
    check("simulacro no excede n y no repite preguntas", int(m.group(1)) <= 12 and len(set(ids)) == len(ids))
    check("claves del PDF coinciden con el banco", m.group(2) == "".join(rest[i]["respuesta"] for i in ids))
    lect = [i for i in ids if rest[i]["texto"]]
    textos = {rest[i]["texto"] for i in lect}
    check("preguntas de un mismo texto van completas", all(sum(r["texto"] == t for r in rest.values()) == sum(rest[i]["texto"] == t for i in lect) for t in textos))
check("misma semilla, mismo simulacro", g1.stdout.split(" · ", 1)[1] == g2.stdout.split(" · ", 1)[1])
shutil.rmtree(tmp, ignore_errors=True)
print(f"\n{'TODAS LAS PRUEBAS PASARON' if not fallos else str(len(fallos)) + ' FALLA(S): ' + '; '.join(fallos)}")
sys.exit(1 if fallos else 0)
