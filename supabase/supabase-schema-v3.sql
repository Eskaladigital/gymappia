-- ==========================================
-- PACGYM - Schema adicional v3
-- Ejecuta en Supabase SQL Editor
-- ==========================================

-- Mensajes coach → cliente (y viceversa)
CREATE TABLE IF NOT EXISTS coach_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  remitente TEXT CHECK (remitente IN ('coach', 'client')) NOT NULL,
  mensaje TEXT NOT NULL,
  leido BOOLEAN DEFAULT FALSE,
  -- Puede ir vinculado a una sesión específica (opcional)
  session_ref_semana INTEGER,
  session_ref_dia TEXT
);

ALTER TABLE coach_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "msg_coach_all" ON coach_messages FOR ALL
  USING (
    client_id IN (SELECT id FROM clients WHERE trainer_id = auth.uid())
    OR client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
  );

-- Fotos de progreso semanal
CREATE TABLE IF NOT EXISTS progress_photos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  semana INTEGER NOT NULL,
  foto_url TEXT NOT NULL,
  notas TEXT DEFAULT '',
  peso_kg DECIMAL(5,2)
);

ALTER TABLE progress_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "photos_own" ON progress_photos FOR ALL
  USING (
    client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
    OR client_id IN (SELECT id FROM clients WHERE trainer_id = auth.uid())
  );

-- Índices
CREATE INDEX IF NOT EXISTS idx_messages_client ON coach_messages(client_id);
CREATE INDEX IF NOT EXISTS idx_photos_client ON progress_photos(client_id);

-- Storage: crear bucket 'progress-photos' en Supabase Dashboard > Storage
-- Política: permitir upload con service_role (API usa service_role)
