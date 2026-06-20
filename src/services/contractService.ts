import { prisma } from "@/lib/prisma";

export interface ContractListQuery {
  merchantId?: string;
  page?: number;
  pageSize?: number;
}

export interface ContractDetail {
  id: string;
  merchantId: string;
  merchantName: string;
  title: string;
  content: string;
  startDate: string;
  endDate: string;
  caliberNote: string;
}

export async function getContractList(query: ContractListQuery) {
  const { merchantId, page = 1, pageSize = 20 } = query;

  const where: any = {};
  if (merchantId) where.merchantId = merchantId;

  const [total, contracts] = await Promise.all([
    prisma.contract.count({ where }),
    prisma.contract.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      include: { merchant: true },
    }),
  ]);

  const list = contracts.map((c) => ({
    id: c.id,
    merchantId: c.merchantId,
    merchantName: c.merchant.name,
    title: c.title,
    startDate: c.startDate.toISOString(),
    endDate: c.endDate.toISOString(),
    caliberNote: c.caliberNote,
  }));

  return { total, list, page, pageSize };
}

export async function getContractDetail(
  contractId: string
): Promise<ContractDetail | null> {
  const contract = await prisma.contract.findUnique({
    where: { id: contractId },
    include: { merchant: true },
  });

  if (!contract) return null;

  return {
    id: contract.id,
    merchantId: contract.merchantId,
    merchantName: contract.merchant.name,
    title: contract.title,
    content: contract.content,
    startDate: contract.startDate.toISOString(),
    endDate: contract.endDate.toISOString(),
    caliberNote: contract.caliberNote,
  };
}

export interface CaliberDefinition {
  key: string;
  name: string;
  description: string;
  formula?: string;
  relatedContracts: string[];
}

export function getCaliberDefinitions(): CaliberDefinition[] {
  return [
    {
      key: "visitor_count",
      name: "客流数",
      description: "通过摄像头统计的区域内人次数量，同一人多次经过计为多次",
      formula: "摄像头统计累计人次",
      relatedContracts: ["商户合作协议-客流统计条款"],
    },
    {
      key: "secondary_consumption",
      name: "二消金额",
      description: "景区内商户产生的非门票消费金额总和，含餐饮、购物、娱乐等",
      formula: "商户流水 + 小程序订单金额",
      relatedContracts: ["商户联营分成协议", "小程序运营合作协议"],
    },
    {
      key: "conversion_rate",
      name: "二消转化率",
      description: "产生二次消费的游客占总客流的比例",
      formula: "二消用户数 / 总客流数 × 100%",
      relatedContracts: ["运营数据统计规范协议"],
    },
    {
      key: "avg_price",
      name: "客单价",
      description: "每笔二消订单的平均消费金额",
      formula: "二消总金额 / 二消订单数",
      relatedContracts: ["商户联营分成协议"],
    },
    {
      key: "route_popularity",
      name: "路线热度",
      description: "导览路线的受欢迎程度，基于小程序订单和客流分布计算",
      formula: "路线订单数 × 0.6 + 路线覆盖区域客流 × 0.4",
      relatedContracts: ["导览服务合作协议"],
    },
    {
      key: "seat_occupancy",
      name: "上座率",
      description: "演出已售座位占总座位数的比例",
      formula: "已售座位数 / 总座位数 × 100%",
      relatedContracts: ["演出合作协议"],
    },
  ];
}
