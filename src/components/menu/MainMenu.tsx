import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Settings } from 'lucide-react'
import GameCanvas, { type GameCanvasHandle } from '@/components/pixi/GameCanvas'

export default function MainMenu() {
  const navigate = useNavigate()
  const canvasRef = useRef<GameCanvasHandle>(null)

  const handleStart = () => {
    canvasRef.current?.createParticles(window.innerWidth / 2, window.innerHeight / 2, '#ff6b35')
    setTimeout(() => navigate('/game/1'), 400)
  }

  return (
    <div className="relative flex h-screen w-screen flex-col items-center justify-center overflow-hidden bg-[#1a1a2e]">
      <div className="absolute inset-0">
        <GameCanvas ref={canvasRef} />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-6">
        <div className="flex flex-col items-center gap-2">
          <h1
            className="text-5xl font-black tracking-wider text-[#f5f0e8]"
            style={{ textShadow: '0 0 40px rgba(255,107,53,0.4), 0 0 80px rgba(255,107,53,0.2)' }}
          >
            车源上架模拟
          </h1>
          <p className="text-lg tracking-widest text-[#f5f0e8]/60">二手车门店经营训练</p>
        </div>

        <div className="mt-4 flex flex-col items-center gap-3">
          <button
            onClick={handleStart}
            className="w-56 rounded-2xl bg-[#ff6b35] px-8 py-4 text-xl font-bold text-[#f5f0e8] shadow-lg shadow-[#ff6b35]/30 transition-all hover:scale-105 hover:shadow-xl hover:shadow-[#ff6b35]/40 active:scale-95"
          >
            开始游戏
          </button>

          <button
            onClick={() => navigate('/levels')}
            className="w-56 rounded-2xl border-2 border-[#ff6b35]/60 bg-transparent px-8 py-3 text-lg font-semibold text-[#ff6b35] transition-all hover:border-[#ff6b35] hover:bg-[#ff6b35]/10 active:scale-95"
          >
            关卡选择
          </button>

          <button
            onClick={() => navigate('/review')}
            className="w-56 rounded-2xl border-2 border-[#f5f0e8]/30 bg-transparent px-8 py-3 text-lg font-semibold text-[#f5f0e8]/70 transition-all hover:border-[#f5f0e8]/50 hover:bg-white/5 active:scale-95"
          >
            复盘对比
          </button>
        </div>
      </div>

      <button
        onClick={() => navigate('/settings')}
        className="absolute right-4 top-4 z-20 rounded-full p-3 text-[#f5f0e8]/60 transition-colors hover:bg-white/10 hover:text-[#f5f0e8]"
      >
        <Settings size={24} />
      </button>
    </div>
  )
}
