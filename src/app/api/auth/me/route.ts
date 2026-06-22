import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import type { MeResponse } from "@/lib/types"
import { getCurrentUser, mapUserToAuthUser } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)

    const response: MeResponse = {
      user: mapUserToAuthUser(user),
    }

    return NextResponse.json(response)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "获取用户信息失败" },
      { status: 500 }
    )
  }
}
