import { useEffect, useState } from 'react'
import { CheckCircle2, XCircle, ArrowRight, Trophy } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTrainingStore } from '@/stores/useTrainingStore'

interface FeedbackModalProps {
  isOpen: boolean
  isCorrect: boolean
  reason: string
  score?: number
  onContinue: () => void
  isLastQuestion?: boolean
}

export default function FeedbackModal({
  isOpen,
  isCorrect,
  reason,
  score,
  onContinue,
  isLastQuestion = false,
}: FeedbackModalProps) {
  const [showAnimation, setShowAnimation] = useState(false)
  const nextQuestion = useTrainingStore((s) => s.nextQuestion)

  useEffect(() => {
    if (isOpen) {
      setShowAnimation(false)
      const timer = setTimeout(() => setShowAnimation(true), 50)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleContinue = () => {
    if (!isLastQuestion) {
      nextQuestion()
    }
    onContinue()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        className={cn(
          'w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl transition-all duration-300',
          showAnimation ? 'scale-100 opacity-100' : 'scale-90 opacity-0'
        )}
      >
        <div className="mb-4 flex justify-center">
          <div
            className={cn(
              'flex h-20 w-20 items-center justify-center rounded-full transition-all duration-500',
              isCorrect ? 'bg-green-100' : 'bg-red-100',
              showAnimation && 'animate-pulse'
            )}
          >
            {isCorrect ? (
              <CheckCircle2
                className={cn(
                  'h-12 w-12 text-green-500 transition-transform duration-500',
                  showAnimation && 'scale-110'
                )}
              />
            ) : (
              <XCircle
                className={cn(
                  'h-12 w-12 text-red-500 transition-transform duration-500',
                  showAnimation && 'scale-110'
                )}
              />
            )}
          </div>
        </div>

        <div className="mb-4 text-center">
          <h2
            className={cn(
              'mb-1 text-xl font-bold',
              isCorrect ? 'text-green-600' : 'text-red-600'
            )}
          >
            {isCorrect ? '回答正确！' : '回答错误'}
          </h2>
          {score !== undefined && score > 0 && (
            <div className="mb-2 inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1">
              <Trophy className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-semibold text-amber-600">+{score} 分</span>
            </div>
          )}
        </div>

        <div
          className={cn(
            'mb-6 rounded-lg p-4',
            isCorrect ? 'bg-green-50' : 'bg-red-50'
          )}
        >
          <p className="mb-1 text-xs font-medium text-gray-500">解析</p>
          <p className={cn('text-sm', isCorrect ? 'text-green-700' : 'text-red-700')}>
            {reason}
          </p>
        </div>

        <button
          onClick={handleContinue}
          className={cn(
            'flex w-full items-center justify-center gap-2 rounded-lg py-3 text-sm font-semibold text-white transition-all hover:opacity-90',
            isCorrect ? 'bg-green-600' : 'bg-red-600'
          )}
        >
          {isLastQuestion ? '完成训练' : '继续下一题'}
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
