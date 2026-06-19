import { NextResponse } from "next/server";
import { validateShareTokenInDB } from "@/lib/dbService";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { error: "缺少 token 参数" },
        { status: 400 }
      );
    }

    const result = await validateShareTokenInDB(token);

    if (!result.valid) {
      return NextResponse.json(
        { error: "分享链接无效或已过期" },
        { status: 404 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Share validate API error:", error);
    return NextResponse.json(
      { error: "验证失败" },
      { status: 500 }
    );
  }
}
