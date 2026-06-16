import { useState, useEffect } from 'react'
import useGameStore from '../store/gameStore.js'
import { TASK_TYPE_LABELS, TASK_TYPE_ICONS, DECISION_LABELS, DECISION_COLORS, formatTime } from '../data/gameConfig.js'

export default function TaskPanel() {
  const {
    tasks,
    currentTaskIndex,
    processTask,
    timeRemaining,
    score,
    currentLevel,
    mistakes,
  } = useGameStore()

  const [showWarning, setShowWarning] = useState(false)
  const [decisionDetails, setDecisionDetails] = useState({})

  const task = tasks[currentTaskIndex]

  useEffect(() => {
    if (task && task.warningBeforeAppear) {
      setShowWarning(true)
      const timer = setTimeout(() => setShowWarning(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [currentTaskIndex, task])

  if (!task) return null

  const handleDecision = (decision) => {
    processTask(task.id, decision, decisionDetails)
    setDecisionDetails({})
  }

  const getTaskBorderColor = () => {
    if (task.isBlurry || task.hasConflict || task.isExpired) return '#ef4444'
    if (task.warningBeforeAppear || timeRemaining < 30) return '#fbbf24'
    return '#3b82f6'
  }

  const renderPrescriptionView = () => (
    <div>
      <div style={{
        position: 'relative',
        background: '#fefce8',
        borderRadius: 8,
        padding: 20,
        marginBottom: 16,
        filter: task.isBlurry ? `blur(${(1 - task.imageClarity) * 6}px)` : 'none',
        transition: 'filter 0.3s',
        minHeight: 180,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 11, color: '#854d0e' }}>处方编号</div>
            <div style={{ fontWeight: 700, color: '#713f12' }}>RX-{task.id.toString().padStart(6, '0')}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#854d0e' }}>开具日期</div>
            <div style={{ fontWeight: 700, color: '#713f12' }}>{new Date().toLocaleDateString()}</div>
          </div>
        </div>
        <div style={{ borderTop: '1px dashed #d97706', borderBottom: '1px dashed #d97706', padding: '12px 0', marginBottom: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <span style={{ fontSize: 11, color: '#854d0e' }}>姓名: </span>
              <span style={{ fontWeight: 600, color: '#713f12' }}>{task.member}</span>
            </div>
            <div>
              <span style={{ fontSize: 11, color: '#854d0e' }}>年龄: </span>
              <span style={{ fontWeight: 600, color: '#713f12' }}>{task.age}岁</span>
            </div>
            <div>
              <span style={{ fontSize: 11, color: '#854d0e' }}>会员ID: </span>
              <span style={{ fontWeight: 600, color: '#713f12' }}>{task.memberId}</span>
            </div>
            <div>
              <span style={{ fontSize: 11, color: '#854d0e' }}>诊断: </span>
              <span style={{ fontWeight: 600, color: '#713f12' }}>{task.disease}</span>
            </div>
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: '#854d0e', marginBottom: 4 }}>处方内容</div>
          <div style={{
            fontSize: 18,
            fontWeight: 700,
            color: '#713f12',
            padding: 12,
            background: 'rgba(217, 119, 6, 0.1)',
            borderRadius: 6,
          }}>
            {task.medicine} {task.prescriptionDose}
          </div>
        </div>
        {task.isBlurry && (
          <div style={{
            position: 'absolute',
            top: 8,
            right: 8,
            padding: '4px 10px',
            background: '#fbbf24',
            color: '#78350f',
            borderRadius: 20,
            fontSize: 11,
            fontWeight: 700,
          }}>
            ⚠️ 图像模糊
          </div>
        )}
      </div>
      <div style={{
        padding: 12,
        background: 'rgba(59, 130, 246, 0.08)',
        borderRadius: 6,
        marginBottom: 12,
        border: '1px solid rgba(59, 130, 246, 0.2)',
      }}>
        <div style={{ fontSize: 12, color: '#60a5fa', marginBottom: 4 }}>💡 会员档案参考</div>
        <div style={{ fontSize: 13, color: '#e0e6ed' }}>
          标准剂量: <strong>{task.correctDose}</strong> | 慢病: {task.disease}
        </div>
        {task.memberInfoMismatch && (
          <div style={{ fontSize: 12, color: '#f87171', marginTop: 4 }}>
            ⚠️ 注意：会员档案信息存在不一致
          </div>
        )}
      </div>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#94a3b8', marginBottom: 12 }}>
        <input
          type="checkbox"
          checked={decisionDetails.memberInfoMismatch || false}
          onChange={(e) => setDecisionDetails({ ...decisionDetails, memberInfoMismatch: e.target.checked })}
          style={{ width: 16, height: 16 }}
        />
        标记为会员档案信息不一致
      </label>
    </div>
  )

  const renderPharmacistView = () => (
    <div>
      <div style={{
        background: task.hasConflict ? 'rgba(239, 68, 68, 0.08)' : 'rgba(16, 185, 129, 0.08)',
        border: `1px solid ${task.hasConflict ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
        borderRadius: 8,
        padding: 20,
        marginBottom: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: task.hasConflict ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'linear-gradient(135deg, #10b981, #059669)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 24,
          }}>
            👨‍⚕️
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>王药师 专业意见</div>
            <div style={{ fontSize: 12, color: '#94a3b8' }}>高级临床药师 · 从业15年</div>
          </div>
          {task.hasConflict && (
            <span className="tag tag-danger" style={{ marginLeft: 'auto' }}>⚠️ 需关注</span>
          )}
        </div>
        <div style={{
          padding: 16,
          background: 'rgba(0,0,0,0.2)',
          borderRadius: 8,
          borderLeft: `4px solid ${task.hasConflict ? '#ef4444' : '#10b981'}`,
        }}>
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>审核内容</div>
          <div style={{ fontSize: 15, lineHeight: 1.6, color: task.hasConflict ? '#fecaca' : '#d1fae5' }}>
            {task.medicine} - {task.disease}患者
          </div>
          <div style={{
            marginTop: 12,
            padding: 12,
            background: 'rgba(255,255,255,0.05)',
            borderRadius: 6,
            fontSize: 14,
            color: '#e0e6ed',
          }}>
            <strong>意见：</strong>{task.pharmacistOpinion}
          </div>
        </div>
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 12,
        marginBottom: 12,
      }}>
        <div style={{
          padding: 12,
          background: 'rgba(255,255,255,0.03)',
          borderRadius: 6,
          border: '1px solid rgba(255,255,255,0.06)',
        }}>
          <div style={{ fontSize: 11, color: '#64748b' }}>会员</div>
          <div style={{ fontWeight: 600 }}>{task.member} ({task.age}岁)</div>
        </div>
        <div style={{
          padding: 12,
          background: 'rgba(255,255,255,0.03)',
          borderRadius: 6,
          border: '1px solid rgba(255,255,255,0.06)',
        }}>
          <div style={{ fontSize: 11, color: '#64748b' }}>分值</div>
          <div style={{ fontWeight: 600, color: '#fbbf24' }}>+{task.points}</div>
        </div>
      </div>
    </div>
  )

  const renderBatchView = () => (
    <div>
      <div style={{
        background: 'linear-gradient(135deg, #1e293b, #334155)',
        borderRadius: 8,
        padding: 20,
        marginBottom: 16,
        border: task.isExpired ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(255,255,255,0.08)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
          <div style={{
            width: 60,
            height: 80,
            background: `linear-gradient(135deg, ${['#3b82f6', '#ef4444', '#10b981', '#f59e0b'][task.id % 4]}, ${['#2563eb', '#dc2626', '#059669', '#d97706'][task.id % 4]})`,
            borderRadius: 6,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 10,
            fontWeight: 700,
            color: 'white',
            textAlign: 'center',
            padding: 4,
          }}>
            <div style={{ fontSize: 18, marginBottom: 2 }}>💊</div>
            {task.medicine.slice(0, 4)}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 4 }}>{task.medicine}</div>
            <div style={{ fontSize: 13, color: '#94a3b8' }}>{task.disease}治疗药物</div>
          </div>
          {task.isExpired && (
            <span className="tag tag-danger">❌ 已过期</span>
          )}
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 12,
        }}>
          <div style={{
            padding: 12,
            background: 'rgba(0,0,0,0.2)',
            borderRadius: 6,
          }}>
            <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>生产批号</div>
            <div style={{
              fontFamily: 'monospace',
              fontSize: 16,
              fontWeight: 700,
              color: '#60a5fa',
            }}>
              {task.batchNumber}
            </div>
          </div>
          <div style={{
            padding: 12,
            background: task.isExpired ? 'rgba(239, 68, 68, 0.15)' : 'rgba(0,0,0,0.2)',
            borderRadius: 6,
          }}>
            <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>有效期至</div>
            <div style={{
              fontFamily: 'monospace',
              fontSize: 16,
              fontWeight: 700,
              color: task.isExpired ? '#f87171' : '#34d399',
            }}>
              {task.expiryDate}
            </div>
          </div>
        </div>
      </div>
      <div style={{
        padding: 12,
        background: 'rgba(59, 130, 246, 0.08)',
        borderRadius: 6,
        marginBottom: 12,
        border: '1px solid rgba(59, 130, 246, 0.2)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 11, color: '#60a5fa', marginBottom: 2 }}>会员 {task.member} 档案记录</div>
            <div style={{ fontSize: 13, color: '#e0e6ed' }}>推荐批号: <code style={{ color: '#60a5fa' }}>{task.correctBatch}</code></div>
          </div>
          {task.memberInfoMismatch && (
            <span className="tag tag-danger">档案不匹配</span>
          )}
        </div>
      </div>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#94a3b8', marginBottom: 12 }}>
        <input
          type="checkbox"
          checked={decisionDetails.memberInfoMismatch || false}
          onChange={(e) => setDecisionDetails({ ...decisionDetails, memberInfoMismatch: e.target.checked })}
          style={{ width: 16, height: 16 }}
        />
        批号与会员档案记录不匹配
      </label>
    </div>
  )

  const renderTaskContent = () => {
    switch (task.type) {
      case 'prescription': return renderPrescriptionView()
      case 'pharmacist': return renderPharmacistView()
      case 'batch': return renderBatchView()
      default: return null
    }
  }

  const getUrgencyClass = () => {
    if (timeRemaining < 15) return 'danger-pulse'
    if (timeRemaining < 30 || (task && (task.isBlurry || task.hasConflict || task.isExpired))) return 'warning-pulse'
    return ''
  }

  return (
    <div style={{
      position: 'absolute',
      top: 20,
      left: 20,
      width: 420,
      maxHeight: 'calc(100vh - 40px)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 50,
    }}>
      <div className="card" style={{
        padding: 20,
        marginBottom: 12,
        border: `2px solid ${getTaskBorderColor()}`,
        borderTop: `4px solid ${getTaskBorderColor()}`,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <span style={{ fontSize: 24 }}>{TASK_TYPE_ICONS[task.type]}</span>
              <span className={`tag tag-info ${getUrgencyClass()}`} style={{ padding: '6px 14px', fontSize: 13 }}>
                {TASK_TYPE_LABELS[task.type]}
              </span>
            </div>
            <div style={{ fontSize: 12, color: '#64748b' }}>
              任务 {currentTaskIndex + 1} / {tasks.length}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{
              fontSize: 12,
              color: timeRemaining < 30 ? '#fbbf24' : timeRemaining < 15 ? '#f87171' : '#64748b',
              marginBottom: 2,
            }}>
              剩余时间
            </div>
            <div style={{
              fontSize: 28,
              fontWeight: 800,
              fontFamily: 'monospace',
              color: timeRemaining < 30 ? '#fbbf24' : timeRemaining < 15 ? '#f87171' : '#e0e6ed',
            }}>
              {formatTime(timeRemaining)}
            </div>
          </div>
        </div>

        <div className="progress-bar" style={{ marginBottom: 16 }}>
          <div
            className="progress-fill"
            style={{
              width: `${((currentTaskIndex) / tasks.length) * 100}%`,
              background: timeRemaining < 30
                ? 'linear-gradient(90deg, #f59e0b, #ef4444)'
                : 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
            }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <span style={{ fontSize: 12, color: '#64748b' }}>分数: </span>
            <span style={{ fontSize: 18, fontWeight: 700, color: '#fbbf24' }}>{score}</span>
          </div>
          <div>
            <span style={{ fontSize: 12, color: '#64748b' }}>失误: </span>
            <span style={{
              fontSize: 18,
              fontWeight: 700,
              color: mistakes.length >= 2 ? '#f87171' : mistakes.length >= 1 ? '#fbbf24' : '#34d399',
            }}>
              {mistakes.length}/3
            </span>
          </div>
          {task.requiresFollowUp && (
            <span className="tag tag-warning">📞 需回访</span>
          )}
        </div>
      </div>

      {showWarning && (
        <div className="card warning-pulse fade-in" style={{
          padding: 16,
          marginBottom: 12,
          background: 'rgba(251, 191, 36, 0.1)',
          border: '2px solid #fbbf24',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 14, color: '#fbbf24', fontWeight: 700 }}>
            ⚠️ 注意：下一任务可能存在异常，请仔细核对！
          </div>
        </div>
      )}

      <div className="card fade-in" style={{
        padding: 20,
        flex: 1,
        overflow: 'auto',
        marginBottom: 12,
      }}>
        {renderTaskContent()}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {Object.entries(DECISION_LABELS).map(([key, label]) => (
          <button
            key={key}
            onClick={() => handleDecision(key)}
            style={{
              padding: '14px 8px',
              background: DECISION_COLORS[key] + '20',
              border: `2px solid ${DECISION_COLORS[key]}`,
              borderRadius: 10,
              color: DECISION_COLORS[key],
              fontSize: 15,
              fontWeight: 700,
              transition: 'all 0.2s',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = DECISION_COLORS[key]
              e.currentTarget.style.color = 'white'
              e.currentTarget.style.transform = 'translateY(-2px)'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = DECISION_COLORS[key] + '20'
              e.currentTarget.style.color = DECISION_COLORS[key]
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            {key === 'approve' ? '✅ ' : key === 'reject' ? '❌ ' : '⬆️ '}
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}
