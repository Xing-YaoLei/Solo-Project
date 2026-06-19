import { NextResponse } from "next/server";
import { getDiagnosisData } from "@/lib/mockData";
import { maskSensitiveData } from "@/utils/format";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role") || "director";

    const data = await getDiagnosisData();

    if (role === "external" || role === "parts") {
      return NextResponse.json(
        { error: "无权限访问" },
        { status: 403 }
      );
    }

    const maskedItems = data.abnormalItems.map((item) => {
      if (role !== "director" && role !== "technician") {
        return {
          ...item,
          vehiclePlate: maskSensitiveData(item.vehiclePlate, "plate"),
        };
      }
      return item;
    });

    return NextResponse.json({
      ...data,
      abnormalItems: maskedItems,
    });
  } catch (error) {
    console.error("Diagnosis API error:", error);
    return NextResponse.json(
      { error: "获取数据失败" },
      { status: 500 }
    );
  }
}
