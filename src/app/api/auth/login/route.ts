import { NextRequest, NextResponse } from 'next/server'
import { httpClientAnonymous, HttpClientError } from '@/core/api/httpClient'

export async function POST(req: NextRequest) {
    // --- Input validation ---
    let body: { email?: string; password?: string }
    try {
        body = await req.json()
    } catch {
        return NextResponse.json(
            { message: 'Invalid request body' },
            { status: 400 }
        )
    }

    if (
        !body.email ||
        typeof body.email !== 'string' ||
        !body.password ||
        typeof body.password !== 'string'
    ) {
        return NextResponse.json(
            { message: 'Email and password are required' },
            { status: 400 }
        )
    }

    // --- Forward to NestJS via anonymous client ---
    try {
        const data = await httpClientAnonymous<{ accessToken: string }>(
            '/auth/login',
            {
                method: 'POST',
                body: {
                    email: body.email.trim().toLowerCase(),
                    password: body.password,
                },
            }
        )

        const response = NextResponse.json({ success: true })

        response.cookies.set('admin_session', data.accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/',
            maxAge: 60 * 60 * 8, // 8 hours
        })

        return response
    } catch (err) {
        if (err instanceof HttpClientError && err.status === 401) {
            return NextResponse.json(
                { message: 'Invalid credentials' },
                { status: 401 }
            )
        }

        return NextResponse.json(
            { message: 'Authentication service unavailable' },
            { status: 503 }
        )
    }
}
