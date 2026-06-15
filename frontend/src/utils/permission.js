import { useUserStore } from '@/stores/user'

export function hasRole(role) {
  const userStore = useUserStore()
  if (Array.isArray(role)) {
    return role.includes(userStore.role)
  }
  return userStore.role === role
}

export function hasAnyRole(roles) {
  const userStore = useUserStore()
  return roles.includes(userStore.role)
}

export function isAdmin() {
  return hasRole('ADMIN')
}

export function isReceptionist() {
  return hasRole('RECEPTIONIST')
}
