import { NextResponse } from "next/server";
import { generateDataDifferences } from "@/lib/mockData";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    const differences = generateDataDifferences(limit);
    const totalDiffAmount = differences.reduce(
      (sum, d) => sum + Math.abs(d.diffAmount ?? 0),
      0
    );

    return NextResponse.json({
      success: true,
      data: {
        list: differences,
        stats: {
          totalCount: differences.length,
          affectedOrders: new Set(differences.map((d) => d.orderId)).size,
          totalDiffAmount: parseFloat(totalDiffAmount.toFixed(2)),
        },
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "获取差异数据失败",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
