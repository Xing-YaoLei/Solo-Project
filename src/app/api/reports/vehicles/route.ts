import { NextResponse } from "next/server";
import { getVehicleRecords } from "@/lib/mockData";
import { maskSensitiveData } from "@/utils/format";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");
    const role = searchParams.get("role") || "director";

    const data = await getVehicleRecords(page, pageSize);

    if (role === "external") {
      return NextResponse.json(
        { error: "无权限访问" },
        { status: 403 }
      );
    }

    const maskedData = data.data.map((vehicle) => {
      if (role === "technician") {
        return {
          ...vehicle,
          ownerName: maskSensitiveData(vehicle.ownerName, "name"),
          parts: [],
        };
      }
      if (role !== "director" && role !== "parts") {
        return {
          ...vehicle,
          ownerName: maskSensitiveData(vehicle.ownerName, "name"),
        };
      }
      return vehicle;
    });

    return NextResponse.json({
      ...data,
      data: maskedData,
    });
  } catch (error) {
    console.error("Vehicles API error:", error);
    return NextResponse.json(
      { error: "获取数据失败" },
      { status: 500 }
    );
  }
}
