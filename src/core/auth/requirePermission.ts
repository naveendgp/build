import { NextResponse } from 'next/server'
import { Permission } from '@/core/permissions/permissions'
import { httpClient, HttpClientError } from '@/core/api/httpClient'

interface AdminWithPermissions {
    id: string
    email: string
    permissions: Permission[]
}

type RequirePermissionResult =
    | { ok: true; admin: AdminWithPermissions }
    | { ok: false; response: NextResponse }

export async function requirePermission(
    permission: Permission
): Promise<RequirePermissionResult> {
    // DEV ONLY: grant all permissions
    if (process.env.DEV_BYPASS_AUTH === 'true') {
        return {
            ok: true,
            admin: {
                id: 'dev-admin',
                email: 'dev@admin.local',
                permissions: [
                    'ORDER_READ',
                    'ORDER_CANCEL',
                    'USER_READ',
                    'USER_WRITE',
                    'PARTNER_READ',
                    'PARTNER_WRITE',
                    'PAYMENT_READ',
                    'ADMIN_MANAGE',
                ],
            },
        }
    }

    try {
        const admin = await httpClient<AdminWithPermissions>('/admin/me')

        if (!admin.permissions.includes(permission)) {
            return {
                ok: false,
                response: NextResponse.json(
                    { message: 'Forbidden' },
                    { status: 403 }
                ),
            }
        }

        return { ok: true, admin }
    } catch (err) {
        const status = err instanceof HttpClientError ? err.status : 500

        return {
            ok: false,
            response: NextResponse.json(
                {
                    message:
                        status === 401
                            ? 'Unauthenticated'
                            : 'Internal server error',
                },
                { status }
            ),
        }
    }
}
