import React from 'react'
import { useGameStore } from '../store/useGameStore'

export default function StatisticsView() {
  const {
    statistics,
    failedReplays,
    goToMenu,
    goToReplay,
  } = useGameStore()
  
  const { 
    totalGames, 
    totalCompleted, 
    completionRate, 
    levelStats, 
    avgDecisionTime, 
    equipmentErrorReasons,
    totalMisallocations,
  } = statistics
  
  const totalErrors = Object.values(equipmentErrorReasons).reduce((a, b) => a + b, 0)
  
  const levelKeys = Object.keys(levelStats).sort((a, b) => {
    const numA = parseInt(a.split('_')[1])
    const numB = parseInt(b.split('_')[1])
    return numA - numB
  })
  
  const errorReasons = [
    { key: 'misallocation', label: '器械错配', color: '#ff6b6b' },
    { key: 'timingConflict', label: '时间冲突', color: '#ffa502' },
    { key: 'riskMismatch', label: '风险不匹配', color: '#a55eea' },
    { key: 'overcapacity', label: '超负荷', color: '#2ed573' },
  ]
  
  const getEffectRating = (completionAvg, playCount) => {
    if (playCount < 2) return { label: '数据不足', color: '#718096' }
    if (completionAvg >= 0.85) return { label: '优秀', color: '#6bcb77' }
    if (completionAvg >= 0.7) return { label: '良好', color: '#4facfe' }
    if (completionAvg >= 0.5) return { label: '一般', color: '#ffa502' }
    return { label: '需加强', color: '#ff6b6b' }
  }
  
  const bestLevel = levelKeys.length > 0 
    ? levelKeys.reduce((best, key) => {
        const stat = levelStats[key]
        const bestStat = levelStats[best]
        if (!bestStat || stat.avgCompletion > bestStat.avgCompletion) {
          return key
        }
        return best
      }, null)
    : null
  
  const hardestLevel = levelKeys.length > 1
    ? levelKeys.reduce((worst, key) => {
        const stat = levelStats[key]
        const worstStat = levelStats[worst]
        if (!worstStat || stat.avgCompletion < worstStat.avgCompletion) {
          return key
        }
        return worst
      }, null)
    : null
  
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h2 style={styles.title}>📊 训练统计</h2>
          <button 
            className="btn btn-secondary"
            style={styles.backBtn}
            onClick={goToMenu}
          >
            ← 返回
          </button>
        </div>
        
        <div style={styles.overviewSection}>
          <h3 style={styles.sectionTitle}>📈 总体数据</h3>
          <div style={styles.overviewGrid}>
            <div style={styles.overviewCard}>
              <span style={styles.overviewIcon}>🎮</span>
              <span style={styles.overviewValue}>{totalGames}</span>
              <span style={styles.overviewLabel}>总训练次数</span>
            </div>
            <div style={styles.overviewCard}>
              <span style={styles.overviewIcon}>🏆</span>
              <span style={styles.overviewValue}>{totalCompleted}</span>
              <span style={styles.overviewLabel}>成功次数</span>
            </div>
            <div style={styles.overviewCard}>
              <span style={styles.overviewIcon}>✅</span>
              <span style={styles.overviewValue}>{Math.round(completionRate * 100)}%</span>
              <span style={styles.overviewLabel}>训练完成率</span>
            </div>
            <div style={styles.overviewCard}>
              <span style={styles.overviewIcon}>❌</span>
              <span style={styles.overviewValue}>{totalMisallocations}</span>
              <span style={styles.overviewLabel}>分配失误</span>
            </div>
            <div style={styles.overviewCard}>
              <span style={styles.overviewIcon}>⏱️</span>
              <span style={styles.overviewValue}>{avgDecisionTime > 0 ? avgDecisionTime.toFixed(1) : '--'}s</span>
              <span style={styles.overviewLabel}>平均决策时间</span>
            </div>
          </div>
        </div>
        
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <h3 style={styles.sectionTitle}>🎯 关卡训练效果对比</h3>
            {bestLevel && (
              <span style={styles.bestBadge}>
                最佳: 第{bestLevel.split('_')[1]}关
              </span>
            )}
          </div>
          <p style={styles.sectionDesc}>
            各关卡的训练完成率、平均分和胜率，可对比看出不同关卡的训练效果
          </p>
          
          {levelKeys.length > 0 ? (
            <div style={styles.levelComparison}>
              <div style={styles.levelTableHeader}>
                <span style={styles.levelColLevel}>关卡</span>
                <span style={styles.levelColPlays}>次数</span>
                <span style={styles.levelColWin}>胜率</span>
                <span style={styles.levelColCompletion}>完成率</span>
                <span style={styles.levelColScore}>平均分</span>
                <span style={styles.levelColDecision}>决策时间</span>
                <span style={styles.levelColEffect}>效果</span>
              </div>
              
              <div style={styles.levelList}>
                {levelKeys.map(levelKey => {
                  const stat = levelStats[levelKey]
                  const levelNum = parseInt(levelKey.split('_')[1])
                  const effect = getEffectRating(stat.avgCompletion, stat.plays)
                  const winRatePercent = Math.round(stat.winRate * 100)
                  const completionPercent = Math.round(stat.avgCompletion * 100)
                  const avgScore = Math.round(stat.avgScore)
                  const avgDispatchTime = stat.avgDispatchTime 
                    ? stat.avgDispatchTime.toFixed(1) 
                    : '--'
                  
                  const isBest = levelKey === bestLevel
                  const isHardest = levelKey === hardestLevel
                  
                  return (
                    <div 
                      key={levelKey} 
                      style={{
                        ...styles.levelRow,
                        ...(isBest ? styles.levelRowBest : {}),
                        ...(isHardest ? styles.levelRowHardest : {}),
                      }}
                    >
                      <div style={styles.levelColLevel}>
                        <span style={styles.levelNumBadge}>第 {levelNum} 关</span>
                        {isBest && <span style={styles.smallBadgeGreen}>最佳</span>}
                        {isHardest && <span style={styles.smallBadgeRed}>最难</span>}
                      </div>
                      
                      <span style={styles.levelColPlays}>{stat.plays}</span>
                      
                      <div style={styles.levelColWin}>
                        <div className="progress-bar" style={styles.smallProgress}>
                          <div 
                            className="progress-fill"
                            style={{
                              width: `${winRatePercent}%`,
                              background: winRatePercent >= 60 
                                ? 'linear-gradient(90deg, #6bcb77, #4dd4ac)' 
                                : 'linear-gradient(90deg, #ffa502, #ff6b6b)',
                            }}
                          />
                        </div>
                        <span style={styles.progressText}>{winRatePercent}%</span>
                      </div>
                      
                      <div style={styles.levelColCompletion}>
                        <div className="progress-bar" style={styles.smallProgress}>
                          <div 
                            className="progress-fill"
                            style={{
                              width: `${completionPercent}%`,
                              background: completionPercent >= 70 
                                ? 'linear-gradient(90deg, #4facfe, #00f2fe)'
                                : 'linear-gradient(90deg, #ffa502, #ff6b6b)',
                            }}
                          />
                        </div>
                        <span style={styles.progressText}>{completionPercent}%</span>
                      </div>
                      
                      <span style={styles.levelColScore}>{avgScore}</span>
                      
                      <span style={styles.levelColDecision}>
                        <span style={styles.decisionTimeValue}>{avgDispatchTime}s</span>
                        <span style={styles.decisionTimeLabel}>
                          评估 {stat.assessmentTime || '--'}s
                        </span>
                      </span>
                      
                      <span 
                        style={{ 
                          ...styles.levelColEffect, 
                          color: effect.color,
                          fontWeight: 'bold',
                        }}
                      >
                        {effect.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <p style={styles.emptyText}>暂无训练数据，快去开始训练吧！</p>
          )}
        </div>
        
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>🔧 器械错因统计</h3>
          <p style={styles.sectionDesc}>
            累计失误次数: {totalMisallocations} 次
          </p>
          
          <div style={styles.errorChart}>
            {errorReasons.map(reason => {
              const count = equipmentErrorReasons[reason.key] || 0
              const percentage = totalMisallocations > 0 ? (count / totalMisallocations) * 100 : 0
              
              return (
                <div key={reason.key} style={styles.errorChartItem}>
                  <div style={styles.errorChartLabel}>
                    <span 
                      style={{ 
                        ...styles.errorChartDot, 
                        backgroundColor: reason.color,
                      }} 
                    />
                    {reason.label}
                  </div>
                  <div className="progress-bar" style={styles.errorChartBar}>
                    <div 
                      className="progress-fill"
                      style={{
                        width: `${percentage}%`,
                        background: reason.color,
                      }}
                    />
                  </div>
                  <span style={styles.errorChartCount}>{count}次</span>
                  <span style={styles.errorChartPercent}>
                    {percentage.toFixed(0)}%
                  </span>
                </div>
              )
            })}
          </div>
        </div>
        
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>🎬 最近失败回放</h3>
          <p style={styles.sectionDesc}>
            保留最近 {failedReplays.length}/5 次失败的训练记录，点击可查看复盘
          </p>
          
          {failedReplays.length > 0 ? (
            <div style={styles.replayList}>
              {failedReplays.map((replay, idx) => {
                const levelNum = replay.level
                const completionPercent = Math.round(replay.completionRate * 100)
                const date = new Date(replay.timestamp)
                const dateStr = `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`
                
                return (
                  <div 
                    key={replay.timestamp + idx}
                    style={styles.replayItem}
                    onClick={() => goToReplay(replay)}
                  >
                    <div style={styles.replayRank}>
                      <span style={styles.rankBadge}>#{idx + 1}</span>
                    </div>
                    
                    <div style={styles.replayInfo}>
                      <div style={styles.replayTopRow}>
                        <span style={styles.replayLevel}>第 {levelNum} 关</span>
                        <span style={styles.replayScore}>{replay.score} 分</span>
                      </div>
                      <div style={styles.replayBottomRow}>
                        <span style={styles.replayDate}>{dateStr}</span>
                        <span style={styles.replayRate}>
                          完成率: {completionPercent}%
                        </span>
                      </div>
                      <div className="progress-bar" style={styles.replayProgress}>
                        <div 
                          className="progress-fill danger"
                          style={{ width: `${completionPercent}%` }}
                        />
                      </div>
                    </div>
                    
                    <button className="btn btn-secondary" style={styles.replayBtn}>
                      查看 →
                    </button>
                  </div>
                )
              })}
            </div>
          ) : (
            <p style={styles.emptyText}>暂无失败记录，保持优秀！</p>
          )}
        </div>
      </div>
    </div>
  )
}

const styles = {
  container: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    padding: '20px',
    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    overflowY: 'auto',
  },
  card: {
    background: 'rgba(26, 26, 46, 0.95)',
    borderRadius: '24px',
    padding: '32px',
    width: '100%',
    maxWidth: '800px',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    paddingBottom: '16px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  },
  title: {
    fontSize: '24px',
    color: '#4facfe',
    margin: 0,
  },
  backBtn: {
    padding: '10px 20px',
    fontSize: '14px',
  },
  overviewSection: {
    marginBottom: '28px',
  },
  section: {
    marginBottom: '28px',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  sectionTitle: {
    fontSize: '18px',
    margin: '0 0 8px 0',
    color: '#ffffff',
  },
  sectionDesc: {
    fontSize: '13px',
    color: '#718096',
    marginBottom: '16px',
  },
  bestBadge: {
    padding: '4px 12px',
    background: 'linear-gradient(135deg, #ffd93d, #ff9500)',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 'bold',
    color: '#1a1a2e',
  },
  overviewGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: '12px',
  },
  overviewCard: {
    padding: '18px 12px',
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '12px',
    textAlign: 'center',
  },
  overviewIcon: {
    display: 'block',
    fontSize: '24px',
    marginBottom: '6px',
  },
  overviewValue: {
    display: 'block',
    fontSize: '22px',
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: '4px',
  },
  overviewLabel: {
    fontSize: '11px',
    color: '#718096',
  },
  levelComparison: {
    background: 'rgba(255, 255, 255, 0.03)',
    borderRadius: '12px',
    overflow: 'hidden',
    border: '1px solid rgba(255, 255, 255, 0.05)',
  },
  levelTableHeader: {
    display: 'grid',
    gridTemplateColumns: '120px 50px 1fr 1fr 70px 70px',
    gap: '10px',
    padding: '12px 16px',
    background: 'rgba(255, 255, 255, 0.05)',
    fontSize: '12px',
    color: '#a0aec0',
    fontWeight: 'bold',
  },
  levelColLevel: { textAlign: 'left' },
  levelColPlays: { textAlign: 'center' },
  levelColWin: { textAlign: 'center', display: 'flex', alignItems: 'center', gap: '8px' },
  levelColCompletion: { textAlign: 'center', display: 'flex', alignItems: 'center', gap: '8px' },
  levelColScore: { textAlign: 'center' },
  levelColDecision: { textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' },
  levelColEffect: { textAlign: 'center' },
  levelList: {
    display: 'flex',
    flexDirection: 'column',
  },
  levelRow: {
    display: 'grid',
    gridTemplateColumns: '120px 50px 1fr 1fr 70px 80px 70px',
    gap: '10px',
    padding: '12px 16px',
    alignItems: 'center',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
    fontSize: '13px',
    transition: 'background 0.2s ease',
  },
  decisionTimeValue: {
    fontSize: '13px',
    fontWeight: 'bold',
    color: '#4facfe',
  },
  decisionTimeLabel: {
    fontSize: '10px',
    color: '#718096',
  },
  levelRowBest: {
    background: 'rgba(107, 203, 119, 0.08)',
  },
  levelRowHardest: {
    background: 'rgba(255, 107, 107, 0.08)',
  },
  levelNumBadge: {
    padding: '4px 10px',
    background: 'linear-gradient(135deg, #667eea, #764ba2)',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: 'bold',
    color: '#ffffff',
    marginRight: '6px',
  },
  smallBadgeGreen: {
    padding: '2px 6px',
    background: 'rgba(107, 203, 119, 0.3)',
    borderRadius: '4px',
    fontSize: '10px',
    color: '#6bcb77',
    fontWeight: 'bold',
  },
  smallBadgeRed: {
    padding: '2px 6px',
    background: 'rgba(255, 107, 107, 0.3)',
    borderRadius: '4px',
    fontSize: '10px',
    color: '#ff6b6b',
    fontWeight: 'bold',
  },
  smallProgress: {
    flex: 1,
    height: '6px',
    minWidth: '50px',
  },
  progressText: {
    fontSize: '11px',
    color: '#cbd5e0',
    minWidth: '36px',
    textAlign: 'right',
  },
  errorChart: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  errorChartItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  errorChartLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    color: '#cbd5e0',
    width: '90px',
    flexShrink: 0,
  },
  errorChartDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
  },
  errorChartBar: {
    flex: 1,
    height: '8px',
  },
  errorChartCount: {
    fontSize: '13px',
    fontWeight: 'bold',
    color: '#ffffff',
    minWidth: '40px',
    textAlign: 'right',
  },
  errorChartPercent: {
    fontSize: '11px',
    color: '#718096',
    minWidth: '35px',
    textAlign: 'right',
  },
  replayList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  replayItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '14px 16px',
    background: 'rgba(255, 255, 255, 0.03)',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    border: '1px solid rgba(255, 255, 255, 0.05)',
  },
  replayRank: {
    flexShrink: 0,
  },
  rankBadge: {
    display: 'block',
    width: '36px',
    height: '36px',
    lineHeight: '36px',
    textAlign: 'center',
    background: 'linear-gradient(135deg, #ff6b6b, #ffa502)',
    borderRadius: '50%',
    fontWeight: 'bold',
    fontSize: '14px',
    color: '#ffffff',
  },
  replayInfo: {
    flex: 1,
    minWidth: 0,
  },
  replayTopRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '4px',
  },
  replayLevel: {
    fontWeight: 'bold',
    color: '#ffffff',
    fontSize: '14px',
  },
  replayScore: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#ffd93d',
  },
  replayBottomRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12px',
    color: '#a0aec0',
    marginBottom: '8px',
  },
  replayDate: {},
  replayRate: {},
  replayProgress: {
    height: '6px',
  },
  replayBtn: {
    padding: '8px 16px',
    fontSize: '13px',
    flexShrink: 0,
  },
  emptyText: {
    textAlign: 'center',
    color: '#718096',
    fontSize: '14px',
    padding: '30px',
    background: 'rgba(255, 255, 255, 0.03)',
    borderRadius: '12px',
  },
}
