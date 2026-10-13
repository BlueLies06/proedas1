// ASTROS · configuración pública
// Pega aquí la Project URL y la clave "anon / publishable" de Supabase (Project Settings → API).
// Ambas son públicas por diseño: la seguridad la ponen las reglas RLS de supabase/schema.sql.
// Nunca pongas aquí la clave "service_role".
// Si están vacías, la web y el aula funcionan en MODO DEMO con datos de ejemplo guardados en el navegador.
window.ASTROS_CONFIG = {
  supabaseUrl: "",
  supabaseAnonKey: "",
  whatsapp: "51902155458",
  // Horario de citas con padres (consultas digitales de 30 min)
  citas: {
    duracionMin: 30,
    dias: [1, 2, 3, 4, 5, 6],      // 0 = domingo … 6 = sábado
    desde: "16:00",
    hasta: "20:00",
    diasAdelante: 14,
  },
};
