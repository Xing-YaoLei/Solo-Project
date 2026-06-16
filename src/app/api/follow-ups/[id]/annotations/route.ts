import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth-guard";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const role = request.headers.get("x-user-role") as any;
  const userId = request.headers.get("x-user-id");

  const check = requireRole(role, ["admin", "manager", "staff"]);
  if (!check.allowed) {
    return NextResponse.json({ error: check.error }, { status: check.status });
  }

  try {
    const { content, prescriptionId } = await request.json();
    if (!content?.trim()) {
      return NextResponse.json(
        { error: "注释内容不能为空" },
        { status: 400 }
      );
    }

    const { getFollowUpDetail, addAnnotation, users } = require("@/lib/data-store");
    const detail = getFollowUpDetail(params.id);
    if (!detail) {
      return NextResponse.json({ error: "回访记录不存在" }, { status: 404 });
    }
    if (role === "staff" && detail.followUp.assigneeId !== userId) {
      return NextResponse.json(
        { error: "无权为他人负责的回访添加注释" },
        { status: 403 }
      );
    }

    const createdByName =
      (users as any[]).find((u: any) => u.id === userId)?.name || "未知";
    const annotation = addAnnotation(
      params.id,
      prescriptionId,
      content.trim(),
      userId,
      createdByName
    );
    return NextResponse.json(annotation, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "添加注释失败" },
      { status: 500 }
    );
  }
}
