import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, Clock, Package, AlertTriangle, Image, ArrowRight } from 'lucide-react'
import { useGameStore } from '@/stores/useGameStore'
import { useConfigStore } from '@/stores/useConfigStore'
import { useUIStore } from '@/stores/useUIStore'
import { useStatsStore } from '@/stores/useStatsStore'
import { useTimer } from '@/hooks/useTimer'
import { useEventSystem } from '@/hooks/useEventSystem'
import { SalonScene } from '@/components/3d/SalonScene'
import { HUD } from '@/components/ui/HUD'
import { EventPanel } from '@/components/ui/EventPanel'
import { Toast } from '@/components/ui/Toast'
import { EffectPhoto } from '@/components/3d/EffectPhoto'


const EFFECT_PHOTO_PAIRS: Record<string, { before: string; after: string }[]> = {
  '面部护理': [
    { before: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=close%20up%20of%20womans%20face%20before%20facial%20treatment%20with%20visible%20skin%20imperfections%20soft%20lighting&image_size=landscape_4_3', after: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=close%20up%20of%20womans%20face%20after%20luxury%20facial%20treatment%20glowing%20radiant%20skin%20soft%20lighting&image_size=landscape_4_3' },
  ],
  '美甲': [
    { before: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=hands%20with%20natural%20ungroomed%20nails%20before%20manicure%20soft%20background&image_size=landscape_4_3', after: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=beautiful%20manicured%20hands%20with%20elegant%20nail%20art%20design%20rose%20gold%20accent%20soft%20lighting&image_size=landscape_4_3' },
  ],
  '按摩': [
    { before: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=woman%20with%20tense%20shoulders%20looking%20stressed%20before%20massage%20spa%20environment&image_size=landscape_4_3', after: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=relaxed%20woman%20after%20luxury%20spa%20massage%20peaceful%20serene%20expression%20warm%20lighting&image_size=landscape_4_3' },
  ],
  '发型设计': [
    { before: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=woman%20with%20messy%20dull%20hair%20before%20hair%20styling%20salon%20chair&image_size=landscape_4_3', after: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=woman%20with%20gorgeous%20styled%20hair%20after%20salon%20treatment%20shiny%20voluminous%20hair&image_size=landscape_4_3' },
  ],
  'SPA': [
    { before: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=stressed%20tired%20woman%20before%20full%20spa%20treatment%20dim%20lighting&image_size=landscape_4_3', after: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=glowing%20relaxed%20woman%20after%20luxury%20full%20body%20spa%20treatment%20serene%20calm%20zen%20atmosphere&image_size=landscape_4_3' },
  ],
}

function getEffectPhoto(service: string) {
  const pairs = EFFECT_PHOTO_PAIRS[service]
  if (!pairs || pairs.length === 0) {
    return {
      before: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=before%20photo%20placeholder%20soft%20gradient%20beauty%20salon&image_size=landscape_4_3',
      after: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=after%20photo%20placeholder%20bright%20glowing%20gradient%20beauty%20salon&image_size=landscape_4_3',
    }
  }
  return pairs[Math.floor(Math.random() * pairs.length)]
}

interface PendingInventorySelect {
  techId: string
  service: string
  requiredCategories: string[]
}

