import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  const contentType = request.headers.get('content-type') || ''
  let email: string
  let password: string
  let redirectTo: string

  if (contentType.includes('application/json')) {
    const body = await request.json().catch(() => ({}))
    email = body.email || ''
    password = body.password || ''
    redirectTo = body.redirect || '/mi-plan'
  } else {
    const formData = await request.formData()
    email = (formData.get('email') as string) || ''
    password = (formData.get('password') as string) || ''
    redirectTo = (formData.get('redirect') as string) || '/mi-plan'
  }

  if (!email || !password) {
    return NextResponse.json({ error: 'Email y contraseña son obligatorios' }, { status: 400 })
  }

  const isJson = contentType.includes('application/json')
  let finalRedirect = redirectTo
  const response = isJson
    ? NextResponse.json({ redirect: redirectTo })
    : NextResponse.redirect(new URL(redirectTo, request.url))

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options?: Record<string, unknown>) {
          response.cookies.set(name, value, (options || {}) as object)
        },
        remove(name: string, options?: Record<string, unknown>) {
          response.cookies.set(name, '', { ...options, maxAge: 0 } as object)
        },
      },
    }
  )

  const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    if (isJson) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('error', 'auth')
    loginUrl.searchParams.set('msg', error.message)
    loginUrl.searchParams.set('redirect', redirectTo)
    return NextResponse.redirect(loginUrl)
  }

  await supabase.auth.getSession()

  if (authData.user) {
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', authData.user.id)
      .single()
    if (profile?.role === 'admin' && redirectTo.startsWith('/admin')) {
      finalRedirect = '/admin'
    } else if (!redirectTo.startsWith('/admin')) {
      finalRedirect = redirectTo
    } else {
      finalRedirect = '/mi-plan'
    }
  }

  if (isJson) {
    const res = NextResponse.json({ redirect: finalRedirect })
    for (const c of response.cookies.getAll()) {
      res.cookies.set(c.name, c.value, { path: '/', sameSite: 'lax' })
    }
    return res
  }
  response.headers.set('Location', new URL(finalRedirect, request.url).toString())
  return response
}
