'use client';

import { useState } from 'react';
import { formatDate, formatCurrency } from '@/lib/utils';
import {
  User,
  Calendar,
  CreditCard,
  Image,
  FileText,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
} from 'lucide-react';

interface PatientDetailPanelProps {
  patient: {
    id: string;
    patientNo: string;
    name: string;
    gender: string | null;
    birthDate: string | null;
    phone: string | null;
    treatmentStage: string;
    doctor: string | null;
  };
  appointments: Array<{
    id: string;
    appointmentNo: string;
    appointmentDate: string;
    appointmentType: string | null;
    status: string;
    doctor: string | null;
    missedReason: string | null;
  }>;
  chargeRecords: Array<{
    id: string;
    chargeNo: string;
    chargeDate: string;
    amount: string;
    itemName: string;
    paymentStatus: string;
  }>;
  imageAttachments: Array<{
    id: string;
    fileName: string;
    fileType: string;
    fileUrl: string;
    category: string | null;
    uploadDate: string;
    description: string | null;
  }>;
  noteTasks: Array<{
    id: string;
    title: string;
    description: string | null;
    priority: string;
    status: string;
    conclusion: string | null;
    createdAt: string;
  }>;
  revisitAnalysis: {
    totalAppointments: number;
    completedAppointments: number;
    missedAppointments: number;
    revisitRate: number;
    warningLevel: string;
  };
}

type TabType = 'profile' | 'appointments' | 'charges' | 'images' | 'notes';

const statusConfig: Record<string, { label: string; className: string; icon: any }> = {
  SCHEDULED: { label: '已预约', className: 'badge-info', icon: Clock },
  COMPLETED: { label: '已完成', className: 'badge-success', icon: CheckCircle },
  MISSED: { label: '爽约', className: 'badge-danger', icon: XCircle },
  CANCELLED: { label: '已取消', className: 'badge-warning', icon: AlertCircle },
  RESCHEDULED: { label: '已改约', className: 'badge-info', icon: Calendar },
};

const paymentStatusConfig: Record<string, { label: string; className: string }> = {
  PENDING: { label: '待支付', className: 'badge-warning' },
  PAID: { label: '已支付', className: 'badge-success' },
  PARTIAL: { label: '部分支付', className: 'badge-info' },
  REFUNDED: { label: '已退款', className: 'badge-danger' },
};

const priorityConfig: Record<string, { label: string; className: string }> = {
  LOW: { label: '低', className: 'badge-info' },
  MEDIUM: { label: '中', className: 'badge-warning' },
  HIGH: { label: '高', className: 'badge-danger' },
  URGENT: { label: '紧急', className: 'badge-danger' },
};

const taskStatusConfig: Record<string, { label: string; className: string }> = {
  PENDING: { label: '待处理', className: 'badge-warning' },
  IN_PROGRESS: { label: '处理中', className: 'badge-info' },
  COMPLETED: { label: '已完成', className: 'badge-success' },
  CANCELLED: { label: '已取消', className: 'badge-secondary' },
};

const stageNames: Record<string, string> = {
  CONSULTATION: '初诊咨询',
  DIAGNOSIS: '检查诊断',
  TREATMENT_PLANNING: '方案设计',
  BRACKET_PLACEMENT: '托槽佩戴',
  ACTIVE_TREATMENT: '正畸治疗中',
  RETENTION: '保持期',
  COMPLETED: '治疗完成',
};

