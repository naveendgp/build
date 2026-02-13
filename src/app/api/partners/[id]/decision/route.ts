import { NextRequest, NextResponse } from 'next/server'
import { requirePermission } from '@/core/auth/requirePermission'
import { httpClient } from '@/core/api/httpClient'

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const result = await requirePermission('PARTNER_WRITE')
    if (!result.ok) return result.response

    const { id } = await params

    let body: { decision?: 'APPROVE' | 'REJECT'; reason?: string }

    try {
        body = await req.json()
    } catch {
        return NextResponse.json(
            { message: 'Invalid request body' },
            { status: 400 }
        )
    }

    if (
        !body.decision ||
        !['APPROVE', 'REJECT'].includes(body.decision) ||
        !body.reason?.trim()
    ) {
        return NextResponse.json(
            { message: 'Decision and reason are required' },
            { status: 400 }
        )
    }

    if (process.env.DEV_BYPASS_AUTH === 'true') {
        return NextResponse.json({ success: true })
    }

    await httpClient(`/partners/${id}/decision`, {
        method: 'POST',
        body: {
            decision: body.decision,
            reason: body.reason.trim(),
        },
    })

    return NextResponse.json({ success: true })
}
