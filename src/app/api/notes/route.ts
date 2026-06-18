import { NextResponse } from "next/server";
import { getNotes, addNote } from "@/lib/dataService";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  return NextResponse.json({
    items: await getNotes({
      siteId: searchParams.get("siteId") || undefined,
      stockDiffId: searchParams.get("stockDiffId") || undefined,
    }),
  });
}

export async function POST(request: Request) {
  const body = await request.json();
  if (!body.content || !body.siteId) {
    return NextResponse.json({ error: "content and siteId required" }, { status: 400 });
  }
  const note = await addNote({
    content: body.content,
    author: body.author || "当前用户",
    siteId: body.siteId,
    stockDiffId: body.stockDiffId || null,
  });
  return NextResponse.json({ note });
}
