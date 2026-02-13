import { NextRequest, NextResponse } from 'next/server'

const PUBLIC_PATHS = ['/login', '/forbidden']
const PUBLIC_API_PATHS = ['/api/auth/login', '/api/auth/logout']

export function middleware(req: NextRequest) {
    // DEV ONLY: skip all auth checks
    if (process.env.DEV_BYPASS_AUTH === 'true') {
        return NextResponse.next()
    }

    const { pathname } = req.nextUrl
    const token = req.cookies.get('admin_session')?.value

    const isPublicPage = PUBLIC_PATHS.some(
        (p) => pathname === p || pathname.startsWith(`${p}/`)
    )
    const isPublicApi = PUBLIC_API_PATHS.some((p) => pathname === p)
    const isPublic = isPublicPage || isPublicApi

    // --- Security headers on every response ---
    const addSecurityHeaders = (res: NextResponse) => {
        res.headers.set('X-Content-Type-Options', 'nosniff')
        res.headers.set('X-Frame-Options', 'DENY')
        res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
        res.headers.set(
            'Strict-Transport-Security',
            'max-age=63072000; includeSubDomains; preload'
        )
        res.headers.set(
            'Permissions-Policy',
            'camera=(), microphone=(), geolocation=()'
        )
        return res
    }

    // Public routes → allow without token
    if (isPublic) {
        // Authenticated user on login page → redirect to dashboard
        if (token && pathname === '/login') {
            return addSecurityHeaders(
                NextResponse.redirect(new URL('/', req.url))
            )
        }
        return addSecurityHeaders(NextResponse.next())
    }

    // Everything below requires a token
    if (!token) {
        // API routes → 401 JSON (not a redirect)
        if (pathname.startsWith('/api/')) {
            return addSecurityHeaders(
                NextResponse.json(
                    { message: 'Unauthenticated' },
                    { status: 401 }
                )
            )
        }
        // Page routes → redirect to login
        return addSecurityHeaders(
            NextResponse.redirect(new URL('/login', req.url))
        )
    }

    return addSecurityHeaders(NextResponse.next())
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
