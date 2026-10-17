"""Fuente de las preguntas originales ULIMA, UPC y UPCH (2026-10-13). Agrega o reemplaza esas filas en preguntas.csv.
Uso: python3 fuente_preguntas_otras.py && python3 validar_banco.py"""
import csv, os
BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CSV = os.path.join(BASE, "preguntas.csv")
COLS = ["id", "universidad", "examen", "area", "curso", "tema", "dificultad", "texto", "enunciado", "A", "B", "C", "D", "E", "respuesta", "solucion", "tiempo_seg", "fuente", "estado"]
T_ANCH = ("La anchoveta es un pez pequeño, pero su importancia para el Perú es enorme. Gracias a la corriente de Humboldt, de aguas frías "
          "y ricas en nutrientes, el mar peruano alberga una de las mayores poblaciones de este pez en el mundo. La mayor parte de la captura "
          "se destina a producir harina y aceite de pescado, que se exportan para alimentar animales de granja y peces de criadero. Sin embargo, "
          "solo una pequeña fracción llega a la mesa de los peruanos, a pesar de que la anchoveta es barata y muy nutritiva. Diversas campañas "
          "han intentado cambiar esta situación, aunque los hábitos alimentarios cambian lentamente.")
T_REDES = ("Las redes sociales nos ofrecen información en cantidades nunca vistas, pero no toda es confiable. Muchas publicaciones se comparten "
           "porque generan emoción, no porque sean ciertas. Por ello, antes de reenviar una noticia, conviene hacerse tres preguntas: ¿quién la "
           "publica?, ¿qué evidencia presenta? y ¿otras fuentes serias dicen lo mismo? Este hábito, que toma menos de un minuto, reduce la difusión "
           "de noticias falsas. No se trata de desconfiar de todo, sino de aprender a distinguir entre lo verificado y lo que solo parece verdadero.")
T_AGUA = ("El agua cubre más del 70 % de la superficie del planeta, pero solo una pequeña parte es agua dulce disponible para el consumo. "
          "En el Perú, la mayoría de la población vive en la costa, una zona desértica, mientras que la mayor parte del agua dulce escurre hacia "
          "la vertiente amazónica. Esta desigualdad obliga a cuidar especialmente los ríos costeños y a invertir en tecnologías como la reutilización "
          "de aguas tratadas. Para los especialistas, el problema no es solo la cantidad de agua, sino cómo se distribuye y cómo se usa.")
Q = []
def q(uni, area, curso, tema, dif, enun, ops, correcta, sol, texto="", mover=False):
    assert correcta in ops and len(ops) == 5 and len(set(ops)) == 5, enun
    Q.append(dict(universidad=uni, area=area, curso=curso, tema=tema, dificultad=dif, texto=texto, enunciado=enun, ops=list(ops),
                  correcta=correcta, solucion=sol, mover=mover))
