'use client';

import { useState, useMemo } from 'react';
import {
  ArrowLeft,
  RefreshCw,
  User,
  Package,
  Shield,
  Clock,
  FileText,
  Car,
  DollarSign,
  Plus,
  Camera,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/Card';
import Button from '@/components/Button';
import StatusBadge from '@/components/StatusBadge';
import DataTable from '@/components/DataTable';
import Modal from '@/components/Modal';
import Timeline from '@/components/Timeline';
import ConfirmModal from '@/components/ConfirmModal';
import { formatDate, formatCurrency, formatDateTime } from '@/lib/utils';
import { useProtectedRoute } from '@/hooks/useProtectedRoute';
import { useAuth } from '@/components/auth/AuthProvider';
import type {
  WorkOrder,
  Vehicle,
  User as UserType,
  PartRequest,
  QualityCheck,
  ServiceItem,
  PartUsage,
  OperationLog,
  Part,
} from '@/lib/types';

const mockWorkOrder: WorkOrder = {
  id: '1',
  orderNumber: 'WO202401001',
  vehicleId: '1',
  customerId: '1',
  customerName: '张三',
  customerPhone: '13800138001',
  advisorId: '1',
  technicianId: '2',
  status: 'inProgress',
  description: '发动机异响检修，车主反馈怠速时有明显异响，加速时声音加重。',
  serviceType: '维修',
  estimatedHours: 4,
  actualHours: 2.5,
  partsCost: 850,
  laborCost: 600,
  totalCost: 1450,
  createdAt: '2024-01-15T09:00:00Z',
  updatedAt: '2024-01-15T10:30:00Z',
};

const mockVehicle: Vehicle = {
  id: '1',
  licensePlate: '京A12345',
  vin: 'LFV2A21K5D4000001',
  brand: '丰田',
  model: '凯美瑞',
  year: 2020,
  color: '白色',
  mileage: 45000,
  customerId: '1',
  customerName: '张三',
  customerPhone: '13800138001',
  lastServiceDate: '2023-12-01T00:00:00Z',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const mockAdvisor: UserType = {
  id: '1',
  username: 'advisor1',
  name: '李顾问',
  email: 'advisor1@example.com',
  role: 'advisor',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const mockTechnician: UserType = {
  id: '2',
  username: 'tech2',
  name: '李技师',
  email: 'tech2@example.com',
  role: 'technician',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const mockServiceItems: ServiceItem[] = [
  {
    id: 'si1',
    workOrderId: '1',
    name: '发动机故障诊断',
    description: '使用专业诊断设备检测发动机异响原因',
    hours: 1.5,
    rate: 150,
    amount: 225,
    technicianId: '2',
    createdAt: '2024-01-15T09:30:00Z',
    updatedAt: '2024-01-15T09:30:00Z',
  },
  {
    id: 'si2',
    workOrderId: '1',
    name: '发动机皮带更换',
    description: '更换正时皮带及张紧轮',
    hours: 2.5,
    rate: 150,
    amount: 375,
    technicianId: '2',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
];

const mockParts: Record<string, Part> = {
  'p1': { id: 'p1', partNumber: 'P001', name: '正时皮带套装', category: '发动机', price: 450, cost: 320, stockQuantity: 5, minStockLevel: 3, unit: '套', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  'p2': { id: 'p2', partNumber: 'P002', name: '机油滤清器', category: '保养', price: 45, cost: 28, stockQuantity: 50, minStockLevel: 20, unit: '个', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  'p3': { id: 'p3', partNumber: 'P003', name: '空气滤清器', category: '保养', price: 65, cost: 42, stockQuantity: 30, minStockLevel: 15, unit: '个', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
};

const mockPartUsage: PartUsage[] = [
  {
    id: 'pu1',
    workOrderId: '1',
    partId: 'p1',
    quantity: 1,
    unitPrice: 450,
    amount: 450,
    partRequestId: 'pr1',
    createdAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'pu2',
    workOrderId: '1',
    partId: 'p2',
    quantity: 1,
    unitPrice: 45,
    amount: 45,
    createdAt: '2024-01-15T09:45:00Z',
  },
];

const mockPartRequests: PartRequest[] = [
  {
    id: 'pr1',
    requestNumber: 'PR202401001',
    workOrderId: '1',
    partId: 'p1',
    requestedBy: '2',
    approvedBy: '3',
    quantity: 1,
    status: 'fulfilled',
    notes: '发动机维修需要',
    createdAt: '2024-01-15T09:30:00Z',
    updatedAt: '2024-01-15T09:45:00Z',
    fulfilledAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'pr2',
    requestNumber: 'PR202401002',
    workOrderId: '1',
    partId: 'p3',
    requestedBy: '2',
    quantity: 1,
    status: 'pending',
    notes: '建议更换',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
];

const mockQualityChecks: QualityCheck[] = [
  {
    id: 'qc1',
    workOrderId: '1',
    checkedBy: '3',
    status: 'passed',
    items: [
      { id: 'qci1', name: '发动机运转平稳', status: 'passed', notes: '怠速稳定，无异响' },
      { id: 'qci2', name: '皮带张紧度', status: 'passed', notes: '张紧度适中' },
      { id: 'qci3', name: '外观检查', status: 'passed' },
    ],
    overallRating: 5,
    notes: '维修质量良好，客户已确认',
    createdAt: '2024-01-15T14:00:00Z',
    updatedAt: '2024-01-15T14:00:00Z',
  },
];

const mockOperationLogs: OperationLog[] = [
  {
    id: 'log1',
    workOrderId: '1',
    operatorId: '1',
    operationType: 'created',
    description: '创建工单',
    createdAt: '2024-01-15T09:00:00Z',
  },
  {
    id: 'log2',
    workOrderId: '1',
    operatorId: '1',
    operationType: 'statusChanged',
    description: '工单状态变更',
    oldValue: '待处理',
    newValue: '进行中',
    createdAt: '2024-01-15T09:15:00Z',
  },
  {
    id: 'log3',
    workOrderId: '1',
    operatorId: '1',
    operationType: 'technicianAssigned',
    description: '分派技师',
    newValue: '李技师',
    createdAt: '2024-01-15T09:20:00Z',
  },
  {
    id: 'log4',
    workOrderId: '1',
    operatorId: '2',
    operationType: 'partRequested',
    description: '申请配件：正时皮带套装 x1',
    createdAt: '2024-01-15T09:30:00Z',
  },
  {
    id: 'log5',
    workOrderId: '1',
    operatorId: '3',
    operationType: 'partApproved',
    description: '批准配件申请：PR202401001',
    createdAt: '2024-01-15T09:45:00Z',
  },
  {
    id: 'log6',
    workOrderId: '1',
    operatorId: '3',
    operationType: 'qualityCheckAdded',
    description: '添加质检记录，结果：通过',
    createdAt: '2024-01-15T14:00:00Z',
  },
];

const tabs = [
  { key: 'info', label: '基本信息', icon: FileText },
  { key: 'service', label: '服务项目', icon: Clock },
  { key: 'parts', label: '配件使用', icon: Package },
  { key: 'partRequests', label: '配件申请', icon: Package },
  { key: 'quality', label: '质检记录', icon: Shield },
  { key: 'logs', label: '操作日志', icon: RefreshCw },
];

const technicians = [
  { value: '1', label: '张技师' },
  { value: '2', label: '李技师' },
  { value: '3', label: '王技师' },
];

const statusOptions = [
  { value: 'pending', label: '待处理' },
  { value: 'inProgress', label: '进行中' },
  { value: 'completed', label: '已完成' },
  { value: 'cancelled', label: '已取消' },
];

export default function WorkOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthorized } = useProtectedRoute();
  const { hasRole } = useAuth();
  const [activeTab, setActiveTab] = useState('info');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showTechnicianModal, setShowTechnicianModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedTechnician, setSelectedTechnician] = useState('');
  const [confirmType, setConfirmType] = useState<'status' | 'technician'>('status');
  const [expandedQc, setExpandedQc] = useState<string | null>(null);

  if (!isAuthorized) {
    return null;
  }

  const timelineItems = useMemo(() => {
    return mockOperationLogs.map((log) => ({
      id: log.id,
      type: log.operationType,
      title: log.description,
      operatorName: log.operatorId === '1' ? '李顾问' : log.operatorId === '2' ? '李技师' : '王管理员',
      timestamp: log.createdAt,
      oldValue: log.oldValue,
      newValue: log.newValue,
    }));
  }, []);

  const handleStatusClick = (status: string) => {
    setSelectedStatus(status);
    setConfirmType('status');
    setShowConfirmModal(true);
  };

  const handleTechnicianClick = (techId: string) => {
    setSelectedTechnician(techId);
    setConfirmType('technician');
    setShowConfirmModal(true);
  };

  const handleConfirm = () => {
    console.log('确认操作:', confirmType, confirmType === 'status' ? selectedStatus : selectedTechnician);
    setShowConfirmModal(false);
    setShowStatusModal(false);
    setShowTechnicianModal(false);
  };

  const serviceItemColumns = [
    { key: 'name', title: '服务项目' },
    { key: 'description', title: '描述' },
    {
      key: 'hours',
      title: '工时',
      render: (row: ServiceItem) => `${row.hours} 小时`,
    },
    {
      key: 'rate',
      title: '工时单价',
      render: (row: ServiceItem) => formatCurrency(row.rate),
    },
    {
      key: 'amount',
      title: '金额',
      render: (row: ServiceItem) => (
        <span className="font-medium text-slate-900">{formatCurrency(row.amount)}</span>
      ),
    },
  ];

  const partUsageColumns = [
    {
      key: 'partName',
      title: '配件名称',
      render: (row: PartUsage) => mockParts[row.partId]?.name || row.partId,
    },
    {
      key: 'partNumber',
      title: '配件编号',
      render: (row: PartUsage) => mockParts[row.partId]?.partNumber || '-',
    },
    { key: 'quantity', title: '数量' },
    {
      key: 'unitPrice',
      title: '单价',
      render: (row: PartUsage) => formatCurrency(row.unitPrice),
    },
    {
      key: 'amount',
      title: '金额',
      render: (row: PartUsage) => (
        <span className="font-medium text-slate-900">{formatCurrency(row.amount)}</span>
      ),
    },
  ];

  const partRequestColumns = [
    { key: 'requestNumber', title: '申请单号' },
    {
      key: 'partName',
      title: '配件名称',
      render: (row: PartRequest) => mockParts[row.partId]?.name || row.partId,
    },
    { key: 'quantity', title: '数量' },
    {
      key: 'status',
      title: '状态',
      render: (row: PartRequest) => <StatusBadge status={row.status} />,
    },
    {
      key: 'source',
      title: '来源',
      render: () => <span className="text-slate-600">库存</span>,
    },
    {
      key: 'createdAt',
      title: '申请时间',
      render: (row: PartRequest) => formatDateTime(row.createdAt),
    },
  ];

  const totalLaborAmount = mockServiceItems.reduce((sum, item) => sum + item.amount, 0);
  const totalPartsAmount = mockPartUsage.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/work-orders"
            className="text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              工单详情 - {mockWorkOrder.orderNumber}
            </h2>
            <div className="mt-1 flex items-center gap-2">
              <StatusBadge status={mockWorkOrder.status} />
              <span className="text-sm text-slate-500">
                创建于 {formatDate(mockWorkOrder.createdAt)}
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {hasRole(['manager', 'advisor']) && (
            <>
              <Button variant="outline" onClick={() => setShowStatusModal(true)}>
                <RefreshCw className="mr-2 h-4 w-4" />
                改状态
              </Button>
              <Button variant="outline" onClick={() => setShowTechnicianModal(true)}>
                <User className="mr-2 h-4 w-4" />
                分派技师
              </Button>
            </>
          )}
          {hasRole(['technician', 'manager']) && (
            <Button variant="outline">
              <Package className="mr-2 h-4 w-4" />
              添加配件申请
            </Button>
          )}
          {hasRole(['manager', 'partsClerk']) && (
            <Button>
              <Shield className="mr-2 h-4 w-4" />
              添加质检记录
            </Button>
          )}
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto border-b border-slate-200 pb-px">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 whitespace-nowrap px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === tab.key
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'info' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>
                <span className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary-600" />
                  工单基本信息
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">工单号</p>
                  <p className="mt-1 font-medium">{mockWorkOrder.orderNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">服务类型</p>
                  <p className="mt-1 font-medium">{mockWorkOrder.serviceType}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">状态</p>
                  <div className="mt-1">
                    <StatusBadge status={mockWorkOrder.status} />
                  </div>
                </div>
                <div>
                  <p className="text-sm text-slate-500">创建时间</p>
                  <p className="mt-1 font-medium">{formatDateTime(mockWorkOrder.createdAt)}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">服务顾问</p>
                  <p className="mt-1 font-medium">{mockAdvisor.name}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">负责技师</p>
                  <p className="mt-1 font-medium">{mockTechnician?.name || '未分派'}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-slate-500">问题描述</p>
                <p className="mt-1 text-slate-700">{mockWorkOrder.description}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                <span className="flex items-center gap-2">
                  <Car className="h-5 w-5 text-primary-600" />
                  车辆信息
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">车牌号</p>
                  <p className="mt-1 font-mono font-medium">{mockVehicle.licensePlate}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">车辆识别码</p>
                  <p className="mt-1 font-mono text-sm">{mockVehicle.vin}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">品牌</p>
                  <p className="mt-1 font-medium">{mockVehicle.brand}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">型号</p>
                  <p className="mt-1 font-medium">{mockVehicle.model}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">年份</p>
                  <p className="mt-1 font-medium">{mockVehicle.year}款</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">颜色</p>
                  <p className="mt-1 font-medium">{mockVehicle.color}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">里程数</p>
                  <p className="mt-1 font-medium">{mockVehicle.mileage?.toLocaleString()} km</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">上次保养</p>
                  <p className="mt-1 font-medium">
                    {mockVehicle.lastServiceDate ? formatDate(mockVehicle.lastServiceDate) : '-'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                <span className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary-600" />
                  客户信息
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">客户姓名</p>
                  <p className="mt-1 font-medium">{mockWorkOrder.customerName}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">联系电话</p>
                  <p className="mt-1 font-medium">{mockWorkOrder.customerPhone}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                <span className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-primary-600" />
                  费用信息
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">工时费用</p>
                  <p className="mt-1 font-medium">{formatCurrency(totalLaborAmount)}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">配件费用</p>
                  <p className="mt-1 font-medium">{formatCurrency(totalPartsAmount)}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">预计工时</p>
                  <p className="mt-1 font-medium">{mockWorkOrder.estimatedHours} 小时</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">实际工时</p>
                  <p className="mt-1 font-medium">{mockWorkOrder.actualHours || '-'} 小时</p>
                </div>
              </div>
              <div className="rounded-lg bg-primary-50 p-4">
                <p className="text-sm text-primary-700">总费用</p>
                <p className="text-2xl font-bold text-primary-600">
                  {formatCurrency(totalLaborAmount + totalPartsAmount)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'service' && (
        <Card>
          <CardHeader>
            <CardTitle>服务项目 / 工时</CardTitle>
            {hasRole(['manager', 'advisor']) && (
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                添加服务项目
              </Button>
            )}
          </CardHeader>
          <CardContent className="p-0">
            <DataTable columns={serviceItemColumns} data={mockServiceItems} />
          </CardContent>
        </Card>
      )}

      {activeTab === 'parts' && (
        <Card>
          <CardHeader>
            <CardTitle>配件使用明细</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <DataTable columns={partUsageColumns} data={mockPartUsage} />
          </CardContent>
        </Card>
      )}

      {activeTab === 'partRequests' && (
        <Card>
          <CardHeader>
            <CardTitle>配件申请记录</CardTitle>
            {hasRole(['technician', 'manager']) && (
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                添加配件申请
              </Button>
            )}
          </CardHeader>
          <CardContent className="p-0">
            <DataTable columns={partRequestColumns} data={mockPartRequests} />
          </CardContent>
        </Card>
      )}

      {activeTab === 'quality' && (
        <div className="space-y-4">
          {mockQualityChecks.map((qc) => {
            const isExpanded = expandedQc === qc.id;
            return (
              <Card key={qc.id}>
                <CardHeader>
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-100 text-cyan-600">
                        <Shield className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle>质检记录</CardTitle>
                        <p className="text-sm text-slate-500">
                          {formatDateTime(qc.createdAt)} · 质检员：王管理员
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={qc.status} />
                      {qc.photos && qc.photos.length > 0 && (
                        <span className="flex items-center gap-1 text-sm text-slate-500">
                          <Camera className="h-4 w-4" />
                          {qc.photos.length}张照片
                        </span>
                      )}
                      <button
                        onClick={() => setExpandedQc(isExpanded ? null : qc.id)}
                        className="text-slate-500 hover:text-slate-700"
                      >
                        {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                </CardHeader>
                {isExpanded && (
                  <CardContent className="space-y-4 border-t border-slate-100">
                    <div className="space-y-2">
                      <h4 className="font-medium text-slate-900">质检项目</h4>
                      <div className="space-y-2">
                        {qc.items.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3"
                          >
                            <div>
                              <p className="font-medium text-slate-900">{item.name}</p>
                              {item.notes && (
                                <p className="text-sm text-slate-500">{item.notes}</p>
                              )}
                            </div>
                            <StatusBadge status={item.status} />
                          </div>
                        ))}
                      </div>
                    </div>
                    {qc.notes && (
                      <div>
                        <h4 className="font-medium text-slate-900">质检备注</h4>
                        <p className="mt-1 text-slate-600">{qc.notes}</p>
                      </div>
                    )}
                    {qc.overallRating && (
                      <div>
                        <h4 className="font-medium text-slate-900">综合评分</h4>
                        <p className="mt-1 text-lg font-bold text-amber-500">
                          {'★'.repeat(qc.overallRating)}
                          <span className="text-slate-300">{'★'.repeat(5 - qc.overallRating)}</span>
                        </p>
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {activeTab === 'logs' && (
        <Card>
          <CardHeader>
            <CardTitle>操作日志</CardTitle>
          </CardHeader>
          <CardContent>
            <Timeline items={timelineItems} />
          </CardContent>
        </Card>
      )}

      <Modal
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        title="更新工单状态"
        size="sm"
      >
        <div className="space-y-2">
          {statusOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handleStatusClick(option.value)}
              className="flex w-full items-center justify-between rounded-lg border border-slate-200 p-3 text-left transition-colors hover:bg-slate-50"
            >
              <StatusBadge status={option.value as any} />
            </button>
          ))}
        </div>
      </Modal>

      <Modal
        isOpen={showTechnicianModal}
        onClose={() => setShowTechnicianModal(false)}
        title="分派技师"
        size="sm"
      >
        <div className="space-y-2">
          {technicians.map((tech) => (
            <button
              key={tech.value}
              onClick={() => handleTechnicianClick(tech.value)}
              className="flex w-full items-center gap-3 rounded-lg border border-slate-200 p-3 text-left transition-colors hover:bg-slate-50"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-primary-600">
                <User className="h-5 w-5" />
              </div>
              <span className="font-medium">{tech.label}</span>
            </button>
          ))}
        </div>
      </Modal>

      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirm}
        title={confirmType === 'status' ? '确认更改状态' : '确认分派技师'}
        message={
          confirmType === 'status'
            ? `确定要将工单状态更改为"${statusOptions.find(s => s.value === selectedStatus)?.label}"吗？`
            : `确定要将工单分派给"${technicians.find(t => t.value === selectedTechnician)?.label}"吗？`
        }
        type="warning"
      />
    </div>
  );
}
