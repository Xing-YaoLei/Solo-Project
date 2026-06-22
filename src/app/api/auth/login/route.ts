import { NextRequest, NextResponse } from "next/server"
import { nanoid } from "nanoid"
import { prisma } from "@/lib/prisma"
import type { LoginRequest, LoginResponse } from "@/lib/types"

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as LoginRequest

    if (!body.email || !body.password) {
      return NextResponse.json({ error: "邮箱和密码不能为空" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email: body.email },
    })

    if (!user) {
      return NextResponse.json({ error: "用户名或密码错误" }, { status: 401 })
    }

    const token = nanoid(64)

    const response: LoginResponse = {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        department: user.department ?? undefined,
      },
      token,
    }

    return NextResponse.json(response)
  } catch (error) {
    return NextResponse.json({ error: "登录失败" }, { status: 500 })
  }
}
