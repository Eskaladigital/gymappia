-- ==========================================
-- PACGYM - Push subscriptions
-- Ejecuta en Supabase SQL Editor
-- ==========================================

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subscription JSONB NOT NULL,
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_push_user ON push_subscriptions(user_id);
