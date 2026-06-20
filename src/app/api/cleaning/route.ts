import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cleanAndValidate } from "@/lib/data-cleaning";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, scenicAreaId } = body as {
      type: "order" | "transaction" | "caliber";
      scenicAreaId: string;
    };

    if (!type || !scenicAreaId) {
      return NextResponse.json(
        { error: "type and scenicAreaId are required" },
        { status: 400 }
      );
    }

    if (!["order", "transaction", "caliber"].includes(type)) {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    const [orders, transactions, cameraStats] = await Promise.all([
      prisma.miniProgramOrder.findMany({ where: { scenicAreaId } }),
      prisma.merchantTransaction.findMany({ where: { scenicAreaId } }),
      prisma.cameraStatistic.findMany({ where: { scenicAreaId } }),
    ]);

    const result = cleanAndValidate(
      { orders, transactions, cameraStats },
      type
    );

    return NextResponse.json({
      type,
      originalCount: result.originalCount,
      cleanedCount: result.cleanedCount,
      data: result.data,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to clean data" },
      { status: 500 }
    );
  }
}
