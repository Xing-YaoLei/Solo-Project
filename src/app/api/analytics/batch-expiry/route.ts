import { NextResponse } from "next/server";
import { getBatchExpiryData } from "@/lib/mock-data";

export async function GET() {
  try {
    const data = getBatchExpiryData();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "获取批号效期数据失败" },
      { status: 500 }
    );
  }
}
