import { prisma } from './prisma'
import type { User, UserRole } from '@prisma/client'
import type { AuthUser } from './types'

export async function getCurrentUser(request: Request): Promise<User> {
  const userId = request.headers.get('x-user-id')

  if (userId) {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (user) return user
  }

  const user = await prisma.user.findFirst()
  if (!user) {
    throw new Error('未找到用户，请先创建用户或登录')
  }

  return user
}

export async function getCurrentUserId(request: Request): Promise<string> {
  const user = await getCurrentUser(request)
  return user.id
}

export function mapUserToAuthUser(user: User): AuthUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as UserRole,
    department: user.department ?? undefined,
  }
}

export function hasPermission(
  userRole: UserRole,
  allowedRoles: UserRole[]
): boolean {
  return allowedRoles.includes(userRole)
}
