import type {
  DashboardKPI,
  StoreMapPoint,
  TurnoverTrend,
  MaterialHeatmap,
  VehicleListItem,
  VehicleDetail,
  DiffSummary,
  DiffRecord,
  TurnoverComparison,
  TurnoverGapSample,
  MaterialTrendPoint,
} from "@/types"

export const mockDashboardKPI: DashboardKPI = {
  total_vehicles: 1284,
  transfer_completion_rate: 0.873,
  avg_turnover_days: 23.6,
  material_missing_rate: 0.142,
  kpi_trends: Array.from({ length: 12 }, (_, i) => {
    const d = new Date(2025, i, 1)
    return {
      date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      turnover_days: 28 - i * 0.4 + Math.random() * 3,
      completion_rate: 0.8 + i * 0.006 + Math.random() * 0.02,
      missing_rate: 0.18 - i * 0.003 + Math.random() * 0.01,
    }
  }),
}

export const mockStoreMapPoints: StoreMapPoint[] = [
  { store_id: "s1", store_name: "朝阳旗舰店", lng: 116.481, lat: 39.921, vehicle_count: 186, turnover_status: "normal" },
  { store_id: "s2", store_name: "海淀学院路店", lng: 116.353, lat: 39.977, vehicle_count: 132, turnover_status: "warning" },
  { store_id: "s3", store_name: "丰台总部店", lng: 116.287, lat: 39.858, vehicle_count: 98, turnover_status: "normal" },
  { store_id: "s4", store_name: "通州万达店", lng: 116.906, lat: 39.902, vehicle_count: 74, turnover_status: "critical" },
  { store_id: "s5", store_name: "大兴西红门店", lng: 116.341, lat: 39.763, vehicle_count: 112, turnover_status: "normal" },
  { store_id: "s6", store_name: "顺义空港店", lng: 116.654, lat: 40.102, vehicle_count: 63, turnover_status: "warning" },
  { store_id: "s7", store_name: "昌平回龙观店", lng: 116.331, lat: 40.075, vehicle_count: 89, turnover_status: "normal" },
  { store_id: "s8", store_name: "石景山万达店", lng: 116.223, lat: 39.906, vehicle_count: 56, turnover_status: "normal" },
  { store_id: "s9", store_name: "东城东直门店", lng: 116.427, lat: 39.947, vehicle_count: 147, turnover_status: "critical" },
  { store_id: "s10", store_name: "西城广安门店", lng: 116.353, lat: 39.893, vehicle_count: 91, turnover_status: "warning" },
]

export const mockTurnoverTrends: TurnoverTrend[] = Array.from({ length: 12 }, (_, i) => {
  const d = new Date(2025, i, 1)
  return {
    month: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
    current: 24 - i * 0.3 + Math.random() * 2,
    yoy: 30 - i * 0.5 + Math.random() * 2,
    mom: 25 - i * 0.2 + Math.random() * 2,
    target: 20,
  }
})

export const mockMaterialHeatmap: MaterialHeatmap[] = [
  { material_type: "登记证", store_name: "朝阳旗舰店", missing_count: 12, missing_rate: 0.065, samples: [{ vehicle_id: "v1", vin: "LSVAU2180N2012345", model: "宝马3系", missing_items: ["登记证原件"] }] },
  { material_type: "登记证", store_name: "海淀学院路店", missing_count: 8, missing_rate: 0.061, samples: [{ vehicle_id: "v2", vin: "LSVAU2180N2023456", model: "奥迪A4L", missing_items: ["登记证复印件"] }] },
  { material_type: "行驶证", store_name: "通州万达店", missing_count: 23, missing_rate: 0.311, samples: [{ vehicle_id: "v3", vin: "LSVAU2180N2034567", model: "奔驰C级", missing_items: ["行驶证原件", "行驶证副本"] }] },
  { material_type: "行驶证", store_name: "东城东直门店", missing_count: 18, missing_rate: 0.122, samples: [{ vehicle_id: "v4", vin: "LSVAU2180N2045678", model: "大众迈腾", missing_items: ["行驶证副本"] }] },
  { material_type: "购车发票", store_name: "丰台总部店", missing_count: 5, missing_rate: 0.051, samples: [{ vehicle_id: "v5", vin: "LSVAU2180N2056789", model: "丰田凯美瑞", missing_items: ["购车发票原件"] }] },
  { material_type: "购车发票", store_name: "通州万达店", missing_count: 15, missing_rate: 0.203, samples: [{ vehicle_id: "v6", vin: "LSVAU2180N2067890", model: "本田雅阁", missing_items: ["购车发票原件", "购车发票复印件"] }] },
  { material_type: "保险单", store_name: "朝阳旗舰店", missing_count: 9, missing_rate: 0.048, samples: [{ vehicle_id: "v7", vin: "LSVAU2180N2078901", model: "别克君威", missing_items: ["交强险保单"] }] },
  { material_type: "保险单", store_name: "大兴西红门店", missing_count: 7, missing_rate: 0.063, samples: [{ vehicle_id: "v8", vin: "LSVAU2180N2089012", model: "福特蒙迪欧", missing_items: ["商业险保单"] }] },
  { material_type: "完税证明", store_name: "西城广安门店", missing_count: 14, missing_rate: 0.154, samples: [{ vehicle_id: "v9", vin: "LSVAU2180N2090123", model: "雪佛兰迈锐宝", missing_items: ["购置税完税证明"] }] },
  { material_type: "完税证明", store_name: "海淀学院路店", missing_count: 11, missing_rate: 0.083, samples: [{ vehicle_id: "v10", vin: "LSVAU2180N2011234", model: "日产天籁", missing_items: ["购置税完税证明", "车船税证明"] }] },
]

