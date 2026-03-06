-- ==========================================
-- PACGYM - Schema completo
-- Ejecuta en Supabase SQL Editor (un solo archivo)
-- ==========================================

-- ─── TABLAS ─────────────────────────────────────────────────────────────────

-- Perfiles de clientes (incluye leads/pending)
CREATE TABLE IF NOT EXISTS clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  trainer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT CHECK (status IN ('pending', 'active', 'inactive')) DEFAULT 'pending',

  nombre TEXT NOT NULL,
  email TEXT NOT NULL,
  telefono TEXT DEFAULT '',
  edad INTEGER NOT NULL,
  peso DECIMAL(5,2) NOT NULL,
  altura INTEGER NOT NULL,
  sexo TEXT CHECK (sexo IN ('hombre', 'mujer', 'otro')) NOT NULL,

  lesiones TEXT DEFAULT '',
  enfermedades TEXT DEFAULT '',
  medicacion TEXT DEFAULT '',

  objetivo TEXT NOT NULL,
  objetivo_detalle TEXT DEFAULT '',
  fecha_objetivo DATE,

  sesiones_semana INTEGER DEFAULT 3,
  minutos_sesion INTEGER DEFAULT 45,
  dias_preferidos TEXT[] DEFAULT '{}',
  horario_preferido TEXT DEFAULT 'mañana',

  lugar TEXT NOT NULL,
  equipamiento TEXT DEFAULT '',
  nivel TEXT NOT NULL,
  deportes_gusta TEXT DEFAULT '',
  deportes_odia TEXT DEFAULT '',

  tipo_trabajo TEXT DEFAULT '',
  horas_sueno INTEGER DEFAULT 7,
  nivel_estres INTEGER DEFAULT 5,

  obstaculos_pasados TEXT DEFAULT '',
  seguimiento_preferido TEXT DEFAULT ''
);

-- Planes de entrenamiento
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
  activo BOOLEAN DEFAULT TRUE,
  plan_config JSONB
);

-- Logs de sesiones
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

-- Stats de gamificación
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

-- Packs de entrenamiento
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

-- Perfiles de usuario (roles)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  role TEXT CHECK (role IN ('admin', 'client')) DEFAULT 'client',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mensajes coach ↔ cliente
CREATE TABLE IF NOT EXISTS coach_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  remitente TEXT CHECK (remitente IN ('coach', 'client')) NOT NULL,
  mensaje TEXT NOT NULL,
  leido BOOLEAN DEFAULT FALSE,
  session_ref_semana INTEGER,
  session_ref_dia TEXT
);

-- Fotos de progreso
CREATE TABLE IF NOT EXISTS progress_photos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  semana INTEGER NOT NULL,
  foto_url TEXT NOT NULL,
  notas TEXT DEFAULT '',
  peso_kg DECIMAL(5,2)
);

-- Push subscriptions (notificaciones)
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  subscription JSONB NOT NULL
);

-- ─── ÍNDICES ────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_clients_user ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_trainer ON clients(trainer_id);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_plans_client ON training_plans(client_id);
CREATE INDEX IF NOT EXISTS idx_logs_client ON session_logs(client_id);
CREATE INDEX IF NOT EXISTS idx_logs_fecha ON session_logs(fecha);
CREATE INDEX IF NOT EXISTS idx_messages_client ON coach_messages(client_id);
CREATE INDEX IF NOT EXISTS idx_photos_client ON progress_photos(client_id);
CREATE INDEX IF NOT EXISTS idx_push_user ON push_subscriptions(user_id);

-- ─── RLS ─────────────────────────────────────────────────────────────────────

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Clients: cliente ve sus datos, trainer ve sus clientes, admin ve leads sin asignar
CREATE POLICY "client_own_data" ON clients FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "trainer_own_clients" ON clients FOR ALL USING (trainer_id = auth.uid());
-- Admin puede ver y asignar leads pendientes (trainer_id null)
CREATE POLICY "admin_see_unassigned_leads" ON clients FOR SELECT USING (
  trainer_id IS NULL AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "admin_assign_lead" ON clients FOR UPDATE USING (
  trainer_id IS NULL AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "public_insert_client" ON clients FOR INSERT WITH CHECK (user_id IS NULL AND status = 'pending');

-- Plans: cliente y trainer ven los planes de sus clientes
CREATE POLICY "client_own_plan" ON training_plans FOR SELECT USING (
  client_id IN (SELECT id FROM clients WHERE user_id = auth.uid() OR trainer_id = auth.uid())
);
CREATE POLICY "trainer_plan_all" ON training_plans FOR ALL USING (
  client_id IN (SELECT id FROM clients WHERE trainer_id = auth.uid())
);

-- Logs: cliente y trainer
CREATE POLICY "client_own_logs" ON session_logs FOR ALL USING (
  client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
);
CREATE POLICY "trainer_own_logs" ON session_logs FOR ALL USING (
  client_id IN (SELECT id FROM clients WHERE trainer_id = auth.uid())
);

-- Stats: solo el usuario
CREATE POLICY "client_own_stats" ON user_stats FOR ALL USING (user_id = auth.uid());

-- Packs
CREATE POLICY "packs_read" ON training_packs FOR SELECT USING (es_publico = TRUE OR creado_por = auth.uid());
CREATE POLICY "packs_write" ON training_packs FOR ALL USING (creado_por = auth.uid());

-- Profiles
CREATE POLICY "own_profile" ON profiles FOR SELECT USING (id = auth.uid());

-- Coach messages: cliente y trainer
CREATE POLICY "msg_coach_all" ON coach_messages FOR ALL USING (
  client_id IN (SELECT id FROM clients WHERE trainer_id = auth.uid())
  OR client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
);

-- Progress photos: cliente y trainer
CREATE POLICY "photos_own" ON progress_photos FOR ALL USING (
  client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
  OR client_id IN (SELECT id FROM clients WHERE trainer_id = auth.uid())
);

-- Push: solo el usuario
CREATE POLICY "push_own" ON push_subscriptions FOR ALL USING (user_id = auth.uid());
