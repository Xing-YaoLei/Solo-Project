import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, applyProjectFilter, buildWhereClause } from "@/lib/auth";
import { mockMaterialEntries } from "@/lib/mock-data";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");
    const category = searchParams.get("category");
    const status = searchParams.get("status");
    const useMock = searchParams.get("mock") === "true";

    if (useMock) {
      let filtered = mockMaterialEntries;
      if (category) filtered = filtered.filter((e) => e.category === category);
      if (status) filtered = filtered.filter((e) => e.status === status);

      const total = filtered.length;
      const data = filtered.slice((page - 1) * pageSize, page * pageSize);

      return NextResponse.json({ data, total, page, pageSize });
    }

    const user = getCurrentUser();
    const where = buildWhereClause(user);

    if (category) where.category = category;
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      prisma.materialEntry.findMany({
        where,
        include: {
          batch: { include: { project: true } },
          supplier: true,
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { entryDate: "desc" },
      }),
      prisma.materialEntry.count({ where }),
    ]);

    const filteredData = applyProjectFilter(
      data.map((entry) => ({
        ...entry,
        projectId: entry.batch?.projectId,
        supplierName: entry.supplier?.name,
        projectName: entry.batch?.project?.name,
      })),
      user
    );

    return NextResponse.json({ data: filteredData, total, page, pageSize });
  } catch (error) {
    console.error("获取材料列表失败:", error);
    return NextResponse.json(
      { error: "获取材料列表失败" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const user = getCurrentUser();

    const {
      batchId,
      materialName,
      category,
      specification,
      quantity,
      unit,
      supplierId,
      entryDate,
      expiryDate,
    } = body;

    if (!batchId || !materialName || !quantity || !supplierId) {
      return NextResponse.json(
        { error: "缺少必要参数" },
        { status: 400 }
      );
    }

    const entry = await prisma.materialEntry.create({
      data: {
        batchId,
        materialName,
        category: category || "其他",
        specification,
        quantity,
        unit: unit || "件",
        supplierId,
        entryDate: entryDate ? new Date(entryDate) : new Date(),
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        status: "ARRIVED",
      },
      include: {
        batch: { include: { project: true } },
        supplier: true,
      },
    });

    return NextResponse.json({
      ...entry,
      supplierName: entry.supplier?.name,
      projectName: entry.batch?.project?.name,
    });
  } catch (error) {
    console.error("创建材料记录失败:", error);
    return NextResponse.json(
      { error: "创建材料记录失败" },
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
        { error: "缺少记录ID" },
        { status: 400 }
      );
    }

    const existing = await prisma.materialEntry.findUnique({
      where: { id },
      include: { batch: { include: { project: true } } },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "记录不存在" },
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

    const {
      materialName,
      category,
      specification,
      quantity,
      unit,
      supplierId,
      status,
      expiryDate,
      shortageNote,
    } = body;

    const updateData: Record<string, unknown> = {};
    if (materialName !== undefined) updateData.materialName = materialName;
    if (category !== undefined) updateData.category = category;
    if (specification !== undefined) updateData.specification = specification;
    if (quantity !== undefined) updateData.quantity = quantity;
    if (unit !== undefined) updateData.unit = unit;
    if (supplierId !== undefined) updateData.supplierId = supplierId;
    if (status !== undefined) updateData.status = status;
    if (expiryDate !== undefined)
      updateData.expiryDate = expiryDate ? new Date(expiryDate) : null;
    if (shortageNote !== undefined) {
      updateData.shortageNote = shortageNote;
      updateData.shortageNoteBy = user.userId;
      updateData.shortageNoteAt = new Date();
    }

    const entry = await prisma.materialEntry.update({
      where: { id },
      data: updateData,
      include: {
        batch: { include: { project: true } },
        supplier: true,
      },
    });

    return NextResponse.json({
      ...entry,
      supplierName: entry.supplier?.name,
      projectName: entry.batch?.project?.name,
    });
  } catch (error) {
    console.error("更新材料记录失败:", error);
    return NextResponse.json(
      { error: "更新材料记录失败" },
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
        { error: "缺少记录ID" },
        { status: 400 }
      );
    }

    if (user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "无权限删除记录" },
        { status: 403 }
      );
    }

    await prisma.materialEntry.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("删除材料记录失败:", error);
    return NextResponse.json(
      { error: "删除材料记录失败" },
      { status: 500 }
    );
  }
}
