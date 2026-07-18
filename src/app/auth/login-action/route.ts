import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const email = String(formData.get('email') ?? '')
  const password = String(formData.get('password') ?? '')

  // Use the plain JS client just to authenticate and get the tokens
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  )

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error || !data.session) {
    // Redirect back to login with error
    return NextResponse.redirect(new URL('/login?error=invalid', request.url), 303)
  }

  const { access_token, refresh_token } = data.session

  // Determine role
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', data.user.id)
    .maybeSingle()

  const role = userData?.role ?? 'admin'
  const destination = role === 'client' ? '/my-company' : '/dashboard'

  // Build the redirect response
  const response = NextResponse.redirect(new URL(destination, request.url), 303)

  // Manually set the cookies that @supabase/ssr expects.
  // The SSR package reads these specific cookie names.
  const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL!
    .replace('https://', '')
    .replace('.supabase.co', '')
    .split('.')[0]

  const cookieName = `sb-${projectRef}-auth-token`

  const sessionValue = JSON.stringify({
    access_token,
    refresh_token,
    expires_at: data.session.expires_at,
    expires_in: data.session.expires_in,
    token_type: 'bearer',
    user: data.user,
  })

  // Set as chunked cookies the same way @supabase/ssr does
  const chunkSize = 3180
  const chunks = []
  for (let i = 0; i < sessionValue.length; i += chunkSize) {
    chunks.push(sessionValue.slice(i, i + chunkSize))
  }

  if (chunks.length === 1) {
    response.cookies.set(cookieName, chunks[0], {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
    })
  } else {
    chunks.forEach((chunk, i) => {
      response.cookies.set(`${cookieName}.${i}`, chunk, {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 365,
      })
    })
  }

  // Also set the code verifier cookie cleanup
  response.cookies.delete(`${cookieName}-code-verifier`)

  console.log('Set cookie:', cookieName, 'chunks:', chunks.length)
  console.log('Redirecting to:', destination)

  return response
}