import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ROLES, getAccessibleStoreIds } from "@/lib/permissions";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const queryStoreId = searchParams.get("storeId");

    type StoreIdOnly = { id: string };
    const allStores: StoreIdOnly[] = await prisma.store.findMany({ select: { id: true } });
    const accessibleStoreIds = getAccessibleStoreIds(user, allStores.map((s: StoreIdOnly) => s.id));

    let where: { storeId?: string | { in: string[] } } = {
      storeId: { in: accessibleStoreIds },
    };

    if (queryStoreId) {
      if (user.role !== ROLES.MANAGER && !accessibleStoreIds.includes(queryStoreId)) {
        return NextResponse.json({ error: "无权限访问该门店" }, { status: 403 });
      }
      where.storeId = queryStoreId;
    }

    const batches = await prisma.importBatch.findMany({
      where,
      include: {
        store: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(batches);
  } catch (e) {
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
