export const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  OPERATOR: 'operator',
  FINANCE: 'finance',
  EXTERNAL: 'external'
}

export const ROLE_LABELS = {
  [ROLES.ADMIN]: '超级管理员',
  [ROLES.MANAGER]: '运营经理',
  [ROLES.OPERATOR]: '运营人员',
  [ROLES.FINANCE]: '金融专员',
  [ROLES.EXTERNAL]: '外部人员'
}

export const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: ['*'],
  [ROLES.MANAGER]: [
    'dashboard:view',
    'quotation:view',
    'quotation:edit',
    'finance:view',
    'finance:edit',
    'archive:view',
    'archive:edit',
    'share:view',
    'share:create',
    'export:all'
  ],
  [ROLES.OPERATOR]: [
    'dashboard:view',
    'quotation:view',
    'quotation:edit',
    'archive:view',
    'archive:edit',
    'share:view',
    'export:basic'
  ],
  [ROLES.FINANCE]: [
    'dashboard:view',
    'finance:view',
    'finance:edit',
    'quotation:view',
    'export:finance'
  ],
  [ROLES.EXTERNAL]: [
    'dashboard:view:limited',
    'quotation:view:limited'
  ]
}

export const SENSITIVE_FIELDS = ['price', 'customerName', 'customerPhone', 'costPrice', 'profit', 'commission']

export function hasPermission(userRole, permission) {
  if (!userRole) return false
  const permissions = ROLE_PERMISSIONS[userRole] || []
  if (permissions.includes('*')) return true
  if (permissions.includes(permission)) return true
  const basePermission = permission.split(':')[0]
  return permissions.some(p => p.startsWith(basePermission + ':') || p === basePermission)
}

export function canViewField(userRole, fieldName) {
  if (userRole !== ROLES.EXTERNAL) return true
  return !SENSITIVE_FIELDS.includes(fieldName)
}

export function filterSensitiveData(data, userRole) {
  if (userRole !== ROLES.EXTERNAL) return data
  if (Array.isArray(data)) {
    return data.map(item => filterSensitiveData(item, userRole))
  }
  if (data && typeof data === 'object') {
    const filtered = {}
    for (const key of Object.keys(data)) {
      if (!SENSITIVE_FIELDS.includes(key)) {
        filtered[key] = filterSensitiveData(data[key], userRole)
      }
    }
    return filtered
  }
  return data
}

export function canAccessRoute(userRole, routeMeta) {
  if (!routeMeta || !routeMeta.roles) return true
  return routeMeta.roles.includes(userRole)
}
