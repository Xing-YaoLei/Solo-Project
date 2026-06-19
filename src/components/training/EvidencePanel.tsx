import { useState } from 'react'
import { CheckCircle2, XCircle, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTrainingStore } from '@/stores/useTrainingStore'
import { useSceneStore } from '@/stores/useSceneStore'
import type { Evidence, Question } from '@/types/training'

interface EvidencePanelProps {
  question: Question
  evidences: Evidence[]
}

interface SelectedState {
  [key: string]: 'pending' | 'correct' | 'wrong'
}

export default function EvidencePanel({ question, evidences }: EvidencePanelProps) {
  const [selected, setSelected] = useState<SelectedState>({})
  const [submitted, setSubmitted] = useState(false)
  const submitAnswer = useTrainingStore((s) => s.submitAnswer)
  const selectEvidence = useSceneStore((s) => s.selectEvidence)
  const selectedEvidence = useSceneStore((s) => s.selectedEvidence)

  const handleToggle = (evidence: Evidence) => {
    if (submitted) return
    if (selected[evidence.id]) {
      const newSelected = { ...selected }
      delete newSelected[evidence.id]
      setSelected(newSelected)
      selectEvidence(null)
    } else {
      setSelected({ ...selected, [evidence.id]: 'pending' })
      selectEvidence(evidence.id)
    }
  }

  const handleSubmit = () => {
    const selectedIds = Object.keys(selected)
    const correctIds = evidences.filter((e) => e.isCorrect).map((e) => e.id)
    const isCorrect =
      selectedIds.length === correctIds.length &&
      selectedIds.every((id) => correctIds.includes(id))

    const newSelected: SelectedState = {}
    selectedIds.forEach((id) => {
      const ev = evidences.find((e) => e.id === id)
      newSelected[id] = ev?.isCorrect ? 'correct' : 'wrong'
    })
    setSelected(newSelected)
    setSubmitted(true)
    submitAnswer(question.id, { selectedIds, isCorrect })
  }

  const handleReset = () => {
    setSelected({})
    setSubmitted(false)
    selectEvidence(null)
  }

  const selectedCount = Object.keys(selected).length
  const correctCount = evidences.filter((e) => e.isCorrect).length

  return (
    <div className="flex h-full flex-col rounded-xl bg-white p-4 shadow-sm">
      <div className="mb-3">
        <div className="mb-2 flex items-center gap-2">
          <Search className="h-5 w-5 text-indigo-600" />
          <h3 className="text-base font-semibold text-gray-900">证据识别</h3>
          <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs text-indigo-600">
            {question.score}分
          </span>
        </div>
        <p className="text-sm text-gray-600">{question.description}</p>
        <p className="mt-1 text-xs text-gray-400">
          需要找出 {correctCount} 项正确证据，已选 {selectedCount} 项
        </p>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto">
        {evidences.map((evidence) => {
          const state = selected[evidence.id]
          const isHighlighted = selectedEvidence === evidence.id

          return (
            <button
              key={evidence.id}
              onClick={() => handleToggle(evidence)}
              disabled={submitted}
              className={cn(
                'w-full rounded-lg border p-3 text-left transition-all',
                'hover:border-indigo-300 hover:bg-indigo-50',
                state === 'correct' && 'border-green-500 bg-green-50',
                state === 'wrong' && 'border-red-500 bg-red-50',
                state === 'pending' && 'border-indigo-500 bg-indigo-50',
                isHighlighted && !submitted && 'ring-2 ring-indigo-400',
                submitted && 'cursor-default'
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{evidence.name}</p>
                  <p className="mt-0.5 text-xs text-gray-500">{evidence.description}</p>
                </div>
                {state === 'correct' && <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-green-500" />}
                {state === 'wrong' && <XCircle className="h-5 w-5 flex-shrink-0 text-red-500" />}
                {state === 'pending' && (
                  <div className="h-5 w-5 flex-shrink-0 rounded-full border-2 border-indigo-500 bg-indigo-500" />
                )}
              </div>
            </button>
          )
        })}
      </div>

      <div className="mt-4 flex gap-2">
        {!submitted ? (
          <>
            <button
              onClick={handleReset}
              className="flex-1 rounded-lg border border-gray-300 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              重置
            </button>
            <button
              onClick={handleSubmit}
              disabled={selectedCount === 0}
              className="flex-1 rounded-lg bg-indigo-600 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:bg-gray-300"
            >
              提交答案
            </button>
          </>
        ) : (
          <div className="w-full rounded-lg bg-gray-50 p-3 text-center text-sm text-gray-600">
            已提交，点击「下一题」继续
          </div>
        )}
      </div>
    </div>
  )
}
