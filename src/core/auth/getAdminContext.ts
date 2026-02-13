import { httpClient } from '@/core/api/httpClient'
import { Permission } from '@/core/permissions/permissions'

export interface AdminContext {
    id: string
    email: string
    permissions: Permission[]
}

export async function getAdminContext(): Promise<AdminContext | null> {
    // DEV ONLY: return mock admin with all permissions
    if (process.env.DEV_BYPASS_AUTH === 'true') {
        return {
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
        }
    }

    try {
        return await httpClient<AdminContext>('/admin/me')
    } catch {
        return null
    }
}
