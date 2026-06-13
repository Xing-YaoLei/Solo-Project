import { User, Inventory } from '@/types';

export const MOCK_TECHNICIANS: User[] = [
  { id: '2', email: 'tech1@beauty.com', name: '李美容师', role: 'TECHNICIAN', createdAt: new Date() },
  { id: '3', email: 'tech2@beauty.com', name: '王美容师', role: 'TECHNICIAN', createdAt: new Date() },
  { id: '4', email: 'tech3@beauty.com', name: '陈美容师', role: 'TECHNICIAN', createdAt: new Date() },
];

export const MOCK_INVENTORIES: Inventory[] = [
  { id: 'inv1', batchId: 'batch-seed-inv', skuCode: 'SKU001', productName: '玻尿酸精华液', category: '护肤精华', unit: '瓶', stockQuantity: 100, unitPrice: 298, importedAt: new Date() },
  { id: 'inv2', batchId: 'batch-seed-inv', skuCode: 'SKU002', productName: '烟酰胺原液', category: '护肤精华', unit: '瓶', stockQuantity: 80, unitPrice: 198, importedAt: new Date() },
  { id: 'inv3', batchId: 'batch-seed-inv', skuCode: 'SKU003', productName: '补水保湿面膜', category: '面膜', unit: '片', stockQuantity: 500, unitPrice: 38, importedAt: new Date() },
  { id: 'inv4', batchId: 'batch-seed-inv', skuCode: 'SKU004', productName: '胶原蛋白面霜', category: '面霜', unit: '瓶', stockQuantity: 60, unitPrice: 458, importedAt: new Date() },
  { id: 'inv5', batchId: 'batch-seed-inv', skuCode: 'SKU005', productName: '清洁洁面乳', category: '洁面', unit: '支', stockQuantity: 120, unitPrice: 128, importedAt: new Date() },
  { id: 'inv6', batchId: 'batch-seed-inv', skuCode: 'SKU006', productName: '抗皱眼霜', category: '眼部护理', unit: '瓶', stockQuantity: 45, unitPrice: 598, importedAt: new Date() },
  { id: 'inv7', batchId: 'batch-seed-inv', skuCode: 'SKU007', productName: '舒缓爽肤水', category: '化妆水', unit: '瓶', stockQuantity: 90, unitPrice: 188, importedAt: new Date() },
  { id: 'inv8', batchId: 'batch-seed-inv', skuCode: 'SKU008', productName: '防晒隔离霜', category: '防晒', unit: '瓶', stockQuantity: 70, unitPrice: 268, importedAt: new Date() },
];

export const MOCK_MANAGER: User = {
  id: '1',
  email: 'manager@beauty.com',
  name: '店长',
  role: 'MANAGER',
  createdAt: new Date(),
};

export const SERVICE_ITEMS = [
  '深层补水护理', '抗衰紧致护理', '美白亮肤护理', '清洁祛痘护理',
  '眼部护理', '颈部护理', '面部按摩', 'SPA水疗',
];

export const CUSTOMERS = [
  '王女士', '李女士', '张女士', '刘女士', '陈女士',
  '杨女士', '赵女士', '黄女士', '周女士', '吴女士',
];

export const FOLLOWUP_SCRIPTS = [
  'V1-关心回访', 'V2-效果询问', 'V3-满意度调查',
];
