import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import useGameStore from '../store/gameStore.js'
import { TASK_TYPE_LABELS, TASK_TYPE_ICONS, DECISION_LABELS, DECISION_COLORS, formatTime } from '../data/gameConfig.js'

export default function Review() {
  const navigate = useNavigate()
  const {
    failureHistory,
    startReplay,
    stopReplay,
    replayData,
    replayIndex,
    nextReplayStep,
    prevReplayStep,
    isReplaying,
    clearFailureHistory,
  } = useGameStore()

  const [selectedFailure, setSelectedFailure] = useState(null)
  const currentStep = replayData[replayIndex]

  useEffect(() => {
    return () => stopReplay()
  }, [stopReplay])

  const handleSelectFailure = (failure) => {
    setSelectedFailure(failure)
  }

  const handleStartReplay = (failure) => {
    startReplay(failure.id)
    setSelectedFailure(failure)
  }

  const formatDate = (ts) => {
    const d = new Date(ts)
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
  }

  return (
    <div className="page-container" style={{
      background: 'linear-gradient(135deg, #0a0e17 0%, #1a2332 50%, #0f172a 100%)',
      padding: 32,
      overflow: 'auto',
    }}>
      <div style={{ maxWidth: 1400, margin: '0 auto', width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
              <button
                className="btn-secondary"
                onClick={() => navigate('/')}
                style={{ padding: '8px 16px' }}
              >
                ← 返回
              </button>
              <h1 style={{ fontSize: 32, fontWeight: 800 }}>
                📹 复盘回放中心
              </h1>
            </div>
            <p style={{ color: '#94a3b8', marginLeft: 70 }}>
              查看最近 {failureHistory.length} 次失败过程回放，分析错因提升技能
            </p>
          </div>
          {failureHistory.length > 0 && (
            <button
              className="btn-secondary"
              style={{ color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.3)' }}
              onClick={() => {
                if (confirm('确定清空所有失败历史记录？')) {
                  clearFailureHistory()
                  setSelectedFailure(null)
                  stopReplay()
                }
              }}
            >
              🗑️ 清空记录
            </button>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 20 }}>
          <div>
            <div className="card" style={{ padding: 16, marginBottom: 16 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>
                📋 最近失败记录
                <span className="tag tag-danger" style={{ marginLeft: 8 }}>
                  {failureHistory.length}/10
                </span>
              </h3>
              {failureHistory.length === 0 ? (
                <div style={{
                  padding: 32,
                  textAlign: 'center',
                  color: '#64748b',
                  fontSize: 14,
                }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>🎯</div>
                  暂无失败记录，继续保持！
                </div>
              ) : (
                <div style={{ maxHeight: 500, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {failureHistory.map((failure, i) => (
                    <div
                      key={failure.id}
                      onClick={() => handleSelectFailure(failure)}
                      className="fade-in"
                      style={{
                        padding: 14,
                        background: selectedFailure?.id === failure.id
                          ? 'rgba(239, 68, 68, 0.12)'
                          : 'rgba(255, 255, 255, 0.03)',
                        borderRadius: 8,
                        border: `1px solid ${selectedFailure?.id === failure.id
                          ? 'rgba(239, 68, 68, 0.4)'
                          : 'rgba(255, 255, 255, 0.06)'}`,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        animationDelay: `${i * 0.05}s`,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>
                          #{failureHistory.length - i} {failure.level?.name || '训练'}
                        </div>
                        <span className="tag tag-danger">{failure.mistakes.length}次失误</span>
                      </div>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: 12,
                        color: '#64748b',
                        marginBottom: 8,
                      }}>
                        <span>得分: <span style={{ color: '#fbbf24', fontWeight: 600 }}>{failure.score}</span></span>
                        <span>{formatDate(failure.timestamp)}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {Array.from(new Set(failure.failureReasons?.map(r => r.type) || [])).map(type => (
                          <span key={type} className="tag tag-warning" style={{ fontSize: 10, padding: '2px 6px' }}>
                            {TASK_TYPE_ICONS[type]} {TASK_TYPE_LABELS[type]}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            {isReplaying && currentStep ? (
              <div className="card fade-in" style={{ padding: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <div>
                    <h3 style={{ fontSize: 18, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span className="tag tag-danger" style={{ animation: 'pulse-warning 1s infinite' }}>
                        ▶ 回放中
                      </span>
                      步骤 {replayIndex + 1} / {replayData.length}
                    </h3>
                    <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>
                      {selectedFailure?.level?.name} · 剩余时间 {formatTime(currentStep.timeRemaining)}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      className="btn-secondary"
                      onClick={prevReplayStep}
                      disabled={replayIndex === 0}
                    >
                      ◀ 上一步
                    </button>
                    <button
                      className="btn-secondary"
                      onClick={nextReplayStep}
                      disabled={replayIndex >= replayData.length - 1}
                    >
                      下一步 ▶
                    </button>
                    <button
                      className="btn-danger"
                      onClick={() => {
                        stopReplay()
                      }}
                    >
                      ✕ 停止回放
                    </button>
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  gap: 12,
                  marginBottom: 16,
                  overflow: 'auto',
                  paddingBottom: 8,
                }}>
                  {replayData.map((step, i) => (
                    <div
                      key={i}
                      onClick={() => {
                        while (replayIndex < i) nextReplayStep()
                        while (replayIndex > i) prevReplayStep()
                      }}
                      style={{
                        minWidth: 80,
                        padding: 10,
                        background: i === replayIndex
                          ? step.isCorrect
                            ? 'rgba(16, 185, 129, 0.2)'
                            : 'rgba(239, 68, 68, 0.2)'
                          : 'rgba(255,255,255,0.04)',
                        borderRadius: 8,
                        border: `1px solid ${i === replayIndex
                          ? step.isCorrect ? 'rgba(16, 185, 129, 0.5)' : 'rgba(239, 68, 68, 0.5)'
                          : 'rgba(255,255,255,0.08)'}`,
                        textAlign: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                    >
                      <div style={{ fontSize: 18 }}>{TASK_TYPE_ICONS[step.task.type]}</div>
                      <div style={{
                        fontSize: 10,
                        marginTop: 2,
                        color: i < replayIndex
                          ? (step.isCorrect ? '#34d399' : '#f87171')
                          : '#64748b',
                        fontWeight: 600,
                      }}>
                        #{i + 1}
                      </div>
                      {i < replayIndex && (
                        <div style={{ fontSize: 10, marginTop: 2 }}>
                          {step.isCorrect ? '✓' : '✗'}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="progress-bar" style={{ marginBottom: 20 }}>
                  <div
                    className="progress-fill"
                    style={{
                      width: `${((replayIndex + 1) / replayData.length) * 100}%`,
                      background: 'linear-gradient(90deg, #8b5cf6, #ec4899)',
                    }}
                  />
                </div>

                <div style={{
                  background: currentStep.isCorrect
                    ? 'rgba(16, 185, 129, 0.06)'
                    : 'rgba(239, 68, 68, 0.06)',
                  borderRadius: 12,
                  padding: 20,
                  border: `1px solid ${currentStep.isCorrect
                    ? 'rgba(16, 185, 129, 0.2)'
                    : 'rgba(239, 68, 68, 0.3)'}`,
                  marginBottom: 16,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                    <div style={{
                      width: 52,
                      height: 52,
                      borderRadius: 12,
                      background: currentStep.isCorrect
                        ? 'linear-gradient(135deg, #10b981, #059669)'
                        : 'linear-gradient(135deg, #ef4444, #dc2626)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 26,
                    }}>
                      {TASK_TYPE_ICONS[currentStep.task.type]}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        marginBottom: 4,
                      }}>
                        <span style={{ fontWeight: 700, fontSize: 16 }}>
                          {TASK_TYPE_LABELS[currentStep.task.type]}
                        </span>
                        <span className={`tag ${currentStep.isCorrect ? 'tag-success' : 'tag-danger'}`}>
                          {currentStep.isCorrect ? '✓ 处理正确' : '✗ 处理失误'}
                        </span>
                      </div>
                      <div style={{ fontSize: 14, color: '#94a3b8' }}>
                        会员: <strong style={{ color: '#e0e6ed' }}>{currentStep.task.member}</strong>
                        ({currentStep.task.age}岁) · {currentStep.task.disease} ·
                        药品: <strong style={{ color: '#e0e6ed' }}>{currentStep.task.medicine}</strong>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 11, color: '#64748b' }}>当前积分</div>
                      <div style={{ fontSize: 24, fontWeight: 800, color: '#fbbf24' }}>
                        {currentStep.score}
                      </div>
                    </div>
                  </div>

                  {currentStep.task.type === 'prescription' && (
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: 8,
                      marginBottom: 12,
                    }}>
                      <div style={{
                        padding: 10,
                        background: 'rgba(0,0,0,0.2)',
                        borderRadius: 6,
                        fontSize: 12,
                      }}>
                        <div style={{ color: '#64748b', marginBottom: 2 }}>清晰度</div>
                        <div style={{
                          color: currentStep.task.isBlurry ? '#f87171' : '#34d399',
                          fontWeight: 600,
                        }}>
                          {currentStep.task.isBlurry ? '⚠️ 模糊' : '✓ 清晰'}
                        </div>
                      </div>
                      <div style={{
                        padding: 10,
                        background: 'rgba(0,0,0,0.2)',
                        borderRadius: 6,
                        fontSize: 12,
                      }}>
                        <div style={{ color: '#64748b', marginBottom: 2 }}>处方剂量</div>
                        <div style={{
                          color: currentStep.task.prescriptionDose !== currentStep.task.correctDose
                            ? '#f87171' : '#34d399',
                          fontWeight: 600,
                        }}>
                          {currentStep.task.prescriptionDose}
                        </div>
                      </div>
                      <div style={{
                        padding: 10,
                        background: 'rgba(0,0,0,0.2)',
                        borderRadius: 6,
                        fontSize: 12,
                      }}>
                        <div style={{ color: '#64748b', marginBottom: 2 }}>会员档案</div>
                        <div style={{
                          color: currentStep.task.memberInfoMismatch ? '#f87171' : '#34d399',
                          fontWeight: 600,
                        }}>
                          {currentStep.task.memberInfoMismatch ? '⚠️ 不匹配' : '✓ 正常'}
                        </div>
                      </div>
                    </div>
                  )}

                  {currentStep.task.type === 'batch' && (
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: 8,
                      marginBottom: 12,
                    }}>
                      <div style={{
                        padding: 10,
                        background: 'rgba(0,0,0,0.2)',
                        borderRadius: 6,
                        fontSize: 12,
                      }}>
                        <div style={{ color: '#64748b', marginBottom: 2 }}>批号</div>
                        <div style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                          {currentStep.task.batchNumber}
                        </div>
                      </div>
                      <div style={{
                        padding: 10,
                        background: 'rgba(0,0,0,0.2)',
                        borderRadius: 6,
                        fontSize: 12,
                      }}>
                        <div style={{ color: '#64748b', marginBottom: 2 }}>有效期</div>
                        <div style={{
                          color: currentStep.task.isExpired ? '#f87171' : '#34d399',
                          fontWeight: 600,
                        }}>
                          {currentStep.task.expiryDate}
                          {currentStep.task.isExpired ? ' ❌' : ''}
                        </div>
                      </div>
                      <div style={{
                        padding: 10,
                        background: 'rgba(0,0,0,0.2)',
                        borderRadius: 6,
                        fontSize: 12,
                      }}>
                        <div style={{ color: '#64748b', marginBottom: 2 }}>档案匹配</div>
                        <div style={{
                          color: currentStep.task.memberInfoMismatch ? '#f87171' : '#34d399',
                          fontWeight: 600,
                        }}>
                          {currentStep.task.memberInfoMismatch ? '⚠️ 不匹配' : '✓ 正常'}
                        </div>
                      </div>
                    </div>
                  )}

                  <div style={{
                    display: 'flex',
                    gap: 16,
                    padding: 12,
                    background: 'rgba(0,0,0,0.25)',
                    borderRadius: 8,
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>学员操作</div>
                      <div style={{
                        padding: '8px 14px',
                        background: `${DECISION_COLORS[currentStep.decision]}20`,
                        border: `1px solid ${DECISION_COLORS[currentStep.decision]}50`,
                        borderRadius: 6,
                        display: 'inline-block',
                        color: DECISION_COLORS[currentStep.decision],
                        fontWeight: 700,
                      }}>
                        {DECISION_LABELS[currentStep.decision]}
                      </div>
                    </div>
                    {!currentStep.isCorrect && (
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>正确操作</div>
                        <div style={{
                          padding: '8px 14px',
                          background: `${DECISION_COLORS[Object.keys(DECISION_LABELS).find(k => DECISION_LABELS[k] === (currentStep.task.type === 'pharmacist' && currentStep.task.hasConflict ? '升级' : currentStep.task.isBlurry ? '升级' : (currentStep.task.prescriptionDose !== currentStep.task.correctDose || currentStep.task.isExpired || currentStep.task.memberInfoMismatch ? '拒绝' : '通过')))] || 'approve'}30`,
                          border: `1px solid ${DECISION_COLORS['approve']}50`,
                          borderRadius: 6,
                          display: 'inline-block',
                          color: '#34d399',
                          fontWeight: 700,
                        }}>
                          {(() => {
                            const t = currentStep.task
                            if (t.type === 'pharmacist') return t.hasConflict ? '升级' : '通过'
                            if (t.isBlurry) return '升级'
                            if (t.prescriptionDose !== t.correctDose || t.isExpired || t.memberInfoMismatch) return '拒绝'
                            return '通过'
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {!currentStep.isCorrect && (
                  <div style={{
                    padding: 14,
                    background: 'rgba(251, 191, 36, 0.08)',
                    border: '1px solid rgba(251, 191, 36, 0.3)',
                    borderRadius: 8,
                  }}>
                    <div style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: '#fbbf24',
                      marginBottom: 4,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}>
                      💡 学习要点
                    </div>
                    <div style={{ fontSize: 13, color: '#fde68a', lineHeight: 1.6 }}>
                      {currentStep.task.type === 'prescription' && currentStep.task.isBlurry
                        ? '处方照片不清晰时，不要直接判断通过或拒绝，应升级给上级处理，避免误判。'
                        : currentStep.task.type === 'prescription' && currentStep.task.memberInfoMismatch
                        ? '会员档案信息不一致时，需要核对会员慢病记录后再处理，避免给药错误。'
                        : currentStep.task.type === 'pharmacist' && currentStep.task.hasConflict
                        ? '药师指出存在药物相互作用或剂量调整建议时，必须升级处理，确保用药安全。'
                        : currentStep.task.type === 'batch' && currentStep.task.isExpired
                        ? '过期药品绝对不能发放给会员，必须立即拒绝并更换合格药品。'
                        : currentStep.task.type === 'batch' && currentStep.task.memberInfoMismatch
                        ? '批号与会员档案记录不符时应拒绝，确保会员拿到对应病情的正确药品批次。'
                        : '请仔细核对各项信息后再做决策。'}
                    </div>
                  </div>
                )}
              </div>
            ) : selectedFailure ? (
              <div className="card fade-in" style={{ padding: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <div>
                    <h3 style={{ fontSize: 20, fontWeight: 700 }}>
                      {selectedFailure.level?.name} - 失败详情
                    </h3>
                    <div style={{ color: '#94a3b8', fontSize: 13, marginTop: 4 }}>
                      {formatDate(selectedFailure.timestamp)} · 得分 {selectedFailure.score} · {selectedFailure.mistakes.length} 次失误
                    </div>
                  </div>
                  <button className="btn-primary" onClick={() => handleStartReplay(selectedFailure)}>
                    ▶ 开始回放
                  </button>
                </div>

                <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>失败原因时间线</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {selectedFailure.failureReasons?.map((reason, i) => (
                    <div key={i} className="fade-in" style={{
                      padding: 14,
                      background: 'rgba(239, 68, 68, 0.06)',
                      borderRadius: 8,
                      borderLeft: '4px solid #ef4444',
                      animationDelay: `${i * 0.1}s`,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <span>{TASK_TYPE_ICONS[reason.type]}</span>
                        <span style={{ fontWeight: 600 }}>
                          {TASK_TYPE_LABELS[reason.type]} - {reason.task?.medicine}
                        </span>
                        <span className="tag tag-danger" style={{ marginLeft: 'auto' }}>
                          #{i + 1}
                        </span>
                      </div>
                      <div style={{ fontSize: 13, color: '#fecaca' }}>
                        会员 {reason.task?.member}: {reason.message}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="card" style={{ padding: 48, textAlign: 'center' }}>
                <div style={{ fontSize: 64, marginBottom: 16 }}>🎬</div>
                <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>选择一条失败记录开始复盘</h3>
                <p style={{ color: '#94a3b8', fontSize: 14 }}>
                  左侧列表展示最近 {failureHistory.length} 次训练失败过程
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
