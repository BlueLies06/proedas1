-- ASTROS · base de datos del aula virtual (Supabase / PostgreSQL)
-- Cómo usar: Supabase → SQL Editor → New query → pega todo este archivo → Run.
-- Se puede volver a ejecutar sin romper nada (usa "if not exists" / "or replace").

-- =========================================================
-- Tablas
-- =========================================================

-- Perfil de cada usuario (se crea solo al registrarse). Roles: admin, profesor, alumno, padre.
create table if not exists public.perfiles (
  id uuid primary key references auth.users on delete cascade,
  nombre text not null default '',
  email text,
  rol text not null default 'alumno' check (rol in ('admin','profesor','alumno','padre')),
  telefono text,
  nivel text check (nivel in ('escolar','pre','universitario')),
  universidad text,
  creado timestamptz not null default now()
);

create table if not exists public.cursos (
  id bigint generated always as identity primary key,
  nombre text not null,
  nivel text not null check (nivel in ('escolar','pre','universitario')),
  universidad text,
  activo boolean not null default true
);

-- Qué cursos tiene contratados cada alumno y cuántas horas le quedan.
create table if not exists public.matriculas (
  id bigint generated always as identity primary key,
  alumno_id uuid not null references public.perfiles on delete cascade,
  curso_id bigint not null references public.cursos on delete cascade,
  profesor_id uuid references public.perfiles on delete set null,
  paquete text,
  horas_compradas numeric not null default 0,
  horas_usadas numeric not null default 0,
  activo boolean not null default true,
  creado timestamptz not null default now(),
  unique (alumno_id, curso_id)
);

-- Horarios que el profesor abre. La capacidad es el número de butacas.
create table if not exists public.sesiones (
  id bigint generated always as identity primary key,
  profesor_id uuid not null references public.perfiles on delete cascade,
  curso_id bigint references public.cursos on delete set null,
  inicio timestamptz not null,
  fin timestamptz not null,
  capacidad int not null default 1 check (capacidad between 1 and 30),
  modalidad text not null default 'virtual' check (modalidad in ('virtual','presencial','domicilio')),
  enlace text,
  tema text,
  estado text not null default 'abierta' check (estado in ('abierta','cerrada','cancelada')),
  creado timestamptz not null default now(),
  check (fin > inicio)
);

-- Butaca que separa el alumno en una sesión.
create table if not exists public.reservas (
  id bigint generated always as identity primary key,
  sesion_id bigint not null references public.sesiones on delete cascade,
  alumno_id uuid not null references public.perfiles on delete cascade,
  butaca int not null check (butaca >= 1),
  creado timestamptz not null default now(),
  unique (sesion_id, butaca),
  unique (sesion_id, alumno_id)
);

create table if not exists public.documentos (
  id bigint generated always as identity primary key,
  curso_id bigint references public.cursos on delete cascade,
  titulo text not null,
  tipo text not null default 'documento' check (tipo in ('documento','horario','practica','grabacion','enlace')),
  url text,
  ruta text,               -- ruta en Storage (bucket "documentos")
  subido_por uuid references public.perfiles on delete set null,
  creado timestamptz not null default now()
);

-- Prácticas virtuales: preguntas en el mismo formato que el simulacro de la web.
create table if not exists public.practicas (
  id bigint generated always as identity primary key,
  curso_id bigint references public.cursos on delete cascade,
  titulo text not null,
  preguntas jsonb not null default '[]'::jsonb,
  abre timestamptz,
  cierra timestamptz,
  creado timestamptz not null default now()
);

create table if not exists public.intentos (
  id bigint generated always as identity primary key,
  practica_id bigint not null references public.practicas on delete cascade,
  alumno_id uuid not null references public.perfiles on delete cascade,
  correctas int not null,
  total int not null,
  respuestas jsonb,
  creado timestamptz not null default now()
);

-- Citas de padres (desde la web pública, sin cuenta).
create table if not exists public.citas (
  id bigint generated always as identity primary key,
  inicio timestamptz not null,
  padre_nombre text not null,
  alumno_nombre text,
  whatsapp text not null,
  nivel text,
  motivo text,
  estado text not null default 'pendiente' check (estado in ('pendiente','confirmada','realizada','cancelada')),
  creado timestamptz not null default now()
);

-- Un horario de cita solo puede tomarse una vez (las canceladas lo liberan).
create unique index if not exists citas_horario_unico on public.citas (inicio) where estado <> 'cancelada';

-- Resultados del simulacro público (opcional, para el SIG).
create table if not exists public.simulacros (
  id bigint generated always as identity primary key,
  universidad text not null,
  correctas int not null,
  total int not null,
  por_area jsonb,
  nombre text,
  whatsapp text,
  creado timestamptz not null default now()
);

-- =========================================================
-- Funciones de ayuda
-- =========================================================
create or replace function public.mi_rol() returns text
language sql stable security definer set search_path = public as $$
  select rol from public.perfiles where id = auth.uid()
$$;

create or replace function public.es_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select rol = 'admin' from public.perfiles where id = auth.uid()), false)
$$;

