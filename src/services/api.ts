import type {
  MaterialBatch,
  InventoryRecord,
  Supplier,
  UsageRule,
  InventoryThreshold,
  ShortageOrder,
  ShortageActionLog,
  SafetyStockConfig,
  DashboardStats,
  TurnoverAnalysis,
  InventoryQueryParams,
  PaginatedResponse,
  TimelineEvent,
  TrendData,
} from '@/types';
import {
  mockBatches,
  mockInventoryRecords,
  mockSuppliers,
  mockUsageRules,
  mockThresholds,
  mockShortageOrders,
  mockShortageLogs,
  mockSafetyStock,
  mockDashboardStats,
  mockTurnoverAnalysis,
  mockTrendData,
  getBatchTimeline,
} from '@/mock/data';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const api = {
  async getDashboardStats(): Promise<DashboardStats> {
    await delay(300);
    return mockDashboardStats;
  },

  async getInventory(params: InventoryQueryParams): Promise<PaginatedResponse<MaterialBatch>> {
    await delay(400);
    let items = [...mockBatches];

    if (params.status && params.status.length > 0) {
      items = items.filter(b => params.status!.includes(b.status));
    }
    if (params.region && params.region.length > 0) {
      items = items.filter(b => params.region!.includes(b.region));
    }
    if (params.responsiblePerson && params.responsiblePerson.length > 0) {
      items = items.filter(b => params.responsiblePerson!.includes(b.responsiblePerson));
    }
    if (params.category && params.category.length > 0) {
      items = items.filter(b => params.category!.includes(b.category));
    }
    if (params.dateRange) {
      const [start, end] = params.dateRange;
      items = items.filter(b => b.inDate >= start && b.inDate <= end);
    }
    if (params.keyword) {
      const kw = params.keyword.toLowerCase();
      items = items.filter(b =>
        b.materialName.toLowerCase().includes(kw) ||
        b.batchNo.toLowerCase().includes(kw) ||
        b.supplierName.toLowerCase().includes(kw)
      );
    }
    if (params.sortBy) {
      const order = params.sortOrder === 'asc' ? 1 : -1;
      items.sort((a, b) => {
        const aVal = a[params.sortBy as keyof MaterialBatch];
        const bVal = b[params.sortBy as keyof MaterialBatch];
        if (aVal === undefined || bVal === undefined) return 0;
        if (aVal < bVal) return -1 * order;
        if (aVal > bVal) return 1 * order;
        return 0;
      });
    }

    const page = params.page || 1;
    const pageSize = params.pageSize || 10;
    const total = items.length;
    const start = (page - 1) * pageSize;
    const paginatedItems = items.slice(start, start + pageSize);

    return {
      items: paginatedItems,
      total,
      page,
      pageSize,
    };
  },

  async getBatchDetail(id: string): Promise<MaterialBatch | null> {
    await delay(200);
    return mockBatches.find(b => b.id === id) || null;
  },

  async getBatchRecords(batchId: string): Promise<InventoryRecord[]> {
    await delay(200);
    return mockInventoryRecords.filter(r => r.batchId === batchId);
  },

  async getBatchTimeline(batchId: string): Promise<TimelineEvent[]> {
    await delay(200);
    return getBatchTimeline(batchId);
  },

  async createBatch(data: Partial<MaterialBatch>): Promise<MaterialBatch> {
    await delay(300);
    const newBatch: MaterialBatch = {
      ...data,
      id: `batch-${Date.now()}`,
      batchNo: `M${Date.now().toString().slice(-8)}`,
      status: 'in_stock',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as MaterialBatch;
    mockBatches.unshift(newBatch);
    return newBatch;
  },

  async getSuppliers(): Promise<Supplier[]> {
    await delay(200);
    return mockSuppliers;
  },

  async createSupplier(data: Partial<Supplier>): Promise<Supplier> {
    await delay(300);
    const newSupplier: Supplier = {
      ...data,
      id: `sup-${Date.now()}`,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as Supplier;
    mockSuppliers.unshift(newSupplier);
    return newSupplier;
  },

  async updateSupplier(id: string, data: Partial<Supplier>): Promise<Supplier> {
    await delay(300);
    const index = mockSuppliers.findIndex(s => s.id === id);
    if (index !== -1) {
      mockSuppliers[index] = { ...mockSuppliers[index], ...data, updatedAt: new Date().toISOString() };
      return mockSuppliers[index];
    }
    throw new Error('Supplier not found');
  },

  async getUsageRules(): Promise<UsageRule[]> {
    await delay(200);
    return mockUsageRules;
  },

  async createUsageRule(data: Partial<UsageRule>): Promise<UsageRule> {
    await delay(300);
    const newRule: UsageRule = {
      ...data,
      id: `rule-${Date.now()}`,
      createdAt: new Date().toISOString(),
    } as UsageRule;
    mockUsageRules.push(newRule);
    return newRule;
  },

  async updateUsageRule(id: string, data: Partial<UsageRule>): Promise<UsageRule> {
    await delay(300);
    const index = mockUsageRules.findIndex(r => r.id === id);
    if (index !== -1) {
      mockUsageRules[index] = { ...mockUsageRules[index], ...data };
      return mockUsageRules[index];
    }
    throw new Error('Rule not found');
  },

  async getThresholds(): Promise<InventoryThreshold[]> {
    await delay(200);
    return mockThresholds;
  },

  async createThreshold(data: Partial<InventoryThreshold>): Promise<InventoryThreshold> {
    await delay(300);
    const newThreshold: InventoryThreshold = {
      ...data,
      id: `thresh-${Date.now()}`,
      createdAt: new Date().toISOString(),
    } as InventoryThreshold;
    mockThresholds.push(newThreshold);
    return newThreshold;
  },

  async updateThreshold(id: string, data: Partial<InventoryThreshold>): Promise<InventoryThreshold> {
    await delay(300);
    const index = mockThresholds.findIndex(t => t.id === id);
    if (index !== -1) {
      mockThresholds[index] = { ...mockThresholds[index], ...data };
      return mockThresholds[index];
    }
    throw new Error('Threshold not found');
  },

  async getShortageOrders(params?: { status?: string; priority?: string }): Promise<ShortageOrder[]> {
    await delay(300);
    let items = [...mockShortageOrders];
    if (params?.status) {
      items = items.filter(s => s.status === params.status);
    }
    if (params?.priority) {
      items = items.filter(s => s.priority === params.priority);
    }
    return items.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  },

  async getShortageDetail(id: string): Promise<ShortageOrder | null> {
    await delay(200);
    return mockShortageOrders.find(s => s.id === id) || null;
  },

  async getShortageLogs(shortageId: string): Promise<ShortageActionLog[]> {
    await delay(200);
    return mockShortageLogs.filter(l => l.shortageId === shortageId);
  },

  async handleShortageAction(shortageId: string, action: 'supplement' | 'retry' | 'close', data: { remark: string; quantity?: number }): Promise<ShortageActionLog> {
    await delay(300);
    const shortage = mockShortageOrders.find(s => s.id === shortageId);
    if (!shortage) throw new Error('Shortage not found');

    const statusMap = {
      supplement: 'supplemented' as const,
      retry: 'processing' as const,
      close: 'closed' as const,
    };
    shortage.status = statusMap[action];
    shortage.updatedAt = new Date().toISOString();

    const newLog: ShortageActionLog = {
      id: `log-${Date.now()}`,
      shortageId,
      action,
      operatorId: 'user-1',
      operator: '系统管理员',
      remark: data.remark,
      supplementQuantity: data.quantity,
      createdAt: new Date().toISOString(),
    };
    mockShortageLogs.push(newLog);
    return newLog;
  },

  async getSafetyStock(): Promise<SafetyStockConfig[]> {
    await delay(300);
    return mockSafetyStock;
  },

  async updateSafetyStock(id: string, data: Partial<SafetyStockConfig>): Promise<SafetyStockConfig> {
    await delay(300);
    const index = mockSafetyStock.findIndex(s => s.id === id);
    if (index !== -1) {
      mockSafetyStock[index] = { ...mockSafetyStock[index], ...data, updatedAt: new Date().toISOString() };
      return mockSafetyStock[index];
    }
    throw new Error('Safety stock config not found');
  },

  async getTurnoverAnalysis(dimension?: 'material' | 'region' | 'person'): Promise<TurnoverAnalysis[]> {
    await delay(400);
    if (dimension) {
      return mockTurnoverAnalysis.filter(t => t.dimension === dimension);
    }
    return mockTurnoverAnalysis;
  },

  async getTrendData(days: number = 30): Promise<TrendData[]> {
    await delay(300);
    return mockTrendData.slice(-days);
  },

  async createInventoryRecord(batchId: string, data: { type: string; quantity: number; remark: string }): Promise<InventoryRecord> {
    await delay(300);
    const newRecord: InventoryRecord = {
      id: `record-${Date.now()}`,
      batchId,
      type: data.type as any,
      quantity: data.quantity,
      operatorId: 'user-1',
      operator: '系统管理员',
      region: mockBatches.find(b => b.id === batchId)?.region || '',
      remark: data.remark,
      createdAt: new Date().toISOString(),
    };
    mockInventoryRecords.push(newRecord);
    return newRecord;
  },

  async getBatchById(id: string): Promise<MaterialBatch> {
    await delay(200);
    const batch = mockBatches.find(b => b.id === id);
    if (!batch) throw new Error('Batch not found');
    return batch;
  },

  async getInventoryRecords(batchId: string): Promise<InventoryRecord[]> {
    return this.getBatchRecords(batchId);
  },

  async getShortagesByBatch(batchId: string): Promise<ShortageOrder[]> {
    await delay(200);
    return mockShortageOrders.filter(s => s.batchId === batchId);
  },

  async getBatchTimelineEvents(batchId: string): Promise<TimelineEvent[]> {
    await delay(200);
    return getBatchTimeline(batchId);
  },

  async getShortages(): Promise<ShortageOrder[]> {
    return this.getShortageOrders();
  },

  async getShortageById(id: string): Promise<ShortageOrder> {
    await delay(200);
    const shortage = mockShortageOrders.find(s => s.id === id);
    if (!shortage) throw new Error('Shortage not found');
    return shortage;
  },

  async handleShortage(shortageId: string, action: 'supplement' | 'retry' | 'close', data: { remark: string; supplementQuantity?: number }): Promise<ShortageActionLog> {
    return this.handleShortageAction(shortageId, action, {
      remark: data.remark,
      quantity: data.supplementQuantity,
    });
  },

  async getInventoryThresholds(): Promise<InventoryThreshold[]> {
    await delay(300);
    return mockThresholds;
  },
};
