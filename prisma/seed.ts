import { PrismaClient } from "@prisma/client";
import {
  FunnelStage,
  ArrivalStatus,
  SyncStatus,
  SyncTaskType,
  AnomalyType,
  Severity,
  AnomalyStatus,
  InventoryType,
  CountStatus,
  PhotoType,
  PaymentType,
  PurchaseStatus,
} from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 开始种子数据...");

  const today = new Date();
  const daysAgo = (d: number) => {
    const dt = new Date(today);
    dt.setDate(dt.getDate() - d);
    return dt;
  };
  const rnd = (a: number, b: number) => Math.random() * (b - a) + a;
  const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
  const stages = Object.values(FunnelStage);

  const sites = await prisma.constructionSite.createManyAndReturn({
    data: [
      { name: "西湖花园3栋1802", address: "杭州市西湖区文一西路123号", projectNo: "XH-2026-0180", owner: "张先生" },
      { name: "钱江新城5栋2201", address: "杭州市上城区钱江路456号", projectNo: "QJ-2026-0221", owner: "李女士" },
      { name: "滨江翡翠城8栋903", address: "杭州市滨江区江南大道789号", projectNo: "BJ-2026-0093", owner: "王先生" },
      { name: "未来科技城2栋1506", address: "杭州市余杭区文一西路999号", projectNo: "WL-2026-0156", owner: "陈先生" },
      { name: "良渚文化村6栋302", address: "杭州市余杭区良渚路100号", projectNo: "LZ-2026-0032", owner: "赵女士" },
    ],
  });

  const materials = await prisma.material.createManyAndReturn({
    data: [
      { name: "32.5级复合硅酸盐水泥", code: "CM-001", category: "基础建材", unit: "袋", spec: "50kg/袋", standardDays: 5, safetyStock: 40 },
      { name: "河沙（中粗）", code: "SD-002", category: "基础建材", unit: "吨", spec: "2mm-5mm", standardDays: 3, safetyStock: 20 },
      { name: "5mm-10mm碎石", code: "GR-003", category: "基础建材", unit: "吨", spec: "5-10mm", standardDays: 3, safetyStock: 25 },
      { name: "800×800通体大理石瓷砖", code: "TL-004", category: "瓷砖石材", unit: "片", spec: "800×800mm", standardDays: 7, safetyStock: 30 },
      { name: "E0级多层实木板18mm", code: "WD-005", category: "木制品", unit: "张", spec: "1220×2440×18mm", standardDays: 10, safetyStock: 15 },
      { name: "PPR热水管DN25", code: "PP-006", category: "水电材料", unit: "米", spec: "DN25×4.2mm", standardDays: 4, safetyStock: 100 },
      { name: "BV-4mm²国标铜线", code: "WR-007", category: "水电材料", unit: "卷", spec: "4mm² 100米", standardDays: 4, safetyStock: 8 },
      { name: "环保乳胶漆（白色）", code: "PT-008", category: "涂料", unit: "桶", spec: "18L/桶", standardDays: 6, safetyStock: 10 },
    ],
  });

  const arrivals: {
    siteId: string; materialId: string; batchNo: string; stage: FunnelStage;
    plannedQty: number; actualQty: number; shortageQty: number; hasShortage: boolean;
    plannedDate: Date; actualDate: Date | null; turnoverDays: number | null;
    inspector: string; status: ArrivalStatus; caliberVersion: string; purchaseRef: string;
  }[] = [];

  let batchCounter = 1;
  sites.forEach((site) => {
    materials.forEach((mat) => {
      const plannedQty = Math.round(rnd(20, 200));
      const stageIndex = Math.floor(rnd(1, stages.length));
      const stage = stages[stageIndex - 1];
      const actualRatio = stage === stages[stages.length - 1] ? rnd(0.8, 1.0) : rnd(0.85, 1.05);
      const actualQty = Math.max(0, Math.round(plannedQty * actualRatio));
      const hasShortage = actualQty < plannedQty * 0.95;
      const shortageQty = hasShortage ? plannedQty - actualQty : 0;
      const plannedDate = daysAgo(Math.round(rnd(15, 60)));
      const actualDate = stageIndex >= 4 ? new Date(plannedDate.getTime() + Math.round(rnd(1, 10) * 86400000)) : null;
      const turnoverDays = actualDate
        ? Math.round((actualDate.getTime() - plannedDate.getTime()) / 86400000)
        : Math.round((today.getTime() - plannedDate.getTime()) / 86400000);

      arrivals.push({
        siteId: site.id,
        materialId: mat.id,
        batchNo: `B2026${String(1000 + batchCounter).padStart(4, "0")}`,
        stage,
        plannedQty,
        actualQty,
        shortageQty,
        hasShortage,
        plannedDate,
        actualDate,
        turnoverDays: turnoverDays > mat.standardDays * 2 ? null : turnoverDays,
        inspector: pick(["李监理", "王监理", "张监理", "陈监理"]),
        status: hasShortage ? ArrivalStatus.SHORTAGE : stageIndex === stages.length - 1
          ? ArrivalStatus.COMPLETED
          : pick([ArrivalStatus.IN_PROGRESS, ArrivalStatus.PENDING, ArrivalStatus.IN_PROGRESS]),
        caliberVersion: "v1.0",
        purchaseRef: `PO-${String(10000 + batchCounter).padStart(5, "0")}`,
      });
      batchCounter++;
    });
  });

  await prisma.materialArrival.createMany({ data: arrivals });

  const anomalyList: any[] = arrivals
    .filter((a) => a.hasShortage)
    .map((a, i) => ({
      anomalyType: AnomalyType.BATCH_SHORTAGE,
      severity: a.shortageQty / a.plannedQty > 0.2 ? Severity.HIGH : Severity.MEDIUM,
      siteId: a.siteId,
      arrivalId: a.id,
      title: `批次短缺`,
      description: `计划 ${a.plannedQty}，实际 ${a.actualQty}`,
      status: i % 3 === 0 ? AnomalyStatus.RESOLVED : i % 3 === 1 ? AnomalyStatus.IN_PROGRESS : AnomalyStatus.OPEN,
      assignee: pick(["王经理", "李工", "张工", null]),
      caliberUsed: "v1.0",
    }));

  anomalyList.push(
    { anomalyType: AnomalyType.PHOTO_MISSING, severity: Severity.MEDIUM, siteId: sites[0].id, title: "验收照片缺失", description: "缺少现场照片", status: AnomalyStatus.OPEN, assignee: "李监理", caliberUsed: "v1.0" },
    { anomalyType: AnomalyType.PAYMENT_MISMATCH, severity: Severity.HIGH, siteId: sites[1].id, title: "收款金额不符", description: "差额￥4,800", status: AnomalyStatus.IN_PROGRESS, assignee: "财务部-小王", caliberUsed: "v1.0" },
    { anomalyType: AnomalyType.ORDER_MISSING, severity: Severity.CRITICAL, siteId: sites[3].id, title: "缺少对应采购单", description: "无采购订单", status: AnomalyStatus.OPEN, caliberUsed: "v1.0" }
  );

  await prisma.anomalyItem.createMany({ data: anomalyList });

  await prisma.syncTask.createMany({
    data: [
      { taskType: SyncTaskType.SUPERVISOR_PHOTO, status: SyncStatus.SYNCED, totalCount: 156, successCount: 148, failedCount: 8, finishedAt: new Date() },
      { taskType: SyncTaskType.PAYMENT_RECORD, status: SyncStatus.SYNCED, totalCount: 42, successCount: 42, failedCount: 0, finishedAt: new Date() },
      { taskType: SyncTaskType.PURCHASE_ORDER, status: SyncStatus.FAILED, totalCount: 88, successCount: 72, failedCount: 16, finishedAt: daysAgo(1) },
    ],
  });

  for (const m of materials.slice(0, 8)) {
    for (const s of sites.slice(0, 3)) {
      await prisma.safetyStock.create({
        data: {
          materialId: m.id,
          siteId: s.id,
          minQty: m.safetyStock,
          maxQty: Math.round(m.safetyStock * 2.5),
          reorderQty: Math.round(m.safetyStock * 1.5),
        },
      });
    }
  }

  const invRecords: any[] = [];
  let n = 1;
  sites.slice(0, 3).forEach((s) => {
    materials.slice(0, 5).forEach((m) => {
      for (let i = 0; i < 3; i++) {
        invRecords.push({
          siteId: s.id,
          materialId: m.id,
          recordType: pick([InventoryType.INBOUND, InventoryType.OUTBOUND, InventoryType.INBOUND, InventoryType.OUTBOUND, InventoryType.ADJUSTMENT]),
          qty: Math.round(rnd(5, 50)),
          unitPrice: Math.round(rnd(20, 500)),
          occurredAt: daysAgo(Math.round(rnd(1, 30))),
          operator: pick(["仓管员-老刘", "仓管员-小陈", "材料员-小张"]),
          remark: pick(["正常入库", "施工领用", "盘点调整", "部分退货", "正常出库"]),
        });
        n++;
      }
    });
  });
  await prisma.inventoryRecord.createMany({ data: invRecords });

  const counts = await Promise.all(
    sites.slice(0, 3).map((s, i) =>
      prisma.stockCount.create({
        data: {
          siteId: s.id,
          countNo: `SC${String(26000 + i).padStart(5, "0")}`,
          countDate: daysAgo(Math.round(rnd(1, 7))),
          counter: pick(["盘点员-王", "盘点员-李", "盘点员-张"]),
          status: CountStatus.CONFIRMED,
        },
      })
    )
  );

  for (const [si, s] of sites.slice(0, 3).entries()) {
    for (const m of materials.slice(0, 4)) {
      const systemQty = Math.round(rnd(30, 150));
      const actualQty = Math.round(systemQty * rnd(0.85, 1.1));
      const diffQty = actualQty - systemQty;
      if (diffQty === 0) continue;
      const unitPrice = Math.round(rnd(20, 400));
      const diff = await prisma.stockCountDiff.create({
        data: {
          countId: counts[si].id,
          siteId: s.id,
          materialId: m.id,
          systemQty,
          actualQty,
          diffQty,
          diffAmount: Math.abs(diffQty) * unitPrice,
          unitPrice,
          diffReason: diffQty < 0 ? pick(["运输破损", "错发漏发", "自然损耗", "账实不符"]) : pick(["入库延迟", "录入错误"]),
          rawSampleRef: `SP${String(2026000 + si * 4 + m.id.length).padStart(7, "0")}`,
        },
      });
      await prisma.rawSample.create({
        data: {
          diffId: diff.id,
          sampleNo: `SP${String(2026000 + si * 4 + m.id.length).padStart(7, "0")}`,
          sampleData: {
            location: pick(["A区货架", "B区地面", "C区暂存", "临时堆放点"]),
            condition: pick(["包装完好", "包装破损", "部分受潮"]),
            quantity: actualQty,
            photosCount: Math.round(rnd(1, 6)),
          },
          photoUrl: `https://picsum.photos/seed/sample${si}-${m.id}/400/300`,
          takenBy: pick(["盘点员-王", "盘点员-李", "盘点员-张"]),
          takenAt: daysAgo(Math.round(rnd(1, 7))),
        },
      });
    }
  }

  await prisma.note.createMany({
    data: [
      { content: "已联系供应商，承诺3天内补发短缺20袋水泥", author: "王经理", siteId: sites[0].id },
      { content: "监理照片已补拍，等待审核上传", author: "张监理", siteId: sites[0].id },
      { content: "财务已核实差额，将在下笔款项中抵扣", author: "财务部-小王", siteId: sites[1].id },
    ],
  });

  const supervisorPhotos: any[] = [];
  for (let i = 0; i < 156; i++) {
    const site = sites[i % sites.length];
    const isFailed = i < 8;
    supervisorPhotos.push({
      siteId: site.id,
      fileName: `photo_${String(20260601 + i).padStart(8, "0")}.jpg`,
      photoType: pick([PhotoType.ACCEPTANCE, PhotoType.DELIVERY, PhotoType.MATERIAL, PhotoType.SITE, PhotoType.INSPECTION]),
      photoUrl: `https://picsum.photos/seed/photo${i}/800/600`,
      takenAt: daysAgo(Math.round(rnd(1, 30))),
      uploader: pick(["李监理", "王监理", "张监理", "陈监理"]),
      remark: isFailed ? pick(["上传超时", "文件损坏", "格式不支持", "鉴权失败"]) : "正常",
      syncStatus: isFailed ? SyncStatus.FAILED : SyncStatus.SYNCED,
      syncError: isFailed ? pick(["OSS 返回 403 Forbidden", "网络超时 ETIMEDOUT", "图片格式校验失败", "Supabase 鉴权失败", "文件大小超出限制 50MB"]) : null,
    });
  }
  const createdPhotos = await prisma.supervisorPhoto.createManyAndReturn({ data: supervisorPhotos });
  console.log(`  📷 监理照片: 共 ${createdPhotos.length} 条，其中 ${supervisorPhotos.filter(p => p.syncStatus === SyncStatus.FAILED).length} 条 FAILED`);

  const paymentRecords: any[] = [];
  for (let i = 0; i < 45; i++) {
    const site = sites[i % sites.length];
    const isFailed = i < 3;
    paymentRecords.push({
      siteId: site.id,
      voucherNo: `SK${String(202606000 + i).padStart(8, "0")}`,
      amount: Math.round(rnd(3000, 80000)),
      paymentType: pick([PaymentType.CASH, PaymentType.BANK_TRANSFER, PaymentType.ALIPAY, PaymentType.WECHAT]),
      payer: pick(["张先生", "李女士", "王先生", "陈先生", "赵女士"]),
      payee: "家装公司财务部",
      paidAt: daysAgo(Math.round(rnd(1, 45))),
      purchaseOrderId: null,
      remark: isFailed ? pick(["凭证号重复", "金额不匹配", "付款人信息缺失"]) : "已确认到账",
      syncStatus: isFailed ? SyncStatus.FAILED : SyncStatus.SYNCED,
      syncError: isFailed ? pick(["财务系统凭证号重复", "ERP 返回金额不匹配", "付款人 ID 与合同不一致", "银行接口异常"]) : null,
    });
  }
  const createdPayments = await prisma.paymentRecord.createManyAndReturn({ data: paymentRecords });
  console.log(`  💰 收款记录: 共 ${createdPayments.length} 条，其中 ${paymentRecords.filter(p => p.syncStatus === SyncStatus.FAILED).length} 条 FAILED`);

  const purchaseOrders: any[] = [];
  for (let i = 0; i < 92; i++) {
    const site = sites[i % sites.length];
    const isFailed = i < 4;
    purchaseOrders.push({
      siteId: site.id,
      orderNo: `PO${String(202606000 + i).padStart(8, "0")}`,
      supplier: pick(["华东建材有限公司", "绿源木业", "恒通管材", "金盾涂料", "恒辉瓷砖"]),
      totalAmount: Math.round(rnd(5000, 120000)),
      status: pick([PurchaseStatus.PENDING, PurchaseStatus.SUBMITTED, PurchaseStatus.APPROVED, PurchaseStatus.RECEIVED, PurchaseStatus.CLOSED]),
      orderedAt: daysAgo(Math.round(rnd(2, 60))),
      remark: isFailed ? pick(["供应商未确认", "审批人已离职", "物料编码错误"]) : "正常流转",
      syncStatus: isFailed ? SyncStatus.FAILED : SyncStatus.SYNCED,
      syncError: isFailed ? pick(["ERP 订单状态回写失败", "供应商接口 500", "审批节点不存在", "物料编码在主数据中查无此人"]) : null,
    });
  }
  const createdOrders = await prisma.purchaseOrder.createManyAndReturn({ data: purchaseOrders });
  console.log(`  📋 采购单: 共 ${createdOrders.length} 条，其中 ${purchaseOrders.filter(p => p.syncStatus === SyncStatus.FAILED).length} 条 FAILED`);

  console.log("✅ 种子数据创建完成");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
