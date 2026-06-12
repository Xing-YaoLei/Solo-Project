// -*- coding: utf-8 -*-
/**
 * API服务封装
 * 提供仪表盘和风险监测图所需的数据接口
 */
import axios from 'axios';

const request = axios.create({
  baseURL: '/api',
  timeout: 15000,
});

// ==================== Mock数据生成函数 ====================

const STORES = [
  { id: 1, store_code: 'SH001', store_name: '上海南京路店', region: '华东', city: '上海' },
  { id: 2, store_code: 'SH002', store_name: '上海陆家嘴店', region: '华东', city: '上海' },
  { id: 3, store_code: 'BJ001', store_name: '北京国贸店', region: '华北', city: '北京' },
  { id: 4, store_code: 'BJ002', store_name: '北京中关村店', region: '华北', city: '北京' },
  { id: 5, store_code: 'GZ001', store_name: '广州天河城店', region: '华南', city: '广州' },
];

const EQUIPMENT_TYPES = [
  { type: '意式咖啡机', model: 'La Marzocco Linea PB' },
  { type: '意式咖啡机', model: 'Synesso MVP Hydra' },
  { type: '磨豆机', model: 'Mahlkonig E65S' },
  { type: '奶泡机', model: 'Melitta Cino Milk' },
];

const ANOMALY_TYPES = [
  { type: 'high_risk', label: '高风险', reason: '连续3日清洁评分下降且未执行深度清洁' },
  { type: 'offline_gap', label: '离线缺口', reason: '设备离线超过4小时，清洁数据采集缺失' },
  { type: 'inspection_fail', label: '巡检失败', reason: '巡检清洁项得分低于阈值' },
  { type: 'fault_trigger', label: '故障触发', reason: '触发清洁相关故障告警' },
];

// 生成所有设备列表
function generateEquipments() {
  const list = [];
  let id = 1;
  STORES.forEach((store) => {
    EQUIPMENT_TYPES.forEach((eqType) => {
      list.push({
        id,
        equipment_code: `${store.store_code}-EQ${String(id).padStart(3, '0')}`,
        equipment_name: eqType.model,
        equipment_type: eqType.type,
        store_id: store.id,
        store_name: store.store_name,
        model: eqType.model,
        status: ['online', 'online', 'online', 'warning', 'offline'][
          Math.floor(Math.random() * 5)
        ],
      });
      id++;
    });
  });
  return list;
}

const EQUIPMENTS = generateEquipments();

