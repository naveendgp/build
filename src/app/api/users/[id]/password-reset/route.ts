import { NextRequest, NextResponse } from 'next/server'
import { requirePermission } from '@/core/auth/requirePermission'
import { httpClient } from '@/core/api/httpClient'

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const result = await requirePermission('USER_WRITE')
    if (!result.ok) return result.response

    const { id } = await params

    let body: { reason?: string }

    try {
        body = await req.json()
    } catch {
        return NextResponse.json(
            { message: 'Invalid request body' },
            { status: 400 }
        )
    }

    if (!body.reason || body.reason.trim().length < 3) {
        return NextResponse.json(
            { message: 'Reason is required' },
            { status: 400 }
        )
    }

    await httpClient(`/users/${id}/password-reset`, {
        method: 'POST',
        body: { reason: body.reason.trim() },
    })

    return NextResponse.json({ success: true })
}
