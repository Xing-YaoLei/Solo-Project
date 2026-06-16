import { NextRequest, NextResponse } from "next/server";
import { addAnnotation } from "@/lib/mock-data";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { content, prescriptionId, createdById } = await request.json();

    if (!content?.trim()) {
      return NextResponse.json(
        { error: "注释内容不能为空" },
        { status: 400 }
      );
    }

    if (!createdById) {
      return NextResponse.json(
        { error: "缺少创建人信息" },
        { status: 400 }
      );
    }

    const annotation = addAnnotation(params.id, prescriptionId, content.trim(), createdById);
    return NextResponse.json(annotation, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "添加注释失败" },
      { status: 500 }
    );
  }
}
