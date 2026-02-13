'use client'

import { usePermissions } from '@/core/permissions/PermissionContext'
import { Permission } from '@/core/permissions/permissions'

export function PermissionGate({
    permission,
    children,
}: {
    permission: Permission
    children: React.ReactNode
}) {
    const permissions = usePermissions()

    if (!permissions.includes(permission)) {
        return null
    }

    return <>{children}</>
}
