export const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  OPERATOR: 'operator',
  FINANCE: 'finance',
  EXTERNAL: 'external',
  ASSESSOR: 'assessor',
  SALES: 'sales',
  FINANCE_STAFF: 'finance_staff',
  STORE_MANAGER: 'store_manager'
}

export const BACKEND_ROLE_MAP = {
  admin: 'STORE_MANAGER',
  manager: 'STORE_MANAGER',
  operator: 'SALES',
  finance: 'FINANCE_STAFF',
  assessor: 'ASSESSOR',
  sales: 'SALES',
  finance_staff: 'FINANCE_STAFF',
  store_manager: 'STORE_MANAGER',
  external: 'EXTERNAL'
}

export function toBackendRole(frontendRole) {
  if (!frontendRole) return 'EXTERNAL'
  const mapped = BACKEND_ROLE_MAP[frontendRole.toLowerCase()]
  if (mapped) return mapped
  const upper = frontendRole.toUpperCase()
  if (['ASSESSOR', 'SALES', 'FINANCE_STAFF', 'STORE_MANAGER', 'EXTERNAL'].includes(upper)) return upper
  return 'EXTERNAL'
}

export const ROLE_LABELS = {
  [ROLES.ADMIN]: '超级管理员',
  [ROLES.MANAGER]: '店长',
  [ROLES.OPERATOR]: '运营人员',
  [ROLES.FINANCE]: '金融专员',
  [ROLES.EXTERNAL]: '外部人员',
  [ROLES.ASSESSOR]: '评估师',
  [ROLES.SALES]: '销售',
  [ROLES.FINANCE_STAFF]: '金融专员',
  [ROLES.STORE_MANAGER]: '店长'
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
  [ROLES.STORE_MANAGER]: [
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
  [ROLES.ASSESSOR]: [
    'dashboard:view',
    'quotation:view',
    'quotation:edit',
    'archive:view',
    'archive:edit',
    'share:view',
    'export:basic'
  ],
  [ROLES.SALES]: [
    'dashboard:view',
    'quotation:view',
    'archive:view',
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
  [ROLES.FINANCE_STAFF]: [
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