RM, MA, RV, CL = "Razonamiento Matemático", "Matemática", "Razonamiento Verbal", "Comprensión Lectora"
U = "ULIMA"
q(U, RM, RM, "Sucesiones", 1, "Halla el término que sigue: 1; 1; 2; 3; 5; 8; ...", ["11", "12", "13", "14", "21"], "13", "Cada término es la suma de los dos anteriores: 5 + 8 = 13.")
q(U, RM, RM, "Sucesiones", 2, "Halla el término que sigue: 4; 9; 19; 39; ...", ["59", "69", "78", "79", "80"], "79", "Cada término es el anterior por 2 más 1: 39 × 2 + 1 = 79.")
q(U, RM, RM, "Edades", 2, "Un padre tiene 40 años y su hijo 10. ¿Dentro de cuántos años la edad del padre será el triple de la de su hijo?", ["5", "8", "10", "12", "15"], "5", "40 + x = 3(10 + x), entonces 40 + x = 30 + 3x y x = 5.")
q(U, RM, RM, "Porcentajes", 1, "De 200 clientes de una tienda, el 60 % compra algo y, de ellos, el 25 % paga con Yape. ¿Cuántos clientes pagan con Yape?", ["25", "30", "40", "50", "60"], "30", "60 % de 200 = 120; 25 % de 120 = 30.")
q(U, RM, RM, "Calendarios", 2, "Si hoy es lunes, ¿qué día de la semana será dentro de 100 días?", ["martes", "miércoles", "jueves", "viernes", "sábado"], "miércoles", "100 = 7 × 14 + 2: avanzan 2 días desde el lunes, es decir, miércoles.")
q(U, RM, RM, "Conteo", 2, "¿Cuántos números de dos cifras tienen sus dos cifras pares?", ["16", "20", "25", "40", "45"], "20", "Decenas: 2, 4, 6 u 8 (4 opciones; no puede ser 0). Unidades: 0, 2, 4, 6 u 8 (5 opciones). Total 4 × 5 = 20.")
q(U, RM, RM, "Mezclas", 2, "Se mezclan 3 kg de café de S/ 20 el kg con 2 kg de café de S/ 30 el kg. ¿Cuál es el precio de un kilo de la mezcla?", ["S/ 22", "S/ 24", "S/ 25", "S/ 26", "S/ 28"], "S/ 24", "Costo total: 3 × 20 + 2 × 30 = 120 por 5 kg; 120 ÷ 5 = S/ 24.")
q(U, RM, RM, "Fracciones", 2, "Gasté 1/3 de mi dinero y luego 1/4 de lo que me quedaba. Si aún tengo S/ 60, ¿cuánto tenía al inicio?", ["S/ 90", "S/ 100", "S/ 120", "S/ 144", "S/ 180"], "S/ 120", "Queda x · 2/3 · 3/4 = x/2 = 60, entonces x = 120.")
q(U, RM, RM, "Ordenamiento", 1, "Ana es más alta que Bea; Carla es más baja que Bea; Diana es más alta que Ana. ¿Quién es la más baja?", ["Ana", "Bea", "Carla", "Diana", "No se puede saber"], "Carla", "Orden de mayor a menor: Diana, Ana, Bea, Carla.")
q(U, MA, "Álgebra", "Ecuación cuadrática", 1, "¿Cuál es la suma de las raíces de x² − 5x + 6 = 0?", ["−5", "−1", "1", "5", "6"], "5", "x² − 5x + 6 = (x − 2)(x − 3): raíces 2 y 3, suma 5.")
q(U, MA, "Álgebra", "Funciones", 1, "Si f(x) = 3x − 2, ¿cuánto vale f(f(2))?", ["4", "8", "10", "12", "16"], "10", "f(2) = 4 y f(4) = 12 − 2 = 10.")
q(U, MA, "Álgebra", "Logaritmos", 1, "Calcula log₂ 32.", ["4", "5", "6", "8", "16"], "5", "2⁵ = 32, por lo tanto log₂ 32 = 5.")
q(U, MA, "Geometría", "Círculo", 1, "¿Cuál es el área de un círculo de radio 3 cm?", ["3π cm²", "6π cm²", "9π cm²", "12π cm²", "18π cm²"], "9π cm²", "Área = πr² = π · 3² = 9π cm².")
q(U, MA, "Aritmética", "Interés simple", 1, "¿Qué interés simple generan S/ 1 000 al 5 % anual durante 3 años?", ["S/ 50", "S/ 100", "S/ 150", "S/ 157,63", "S/ 300"], "S/ 150", "I = C · r · t = 1 000 × 0,05 × 3 = S/ 150.")
q(U, RV, RV, "Sinónimos", 1, "Sinónimo de EFÍMERO:", ["eterno", "pasajero", "enorme", "valiente", "oscuro"], "pasajero", "Efímero significa que dura poco: pasajero.", mover=True)
q(U, RV, RV, "Antónimos", 1, "Antónimo de ESCASO:", ["poco", "abundante", "raro", "pobre", "breve"], "abundante", "Escaso es lo que hay en poca cantidad; su opuesto es abundante.", mover=True)
q(U, RV, RV, "Analogías", 2, "LIBRO : BIBLIOTECA ::", ["cuadro : museo", "pintor : pincel", "hoja : árbol", "vaso : agua", "letra : palabra"], "cuadro : museo", "Relación objeto : lugar donde se guarda y exhibe. Igual que el cuadro en el museo.", mover=True)
q(U, RV, RV, "Oraciones incompletas", 1, "A pesar de su ______, logró terminar la maratón.", ["cansancio", "alegría", "velocidad", "éxito", "entusiasmo"], "cansancio", "'A pesar de' introduce un obstáculo: el cansancio.", mover=True)
q(U, RV, RV, "Término excluido", 1, "Señala el término que no pertenece al grupo:", ["rojo", "azul", "verde", "amarillo", "redondo"], "redondo", "Todos son colores excepto 'redondo', que es una forma.", mover=True)
q(U, CL, CL, "Idea principal", 1, "¿Cuál es la idea principal del texto?", ["La corriente de Humboldt es fría y rica en nutrientes.", "La anchoveta es muy importante para el Perú, pero se usa sobre todo para exportar harina y aceite y poco para el consumo humano.", "Los peruanos no comen pescado.", "La harina de pescado alimenta a los animales de granja.", "Las campañas de consumo de anchoveta fueron un éxito."], "La anchoveta es muy importante para el Perú, pero se usa sobre todo para exportar harina y aceite y poco para el consumo humano.", "El texto presenta la importancia de la anchoveta y el contraste entre su uso industrial y su poco consumo directo.", T_ANCH, mover=True)
q(U, CL, CL, "Inferencia", 2, "Se infiere del texto que, si la corriente de Humboldt se debilitara:", ["aumentaría el consumo de anchoveta en el Perú.", "probablemente disminuiría la población de anchoveta.", "la anchoveta sería más cara que la carne.", "se dejaría de exportar harina de pescado de inmediato.", "las campañas de consumo tendrían éxito."], "probablemente disminuiría la población de anchoveta.", "El texto atribuye la gran población de anchoveta a las aguas frías y nutritivas de esa corriente.", T_ANCH, mover=True)
q(U, CL, CL, "Sentido contextual", 1, "En el texto, la palabra FRACCIÓN significa:", ["parte", "número", "división", "fragmento de roca", "quebrado"], "parte", "'Una pequeña fracción llega a la mesa' quiere decir una pequeña parte de la captura.", T_ANCH, mover=True)

