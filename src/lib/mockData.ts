import {
  OverviewData,
  QuotationTrendResponse,
  InspectionResponse,
  VehicleResponse,
  DiagnosisResponse,
  ShareLinkResponse,
  UserRole,
} from "@/types";

const generateDateRange = (days: number) => {
  const dates = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    dates.push(date.toISOString().split("T")[0]);
  }
  return dates;
};

export async function getOverviewData(): Promise<OverviewData> {
  await new Promise((resolve) => setTimeout(resolve, 300));

  return {
    totalWorkOrders: 286,
    avgRepairDuration: 4.2,
    reworkRate: 0.085,
    stationUtilization: 0.76,
    lastUpdated: new Date().toISOString(),
  };
}

export async function getQuotationTrend(
  period: "day" | "week" | "month" = "day"
): Promise<QuotationTrendResponse> {
  await new Promise((resolve) => setTimeout(resolve, 200));

  const days = period === "day" ? 14 : period === "week" ? 8 : 12;
  const dates = generateDateRange(days);

  const data = dates.map((date, index) => {
    const baseCount = 15 + Math.sin(index / 2) * 5;
    const orderCount = Math.floor(baseCount + Math.random() * 8);
    const avgAmount = 800 + Math.random() * 400;
    const totalAmount = orderCount * avgAmount;

    return {
      date,
      orderCount,
      totalAmount: Math.round(totalAmount * 100) / 100,
      avgAmount: Math.round(avgAmount * 100) / 100,
    };
  });

  return {
    data,
    lastUpdated: new Date().toISOString(),
  };
}

export async function getInspectionData(): Promise<InspectionResponse> {
  await new Promise((resolve) => setTimeout(resolve, 200));

  const total = 256;
  const passed = 218;
  const failed = total - passed;

  const issues = [
    { type: "漆面划痕", count: 12, percentage: 0.469 },
    { type: "零件磨损", count: 8, percentage: 0.313 },
    { type: "安装间隙", count: 4, percentage: 0.156 },
    { type: "密封不良", count: 3, percentage: 0.117 },
    { type: "其他问题", count: 11, percentage: 0.429 },
  ];

  return {
    summary: {
      total,
      passed,
      failed,
      passRate: passed / total,
    },
    issues,
    lastUpdated: new Date().toISOString(),
  };
}

export async function getVehicleRecords(
  page: number = 1,
  pageSize: number = 10
): Promise<VehicleResponse> {
  await new Promise((resolve) => setTimeout(resolve, 300));

  const vehicles = [
    {
      id: "1",
      plateNumber: "京A12345",
      vehicleModel: "宝马 530Li 2023款",
      ownerName: "张伟",
      lastServiceDate: "2024-06-15",
      serviceCount: 8,
      totalAmount: 28600,
      parts: [
        {
          partId: "p001",
          partName: "前刹车片",
          partCode: "PC-001",
          quantity: 4,
          unitPrice: 380,
          subtotal: 1520,
          usedDate: "2024-06-15",
        },
        {
          partId: "p002",
          partName: "机油滤清器",
          partCode: "PC-002",
          quantity: 1,
          unitPrice: 120,
          usedDate: "2024-06-15",
        },
      ],
    },
    {
      id: "2",
      plateNumber: "京B67890",
      vehicleModel: "奥迪 A6L 2022款",
      ownerName: "李娜",
      lastServiceDate: "2024-06-14",
      serviceCount: 5,
      totalAmount: 15800,
      parts: [
        {
          partId: "p003",
          partName: "空气滤芯",
          quantity: 1,
          unitPrice: 280,
          usedDate: "2024-06-14",
        },
      ],
    },
    {
      id: "3",
      plateNumber: "京C11111",
      vehicleModel: "奔驰 E300L 2024款",
      ownerName: "王强",
      lastServiceDate: "2024-06-13",
      serviceCount: 12,
      totalAmount: 45200,
      parts: [
        {
          partId: "p004",
          partName: "变速箱油",
          quantity: 6,
          unitPrice: 220,
          usedDate: "2024-06-13",
        },
        {
          partId: "p005",
          partName: "火花塞",
          quantity: 6,
          unitPrice: 180,
          usedDate: "2024-06-13",
        },
      ],
    },
    {
      id: "4",
      plateNumber: "京D22222",
      vehicleModel: "丰田凯美瑞 2021款",
      ownerName: "赵敏",
      lastServiceDate: "2024-06-12",
      serviceCount: 3,
      totalAmount: 6800,
      parts: [],
    },
    {
      id: "5",
      plateNumber: "京E33333",
      vehicleModel: "本田雅阁 2023款",
      ownerName: "陈刚",
      lastServiceDate: "2024-06-11",
      serviceCount: 6,
      totalAmount: 12500,
      parts: [
        {
          partId: "p006",
          partName: "蓄电池",
          quantity: 1,
          unitPrice: 850,
          usedDate: "2024-06-11",
        },
      ],
    },
    {
      id: "6",
      plateNumber: "京F44444",
      vehicleModel: "大众迈腾 2022款",
      ownerName: "刘洋",
      lastServiceDate: "2024-06-10",
      serviceCount: 7,
      totalAmount: 18900,
      parts: [],
    },
    {
      id: "7",
      plateNumber: "京G55555",
      vehicleModel: "特斯拉 Model 3",
      ownerName: "周婷",
      lastServiceDate: "2024-06-09",
      serviceCount: 2,
      totalAmount: 3200,
      parts: [],
    },
    {
      id: "8",
      plateNumber: "京H66666",
      vehicleModel: "比亚迪汉 2024款",
      ownerName: "吴磊",
      lastServiceDate: "2024-06-08",
      serviceCount: 4,
      totalAmount: 8500,
      parts: [
        {
          partId: "p007",
          partName: "轮胎",
          quantity: 2,
          unitPrice: 680,
          usedDate: "2024-06-08",
        },
      ],
    },
  ];

  return {
    data: vehicles as any,
    total: 56,
    lastUpdated: new Date().toISOString(),
  };
}

