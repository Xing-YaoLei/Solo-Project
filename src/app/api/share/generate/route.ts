import { NextResponse } from "next/server";
import { generateShareLink } from "@/lib/mockData";
import { z } from "zod";

const shareSchema = z.object({
  role: z.enum(["director", "advisor", "technician", "parts", "external"]),
  expiresIn: z.number().optional(),
  scope: z.array(z.string()).optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = shareSchema.parse(body);

    const result = await generateShareLink(
      validated.role,
      validated.expiresIn,
      validated.scope
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Share generate API error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "参数验证失败", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "生成分享链接失败" },
      { status: 500 }
    );
  }
}
