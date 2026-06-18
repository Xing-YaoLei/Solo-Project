import { useGameStore } from '@/stores/useGameStore'
import AnimatedNumber from '@/components/common/AnimatedNumber'

export default function ScoreBar() {
  const score = useGameStore((s) => s.score)
  const errorCount = useGameStore((s) => s.errorCount)
  const consecutiveCorrect = useGameStore((s) => s.consecutiveCorrect)
  const maxConsecutive = useGameStore((s) => s.maxConsecutive)

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#2a2a4a] border-t border-[#3a3a5a] px-4 py-2">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        <div className="flex items-center gap-1.5">
          <svg className="w-4 h-4 text-[#f5f0e8]/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
          <span className="text-xs text-[#f5f0e8]/70">得分</span>
          <AnimatedNumber value={score} className="text-sm font-bold text-[#f5f0e8]" />
        </div>

        <div className="flex items-center gap-1.5">
          <svg className="w-4 h-4 text-[#ef4444]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-xs text-[#f5f0e8]/70">错误</span>
          <AnimatedNumber value={errorCount} className="text-sm font-bold text-[#ef4444]" />
        </div>

        <div className="flex items-center gap-1.5">
          <svg className="w-4 h-4 text-[#ff6b35]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span className="text-xs text-[#f5f0e8]/70">连对</span>
          <AnimatedNumber value={consecutiveCorrect} className="text-sm font-bold text-[#ff6b35]" />
        </div>

        <div className="flex items-center gap-1.5">
          <svg className="w-4 h-4 text-[#f5f0e8]/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
          <span className="text-xs text-[#f5f0e8]/70">最高</span>
          <AnimatedNumber value={maxConsecutive} className="text-sm font-bold text-[#f5f0e8]/70" />
        </div>
      </div>
    </div>
  )
}
