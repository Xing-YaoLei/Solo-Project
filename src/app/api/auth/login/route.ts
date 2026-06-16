import { NextRequest, NextResponse } from "next/server";
import { authenticateUser } from "@/lib/mock-data";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "邮箱和密码不能为空" },
        { status: 400 }
      );
    }

    const user = authenticateUser(email, password);
    if (!user) {
      return NextResponse.json(
        { error: "账号或密码错误" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      user,
      token: "mock-jwt-token-" + Date.now(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: "服务器内部错误" },
      { status: 500 }
    );
  }
}