const brands = ["宝马", "奥迪", "奔驰", "大众", "丰田", "本田", "别克", "福特", "雪佛兰", "日产"]
const models = ["3系", "A4L", "C级", "迈腾", "凯美瑞", "雅阁", "君威", "蒙迪欧", "迈锐宝", "天籁"]
const statuses: VehicleListItem["status"][] = ["in_stock", "transfer_processing", "transferred", "sold"]
const storeNames = ["朝阳旗舰店", "海淀学院路店", "丰台总部店", "通州万达店", "大兴西红门店", "顺义空港店", "昌平回龙观店", "石景山万达店", "东城东直门店", "西城广安门店"]

export const mockVehicleList: VehicleListItem[] = Array.from({ length: 80 }, (_, i) => ({
  vehicle_id: `v${i + 1}`,
  vin: `LSVAU2180N2${String(100000 + i).padStart(6, "0")}`,
  model: `${brands[i % 10]}${models[i % 10]}`,
  brand: brands[i % 10],
  store_name: storeNames[i % 10],
  entry_date: new Date(2025, Math.floor(i / 10), (i % 28) + 1).toISOString().slice(0, 10),
  status: statuses[i % 4],
  turnover_days: 10 + Math.floor(Math.random() * 30),
}))

export const mockVehicleDetail: Record<string, VehicleDetail> = Object.fromEntries(
  mockVehicleList.slice(0, 20).map((v, i) => [
    v.vehicle_id,
    {
      ...v,
      year: 2018 + (i % 5),
      mileage: 30000 + Math.floor(Math.random() * 80000),
      store_id: `s${(i % 10) + 1}`,
      source_db_version: `v${2 + (i % 3)}.${i % 5}`,
      detector_version: `D${3 + (i % 2)}.${i % 4}`,
      crm_id: `CRM-${String(10000 + i)}`,
      inspection_reports: [
        {
          report_id: `r${i + 1}`,
          inspector: `检测师${String((i % 5) + 1)}`,
          inspect_date: v.entry_date,
          detector_version: `D${3 + (i % 2)}.${i % 4}`,
          items: [
            { item_name: "发动机", status: i % 7 === 0 ? "warning" : "pass", detail: i % 7 === 0 ? "轻微异响" : "正常" },
            { item_name: "变速箱", status: "pass", detail: "换挡顺畅" },
            { item_name: "车身外观", status: i % 5 === 0 ? "fail" : "pass", detail: i % 5 === 0 ? "右后翼子板补漆" : "漆面完好" },
            { item_name: "底盘", status: "pass", detail: "无锈蚀" },
            { item_name: "电气系统", status: i % 9 === 0 ? "warning" : "pass", detail: i % 9 === 0 ? "电瓶电压偏低" : "正常" },
          ],
        },
      ],
      preparation_list: [
        { task_id: `t${i * 3 + 1}`, task_name: "外观整备", category: "外观", status: i % 3 === 0 ? "completed" : i % 3 === 1 ? "in_progress" : "pending", related_inspection_item: "车身外观", cost: 1500 + Math.random() * 2000 },
        { task_id: `t${i * 3 + 2}`, task_name: "机械整备", category: "机械", status: i % 2 === 0 ? "completed" : "pending", related_inspection_item: "发动机", cost: 800 + Math.random() * 1500 },
        { task_id: `t${i * 3 + 3}`, task_name: "内饰清洁", category: "内饰", status: "completed", related_inspection_item: "", cost: 300 + Math.random() * 500 },
      ],
      test_drive_records: Array.from({ length: 1 + (i % 4) }, (_, j) => ({
        record_id: `td${i * 4 + j + 1}`,
        drive_date: new Date(2025, Math.floor(i / 10), Math.min(28, (i % 20) + j + 1)).toISOString().slice(0, 10),
        driver: `试驾员${String((j % 3) + 1)}`,
        duration_minutes: 15 + Math.floor(Math.random() * 45),
        mileage_km: 3 + Math.floor(Math.random() * 15),
        is_anomaly: j === 0 && i % 4 === 0,
        anomaly_detail: j === 0 && i % 4 === 0 ? "怠速不稳，转速波动±200rpm" : null,
      })),
    },
  ])
)

