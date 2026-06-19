import { NextResponse } from "next/server";
import { getQuotationTrend } from "@/lib/mockData";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const period = (searchParams.get("period") as "day" | "week" | "month") || "day";
    const role = searchParams.get("role") || "director";

    const data = await getQuotationTrend(period);

    if (role === "external" || role === "parts") {
      return NextResponse.json(
        { error: "无权限访问" },
        { status: 403 }
      );
    }

    if (role === "technician") {
      return NextResponse.json({
        ...data,
        data: data.data.map((item) => ({
          ...item,
          totalAmount: 0,
          avgAmount: 0,
        })),
      });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Quotation trend API error:", error);
    return NextResponse.json(
      { error: "获取数据失败" },
      { status: 500 }
    );
  }
}
