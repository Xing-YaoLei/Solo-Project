import { NextResponse } from "next/server";
import { generateLoadingItems } from "@/lib/mockData";

export async function GET() {
  try {
    const items = generateLoadingItems(25);

    return NextResponse.json({
      success: true,
      data: {
        list: items,
        stats: {
          totalItems: items.length,
          normalItems: items.filter((i) => i.status === "normal").length,
          abnormalItems: items.filter((i) => i.status === "abnormal").length,
          missingItems: items.filter((i) => i.status === "missing").length,
        },
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "获取装载清单失败",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
