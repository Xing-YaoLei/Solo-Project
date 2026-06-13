import {
  User,
  ImportBatch,
  Inventory,
  Transaction,
  Review,
  HandOrder,
  InventoryUsage,
} from '@/types';
import { MOCK_MANAGER, MOCK_TECHNICIANS, MOCK_INVENTORIES } from './mockConstants';

class MockStore {
  private static instance: MockStore;
  private _users: User[] = [MOCK_MANAGER, ...MOCK_TECHNICIANS];
  private _batches: ImportBatch[] = [];
  private _inventories: Inventory[] = [...MOCK_INVENTORIES];
  private _transactions: Transaction[] = [];
  private _reviews: Review[] = [];
  private _orders: HandOrder[] = [];
  private _inventoryUsages: InventoryUsage[] = [];

  private constructor() {}

  static getInstance(): MockStore {
    if (!MockStore.instance) {
      MockStore.instance = new MockStore();
    }
    return MockStore.instance;
  }

  reset(): void {
    this._batches = [];
    this._transactions = [];
    this._reviews = [];
    this._orders = [];
    this._inventoryUsages = [];
    this._inventories = [...MOCK_INVENTORIES];
  }

  get users(): User[] {
    return this._users;
  }

  get batches(): ImportBatch[] {
    return this._batches;
  }

  get inventories(): Inventory[] {
    return this._inventories;
  }

  get transactions(): Transaction[] {
    return this._transactions;
  }

  get reviews(): Review[] {
    return this._reviews;
  }

  get orders(): HandOrder[] {
    return this._orders;
  }

  get inventoryUsages(): InventoryUsage[] {
    return this._inventoryUsages;
  }

  addBatch(batch: ImportBatch): void {
    this._batches.unshift(batch);
  }

  updateBatch(batchId: string, updates: Partial<ImportBatch>): void {
    const idx = this._batches.findIndex(b => b.id === batchId);
    if (idx >= 0) {
      this._batches[idx] = { ...this._batches[idx], ...updates };
    }
  }

  addInventories(items: Inventory[]): void {
    this._inventories.push(...items);
  }

  addTransactions(items: Transaction[]): void {
    this._transactions.push(...items);
  }

  addReviews(items: Review[]): void {
    this._reviews.push(...items);
  }

  upsertOrder(order: HandOrder): void {
    const idx = this._orders.findIndex(o => o.handNo === order.handNo);
    if (idx >= 0) {
      this._orders[idx] = { ...this._orders[idx], ...order };
    } else {
      this._orders.push(order);
    }
  }

  updateOrderByHandNo(handNo: string, updates: Partial<HandOrder>): void {
    const idx = this._orders.findIndex(o => o.handNo === handNo);
    if (idx >= 0) {
      this._orders[idx] = { ...this._orders[idx], ...updates };
    }
  }

  addInventoryUsage(usage: InventoryUsage): void {
    this._inventoryUsages.push(usage);
  }

  updateInventoryUsage(usageId: string, updates: Partial<InventoryUsage>): void {
    const idx = this._inventoryUsages.findIndex(u => u.id === usageId);
    if (idx >= 0) {
      this._inventoryUsages[idx] = { ...this._inventoryUsages[idx], ...updates };
    }
  }

  getUserById(id: string): User | undefined {
    return this._users.find(u => u.id === id);
  }

  getInventoryById(id: string): Inventory | undefined {
    return this._inventories.find(i => i.id === id);
  }
}

export const mockStore = MockStore.getInstance();