U = "UPC"
q(U, RM, RM, "Sucesiones", 2, "Halla el término que sigue: 5; 10; 8; 16; 14; ...", ["12", "18", "24", "28", "30"], "28", "Se alterna ×2 y −2: 14 × 2 = 28.")
q(U, RM, RM, "Proporcionalidad", 1, "Si 4 cuadernos cuestan S/ 18, ¿cuánto cuestan 10 cuadernos?", ["S/ 36", "S/ 40", "S/ 45", "S/ 48", "S/ 54"], "S/ 45", "Cada cuaderno cuesta 18 ÷ 4 = 4,5; diez cuestan S/ 45.")
q(U, RM, RM, "Descuentos", 1, "Un celular cuesta S/ 1 200 y tiene 15 % de descuento. ¿Cuál es el precio final?", ["S/ 1 020", "S/ 1 050", "S/ 1 080", "S/ 1 100", "S/ 1 180"], "S/ 1 020", "15 % de 1 200 = 180; 1 200 − 180 = S/ 1 020.")
q(U, RM, RM, "Promedio ponderado", 2, "Un curso se califica así: práctica 30 %, parcial 30 % y final 40 %. Si un alumno saca 12, 15 y 18 respectivamente, ¿cuál es su nota?", ["14,5", "15", "15,3", "15,8", "16"], "15,3", "0,3 × 12 + 0,3 × 15 + 0,4 × 18 = 3,6 + 4,5 + 7,2 = 15,3.")
q(U, RM, RM, "Análisis de datos", 1, "Una tienda vendió 120 unidades en enero, 150 en febrero y 180 en marzo. ¿En qué porcentaje aumentaron las ventas de enero a marzo?", ["20 %", "25 %", "30 %", "50 %", "60 %"], "50 %", "(180 − 120) ÷ 120 = 0,5, es decir, 50 %.")
q(U, RM, RM, "Móviles", 2, "Un ciclista avanza a 18 km/h. ¿Cuántos metros recorre en 10 minutos?", ["1 800 m", "2 400 m", "3 000 m", "3 600 m", "18 000 m"], "3 000 m", "18 km/h = 18 000 m en 60 min = 300 m por minuto; en 10 min, 3 000 m.")
q(U, RM, RM, "Probabilidades", 1, "Una bolsa tiene 3 bolas rojas, 5 azules y 2 verdes. Si se saca una al azar, ¿cuál es la probabilidad de que NO sea azul?", ["1/5", "3/10", "1/2", "3/5", "7/10"], "1/2", "No azules: 3 + 2 = 5 de 10. Probabilidad 5/10 = 1/2.")
q(U, MA, "Álgebra", "Ecuaciones", 1, "Resuelve: 3(x − 2) = x + 8", ["3", "5", "7", "9", "14"], "7", "3x − 6 = x + 8, entonces 2x = 14 y x = 7.")
q(U, MA, "Álgebra", "Planteo", 2, "Un plan de datos cuesta S/ 30 fijos más S/ 2 por cada GB adicional. Con S/ 50, ¿cuántos GB adicionales puedes comprar como máximo?", ["5", "8", "10", "12", "25"], "10", "30 + 2g ≤ 50, entonces g ≤ 10.")
q(U, MA, "Geometría", "Perímetro", 1, "Se quiere cercar un terreno rectangular de 12 m por 8 m. ¿Cuántos metros de malla se necesitan?", ["20 m", "40 m", "48 m", "80 m", "96 m"], "40 m", "Perímetro = 2(12 + 8) = 40 m.")
q(U, RM, RM, "Regla de tres compuesta", 3, "5 impresoras imprimen 400 hojas en 8 minutos. Al mismo ritmo, ¿cuántas hojas imprimen 2 impresoras en 20 minutos?", ["160", "200", "320", "400", "500"], "400", "Cada impresora imprime 400 ÷ (5 × 8) = 10 hojas por minuto. 2 × 20 × 10 = 400.")
q(U, RM, RM, "Números consecutivos", 1, "Las edades de tres hermanos son números consecutivos y suman 36. ¿Qué edad tiene el mayor?", ["11", "12", "13", "14", "15"], "13", "n + (n + 1) + (n + 2) = 36 da n = 11; el mayor tiene 13.")
q(U, RM, RM, "Lógica", 2, "«Si llueve, el partido se suspende». Se sabe que el partido NO se suspendió. Entonces:", ["llovió.", "no llovió.", "el partido se jugó bajo la lluvia.", "el partido se suspendió.", "no se puede concluir nada."], "no llovió.", "Si lloviera, se habría suspendido; como no se suspendió, no llovió (modus tollens).", mover=True)
q(U, RV, RV, "Sinónimos", 2, "Sinónimo de PERSPICAZ:", ["agudo", "lento", "perezoso", "confuso", "tímido"], "agudo", "Perspicaz es quien percibe y entiende con rapidez: agudo.", mover=True)
q(U, RV, RV, "Antónimos", 2, "Antónimo de DILIGENTE:", ["cuidadoso", "rápido", "negligente", "atento", "activo"], "negligente", "Diligente es cuidadoso y activo; lo opuesto es negligente.", mover=True)
q(U, RV, RV, "Analogías", 1, "MÉDICO : HOSPITAL ::", ["docente : colegio", "alumno : cuaderno", "pan : panadero", "juez : ley", "chofer : pasajero"], "docente : colegio", "Relación profesional : lugar donde trabaja.", mover=True)
q(U, RV, RV, "Conectores", 1, "Practicó todos los días; ______, mejoró su puntaje.", ["no obstante", "por eso", "aunque", "en cambio", "sin embargo"], "por eso", "La segunda idea es consecuencia de la primera: 'por eso'.", mover=True)
q(U, RV, RV, "Oraciones incompletas", 1, "El informe era tan ______ que nadie pudo entender sus conclusiones.", ["claro", "breve", "confuso", "preciso", "interesante"], "confuso", "Que nadie lo entendiera indica que era confuso.", mover=True)
q(U, RV, RV, "Término excluido", 1, "Señala el término que no pertenece al grupo:", ["martillo", "serrucho", "alicate", "destornillador", "cuaderno"], "cuaderno", "Todas son herramientas excepto el cuaderno.", mover=True)
q(U, CL, CL, "Propósito del autor", 1, "¿Cuál es el propósito principal del autor?", ["Prohibir el uso de redes sociales.", "Recomendar un hábito sencillo para verificar la información antes de compartirla.", "Demostrar que toda noticia emotiva es falsa.", "Explicar cómo funcionan las redes sociales.", "Criticar a quienes publican noticias."], "Recomendar un hábito sencillo para verificar la información antes de compartirla.", "El texto propone tres preguntas para verificar antes de reenviar.", T_REDES, mover=True)
q(U, CL, CL, "Incompatibilidad", 2, "Es incompatible con el texto afirmar que:", ["muchas publicaciones se comparten por la emoción que generan.", "verificar una noticia puede tomar menos de un minuto.", "toda la información de las redes sociales es falsa.", "conviene revisar quién publica una noticia.", "hay que distinguir lo verificado de lo que solo lo parece."], "toda la información de las redes sociales es falsa.", "El autor dice que 'no toda es confiable' y que 'no se trata de desconfiar de todo'.", T_REDES, mover=True)
q(U, CL, CL, "Inferencia", 2, "Según el texto, una noticia que causa mucha indignación:", ["es necesariamente falsa.", "no es necesariamente verdadera por generar emoción.", "debe compartirse de inmediato.", "siempre viene de una fuente seria.", "no puede verificarse."], "no es necesariamente verdadera por generar emoción.", "El texto dice que muchas publicaciones se comparten 'porque generan emoción, no porque sean ciertas'.", T_REDES, mover=True)

