import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  getCleanedTransactions,
  getCleanedOrders,
  getCaliberMatchedData,
  getCleanedTransactionsForStop,
} from "@/lib/cleaned-data";
import type { MiniProgramOrder } from "@/lib/types";

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

    const scenicAreaId = performance.scenicAreaId;
    const perfStopId = performance.stopId;
    const perfDate = new Date(performance.scheduledTime);
    const perfDayStart = new Date(perfDate.getFullYear(), perfDate.getMonth(), perfDate.getDate());
    const perfDayEnd = new Date(perfDayStart.getTime() + 86400000);
    const perfHour = perfDate.getHours();

    const [
      cleanedOrdersAll,
      cleanedTransactionsAll,
      caliberMatchedAll,
      cleanedTransactionsPerfStop,
    ] = await Promise.all([
      getCleanedOrders(scenicAreaId),
      getCleanedTransactions(scenicAreaId),
      getCaliberMatchedData(scenicAreaId),
      getCleanedTransactionsForStop(perfStopId),
    ]);

    const ordersOnPerfDay = cleanedOrdersAll.filter((o) => {
      const vd = new Date(o.visitDate);
      return vd >= perfDayStart && vd < perfDayEnd;
    });

    const perfDayCompletedOrders = ordersOnPerfDay.filter(
      (o: MiniProgramOrder) => o.status === "COMPLETED" || o.status === "CONFIRMED"
    );
    const perfDayCancelledOrders = ordersOnPerfDay.filter(
      (o: MiniProgramOrder) => o.status === "CANCELLED"
    );

    const orderCancellationRate =
      ordersOnPerfDay.length > 0
        ? (perfDayCancelledOrders.length / ordersOnPerfDay.length) * 100
        : 0;

    const perfDayTotalVisitors = perfDayCompletedOrders.reduce(
      (sum, o) => sum + o.visitorCount,
      0
    );
    const perfDayCancelledVisitors = perfDayCancelledOrders.reduce(
      (sum, o) => sum + o.visitorCount,
      0
    );

    const transactionsOnPerfDay = cleanedTransactionsAll.filter((tx) => {
      const tt = new Date(tx.transactionTime);
      return tt >= perfDayStart && tt < perfDayEnd;
    });

    const perfDayTotalRevenue = transactionsOnPerfDay.reduce(
      (sum, tx) => sum + tx.amount,
      0
    );

    const perfStopRevenue = cleanedTransactionsPerfStop.filter((tx) => {
      const tt = new Date(tx.transactionTime);
      return tt >= perfDayStart && tt < perfDayEnd;
    }).reduce((sum, tx) => sum + tx.amount, 0);

    const secondaryConsumptionRate =
      perfDayTotalVisitors > 0
        ? perfDayTotalRevenue / perfDayTotalVisitors
        : 0;

    const caliberPerfStop = caliberMatchedAll.filter(
      (r) => r.cameraStatistic.stopId === perfStopId
    );

    const caliberSameRouteStops = caliberMatchedAll.filter((r) => {
      if (!r.matchedOrders.length) return false;
      return r.matchedOrders.some(
        (o) =>
          ordersOnPerfDay.some((od) => od.orderNo === o.orderNo) &&
          o.status !== "CANCELLED"
      );
    });

    const perfStopCameraVisitorMax = caliberPerfStop.reduce(
      (max, r) => Math.max(max, r.visitorCount),
      0
    );
    const perfStopCameraStayAvg = caliberPerfStop.length > 0
      ? caliberPerfStop.reduce((sum, r) => sum + r.cameraStatistic.avgStayMinutes, 0) / caliberPerfStop.length
      : 0;

    const perfHourCaliber = caliberPerfStop.filter((r) => {
      const h = new Date(r.cameraStatistic.recordedAt).getHours();
      return Math.abs(h - perfHour) <= 3;
    });
    const perfHourVisitorDrop = perfHourCaliber.length > 0
      ? perfHourCaliber[0].orderVisitorCount - perfHourCaliber[0].visitorCount
      : 0;

    const routeVisitorImpact = caliberSameRouteStops.reduce(
      (sum, r) => sum + Math.max(0, r.orderVisitorCount - r.visitorCount),
      0
    );

    const totalImpactedVisitors = Math.max(
      performance.soldSeats,
      perfDayCancelledVisitors + routeVisitorImpact
    );

    const estimatedRevenueLoss =
      totalImpactedVisitors * secondaryConsumptionRate + perfStopRevenue * 0.3;

    const linkedAlert = await prisma.riskAlert.findFirst({
      where: {
        scenicAreaId,
        alertType: "CANCELLATION",
        isResolved: false,
      },
      orderBy: { detectedAt: "desc" },
    });

    const perfDayStr = perfDate.toLocaleDateString("zh-CN");
    const caliberRecordCount = caliberMatchedAll.length;
    const orderRecordCount = ordersOnPerfDay.length;
    const txRecordCount = transactionsOnPerfDay.length;

    const review = await prisma.reviewMaterial.create({
      data: {
        scenicAreaId,
        alertId: linkedAlert?.id ?? null,
        performanceId: performance.id,
        title: `${performance.title}取消复盘报告`,
        content: `${perfDayStr}演出"${performance.title}"因${performance.cancelReason ?? "未知原因"}取消。数据基于${orderRecordCount}条清洗后订单、${txRecordCount}条去重商户流水、${caliberRecordCount}条摄像头口径匹配记录综合分析。演出取消对导览路线二消链路产生级联影响：${perfDayStr}全景区订单取消率${orderCancellationRate.toFixed(1)}%，演出站点( ${performance.stop.name} )峰值客流${perfStopCameraVisitorMax}人，平均停留${perfStopCameraStayAvg.toFixed(1)}分钟。`,
        secondaryConsumptionRate,
        visitorImpact: `${totalImpactedVisitors}名游客受影响（演出已售${performance.soldSeats}座/${performance.totalSeats}总座；当日取消订单${perfDayCancelledOrders.length}单共${perfDayCancelledVisitors}人；同路线站点客流下降${routeVisitorImpact}人；演出时段站点客流缺口${perfHourVisitorDrop > 0 ? perfHourVisitorDrop : 0}人）`,
        revenueImpact: `二消转化率¥${secondaryConsumptionRate.toFixed(2)}/人（${perfDayStr}全景区营收¥${perfDayTotalRevenue.toLocaleString()} / ${perfDayTotalVisitors}人）；演出站点当日营收¥${perfStopRevenue.toLocaleString()}（${cleanedTransactionsPerfStop.length}条流水）；综合预计关联损失¥${estimatedRevenueLoss.toLocaleString()}`,
        recommendations:
          totalImpactedVisitors > 100
            ? "1. 立即推送周边替代活动及餐饮优惠券至受影响用户；2. 启动备用演出方案或移动舞台设备；3. 建立演出取消5分钟应急响应流程；4. 对已购票游客发放下次免费观演券 + 二消抵扣券；5. 跟踪演出站点及同路线站点客流恢复曲线，2小时后发布二次评估"
            : "1. 推送替代活动通知；2. 监控受影响站点客流变化；3. 向已购票游客发放餐饮优惠券；4. 跟踪游客离园率",
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
