-- ==========================================
-- PACGYM - Supabase Schema v2
-- Ejecuta en Supabase SQL Editor
-- ==========================================

-- Tabla de perfiles de clientes (incluye leads/pending)
CREATE TABLE IF NOT EXISTS clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,  -- null hasta que se registra
  status TEXT CHECK (status IN ('pending', 'active', 'inactive')) DEFAULT 'pending',

  -- Datos personales
  nombre TEXT NOT NULL,
  email TEXT NOT NULL,
  telefono TEXT DEFAULT '',
  edad INTEGER NOT NULL,
  peso DECIMAL(5,2) NOT NULL,
  altura INTEGER NOT NULL,
  sexo TEXT CHECK (sexo IN ('hombre', 'mujer', 'otro')) NOT NULL,

  -- Salud
  lesiones TEXT DEFAULT '',
  enfermedades TEXT DEFAULT '',
  medicacion TEXT DEFAULT '',

  -- Objetivo
  objetivo TEXT NOT NULL,
  objetivo_detalle TEXT DEFAULT '',
  fecha_objetivo DATE,

  -- Disponibilidad
  sesiones_semana INTEGER DEFAULT 3,
  minutos_sesion INTEGER DEFAULT 45,
  dias_preferidos TEXT[] DEFAULT '{}',
  horario_preferido TEXT DEFAULT 'mañana',

  -- Entrenamiento
  lugar TEXT NOT NULL,
  equipamiento TEXT DEFAULT '',
  nivel TEXT NOT NULL,
  deportes_gusta TEXT DEFAULT '',
  deportes_odia TEXT DEFAULT '',

  -- Estilo de vida
  tipo_trabajo TEXT DEFAULT '',
  horas_sueno INTEGER DEFAULT 7,
  nivel_estres INTEGER DEFAULT 5,

  -- Motivación
  obstaculos_pasados TEXT DEFAULT '',
  seguimiento_preferido TEXT DEFAULT ''
);

-- Tabla de planes
CREATE TABLE IF NOT EXISTS training_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  titulo TEXT NOT NULL,
  descripcion TEXT DEFAULT '',
  duracion_semanas INTEGER DEFAULT 4,
  semanas JSONB NOT NULL DEFAULT '[]',
  recomendaciones_nutricionales TEXT DEFAULT '',
  notas_entrenador TEXT DEFAULT '',
  activo BOOLEAN DEFAULT TRUE
);

-- Tabla de logs de sesiones
CREATE TABLE IF NOT EXISTS session_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES training_plans(id) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  semana INTEGER NOT NULL,
  dia_nombre TEXT NOT NULL,
  completado BOOLEAN DEFAULT FALSE,
  sensacion INTEGER CHECK (sensacion BETWEEN 1 AND 5),
  notas_cliente TEXT DEFAULT '',
  puntos_ganados INTEGER DEFAULT 0
);

-- Tabla de stats de gamificación
CREATE TABLE IF NOT EXISTS user_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  puntos_totales INTEGER DEFAULT 0,
  racha_actual INTEGER DEFAULT 0,
  racha_maxima INTEGER DEFAULT 0,
  sesiones_completadas INTEGER DEFAULT 0,
  ultimo_entreno DATE,
  logros TEXT[] DEFAULT '{}'
);

-- Tabla de packs personalizados de entrenamiento
CREATE TABLE IF NOT EXISTS training_packs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  creado_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  nombre TEXT NOT NULL,
  descripcion TEXT DEFAULT '',
  icono TEXT DEFAULT '⚙️',
  color TEXT DEFAULT '#64748b',
  tags TEXT[] DEFAULT '{}',
  modules JSONB NOT NULL DEFAULT '[]',
  session JSONB NOT NULL DEFAULT '{}',
  es_publico BOOLEAN DEFAULT TRUE
);

ALTER TABLE training_packs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "packs_read" ON training_packs FOR SELECT USING (es_publico = TRUE OR creado_por = auth.uid());
CREATE POLICY "packs_write" ON training_packs FOR ALL USING (creado_por = auth.uid());

-- Añadir columna plan_config a training_plans para guardar la config usada
ALTER TABLE training_plans ADD COLUMN IF NOT EXISTS plan_config JSONB;

-- Tabla de perfiles de usuario (roles)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  role TEXT CHECK (role IN ('admin', 'client')) DEFAULT 'client',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_profile" ON profiles FOR SELECT USING (id = auth.uid());

-- Índices
CREATE INDEX IF NOT EXISTS idx_clients_user ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_plans_client ON training_plans(client_id);
CREATE INDEX IF NOT EXISTS idx_logs_client ON session_logs(client_id);
CREATE INDEX IF NOT EXISTS idx_logs_fecha ON session_logs(fecha);

-- RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

-- Admin: acceso total (usa service_role desde API routes)
-- Cliente: solo ve sus propios datos
CREATE POLICY "client_own_data" ON clients
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "client_own_plan" ON training_plans
  FOR SELECT USING (
    client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
  );

CREATE POLICY "client_own_logs" ON session_logs
  FOR ALL USING (
    client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
  );

CREATE POLICY "client_own_stats" ON user_stats
  FOR ALL USING (user_id = auth.uid());

-- Permitir insertar desde el formulario público (sin auth)
CREATE POLICY "public_insert_client" ON clients
  FOR INSERT WITH CHECK (user_id IS NULL AND status = 'pending');
