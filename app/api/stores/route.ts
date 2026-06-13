import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAccessibleStoreIds } from "@/lib/permissions";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    type StoreInfo = { id: string; name: string; code: string; address: string | null };
    const allStores: StoreInfo[] = await prisma.store.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, code: true, address: true },
    });

    const accessibleStoreIds = getAccessibleStoreIds(
      user,
      allStores.map((s: StoreInfo) => s.id)
    );

    const stores = allStores.filter((s: StoreInfo) =>
      accessibleStoreIds.includes(s.id)
    );

    return NextResponse.json(stores);
  } catch (e) {
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
