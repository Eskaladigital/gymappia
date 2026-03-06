/**
 * LOGIN TESTER - Prueba el flujo de login y arregla errores hasta que funcione
 * Ejecutar: node --env-file=.env.local scripts/login-tester.mjs
 *
 * Requiere servidor corriendo: npm run dev (en otra terminal)
 * Para prueba E2E con navegador: node --env-file=.env.local scripts/login-tester.mjs --e2e
 */

import { createClient } from '@supabase/supabase-js'

const ADMIN_EMAIL = 'contacto@eskaladigital.com'
const ADMIN_PASSWORD = 'Eskala2016@'
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000'

const log = (step, msg, data = null) => {
  const ts = new Date().toISOString().slice(11, 23)
  console.log(`[${ts}] [${step}] ${msg}`)
  if (data !== null) console.log(JSON.stringify(data, null, 2))
}

async function testSupabaseAuth() {
  log('AUTH', '=== PASO 1: Verificar credenciales Supabase Auth (anon key) ===')
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    log('AUTH', '❌ Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY')
    return { ok: false, error: 'Missing env' }
  }

  const supabaseAnon = createClient(url, anonKey)
  log('AUTH', 'Cliente Supabase (anon) creado')

  const { data, error } = await supabaseAnon.auth.signInWithPassword({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  })

  if (error) {
    log('AUTH', '❌ signInWithPassword falló', { error: error.message, code: error.code })
    return { ok: false, error: error.message }
  }

  log('AUTH', '✅ signInWithPassword OK', {
    userId: data.user?.id,
    email: data.user?.email,
    hasSession: !!data.session,
  })
  return { ok: true, user: data.user, session: data.session }
}

async function ensureAdminProfile() {
  log('PROFILE', '=== PASO 2: Verificar/crear perfil admin en tabla profiles ===')
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    log('PROFILE', '❌ Faltan credenciales')
    return { ok: false }
  }

  const supabaseAdmin = createClient(url, serviceKey)

  const { data: users } = await supabaseAdmin.auth.admin.listUsers()
  const user = users?.users?.find(u => u.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase())

  if (!user) {
    log('PROFILE', '❌ Usuario no existe en Auth. Crea el usuario en Supabase Dashboard o regístrate en la app.')
    return { ok: false }
  }

  log('PROFILE', 'Usuario encontrado en Auth', { id: user.id, email: user.email })

  const { data: profile, error: fetchError } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (fetchError && fetchError.code !== 'PGRST116') {
    log('PROFILE', '❌ Error al leer profile', fetchError)
    return { ok: false }
  }

  if (profile?.role === 'admin') {
    log('PROFILE', '✅ Perfil admin ya existe')
    return { ok: true }
  }

  log('PROFILE', 'Creando/actualizando perfil como admin...')
  const { error: upsertError } = await supabaseAdmin.from('profiles').upsert(
    { id: user.id, email: user.email, role: 'admin' },
    { onConflict: 'id' }
  )

  if (upsertError) {
    log('PROFILE', '❌ Error al crear profile', upsertError)
    return { ok: false }
  }

  log('PROFILE', '✅ Perfil admin creado/actualizado')
  return { ok: true }
}

