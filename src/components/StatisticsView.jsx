import React from 'react'
import { useGameStore } from '../store/useGameStore'

export default function StatisticsView() {
  const {
    statistics,
    failedReplays,
    goToMenu,
    goToReplay,
  } = useGameStore()
  
  const { totalGames, totalCompleted, completionRate, levelStats, avgDecisionTime, equipmentErrorReasons } = statistics
  
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
  
  const totalErrors = Object.values(equipmentErrorReasons).reduce((a, b) => a + b, 0)
  
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
              <span style={styles.overviewLabel}>总局数</span>
            </div>
            <div style={styles.overviewCard}>
              <span style={styles.overviewIcon}>🏆</span>
              <span style={styles.overviewValue}>{totalCompleted}</span>
              <span style={styles.overviewLabel}>完成局数</span>
            </div>
            <div style={styles.overviewCard}>
              <span style={styles.overviewIcon}>✅</span>
              <span style={styles.overviewValue}>{Math.round(completionRate * 100)}%</span>
              <span style={styles.overviewLabel}>训练完成率</span>
            </div>
            <div style={styles.overviewCard}>
              <span style={styles.overviewIcon}>⏱️</span>
              <span style={styles.overviewValue}>{avgDecisionTime.toFixed(1)}s</span>
              <span style={styles.overviewLabel}>平均决策时间</span>
            </div>
          </div>
        </div>
        
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>🎯 关卡训练效果</h3>
          <p style={styles.sectionDesc}>
            各关卡的训练完成情况，可看出哪些关卡训练效果更好
          </p>
          
          {levelKeys.length > 0 ? (
            <div style={styles.levelList}>
              {levelKeys.map(levelKey => {
                const stat = levelStats[levelKey]
                const levelNum = parseInt(levelKey.split('_')[1])
                const winRate = stat.plays > 0 ? (stat.wins / stat.plays) * 100 : 0
                const completionAvg = Math.round(stat.avgCompletion * 100)
                
                let effectRating = ''
                let effectColor = ''
                if (completionAvg >= 80) {
                  effectRating = '优秀'
                  effectColor = '#6bcb77'
                } else if (completionAvg >= 60) {
                  effectRating = '良好'
                  effectColor = '#4facfe'
                } else if (completionAvg >= 40) {
                  effectRating = '一般'
                  effectColor = '#ffa502'
                } else {
                  effectRating = '需加强'
                  effectColor = '#ff6b6b'
                }
                
                return (
                  <div key={levelKey} style={styles.levelItem}>
                    <div style={styles.levelHeader}>
                      <div style={styles.levelName}>
                        <span style={styles.levelBadge}>第 {levelNum} 关</span>
                        <span style={{ ...styles.levelEffect, color: effectColor }}>
                          训练效果: {effectRating}
                        </span>
                      </div>
                      <div style={styles.levelStats}>
                        <span style={styles.levelPlayCount}>
                          游玩 {stat.plays} 次
                        </span>
                        <span style={styles.levelWinCount}>
                          通关 {stat.wins} 次
                        </span>
                      </div>
                    </div>
                    
                    <div style={styles.levelProgressRow}>
                      <span style={styles.progressLabel}>完成率</span>
                      <div className="progress-bar" style={styles.levelProgressBar}>
                        <div 
                          className="progress-fill"
                          style={{
                            width: `${completionAvg}%`,
                            background: `linear-gradient(90deg, ${effectColor}, ${effectColor}aa)`,
                          }}
                        />
                      </div>
                      <span style={styles.progressValue}>{completionAvg}%</span>
                    </div>
                    
                    <div style={styles.levelProgressRow}>
                      <span style={styles.progressLabel}>最高分</span>
                      <span style={styles.progressHighlight}>{stat.bestScore}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p style={styles.emptyText}>暂无训练数据，快去开始训练吧！</p>
          )}
        </div>
        
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>🔧 器械错因统计</h3>
          <p style={styles.sectionDesc}>
            累计失误次数: {totalErrors} 次
          </p>
          
          <div style={styles.errorChart}>
            {errorReasons.map(reason => {
              const count = equipmentErrorReasons[reason.key] || 0
              const percentage = totalErrors > 0 ? (count / totalErrors) * 100 : 0
              
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
                  <span style={styles.errorChartCount}>{count}</span>
                </div>
              )
            })}
          </div>
        </div>
        
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>🎬 最近失败回放</h3>
          <p style={styles.sectionDesc}>
            保留最近 5 次失败的训练记录，可点击查看复盘
          </p>
          
          {failedReplays.length > 0 ? (
            <div style={styles.replayList}>
              {failedReplays.map((replay, idx) => (
                <div 
                  key={replay.timestamp + idx}
                  style={styles.replayItem}
                  onClick={() => goToReplay(replay)}
                >
                  <div style={styles.replayInfo}>
                    <span style={styles.replayLevel}>第 {replay.level} 关</span>
                    <span style={styles.replayScore}>{replay.score} 分</span>
                  </div>
                  <div style={styles.replayDetails}>
                    <span style={styles.replayDate}>
                      {new Date(replay.timestamp).toLocaleString('zh-CN')}
                    </span>
                    <span style={styles.replayRate}>
                      完成率: {Math.round(replay.completionRate * 100)}%
                    </span>
                  </div>
                  <button className="btn btn-secondary" style={styles.replayBtn}>
                    查看回放 →
                  </button>
                </div>
              ))}
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
    alignItems: 'center',
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
    maxWidth: '700px',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    maxHeight: '90vh',
    overflowY: 'auto',
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
    marginBottom: '24px',
  },
  section: {
    marginBottom: '24px',
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
  overviewGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '12px',
  },
  overviewCard: {
    padding: '20px',
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '12px',
    textAlign: 'center',
  },
  overviewIcon: {
    display: 'block',
    fontSize: '28px',
    marginBottom: '8px',
  },
  overviewValue: {
    display: 'block',
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: '4px',
  },
  overviewLabel: {
    fontSize: '12px',
    color: '#718096',
  },
  levelList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  levelItem: {
    padding: '16px',
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '12px',
  },
  levelHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '12px',
    flexWrap: 'wrap',
    gap: '8px',
  },
  levelName: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  levelBadge: {
    padding: '4px 12px',
    background: 'linear-gradient(135deg, #667eea, #764ba2)',
    borderRadius: '12px',
    fontSize: '13px',
    fontWeight: 'bold',
    color: '#ffffff',
    display: 'inline-block',
    width: 'fit-content',
  },
  levelEffect: {
    fontSize: '13px',
    fontWeight: 'bold',
  },
  levelStats: {
    display: 'flex',
    gap: '12px',
    fontSize: '12px',
  },
  levelPlayCount: {
    color: '#a0aec0',
  },
  levelWinCount: {
    color: '#6bcb77',
  },
  levelProgressRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '8px',
  },
  progressLabel: {
    fontSize: '12px',
    color: '#a0aec0',
    width: '50px',
  },
  levelProgressBar: {
    flex: 1,
    height: '8px',
  },
  progressValue: {
    fontSize: '13px',
    fontWeight: 'bold',
    color: '#ffffff',
    minWidth: '45px',
    textAlign: 'right',
  },
  progressHighlight: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#ffd93d',
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
  },
  errorChartDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
  },
  errorChartBar: {
    flex: 1,
    height: '8px',
  },
  errorChartCount: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#ffffff',
    minWidth: '30px',
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
    padding: '14px',
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    border: '1px solid transparent',
  },
  replayInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    minWidth: '100px',
  },
  replayLevel: {
    fontWeight: 'bold',
    color: '#ffffff',
    fontSize: '14px',
  },
  replayScore: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#ffd93d',
  },
  replayDetails: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    fontSize: '12px',
    color: '#a0aec0',
  },
  replayDate: {},
  replayRate: {},
  replayBtn: {
    padding: '8px 16px',
    fontSize: '13px',
  },
  emptyText: {
    textAlign: 'center',
    color: '#718096',
    fontSize: '14px',
    padding: '30px',
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '12px',
  },
}
