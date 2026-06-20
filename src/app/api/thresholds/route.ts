import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const scenicAreaId = searchParams.get("scenicAreaId");

    if (!scenicAreaId) {
      return NextResponse.json(
        { error: "scenicAreaId query parameter is required" },
        { status: 400 }
      );
    }

    const thresholds = await prisma.thresholdConfig.findMany({
      where: { scenicAreaId },
      orderBy: { metricType: "asc" },
    });

    return NextResponse.json(thresholds);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch thresholds" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      scenicAreaId,
      metricType,
      metricName,
      warnValue,
      criticalValue,
      unit,
      updatedBy,
    } = body;

    if (
      !scenicAreaId ||
      !metricType ||
      !metricName ||
      warnValue == null ||
      criticalValue == null ||
      !unit ||
      !updatedBy
    ) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    const threshold = await prisma.thresholdConfig.create({
      data: {
        scenicAreaId,
        metricType,
        metricName,
        warnValue,
        criticalValue,
        unit,
        updatedBy,
      },
    });

    return NextResponse.json(threshold, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to create threshold" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, metricType, metricName, warnValue, criticalValue, unit, updatedBy } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Threshold id is required" },
        { status: 400 }
      );
    }

    const existing = await prisma.thresholdConfig.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Threshold not found" },
        { status: 404 }
      );
    }

    const threshold = await prisma.thresholdConfig.update({
      where: { id },
      data: {
        ...(metricType !== undefined && { metricType }),
        ...(metricName !== undefined && { metricName }),
        ...(warnValue !== undefined && { warnValue }),
        ...(criticalValue !== undefined && { criticalValue }),
        ...(unit !== undefined && { unit }),
        ...(updatedBy !== undefined && { updatedBy }),
      },
    });

    return NextResponse.json(threshold);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to update threshold" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Threshold id is required" },
        { status: 400 }
      );
    }

    const existing = await prisma.thresholdConfig.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Threshold not found" },
        { status: 404 }
      );
    }

    await prisma.thresholdConfig.delete({ where: { id } });

    return NextResponse.json({ message: "Threshold deleted" });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to delete threshold" },
      { status: 500 }
    );
  }
}
