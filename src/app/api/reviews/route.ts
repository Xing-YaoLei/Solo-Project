import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCleanedTransactionsForStop } from "@/lib/cleaned-data";

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
        stop: true,
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

    const cleanedTransactions = await getCleanedTransactionsForStop(performance.stopId);

    const totalTransactionAmount = cleanedTransactions.reduce(
      (sum, tx) => sum + tx.amount,
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
        title: `${performance.title}取消复盘报告`,
        content: `演出"${performance.title}"因${performance.cancelReason ?? "未知原因"}取消。该演出对周边二消商户产生级联影响，以下为基于清洗去重后的商户流水数据分析。`,
        secondaryConsumptionRate,
        visitorImpact: `${cancelledVisitorImpact}名已购票游客受影响（未入座：${unsoldSeats}/${performance.totalSeats}座）`,
        revenueImpact: `基于${cleanedTransactions.length}条清洗后流水记录，站点"${performance.stop.name}"周边二消人均¥${secondaryConsumptionRate.toFixed(2)}，预计关联损失¥${revenueImpactAmount.toFixed(2)}`,
        recommendations:
          cancelledVisitorImpact > 50
            ? "1. 立即推送周边替代活动及餐饮优惠券；2. 增设备用演出方案或移动舞台；3. 建立演出取消5分钟应急响应流程；4. 对受影响游客发放下次免费观演券"
            : "1. 监控受影响站点客流变化；2. 准备备用娱乐方案；3. 跟踪游客离园率",
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
