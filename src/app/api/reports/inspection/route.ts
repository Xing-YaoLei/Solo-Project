import { NextResponse } from "next/server";
import { getInspectionDataFromDB } from "@/lib/dbService";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role") || "director";

    const data = await getInspectionDataFromDB();

    if (role === "external" || role === "parts") {
      return NextResponse.json(
        { error: "无权限访问" },
        { status: 403 }
      );
    }

    if (role === "advisor") {
      return NextResponse.json({
        summary: data.summary,
        issues: [],
        lastUpdated: data.lastUpdated,
      });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Inspection API error:", error);
    return NextResponse.json(
      { error: "获取数据失败" },
      { status: 500 }
    );
  }
}
