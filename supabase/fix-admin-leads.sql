-- Ejecuta en Supabase SQL Editor si ya tienes el schema aplicado
-- Permite que los admins vean los leads pendientes (trainer_id null)

DROP POLICY IF EXISTS "admin_see_unassigned_leads" ON clients;
DROP POLICY IF EXISTS "admin_assign_lead" ON clients;

CREATE POLICY "admin_see_unassigned_leads" ON clients FOR SELECT USING (
  trainer_id IS NULL AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "admin_assign_lead" ON clients FOR UPDATE USING (
  trainer_id IS NULL AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
