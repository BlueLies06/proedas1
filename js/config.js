// ASTROS · configuración pública
// Pega aquí la Project URL y la clave "anon / publishable" de Supabase (Project Settings → API).
// Ambas son públicas por diseño: la seguridad la ponen las reglas RLS de supabase/schema.sql.
// Nunca pongas aquí la clave "service_role".
// Si están vacías, la web y el aula funcionan en MODO DEMO con datos de ejemplo guardados en el navegador.
window.ASTROS_CONFIG = {
  supabaseUrl: "https://qstbpaocvdzlnhlznpcn.supabase.co",
  supabaseAnonKey: "sb_publishable_9hNZ0c25lddsAkED0rLRtQ_AfX7tWKm",
  whatsapp: "51902155458",
  // Horario de citas con padres (consultas digitales de 30 min)
  citas: {
    duracionMin: 30,
    dias: [0, 1, 2, 3, 4, 5, 6],   // 0 = domingo … 6 = sábado (hoy: todos los días)
    franjas: [                     // "hasta" es la hora en que termina la última cita
      { nombre: "Mañana", desde: "09:00", hasta: "13:00" },
      { nombre: "Tarde", desde: "15:00", hasta: "21:00" },
    ],
    diasAdelante: 14,
  },
};
