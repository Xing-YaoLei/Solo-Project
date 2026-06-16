import { useNavigate } from 'react-router-dom'
import useGameStore from '../store/gameStore.js'

export default function Statistics() {
  const navigate = useNavigate()
  const { statistics, levels } = useGameStore()

  const {
    totalGames,
    totalSuccess,
    totalFailures,
    totalFollowUps,
    completedFollowUps,
    memberProfileErrors,
    prescriptionErrors,
    pharmacistErrors,
    batchExpiryErrors,
    levelStats,
  } = statistics

  const winRate = totalGames > 0 ? Math.round((totalSuccess / totalGames) * 100) : 0
  const followUpRate = totalFollowUps > 0 ? Math.round((completedFollowUps / totalFollowUps) * 100) : 0
  const totalErrors = memberProfileErrors + prescriptionErrors + pharmacistErrors + batchExpiryErrors

  const errorData = [
    { label: '会员档案错误', value: memberProfileErrors, color: '#f43f5e', icon: '👤' },
    { label: '处方审核错误', value: prescriptionErrors, color: '#ef4444', icon: '📋' },
    { label: '药师意见误判', value: pharmacistErrors, color: '#f59e0b', icon: '👨‍⚕️' },
    { label: '批号效期错误', value: batchExpiryErrors, color: '#8b5cf6', icon: '📦' },
  ]

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
                📊 训练统计中心
              </h1>
            </div>
            <p style={{ color: '#94a3b8', marginLeft: 70 }}>
              全方位分析训练表现，重点关注回访完成率与各关卡差异
            </p>
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
          marginBottom: 28,
        }}>
          {[
            { label: '总训练场次', value: totalGames, sub: '累计训练', color: '#60a5fa', icon: '🎯' },
            { label: '通关次数', value: totalSuccess, sub: `胜率 ${winRate}%`, color: '#10b981', icon: '🏆' },
            { label: '失败次数', value: totalFailures, sub: `${totalFailures} 场失利`, color: '#f87171', icon: '❌' },
            {
              label: '回访完成',
              value: `${completedFollowUps}/${totalFollowUps}`,
              sub: `完成率 ${followUpRate}%`,
              color: '#fbbf24',
              icon: '📞',
              highlight: true,
            },
            { label: '累计错误', value: totalErrors, sub: '历史错误总数', color: '#a78bfa', icon: '⚠️' },
          ].map((stat, i) => (
            <div
              key={i}
              className="card fade-in"
              style={{
                padding: 20,
                borderLeft: `4px solid ${stat.color}`,
                animationDelay: `${i * 0.08}s`,
                position: 'relative',
                overflow: 'hidden',
                background: stat.highlight
                  ? 'linear-gradient(135deg, rgba(251, 191, 36, 0.1) 0%, rgba(255, 255, 255, 0.04) 100%)'
                  : undefined,
              }}
            >
              {stat.highlight && (
                <div style={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  fontSize: 10,
                  padding: '2px 8px',
                  background: 'rgba(251, 191, 36, 0.2)',
                  color: '#fbbf24',
                  borderRadius: 10,
                  fontWeight: 600,
                }}>
                  重点关注
                </div>
              )}
              <div style={{ fontSize: 24, marginBottom: 8 }}>{stat.icon}</div>
              <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 4 }}>{stat.label}</div>
              <div style={{
                fontSize: stat.value.toString().length > 6 ? 26 : 32,
                fontWeight: 800,
                color: stat.color,
                marginBottom: 4,
              }}>
                {stat.value}
              </div>
              <div style={{ fontSize: 11, color: '#64748b' }}>{stat.sub}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28 }}>
          <div className="card fade-in" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>📈</span> 回访完成情况（重点指标）
            </h3>

            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 14, color: '#e0e6ed' }}>总体回访完成率</span>
                <span style={{ fontSize: 18, fontWeight: 800, color: '#fbbf24' }}>{followUpRate}%</span>
              </div>
              <div style={{ height: 20, background: 'rgba(255,255,255,0.06)', borderRadius: 10, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${followUpRate}%`,
                  background: followUpRate >= 80
                    ? 'linear-gradient(90deg, #10b981, #059669)'
                    : followUpRate >= 50
                    ? 'linear-gradient(90deg, #fbbf24, #d97706)'
                    : 'linear-gradient(90deg, #ef4444, #dc2626)',
                  borderRadius: 10,
                  transition: 'width 0.5s ease',
                }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 11, color: '#64748b' }}>
                <span>目标: 80%</span>
                <span>{completedFollowUps} 次完成 / {totalFollowUps} 次需回访</span>
              </div>
            </div>

            <div style={{
              padding: 16,
              background: followUpRate >= 80
                ? 'rgba(16, 185, 129, 0.08)'
                : followUpRate >= 50
                ? 'rgba(251, 191, 36, 0.08)'
                : 'rgba(239, 68, 68, 0.08)',
              borderRadius: 8,
              border: `1px solid ${followUpRate >= 80
                ? 'rgba(16, 185, 129, 0.3)'
                : followUpRate >= 50
                ? 'rgba(251, 191, 36, 0.3)'
                : 'rgba(239, 68, 68, 0.3)'}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span>{followUpRate >= 80 ? '✅' : followUpRate >= 50 ? '⚠️' : '❌'}</span>
                <span style={{ fontWeight: 600, fontSize: 14 }}>
                  {followUpRate >= 80
                    ? '回访工作表现优秀'
                    : followUpRate >= 50
                    ? '回访工作需要加强'
                    : '回访工作亟待提升'}
                </span>
              </div>
              <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.6 }}>
                {followUpRate >= 80
                  ? `已完成 ${completedFollowUps} 次会员回访，慢病管理工作到位。继续保持高标准服务。`
                  : followUpRate >= 50
                  ? `距离目标80%还差 ${Math.ceil(totalFollowUps * 0.8) - completedFollowUps} 次完成量。建议在训练中优先处理需回访任务。`
                  : `还差 ${Math.ceil(totalFollowUps * 0.8) - completedFollowUps} 次达标。会员回访是慢病管理的核心，请务必重视每一次回访机会！`}
              </div>
            </div>
          </div>

          <div className="card fade-in" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>🧩</span> 错误类型分布（含会员档案拆分）
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
              {errorData.map((item, i) => {
                const percentage = totalErrors > 0 ? Math.round((item.value / totalErrors) * 100) : 0
                return (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>{item.icon}</span>
                        <span style={{ fontSize: 13, fontWeight: 500 }}>{item.label}</span>
                        {item.label.includes('会员档案') && (
                          <span className="tag tag-danger" style={{ fontSize: 10, padding: '1px 6px' }}>
                            重点
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span style={{ fontSize: 16, fontWeight: 700, color: item.color }}>{item.value}</span>
                        <span style={{ fontSize: 12, color: '#64748b', width: 40, textAlign: 'right' }}>{percentage}%</span>
                      </div>
                    </div>
                    <div style={{ height: 10, background: 'rgba(255,255,255,0.06)', borderRadius: 5, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${percentage}%`,
                        background: `linear-gradient(90deg, ${item.color}90, ${item.color})`,
                        borderRadius: 5,
                        transition: 'width 0.5s ease',
                      }} />
                    </div>
                  </div>
                )
              })}
            </div>

            <div style={{
              padding: 12,
              background: memberProfileErrors > 0
                ? 'rgba(244, 63, 94, 0.08)'
                : 'rgba(16, 185, 129, 0.06)',
              borderRadius: 8,
              border: `1px solid ${memberProfileErrors > 0
                ? 'rgba(244, 63, 94, 0.3)'
                : 'rgba(16, 185, 129, 0.2)'}`,
            }}>
              <div style={{ fontSize: 12, lineHeight: 1.6, color: memberProfileErrors > 0 ? '#fda4af' : '#86efac' }}>
                {memberProfileErrors > 0
                  ? `⚠️ 会员档案类错误共 ${memberProfileErrors} 次，建议加强核对会员慢病记录，确保每次处理前确认会员信息一致性。`
                  : '✅ 暂无会员档案类错误，档案核对工作到位。'}
              </div>
            </div>
          </div>
        </div>

        <div className="card fade-in" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>🎮</span> 各关卡训练对比
            <span style={{
              fontSize: 12,
              fontWeight: 400,
              color: '#94a3b8',
              marginLeft: 'auto',
            }}>
              对比关卡间训练差异，找出薄弱环节
            </span>
          </h3>

          {totalGames === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🚀</div>
              <div style={{ fontSize: 16, marginBottom: 4 }}>暂无训练数据</div>
              <div style={{ fontSize: 13 }}>完成几局训练后再来查看详细对比</div>
            </div>
          ) : (
            <div style={{ overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid rgba(255,255,255,0.1)' }}>
                    <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: 12, color: '#64748b', fontWeight: 600 }}>关卡</th>
                    <th style={{ textAlign: 'center', padding: '12px 8px', fontSize: 12, color: '#64748b', fontWeight: 600 }}>训练场次</th>
                    <th style={{ textAlign: 'center', padding: '12px 8px', fontSize: 12, color: '#64748b', fontWeight: 600 }}>通关数</th>
                    <th style={{ textAlign: 'center', padding: '12px 8px', fontSize: 12, color: '#64748b', fontWeight: 600 }}>胜率</th>
                    <th style={{ textAlign: 'center', padding: '12px 8px', fontSize: 12, color: '#64748b', fontWeight: 600 }}>最高分</th>
                    <th style={{ textAlign: 'center', padding: '12px 8px', fontSize: 12, color: '#fbbf24', fontWeight: 600 }}>🏅 平均回访</th>
                    <th style={{ textAlign: 'center', padding: '12px 8px', fontSize: 12, color: '#64748b', fontWeight: 600 }}>表现</th>
                  </tr>
                </thead>
                <tbody>
                  {levels.map((level, i) => {
                    const stats = levelStats[`level_${level.id}`] || { games: 0, wins: 0, bestScore: 0, avgFollowUps: 0 }
                    const levelWinRate = stats.games > 0 ? Math.round((stats.wins / stats.games) * 100) : 0
                    const hasData = stats.games > 0

                    return (
                      <tr
                        key={level.id}
                        style={{
                          borderBottom: '1px solid rgba(255,255,255,0.04)',
                          background: i % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent',
                        }}
                      >
                        <td style={{ padding: '14px 8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{
                              width: 36,
                              height: 36,
                              borderRadius: 8,
                              background: hasData
                                ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)'
                                : 'rgba(255,255,255,0.05)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 14,
                              fontWeight: 700,
                            }}>
                              {level.id}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: 14 }}>{level.name}</div>
                              <div style={{ fontSize: 11, color: '#64748b' }}>
                                {Math.floor(level.duration / 60)}分 · {level.taskCount}单
                              </div>
                            </div>
                            {!level.unlocked && (
                              <span className="tag tag-danger" style={{ fontSize: 10 }}>🔒</span>
                            )}
                          </div>
                        </td>
                        <td style={{ textAlign: 'center', padding: '14px 8px', fontWeight: 600 }}>
                          {hasData ? stats.games : '-'}
                        </td>
                        <td style={{ textAlign: 'center', padding: '14px 8px', fontWeight: 600, color: '#34d399' }}>
                          {hasData ? stats.wins : '-'}
                        </td>
                        <td style={{ textAlign: 'center', padding: '14px 8px' }}>
                          {hasData ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                              <div style={{
                                width: 60,
                                height: 8,
                                background: 'rgba(255,255,255,0.06)',
                                borderRadius: 4,
                                overflow: 'hidden',
                              }}>
                                <div style={{
                                  width: `${levelWinRate}%`,
                                  height: '100%',
                                  background: levelWinRate >= 70
                                    ? '#10b981'
                                    : levelWinRate >= 40
                                    ? '#f59e0b'
                                    : '#ef4444',
                                  borderRadius: 4,
                                }} />
                              </div>
                              <span style={{
                                fontSize: 13,
                                fontWeight: 700,
                                color: levelWinRate >= 70 ? '#34d399' : levelWinRate >= 40 ? '#fbbf24' : '#f87171',
                              }}>
                                {levelWinRate}%
                              </span>
                            </div>
                          ) : '-'}
                        </td>
                        <td style={{ textAlign: 'center', padding: '14px 8px', fontWeight: 700, color: '#fbbf24' }}>
                          {hasData ? stats.bestScore : '-'}
                        </td>
                        <td style={{ textAlign: 'center', padding: '14px 8px' }}>
                          {hasData ? (
                            <span style={{
                              display: 'inline-block',
                              padding: '4px 12px',
                              background: stats.avgFollowUps >= 3
                                ? 'rgba(251, 191, 36, 0.15)'
                                : 'rgba(255,255,255,0.05)',
                              borderRadius: 12,
                              fontWeight: 700,
                              fontSize: 13,
                              color: stats.avgFollowUps >= 3 ? '#fbbf24' : '#94a3b8',
                              border: stats.avgFollowUps >= 3 ? '1px solid rgba(251, 191, 36, 0.3)' : 'none',
                            }}>
                              {stats.avgFollowUps}次
                            </span>
                          ) : '-'}
                        </td>
                        <td style={{ textAlign: 'center', padding: '14px 8px' }}>
                          {!hasData ? (
                            <span className="tag tag-info">未训练</span>
                          ) : levelWinRate >= 70 && stats.avgFollowUps >= 3 ? (
                            <span className="tag tag-success">💎 优秀</span>
                          ) : levelWinRate >= 40 ? (
                            <span className="tag tag-warning">📈 进步中</span>
                          ) : (
                            <span className="tag tag-danger">🎯 需加强</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {totalGames > 0 && (
          <div className="card fade-in" style={{ padding: 24, marginTop: 28 }}>
            <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>💡</span> 训练建议（基于数据分析）
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 12,
            }}>
              {[
                {
                  show: followUpRate < 80,
                  color: '#fbbf24',
                  icon: '📞',
                  title: '提升回访完成率',
                  desc: `当前回访率 ${followUpRate}%，距离80%目标还有差距。标记"需回访"的任务请按标准流程完成回访记录。`,
                },
                {
                  show: memberProfileErrors > 0,
                  color: '#f43f5e',
                  icon: '👤',
                  title: '加强会员档案核对',
                  desc: `累计 ${memberProfileErrors} 次会员档案类错误。处理前务必核对会员ID、慢病记录、历史用药信息。`,
                },
                {
                  show: prescriptionErrors > memberProfileErrors && prescriptionErrors > 0,
                  color: '#ef4444',
                  icon: '📋',
                  title: '优化处方审核流程',
                  desc: `处方类错误 ${prescriptionErrors} 次。模糊处方→升级，剂量异常→拒绝，养成标准化判断习惯。`,
                },
                {
                  show: pharmacistErrors > 0,
                  color: '#f59e0b',
                  icon: '👨‍⚕️',
                  title: '重视药师专业意见',
                  desc: `药师意见误判 ${pharmacistErrors} 次。凡药师标注"调整""冲突"等关键词，一律升级处理。`,
                },
                {
                  show: batchExpiryErrors > 0,
                  color: '#8b5cf6',
                  icon: '📦',
                  title: '严格效期管理',
                  desc: `批号效期错误 ${batchExpiryErrors} 次。过期药品零容忍，发放前核对批号与会员档案一致性。`,
                },
                {
                  show: totalGames < 5,
                  color: '#60a5fa',
                  icon: '🎯',
                  title: '增加训练频次',
                  desc: `仅完成 ${totalGames} 场训练，建议每日至少训练3-5局，形成肌肉记忆。`,
                },
              ].filter(item => item.show).map((item, i) => (
                <div key={i} style={{
                  padding: 16,
                  background: `${item.color}10`,
                  borderRadius: 10,
                  border: `1px solid ${item.color}30`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: 20 }}>{item.icon}</span>
                    <span style={{ fontWeight: 700, fontSize: 14, color: item.color }}>{item.title}</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#cbd5e1', lineHeight: 1.6 }}>
                    {item.desc}
                  </div>
                </div>
              ))}
              {[followUpRate < 80, memberProfileErrors > 0, prescriptionErrors > memberProfileErrors && prescriptionErrors > 0, pharmacistErrors > 0, batchExpiryErrors > 0, totalGames < 5].filter(Boolean).length === 0 && (
                <div style={{
                  padding: 16,
                  background: 'rgba(16, 185, 129, 0.1)',
                  borderRadius: 10,
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  gridColumn: '1 / -1',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 24 }}>🏆</span>
                    <span style={{ fontWeight: 700, fontSize: 16, color: '#34d399' }}>表现优秀，各项指标达标！</span>
                  </div>
                  <div style={{ fontSize: 13, color: '#86efac' }}>
                    继续保持高标准训练，挑战更高难度关卡！
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
