"""Genera un simulacro en PDF (preguntas + hoja de claves y solucionario) desde preguntas.csv.
Uso: python3 generar_simulacro.py --universidad PUCP [--area "Razonamiento Matemático"] [--n 20] [--semilla 1] [--alumno "Nombre"]
Necesita LibreOffice (soffice) para convertir a PDF."""
import argparse, csv, datetime as dt, html, os, random, subprocess, sys, tempfile
BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ORDEN = ["Razonamiento Matemático", "Matemática Básica", "Matemática", "Razonamiento Verbal", "Comprensión Lectora", "Redacción", "Biología", "Química", "Física"]

def seleccionar(filas, universidad, area, n, semilla):
    pool = [r for r in filas if r["universidad"] == universidad and (not area or r["area"] == area)]
    if not pool: sys.exit(f"No hay preguntas para {universidad} {area or ''}")
    rnd = random.Random(semilla)
    # las preguntas de un mismo texto van juntas
    grupos = {}
    for r in pool: grupos.setdefault(r["texto"] or r["id"], []).append(r)
    bloques = list(grupos.values()); rnd.shuffle(bloques)
    elegidas = []
    for b in bloques:
        if len(elegidas) + len(b) <= n: elegidas += b
    elegidas.sort(key=lambda r: (ORDEN.index(r["area"]) if r["area"] in ORDEN else 99, r["texto"]))
    return elegidas

def html_simulacro(sel, titulo, alumno):
    e = html.escape
    css = """body{font-family:'DejaVu Sans',Arial;font-size:10.5pt;color:#0B2533}
    h1{background:#0B2533;color:#F9C74F;padding:10px;margin:0} .sub{color:#1FA2A6;margin:4px 0 14px}
    h2{color:#0B2533;border-bottom:2px solid #F9C74F;margin-top:18px} .t{background:#EEF6F7;padding:8px;font-style:italic}
    .q{margin:10px 0;page-break-inside:avoid} .o{margin-left:18px} .pb{page-break-before:always} td,th{border:1px solid #ccc;padding:4px}"""
    out = [f"<html><head><meta charset='utf-8'><style>{css}</style></head><body>",
           f"<h1>ASTROS · {e(titulo)}</h1><p class='sub'>Maestros Asesores · \"Aprender para crecer\" · Alumno: {e(alumno or '________________')} · Fecha: {dt.date.today():%d/%m/%Y}</p>",
           f"<p>{len(sel)} preguntas · Tiempo sugerido: {round(sum(int(r['tiempo_seg']) for r in sel)/60)} minutos · Marca una sola alternativa.</p>"]
    area = texto = None
    for i, r in enumerate(sel, 1):
        if r["area"] != area: area = r["area"]; out.append(f"<h2>{e(area)}</h2>")
        if r["texto"] and r["texto"] != texto: out.append(f"<p class='t'>{e(r['texto'])}</p>")
        texto = r["texto"]
        ops = "<br>".join(f"&nbsp;&nbsp;&nbsp;{k}) {e(r[k])}" for k in "ABCDE")
        out.append(f"<p class='q'><b>{i}.</b> {e(r['enunciado'])}<br>{ops}</p>")
    out.append("<h1 class='pb'>Claves y solucionario</h1><table><tr><th>N°</th><th>Clave</th><th>Tema</th><th>Solución</th></tr>")
    for i, r in enumerate(sel, 1):
        out.append(f"<tr><td>{i}</td><td><b>{r['respuesta']}</b></td><td>{e(r['tema'])}</td><td>{e(r['solucion'])}</td></tr>")
    out.append("</table><p class='sub'>IG/FB @1.masesores · WhatsApp 902 155 458</p></body></html>")
    return "\n".join(out)

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--universidad", required=True); ap.add_argument("--area"); ap.add_argument("--n", type=int, default=20)
    ap.add_argument("--semilla", type=int, default=None); ap.add_argument("--alumno", default=""); ap.add_argument("--salida", default=os.path.join(BASE, "simulacros"))
    a = ap.parse_args()
    filas = list(csv.DictReader(open(os.path.join(BASE, "preguntas.csv"), encoding="utf-8")))
    semilla = a.semilla if a.semilla is not None else int(dt.datetime.now().timestamp())
    sel = seleccionar(filas, a.universidad, a.area, a.n, semilla)
    titulo = f"Simulacro {a.universidad}" + (f" · {a.area}" if a.area else "")
    nombre = f"simulacro_{a.universidad}_{(a.area or 'general').replace(' ', '-')}_{semilla}"
    tmp = tempfile.mkdtemp(); ruta = os.path.join(tmp, nombre + ".html")
    open(ruta, "w", encoding="utf-8").write(html_simulacro(sel, titulo, a.alumno))
    os.makedirs(a.salida, exist_ok=True)
    subprocess.run(["soffice", "--headless", "--convert-to", "pdf:writer_web_pdf_Export", "--outdir", a.salida, ruta], check=True, capture_output=True)
    print(f"OK: {os.path.join(a.salida, nombre + '.pdf')} · {len(sel)} preguntas · claves: {''.join(r['respuesta'] for r in sel)} · ids: {','.join(r['id'] for r in sel)}")

if __name__ == "__main__":
    main()