create or replace function public.es_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select rol in ('admin','profesor') from public.perfiles where id = auth.uid()), false)
$$;

-- Crea el perfil al registrarse. El primer usuario que se registra queda como admin.
create or replace function public.nuevo_usuario() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.perfiles (id, nombre, email, rol)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nombre', split_part(new.email, '@', 1)),
    new.email,
    case when not exists (select 1 from public.perfiles) then 'admin' else 'alumno' end
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists al_registrarse on auth.users;
create trigger al_registrarse after insert on auth.users
  for each row execute function public.nuevo_usuario();

-- Reglas al separar butaca: sesión abierta y futura, alumno matriculado en el curso, butaca dentro del aforo.
create or replace function public.validar_reserva() returns trigger
language plpgsql security definer set search_path = public as $$
declare s public.sesiones;
begin
  select * into s from public.sesiones where id = new.sesion_id for update;
  if s.id is null then raise exception 'La clase no existe'; end if;
  if s.estado <> 'abierta' then raise exception 'Esta clase ya no acepta reservas'; end if;
  if s.inicio <= now() then raise exception 'La clase ya empezó'; end if;
  if new.butaca > s.capacidad then raise exception 'Esa butaca no existe'; end if;
  if (select count(*) from public.reservas where sesion_id = s.id) >= s.capacidad then
    raise exception 'La clase está llena';
  end if;
  if s.curso_id is not null and not public.es_staff() and not exists (
    select 1 from public.matriculas m
    where m.alumno_id = new.alumno_id and m.curso_id = s.curso_id and m.activo
  ) then
    raise exception 'No estás matriculado en este curso';
  end if;
  return new;
end $$;

drop trigger if exists antes_de_reservar on public.reservas;
create trigger antes_de_reservar before insert on public.reservas
  for each row execute function public.validar_reserva();

-- Cierra la sesión cuando se llena y la reabre si alguien cancela.
create or replace function public.actualizar_aforo() returns trigger
language plpgsql security definer set search_path = public as $$
declare sid bigint := coalesce(new.sesion_id, old.sesion_id);
begin
  update public.sesiones s set estado = case
      when (select count(*) from public.reservas r where r.sesion_id = s.id) >= s.capacidad then 'cerrada'
      else 'abierta' end
  where s.id = sid and s.estado <> 'cancelada';
  return null;
end $$;

drop trigger if exists despues_de_reservar on public.reservas;
create trigger despues_de_reservar after insert or delete on public.reservas
  for each row execute function public.actualizar_aforo();

-- Horarios de citas ya tomados (sin datos personales), para la web pública.
create or replace function public.citas_ocupadas(desde timestamptz, hasta timestamptz)
returns setof timestamptz language sql stable security definer set search_path = public as $$
  select inicio from public.citas where inicio between desde and hasta and estado <> 'cancelada'
$$;
grant execute on function public.citas_ocupadas(timestamptz, timestamptz) to anon, authenticated;

-- =========================================================
-- Seguridad por filas (RLS)
-- =========================================================
alter table public.perfiles   enable row level security;
alter table public.cursos     enable row level security;
alter table public.matriculas enable row level security;
alter table public.sesiones   enable row level security;
alter table public.reservas   enable row level security;
alter table public.documentos enable row level security;
alter table public.practicas  enable row level security;
alter table public.intentos   enable row level security;
alter table public.citas      enable row level security;
alter table public.simulacros enable row level security;

-- perfiles
drop policy if exists "perfil propio o staff" on public.perfiles;
create policy "perfil propio o staff" on public.perfiles for select
  using (id = auth.uid() or public.es_staff() or rol in ('profesor','admin'));
drop policy if exists "editar perfil propio" on public.perfiles;
create policy "editar perfil propio" on public.perfiles for update
  using (id = auth.uid()) with check (id = auth.uid() and rol = public.mi_rol());
drop policy if exists "admin gestiona perfiles" on public.perfiles;
create policy "admin gestiona perfiles" on public.perfiles for all
  using (public.es_admin()) with check (public.es_admin());

-- cursos
drop policy if exists "cursos visibles" on public.cursos;
create policy "cursos visibles" on public.cursos for select using (auth.role() = 'authenticated');
drop policy if exists "admin gestiona cursos" on public.cursos;
create policy "admin gestiona cursos" on public.cursos for all using (public.es_admin()) with check (public.es_admin());

-- matriculas
drop policy if exists "ver matriculas" on public.matriculas;
create policy "ver matriculas" on public.matriculas for select
  using (alumno_id = auth.uid() or public.es_staff());
drop policy if exists "admin gestiona matriculas" on public.matriculas;
create policy "admin gestiona matriculas" on public.matriculas for all using (public.es_admin()) with check (public.es_admin());

-- sesiones
drop policy if exists "ver sesiones" on public.sesiones;
create policy "ver sesiones" on public.sesiones for select using (auth.role() = 'authenticated');
drop policy if exists "profesor crea sus sesiones" on public.sesiones;
create policy "profesor crea sus sesiones" on public.sesiones for insert
  with check ((profesor_id = auth.uid() and public.es_staff()) or public.es_admin());
