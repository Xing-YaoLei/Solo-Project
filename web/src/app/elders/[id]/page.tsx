'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useParams } from 'next/navigation'
import { getElder } from '@/lib/api'
import CareLevelBadge from '@/components/CareLevelBadge'
import StatusBadge from '@/components/StatusBadge'
import { User, Heart, Pill, Phone, MapPin, Calendar, AlertTriangle, Pill as PillIcon } from 'lucide-react'
import { formatDate } from '@/app/helpers'

const tabs = [
  { key: 'basic', label: '基本信息', icon: User },
  { key: 'health', label: '健康档案', icon: Heart },
  { key: 'meds', label: '用药清单', icon: Pill },
]

export default function ElderDetailPage() {
  const { id } = useParams()
  const [activeTab, setActiveTab] = useState('basic')

  const { data: elder, isLoading } = useQuery({
    queryKey: ['elder', id],
    queryFn: () => getElder(id as string),
    enabled: !!id,
  })

  if (isLoading) return <div className="text-center py-20 text-slate-400">加载中...</div>
  if (!elder) return <div className="text-center py-20 text-slate-400">未找到老人信息</div>

  return (
    <div>
      <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-teal-600 flex items-center justify-center text-white text-2xl font-bold">
            {elder.name?.[0]}
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">{elder.name}</h2>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-sm text-slate-500">{elder.age}岁 · {elder.gender}</span>
              <CareLevelBadge level={elder.careLevel} />
              <StatusBadge status={elder.fallRiskLevel} variant="risk" pulse={elder.fallRiskLevel === 'HIGH'} />
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        {tabs.map((t) => {
          const Icon = t.icon
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeTab === t.key
                  ? 'bg-teal-700 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          )
        })}
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm">
        {activeTab === 'basic' && (
          <div className="grid grid-cols-2 gap-6">
            <InfoItem icon={User} label="姓名" value={elder.name} />
            <InfoItem icon={User} label="年龄" value={`${elder.age}岁`} />
            <InfoItem icon={User} label="性别" value={elder.gender} />
            <InfoItem icon={MapPin} label="房间号" value={elder.roomNumber} />
            <InfoItem icon={Calendar} label="入住日期" value={formatDate(elder.admissionDate)} />
            <InfoItem icon={Phone} label="紧急联系人" value={elder.emergencyContact ?? '未设置'} />
            <InfoItem icon={Phone} label="紧急联系电话" value={elder.emergencyPhone ?? '未设置'} />
          </div>
        )}

        {activeTab === 'health' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-slate-500 mb-2">过敏信息</h3>
              <div className="flex flex-wrap gap-2">
                {elder.allergies?.length > 0 ? (
                  elder.allergies.map((a: string) => (
                    <span key={a} className="px-3 py-1 rounded-full bg-red-50 text-red-600 text-sm">
                      {a}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-slate-400">无已知过敏</span>
                )}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-500 mb-2">跌倒风险等级</h3>
              <div className="flex items-center gap-3">
                <StatusBadge status={elder.fallRiskLevel} variant="risk" pulse={elder.fallRiskLevel === 'HIGH'} />
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      elder.fallRiskLevel === 'HIGH'
                        ? 'bg-red-500 w-full'
                        : elder.fallRiskLevel === 'MEDIUM'
                        ? 'bg-orange-500 w-2/3'
                        : 'bg-yellow-500 w-1/3'
                    }`}
                  />
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-500 mb-2">护理等级</h3>
              <CareLevelBadge level={elder.careLevel} />
            </div>
          </div>
        )}

        {activeTab === 'meds' && (
          <div>
            {elder.medications?.length > 0 ? (
              <>
                <MedicationSummary elder={elder} />
                <table className="w-full text-sm mt-4">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left py-3 text-slate-500 font-medium">药品名称</th>
                      <th className="text-left py-3 text-slate-500 font-medium">剂量</th>
                      <th className="text-left py-3 text-slate-500 font-medium">频率</th>
                      <th className="text-left py-3 text-slate-500 font-medium">状态</th>
                      <th className="text-left py-3 text-slate-500 font-medium">核对</th>
                    </tr>
                  </thead>
                  <tbody>
                    {elder.medications.map((m: any) => {
                      const issues = checkMedication(elder, m)
                      return (
                        <tr key={m.id} className="border-b border-slate-50">
                          <td className="py-3 font-medium text-slate-800">{m.medicationName}</td>
                          <td className="py-3 text-slate-600">{m.dosage}</td>
                          <td className="py-3 text-slate-600">{m.frequency}</td>
                          <td className="py-3"><StatusBadge status={m.status} variant="reminder" /></td>
                          <td className="py-3">
                            {issues.length > 0 ? (
                              <div className="space-y-0.5">
                                {issues.map((issue, idx) => (
                                  <div key={idx} className="text-xs text-red-600 font-medium">
                                    {issue}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-xs text-green-600">正常</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </>
            ) : (
              <div className="text-center py-10 text-slate-400">暂无用药记录</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function MedicationSummary({ elder }: { elder: any }) {
  const medCount = elder.medications?.length ?? 0
  const careLevelLabels: Record<string, string> = {
    LEVEL_1: '一级护理',
    LEVEL_2: '二级护理',
    LEVEL_3: '三级护理',
    LEVEL_4: '四级护理',
    LEVEL_5: '五级护理',
  }
  const careLabel = careLevelLabels[elder.careLevel] ?? elder.careLevel

  const issues: string[] = []
  if (elder.careLevel === 'LEVEL_5' && medCount < 2) {
    issues.push(`${careLabel}老人用药种类偏少（仅 ${medCount} 种），建议复核用药清单`)
  }
  if (elder.careLevel === 'LEVEL_1' && medCount > 6) {
    issues.push(`${careLabel}老人用药种类偏多（${medCount} 种），需关注药物相互作用`)
  }

  return (
    <div className={`rounded-xl p-4 ${
      issues.length > 0
        ? 'border border-amber-200 bg-amber-50/50'
        : 'border border-green-200 bg-green-50/50'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            issues.length > 0 ? 'bg-amber-100' : 'bg-green-100'
          }`}>
            {issues.length > 0 ? (
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            ) : (
              <PillIcon className="w-5 h-5 text-green-600" />
            )}
          </div>
          <div>
            <div className="font-medium text-slate-800">用药清单核对</div>
            <div className="text-xs text-slate-500">共 {medCount} 种用药 · {careLabel}</div>
          </div>
        </div>
        <span className={`text-sm font-medium ${
          issues.length > 0 ? 'text-amber-600' : 'text-green-600'
        }`}>
          {issues.length > 0 ? '需关注' : '正常'}
        </span>
      </div>
      {issues.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {issues.map((issue, idx) => (
            <li key={idx} className="flex items-start gap-2 text-sm text-amber-700">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
              {issue}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function checkMedication(elder: any, med: any): string[] {
  const issues: string[] = []

  const freq = med.frequency ?? ''

  const isHypotensive = med.medicationName.includes('降压') ||
    med.medicationName.includes('硝苯地平') ||
    med.medicationName.includes('氨氯地平') ||
    med.medicationName.includes('美托洛尔')
  const isSedative = med.medicationName.includes('安眠') ||
    med.medicationName.includes('安定') ||
    med.medicationName.includes('唑吡坦')
  const isAnticoagulant = med.medicationName.includes('华法林') ||
    med.medicationName.includes('阿司匹林') ||
    med.medicationName.includes('氯吡格雷')

  if ((elder.careLevel === 'LEVEL_5' || elder.careLevel === 'LEVEL_4') &&
      freq === '每日一次') {
    const careLevelLabels: Record<string, string> = {
      LEVEL_1: '一级护理',
      LEVEL_2: '二级护理',
      LEVEL_3: '三级护理',
      LEVEL_4: '四级护理',
      LEVEL_5: '五级护理',
    }
    const careLabel = careLevelLabels[elder.careLevel] ?? elder.careLevel
    issues.push(`${careLabel}老人用药频率仅每日一次，建议复核`)
  }

  if (elder.fallRiskLevel === 'HIGH' && isHypotensive) {
    issues.push('高跌倒风险老人使用降压药，警惕体位性低血压')
  }

  if (elder.fallRiskLevel === 'HIGH' && isSedative) {
    issues.push('高跌倒风险老人使用镇静催眠药，夜间跌倒风险增加')
  }

  if (elder.fallRiskLevel === 'HIGH' && isAnticoagulant) {
    issues.push('高跌倒风险老人使用抗凝药，跌倒后出血风险高')
  }

  if (elder.allergies?.length > 0 &&
      elder.allergies.some((a: string) => med.medicationName.includes(a))) {
    issues.push('存在过敏史药物匹配警告，请立即核实')
  }

  if (med.status === 'MISSED') {
    issues.push('该用药已漏服，需跟进原因')
  }

  if (med.status === 'ADVERSE_REACTION') {
    issues.push('该用药出现不良反应，需重点关注')
  }

  return issues
}

function InfoItem({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center">
        <Icon className="w-4 h-4 text-slate-400" />
      </div>
      <div>
        <div className="text-xs text-slate-400">{label}</div>
        <div className="text-sm font-medium text-slate-700">{value}</div>
      </div>
    </div>
  )
}
