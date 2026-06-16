'use client';

import { useState, useMemo } from 'react';
import {
  Users,
  UserCheck,
  UserX,
  TrendingUp,
  Settings,
  Filter,
  Calendar,
  Search,
  ChevronRight,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import { StatCard } from '@/components/StatCard';
import { FunnelChart } from '@/components/FunnelChart';
import { RevisitRateChart } from '@/components/RevisitRateChart';
import { StatusPieChart } from '@/components/StatusPieChart';
import { PatientList } from '@/components/PatientList';
import { PatientDetailPanel } from '@/components/PatientDetailPanel';
import { NoteTaskList } from '@/components/NoteTaskList';
import {
  generateMockPatients,
  generateMockAppointments,
  generateMockChargeRecords,
  generateMockImageAttachments,
  generateMockNoteTasks,
  generateMockFunnelData,
  generateMockRevisitRateTrend,
  generateMockAppointmentStatusData,
  generateMockPaymentStatusData,
} from '@/lib/mockData';
import { cn } from '@/lib/utils';

type TabType = 'overview' | 'patients' | 'notes';

export default function FunnelReportPage() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [showDetail, setShowDetail] = useState(false);

  const patients = useMemo(() => generateMockPatients(50), []);
  const appointments = useMemo(() => generateMockAppointments(patients), [patients]);
  const chargeRecords = useMemo(() => generateMockChargeRecords(patients), [patients]);
  const imageAttachments = useMemo(() => generateMockImageAttachments(patients), [patients]);
  const noteTasks = useMemo(() => generateMockNoteTasks(patients), [patients]);
  const funnelData = useMemo(() => generateMockFunnelData(), []);
  const revisitTrendData = useMemo(() => generateMockRevisitRateTrend(), []);
  const appointmentStatusData = useMemo(() => generateMockAppointmentStatusData(), []);
  const paymentStatusData = useMemo(() => generateMockPaymentStatusData(), []);

  const filteredPatients = useMemo(() => {
    let result = patients;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.patientNo.toLowerCase().includes(query)
      );
    }

    if (filterLevel !== 'all') {
      result = result.filter((p) => p.warningLevel === filterLevel);
    }

    return result;
  }, [patients, searchQuery, filterLevel]);

  const selectedPatient = useMemo(() => {
    if (!selectedPatientId) return null;
    return patients.find((p) => p.id === selectedPatientId) || null;
  }, [selectedPatientId, patients]);

  const selectedPatientAppointments = useMemo(() => {
    if (!selectedPatientId) return [];
    return appointments.filter((a) => a.patientId === selectedPatientId);
  }, [selectedPatientId, appointments]);

  const selectedPatientCharges = useMemo(() => {
    if (!selectedPatientId) return [];
    return chargeRecords.filter((c) => c.patientId === selectedPatientId);
  }, [selectedPatientId, chargeRecords]);

  const selectedPatientImages = useMemo(() => {
    if (!selectedPatientId) return [];
    return imageAttachments.filter((i) => i.patientId === selectedPatientId);
  }, [selectedPatientId, imageAttachments]);

  const selectedPatientTasks = useMemo(() => {
    if (!selectedPatientId) return [];
    return noteTasks.filter((t) => t.patientId === selectedPatientId);
  }, [selectedPatientId, noteTasks]);

  const totalPatients = patients.length;
  const criticalPatients = patients.filter((p) => p.warningLevel === 'critical').length;
  const warningPatients = patients.filter((p) => p.warningLevel === 'warning').length;
  const avgRevisitRate =
    patients.reduce((sum, p) => sum + p.revisitRate, 0) / patients.length;

  const handleSelectPatient = (patientId: string) => {
    setSelectedPatientId(patientId);
    setShowDetail(true);
  };

  const tabs = [
    { key: 'overview', label: '总览', icon: TrendingUp },
    { key: 'patients', label: '患者列表', icon: Users },
    { key: 'notes', label: '备注任务', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-[1600px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-slate-800">
                正畸病例漏斗报表
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                专门复盘口腔诊所正畸病例 · 数据来源：HIS / 收费系统 / 预约系统
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Calendar size={16} />
                <span>2025-01-01 至 2025-06-15</span>
              </div>
              <button className="btn btn-secondary flex items-center gap-2">
                <Filter size={16} />
                筛选
              </button>
              <button className="btn btn-primary flex items-center gap-2">
                <Settings size={16} />
                阈值配置
              </button>
            </div>
          </div>

          <div className="flex gap-1 mt-4">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as TabType)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  activeTab === tab.key
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-slate-600 hover:bg-slate-100'
                )}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-6 py-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="正畸病例总数"
                value={totalPatients}
                subtitle="初诊咨询起计算"
                icon={Users}
                status="normal"
                trend={{ value: 12.5, isUp: true }}
              />
              <StatCard
                title="平均复诊率"
                value={`${avgRevisitRate.toFixed(1)}%`}
                subtitle="全部正畸病例"
                icon={UserCheck}
                status={avgRevisitRate >= 70 ? 'success' : avgRevisitRate >= 50 ? 'warning' : 'danger'}
                trend={{ value: 3.2, isUp: false }}
              />
              <StatCard
                title="预警患者"
                value={warningPatients}
                subtitle="复诊率 50%-70%"
                icon={AlertTriangle}
                status="warning"
              />
              <StatCard
                title="严重预警"
                value={criticalPatients}
                subtitle="复诊率低于50%"
                icon={UserX}
                status="danger"
                trend={{ value: 8.3, isUp: true }}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 card">
                <div className="card-header">
                  <h3 className="text-lg font-semibold text-slate-800">
                    正畸病例漏斗
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">
                    各治疗阶段患者转化情况
                  </p>
                </div>
                <div className="card-body">
                  <FunnelChart data={funnelData} />
                </div>
              </div>

              <div className="space-y-6">
                <div className="card">
                  <div className="card-header">
                    <h3 className="text-lg font-semibold text-slate-800">
                      预约状态分布
                    </h3>
                  </div>
                  <div className="card-body pt-2">
                    <StatusPieChart data={appointmentStatusData} />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 card">
                <div className="card-header">
                  <h3 className="text-lg font-semibold text-slate-800">
                    复诊率趋势
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">近6个月复诊率变化</p>
                </div>
                <div className="card-body">
                  <RevisitRateChart data={revisitTrendData} />
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-semibold text-slate-800">
                    缴费状态分布
                  </h3>
                </div>
                <div className="card-body pt-2">
                  <StatusPieChart data={paymentStatusData} />
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-800">
                    重点关注患者
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">
                    复诊率异常的正畸病例
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('patients')}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                >
                  查看全部
                  <ChevronRight size={16} />
                </button>
              </div>
              <div className="card-body">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {patients
                    .filter((p) => p.warningLevel !== 'normal')
                    .slice(0, 6)
                    .map((patient) => (
                      <div
                        key={patient.id}
                        onClick={() => handleSelectPatient(patient.id)}
                        className={cn(
                          'p-4 rounded-xl border cursor-pointer transition-all hover:shadow-md',
                          patient.warningLevel === 'critical'
                            ? 'bg-red-50 border-red-200 hover:border-red-300'
                            : 'bg-yellow-50 border-yellow-200 hover:border-yellow-300'
                        )}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold text-slate-800">
                              {patient.name}
                            </h4>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {patient.patientNo}
                            </p>
                          </div>
                          <span
                            className={cn(
                              'badge',
                              patient.warningLevel === 'critical'
                                ? 'badge-danger'
                                : 'badge-warning'
                            )}
                          >
                            {patient.warningLevel === 'critical' ? '严重' : '预警'}
                          </span>
                        </div>
                        <div className="mt-3 flex items-center gap-4">
                          <div>
                            <p className="text-xs text-slate-500">复诊率</p>
                            <p
                              className={cn(
                                'text-lg font-bold',
                                patient.revisitRate >= 70
                                  ? 'text-green-600'
                                  : patient.revisitRate >= 50
                                  ? 'text-yellow-600'
                                  : 'text-red-600'
                              )}
                            >
                              {patient.revisitRate.toFixed(1)}%
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">爽约次数</p>
                            <p className="text-lg font-bold text-red-600">
                              {patient.missedCount}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">主治医生</p>
                            <p className="text-sm font-medium text-slate-700">
                              {patient.doctor}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'patients' && (
          <div className="flex gap-6 h-[calc(100vh-180px)]">
            <div className={cn('flex-1 overflow-hidden flex flex-col', showDetail ? 'hidden md:flex' : 'flex')}>
              <div className="card flex-1 flex flex-col overflow-hidden">
                <div className="card-header">
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="text-lg font-semibold text-slate-800">
                      正畸患者列表
                    </h3>
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Search
                          size={16}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                        <input
                          type="text"
                          placeholder="搜索患者姓名/编号..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="input pl-9 pr-4 py-2 w-64 text-sm"
                        />
                      </div>
                      <select
                        value={filterLevel}
                        onChange={(e) => setFilterLevel(e.target.value)}
                        className="input py-2 text-sm w-32"
                      >
                        <option value="all">全部状态</option>
                        <option value="normal">正常</option>
                        <option value="warning">预警</option>
                        <option value="critical">严重</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                  <PatientList
                    patients={filteredPatients.map((p) => ({
                      ...p,
                      lastAppointmentDate: p.lastAppointmentDate,
                    }))}
                    selectedPatientId={selectedPatientId || undefined}
                    onSelectPatient={handleSelectPatient}
                  />
                </div>
              </div>
            </div>

            {showDetail && selectedPatient && (
              <div className="md:w-[480px] lg:w-[520px] flex-shrink-0">
                <PatientDetailPanel
                  patient={{
                    id: selectedPatient.id,
                    patientNo: selectedPatient.patientNo,
                    name: selectedPatient.name,
                    gender: selectedPatient.gender,
                    birthDate: selectedPatient.birthDate,
                    phone: selectedPatient.phone,
                    treatmentStage: selectedPatient.treatmentStage,
                    doctor: selectedPatient.doctor,
                  }}
                  appointments={selectedPatientAppointments}
                  chargeRecords={selectedPatientCharges}
                  imageAttachments={selectedPatientImages}
                  noteTasks={selectedPatientTasks}
                  revisitAnalysis={{
                    totalAppointments: selectedPatient.totalAppointments,
                    completedAppointments: selectedPatient.completedAppointments,
                    missedAppointments: selectedPatient.missedCount,
                    revisitRate: selectedPatient.revisitRate,
                    warningLevel: selectedPatient.warningLevel,
                  }}
                />
              </div>
            )}
          </div>
        )}

        {activeTab === 'notes' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-semibold text-slate-800">
                  备注任务
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  复诊率异常自动生成的任务
                </p>
              </div>
              <div className="card-body max-h-[calc(100vh-240px)] overflow-y-auto">
                <NoteTaskList
                  tasks={noteTasks.map((t) => ({
                    ...t,
                    patient: {
                      id: patients.find((p) => p.id === t.patientId)?.id || '',
                      name: patients.find((p) => p.id === t.patientId)?.name || '',
                      patientNo:
                        patients.find((p) => p.id === t.patientId)?.patientNo || '',
                    },
                  }))}
                />
              </div>
            </div>

            <div className="space-y-6">
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-semibold text-slate-800">
                    任务统计
                  </h3>
                </div>
                <div className="card-body">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-red-50 rounded-xl p-4">
                      <p className="text-3xl font-bold text-red-600">
                        {noteTasks.filter((t) => t.status === 'PENDING').length}
                      </p>
                      <p className="text-sm text-red-600 mt-1">待处理</p>
                    </div>
                    <div className="bg-blue-50 rounded-xl p-4">
                      <p className="text-3xl font-bold text-blue-600">
                        {noteTasks.filter((t) => t.status === 'IN_PROGRESS').length}
                      </p>
                      <p className="text-sm text-blue-600 mt-1">处理中</p>
                    </div>
                    <div className="bg-green-50 rounded-xl p-4">
                      <p className="text-3xl font-bold text-green-600">
                        {noteTasks.filter((t) => t.status === 'COMPLETED').length}
                      </p>
                      <p className="text-sm text-green-600 mt-1">已完成</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-4">
                      <p className="text-3xl font-bold text-slate-600">
                        {noteTasks.length}
                      </p>
                      <p className="text-sm text-slate-600 mt-1">任务总数</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-semibold text-slate-800">
                    触发原因分布
                  </h3>
                </div>
                <div className="card-body">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">复诊率预警</span>
                      <span className="font-medium text-slate-800">
                        {
                          noteTasks.filter(
                            (t) => t.triggerReason === 'revisit_rate_warning'
                          ).length
                        }
                        个
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">复诊率严重</span>
                      <span className="font-medium text-slate-800">
                        {
                          noteTasks.filter(
                            (t) => t.triggerReason === 'revisit_rate_critical'
                          ).length
                        }
                        个
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">频繁爽约</span>
                      <span className="font-medium text-slate-800">
                        {
                          noteTasks.filter(
                            (t) => t.triggerReason === 'missed_appointment_warning'
                          ).length
                        }
                        个
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
