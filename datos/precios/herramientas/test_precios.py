#!/usr/bin/env python3
"""Pruebas automáticas del tarifario ASTROS.

Corre:  python3 herramientas/test_precios.py
1) Valida el tarifario real (sin tocar nada).
2) Simula errores típicos de edición en una copia temporal y verifica que se detecten.
3) Verifica backups, log de cambios, restauración y que precios.json no se rompa.
"""
import csv
import json
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

AQUI = Path(__file__).resolve().parent
BASE = AQUI.parent
SCRIPT = AQUI / "validar_precios.py"


def correr(base, *extra):
    r = subprocess.run([sys.executable, "-I", str(SCRIPT), "--dir", str(base), *extra],
                       capture_output=True, text=True)
    return r.returncode, r.stdout + r.stderr


def editar(base, pid, campo, valor):
    ruta = base / "tarifario.csv"
    with open(ruta, encoding="utf-8") as f:
        filas = list(csv.DictReader(f))
    campos = list(filas[0].keys())
    for f in filas:
        if f["id"] == pid:
            f[campo] = valor
    with open(ruta, "w", newline="", encoding="utf-8") as o:
        w = csv.DictWriter(o, fieldnames=campos)
        w.writeheader()
        w.writerows(filas)


class TarifarioReal(unittest.TestCase):
    def test_tarifario_real_es_valido(self):
        code, out = correr(BASE, "--solo-validar")
        self.assertEqual(code, 0, out)


class ErroresDeEdicion(unittest.TestCase):
    def setUp(self):
        self.tmp = Path(tempfile.mkdtemp())
        for n in ("tarifario.csv", "reglas.csv"):
            shutil.copy2(BASE / n, self.tmp / n)
        code, out = correr(self.tmp)
        self.assertEqual(code, 0, out)

    def tearDown(self):
        shutil.rmtree(self.tmp)

    def espera_error(self, texto):
        code, out = correr(self.tmp)
        self.assertEqual(code, 1, out)
        self.assertIn(texto, out)
        return out

    def test_precio_no_numerico(self):
        editar(self.tmp, "uni-examen", "precio_virtual", "cuatrocientos")
        self.espera_error("no es un número")

    def test_precio_negativo(self):
        editar(self.tmp, "esc-hora", "precio_virtual", "-40")
        self.espera_error("negativo")

    def test_margen_muy_bajo(self):
        editar(self.tmp, "uni-ciclo", "precio_virtual", "990")
        self.espera_error("margen")

    def test_pack_mas_caro_que_hora_suelta(self):
        editar(self.tmp, "pre-pack12", "precio_virtual", "700")
        self.espera_error("más caro que la hora suelta")

    def test_nivel_invalido(self):
        editar(self.tmp, "esc-hora", "nivel", "secundaria")
        self.espera_error("nivel")

    def test_id_repetido(self):
        editar(self.tmp, "esc-pack8", "id", "esc-hora")
        self.espera_error("id repetido")

    def test_horas_cero(self):
        editar(self.tmp, "uni-practica", "horas", "0")
        self.espera_error("no puede ser 0")

    def test_falta_regla(self):
        (self.tmp / "reglas.csv").write_text("regla,valor,descripcion\n", encoding="utf-8")
        self.espera_error("falta la regla")

    def test_error_no_rompe_precios_json(self):
        antes = (self.tmp / "precios.json").read_text(encoding="utf-8")
        editar(self.tmp, "uni-hora", "precio_virtual", "abc")
        self.espera_error("no es un número")
        self.assertEqual(antes, (self.tmp / "precios.json").read_text(encoding="utf-8"))
        self.assertIn("no es un número", (self.tmp / "logs" / "errores.log").read_text(encoding="utf-8"))

    def test_cambio_valido_crea_backup_y_log(self):
        editar(self.tmp, "uni-examen", "precio_virtual", "420")
        code, out = correr(self.tmp)
        self.assertEqual(code, 0, out)
        log = (self.tmp / "logs" / "cambios.log").read_text(encoding="utf-8")
        self.assertIn("uni-examen.precio_virtual: 400 → 420", log)
        self.assertEqual(len(list((self.tmp / "backups").glob("*"))), 2)
        datos = json.loads((self.tmp / "precios.json").read_text(encoding="utf-8"))
        examen = [p for p in datos["niveles"]["universitario"] if p["id"] == "uni-examen"][0]
        self.assertEqual(examen["precio"], 420)

    def test_sin_cambios_no_duplica_backup(self):
        correr(self.tmp)
        self.assertEqual(len(list((self.tmp / "backups").glob("*"))), 1)

    def test_restaurar_backup(self):
        primero = sorted((self.tmp / "backups").glob("*"))[0]
        editar(self.tmp, "esc-hora", "precio_virtual", "45")
        correr(self.tmp)
        code, out = correr(self.tmp, "--restaurar", str(primero))
        self.assertEqual(code, 0, out)
        self.assertIn("esc-hora,escolar,Hora suelta,1,1,1,40,", (self.tmp / "tarifario.csv").read_text(encoding="utf-8"))

    def test_json_no_publica_datos_internos(self):
        texto = (self.tmp / "precios.json").read_text(encoding="utf-8")
        self.assertNotIn("pago_tutor", texto)
        self.assertNotIn("margen", texto)


if __name__ == "__main__":
    unittest.main(verbosity=2)
