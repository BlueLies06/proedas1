# Conectar el aula virtual a Supabase

Proyecto conectado: `qstbpaocvdzlnhlznpcn` (URL y clave *publishable* ya están en `js/config.js`). Si `js/config.js` queda vacío, la web y el aula funcionan en **modo demo** (datos de ejemplo guardados solo en tu navegador).

## 1. Crear el proyecto (una sola vez)
1. Entra a https://supabase.com, crea una cuenta y un proyecto llamado **astros** (región Americas).
2. **SQL Editor → New query**: pega todo `supabase/schema.sql` y dale **Run**. Crea tablas, reglas de seguridad y el espacio para archivos. Se puede volver a ejecutar sin perder datos.
3. **Authentication → URL Configuration**: en *Site URL* pon `https://bluelies06.github.io/proedas1/aula/` y en *Redirect URLs* agrega `https://bluelies06.github.io/proedas1/**` (para los enlaces de confirmación y de recuperar contraseña).
4. **Project Settings → API Keys**: copia la *Project URL* y la *Publishable key* en `js/config.js`. Nunca uses la *secret key* ni la *service_role*.

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
