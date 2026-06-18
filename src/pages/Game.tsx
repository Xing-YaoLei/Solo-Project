import { useEffect, useRef, useState, useCallback } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { X, ChevronUp, ChevronDown, FileText, User, Car } from "lucide-react"
import { ShowroomScene } from "@/babylon/ShowroomScene"
import { useGameStore } from "@/store/gameStore"
import { levels } from "@/data/levels"

const clueTypeConfig = {
  test_drive_record: { label: "试驾记录", icon: FileText },
  customer_profile: { label: "客户线索", icon: User },
  vehicle_archive: { label: "车辆档案", icon: Car },
}

type ClueTab = "test_drive_record" | "customer_profile" | "vehicle_archive"

const objectTypeToClueType: Record<string, string> = {
  desk: "test_drive_record",
  cabinet: "vehicle_archive",
  reception: "customer_profile",
  car: "vehicle_archive",
}

export default function Game() {
  const { levelId } = useParams<{ levelId: string }>()
  const navigate = useNavigate()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sceneRef = useRef<ShowroomScene | null>(null)

  const startLevel = useGameStore((s) => s.startLevel)
  const collectClue = useGameStore((s) => s.collectClue)
  const makeDecision = useGameStore((s) => s.makeDecision)
  const endLevel = useGameStore((s) => s.endLevel)
  const remainingTime = useGameStore((s) => s.remainingTime)
  const isPlaying = useGameStore((s) => s.isPlaying)
  const collectedClueIds = useGameStore((s) => s.collectedClueIds)
  const decisions = useGameStore((s) => s.decisions)

  const [clueDrawerOpen, setClueDrawerOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<ClueTab>("test_drive_record")
  const [showDecisionPanel, setShowDecisionPanel] = useState(false)

  const level = levels.find((l) => l.id === levelId)

  const handleObjectClick = useCallback(
    (eventData: { type: string; clueId: string }) => {
      if (!level) return
      const clueType = objectTypeToClueType[eventData.type]
      if (!clueType) return

      const state = useGameStore.getState()
      const collectedClueIdsNow = state.collectedClueIds

      const typeClues = level.clues.filter((c) => c.type === clueType)
      const collectedOfType = typeClues.filter((c) =>
        collectedClueIdsNow.includes(c.id)
      )

      if (collectedOfType.length < typeClues.length) {
        const nextUncollected = typeClues.find(
          (c) => !collectedClueIdsNow.includes(c.id)
        )
        if (nextUncollected) {
          collectClue(nextUncollected.id)
        }
      }
    },
    [level, collectClue]
  )

  useEffect(() => {
    if (!levelId || !level) return
    startLevel(levelId)
  }, [levelId, level, startLevel])

  useEffect(() => {
    if (!canvasRef.current || !level) return

    const scene = new ShowroomScene(canvasRef.current)
    sceneRef.current = scene

    scene.onObjectClicked.add(handleObjectClick)
    scene.startRenderLoop()

    return () => {
      scene.onObjectClicked.removeCallback(handleObjectClick)
      scene.dispose()
      sceneRef.current = null
    }
  }, [level, handleObjectClick])

  useEffect(() => {
    if (!isPlaying) return
    const timer = setInterval(() => {
      const state = useGameStore.getState()
      if (state.remainingTime <= 0) {
        clearInterval(timer)
        return
      }
      const levelData = levels.find((l) => l.id === state.currentLevelId)
      if (levelData) {
        useGameStore.setState({ remainingTime: state.remainingTime - 1 })
      }
    }, 1000)
    return () => clearInterval(timer)
  }, [isPlaying])

  const handleFinish = useCallback(() => {
    if (!levelId) return
    endLevel()
    navigate(`/result/${levelId}`)
  }, [levelId, endLevel, navigate])

  useEffect(() => {
    if (remainingTime <= 0 && isPlaying) {
      handleFinish()
    }
  }, [remainingTime, isPlaying, handleFinish])

  const handleDecisionSelect = (
    decisionPointId: string,
    selectedOptionId: string,
  ) => {
    const timeToDecide = 0
    makeDecision(decisionPointId, selectedOptionId, timeToDecide)

    const allDecided = decisions.length + 1 >= (level?.decisions.length || 0)
    if (allDecided) {
      setTimeout(() => handleFinish(), 500)
    }
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
  }

  if (!level) {
    return (
      <div className="min-h-screen bg-charcoal flex items-center justify-center">
        <p className="text-gray-400">关卡不存在</p>
      </div>
    )
  }

  const cluesByTab = {
    test_drive_record: level.clues.filter((c) => c.type === "test_drive_record"),
    customer_profile: level.clues.filter((c) => c.type === "customer_profile"),
    vehicle_archive: level.clues.filter((c) => c.type === "vehicle_archive"),
  }

  const collectedCount = collectedClueIds.length
  const totalCount = level.clues.length
  const allCollected = collectedCount >= totalCount

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-charcoal">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ zIndex: 0 }}
      />

      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 10 }}>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[70%] pointer-events-auto">
          <div className="bg-charcoal-dark/85 backdrop-blur-sm border-b border-amber/20 px-6 py-3 flex items-center justify-between">
            <div>
              <h2 className="font-serif text-amber text-lg">{level.task.title}</h2>
              <p className="text-gray-400 text-sm mt-0.5">{level.task.description}</p>
            </div>
            <div className="text-right flex-shrink-0 ml-4">
              <span className={`font-mono text-2xl ${remainingTime <= 30 ? "text-rust" : "text-amber"}`}>
                {formatTime(remainingTime)}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={() => navigate(-1)}
          className="absolute top-3 right-3 pointer-events-auto w-9 h-9 rounded-lg 
                     bg-charcoal-dark/80 border border-amber/20 flex items-center justify-center
                     hover:border-amber/50 transition-colors"
        >
          <X size={18} className="text-gray-400" />
        </button>

        <div className="absolute bottom-0 left-0 right-0 pointer-events-auto">
          <button
            onClick={() => setClueDrawerOpen(!clueDrawerOpen)}
            className="w-full bg-charcoal-dark/90 backdrop-blur-sm border-t border-amber/20 px-6 py-2
                       flex items-center justify-between hover:bg-charcoal-dark/95 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-amber font-serif">线索收集</span>
              <span className="text-sm text-gray-400">
                {collectedCount}/{totalCount}
              </span>
            </div>
            {clueDrawerOpen ? <ChevronUp size={18} className="text-amber" /> : <ChevronDown size={18} className="text-amber" />}
          </button>

          {clueDrawerOpen && (
            <div className="bg-charcoal-dark/95 backdrop-blur-sm border-t border-amber/10 p-4 max-h-[50vh] overflow-y-auto">
              <div className="flex gap-2 mb-4">
                {(Object.keys(clueTypeConfig) as ClueTab[]).map((tab) => {
                  const config = clueTypeConfig[tab]
                  const Icon = config.icon
                  const tabCount = cluesByTab[tab].length
                  const tabCollected = cluesByTab[tab].filter((c) =>
                    collectedClueIds.includes(c.id)
                  ).length
                  return (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all ${
                        activeTab === tab
                          ? "bg-amber/20 text-amber border border-amber/30"
                          : "bg-charcoal-light text-gray-400 border border-gray-700 hover:text-amber"
                      }`}
                    >
                      <Icon size={14} />
                      <span>{config.label}</span>
                      <span className="text-xs">({tabCollected}/{tabCount})</span>
                    </button>
                  )
                })}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {cluesByTab[activeTab].map((clue) => {
                  const isCollected = collectedClueIds.includes(clue.id)
                  return (
                    <div
                      key={clue.id}
                      className={`rounded-lg p-4 border transition-all ${
                        isCollected
                          ? "bg-charcoal-light border-amber/30"
                          : "bg-charcoal border-gray-700 opacity-50"
                      }`}
                    >
                      <h4 className={`text-sm font-medium mb-1 ${isCollected ? "text-amber" : "text-gray-500"}`}>
                        {isCollected ? clue.title : "???"}
                      </h4>
                      {isCollected && (
                        <p className="text-xs text-gray-400 leading-relaxed">{clue.content}</p>
                      )}
                      {clue.isCritical && isCollected && (
                        <span className="inline-block mt-2 text-xs px-2 py-0.5 rounded bg-rust/20 text-rust">
                          关键线索
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {(allCollected || showDecisionPanel) && (
          <div className="absolute top-16 right-0 w-80 max-h-[70vh] pointer-events-auto overflow-y-auto">
            <div className="bg-charcoal-dark/95 backdrop-blur-sm border-l border-amber/20 p-5 m-3 rounded-xl">
              <h3 className="font-serif text-amber text-lg mb-4">决策面板</h3>
              {level.decisions.map((decision, idx) => {
                const answered = decisions.find(
                  (d) => d.decisionPointId === decision.id
                )
                return (
                  <div key={decision.id} className="mb-5 last:mb-0">
                    <p className="text-sm text-gray-300 mb-3">
                      {idx + 1}. {decision.question}
                    </p>
                    <div className="space-y-2">
                      {decision.options.map((option) => {
                        const isSelected = answered?.selectedOptionId === option.id
                        const isCorrect = isSelected && decision.correctOptionId === option.id
                        const isWrong = isSelected && decision.correctOptionId !== option.id
                        return (
                          <button
                            key={option.id}
                            onClick={() =>
                              !answered &&
                              handleDecisionSelect(decision.id, option.id)
                            }
                            disabled={!!answered}
                            className={`w-full text-left px-4 py-2.5 rounded-lg border text-sm transition-all ${
                              isCorrect
                                ? "bg-jade/20 border-jade/40 text-jade"
                                : isWrong
                                ? "bg-rust/20 border-rust/40 text-rust"
                                : isSelected
                                ? "bg-amber/20 border-amber/40 text-amber"
                                : "bg-charcoal-light border-gray-700 text-gray-300 hover:border-amber/30 hover:text-amber"
                            } ${answered ? "cursor-default" : "cursor-pointer"}`}
                          >
                            <span className="font-medium">{option.label}</span>
                            <span className="block text-xs text-gray-500 mt-0.5">
                              {option.description}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                    {answered && !answered.isCorrect && (
                      <p className="text-xs text-rust/80 mt-2">
                        {decision.knowledgePoint}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {!allCollected && !showDecisionPanel && isPlaying && (
          <div className="absolute top-16 right-3 pointer-events-auto">
            <button
              onClick={() => setShowDecisionPanel(true)}
              className="btn-secondary text-sm"
            >
              开始决策
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