U = "UPCH"
BI, QU, FI = "Biología", "Química", "Física"
q(U, MA, "Álgebra", "Ecuaciones", 1, "Resuelve: 5x − 7 = 2x + 8", ["3", "5", "7", "9", "15"], "5", "3x = 15, x = 5.")
q(U, MA, "Aritmética", "Porcentajes", 1, "De 80 postulantes, el 35 % ingresó. ¿Cuántos NO ingresaron?", ["28", "45", "48", "52", "56"], "52", "Ingresaron 0,35 × 80 = 28; no ingresaron 80 − 28 = 52.")
q(U, MA, "Álgebra", "Leyes de exponentes", 2, "Simplifica: (3²)³ ÷ 3⁴", ["3", "9", "27", "81", "243"], "9", "(3²)³ = 3⁶; 3⁶ ÷ 3⁴ = 3² = 9.")
q(U, MA, "Álgebra", "Sistemas de ecuaciones", 2, "Si 2x + y = 11 y x − y = 1, ¿cuánto vale x + y?", ["5", "6", "7", "8", "9"], "7", "Sumando: 3x = 12, x = 4; y = 3. x + y = 7.")
q(U, MA, "Aritmética", "Proporcionalidad", 1, "Un jarabe se administra a razón de 5 mL por cada 10 kg de peso. ¿Qué dosis corresponde a un niño de 36 kg?", ["15 mL", "16 mL", "18 mL", "20 mL", "36 mL"], "18 mL", "36 ÷ 10 × 5 = 18 mL.")
q(U, MA, RM, "Sucesiones", 2, "Halla el término que sigue: 3; 6; 11; 18; 27; ...", ["34", "36", "38", "40", "42"], "38", "Las diferencias son 3, 5, 7, 9, 11: 27 + 11 = 38.")
q(U, RV, RV, "Sinónimos", 2, "Sinónimo de INOCUO:", ["dañino", "inofensivo", "inútil", "oculto", "ingenuo"], "inofensivo", "Inocuo es lo que no hace daño: inofensivo.", mover=True)
q(U, RV, RV, "Antónimos", 1, "Antónimo de HOSTIL:", ["agresivo", "amable", "lejano", "frío", "severo"], "amable", "Hostil es agresivo o enemigo; su opuesto es amable.", mover=True)
q(U, RV, RV, "Analogías", 2, "CORAZÓN : SANGRE ::", ["bomba : agua", "pulmón : respirar", "ojo : ver", "hueso : calcio", "piel : sudor"], "bomba : agua", "El corazón impulsa la sangre como una bomba impulsa el agua.", mover=True)
q(U, RV, RV, "Oraciones incompletas", 1, "La vacuna resultó ______: redujo los contagios en un 90 %.", ["ineficaz", "eficaz", "costosa", "dudosa", "peligrosa"], "eficaz", "Reducir los contagios en 90 % muestra que fue eficaz.", mover=True)
q(U, CL, CL, "Idea principal", 2, "¿Cuál es la idea central del texto?", ["En el Perú no hay agua dulce.", "El problema del agua en el Perú depende sobre todo de su distribución y de su uso.", "La Amazonía tiene poca agua.", "El 70 % del planeta es agua dulce.", "La reutilización de aguas tratadas es peligrosa."], "El problema del agua en el Perú depende sobre todo de su distribución y de su uso.", "El texto termina afirmando que el problema 'no es solo la cantidad de agua, sino cómo se distribuye y cómo se usa'.", T_AGUA, mover=True)
q(U, CL, CL, "Inferencia", 2, "Del texto se deduce que la costa peruana:", ["tiene más agua dulce que la Amazonía.", "concentra a mucha población con poca agua disponible.", "no necesita tecnologías de reutilización.", "recibe la mayor parte del agua que escurre de los Andes.", "no tiene ríos."], "concentra a mucha población con poca agua disponible.", "La mayoría vive en la costa desértica y la mayor parte del agua va a la vertiente amazónica.", T_AGUA, mover=True)
q(U, BI, BI, "Célula", 1, "¿En qué organelo se produce la mayor parte del ATP de una célula eucariota?", ["ribosoma", "mitocondria", "aparato de Golgi", "lisosoma", "núcleo"], "mitocondria", "La respiración celular aeróbica, que genera la mayor parte del ATP, ocurre en la mitocondria.", mover=True)
q(U, BI, BI, "Genética molecular", 2, "¿Qué molécula lleva la información genética del núcleo a los ribosomas?", ["ADN", "ARN de transferencia", "ARN mensajero", "ARN ribosomal", "ATP"], "ARN mensajero", "El ARN mensajero se transcribe a partir del ADN y lleva el mensaje al ribosoma para la síntesis de proteínas.", mover=True)
q(U, BI, BI, "Fotosíntesis", 1, "En las células vegetales, la fotosíntesis ocurre en:", ["la mitocondria", "el cloroplasto", "la vacuola", "el núcleo", "la pared celular"], "el cloroplasto", "El cloroplasto contiene la clorofila que capta la luz para la fotosíntesis.", mover=True)
q(U, BI, BI, "Sangre", 1, "¿Qué elementos de la sangre participan principalmente en la coagulación?", ["eritrocitos", "linfocitos", "plaquetas", "neutrófilos", "monocitos"], "plaquetas", "Las plaquetas forman el tapón y activan la coagulación.", mover=True)
q(U, BI, BI, "Genética", 1, "¿Cuántos cromosomas tiene una célula somática humana normal?", ["23", "44", "46", "48", "92"], "46", "Las células somáticas humanas son diploides: 23 pares, es decir, 46 cromosomas.")
q(U, QU, QU, "Estructura atómica", 1, "El número atómico (Z) de un elemento indica su número de:", ["neutrones", "protones", "nucleones", "electrones de valencia", "isótopos"], "protones", "Z es la cantidad de protones del núcleo.", mover=True)
q(U, QU, QU, "Masa molar", 1, "¿Cuál es la masa molar del agua (H₂O)? Datos: H = 1, O = 16.", ["10 g/mol", "16 g/mol", "17 g/mol", "18 g/mol", "20 g/mol"], "18 g/mol", "2 × 1 + 16 = 18 g/mol.")
q(U, QU, QU, "Ácidos y bases", 1, "A 25 °C, una solución neutra tiene un pH de:", ["0", "1", "7", "10", "14"], "7", "A 25 °C, [H⁺] = [OH⁻] = 10⁻⁷ M, entonces pH = 7.")
q(U, QU, QU, "Mol", 2, "¿Cuántos moles hay en 88 g de CO₂? Datos: C = 12, O = 16.", ["0,5", "1", "2", "3", "4"], "2", "Masa molar del CO₂ = 12 + 2 × 16 = 44 g/mol; 88 ÷ 44 = 2 mol.")
q(U, FI, FI, "Cinemática (MRUV)", 1, "Un auto parte del reposo con aceleración constante de 2 m/s². ¿Qué velocidad tiene a los 5 s?", ["2 m/s", "5 m/s", "7 m/s", "10 m/s", "25 m/s"], "10 m/s", "v = v₀ + at = 0 + 2 × 5 = 10 m/s.")
q(U, FI, FI, "Dinámica", 1, "¿Cuál es el peso de una persona de 50 kg? (g = 10 m/s²)", ["5 N", "50 N", "60 N", "500 N", "5 000 N"], "500 N", "P = mg = 50 × 10 = 500 N.")
q(U, FI, FI, "Trabajo", 1, "Una fuerza de 20 N desplaza un objeto 3 m en su misma dirección. ¿Qué trabajo realiza?", ["6,7 J", "17 J", "23 J", "60 J", "600 J"], "60 J", "W = F · d = 20 × 3 = 60 J.")

