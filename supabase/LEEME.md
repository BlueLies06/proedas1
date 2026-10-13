# Conectar el aula virtual a Supabase

Mientras `js/config.js` esté vacío, la web y el aula funcionan en **modo demo** (datos de ejemplo guardados solo en tu navegador).

## 1. Crear el proyecto (una sola vez)
1. Entra a https://supabase.com, crea una cuenta y un proyecto llamado **astros** (región São Paulo).
2. **SQL Editor → New query**: pega todo `supabase/schema.sql` y dale **Run**. Crea tablas, reglas de seguridad y el espacio para archivos. Se puede volver a ejecutar sin perder datos.
3. **Authentication → URL Configuration**: en *Site URL* pon la dirección de la web (por ejemplo `https://bluelies06.github.io/proedas1/aula/`).
4. **Project Settings → API**: copia la *Project URL* y la clave *anon / publishable* en `js/config.js`. No uses la clave *service_role*.

## 2. Primer ingreso
- La **primera cuenta** que se registra en el aula queda como **Administración**. Regístrate tú primero.
- Las demás cuentas nacen como **Alumno**. Desde *Aula → Usuarios* cambias a alguien a **Profesor** y guardas su WhatsApp.
- Desde *Aula → Alumnos* matriculas a cada alumno en su curso con sus horas.

## 3. Cómo funcionan las reservas
- El profesor abre horarios en *Calendario* (curso, duración, número de butacas, enlace de Meet).
- Solo los alumnos matriculados en ese curso ven el horario y separan una butaca.
- La base de datos impide reservar dos veces la misma butaca, pasar el aforo o reservar sin matrícula. Al llenarse, la clase se cierra sola; si alguien libera su butaca, se reabre.

## 4. Citas de padres y simulacro
- Las citas que se piden en la web aparecen en *Aula → Citas*. Nadie de afuera puede ver los datos de otras citas, solo qué horarios están ocupados.
- Los resultados del simulacro se guardan en la tabla `simulacros` para el SIG.
