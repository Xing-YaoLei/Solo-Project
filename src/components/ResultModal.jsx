import { useNavigate } from 'react-router-dom'
import useGameStore from '../store/gameStore.js'
import { DECISION_LABELS, TASK_TYPE_LABELS, TASK_TYPE_ICONS, formatTime } from '../data/gameConfig.js'

export default function ResultModal() {
  const navigate = useNavigate()
  const {
    gameState,
    currentLevel,
    score,
    mistakes,
    tasks,
    failureReasons,
    resetGame,
    completedFollowUpTasks,
  } = useGameStore()

  if (gameState !== 'win' && gameState !== 'fail') return null

  const isWin = gameState === 'win'
  const followUpTasks = tasks.filter(t => t.requiresFollowUp)
  const completedFollowUps = completedFollowUpTasks.length

  const memberProfileErrors = failureReasons.filter(r =>
    r.message.includes('会员档案') || r.message.includes('不匹配')
  )
  const prescriptionErrors = failureReasons.filter(r =>
    r.type === 'prescription' && !r.message.includes('会员档案')
  )
  const pharmacistErrors = failureReasons.filter(r => r.type === 'pharmacist')
  const batchErrors = failureReasons.filter(r =>
    r.type === 'batch' && !r.message.includes('会员档案')
  )

  const errorBreakdown = [
    { label: '会员档案错误', items: memberProfileErrors, color: '#f43f5e', icon: '👤' },
    { label: '处方审核错误', items: prescriptionErrors, color: '#ef4444', icon: '📋' },
    { label: '药师意见误判', items: pharmacistErrors, color: '#f59e0b', icon: '👨‍⚕️' },
    { label: '批号效期错误', items: batchErrors, color: '#8b5cf6', icon: '📦' },
  ]

  return (
    <div className="modal-overlay fade-in" onClick={(e) => {
      if (e.target === e.currentTarget) resetGame()
    }}>
      <div className="modal-content" style={{
        maxWidth: 680,
        maxHeight: '90vh',
        overflow: 'auto',
        border: `2px solid ${isWin ? '#10b981' : '#ef4444'}`,
      }}>
        <div style={{
          textAlign: 'center',
          padding: '24px 0 32px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          marginBottom: 24,
        }}>
          <div style={{ fontSize: 64, marginBottom: 12 }}>
            {isWin ? '🎉' : '😔'}
          </div>
          <h2 style={{
            fontSize: 32,
            fontWeight: 800,
            marginBottom: 8,
            color: isWin ? '#34d399' : '#f87171',
          }}>
            {isWin ? '训练通关！' : '训练失败'}
          </h2>
          <p style={{ color: '#94a3b8' }}>
            {currentLevel?.name} - {isWin ? '继续保持，挑战更高难度！' : '分析错因，再接再厉！'}
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 12,
          marginBottom: 24,
        }}>
          {[
            { label: '最终得分', value: score, color: '#fbbf24', icon: '⭐' },
            { label: '处理任务', value: `${tasks.length - mistakes.length}/${tasks.length}`, color: '#60a5fa', icon: '📊' },
            { label: '失误次数', value: mistakes.length, color: mistakes.length >= 3 ? '#ef4444' : '#f59e0b', icon: '❌' },
            { label: '回访完成', value: `${completedFollowUps}/${followUpTasks.length}`, color: '#10b981', icon: '📞' },
          ].map((stat, i) => (
            <div key={i} style={{
              padding: 16,
              background: `${stat.color}12`,
              borderRadius: 10,
              border: `1px solid ${stat.color}30`,
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 20, marginBottom: 4 }}>{stat.icon}</div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>{stat.label}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: stat.color }}>{stat.value}</div>
            </div>
          ))}
        </div>

        <div style={{ marginBottom: 24 }}>
          <h3 style={{
            fontSize: 16,
            fontWeight: 700,
            marginBottom: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <span>📊</span> 错因分析 - 会员档案相关拆出
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 12,
          }}>
            {errorBreakdown.map((cat, i) => (
              <div key={i} style={{
                padding: 14,
                background: cat.items.length > 0 ? `${cat.color}12` : 'rgba(255,255,255,0.02)',
                borderRadius: 8,
                border: `1px solid ${cat.items.length > 0 ? cat.color + '40' : 'rgba(255,255,255,0.06)'}`,
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: cat.items.length > 0 ? 10 : 0,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>{cat.icon}</span>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{cat.label}</span>
                  </div>
                  <span className={`tag ${cat.items.length > 0 ? 'tag-danger' : 'tag-success'}`}>
                    {cat.items.length > 0 ? `${cat.items.length}项` : '正常'}
                  </span>
                </div>
                {cat.items.length > 0 && (
                  <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.7 }}>
                    {cat.items.slice(0, 2).map((err, j) => (
                      <div key={j} style={{
                        padding: '6px 8px',
                        background: 'rgba(0,0,0,0.2)',
                        borderRadius: 4,
                        marginBottom: 4,
                      }}>
                        • {err.message}
                      </div>
                    ))}
                    {cat.items.length > 2 && (
                      <div style={{ color: '#64748b', padding: '2px 8px' }}>
                        ...还有 {cat.items.length - 2} 项
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {mistakes.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <h3 style={{
              fontSize: 16,
              fontWeight: 700,
              marginBottom: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}>
              <span>📝</span> 失误详情
            </h3>
            <div style={{
              maxHeight: 180,
              overflow: 'auto',
              background: 'rgba(0,0,0,0.2)',
              borderRadius: 8,
              padding: 4,
            }}>
              {mistakes.map((mistake, i) => (
                <div key={i} style={{
                  padding: 12,
                  marginBottom: 4,
                  background: 'rgba(239, 68, 68, 0.06)',
                  borderRadius: 6,
                  borderLeft: '3px solid #ef4444',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span>{TASK_TYPE_ICONS[mistake.task.type]}</span>
                      <span style={{ fontWeight: 600 }}>
                        {TASK_TYPE_LABELS[mistake.task.type]} - {mistake.task.medicine}
                      </span>
                    </div>
                    <span style={{
                      fontSize: 11,
                      padding: '2px 8px',
                      borderRadius: 10,
                      background: 'rgba(239, 68, 68, 0.2)',
                      color: '#f87171',
                    }}>
                      会员: {mistake.task.member}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 16, fontSize: 12 }}>
                    <div>
                      <span style={{ color: '#64748b' }}>你的操作: </span>
                      <span style={{ color: '#f87171', fontWeight: 600 }}>{DECISION_LABELS[mistake.decision]}</span>
                    </div>
                    <div>
                      <span style={{ color: '#64748b' }}>正确操作: </span>
                      <span style={{ color: '#34d399', fontWeight: 600 }}>{DECISION_LABELS[mistake.expected]}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{
          display: 'flex',
          gap: 12,
          justifyContent: 'center',
          paddingTop: 16,
          borderTop: '1px solid rgba(255,255,255,0.08)',
        }}>
          <button className="btn-secondary" onClick={() => {
            resetGame()
            navigate('/statistics')
          }}>
            📊 查看统计
          </button>
          <button className="btn-secondary" onClick={() => {
            resetGame()
            navigate('/review')
          }}>
            📹 复盘回放
          </button>
          <button className="btn-secondary" onClick={() => {
            resetGame()
            navigate('/')
          }}>
            🏠 返回主页
          </button>
          <button className="btn-primary" onClick={() => {
            resetGame()
            navigate(`/game/${currentLevel?.id || 1}`)
          }}>
            🔄 再试一次
          </button>
        </div>
      </div>
    </div>
  )
}
