import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const body = await request.json();
    const user = getCurrentUser();

    if (!id) {
      return NextResponse.json(
        { error: "缺少材料记录ID" },
        { status: 400 }
      );
    }

    const existing = await prisma.materialEntry.findUnique({
      where: { id },
      include: { batch: { include: { project: true } } },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "材料记录不存在" },
        { status: 404 }
      );
    }

    if (
      user.role !== "ADMIN" &&
      !user.projectIds.includes(existing.batch?.projectId || "")
    ) {
      return NextResponse.json(
        { error: "无权限修改此记录" },
        { status: 403 }
      );
    }

    const { shortageNote } = body;

    if (shortageNote === undefined || shortageNote === null) {
      return NextResponse.json(
        { error: "缺少短缺注释内容" },
        { status: 400 }
      );
    }

    const entry = await prisma.materialEntry.update({
      where: { id },
      data: {
        shortageNote,
        shortageNoteBy: user.userId,
        shortageNoteAt: new Date(),
      },
      include: {
        batch: { include: { project: true } },
        supplier: true,
      },
    });

    if (shortageNote) {
      await prisma.batch.update({
        where: { id: entry.batchId },
        data: { status: "SHORTAGE" },
      });
    }

    return NextResponse.json({
      ...entry,
      supplierName: entry.supplier?.name,
      projectName: entry.batch?.project?.name,
    });
  } catch (error) {
    console.error("添加短缺注释失败:", error);
    return NextResponse.json(
      { error: "添加短缺注释失败" },
      { status: 500 }
    );
  }
}
