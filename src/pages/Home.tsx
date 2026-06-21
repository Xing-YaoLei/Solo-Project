import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Phaser from 'phaser'
import { createGameConfig } from '@/game/config'
import { useGameStore } from '@/store/gameStore'
import { Settings, BarChart3, ArrowLeft } from 'lucide-react'

export default function Home() {
  const gameContainerRef = useRef<HTMLDivElement>(null)
  const gameRef = useRef<Phaser.Game | null>(null)
  const navigate = useNavigate()
  const initGame = useGameStore((s) => s.initGame)

  useEffect(() => {
    initGame()

    if (gameContainerRef.current && !gameRef.current) {
      gameRef.current = new Phaser.Game(createGameConfig('game-container'))
    }

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true)
        gameRef.current = null
      }
    }
  }, [initGame])

  return (
    <div className="min-h-screen bg-[#1B2A4A]">
      <div className="flex flex-col h-screen">
        <div className="flex items-center justify-between px-6 py-3 bg-[#0F1D36] border-b border-[#D4A843]/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#D4A843]/20 flex items-center justify-center">
              <span className="text-xl">⚖️</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-[#D4A843]">法律服务费用报价经营模拟</h1>
              <p className="text-xs text-[#64748B]">Legal Service Fee Quotation Training</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/records')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#243656] border border-[#D4A843]/30 text-[#D4A843] hover:bg-[#D4A843]/10 transition-colors"
            >
              <BarChart3 className="w-4 h-4" />
              <span className="text-sm font-medium">训练记录</span>
            </button>
            <button
              onClick={() => navigate('/config')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#243656] border border-[#D4A843]/30 text-[#D4A843] hover:bg-[#D4A843]/10 transition-colors"
            >
              <Settings className="w-4 h-4" />
              <span className="text-sm font-medium">配置管理</span>
            </button>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
          <div
            id="game-container"
            ref={gameContainerRef}
            className="w-full h-full max-w-[1280px] max-h-[720px] rounded-xl overflow-hidden shadow-2xl border border-[#D4A843]/20"
          />
        </div>
      </div>
    </div>
  )
}

export function PageHeader({ title, subtitle, showBack = true }: { title: string; subtitle?: string; showBack?: boolean }) {
  const navigate = useNavigate()
  return (
    <div className="flex items-center justify-between px-6 py-4 bg-[#0F1D36] border-b border-[#D4A843]/20">
      <div className="flex items-center gap-4">
        {showBack && (
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1 text-[#64748B] hover:text-[#D4A843] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm">返回</span>
          </button>
        )}
        <div>
          <h1 className="text-xl font-bold text-[#D4A843]">{title}</h1>
          {subtitle && <p className="text-xs text-[#64748B] mt-0.5">{subtitle}</p>}
        </div>
      </div>
    </div>
  )
}
