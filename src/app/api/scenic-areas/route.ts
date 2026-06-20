import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const scenicAreas = await prisma.scenicArea.findMany({
      select: {
        id: true,
        name: true,
        location: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(scenicAreas);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch scenic areas" },
      { status: 500 }
    );
  }
}
