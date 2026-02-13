'use client'

import { createContext, useContext } from 'react'
import { Permission } from './permissions'

const PermissionContext = createContext<Permission[]>([])

export function PermissionProvider({
  permissions,
  children,
}: {
  permissions: Permission[]
  children: React.ReactNode
}) {
  return (
    <PermissionContext.Provider value={permissions}>
      {children}
    </PermissionContext.Provider>
  )
}

export function usePermissions() {
  return useContext(PermissionContext)
}
