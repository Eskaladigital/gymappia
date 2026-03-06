import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  // Rutas públicas: no requieren auth
  if (request.nextUrl.pathname.startsWith('/auth/') ||
      request.nextUrl.pathname === '/admin/auth' ||
      request.nextUrl.pathname === '/' ||
      request.nextUrl.pathname.startsWith('/start') ||
      request.nextUrl.pathname.startsWith('/onboarding') ||
      request.nextUrl.pathname.startsWith('/clientes/')) {
    return response
  }

  // Rutas protegidas: /admin y /mi-plan — todos entran por /auth/login
  const isProtected = request.nextUrl.pathname.startsWith('/admin') ||
    request.nextUrl.pathname.startsWith('/mi-plan')
  if (!isProtected) return response

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options?: Record<string, unknown>) {
            response.cookies.set(name, value, options as object)
          },
          remove(name: string, options?: Record<string, unknown>) {
            response.cookies.set(name, '', { ...options, maxAge: 0 } as object)
          },
        },
      }
    )

    await supabase.auth.getSession()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      const loginUrl = new URL('/auth/login', request.url)
      loginUrl.searchParams.set('redirect', request.nextUrl.pathname)
      return NextResponse.redirect(loginUrl)
    }

    if (request.nextUrl.pathname.startsWith('/admin')) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile?.role !== 'admin') {
        return NextResponse.redirect(new URL('/mi-plan', request.url))
      }
    }

    return response
  } catch {
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icons|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
