import type { DocumentType, TurnoverStage, RiskLevel } from '@shared/types';
import type { LucideIcon } from 'lucide-react';
import {
  Car,
  FileText,
  Receipt,
  ShieldCheck,
  FileSpreadsheet,
  Folder,
  Package,
  Wrench,
  CarFront,
  DollarSign,
  Handshake,
  FileCheck,
} from 'lucide-react';

interface DocumentTypeMeta {
  key: DocumentType;
  label: string;
  icon: LucideIcon;
}

interface StageMeta {
  key: TurnoverStage;
  label: string;
  color: string;
}

interface RiskColors {
  low: string;
  medium: string;
  high: string;
  critical: string;
}

export const DOCUMENT_TYPES: DocumentTypeMeta[] = [
  { key: 'driving_license', label: '行驶证', icon: Car },
  { key: 'registration_cert', label: '登记证', icon: FileText },
  { key: 'purchase_tax', label: '购置税完税证明', icon: Receipt },
  { key: 'insurance_policy', label: '交强险保单', icon: ShieldCheck },
  { key: 'invoice', label: '购车发票', icon: FileSpreadsheet },
  { key: 'other', label: '其他材料', icon: Folder },
];

export const STAGE_META: StageMeta[] = [
  { key: 'inbound', label: '入库', color: '#3B82F6' },
  { key: 'preparation', label: '整备中', color: '#F59E0B' },
  { key: 'test_drive', label: '试驾中', color: '#8B5CF6' },
  { key: 'quoting', label: '报价中', color: '#10B981' },
  { key: 'deal', label: '已成交', color: '#6366F1' },
  { key: 'transfer', label: '已过户', color: '#64748B' },
];

export const STAGE_ICONS: Record<TurnoverStage, LucideIcon> = {
  inbound: Package,
  preparation: Wrench,
  test_drive: CarFront,
  quoting: DollarSign,
  deal: Handshake,
  transfer: FileCheck,
};

export const RISK_COLORS: Record<RiskLevel, string> = {
  low: '#10B981',
  medium: '#F59E0B',
  high: '#EF4444',
  critical: '#7F1D1D',
};

export const RISK_LABELS: Record<RiskLevel, string> = {
  low: '低风险',
  medium: '中风险',
  high: '高风险',
  critical: '严重风险',
};

export const STOCK_AGE_BUCKETS: string[] = ['0-7', '8-15', '16-30', '31+'];

export const COMPLETION_BUCKETS: string[] = ['0-25', '26-50', '51-75', '76-100'];