export function PatientDetailPanel({
  patient,
  appointments,
  chargeRecords,
  imageAttachments,
  noteTasks,
  revisitAnalysis,
}: PatientDetailPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('profile');

  const tabs = [
    { key: 'profile', label: '患者档案', icon: User },
    { key: 'appointments', label: '预约记录', icon: Calendar },
    { key: 'charges', label: '收费明细', icon: CreditCard },
    { key: 'images', label: '影像附件', icon: Image },
    { key: 'notes', label: '备注任务', icon: FileText },
  ];

  return (
    <div className="card h-full flex flex-col">
      <div className="card-header">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-800">
              {patient.name}
              <span className="ml-2 text-sm font-normal text-slate-500">
                ({patient.patientNo})
              </span>
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              {stageNames[patient.treatmentStage] || patient.treatmentStage} · {patient.doctor || '未分配医生'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-slate-800">
              {revisitAnalysis.revisitRate.toFixed(1)}%
            </p>
            <p className="text-xs text-slate-500">复诊率</p>
          </div>
        </div>
      </div>

      <div className="flex border-b border-slate-100">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as TabType)}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-3 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'text-primary-600 border-b-2 border-primary-500 bg-primary-50/50'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            <tab.icon size={16} />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'profile' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-500">性别</p>
                <p className="text-sm font-medium text-slate-800">
                  {patient.gender || '-'}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">出生日期</p>
                <p className="text-sm font-medium text-slate-800">
                  {formatDate(patient.birthDate)}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">联系电话</p>
                <p className="text-sm font-medium text-slate-800">
                  {patient.phone || '-'}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">主治医生</p>
                <p className="text-sm font-medium text-slate-800">
                  {patient.doctor || '-'}
                </p>
              </div>
            </div>
            <div className="pt-4 border-t border-slate-100">
              <h4 className="text-sm font-medium text-slate-700 mb-3">复诊统计</h4>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-50 rounded-lg p-3 text-center">
                  <p className="text-xl font-bold text-slate-800">
                    {revisitAnalysis.totalAppointments}
                  </p>
                  <p className="text-xs text-slate-500">总预约</p>
                </div>
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <p className="text-xl font-bold text-green-600">
                    {revisitAnalysis.completedAppointments}
                  </p>
                  <p className="text-xs text-green-600">已完成</p>
                </div>
                <div className="bg-red-50 rounded-lg p-3 text-center">
                  <p className="text-xl font-bold text-red-600">
                    {revisitAnalysis.missedAppointments}
                  </p>
                  <p className="text-xs text-red-600">爽约</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'appointments' && (
          <div className="space-y-3">
            {appointments.length === 0 ? (
              <p className="text-center text-slate-400 py-8">暂无预约记录</p>
            ) : (
              appointments.map((apt) => {
                const status = statusConfig[apt.status] || statusConfig.SCHEDULED;
                const StatusIcon = status.icon;
                return (
                  <div
                    key={apt.id}
                    className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg"
                  >
                    <div
                      className={`p-2 rounded-lg ${
                        apt.status === 'MISSED' ? 'bg-red-100' : 'bg-primary-100'
                      }`}
                    >
                      <Calendar
                        size={16}
                        className={
                          apt.status === 'MISSED' ? 'text-red-600' : 'text-primary-600'
                        }
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-slate-800">
                          {apt.appointmentType || '常规复诊'}
                        </p>
                        <span className={`badge ${status.className}`}>
                          <StatusIcon size={12} className="mr-1" />
                          {status.label}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500 mt-1">
                        {formatDate(apt.appointmentDate)}
                      </p>
                      {apt.missedReason && (
                        <p className="text-xs text-red-500 mt-1">
                          爽约原因：{apt.missedReason}
                        </p>
                      )}
                      {apt.doctor && (
                        <p className="text-xs text-slate-400 mt-1">医生：{apt.doctor}</p>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {activeTab === 'charges' && (
          <div className="space-y-3">
            {chargeRecords.length === 0 ? (
              <p className="text-center text-slate-400 py-8">暂无收费记录</p>
            ) : (
              chargeRecords.map((charge) => {
                const status = paymentStatusConfig[charge.paymentStatus] || paymentStatusConfig.PENDING;
                return (
                  <div
                    key={charge.id}
                    className="flex items-start justify-between p-3 bg-slate-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-slate-800">{charge.itemName}</p>
                      <p className="text-sm text-slate-500 mt-1">
                        {formatDate(charge.chargeDate)} · {charge.chargeNo}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-800">
                        {formatCurrency(charge.amount)}
                      </p>
                      <span className={`badge ${status.className} mt-1`}>
                        {status.label}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {activeTab === 'images' && (
          <div className="grid grid-cols-2 gap-3">
            {imageAttachments.length === 0 ? (
              <p className="col-span-2 text-center text-slate-400 py-8">暂无影像附件</p>
            ) : (
              imageAttachments.map((img) => (
                <div
                  key={img.id}
                  className="aspect-square bg-slate-100 rounded-lg overflow-hidden relative group cursor-pointer"
                >
                  <img
                    src={img.fileUrl}
                    alt={img.fileName}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-end">
                    <div className="p-2 w-full">
                      <p className="text-white text-xs truncate">{img.fileName}</p>
                      <p className="text-white/70 text-xs">{img.category || '未分类'}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'notes' && (
          <div className="space-y-3">
            {noteTasks.length === 0 ? (
              <p className="text-center text-slate-400 py-8">暂无备注任务</p>
            ) : (
              noteTasks.map((task) => {
                const priority = priorityConfig[task.priority] || priorityConfig.MEDIUM;
                const status = taskStatusConfig[task.status] || taskStatusConfig.PENDING;
                return (
                  <div
                    key={task.id}
                    className="p-3 bg-slate-50 rounded-lg border-l-4 border-primary-500"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-slate-800">{task.title}</h4>
                      <div className="flex gap-1">
                        <span className={`badge ${priority.className}`}>
                          {priority.label}优先
                        </span>
                        <span className={`badge ${status.className}`}>{status.label}</span>
                      </div>
                    </div>
                    {task.description && (
                      <p className="text-sm text-slate-600 mt-2">{task.description}</p>
                    )}
                    {task.conclusion && (
                      <div className="mt-2 p-2 bg-green-50 rounded-md">
                        <p className="text-xs text-green-700 font-medium">处理结论</p>
                        <p className="text-sm text-green-800 mt-1">{task.conclusion}</p>
                      </div>
                    )}
                    <p className="text-xs text-slate-400 mt-2">
                      创建于 {formatDate(task.createdAt)}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
