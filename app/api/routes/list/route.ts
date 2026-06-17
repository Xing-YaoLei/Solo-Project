import { NextResponse } from "next/server";
import { generateRoutePlans } from "@/lib/mockData";

export async function GET() {
  try {
    const routes = generateRoutePlans(12);

    const delayedRoutes = routes.filter((r) => r.status === "delayed");
    const avgDelayMinutes =
      delayedRoutes.length > 0
        ? Math.round(
            delayedRoutes.reduce((sum, r) => sum + (r.delayMinutes ?? 0), 0) /
              delayedRoutes.length
          )
        : 0;

    return NextResponse.json({
      success: true,
      data: {
        list: routes,
        stats: {
          totalRoutes: routes.length,
          completedRoutes: routes.filter((r) => r.status === "completed").length,
          delayedRoutes: delayedRoutes.length,
          avgDelayMinutes,
        },
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "获取路线列表失败",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
