'use client';

import { cn, formatDate } from '@/lib/utils';
import { AlertTriangle, AlertCircle, CheckCircle, User } from 'lucide-react';

interface Patient {
  id: string;
  patientNo: string;
  name: string;
  gender: string | null;
  treatmentStage: string;
  doctor: string | null;
  missedCount?: number;
  revisitRate?: number;
  warningLevel?: 'normal' | 'warning' | 'critical';
  lastAppointmentDate?: string | null;
}

interface PatientListProps {
  patients: Patient[];
  selectedPatientId?: string;
  onSelectPatient: (patientId: string) => void;
  loading?: boolean;
}

const stageNames: Record<string, string> = {
  CONSULTATION: '初诊咨询',
  DIAGNOSIS: '检查诊断',
  TREATMENT_PLANNING: '方案设计',
  BRACKET_PLACEMENT: '托槽佩戴',
  ACTIVE_TREATMENT: '正畸治疗中',
  RETENTION: '保持期',
  COMPLETED: '治疗完成',
};

const warningConfig = {
  normal: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    icon: CheckCircle,
    iconColor: 'text-green-500',
    badge: 'badge-success',
    label: '正常',
  },
  warning: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    icon: AlertCircle,
    iconColor: 'text-yellow-500',
    badge: 'badge-warning',
    label: '预警',
  },
  critical: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    icon: AlertTriangle,
    iconColor: 'text-red-500',
    badge: 'badge-danger',
    label: '严重',
  },
};

export function PatientList({
  patients,
  selectedPatientId,
  onSelectPatient,
  loading,
}: PatientListProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-20 bg-slate-100 rounded-xl" />
          </div>
        ))}
      </div>
    );
  }

  if (patients.length === 0) {
    return (
      <div className="text-center py-12">
        <User size={48} className="mx-auto text-slate-300 mb-3" />
        <p className="text-slate-400">暂无患者数据</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {patients.map((patient) => {
        const warningLevel = patient.warningLevel || 'normal';
        const config = warningConfig[warningLevel];
        const WarningIcon = config.icon;
        const isSelected = selectedPatientId === patient.id;

        return (
          <div
            key={patient.id}
            onClick={() => onSelectPatient(patient.id)}
            className={cn(
              'p-4 rounded-xl border cursor-pointer transition-all hover:shadow-md',
              isSelected
                ? 'border-primary-500 bg-primary-50/50 shadow-md'
                : cn('border-slate-200 bg-white hover:border-slate-300'),
              warningLevel !== 'normal' && !isSelected && cn(config.bg, config.border)
            )}
          >
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  'p-2 rounded-lg flex-shrink-0',
                  isSelected ? 'bg-primary-100' : config.bg
                )}
              >
                <User
                  size={20}
                  className={isSelected ? 'text-primary-600' : config.iconColor}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-slate-800 truncate">
                    {patient.name}
                    <span className="ml-1 font-normal text-slate-400 text-sm">
                      {patient.patientNo}
                    </span>
                  </h4>
                  {warningLevel !== 'normal' && (
                    <span className={`badge ${config.badge} flex-shrink-0`}>
                      <WarningIcon size={12} className="mr-1" />
                      {config.label}
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-500 mt-1">
                  {stageNames[patient.treatmentStage] || patient.treatmentStage}
                  {patient.doctor && ` · ${patient.doctor}`}
                </p>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-3">
                    {patient.missedCount !== undefined && (
                      <span className="text-xs text-slate-400">
                        爽约 <span className="font-medium text-red-500">{patient.missedCount}</span> 次
                      </span>
                    )}
                    {patient.revisitRate !== undefined && (
                      <span className="text-xs text-slate-400">
                        复诊率{' '}
                        <span
                          className={cn(
                            'font-medium',
                            patient.revisitRate >= 70
                              ? 'text-green-600'
                              : patient.revisitRate >= 50
                              ? 'text-yellow-600'
                              : 'text-red-600'
                          )}
                        >
                          {patient.revisitRate.toFixed(1)}%
                        </span>
                      </span>
                    )}
                  </div>
                  {patient.lastAppointmentDate && (
                    <span className="text-xs text-slate-400">
                      {formatDate(patient.lastAppointmentDate)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
