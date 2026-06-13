import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ROLES, canAccessStore } from "@/lib/permissions";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const batch = await prisma.importBatch.findUnique({
      where: { id: params.id },
      include: {
        store: { select: { name: true, id: true } },
        records: {
          orderBy: { id: "asc" },
          take: 100,
        },
        transactions: {
          orderBy: { transactedAt: "desc" },
          take: 50,
          include: { member: { select: { name: true, memberNo: true } } },
        },
        flows: {
          orderBy: { occurredAt: "desc" },
          take: 50,
          include: {
            account: {
              include: { member: { select: { name: true, memberNo: true } } },
            },
          },
        },
      },
    });

    if (!batch) {
      return NextResponse.json({ error: "批次不存在" }, { status: 404 });
    }

    if (batch.storeId && !canAccessStore(user, batch.storeId)) {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }

    return NextResponse.json(batch);
  } catch (e) {
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
