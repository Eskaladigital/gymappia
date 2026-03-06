/**
 * Verifica tablas en Supabase y configura admin contacto@eskaladigital.com
 * Ejecutar: node --env-file=.env.local scripts/verify-supabase.mjs
 */
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  console.error('❌ Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local')
  process.exit(1)
}

const supabase = createClient(url, serviceKey)

const TABLES = [
  'clients', 'training_plans', 'session_logs', 'user_stats',
  'training_packs', 'profiles', 'coach_messages', 'progress_photos', 'push_subscriptions'
]

async function verifyTables() {
  console.log('\n📋 Verificando tablas...\n')
  const missing = []
  for (const table of TABLES) {
    const { error } = await supabase.from(table).select('*').limit(1)
    if (error) {
      missing.push(table)
      console.log(`  ❌ ${table}: ${error.message}`)
    } else {
      console.log(`  ✅ ${table}`)
    }
  }
  return missing
}

async function ensureAdmin(email) {
  console.log(`\n👤 Buscando usuario admin: ${email}\n`)
  const { data: users } = await supabase.auth.admin.listUsers()
  const user = users?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase())
  if (!user) {
    console.log(`  ⚠️  El usuario ${email} no existe en Auth. Debe registrarse primero en la app.`)
    return
  }
  const { data: profile, error: fetchError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()
  if (fetchError && fetchError.code !== 'PGRST116') {
    console.log(`  ❌ Error al leer profile: ${fetchError.message}`)
    return
  }
  if (profile?.role === 'admin') {
    console.log(`  ✅ ${email} ya es admin`)
    return
  }
  const { error: upsertError } = await supabase.from('profiles').upsert(
    { id: user.id, email: user.email, role: 'admin' },
    { onConflict: 'id' }
  )
  if (upsertError) {
    console.log(`  ❌ Error al asignar admin: ${upsertError.message}`)
    return
  }
  console.log(`  ✅ ${email} configurado como admin`)
}

async function main() {
  const missing = await verifyTables()
  await ensureAdmin('contacto@eskaladigital.com')
  if (missing.length > 0) {
    console.log(`\n⚠️  Faltan ${missing.length} tablas. Ejecuta supabase/schema.sql en el SQL Editor de Supabase.\n`)
    process.exit(1)
  }
  console.log('\n✅ Verificación completada.\n')
}

main().catch(console.error)