export default function GamePage() {
  const { levelId } = useParams<{ levelId: string }>()
  const navigate = useNavigate()

  const levels = useConfigStore((s) => s.levels)
  const currentLevel = useGameStore((s) => s.currentLevel)
  const phase = useGameStore((s) => s.phase)
  const setPhase = useGameStore((s) => s.setPhase)
  const records = useGameStore((s) => s.records)
  const technicians = useGameStore((s) => s.technicians)
  const inventory = useGameStore((s) => s.inventory)
  const matchedCount = useGameStore((s) => s.matchedCount)
  const wrongCount = useGameStore((s) => s.wrongCount)
  const startLevel = useGameStore((s) => s.startLevel)
  const matchRecord = useGameStore((s) => s.matchRecord)
  const handleEvent = useGameStore((s) => s.handleEvent)
  const completeLevel = useGameStore((s) => s.completeLevel)
  const resetGame = useGameStore((s) => s.resetGame)
  const addBottleneck = useGameStore((s) => s.addBottleneck)

  const addToast = useUIStore((s) => s.addToast)
  const showEffect = useUIStore((s) => s.showEffect)
  const hideEffect = useUIStore((s) => s.hideEffect)
  const showEffectPhoto = useUIStore((s) => s.showEffectPhoto)
  const effectPhotoData = useUIStore((s) => s.effectPhotoData)

  const addSession = useStatsStore((s) => s.addSession)
  const addTechnicianOutput = useStatsStore((s) => s.addTechnicianOutput)
  const addBottlenecks = useStatsStore((s) => s.addBottlenecks)

  const [selectedTechId, setSelectedTechId] = useState<string | null>(null)
  const [burstPosition, setBurstPosition] = useState<[number, number, number] | null>(null)
  const [pendingEffect, setPendingEffect] = useState<{ before: string; after: string } | null>(null)
  const [pendingInventory, setPendingInventory] = useState<PendingInventorySelect | null>(null)
  const [selectedInventoryItems, setSelectedInventoryItems] = useState<string[]>([])
  const actionTimestamps = useRef<Map<string, number>>(new Map())

  const handleTimeout = useCallback(() => {
    try {
      const session = completeLevel()
      addSession(session)
      const outputs = useGameStore.getState().technicianOutputs
      for (const output of outputs) {
        addTechnicianOutput(output)
      }
      const bns = useGameStore.getState().bottlenecks.map((b) => ({
        ...b,
        sessionId: session.id,
      }))
      addBottlenecks(bns)
      navigate(`/settlement/${levelId}`, { state: { sessionId: session.id } })
    } catch {
      navigate(`/settlement/${levelId}`)
    }
  }, [completeLevel, navigate, levelId, addSession, addTechnicianOutput, addBottlenecks])

  const timeLimit = currentLevel?.timeLimit ?? 120
  const timer = useTimer(timeLimit, handleTimeout)

  const events = currentLevel?.events ?? []
  const { activeEvent, isEventActive, dismissEvent } = useEventSystem(events, (event) => {
    useGameStore.setState({ activeEvent: event })
    addToast(`突发事件: ${event.type}`, 'warning')
    addBottleneck({
      id: crypto.randomUUID(),
      sessionId: '',
      type: 'event-fail',
      timestamp: Date.now(),
      duration: 0,
      description: `事件触发: ${event.type}`,
    })
  })

  useEffect(() => {
    if (!levelId) return
    const config = levels.find((l) => l.id === levelId)
    if (config) {
      resetGame()
      startLevel(config)
      setSelectedTechId(null)
      setSelectedInventoryItems([])
      setPendingInventory(null)
    }
  }, [levelId, levels, startLevel, resetGame])

  useEffect(() => {
    if (phase === 'matching' && currentLevel) {
      timer.start()
    }
  }, [phase, currentLevel, timer])

  const inventoryTask = currentLevel?.tasks.find((t) => t.type === 'inventory-requisition')
  const requiredItemCount = inventoryTask?.params.itemCount ?? 3

  const allRecordsMatched = useMemo(() => {
    const pending = records.filter((r) => r.status === 'pending')
    return pending.length === 0 && records.length > 0
  }, [records])

  useEffect(() => {
    if (!currentLevel) return

    if (allRecordsMatched && phase === 'matching') {
      timer.pause()
      setPhase('inventory')
      addToast('匹配完成！请进行库存领用', 'info')
    }
  }, [allRecordsMatched, phase, currentLevel, setPhase, addToast, timer])

  useEffect(() => {
    if (phase === 'inventory' && pendingInventory === null) {
      const matchedRecords = records.filter((r) => r.status === 'matched')
      if (matchedRecords.length > 0) {
        const firstMatch = matchedRecords[0]
        const tech = technicians.find((t) => t.id === firstMatch.technicianId)
        if (tech) {
          const requiredCategories = getRequiredCategories(firstMatch.service)
          setPendingInventory({
            techId: tech.id,
            service: firstMatch.service,
            requiredCategories,
          })
          setSelectedInventoryItems([])
        }
      }
    }
  }, [phase, pendingInventory, records, technicians])

  const inventoryDone = useMemo(() => {
    if (!inventoryTask) return true
    return phase === 'inventory' && selectedInventoryItems.length >= requiredItemCount
  }, [phase, selectedInventoryItems, inventoryTask, requiredItemCount])

  useEffect(() => {
    if (!currentLevel) return
    if (phase === 'inventory' && inventoryDone) {
      setPhase('settlement')
      addToast('库存领用完成！进入结算', 'success')
      setTimeout(() => {
        const session = completeLevel()
        addSession(session)
        const outputs = useGameStore.getState().technicianOutputs
        for (const output of outputs) {
          addTechnicianOutput(output)
        }
        const bns = useGameStore.getState().bottlenecks.map((b) => ({
          ...b,
          sessionId: session.id,
        }))
        addBottlenecks(bns)
        navigate(`/settlement/${levelId}`, { state: { sessionId: session.id } })
      }, 1500)
    }
  }, [phase, inventoryDone, currentLevel, completeLevel, navigate, levelId, addToast, addSession, addTechnicianOutput, addBottlenecks, setPhase])

  const getRequiredCategories = (service: string): string[] => {
    const map: Record<string, string[]> = {
      '面部护理': ['护肤品'],
      '美甲': ['美甲用品'],
      '按摩': ['身体护理'],
      '发型设计': ['美发用品'],
      'SPA': ['身体护理'],
    }
    return map[service] ?? ['护肤品']
  }

  const handleMatch = useCallback(
    (recordId: string, technicianId: string) => {
      const record = records.find((r) => r.id === recordId)
      if (!record || record.status !== 'pending') return

      const now = Date.now()
      const prevTime = actionTimestamps.current.get(recordId) ?? now
      const responseTime = prevTime ? now - prevTime : 0

      matchRecord(recordId, technicianId)
      const isCorrect = record.technicianId === technicianId

      if (isCorrect) {
        if (responseTime > 8000) {
          addBottleneck({
            id: crypto.randomUUID(),
            sessionId: '',
            type: 'hesitation',
            timestamp: now,
            duration: responseTime,
            description: `犹豫过久: 分配 ${record.customerName} 的${record.service}用时 ${(responseTime / 1000).toFixed(1)}秒`,
          })
        }
        addToast(`✓ ${record.customerName} → ${technicians.find(t => t.id === technicianId)?.name}`, 'success')
        const photos = getEffectPhoto(record.service)
        setPendingEffect(photos)
        setTimeout(() => {
          showEffect(photos.before, photos.after)
          setPendingEffect(null)
        }, 300)
        setBurstPosition([0, 2, 2])
        setTimeout(() => setBurstPosition(null), 800)
      } else {
        addBottleneck({
          id: crypto.randomUUID(),
          sessionId: '',
          type: 'mismatch',
          timestamp: now,
          duration: responseTime,
          description: `匹配错误: ${record.customerName} 的${record.service}分配给了错误技师`,
        })
        addToast('✗ 匹配失误，请重试', 'error')
      }
      setSelectedTechId(null)
      actionTimestamps.current.delete(recordId)
    },
    [records, technicians, matchRecord, addToast, addBottleneck, showEffect]
  )

  useEffect(() => {
    const interval = setInterval(() => {
      const pending = records.filter((r) => r.status === 'pending')
      const now = Date.now()
      for (const record of pending) {
        if (!actionTimestamps.current.has(record.id)) {
          actionTimestamps.current.set(record.id, now)
        }
      }
    }, 500)
    return () => clearInterval(interval)
  }, [records])

  const handleTechSelect = useCallback((techId: string) => {
    setSelectedTechId((prev) => (prev === techId ? null : techId))
  }, [])

  const handleItemSelect = useCallback(
    (itemId: string) => {
      if (phase !== 'inventory' || !pendingInventory) {
        const success = useGameStore.getState().useItem(itemId)
        if (success) {
          addToast('道具使用成功', 'info')
        } else {
          addToast('道具冷却中', 'warning')
        }
        return
      }

      const item = inventory.find((i) => i.id === itemId)
      if (!item) return

      if (item.status !== 'available') {
        addToast(`${item.name} 状态异常，无法领用`, 'error')
        return
      }

      if (selectedInventoryItems.includes(itemId)) {
        setSelectedInventoryItems((prev) => prev.filter((id) => id !== itemId))
        addToast(`已取消选择 ${item.name}`, 'info')
      } else {
        setSelectedInventoryItems((prev) => [...prev, itemId])
        addToast(`已选择 ${item.name}`, 'success')
      }
    },
    [phase, pendingInventory, inventory, selectedInventoryItems, addToast]
  )

  const handleEventResolve = useCallback(
    (correct: boolean) => {
      if (activeEvent) {
        handleEvent(activeEvent, correct)
        addToast(correct ? '事件处理成功' : '事件处理失败', correct ? 'success' : 'error')
        dismissEvent()
      }
    },
    [activeEvent, handleEvent, addToast, dismissEvent]
  )

  if (!currentLevel) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-[#1a0f0a] text-[#FFFFF0]/50">
        加载中...
      </div>
    )
  }

  const pendingRecords = records.filter((r) => r.status === 'pending')
  const matchedRecords = records.filter((r) => r.status === 'matched')
  const wrongRecords = records.filter((r) => r.status === 'wrong')
  const matchedTechIds = matchedRecords.map((r) => r.technicianId ?? '').filter(Boolean)
  const currentTask = currentLevel.tasks.find((t) => t.type === 'match-record')

  return (
    <div className="w-full h-screen flex bg-[#1a0f0a] overflow-hidden relative">
      <div className="w-[70%] h-full relative">
        <SalonScene
          technicians={technicians}
          records={pendingRecords}
          items={inventory}
          selectedTechId={selectedTechId}
          matchedTechIds={matchedTechIds}
          burstPosition={burstPosition}
          onMatch={handleMatch}
          onTechSelect={handleTechSelect}
          onItemSelect={handleItemSelect}
        />
        <HUD />

        {showEffectPhoto && effectPhotoData && (
          <EffectPhoto
            before={effectPhotoData.before}
            after={effectPhotoData.after}
            visible={showEffectPhoto}
            onComplete={hideEffect}
          />
        )}

        {phase === 'inventory' && pendingInventory && (
          <motion.div
            className="absolute top-20 left-1/2 -translate-x-1/2 z-30"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="rounded-xl border-2 border-[#B76E79] bg-[#1a0f0a]/95 backdrop-blur-md p-5 shadow-2xl min-w-[420px]">
              <div className="flex items-center gap-3 mb-4">
                <Package className="w-6 h-6 text-[#B76E79]" />
                <h3 className="text-lg font-bold text-[#B76E79]">库存领用</h3>
              </div>
              <div className="space-y-3">
                <p className="text-sm text-[#FFFFF0]/80">
                  为 <span className="text-[#B76E79] font-semibold">{technicians.find(t => t.id === pendingInventory.techId)?.name}</span> 的
                  <span className="text-[#B76E79] font-semibold"> {pendingInventory.service} </span>
                  领用耗材
                </p>
                <div className="flex items-center gap-2 text-xs text-[#FFFFF0]/60">
                  <span>建议分类：</span>
                  {pendingInventory.requiredCategories.map((cat) => (
                    <span key={cat} className="px-2 py-0.5 rounded bg-[#B76E79]/20 text-[#B76E79]">
                      {cat}
                    </span>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-[#3E2723]/40">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-[#FFFFF0]/60">已选耗材</span>
                    <span className="px-2 py-0.5 rounded-full bg-[#50C878]/20 text-[#50C878] text-sm font-bold">
                      {selectedInventoryItems.length}/{requiredItemCount}
                    </span>
                  </div>
                  {selectedInventoryItems.length >= requiredItemCount && (
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="flex items-center gap-1.5 text-[#50C878] text-sm"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>准备结算...</span>
                      <ArrowRight className="w-4 h-4 animate-pulse" />
                    </motion.div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      <div className="w-[30%] h-full border-l border-[#3E2723]/40 bg-[#1a0f0a]/90 backdrop-blur-sm overflow-y-auto">
        <div className="p-4 space-y-4">
          <div className="space-y-2">
            <h2 className="text-base font-bold text-[#B76E79]">{currentLevel.name}</h2>
            <p className="text-xs text-[#FFFFF0]/60 leading-relaxed">
              {currentLevel.description}
            </p>
          </div>

          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#3E2723]/30">
            <Clock className="w-4 h-4 text-[#B76E79]" />
            <span className="text-sm text-[#FFFFF0]/80 font-mono">
              {Math.floor(timer.timeRemaining / 60)}:
              {String(Math.floor(timer.timeRemaining % 60)).padStart(2, '0')}
            </span>
            {timer.isUrgent && (
              <span className="text-xs text-red-400 animate-pulse ml-auto">⚠ 时间紧迫</span>
            )}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-[#B76E79]" />
              <span className="text-sm font-medium text-[#FFFFF0]/80">
                当前任务
              </span>
            </div>
            {phase === 'matching' && currentTask && (
              <p className="text-xs text-[#FFFFF0]/60 pl-6">
                匹配 {currentTask.params.recordCount ?? 0} 条消费记录至对应技师手牌
              </p>
            )}
            {phase === 'inventory' && (
              <p className="text-xs text-[#FFFFF0]/60 pl-6">
                从库存柜选择 {requiredItemCount} 件耗材完成领用
              </p>
            )}
            {phase === 'settlement' && (
              <p className="text-xs text-[#50C878] pl-6">
                正在结算，请稍候...
              </p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-[#FFFFF0]/80">
                消费记录 ({records.length})
              </span>
              <span className="flex items-center gap-2 text-xs">
                <span className="text-[#50C878]">✓ {matchedCount}</span>
                <span className="text-red-400">✗ {wrongCount}</span>
              </span>
            </div>
            <div className="space-y-1.5 max-h-[28vh] overflow-y-auto pr-1">
              {pendingRecords.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-[#3E2723]/20 border border-[#B76E79]/30 hover:border-[#B76E79]/60 transition-all cursor-pointer group"
                  onClick={() => {
                    const tech = technicians.find(t => t.specialty === record.service)
                    if (tech) {
                      addToast(`💡 提示: ${record.customerName} 的服务属于「${record.service}」`, 'info')
                    }
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-[#FFFFF0]/90 truncate">{record.customerName}</span>
                    </div>
                    <div className="text-[10px] text-[#B76E79]/80 mt-0.5">{record.service}</div>
                  </div>
                  <span className="text-xs font-bold text-[#FFBF00] shrink-0 ml-2">¥{record.amount}</span>
                </div>
              ))}
              {matchedRecords.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#50C878]/10 border border-[#50C878]/30"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#50C878] shrink-0" />
                    <span className="text-xs text-[#50C878]/90 truncate">{record.customerName}</span>
                  </div>
                  <span className="text-xs text-[#50C878]/60 shrink-0">✓ ¥{record.amount}</span>
                </div>
              ))}
              {wrongRecords.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30"
                >
                  <span className="text-xs text-red-400/80 truncate">✗ {record.customerName}</span>
                  <span className="text-xs text-red-400/60 shrink-0">失误</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-[#B76E79]" />
              <span className="text-sm font-medium text-[#FFFFF0]/80">库存物资</span>
              {phase === 'inventory' && (
                <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-[#B76E79]/20 text-[#B76E79]">
                  选中 {selectedInventoryItems.length}/{requiredItemCount}
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {inventory.slice(0, 8).map((item) => {
                const isSelected = selectedInventoryItems.includes(item.id)
                const isAvailable = item.status === 'available'
                return (
                  <div
                    key={item.id}
                    onClick={() => phase === 'inventory' && handleItemSelect(item.id)}
                    className={`px-2 py-1.5 rounded-md text-xs border transition-all ${
                      isSelected
                        ? 'bg-[#B76E79]/30 border-[#B76E79] text-[#FFFFF0]'
                        : isAvailable
                          ? 'bg-[#3E2723]/20 border-[#3E2723]/30 text-[#FFFFF0]/70 hover:border-[#B76E79]/50'
                          : 'bg-red-500/10 border-red-500/30 text-red-400/70'
                    } ${phase === 'inventory' && isAvailable ? 'cursor-pointer' : ''}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="truncate">{item.name}</span>
                      <span className="text-[10px] opacity-60 ml-1">×{item.quantity}</span>
                    </div>
                    {item.status !== 'available' && (
                      <div className="text-[9px] text-red-400/80 mt-0.5">异常</div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <div className="pt-2 border-t border-[#3E2723]/30">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1.5 text-[#FFFFF0]/50">
                <Image className="w-3 h-3" />
                <span>阶段</span>
                <span className="ml-auto text-[#B76E79] font-medium">
                  {phase === 'matching' ? '手牌匹配' : phase === 'inventory' ? '库存领用' : phase === 'event' ? '事件处理' : '结算中'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[#FFFFF0]/50">
                <span>难度</span>
                <span className="ml-auto text-[#FFBF00] font-medium">
                  {'★'.repeat(currentLevel.difficulty)}
                </span>
              </div>
            </div>
          </div>

          {pendingEffect && (
            <motion.div
              className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="animate-pulse text-[#B76E79] text-lg">加载效果对比...</div>
            </motion.div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {isEventActive && activeEvent && (
          <EventPanel event={activeEvent} onResolve={handleEventResolve} />
        )}
      </AnimatePresence>

      <Toast />
    </div>
  )
}
