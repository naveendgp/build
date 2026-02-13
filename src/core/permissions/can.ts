import { Permission } from './permissions'

export function can(
  permissions: Permission[],
  required: Permission
) {
  return permissions.includes(required)
}
