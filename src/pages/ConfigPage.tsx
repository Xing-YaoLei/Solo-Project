import { useState } from 'react'
import { PageHeader } from '@/pages/Home'
import { useGameStore } from '@/store/gameStore'
import { GameConfig, QuestionItem, Reward, OpenSchedule, TrainingMode, LEVEL_LABELS, QuestionType } from '@/types'
import {
  FileText,
  Image,
  Gift,
  Calendar,
  Settings2,
  Plus,
  Pencil,
  Trash2,
  Save,
  X,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
} from 'lucide-react'

type TabKey = 'questions' | 'materials' | 'rewards' | 'schedule' | 'mode'

const TAB_CONFIG: { key: TabKey; label: string; icon: typeof FileText }[] = [
  { key: 'questions', label: '题目管理', icon: FileText },
  { key: 'materials', label: '素材管理', icon: Image },
  { key: 'rewards', label: '奖励设置', icon: Gift },
  { key: 'schedule', label: '开放时间', icon: Calendar },
  { key: 'mode', label: '训练模式', icon: Settings2 },
]

const QUESTION_TYPE_OPTIONS: { value: QuestionType; label: string }[] = [
  { value: 'amount_verify', label: '金额校验识别' },
  { value: 'payment_flow', label: '支付流水选择' },
  { value: 'reconcile_sort', label: '对账差异排序' },
  { value: 'contract_attach', label: '合同附件处理' },
]

const TRAINING_MODES: { value: TrainingMode; label: string; desc: string }[] = [
  { value: 'practice', label: '练习模式', desc: '无时间限制，可反复练习' },
  { value: 'timed', label: '限时模式', desc: '按题目设定的时间限制完成' },
  { value: 'exam', label: '考试模式', desc: '严格计时，记录作为考核成绩' },
]

interface EditableQuestion {
  id: string
  type: QuestionType
  title: string
  description: string
  rewardScore: number
  timeLimit: number
  dataJson: string
}

function questionToEditable(q: QuestionItem): EditableQuestion {
  return {
    id: q.id,
    type: q.type,
    title: q.title,
    description: q.description,
    rewardScore: q.rewardScore,
    timeLimit: q.timeLimit ?? 120,
    dataJson: JSON.stringify(q.data, null, 2),
  }
}

function editableToQuestion(e: EditableQuestion): QuestionItem | null {
  try {
    const data = JSON.parse(e.dataJson)
    return {
      id: e.id,
      type: e.type,
      title: e.title,
      description: e.description,
      rewardScore: e.rewardScore,
      timeLimit: e.timeLimit,
      data,
    }
  } catch {
    return null
  }
}

interface EditableReward {
  id: string
  name: string
  type: 'points' | 'badge' | 'title'
  threshold: number
}

interface EditableSchedule {
  levelId: string
  openFrom: string
  openTo: string
}

export default function ConfigPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('questions')
  const config = useGameStore((s) => s.config)
  const updateConfig = useGameStore((s) => s.updateConfig)

  return (
    <div className="min-h-screen bg-[#1B2A4A] text-white">
      <PageHeader title="配置管理" subtitle="维护题目、素材、奖励、开放时间和训练模式" />

      <div className="flex">
        <aside className="w-56 min-h-[calc(100vh-73px)] bg-[#0F1D36] border-r border-[#D4A843]/10 p-3">
          {TAB_CONFIG.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1.5 transition-colors ${
                  isActive
                    ? 'bg-[#D4A843]/15 text-[#D4A843] border border-[#D4A843]/30'
                    : 'text-[#94A3B8] hover:bg-[#243656] hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{tab.label}</span>
              </button>
            )
          })}
        </aside>

        <main className="flex-1 p-6 overflow-auto">
          {activeTab === 'questions' && <QuestionsPanel config={config} updateConfig={updateConfig} />}
          {activeTab === 'materials' && <MaterialsPanel config={config} updateConfig={updateConfig} />}
          {activeTab === 'rewards' && <RewardsPanel config={config} updateConfig={updateConfig} />}
          {activeTab === 'schedule' && <SchedulePanel config={config} updateConfig={updateConfig} />}
          {activeTab === 'mode' && <ModePanel config={config} updateConfig={updateConfig} />}
        </main>
      </div>
    </div>
  )
}

