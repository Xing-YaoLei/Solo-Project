import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { mockSuppliers } from "@/lib/mock-data";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const useMock = searchParams.get("mock") === "true";

    if (useMock) {
      return NextResponse.json(mockSuppliers);
    }

    const user = getCurrentUser();

    const suppliers = await prisma.supplier.findMany({
      include: {
        materialEntries: {
          include: { batch: { include: { project: true } } },
        },
      },
    });

    const enriched = suppliers.map((s) => {
      const entries = s.materialEntries;
      const totalDeliveries = entries.length;

      const onTimeCount = entries.filter((e) => e.status !== "EXPIRED").length;
      const shortageCount = entries.filter((e) => e.shortageNote !== null).length;

      return {
        id: s.id,
        name: s.name,
        contactPerson: s.contactPerson,
        phone: s.phone,
        onTimeRate: totalDeliveries > 0 ? onTimeCount / totalDeliveries : 0,
        shortageRate: totalDeliveries > 0 ? shortageCount / totalDeliveries : 0,
        qualityScore: s.qualityScore,
        totalDeliveries,
      };
    });

    return NextResponse.json(enriched);
  } catch (error) {
    console.error("获取供应商列表失败:", error);
    return NextResponse.json(
      { error: "获取供应商列表失败" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const user = getCurrentUser();

    if (user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "无权限创建供应商" },
        { status: 403 }
      );
    }

    const { name, contactPerson, phone } = body;

    if (!name) {
      return NextResponse.json(
        { error: "供应商名称不能为空" },
        { status: 400 }
      );
    }

    const supplier = await prisma.supplier.create({
      data: {
        name,
        contactPerson,
        phone,
      },
    });

    return NextResponse.json(supplier);
  } catch (error) {
    console.error("创建供应商失败:", error);
    return NextResponse.json(
      { error: "创建供应商失败" },
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
        { error: "缺少供应商ID" },
        { status: 400 }
      );
    }

    if (user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "无权限修改供应商" },
        { status: 403 }
      );
    }

    const existing = await prisma.supplier.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json(
        { error: "供应商不存在" },
        { status: 404 }
      );
    }

    const { name, contactPerson, phone, onTimeRate, shortageRate, qualityScore } = body;
    const updateData: Record<string, unknown> = {};

    if (name !== undefined) updateData.name = name;
    if (contactPerson !== undefined) updateData.contactPerson = contactPerson;
    if (phone !== undefined) updateData.phone = phone;
    if (onTimeRate !== undefined) updateData.onTimeRate = onTimeRate;
    if (shortageRate !== undefined) updateData.shortageRate = shortageRate;
    if (qualityScore !== undefined) updateData.qualityScore = qualityScore;

    const supplier = await prisma.supplier.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(supplier);
  } catch (error) {
    console.error("更新供应商失败:", error);
    return NextResponse.json(
      { error: "更新供应商失败" },
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
        { error: "缺少供应商ID" },
        { status: 400 }
      );
    }

    if (user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "无权限删除供应商" },
        { status: 403 }
      );
    }

    await prisma.supplier.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("删除供应商失败:", error);
    return NextResponse.json(
      { error: "删除供应商失败" },
      { status: 500 }
    );
  }
}
