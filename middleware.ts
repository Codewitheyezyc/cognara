import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Protect all admin panel routes
  if (pathname.startsWith('/admin-panel')) {
    if (pathname !== '/admin-panel/login' && !pathname.startsWith('/admin-panel/login')) {
      // Check for admin session token
      const adminToken = request.cookies.get('cognara_admin_session')

      if (!adminToken) {
        // Not logged in as admin -> Redirect to admin login
        const url = request.nextUrl.clone()
        url.pathname = '/admin-panel/login'
        // Preserve redirect destination if helpful
        url.searchParams.set('redirectTo', pathname)
        return NextResponse.redirect(url)
      }
    }
    return NextResponse.next()
  }

  // Fallback to normal user session middleware for all other routes
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images/media assets
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