// 生成日期列表
function generateDateList(startDateStr, days) {
  const dates = [];
  const start = new Date(startDateStr);
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

// ==================== API方法 ====================

// 初始化Mock数据
export async function initMockData() {
  try {
    const res = await request.post('/analytics/init-data');
    return res.data;
  } catch (e) {
    // 后端不可用时使用本地模拟
    await new Promise((r) => setTimeout(r, 800));
    return {
      code: 0,
      message: 'Mock数据初始化成功（本地模拟）',
      data: {
        store_count: 5,
        equipment_count: EQUIPMENTS.length,
        clean_metrics_count: 900,
        fault_count: 80,
        task_count: 68,
        inspection_count: 320,
      },
    };
  }
}

// 获取仪表盘概览数据
export async function getDashboardOverview() {
  try {
    const res = await request.get('/analytics/overview/dashboard');
    return res.data;
  } catch (e) {
    await new Promise((r) => setTimeout(r, 300));
    return {
      code: 0,
      message: 'success',
      data: {
        total_equipment: EQUIPMENTS.length,
        online_rate: 86.5,
        avg_risk_score: 38.72,
        high_risk_count: 4,
        fault_pending_count: 12,
        task_overdue_count: 6,
        inspection_pass_rate: 82.35,
        change: {
          prev_pass_rate: 78.1,
          improvement_rate: 4.25,
        },
      },
    };
  }
}

// 获取TOP10风险设备
export async function getTopRisks(limit = 10) {
  try {
    const res = await request.get('/analytics/top-risks', { params: { limit } });
    const data = res.data;
    // 补充门店名和类型
    if (data && data.data && Array.isArray(data.data)) {
      data.data.forEach((item) => {
        const eq = EQUIPMENTS.find((e) => e.id === item.equipment_id);
        if (eq) {
          item.store_name = eq.store_name;
          item.equipment_type = eq.equipment_type;
        }
      });
    }
    return data;
  } catch (e) {
    await new Promise((r) => setTimeout(r, 300));
    const eqs = [...EQUIPMENTS]
      .map((eq) => ({
        ...eq,
        clean_risk_score: Math.round((Math.random() * 60 + 20) * 100) / 100,
        risk_level: '',
        anomaly_type: null,
        anomaly_reason: null,
        offline_minutes: Math.random() < 0.2 ? Math.floor(Math.random() * 300) : 0,
        inspection_score: Math.round((Math.random() * 30 + 65) * 10) / 10,
      }))
      .sort((a, b) => b.clean_risk_score - a.clean_risk_score)
      .slice(0, limit)
      .map((eq) => ({
        ...eq,
        risk_level:
          eq.clean_risk_score >= 80
            ? 'critical'
            : eq.clean_risk_score >= 70
            ? 'high'
            : eq.clean_risk_score >= 50
            ? 'medium'
            : 'low',
        anomaly_type:
          eq.clean_risk_score >= 70
            ? ANOMALY_TYPES[Math.floor(Math.random() * ANOMALY_TYPES.length)].type
            : null,
      }));
    return {
      code: 0,
      message: 'success',
      data: eqs,
    };
  }
}

// 获取清洁风险分布
export async function getCleanRiskDistribution() {
  try {
    const res = await request.get('/analytics/clean-risk/distribution');
    return res.data;
  } catch (e) {
    await new Promise((r) => setTimeout(r, 300));
    const total = EQUIPMENTS.length;
    const high = Math.ceil(total * 0.1);
    const medium = Math.ceil(total * 0.3);
    const low = total - high - medium;
    return {
      code: 0,
      message: 'success',
      data: {
        total_count: total,
        high_risk: { count: high, percentage: Math.round((high / total) * 10000) / 100 },
        medium_risk: { count: medium, percentage: Math.round((medium / total) * 10000) / 100 },
        low_risk: { count: low, percentage: Math.round((low / total) * 10000) / 100 },
      },
    };
  }
}

// 获取巡检合格率趋势（近8周）
export async function getInspectionTrend() {
  try {
    const res = await request.get('/analytics/inspection-trend');
    return res.data;
  } catch (e) {
    await new Promise((r) => setTimeout(r, 300));
    const baseDate = new Date('2026-05-01');
    const weeks = [];
    for (let i = 0; i < 8; i++) {
      const weekStart = new Date(baseDate);
      weekStart.setDate(baseDate.getDate() + i * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weeks.push({
        period_start: weekStart.toISOString().slice(0, 10),
        period_end: weekEnd.toISOString().slice(0, 10),
        week_label: `第${i + 1}周`,
        pass_rate: Math.round((Math.random() * 20 + 72) * 100) / 100,
        avg_score: Math.round((Math.random() * 15 + 75) * 100) / 100,
        total_inspections: Math.floor(Math.random() * 5 + 5),
      });
    }
    return {
      code: 0,
      message: 'success',
      data: weeks,
    };
  }
}

// 获取门店列表
export async function getStores() {
  return {
    code: 0,
    message: 'success',
    data: STORES,
  };
}

// 获取设备列表（按门店筛选）
export async function getEquipments(storeId = null) {
  let list = EQUIPMENTS;
  if (storeId) {
    list = EQUIPMENTS.filter((e) => e.store_id === storeId);
  }
  return {
    code: 0,
    message: 'success',
    data: list,
  };
}

// 获取清洁风险时序数据
export async function getCleanRiskTimeseries(params) {
  const { start_date, end_date, store_id, equipment_ids } = params;
  try {
    const res = await request.get('/analytics/clean-risk/timeseries', {
      params: {
        start_date,
        end_date,
        store_id: store_id || undefined,
        equipment_id: equipment_ids && equipment_ids.length > 0 ? equipment_ids[0] : undefined,
      },
    });
    return res.data;
  } catch (e) {
    await new Promise((r) => setTimeout(r, 500));
    const dates = generateDateList(start_date, 30);
    const timeseries = dates.map((date) => {
      const dayOfWeek = new Date(date).getDay();
      let baseRisk = 25 + Math.random() * 15;
      if (dayOfWeek === 5 || dayOfWeek === 6) {
        baseRisk += Math.random() * 15;
      }
      const highRiskCount = baseRisk >= 60 ? Math.floor(Math.random() * 3 + 1) : Math.floor(Math.random() * 2);
      const offlineMinutes = Math.random() < 0.15 ? Math.floor(Math.random() * 600) : 0;

      return {
        record_date: date,
        avg_risk_score: Math.round(baseRisk * 100) / 100,
        high_risk_count: highRiskCount,
        medium_risk_count: Math.floor(Math.random() * 4 + 1),
        low_risk_count: Math.floor(Math.random() * 6 + 5),
        total_equipment: EQUIPMENTS.length,
        offline_minutes: offlineMinutes,
        fault_count: Math.floor(Math.random() * 3),
      };
    });

    // 生成异常点
    const anomalies = [];
    timeseries.forEach((row) => {
      if (row.avg_risk_score >= 55 || Math.random() < 0.1) {
        const eq = EQUIPMENTS[Math.floor(Math.random() * EQUIPMENTS.length)];
        const at = ANOMALY_TYPES[Math.floor(Math.random() * ANOMALY_TYPES.length)];
        anomalies.push({
          id: anomalies.length + 1,
          equipment_id: eq.id,
          equipment_code: eq.equipment_code,
          equipment_type: eq.equipment_type,
          store_id: eq.store_id,
          store_name: eq.store_name,
          record_date: row.record_date,
          risk_score: Math.round((50 + Math.random() * 45) * 100) / 100,
          anomaly_type: at.type,
          anomaly_type_label: at.label,
          anomaly_reason: at.reason,
          status: ['online', 'warning', 'offline'][Math.floor(Math.random() * 3)],
          offline_minutes: at.type === 'offline_gap' ? Math.floor(Math.random() * 500 + 240) : Math.floor(Math.random() * 60),
          inspection_score: Math.round((Math.random() * 35 + 55) * 10) / 10,
          sample_ref: `samples/${eq.equipment_code}/${row.record_date}`,
        });
      }
    });

    // 生成延迟同步标注
    const syncDelays = [];
    for (let i = 0; i < Math.ceil(dates.length * 0.08); i++) {
      const dateIdx = Math.floor(Math.random() * dates.length);
      const types = [
        { type: '清洁指标', source: '物联网网关', desc: '设备数据采集链路网络抖动' },
        { type: '库存快照', source: 'ERP同步', desc: '库存系统夜间批处理延迟' },
        { type: 'POS数据', source: 'POS上传', desc: '门店网络高峰拥塞' },
      ];
      const t = types[Math.floor(Math.random() * types.length)];
      syncDelays.push({
        id: syncDelays.length + 1,
        data_type: t.type,
        source: t.source,
        delay_minutes: Math.floor(Math.random() * 400 + 35),
        affect_date: dates[dateIdx],
        description: t.desc,
      });
    }

    return {
      code: 0,
      message: 'success',
      data: {
        timeseries,
        anomalies,
        sync_delays: syncDelays,
      },
    };
  }
}

// 获取离线缺口样本详情
export async function getOfflineGapSamples(equipmentId, gapStart, gapEnd) {
  try {
    const res = await request.get('/analytics/offline-gap/samples', {
      params: {
        equipment_id: equipmentId,
        gap_start: gapStart,
        gap_end: gapEnd,
      },
    });
    return res.data;
  } catch (e) {
    await new Promise((r) => setTimeout(r, 500));
    const eq = EQUIPMENTS.find((e) => e.id === equipmentId) || EQUIPMENTS[0];
    const samples = [];
    const start = new Date(gapStart);
    const end = new Date(gapEnd);

    // 生成前后上下文（前5后5）
    const context = [];
    for (let i = -5; i <= 5; i++) {
      const d = new Date(start);
      d.setHours(start.getHours() + i);
      const inGap = d >= start && d <= end;
      context.push({
        timestamp: d.toISOString().replace('T', ' ').slice(0, 19),
        phase: i < 0 ? '缺口前' : inGap ? '缺口期间' : '缺口后',
        status: inGap ? 'offline' : 'online',
        risk_score: inGap
          ? null
          : Math.round((Math.random() * 40 + 20) * 100) / 100,
        sensor_data: inGap ? null : {
          brew_count: Math.floor(Math.random() * 100),
          steam_use_time: Math.floor(Math.random() * 200),
          last_clean_time: d.toISOString().slice(0, 10),
        },
        remark: inGap ? '数据缺失' : '正常采集',
      });
    }

    // 生成缺口期间的模拟样本
    for (let i = 0; i < 5; i++) {
      samples.push({
        id: i + 1,
        sample_time: new Date(start.getTime() + i * 3600000).toISOString().replace('T', ' ').slice(0, 19),
        expected_metrics: {
          brew_count: Math.floor(Math.random() * 50),
          avg_extract_time: Math.round((Math.random() * 5 + 20) * 10) / 10,
          clean_cycles: Math.floor(Math.random() * 3),
        },
        actual_received: '无数据',
        gap_status: '缺失',
      });
    }

    return {
      code: 0,
      message: 'success',
      data: {
        equipment: eq,
        gap_start: gapStart,
        gap_end: gapEnd,
        gap_duration_minutes: Math.round((end - start) / 60000),
        context_records: context,
        gap_samples: samples,
        analysis: {
          estimated_loss: {
            brew_count: Math.floor(Math.random() * 200 + 100),
            affected_hours: Math.round((end - start) / 3600000 * 10) / 10,
          },
          cause_deduction: [
            '门店网络中断',
            '设备网关断电重启',
            '数据采集服务异常',
          ][Math.floor(Math.random() * 3)],
        },
      },
    };
  }
}

export default {
  initMockData,
  getDashboardOverview,
  getTopRisks,
  getCleanRiskDistribution,
  getInspectionTrend,
  getStores,
  getEquipments,
  getCleanRiskTimeseries,
  getOfflineGapSamples,
};
