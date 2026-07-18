import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Public routes — always allow through
  const publicPaths = ['/', '/register']
  const publicApiPaths = ['/api/checkout', '/api/webhooks/yoco', '/api/auth/register']
  if (publicPaths.includes(pathname)) return NextResponse.next()
  if (publicApiPaths.includes(pathname)) return NextResponse.next()
  if (pathname.startsWith('/auth')) return NextResponse.next()
  if (pathname.startsWith('/_next') || pathname.includes('.')) return NextResponse.next()

  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          response = NextResponse.next({ request })
          response.cookies.set(name, value, options)
        },
        remove(name: string, options: any) {
          response = NextResponse.next({ request })
          response.cookies.set(name, '', { ...options, maxAge: 0 })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (pathname === '/login') {
    if (!user) return response

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    const destination = userData?.role === 'client' ? '/my-company' : '/dashboard'
    return NextResponse.redirect(new URL(destination, request.url))
  }

  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
