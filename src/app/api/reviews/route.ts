import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const performanceId = searchParams.get("performanceId");
    const alertId = searchParams.get("alertId");

    const reviews = await prisma.reviewMaterial.findMany({
      where: {
        ...(performanceId ? { performanceId } : {}),
        ...(alertId ? { alertId } : {}),
      },
      include: {
        alert: { select: { id: true, title: true, severity: true, alertType: true } },
        performance: { select: { id: true, title: true, status: true, cancelReason: true } },
      },
      orderBy: { generatedAt: "desc" },
    });

    return NextResponse.json(reviews);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch review materials" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { performanceId } = body as { performanceId: string };

    if (!performanceId) {
      return NextResponse.json(
        { error: "performanceId is required" },
        { status: 400 }
      );
    }

    const performance = await prisma.performance.findUnique({
      where: { id: performanceId },
      include: {
        stop: {
          include: {
            merchantTransactions: {
              orderBy: { transactionTime: "desc" },
              take: 100,
            },
          },
        },
        scenicArea: { select: { id: true, name: true } },
      },
    });

    if (!performance) {
      return NextResponse.json(
        { error: "Performance not found" },
        { status: 404 }
      );
    }

    if (performance.status !== "CANCELLED") {
      return NextResponse.json(
        { error: "Performance is not cancelled" },
        { status: 400 }
      );
    }

    const existingReview = await prisma.reviewMaterial.findFirst({
      where: { performanceId },
    });

    if (existingReview) {
      return NextResponse.json(
        { error: "Review material already exists for this performance" },
        { status: 409 }
      );
    }

    const transactions = performance.stop.merchantTransactions;
    const totalTransactionAmount = transactions.reduce(
      (sum: number, tx: typeof transactions[number]) => sum + tx.amount,
      0
    );

    const unsoldSeats = performance.totalSeats - performance.soldSeats;

    const secondaryConsumptionRate =
      performance.soldSeats > 0
        ? totalTransactionAmount / performance.soldSeats
        : 0;

    const cancelledVisitorImpact = unsoldSeats;
    const revenueImpactAmount = secondaryConsumptionRate * unsoldSeats;

    const linkedAlert = await prisma.riskAlert.findFirst({
      where: {
        scenicAreaId: performance.scenicAreaId,
        alertType: "CANCELLATION",
        isResolved: false,
      },
      orderBy: { detectedAt: "desc" },
    });

    const review = await prisma.reviewMaterial.create({
      data: {
        scenicAreaId: performance.scenicAreaId,
        alertId: linkedAlert?.id ?? null,
        performanceId: performance.id,
        title: `Cancellation Review: ${performance.title}`,
        content: `Performance "${performance.title}" was cancelled. Reason: ${performance.cancelReason ?? "N/A"}. This review analyses the impact on secondary consumption and visitor experience.`,
        secondaryConsumptionRate,
        visitorImpact: `${cancelledVisitorImpact} visitors affected by cancellation (unsold: ${unsoldSeats}/${performance.totalSeats} seats)`,
        revenueImpact: `Estimated secondary consumption loss: ¥${revenueImpactAmount.toFixed(2)} based on ¥${secondaryConsumptionRate.toFixed(2)}/visitor from ${transactions.length} transactions at stop "${performance.stop.name}"`,
        recommendations:
          cancelledVisitorImpact > 50
            ? "High impact cancellation. Consider offering alternative performances, issuing visitor vouchers, and deploying staff for crowd management at affected stops."
            : "Low impact cancellation. Monitor visitor flow at the affected stop and prepare contingency entertainment options.",
        generatedAt: new Date(),
      },
    });

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to generate review material" },
      { status: 500 }
    );
  }
}
