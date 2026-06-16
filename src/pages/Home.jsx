import { useNavigate } from 'react-router-dom'
import useGameStore from '../store/gameStore.js'

export default function Home() {
  const navigate = useNavigate()
  const { levels, statistics } = useGameStore()

  return (
    <div className="page-container" style={{
      background: 'linear-gradient(135deg, #0a0e17 0%, #1a2332 50%, #0f172a 100%)',
      padding: 40,
      overflow: 'auto',
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h1 style={{
            fontSize: 48,
            fontWeight: 800,
            background: 'linear-gradient(135deg, #60a5fa, #a78bfa, #34d399)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: 16,
          }}>
            药店连锁会员慢病调度
          </h1>
          <p style={{ fontSize: 18, color: '#94a3b8', maxWidth: 600, margin: '0 auto' }}>
            限时处理处方照片、药师意见和批号效期，提升慢病管理专业技能
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 20,
          marginBottom: 48,
        }}>
          {[
            { label: '训练场次', value: statistics.totalGames, color: '#60a5fa' },
            { label: '通关次数', value: statistics.totalSuccess, color: '#34d399' },
            { label: '回访完成', value: statistics.completedFollowUps, color: '#fbbf24' },
            { label: '会员档案错误', value: statistics.memberProfileErrors, color: '#f87171' },
          ].map((stat, i) => (
            <div key={i} className="card fade-in" style={{
              padding: 24,
              borderLeft: `4px solid ${stat.color}`,
              animationDelay: `${i * 0.1}s`,
            }}>
              <div style={{ fontSize: 14, color: '#94a3b8', marginBottom: 8 }}>{stat.label}</div>
              <div style={{ fontSize: 36, fontWeight: 700, color: stat.color }}>{stat.value}</div>
            </div>
          ))}
        </div>

        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ fontSize: 24, fontWeight: 700 }}>选择关卡</h2>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn-secondary" onClick={() => navigate('/review')}>
                📹 复盘回放
              </button>
              <button className="btn-secondary" onClick={() => navigate('/statistics')}>
                📊 训练统计
              </button>
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 20,
          }}>
            {levels.map((level, i) => {
              const levelStats = statistics.levelStats[`level_${level.id}`] || {}
              return (
                <div
                  key={level.id}
                  className="card fade-in"
                  style={{
                    padding: 24,
                    opacity: level.unlocked ? 1 : 0.5,
                    animationDelay: `${i * 0.1}s`,
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    width: 120,
                    height: 120,
                    background: `radial-gradient(circle, rgba(${i * 40}, ${100 + i * 30}, 255, 0.1) 0%, transparent 70%)`,
                    pointerEvents: 'none',
                  }} />

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 16 }}>
                    <div>
                      <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>
                        LEVEL {level.id.toString().padStart(2, '0')}
                      </div>
                      <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>{level.name}</h3>
                    </div>
                    {!level.unlocked && (
                      <span className="tag tag-danger">🔒 未解锁</span>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                    <div>
                      <div style={{ fontSize: 12, color: '#64748b' }}>时长</div>
                      <div style={{ fontSize: 16, fontWeight: 600 }}>{Math.floor(level.duration / 60)}:{(level.duration % 60).toString().padStart(2, '0')}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: '#64748b' }}>任务数</div>
                      <div style={{ fontSize: 16, fontWeight: 600 }}>{level.taskCount} 单</div>
                    </div>
                    {levelStats.games > 0 && (
                      <>
                        <div>
                          <div style={{ fontSize: 12, color: '#64748b' }}>通关率</div>
                          <div style={{ fontSize: 16, fontWeight: 600, color: '#34d399' }}>
                            {levelStats.games > 0 ? Math.round((levelStats.wins / levelStats.games) * 100) : 0}%
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: 12, color: '#64748b' }}>最高分</div>
                          <div style={{ fontSize: 16, fontWeight: 600, color: '#fbbf24' }}>{levelStats.bestScore}</div>
                        </div>
                      </>
                    )}
                  </div>

                  <button
                    className="btn-primary"
                    style={{ width: '100%' }}
                    disabled={!level.unlocked}
                    onClick={() => navigate(`/game/${level.id}`)}
                  >
                    {level.unlocked ? '开始训练' : '通关上一关卡解锁'}
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>📖 训练指南</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
            {[
              { icon: '📋', title: '处方照片审核', desc: '检查清晰度、剂量和会员信息，模糊的需要升级处理' },
              { icon: '👨‍⚕️', title: '药师意见处理', desc: '有冲突或调整建议的需要升级，无异常直接通过' },
              { icon: '📦', title: '批号效期核验', desc: '检查是否过期，核对会员档案对应记录' },
              { icon: '⚠️', title: '视觉提示', desc: '问题任务出现前会有预警闪烁，注意观察' },
              { icon: '📹', title: '复盘回放', desc: '失败后可查看最近10次失败过程回放' },
              { icon: '📊', title: '回访统计', desc: '统计页重点关注回访完成率，比较关卡差异' },
            ].map((tip, i) => (
              <div key={i} style={{
                padding: 16,
                background: 'rgba(255,255,255,0.03)',
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.05)',
              }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>{tip.icon}</div>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{tip.title}</div>
                <div style={{ fontSize: 13, color: '#94a3b8' }}>{tip.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
