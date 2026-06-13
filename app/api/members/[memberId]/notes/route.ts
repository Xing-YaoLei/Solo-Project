import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessStore } from "@/lib/permissions";

export async function GET(
  request: Request,
  { params }: { params: { memberId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const member = await prisma.member.findUnique({
      where: { id: params.memberId },
    });

    if (!member) {
      return NextResponse.json({ error: "会员不存在" }, { status: 404 });
    }

    if (!canAccessStore(user, member.storeId)) {
      return NextResponse.json({ error: "无权限访问" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const benefitId = searchParams.get("benefitId");

    const where: {
      memberId: string;
      benefitId?: string | null;
    } = { memberId: params.memberId };

    if (benefitId) {
      where.benefitId = benefitId;
    } else {
      where.benefitId = null;
    }

    const notes = await prisma.memberNote.findMany({
      where,
      include: {
        staff: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ notes });
  } catch (e) {
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { memberId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const member = await prisma.member.findUnique({
      where: { id: params.memberId },
    });

    if (!member) {
      return NextResponse.json({ error: "会员不存在" }, { status: 404 });
    }

    if (!canAccessStore(user, member.storeId)) {
      return NextResponse.json({ error: "无权限访问" }, { status: 403 });
    }

    let content: string | undefined;
    let benefitId: string | undefined;

    const contentType = request.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      const body = await request.json();
      content = body.content;
      benefitId = body.benefitId;
    } else {
      const formData = await request.formData();
      content = formData.get("content") as string | undefined;
      benefitId = formData.get("benefitId") as string | undefined;
    }

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: "注释内容不能为空" }, { status: 400 });
    }

    const note = await prisma.memberNote.create({
      data: {
        memberId: params.memberId,
        benefitId: benefitId || null,
        staffId: user.id,
        content: content.trim(),
      },
      include: {
        staff: {
          select: { name: true },
        },
      },
    });

    return NextResponse.json({ note });
  } catch (e) {
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