EXAMEN = {"ULIMA": "Examen de Escolares / Egresados", "UPC": "Evaluación Integral", "UPCH": "Examen General (incluye Medicina)"}
filas = []
for uni in ("ULIMA", "UPC", "UPCH"):
    qs = [x for x in Q if x["universidad"] == uni]
    cuenta = {k: 0 for k in "ABCDE"}
    for x in qs:
        if not x["mover"]: cuenta["ABCDE"[x["ops"].index(x["correcta"])]] += 1
    for x in qs:  # las alternativas de texto se reubican para repartir las claves A-E
        if x["mover"]:
            destino = min("ABCDE", key=lambda k: (cuenta[k], "ABCDE".index(k)))
            i, j = x["ops"].index(x["correcta"]), "ABCDE".index(destino)
            x["ops"][i], x["ops"][j] = x["ops"][j], x["ops"][i]
            cuenta[destino] += 1
    for n, x in enumerate(qs, 1):
        filas.append({"id": f"{uni}-{n:03d}", "universidad": uni, "examen": EXAMEN[uni], "area": x["area"], "curso": x["curso"], "tema": x["tema"],
                      "dificultad": x["dificultad"], "texto": x["texto"], "enunciado": x["enunciado"], **dict(zip("ABCDE", x["ops"])),
                      "respuesta": "ABCDE"[x["ops"].index(x["correcta"])], "solucion": x["solucion"],
                      "tiempo_seg": 90 if x["area"] in (RM, MA) else 75, "fuente": f"Original ASTROS (estilo {uni})", "estado": "Revisado por Claude"})
actuales = [r for r in csv.DictReader(open(CSV, encoding="utf-8")) if r["universidad"] not in EXAMEN]
with open(CSV, "w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=COLS); w.writeheader(); w.writerows(actuales + filas)
print(f"{len(filas)} preguntas ULIMA/UPC/UPCH; total {len(actuales) + len(filas)}")