drop policy if exists "profesor edita sus sesiones" on public.sesiones;
create policy "profesor edita sus sesiones" on public.sesiones for update
  using (profesor_id = auth.uid() or public.es_admin());
drop policy if exists "profesor borra sus sesiones" on public.sesiones;
create policy "profesor borra sus sesiones" on public.sesiones for delete
  using (profesor_id = auth.uid() or public.es_admin());

-- reservas (todos ven qué butacas están ocupadas; cada alumno solo crea/borra las suyas)
drop policy if exists "ver butacas" on public.reservas;
create policy "ver butacas" on public.reservas for select using (auth.role() = 'authenticated');
drop policy if exists "alumno reserva" on public.reservas;
create policy "alumno reserva" on public.reservas for insert
  with check (alumno_id = auth.uid() or public.es_staff());
drop policy if exists "alumno cancela" on public.reservas;
create policy "alumno cancela" on public.reservas for delete
  using (alumno_id = auth.uid() or public.es_staff());

-- documentos y prácticas
drop policy if exists "ver documentos" on public.documentos;
create policy "ver documentos" on public.documentos for select using (
  public.es_staff() or curso_id is null or exists (
    select 1 from public.matriculas m where m.curso_id = documentos.curso_id and m.alumno_id = auth.uid() and m.activo));
drop policy if exists "staff gestiona documentos" on public.documentos;
create policy "staff gestiona documentos" on public.documentos for all using (public.es_staff()) with check (public.es_staff());

drop policy if exists "ver practicas" on public.practicas;
create policy "ver practicas" on public.practicas for select using (
  public.es_staff() or curso_id is null or exists (
    select 1 from public.matriculas m where m.curso_id = practicas.curso_id and m.alumno_id = auth.uid() and m.activo));
drop policy if exists "staff gestiona practicas" on public.practicas;
create policy "staff gestiona practicas" on public.practicas for all using (public.es_staff()) with check (public.es_staff());

drop policy if exists "ver intentos" on public.intentos;
create policy "ver intentos" on public.intentos for select using (alumno_id = auth.uid() or public.es_staff());
drop policy if exists "guardar intento" on public.intentos;
create policy "guardar intento" on public.intentos for insert with check (alumno_id = auth.uid());

-- citas: cualquiera puede pedir una; solo el staff las ve y gestiona
drop policy if exists "pedir cita" on public.citas;
create policy "pedir cita" on public.citas for insert to anon, authenticated
  with check (estado = 'pendiente' and inicio > now());
drop policy if exists "staff ve citas" on public.citas;
create policy "staff ve citas" on public.citas for select using (public.es_staff());
drop policy if exists "staff gestiona citas" on public.citas;
create policy "staff gestiona citas" on public.citas for update using (public.es_staff());
drop policy if exists "admin borra citas" on public.citas;
create policy "admin borra citas" on public.citas for delete using (public.es_admin());

-- simulacros: cualquiera guarda su resultado; solo el staff los lee
drop policy if exists "guardar simulacro" on public.simulacros;
create policy "guardar simulacro" on public.simulacros for insert to anon, authenticated with check (true);
drop policy if exists "staff ve simulacros" on public.simulacros;
create policy "staff ve simulacros" on public.simulacros for select using (public.es_staff());

-- =========================================================
-- Permisos de la API
-- Funciona con "Automatically expose new tables" activado o no.
-- Los visitantes sin cuenta (anon) solo pueden pedir citas y guardar simulacros;
-- lo que ve o cambia cada usuario con cuenta lo deciden las políticas RLS de arriba.
-- =========================================================
grant usage on schema public to anon, authenticated;
revoke all on all tables in schema public from anon;
grant insert on public.citas, public.simulacros to anon;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;
grant execute on function public.mi_rol(), public.es_admin(), public.es_staff() to anon, authenticated;

-- =========================================================
-- Archivos (Storage): bucket privado "documentos"
-- =========================================================
insert into storage.buckets (id, name, public) values ('documentos', 'documentos', false)
  on conflict (id) do nothing;

drop policy if exists "staff sube archivos" on storage.objects;
create policy "staff sube archivos" on storage.objects for insert
  with check (bucket_id = 'documentos' and public.es_staff());
drop policy if exists "staff borra archivos" on storage.objects;
create policy "staff borra archivos" on storage.objects for delete
  using (bucket_id = 'documentos' and public.es_staff());
drop policy if exists "usuarios leen archivos" on storage.objects;
create policy "usuarios leen archivos" on storage.objects for select
  using (bucket_id = 'documentos' and auth.role() = 'authenticated');

-- =========================================================
-- Datos iniciales (cursos de ejemplo; edítalos desde el aula)
-- =========================================================
insert into public.cursos (nombre, nivel, universidad)
select * from (values
  ('Matemática escolar', 'escolar', null),
  ('Razonamiento matemático', 'pre', null),
  ('Razonamiento verbal', 'pre', null),
  ('Cálculo 1', 'universitario', 'PUCP'),
  ('Física 1', 'universitario', 'UPC')
) as v(nombre, nivel, universidad)
where not exists (select 1 from public.cursos);