function QuestionsPanel({ config, updateConfig }: { config: GameConfig; updateConfig: (c: GameConfig) => void }) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editing, setEditing] = useState<EditableQuestion | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [newQ, setNewQ] = useState<EditableQuestion>({
    id: '',
    type: 'amount_verify',
    title: '',
    description: '',
    rewardScore: 100,
    timeLimit: 120,
    dataJson: '{}',
  })
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleAdd = () => {
    setError(null)
    if (!newQ.id || !newQ.title) {
      setError('题目ID和标题不能为空')
      return
    }
    const q = editableToQuestion(newQ)
    if (!q) {
      setError('题目数据JSON格式错误')
      return
    }
    if (config.questions.some((x) => x.id === newQ.id)) {
      setError('题目ID已存在')
      return
    }
    updateConfig({ ...config, questions: [...config.questions, q] })
    setIsAdding(false)
    setNewQ({ id: '', type: 'amount_verify', title: '', description: '', rewardScore: 100, timeLimit: 120, dataJson: '{}' })
  }

  const handleSave = () => {
    setError(null)
    if (!editing) return
    const q = editableToQuestion(editing)
    if (!q) {
      setError('题目数据JSON格式错误')
      return
    }
    updateConfig({
      ...config,
      questions: config.questions.map((x) => (x.id === editing.id ? q : x)),
    })
    setEditingId(null)
    setEditing(null)
  }

  const handleDelete = (id: string) => {
    if (confirm('确定删除该题目吗？')) {
      updateConfig({ ...config, questions: config.questions.filter((q) => q.id !== id) })
    }
  }

  const startEdit = (q: QuestionItem) => {
    setEditingId(q.id)
    setEditing(questionToEditable(q))
    setIsAdding(false)
  }

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-bold text-[#D4A843]">题目管理</h2>
          <p className="text-sm text-[#64748B] mt-1">共 {config.questions.length} 道题目</p>
        </div>
        {!isAdding && (
          <button
            onClick={() => {
              setIsAdding(true)
              setEditingId(null)
              setError(null)
            }}
            className="flex items-center gap-2 px-4 py-2 bg-[#D4A843] text-[#1B2A4A] font-medium rounded-lg hover:bg-[#C49A3A] transition-colors"
          >
            <Plus className="w-4 h-4" />
            新增题目
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 px-4 py-2 bg-[#EF4444]/15 border border-[#EF4444]/40 text-[#EF4444] rounded-lg text-sm">
          {error}
        </div>
      )}

      {isAdding && (
        <QuestionForm
          data={newQ}
          onChange={setNewQ}
          onSave={handleAdd}
          onCancel={() => {
            setIsAdding(false)
            setError(null)
          }}
          isNew
        />
      )}

      <div className="space-y-2">
        {config.questions.map((q) => {
          const isEditing = editingId === q.id
          const isExpanded = expandedId === q.id
          return (
            <div
              key={q.id}
              className="bg-[#0F1D36] border border-[#D4A843]/10 rounded-xl overflow-hidden"
            >
              {isEditing && editing ? (
                <QuestionForm
                  data={editing}
                  onChange={setEditing}
                  onSave={handleSave}
                  onCancel={() => {
                    setEditingId(null)
                    setEditing(null)
                    setError(null)
                  }}
                />
              ) : (
                <>
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : q.id)}
                        className="text-[#64748B] hover:text-[#D4A843]"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white">{q.title}</span>
                          <span className="px-2 py-0.5 text-xs bg-[#D4A843]/15 text-[#D4A843] rounded">
                            {LEVEL_LABELS[q.type]}
                          </span>
                        </div>
                        <p className="text-xs text-[#64748B] mt-0.5">
                          ID: {q.id} · 奖励: {q.rewardScore}分 · 时限: {q.timeLimit ?? 120}s
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => startEdit(q)}
                        className="p-2 text-[#64748B] hover:text-[#D4A843] hover:bg-[#D4A843]/10 rounded-lg transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(q.id)}
                        className="p-2 text-[#64748B] hover:text-[#EF4444] hover:bg-[#EF4444]/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-2 border-t border-[#D4A843]/10">
                      <p className="text-sm text-[#94A3B8] mb-2">{q.description}</p>
                      <pre className="text-xs bg-[#1B2A4A] p-3 rounded-lg text-[#94A3B8] overflow-auto max-h-64">
                        {JSON.stringify(q.data, null, 2)}
                      </pre>
                    </div>
                  )}
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function QuestionForm({
  data,
  onChange,
  onSave,
  onCancel,
  isNew = false,
}: {
  data: EditableQuestion
  onChange: (d: EditableQuestion) => void
  onSave: () => void
  onCancel: () => void
  isNew?: boolean
}) {
  return (
    <div className="bg-[#0F1D36] border-2 border-[#D4A843]/30 rounded-xl p-4 mb-4">
      <div className="grid grid-cols-2 gap-4 mb-4">
        <Field label="题目ID">
          <input
            type="text"
            value={data.id}
            disabled={!isNew}
            onChange={(e) => onChange({ ...data, id: e.target.value })}
            className="w-full px-3 py-2 bg-[#1B2A4A] border border-[#D4A843]/20 rounded-lg text-white text-sm focus:outline-none focus:border-[#D4A843]/60 disabled:opacity-50"
            placeholder="例如: av_3"
          />
        </Field>
        <Field label="题目类型">
          <select
            value={data.type}
            onChange={(e) => onChange({ ...data, type: e.target.value as QuestionType })}
            className="w-full px-3 py-2 bg-[#1B2A4A] border border-[#D4A843]/20 rounded-lg text-white text-sm focus:outline-none focus:border-[#D4A843]/60"
          >
            {QUESTION_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="题目标题">
          <input
            type="text"
            value={data.title}
            onChange={(e) => onChange({ ...data, title: e.target.value })}
            className="w-full px-3 py-2 bg-[#1B2A4A] border border-[#D4A843]/20 rounded-lg text-white text-sm focus:outline-none focus:border-[#D4A843]/60"
            placeholder="输入题目标题"
          />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="奖励分值">
            <input
              type="number"
              value={data.rewardScore}
              onChange={(e) => onChange({ ...data, rewardScore: Number(e.target.value) })}
              className="w-full px-3 py-2 bg-[#1B2A4A] border border-[#D4A843]/20 rounded-lg text-white text-sm focus:outline-none focus:border-[#D4A843]/60"
            />
          </Field>
          <Field label="时限(秒)">
            <input
              type="number"
              value={data.timeLimit}
              onChange={(e) => onChange({ ...data, timeLimit: Number(e.target.value) })}
              className="w-full px-3 py-2 bg-[#1B2A4A] border border-[#D4A843]/20 rounded-lg text-white text-sm focus:outline-none focus:border-[#D4A843]/60"
            />
          </Field>
        </div>
      </div>
      <Field label="题目描述">
        <input
          type="text"
          value={data.description}
          onChange={(e) => onChange({ ...data, description: e.target.value })}
          className="w-full px-3 py-2 bg-[#1B2A4A] border border-[#D4A843]/20 rounded-lg text-white text-sm focus:outline-none focus:border-[#D4A843]/60"
          placeholder="描述题目内容"
        />
      </Field>
      <Field label="题目数据 (JSON格式)">
        <textarea
          value={data.dataJson}
          onChange={(e) => onChange({ ...data, dataJson: e.target.value })}
          rows={10}
          className="w-full px-3 py-2 bg-[#1B2A4A] border border-[#D4A843]/20 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-[#D4A843]/60"
        />
      </Field>
      <div className="flex justify-end gap-2 mt-4">
        <button
          onClick={onCancel}
          className="flex items-center gap-1 px-4 py-2 bg-[#243656] text-[#94A3B8] rounded-lg hover:text-white transition-colors text-sm"
        >
          <X className="w-4 h-4" />
          取消
        </button>
        <button
          onClick={onSave}
          className="flex items-center gap-1 px-4 py-2 bg-[#D4A843] text-[#1B2A4A] font-medium rounded-lg hover:bg-[#C49A3A] transition-colors text-sm"
        >
          <Save className="w-4 h-4" />
          保存
        </button>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <label className="block text-xs font-medium text-[#94A3B8] mb-1.5">{label}</label>
      {children}
    </div>
  )
}

function MaterialsPanel({ config, updateConfig }: { config: GameConfig; updateConfig: (c: GameConfig) => void }) {
  const materials = config.materials

  const handleUpload = () => {
    const name = prompt('请输入素材文件名:')
    if (!name) return
    const ext = name.split('.').pop() || 'unknown'
    const newMaterial = {
      id: `m_${Date.now()}`,
      name,
      type: ext,
      size: `${Math.floor(Math.random() * 200 + 10)} KB`,
      uploadAt: new Date().toISOString().slice(0, 10),
    }
    updateConfig({
      ...config,
      materials: [...materials, newMaterial],
    })
  }

  const handleDelete = (id: string) => {
    if (confirm('确定删除该素材吗？')) {
      updateConfig({
        ...config,
        materials: materials.filter((x) => x.id !== id),
      })
    }
  }

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-bold text-[#D4A843]">素材管理</h2>
          <p className="text-sm text-[#64748B] mt-1">管理报价单模板、合同模板、流水样本等素材，合同附件关卡将从这里读取可选附件</p>
        </div>
        <button
          onClick={handleUpload}
          className="flex items-center gap-2 px-4 py-2 bg-[#D4A843] text-[#1B2A4A] font-medium rounded-lg hover:bg-[#C49A3A] transition-colors"
        >
          <Plus className="w-4 h-4" />
          上传素材
        </button>
      </div>

      <div className="bg-[#0F1D36] border border-[#D4A843]/10 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#D4A843]/10">
              <th className="text-left px-4 py-3 text-xs font-medium text-[#94A3B8]">文件名</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-[#94A3B8]">类型</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-[#94A3B8]">大小</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-[#94A3B8]">上传时间</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-[#94A3B8]">操作</th>
            </tr>
          </thead>
          <tbody>
            {materials.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-[#64748B] text-sm">
                  暂无素材，点击"上传素材"开始添加
                </td>
              </tr>
            ) : (
              materials.map((m) => (
                <tr key={m.id} className="border-b border-[#D4A843]/5 hover:bg-[#1B2A4A]/50">
                  <td className="px-4 py-3 text-sm text-white">{m.name}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 text-xs bg-[#D4A843]/15 text-[#D4A843] rounded uppercase">
                      {m.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-[#94A3B8]">{m.size ?? '-'}</td>
                  <td className="px-4 py-3 text-sm text-[#94A3B8]">{m.uploadAt ?? '-'}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDelete(m.id)}
                      className="p-1.5 text-[#64748B] hover:text-[#EF4444] hover:bg-[#EF4444]/10 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function RewardsPanel({ config, updateConfig }: { config: GameConfig; updateConfig: (c: GameConfig) => void }) {
  const [editing, setEditing] = useState<EditableReward | null>(null)
  const [adding, setAdding] = useState(false)
  const [newR, setNewR] = useState<EditableReward>({ id: '', name: '', type: 'badge', threshold: 100 })

  const handleAdd = () => {
    if (!newR.id || !newR.name) return
    updateConfig({
      ...config,
      rewards: [...config.rewards, newR as Reward],
    })
    setAdding(false)
    setNewR({ id: '', name: '', type: 'badge', threshold: 100 })
  }

  const handleSave = () => {
    if (!editing) return
    updateConfig({
      ...config,
      rewards: config.rewards.map((r) => (r.id === editing.id ? (editing as Reward) : r)),
    })
    setEditing(null)
  }

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-bold text-[#D4A843]">奖励设置</h2>
          <p className="text-sm text-[#64748B] mt-1">配置通关奖励（积分/徽章/称号）及触发阈值</p>
        </div>
        {!adding && (
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#D4A843] text-[#1B2A4A] font-medium rounded-lg hover:bg-[#C49A3A] transition-colors"
          >
            <Plus className="w-4 h-4" />
            新增奖励
          </button>
        )}
      </div>

      {adding && (
        <div className="bg-[#0F1D36] border-2 border-[#D4A843]/30 rounded-xl p-4 mb-4">
          <div className="grid grid-cols-4 gap-4">
            <Field label="奖励ID">
              <input
                type="text"
                value={newR.id}
                onChange={(e) => setNewR({ ...newR, id: e.target.value })}
                className="w-full px-3 py-2 bg-[#1B2A4A] border border-[#D4A843]/20 rounded-lg text-white text-sm focus:outline-none focus:border-[#D4A843]/60"
              />
            </Field>
            <Field label="奖励名称">
              <input
                type="text"
                value={newR.name}
                onChange={(e) => setNewR({ ...newR, name: e.target.value })}
                className="w-full px-3 py-2 bg-[#1B2A4A] border border-[#D4A843]/20 rounded-lg text-white text-sm focus:outline-none focus:border-[#D4A843]/60"
              />
            </Field>
            <Field label="类型">
              <select
                value={newR.type}
                onChange={(e) => setNewR({ ...newR, type: e.target.value as 'points' | 'badge' | 'title' })}
                className="w-full px-3 py-2 bg-[#1B2A4A] border border-[#D4A843]/20 rounded-lg text-white text-sm focus:outline-none focus:border-[#D4A843]/60"
              >
                <option value="badge">徽章</option>
                <option value="title">称号</option>
                <option value="points">积分</option>
              </select>
            </Field>
            <Field label="触发阈值">
              <input
                type="number"
                value={newR.threshold}
                onChange={(e) => setNewR({ ...newR, threshold: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-[#1B2A4A] border border-[#D4A843]/20 rounded-lg text-white text-sm focus:outline-none focus:border-[#D4A843]/60"
              />
            </Field>
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <button
              onClick={() => setAdding(false)}
              className="px-4 py-2 bg-[#243656] text-[#94A3B8] rounded-lg hover:text-white text-sm"
            >
              取消
            </button>
            <button
              onClick={handleAdd}
              className="px-4 py-2 bg-[#D4A843] text-[#1B2A4A] font-medium rounded-lg hover:bg-[#C49A3A] text-sm"
            >
              保存
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {config.rewards.map((r) => (
          <div key={r.id} className="bg-[#0F1D36] border border-[#D4A843]/10 rounded-xl p-4">
            {editing && editing.id === r.id ? (
              <div className="space-y-3">
                <Field label="名称">
                  <input
                    type="text"
                    value={editing.name}
                    onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                    className="w-full px-3 py-2 bg-[#1B2A4A] border border-[#D4A843]/20 rounded-lg text-white text-sm"
                  />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="类型">
                    <select
                      value={editing.type}
                      onChange={(e) =>
                        setEditing({ ...editing, type: e.target.value as 'points' | 'badge' | 'title' })
                      }
                      className="w-full px-3 py-2 bg-[#1B2A4A] border border-[#D4A843]/20 rounded-lg text-white text-sm"
                    >
                      <option value="badge">徽章</option>
                      <option value="title">称号</option>
                      <option value="points">积分</option>
                    </select>
                  </Field>
                  <Field label="阈值">
                    <input
                      type="number"
                      value={editing.threshold}
                      onChange={(e) => setEditing({ ...editing, threshold: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-[#1B2A4A] border border-[#D4A843]/20 rounded-lg text-white text-sm"
                    />
                  </Field>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditing(null)}
                    className="flex-1 px-3 py-1.5 bg-[#243656] text-[#94A3B8] rounded-lg text-sm"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleSave}
                    className="flex-1 px-3 py-1.5 bg-[#D4A843] text-[#1B2A4A] font-medium rounded-lg text-sm"
                  >
                    保存
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl">{r.type === 'badge' ? '🏅' : r.type === 'title' ? '👑' : '⭐'}</span>
                    <div>
                      <h3 className="font-medium text-white">{r.name}</h3>
                      <span className="text-xs text-[#64748B]">
                        {r.type === 'badge' ? '徽章' : r.type === 'title' ? '称号' : '积分奖励'}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-[#94A3B8] mt-2">累计总分达到 {r.threshold} 分可获得</p>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => setEditing({ id: r.id, name: r.name, type: r.type, threshold: r.threshold })}
                    className="p-1.5 text-[#64748B] hover:text-[#D4A843] rounded"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('确定删除该奖励吗？')) {
                        updateConfig({ ...config, rewards: config.rewards.filter((x) => x.id !== r.id) })
                      }
                    }}
                    className="p-1.5 text-[#64748B] hover:text-[#EF4444] rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function SchedulePanel({ config, updateConfig }: { config: GameConfig; updateConfig: (c: GameConfig) => void }) {
  const schedules: EditableSchedule[] = config.openSchedule.map((s) => ({ ...s }))

  const handleChange = (levelId: string, field: 'openFrom' | 'openTo', value: string) => {
    const updated = schedules.map((s) => (s.levelId === levelId ? { ...s, [field]: value } : s))
    updateConfig({ ...config, openSchedule: updated as OpenSchedule[] })
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-5">
        <h2 className="text-xl font-bold text-[#D4A843]">开放时间</h2>
        <p className="text-sm text-[#64748B] mt-1">设置各关卡的开放/关闭时间窗口</p>
      </div>

      <div className="bg-[#0F1D36] border border-[#D4A843]/10 rounded-xl p-5 space-y-4">
        {schedules.map((s) => (
          <div key={s.levelId} className="flex items-center gap-4 p-3 bg-[#1B2A4A]/50 rounded-lg">
            <div className="flex-1">
              <h3 className="font-medium text-white">{LEVEL_LABELS[s.levelId as QuestionType]}</h3>
              <p className="text-xs text-[#64748B] mt-0.5">关卡ID: {s.levelId}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#94A3B8]">从</span>
              <input
                type="date"
                value={s.openFrom}
                onChange={(e) => handleChange(s.levelId, 'openFrom', e.target.value)}
                className="px-3 py-1.5 bg-[#0F1D36] border border-[#D4A843]/20 rounded-lg text-white text-sm focus:outline-none focus:border-[#D4A843]/60"
              />
              <span className="text-xs text-[#94A3B8]">到</span>
              <input
                type="date"
                value={s.openTo}
                onChange={(e) => handleChange(s.levelId, 'openTo', e.target.value)}
                className="px-3 py-1.5 bg-[#0F1D36] border border-[#D4A843]/20 rounded-lg text-white text-sm focus:outline-none focus:border-[#D4A843]/60"
              />
            </div>
            <CheckCircle2 className="w-5 h-5 text-[#10B981]" />
          </div>
        ))}
      </div>
    </div>
  )
}

function ModePanel({ config, updateConfig }: { config: GameConfig; updateConfig: (c: GameConfig) => void }) {
  return (
    <div className="max-w-3xl">
      <div className="mb-5">
        <h2 className="text-xl font-bold text-[#D4A843]">训练模式</h2>
        <p className="text-sm text-[#64748B] mt-1">切换当前的训练模式</p>
      </div>

      <div className="space-y-3">
        {TRAINING_MODES.map((mode) => {
          const isActive = config.trainingMode === mode.value
          return (
            <button
              key={mode.value}
              onClick={() => updateConfig({ ...config, trainingMode: mode.value })}
              className={`w-full flex items-center gap-4 p-5 rounded-xl border-2 transition-all text-left ${
                isActive
                  ? 'bg-[#D4A843]/10 border-[#D4A843]'
                  : 'bg-[#0F1D36] border-[#D4A843]/10 hover:border-[#D4A843]/30'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                  isActive ? 'border-[#D4A843]' : 'border-[#64748B]'
                }`}
              >
                {isActive && <div className="w-3 h-3 rounded-full bg-[#D4A843]" />}
              </div>
              <div className="flex-1">
                <h3 className={`font-medium ${isActive ? 'text-[#D4A843]' : 'text-white'}`}>{mode.label}</h3>
                <p className="text-sm text-[#64748B] mt-0.5">{mode.desc}</p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