export async function getDiagnosisData(): Promise<DiagnosisResponse> {
  await new Promise((resolve) => setTimeout(resolve, 250));

  const abnormalItems = [
    {
      id: "d001",
      date: "2024-06-15",
      vehiclePlate: "京A12345",
      diagnosisItem: "发动机异响",
      severity: "high" as const,
      isRework: true,
      technician: "李师傅",
    },
    {
      id: "d002",
      date: "2024-06-15",
      vehiclePlate: "京B67890",
      diagnosisItem: "刹车盘磨损",
      severity: "medium" as const,
      isRework: false,
      technician: "张师傅",
    },
    {
      id: "d003",
      date: "2024-06-14",
      vehiclePlate: "京C11111",
      diagnosisItem: "变速箱顿挫",
      severity: "high" as const,
      isRework: true,
      technician: "王师傅",
    },
    {
      id: "d004",
      date: "2024-06-14",
      vehiclePlate: "京D22222",
      diagnosisItem: "空调制冷不足",
      severity: "low" as const,
      isRework: false,
      technician: "赵师傅",
    },
    {
      id: "d005",
      date: "2024-06-13",
      vehiclePlate: "京E33333",
      diagnosisItem: "悬挂异响",
      severity: "medium" as const,
      isRework: false,
      technician: "李师傅",
    },
    {
      id: "d006",
      date: "2024-06-13",
      vehiclePlate: "京F44444",
      diagnosisItem: "电瓶亏电",
      severity: "low" as const,
      isRework: false,
      technician: "张师傅",
    },
    {
      id: "d007",
      date: "2024-06-12",
      vehiclePlate: "京G55555",
      diagnosisItem: "轮胎偏磨",
      severity: "medium" as const,
      isRework: true,
      technician: "王师傅",
    },
    {
      id: "d008",
      date: "2024-06-12",
      vehiclePlate: "京H66666",
      diagnosisItem: "刹车油变质",
      severity: "high" as const,
      isRework: false,
      technician: "赵师傅",
    },
  ];

  const dates = generateDateRange(14);
  const trend = dates.map((date, index) => ({
    date,
    abnormalCount: Math.floor(3 + Math.sin(index / 2) * 2 + Math.random() * 4),
    reworkCount: Math.floor(1 + Math.random() * 2),
  }));

  return {
    abnormalItems,
    trend,
    lastUpdated: new Date().toISOString(),
  };
}

export async function generateShareLink(
  role: UserRole,
  expiresIn?: number,
  scope?: string[]
): Promise<ShareLinkResponse> {
  await new Promise((resolve) => setTimeout(resolve, 200));

  const token = Math.random().toString(36).substring(2, 18);
  const now = new Date();
  const expiresAt = expiresIn
    ? new Date(now.getTime() + expiresIn * 1000).toISOString()
    : new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  return {
    token,
    url: `${baseUrl}/share/${token}`,
    role,
    expiresAt,
    createdAt: now.toISOString(),
  };
}

export async function validateShareToken(
  token: string
): Promise<{ valid: boolean; role?: UserRole; scope?: string[] }> {
  await new Promise((resolve) => setTimeout(resolve, 100));

  if (!token || token.length < 8) {
    return { valid: false };
  }

  return {
    valid: true,
    role: "advisor",
    scope: ["overview", "quotation", "vehicles", "diagnosis"],
  };
}
