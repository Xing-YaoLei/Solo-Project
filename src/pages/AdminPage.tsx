import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Home, Lock, Plus, Save } from 'lucide-react'
import { useConfigStore } from '@/stores/useConfigStore'
import type { ItemConfig, AchievementConfig, AchievementConditionType } from '@/types'

const TABS = ['关卡配置', '道具配置', '成就配置'] as const
type TabKey = (typeof TABS)[number]

const inputStyle = {
  backgroundColor: '#1a0f0a',
  border: '1px solid #B76E7944',
  borderRadius: 6,
  color: '#B76E79',
  padding: '6px 10px',
  fontSize: 14,
  width: '100%',
  outline: 'none',
}

export default function AdminPage() {
  const navigate = useNavigate()
  const {
    levels, items, achievements,
    loadConfigs, updateLevel, addItem, updateItem, addAchievement, updateAchievement,
  } = useConfigStore()

  const [authenticated, setAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [activeTab, setActiveTab] = useState<TabKey>('关卡配置')
  const [editLevels, setEditLevels] = useState(levels)
  const [editItems, setEditItems] = useState(items)
  const [editAchievements, setEditAchievements] = useState(achievements)
  const [newItem, setNewItem] = useState<Partial<ItemConfig>>({ id: '', name: '', cooldownMs: 30000, effect: { type: 'reveal', value: 1 } })
  const [newAch, setNewAch] = useState<Partial<AchievementConfig>>({
    id: '', name: '', condition: { type: 'accuracy' as AchievementConditionType, threshold: 0 }, reward: 0,
  })

  useEffect(() => { loadConfigs() }, [loadConfigs])

  useEffect(() => { setEditLevels(levels) }, [levels])
  useEffect(() => { setEditItems(items) }, [items])
  useEffect(() => { setEditAchievements(achievements) }, [achievements])

  const handleLogin = () => {
    if (password === 'admin123') setAuthenticated(true)
  }

  const handleSaveLevel = (id: string) => {
    const level = editLevels.find((l) => l.id === id)
    if (level) updateLevel(id, { name: level.name, difficulty: level.difficulty, timeLimit: level.timeLimit, passingScore: level.passingScore })
  }

  const handleSaveItem = (id: string) => {
    const item = editItems.find((i) => i.id === id)
    if (item) updateItem(id, { name: item.name, cooldownMs: item.cooldownMs, effect: item.effect })
  }

  const handleAddItem = () => {
    if (!newItem.id || !newItem.name) return
    const full: ItemConfig = {
      id: newItem.id, name: newItem.name, description: newItem.description || '',
      icon: newItem.icon || '📦', cooldownMs: newItem.cooldownMs || 30000,
      effect: newItem.effect || { type: 'reveal', value: 1 },
    }
    addItem(full)
    setNewItem({ id: '', name: '', cooldownMs: 30000, effect: { type: 'reveal', value: 1 } })
  }

  const handleSaveAchievement = (id: string) => {
    const ach = editAchievements.find((a) => a.id === id)
    if (ach) updateAchievement(id, { name: ach.name, condition: ach.condition })
  }

  const handleAddAchievement = () => {
    if (!newAch.id || !newAch.name) return
    const full: AchievementConfig = {
      id: newAch.id, name: newAch.name, description: newAch.description || '',
      icon: newAch.icon || '🏅', condition: newAch.condition || { type: 'accuracy', threshold: 0 },
      reward: newAch.reward || 0,
    }
    addAchievement(full)
    setNewAch({ id: '', name: '', condition: { type: 'accuracy', threshold: 0 }, reward: 0 })
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#1a0f0a' }}>
        <motion.div className="rounded-xl p-8 border w-80 text-center"
          style={{ backgroundColor: '#2a1a14', borderColor: '#B76E7944' }}
          initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
          <Lock className="w-8 h-8 mx-auto mb-4" style={{ color: '#B76E79' }} />
          <h2 className="text-xl font-semibold mb-4" style={{ color: '#B76E79' }}>管理员验证</h2>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            placeholder="请输入密码" style={inputStyle} className="mb-4" />
          <button onClick={handleLogin}
            className="w-full py-2 rounded-lg font-medium transition-colors"
            style={{ backgroundColor: '#B76E79', color: '#1a0f0a' }}>
            验证
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#1a0f0a' }}>
      <div className="max-w-4xl mx-auto px-6 py-10">
        <motion.h1 className="text-3xl font-bold mb-6"
          style={{ color: '#B76E79', fontFamily: "'Playfair Display', serif" }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          管理后台
        </motion.h1>

        <div className="flex gap-2 mb-8">
          {TABS.map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className="px-5 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{
                backgroundColor: activeTab === tab ? '#B76E79' : 'transparent',
                color: activeTab === tab ? '#1a0f0a' : '#B76E79',
                border: `1px solid ${activeTab === tab ? '#B76E79' : '#B76E7944'}`,
              }}>
              {tab}
            </button>
          ))}
        </div>

        {activeTab === '关卡配置' && (
          <motion.div className="space-y-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {editLevels.map((level) => (
              <div key={level.id} className="rounded-xl p-5 border"
                style={{ backgroundColor: '#2a1a14', borderColor: '#B76E7944' }}>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                  <div>
                    <label className="text-xs mb-1 block" style={{ color: '#B76E7966' }}>名称</label>
                    <input value={level.name} style={inputStyle}
                      onChange={(e) => setEditLevels(editLevels.map((l) => l.id === level.id ? { ...l, name: e.target.value } : l))} />
                  </div>
                  <div>
                    <label className="text-xs mb-1 block" style={{ color: '#B76E7966' }}>难度</label>
                    <input type="number" value={level.difficulty} style={inputStyle}
                      onChange={(e) => setEditLevels(editLevels.map((l) => l.id === level.id ? { ...l, difficulty: Number(e.target.value) } : l))} />
                  </div>
                  <div>
                    <label className="text-xs mb-1 block" style={{ color: '#B76E7966' }}>限时(秒)</label>
                    <input type="number" value={level.timeLimit} style={inputStyle}
                      onChange={(e) => setEditLevels(editLevels.map((l) => l.id === level.id ? { ...l, timeLimit: Number(e.target.value) } : l))} />
                  </div>
                  <div>
                    <label className="text-xs mb-1 block" style={{ color: '#B76E7966' }}>及格分</label>
                    <input type="number" value={level.passingScore} style={inputStyle}
                      onChange={(e) => setEditLevels(editLevels.map((l) => l.id === level.id ? { ...l, passingScore: Number(e.target.value) } : l))} />
                  </div>
                </div>
                <button onClick={() => handleSaveLevel(level.id)}
                  className="flex items-center gap-1 px-4 py-1.5 rounded-lg text-sm"
                  style={{ backgroundColor: '#B76E7922', color: '#B76E79', border: '1px solid #B76E7944' }}>
                  <Save className="w-3.5 h-3.5" /> 保存
                </button>
              </div>
            ))}
          </motion.div>
        )}

        {activeTab === '道具配置' && (
          <motion.div className="space-y-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {editItems.map((item) => (
              <div key={item.id} className="rounded-xl p-5 border"
                style={{ backgroundColor: '#2a1a14', borderColor: '#B76E7944' }}>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-3">
                  <div>
                    <label className="text-xs mb-1 block" style={{ color: '#B76E7966' }}>名称</label>
                    <input value={item.name} style={inputStyle}
                      onChange={(e) => setEditItems(editItems.map((i) => i.id === item.id ? { ...i, name: e.target.value } : i))} />
                  </div>
                  <div>
                    <label className="text-xs mb-1 block" style={{ color: '#B76E7966' }}>冷却(ms)</label>
                    <input type="number" value={item.cooldownMs} style={inputStyle}
                      onChange={(e) => setEditItems(editItems.map((i) => i.id === item.id ? { ...i, cooldownMs: Number(e.target.value) } : i))} />
                  </div>
                  <div>
                    <label className="text-xs mb-1 block" style={{ color: '#B76E7966' }}>效果类型</label>
                    <select value={item.effect.type} style={inputStyle}
                      onChange={(e) => setEditItems(editItems.map((i) => i.id === item.id ? { ...i, effect: { ...i.effect, type: e.target.value as ItemConfig['effect']['type'] } } : i))}>
                      <option value="reveal">揭示</option>
                      <option value="freeze">冻结</option>
                      <option value="auto-match">自动匹配</option>
                      <option value="shield">护盾</option>
                    </select>
                  </div>
                </div>
                <button onClick={() => handleSaveItem(item.id)}
                  className="flex items-center gap-1 px-4 py-1.5 rounded-lg text-sm"
                  style={{ backgroundColor: '#B76E7922', color: '#B76E79', border: '1px solid #B76E7944' }}>
                  <Save className="w-3.5 h-3.5" /> 保存
                </button>
              </div>
            ))}
            <div className="rounded-xl p-5 border border-dashed"
              style={{ backgroundColor: '#2a1a14', borderColor: '#B76E7966' }}>
              <p className="text-sm mb-3" style={{ color: '#B76E7966' }}>新增道具</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-3">
                <input placeholder="ID" value={newItem.id || ''} style={inputStyle}
                  onChange={(e) => setNewItem({ ...newItem, id: e.target.value })} />
                <input placeholder="名称" value={newItem.name || ''} style={inputStyle}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} />
                <input type="number" placeholder="冷却(ms)" value={newItem.cooldownMs || ''} style={inputStyle}
                  onChange={(e) => setNewItem({ ...newItem, cooldownMs: Number(e.target.value) })} />
              </div>
              <button onClick={handleAddItem}
                className="flex items-center gap-1 px-4 py-1.5 rounded-lg text-sm"
                style={{ backgroundColor: '#B76E7922', color: '#B76E79', border: '1px solid #B76E7944' }}>
                <Plus className="w-3.5 h-3.5" /> 添加
              </button>
            </div>
          </motion.div>
        )}

        {activeTab === '成就配置' && (
          <motion.div className="space-y-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {editAchievements.map((ach) => (
              <div key={ach.id} className="rounded-xl p-5 border"
                style={{ backgroundColor: '#2a1a14', borderColor: '#B76E7944' }}>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-3">
                  <div>
                    <label className="text-xs mb-1 block" style={{ color: '#B76E7966' }}>名称</label>
                    <input value={ach.name} style={inputStyle}
                      onChange={(e) => setEditAchievements(editAchievements.map((a) => a.id === ach.id ? { ...a, name: e.target.value } : a))} />
                  </div>
                  <div>
                    <label className="text-xs mb-1 block" style={{ color: '#B76E7966' }}>条件类型</label>
                    <select value={ach.condition.type} style={inputStyle}
                      onChange={(e) => setEditAchievements(editAchievements.map((a) => a.id === ach.id ? { ...a, condition: { ...a.condition, type: e.target.value as AchievementConditionType } } : a))}>
                      <option value="accuracy">准确率</option>
                      <option value="time">时间</option>
                      <option value="event">事件</option>
                      <option value="stars">星级</option>
                      <option value="level-clear">通关</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs mb-1 block" style={{ color: '#B76E7966' }}>阈值</label>
                    <input type="number" value={ach.condition.threshold} style={inputStyle}
                      onChange={(e) => setEditAchievements(editAchievements.map((a) => a.id === ach.id ? { ...a, condition: { ...a.condition, threshold: Number(e.target.value) } } : a))} />
                  </div>
                </div>
                <button onClick={() => handleSaveAchievement(ach.id)}
                  className="flex items-center gap-1 px-4 py-1.5 rounded-lg text-sm"
                  style={{ backgroundColor: '#B76E7922', color: '#B76E79', border: '1px solid #B76E7944' }}>
                  <Save className="w-3.5 h-3.5" /> 保存
                </button>
              </div>
            ))}
            <div className="rounded-xl p-5 border border-dashed"
              style={{ backgroundColor: '#2a1a14', borderColor: '#B76E7966' }}>
              <p className="text-sm mb-3" style={{ color: '#B76E7966' }}>新增成就</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-3">
                <input placeholder="ID" value={newAch.id || ''} style={inputStyle}
                  onChange={(e) => setNewAch({ ...newAch, id: e.target.value })} />
                <input placeholder="名称" value={newAch.name || ''} style={inputStyle}
                  onChange={(e) => setNewAch({ ...newAch, name: e.target.value })} />
                <input type="number" placeholder="阈值" value={newAch.condition?.threshold || ''} style={inputStyle}
                  onChange={(e) => setNewAch({ ...newAch, condition: { ...newAch.condition!, threshold: Number(e.target.value) } })} />
              </div>
              <button onClick={handleAddAchievement}
                className="flex items-center gap-1 px-4 py-1.5 rounded-lg text-sm"
                style={{ backgroundColor: '#B76E7922', color: '#B76E79', border: '1px solid #B76E7944' }}>
                <Plus className="w-3.5 h-3.5" /> 添加
              </button>
            </div>
          </motion.div>
        )}

        <div className="flex justify-center mt-10">
          <button onClick={() => navigate('/')}
            className="flex items-center gap-2 px-6 py-3 rounded-lg border transition-colors"
            style={{ borderColor: '#B76E79', color: '#B76E79' }}>
            <Home className="w-4 h-4" />
            返回主页
          </button>
        </div>
      </div>
    </div>
  )
}