async function getBaseUrl() {
  if (process.env.TEST_BASE_URL) return process.env.TEST_BASE_URL
  for (const port of [3000, 3001, 3002]) {
    try {
      const r = await fetch(`http://localhost:${port}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'x', password: 'x' }),
        signal: AbortSignal.timeout(3000)
      })
      if (r.status !== 404) return `http://localhost:${port}`
    } catch {}
  }
  return 'http://localhost:3000'
}

async function testApiLogin() {
  const url = await getBaseUrl()
  log('API', `=== PASO 3: Probar API /api/auth/login (${url}) ===`)
  try {
    const res = await fetch(`${url}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        redirect: '/admin',
      }),
      redirect: 'manual',
    })

    log('API', `Respuesta: ${res.status} ${res.statusText}`)
    const setCookie = res.headers.get('set-cookie')
    if (setCookie) {
      log('API', 'Cookies Set-Cookie recibidas:', setCookie.split(',').length + ' cookies')
    } else {
      log('API', '⚠️ No se recibieron Set-Cookie en la respuesta')
    }

    if (res.status === 200) {
      const data = await res.json().catch(() => ({}))
      log('API', '✅ API login OK', data)
      return { ok: true }
    }

    if (res.status === 401) {
      const data = await res.json().catch(() => ({}))
      log('API', '❌ API login rechazado', data)
      return { ok: false }
    }

    log('API', 'Respuesta inesperada', { status: res.status })
    return { ok: false }
  } catch (err) {
    log('API', '❌ Error de conexión - ¿Está el servidor corriendo? (npm run dev)', err.message)
    return { ok: false }
  }
}

async function testE2E() {
  const url = await getBaseUrl()
  log('E2E', `=== PASO 4: Prueba E2E en navegador (${url}) ===`)
  try {
    const { chromium } = await import('playwright')
    const browser = await chromium.launch({ headless: true })
    const context = await browser.newContext()
    const page = await context.newPage()

    const consoleLogs = []
    page.on('console', msg => {
      const text = msg.text()
      const type = msg.type()
      consoleLogs.push({ type, text })
      if (type === 'error' || text.toLowerCase().includes('error') || text.includes('failed')) {
        log('E2E-CONSOLE', `[${type}] ${text}`)
      }
    })

    page.on('pageerror', err => log('E2E-PAGEERROR', err.message))

    log('E2E', 'Navegando a /auth/login...')
    await page.goto(`${url}/auth/login?redirect=/admin`, { waitUntil: 'domcontentloaded', timeout: 15000 })

    log('E2E', 'Esperando formulario...')
    await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 10000 })

    log('E2E', 'Rellenando credenciales...')
    await page.fill('input[type="email"], input[name="email"]', ADMIN_EMAIL)
    await page.fill('input[type="password"], input[name="password"]', ADMIN_PASSWORD)

    log('E2E', 'Enviando formulario...')
    await page.click('button[type="submit"]')

    log('E2E', 'Esperando redirección (máx 10s)...')
    try {
      await page.waitForURL(url => url.pathname !== '/auth/login', { timeout: 10000 })
    } catch {
      log('E2E', '⚠️ No hubo redirección en 10s')
    }

    const finalUrl = page.url()
    const currentPath = new URL(finalUrl).pathname

    log('E2E', `URL final: ${finalUrl}`)

    if (currentPath.startsWith('/admin')) {
      log('E2E', '✅ ÉXITO: Redirigido a /admin')
      await browser.close()
      return { ok: true }
    }

    if (currentPath.startsWith('/mi-plan')) {
      log('E2E', '⚠️ Redirigido a /mi-plan en vez de /admin (¿perfil no es admin?)')
      await browser.close()
      return { ok: false, reason: 'wrong_redirect' }
    }

    if (currentPath.startsWith('/auth/login')) {
      const errorEl = await page.$('[class*="red-500"], [class*="red-400"]')
      const errorText = errorEl ? await errorEl.textContent() : ''
      const buttonText = await page.$eval('button[type="submit"]', b => b.textContent).catch(() => '')
      log('E2E', '❌ Sigue en login')
      log('E2E', '  - Error visible:', errorText || 'ninguno')
      log('E2E', '  - Botón:', buttonText)
      if (consoleLogs.filter(c => c.type === 'error').length) {
        log('E2E', '  - Errores consola:', consoleLogs.filter(c => c.type === 'error').map(c => c.text))
      }
      await browser.close()
      return { ok: false }
    }

    log('E2E', 'URL inesperada:', currentPath)
    await browser.close()
    return { ok: false }
  } catch (err) {
    if (err.message?.includes('Cannot find module')) {
      log('E2E', '⚠️ Playwright no instalado. Ejecuta: npx playwright install chromium')
      return { ok: false, skip: true }
    }
    log('E2E', '❌ Error', err.message)
    return { ok: false }
  }
}

async function main() {
  console.log('\n' + '='.repeat(60))
  console.log('  LOGIN TESTER - PACGYM')
  console.log('  Credenciales: ' + ADMIN_EMAIL)
  console.log('  Base URL: ' + BASE_URL)
  console.log('='.repeat(60) + '\n')

  const useE2E = process.argv.includes('--e2e')
  const maxRetries = useE2E ? 3 : 1

  // 1. Auth directo
  const authResult = await testSupabaseAuth()
  if (!authResult.ok) {
    console.log('\n❌ Las credenciales no funcionan en Supabase Auth.')
    console.log('   Verifica que el usuario exista y la contraseña sea correcta.\n')
    process.exit(1)
  }

  // 2. Perfil admin (arregla si falta)
  let profileResult = await ensureAdminProfile()
  if (!profileResult.ok) {
    console.log('\n❌ No se pudo asegurar el perfil admin.\n')
    process.exit(1)
  }

  // 3. API (solo si servidor corre)
  await testApiLogin()

  // 4. E2E con reintentos - arregla y reintenta hasta que funcione
  if (useE2E) {
    for (let intento = 1; intento <= maxRetries; intento++) {
      log('E2E', `--- Intento ${intento}/${maxRetries} ---`)
      const e2eResult = await testE2E()

      if (e2eResult.ok) {
        console.log('\n✅ LOGIN E2E OK - El flujo funciona correctamente.\n')
        process.exit(0)
      }

      if (e2eResult.skip) break

      // Re-asegurar perfil por si acaso
      if (e2eResult.reason === 'wrong_redirect') {
        log('E2E', 'Re-verificando perfil admin...')
        await ensureAdminProfile()
      }

      if (intento < maxRetries) {
        log('E2E', 'Esperando 2s antes de reintentar...')
        await new Promise(r => setTimeout(r, 2000))
      }
    }
    console.log('\n❌ E2E falló tras ' + maxRetries + ' intentos. Revisa el log.\n')
    process.exit(1)
  } else {
    console.log('\n💡 Para prueba E2E en navegador:')
    console.log('   1. Ejecuta "npm run dev" en otra terminal')
    console.log('   2. Ejecuta: npm run test:login:e2e')
    console.log('')
  }

  console.log('\n✅ Tests básicos completados. Auth y perfil OK.\n')
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
