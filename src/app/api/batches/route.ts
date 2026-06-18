import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, applyProjectFilter, buildWhereClause } from "@/lib/auth";
import { mockBatches } from "@/lib/mock-data";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const useMock = searchParams.get("mock") === "true";
    const status = searchParams.get("status");
    const projectId = searchParams.get("projectId");

    if (useMock) {
      let filtered = mockBatches;
      if (status) filtered = filtered.filter((b) => b.status === status);
      if (projectId) filtered = filtered.filter((b) => b.projectId === projectId);
      return NextResponse.json(filtered);
    }

    const user = getCurrentUser();
    const where = buildWhereClause(user, {});

    if (status) where.status = status;
    if (projectId) where.projectId = projectId;

    const data = await prisma.batch.findMany({
      where,
      include: {
        project: true,
        importBatch: true,
        materialEntries: { include: { supplier: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const filteredData = applyProjectFilter(
      data.map((batch) => ({
        ...batch,
        projectName: batch.project?.name,
      })),
      user
    );

    return NextResponse.json(filteredData);
  } catch (error) {
    console.error("获取批次列表失败:", error);
    return NextResponse.json(
      { error: "获取批次列表失败" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const user = getCurrentUser();

    const {
      batchNo,
      importSource,
      importBatchId,
      projectId,
      status,
      notes,
    } = body;

    if (!importBatchId || !projectId) {
      return NextResponse.json(
        { error: "缺少必要参数" },
        { status: 400 }
      );
    }

    if (
      user.role !== "ADMIN" &&
      !user.projectIds.includes(projectId)
    ) {
      return NextResponse.json(
        { error: "无权限在此项目创建批次" },
        { status: 403 }
      );
    }

    const batch = await prisma.batch.create({
      data: {
        batchNo: batchNo || `BATCH-${Date.now()}`,
        importSource: importSource || "MANUAL",
        importBatchId,
        projectId,
        status: status || "COMPLETE",
        notes,
      },
      include: { project: true },
    });

    return NextResponse.json({
      ...batch,
      projectName: batch.project?.name,
    });
  } catch (error) {
    console.error("创建批次失败:", error);
    return NextResponse.json(
      { error: "创建批次失败" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const body = await request.json();
    const user = getCurrentUser();

    if (!id) {
      return NextResponse.json(
        { error: "缺少批次ID" },
        { status: 400 }
      );
    }

    const existing = await prisma.batch.findUnique({
      where: { id },
      include: { project: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "批次不存在" },
        { status: 404 }
      );
    }

    if (
      user.role !== "ADMIN" &&
      !user.projectIds.includes(existing.projectId || "")
    ) {
      return NextResponse.json(
        { error: "无权限修改此批次" },
        { status: 403 }
      );
    }

    const { status, notes } = body;
    const updateData: Record<string, unknown> = {};
    if (status !== undefined) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;

    const batch = await prisma.batch.update({
      where: { id },
      data: updateData,
      include: { project: true },
    });

    return NextResponse.json({
      ...batch,
      projectName: batch.project?.name,
    });
  } catch (error) {
    console.error("更新批次失败:", error);
    return NextResponse.json(
      { error: "更新批次失败" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const user = getCurrentUser();

    if (!id) {
      return NextResponse.json(
        { error: "缺少批次ID" },
        { status: 400 }
      );
    }

    if (user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "无权限删除批次" },
        { status: 403 }
      );
    }

    await prisma.$transaction([
      prisma.materialEntry.deleteMany({ where: { batchId: id } }),
      prisma.batch.delete({ where: { id } }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("删除批次失败:", error);
    return NextResponse.json(
      { error: "删除批次失败" },
      { status: 500 }
    );
  }
}
