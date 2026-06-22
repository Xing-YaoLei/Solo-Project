import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import type { MeResponse } from "@/lib/types"

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization")
    if (!authHeader) {
      return NextResponse.json({ error: "未提供认证信息" }, { status: 401 })
    }

    const userId = request.headers.get("x-user-id")

    let user
    if (userId) {
      user = await prisma.user.findUnique({ where: { id: userId } })
    }

    if (!user) {
      user = await prisma.user.findFirst()
    }

    if (!user) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 })
    }

    const response: MeResponse = {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        department: user.department ?? undefined,
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    return NextResponse.json({ error: "获取用户信息失败" }, { status: 500 })
  }
}
