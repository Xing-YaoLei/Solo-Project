import { useUserStore } from '@/stores/user'

export default {
  mounted(el, binding) {
    const userStore = useUserStore()
    const requiredRoles = binding.value
    if (!requiredRoles) return

    const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles]
    const hasPermission = roles.some(role => userStore.role === role)

    if (!hasPermission) {
      el.parentNode?.removeChild(el)
    }
  }
}
