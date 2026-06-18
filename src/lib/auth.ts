import { prisma } from "./prisma";

export interface UserContext {
  userId: string;
  role: "ADMIN" | "STAFF";
  projectIds: string[];
}

export async function getUserContext(userId: string): Promise<UserContext> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { projects: true },
  });

  if (!user) {
    throw new Error("用户不存在");
  }

  return {
    userId: user.id,
    role: user.role as "ADMIN" | "STAFF",
    projectIds: user.projects.map((p) => p.id),
  };
}

export function applyProjectFilter<T extends { projectId?: string; batch?: { projectId?: string } }>(
  data: T[],
  userContext: UserContext
): T[] {
  if (userContext.role === "ADMIN") {
    return data;
  }

  return data.filter((item) => {
    const projectId = item.projectId || item.batch?.projectId;
    return projectId && userContext.projectIds.includes(projectId);
  });
}

export function buildWhereClause(
  userContext: UserContext,
  additionalWhere: Record<string, unknown> = {}
): Record<string, unknown> {
  if (userContext.role === "ADMIN") {
    return additionalWhere;
  }

  return {
    ...additionalWhere,
    OR: [
      { projectId: { in: userContext.projectIds } },
      { batch: { projectId: { in: userContext.projectIds } } },
    ],
  };
}

export function getCurrentUser(): UserContext {
  const mockUser: UserContext = {
    userId: "u-1",
    role: "ADMIN",
    projectIds: ["p-1", "p-2", "p-3", "p-4"],
  };

  return mockUser;
}

export function setCurrentUserRole(role: "ADMIN" | "STAFF"): UserContext {
  if (role === "ADMIN") {
    return {
      userId: "u-1",
      role: "ADMIN",
      projectIds: ["p-1", "p-2", "p-3", "p-4"],
    };
  } else {
    return {
      userId: "u-2",
      role: "STAFF",
      projectIds: ["p-1", "p-2"],
    };
  }
}
