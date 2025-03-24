import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Get the token from the request
  const token = request.headers.get('Authorization')?.split(' ')[1]
  const accessToken = request.cookies.get('access_token')?.value

  // Allow public routes
  if (
    request.nextUrl.pathname.startsWith('/api/auth') ||
    request.nextUrl.pathname.startsWith('/login') ||
    request.nextUrl.pathname.startsWith('/register') ||
    request.nextUrl.pathname.startsWith('/api/planning-center/callback') ||
    request.nextUrl.pathname.startsWith('/api/planning-center/auth')
  ) {
    return NextResponse.next()
  }

  // Handle Planning Center API routes (excluding auth and callback)
  if (
    request.nextUrl.pathname.startsWith('/api/planning-center/') &&
    !request.nextUrl.pathname.startsWith('/api/planning-center/auth') &&
    !request.nextUrl.pathname.startsWith('/api/planning-center/callback')
  ) {
    if (!accessToken) {
      return NextResponse.redirect(new URL('/api/planning-center/auth', request.url))
    }

    // Clone the request headers and add the Planning Center token
    const requestHeaders = new Headers(request.headers)

    requestHeaders.set('Authorization', `Bearer ${accessToken}`)

    // Create a new request with the updated headers
    const newRequest = new Request(request.url, {
      method: request.method,
      headers: requestHeaders,
      body: request.body
    })

    return NextResponse.next({
      request: newRequest
    })
  }

  // Protect other API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Clone the request headers and add the JWT token
    const requestHeaders = new Headers(request.headers)

    requestHeaders.set('Authorization', `Bearer ${token}`)

    // Create a new request with the updated headers
    const newRequest = new Request(request.url, {
      method: request.method,
      headers: requestHeaders,
      body: request.body
    })

    return NextResponse.next({
      request: newRequest
    })
  }

  // Protect page routes
  if (request.nextUrl.pathname.startsWith('/dashboard/')) {
    if (!token) {
      const loginUrl = new URL('/login', request.url)

      loginUrl.searchParams.set('callbackUrl', request.url)

      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/api/:path*', '/dashboard/:path*']
}
