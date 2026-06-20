import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import type { AlertSeverity, AlertType } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const severity = searchParams.get("severity") as AlertSeverity | null;
    const alertType = searchParams.get("alertType") as AlertType | null;
    const isResolved = searchParams.get("isResolved");
    const scenicAreaId = searchParams.get("scenicAreaId");

    const alerts = await prisma.riskAlert.findMany({
      where: {
        ...(severity ? { severity } : {}),
        ...(alertType ? { alertType } : {}),
        ...(isResolved !== null ? { isResolved: isResolved === "true" } : {}),
        ...(scenicAreaId ? { scenicAreaId } : {}),
      },
      include: {
        route: { select: { id: true, name: true } },
        reviewMaterials: true,
      },
      orderBy: { detectedAt: "desc" },
    });

    return NextResponse.json(alerts);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch alerts" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Alert id is required" },
        { status: 400 }
      );
    }

    const existing = await prisma.riskAlert.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Alert not found" }, { status: 404 });
    }

    const alert = await prisma.riskAlert.update({
      where: { id },
      data: {
        isResolved: true,
        resolvedAt: new Date(),
      },
    });

    return NextResponse.json(alert);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to resolve alert" },
      { status: 500 }
    );
  }
}
