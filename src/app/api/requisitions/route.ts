import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, applyProjectFilter, buildWhereClause } from "@/lib/auth";
import { mockRequisitions } from "@/lib/mock-data";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const useMock = searchParams.get("mock") === "true";
    const projectId = searchParams.get("projectId");
    const status = searchParams.get("status");

    if (useMock) {
      let filtered = mockRequisitions;
      if (projectId) filtered = filtered.filter((r) => r.projectId === projectId);
      if (status) filtered = filtered.filter((r) => r.status === status);
      return NextResponse.json(filtered);
    }

    const user = getCurrentUser();
    const where = buildWhereClause(user, {});

    if (status) where.status = status;

    const data = await prisma.requisition.findMany({
      where,
      include: {
        materialEntry: { include: { supplier: true } },
        project: true,
        requester: true,
      },
      orderBy: { requestedAt: "desc" },
    });

    const filteredData = applyProjectFilter(
      data.map((req) => ({
        ...req,
        materialName: req.materialEntry?.materialName,
        category: req.materialEntry?.category,
        projectName: req.project?.name,
        requesterName: req.requester?.name,
        supplierName: req.materialEntry?.supplier?.name,
      })),
      user
    );

    return NextResponse.json(filteredData);
  } catch (error) {
    console.error("获取领用记录失败:", error);
    return NextResponse.json(
      { error: "获取领用记录失败" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const user = getCurrentUser();

    const { materialEntryId, projectId, quantity } = body;

    if (!materialEntryId || !projectId || !quantity) {
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
        { error: "无权限在此项目创建领用记录" },
        { status: 403 }
      );
    }

    const materialEntry = await prisma.materialEntry.findUnique({
      where: { id: materialEntryId },
    });

    if (!materialEntry) {
      return NextResponse.json(
        { error: "材料记录不存在" },
        { status: 404 }
      );
    }

    if (materialEntry.quantity < quantity) {
      return NextResponse.json(
        { error: "库存不足" },
        { status: 400 }
      );
    }

    const requisition = await prisma.$transaction(async (tx) => {
      const req = await tx.requisition.create({
        data: {
          materialEntryId,
          projectId,
          requestedBy: user.userId,
          quantity,
          status: "PENDING",
        },
        include: {
          materialEntry: { include: { supplier: true } },
          project: true,
          requester: true,
        },
      });

      await tx.materialEntry.update({
        where: { id: materialEntryId },
        data: {
          quantity: materialEntry.quantity - quantity,
          status: materialEntry.quantity - quantity > 0 ? "IN_STOCK" : "RECLAIMED",
        },
      });

      return req;
    });

    return NextResponse.json({
      ...requisition,
      materialName: requisition.materialEntry?.materialName,
      category: requisition.materialEntry?.category,
      projectName: requisition.project?.name,
      requesterName: requisition.requester?.name,
      supplierName: requisition.materialEntry?.supplier?.name,
    });
  } catch (error) {
    console.error("创建领用记录失败:", error);
    return NextResponse.json(
      { error: "创建领用记录失败" },
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
        { error: "缺少领用记录ID" },
        { status: 400 }
      );
    }

    const existing = await prisma.requisition.findUnique({
      where: { id },
      include: { project: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "领用记录不存在" },
        { status: 404 }
      );
    }

    if (
      user.role !== "ADMIN" &&
      !user.projectIds.includes(existing.projectId || "")
    ) {
      return NextResponse.json(
        { error: "无权限修改此领用记录" },
        { status: 403 }
      );
    }

    const { status } = body;

    const requisition = await prisma.requisition.update({
      where: { id },
      data: { status },
      include: {
        materialEntry: { include: { supplier: true } },
        project: true,
        requester: true,
      },
    });

    return NextResponse.json({
      ...requisition,
      materialName: requisition.materialEntry?.materialName,
      category: requisition.materialEntry?.category,
      projectName: requisition.project?.name,
      requesterName: requisition.requester?.name,
      supplierName: requisition.materialEntry?.supplier?.name,
    });
  } catch (error) {
    console.error("更新领用记录失败:", error);
    return NextResponse.json(
      { error: "更新领用记录失败" },
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
        { error: "缺少领用记录ID" },
        { status: 400 }
      );
    }

    if (user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "无权限删除领用记录" },
        { status: 403 }
      );
    }

    const existing = await prisma.requisition.findUnique({
      where: { id },
      include: { materialEntry: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "领用记录不存在" },
        { status: 404 }
      );
    }

    await prisma.$transaction(async (tx) => {
      if (existing.materialEntry) {
        await tx.materialEntry.update({
          where: { id: existing.materialEntryId },
          data: {
            quantity: existing.materialEntry.quantity + existing.quantity,
            status: "IN_STOCK",
          },
        });
      }

      await tx.requisition.delete({ where: { id } });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("删除领用记录失败:", error);
    return NextResponse.json(
      { error: "删除领用记录失败" },
      { status: 500 }
    );
  }
}
