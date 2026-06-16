import { NextResponse } from "next/server";
import { getMemberFunnel } from "@/lib/mock-data";

export async function GET() {
  try {
    const data = getMemberFunnel();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "获取会员漏斗数据失败" },
      { status: 500 }
    );
  }
}
