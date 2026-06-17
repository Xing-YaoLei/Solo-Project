export const prisma = {
  _mock: true,
  dispatchOrder: {
    findMany: async () => [],
    count: async () => 0,
  },
  routePlan: {
    findMany: async () => [],
  },
} as unknown;

export type PrismaClient = typeof prisma;