export const mockDiffSummary: DiffSummary = {
  source_vs_crm: { total: 87, resolved: 52, pending: 35 },
  detector_version_diff: {
    total: 23,
    versions: [
      { version: "D3.0", count: 156, change_date: "2025-01-15", affected_stores: ["朝阳旗舰店", "海淀学院路店"] },
      { version: "D3.1", count: 89, change_date: "2025-04-01", affected_stores: ["通州万达店", "东城东直门店"] },
      { version: "D4.0", count: 34, change_date: "2025-07-10", affected_stores: ["丰台总部店"] },
    ],
  },
}

export const mockDiffRecords: DiffRecord[] = Array.from({ length: 30 }, (_, i) => ({
  diff_id: `diff${i + 1}`,
  vehicle_id: `v${(i % 20) + 1}`,
  vin: `LSVAU2180N2${String(100000 + i).padStart(6, "0")}`,
  field_name: ["mileage", "brand", "model", "status", "entry_date"][i % 5],
  source_value: ["45200", "宝马", "3系", "in_stock", "2025-01-15"][i % 5],
  crm_value: ["45000", "BMW", "3 Series", "available", "2025-01-16"][i % 5],
  source: (["vehicle_source", "detector", "crm"] as const)[i % 3],
  detected_at: new Date(2025, Math.floor(i / 5), (i % 28) + 1).toISOString(),
  resolved: i % 3 !== 0,
}))

export const mockTurnoverComparisons: TurnoverComparison[] = Array.from({ length: 12 }, (_, i) => {
  const d = new Date(2025, i, 1)
  const current = 24 - i * 0.3 + Math.random() * 2
  const target = 20
  return {
    period: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
    current_value: Math.round(current * 10) / 10,
    yoy_value: Math.round((30 - i * 0.5 + Math.random() * 2) * 10) / 10,
    mom_value: Math.round((25 - i * 0.2 + Math.random() * 2) * 10) / 10,
    target_value: target,
    gap_to_target: Math.round((current - target) * 10) / 10,
  }
})

export const mockTurnoverGapSamples: TurnoverGapSample[] = Array.from({ length: 15 }, (_, i) => ({
  vehicle_id: `v${i + 30}`,
  vin: `LSVAU2180N2${String(100030 + i).padStart(6, "0")}`,
  model: `${brands[i % 10]}${models[i % 10]}`,
  store_name: storeNames[i % 10],
  turnover_days: 25 + Math.floor(Math.random() * 20),
  gap_reason: ["登记证缺失等待补办", "检测异常复检中", "整备延期", "试驾发现异响应修", "过户材料不齐"][i % 5],
  test_drive_anomaly: i % 3 === 0
    ? {
        record_id: `td_gap${i}`,
        drive_date: "2025-11-10",
        driver: "试驾员1",
        duration_minutes: 20 + i,
        mileage_km: 5 + i,
        is_anomaly: true,
        anomaly_detail: "变速箱2-3挡顿挫明显",
      }
    : null,
}))

const materialTypes = ["登记证", "行驶证", "购车发票", "保险单", "完税证明"] as const
export const mockMaterialTrend: MaterialTrendPoint[] = Array.from({ length: 12 }, (_, i) => {
  const d = new Date(2025, i, 1)
  const baseFactor = 1 - (12 - i) * 0.02
  const noise = (seed: number) => 0.9 + 0.2 * (Math.sin(seed) * 0.5 + 0.5)
  return {
    month: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
    登记证: Math.max(0.01, +(0.13 * baseFactor * noise(i + 1)).toFixed(4)),
    行驶证: Math.max(0.01, +(0.09 * baseFactor * noise(i + 2)).toFixed(4)),
    购车发票: Math.max(0.01, +(0.15 * baseFactor * noise(i + 3)).toFixed(4)),
    保险单: Math.max(0.01, +(0.11 * baseFactor * noise(i + 4)).toFixed(4)),
    完税证明: Math.max(0.01, +(0.07 * baseFactor * noise(i + 5)).toFixed(4)),
  } as MaterialTrendPoint
})
