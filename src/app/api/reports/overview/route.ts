import { NextResponse } from "next/server";
import { getOverviewData } from "@/lib/mockData";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role") || "director";

    const data = await getOverviewData();

    if (role === "external") {
      return NextResponse.json(
        { error: "无权限访问" },
        { status: 403 }
      );
    }

    if (role !== "director") {
      return NextResponse.json({
        ...data,
        stationUtilization: data.stationUtilization,
      });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Overview API error:", error);
    return NextResponse.json(
      { error: "获取数据失败" },
      { status: 500 }
    );
  }
}
