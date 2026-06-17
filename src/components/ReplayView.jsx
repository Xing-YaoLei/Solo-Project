import React, { useMemo } from 'react'
import { useGameStore, EQUIPMENT_TYPES, PATIENT_TYPES } from '../store/useGameStore'
import ReplayScene from './ReplayScene'

export default function ReplayView() {
  const {
    replayData,
    replayTime,
    isReplayPlaying,
    replaySpeed,
    setReplayTime,
    setReplayPlaying,
    setReplaySpeed,
    goToMenu,
    getReplayStateAtTime,
  } = useGameStore()
  
  const currentState = useMemo(() => {
    if (!replayData) return null
    return getReplayStateAtTime(replayTime)
  }, [replayTime, replayData, getReplayStateAtTime])
  
  const eventsUpToNow = useMemo(() => {
    if (!replayData) return []
    return replayData.events.filter(e => e.startTime <= replayTime)
  }, [replayTime, replayData])
  
  if (!replayData) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h2 style={styles.title}>无回放数据</h2>
          <button className="btn" onClick={goToMenu} style={styles.backBtn}>
            返回主菜单
          </button>
        </div>
      </div>
    )
  }
  
  const progress = replayData.timeLimit > 0 ? (replayTime / replayData.timeLimit) * 100 : 0
  const isWin = replayData.isWin
  
  const handlePlayPause = () => {
    if (replayTime >= replayData.timeLimit) {
      setReplayTime(0)
    }
    setReplayPlaying(!isReplayPlaying)
  }
  
  const handleRestart = () => {
    setReplayTime(0)
    setReplayPlaying(true)
  }
  
  const handleSpeedChange = (speed) => {
    setReplaySpeed(speed)
  }
  
  const handleProgressClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percentage = x / rect.width
    const newTime = percentage * replayData.timeLimit
    setReplayTime(Math.max(0, Math.min(replayData.timeLimit, newTime)))
  }
  
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }
  
  return (
    <div style={styles.container}>
      <div style={styles.canvasContainer}>
        <ReplayScene />
      </div>
      
      <div className="ui-overlay">
        <div style={styles.topBar}>
          <div style={styles.topBarLeft}>
            <h2 style={styles.title}>🎬 复盘回放</h2>
            <span style={{ 
              ...styles.levelBadge,
              backgroundColor: isWin ? 'linear-gradient(135deg, #6bcb77, #4dd4ac)' : 'linear-gradient(135deg, #ff6b6b, #ffa502)',
            }}>
              第 {replayData.level} 关 · {isWin ? '成功' : '失败'}
            </span>
          </div>
          <button 
            className="btn btn-secondary"
            style={styles.backBtn}
            onClick={goToMenu}
          >
            ← 返回
          </button>
        </div>
        
        <div style={styles.statsRow}>
          <div style={styles.statCard}>
            <span style={styles.statLabel}>最终得分</span>
            <span style={styles.statValue}>{replayData.score}</span>
          </div>
          <div style={styles.statCard}>
            <span style={styles.statLabel}>完成数</span>
            <span style={styles.statValue}>
              {replayData.completedCount}/{replayData.totalCount}
            </span>
          </div>
          <div style={styles.statCard}>
            <span style={styles.statLabel}>完成率</span>
            <span style={styles.statValue}>
              {Math.round(replayData.completionRate * 100)}%
            </span>
          </div>
          <div style={styles.statCard}>
            <span style={styles.statLabel}>最大连击</span>
            <span style={styles.statValue}>{replayData.maxCombo}</span>
          </div>
        </div>
        
        <div style={styles.leftPanel}>
          <h3 style={styles.panelTitle}>📋 事件时间线</h3>
          <div style={styles.eventList}>
            {replayData.events.map((event, idx) => {
              const patient = replayData.initialPatients.find(p => p.id === event.patientId)
              const equipment = replayData.initialEquipment.find(e => e.id === event.equipmentId)
              const patientType = patient ? 
                Object.values(PATIENT_TYPES).find(t => t.id === patient.type) : null
              const eqType = equipment ? 
                Object.values(EQUIPMENT_TYPES).find(e => e.id === equipment.type) : null
              
              const isPast = event.startTime <= replayTime
              
              return (
                <div 
                  key={idx} 
                  style={{
                    ...styles.eventItem,
                    ...(isPast ? styles.eventItemPast : styles.eventItemFuture),
                  }}
                  onClick={() => setReplayTime(event.startTime)}
                >
                  <span style={styles.eventTime}>
                    {formatTime(event.startTime)}
                  </span>
                  <span style={styles.eventIcon}>
                    {event.success ? '✅' : '❌'}
                  </span>
                  <div style={styles.eventContent}>
                    <span style={styles.eventText}>
                      {patient?.name || '未知'} → {equipment?.name || '未知'}
                    </span>
                    {patient?.insuranceRisk && (
                      <span style={styles.insuranceTag}>医保</span>
                    )}
                  </div>
                </div>
              )
            })}
            {replayData.events.length === 0 && (
              <p style={styles.emptyText}>暂无调度记录</p>
            )}
          </div>
        </div>
        
        <div style={styles.rightPanel}>
          <h3 style={styles.panelTitle}>📊 实时状态</h3>
          
          {currentState && (
            <>
              <div style={styles.statusSection}>
                <h4 style={styles.sectionTitle}>等待中</h4>
                <div style={styles.patientMiniList}>
                  {currentState.patients.filter(p => p.status === 'waiting').map(p => {
                    const pType = Object.values(PATIENT_TYPES).find(t => t.id === p.type)
                    return (
                      <div key={p.id} style={styles.patientMiniItem}>
                        <span style={{ color: pType?.color }}>●</span>
                        <span style={styles.patientMiniName}>{p.name}</span>
                      </div>
                    )
                  })}
                  {currentState.patients.filter(p => p.status === 'waiting').length === 0 && (
                    <span style={styles.emptyMini}>无</span>
                  )}
                </div>
              </div>
              
              <div style={styles.statusSection}>
                <h4 style={styles.sectionTitle}>治疗中</h4>
                <div style={styles.patientMiniList}>
                  {currentState.patients.filter(p => p.status === 'treatment').map(p => {
                    const pType = Object.values(PATIENT_TYPES).find(t => t.id === p.type)
                    return (
                      <div key={p.id} style={styles.patientMiniItem}>
                        <span style={{ color: '#6bcb77' }}>●</span>
                        <span style={styles.patientMiniName}>{p.name}</span>
                      </div>
                    )
                  })}
                  {currentState.patients.filter(p => p.status === 'treatment').length === 0 && (
                    <span style={styles.emptyMini}>无</span>
                  )}
                </div>
              </div>
              
              <div style={styles.statusSection}>
                <h4 style={styles.sectionTitle}>已完成</h4>
                <div style={styles.patientMiniList}>
                  {currentState.patients.filter(p => p.status === 'completed').map(p => {
                    return (
                      <div key={p.id} style={styles.patientMiniItem}>
                        <span style={{ color: '#4facfe' }}>✓</span>
                        <span style={styles.patientMiniName}>{p.name}</span>
                      </div>
                    )
                  })}
                  {currentState.patients.filter(p => p.status === 'completed').length === 0 && (
                    <span style={styles.emptyMini}>无</span>
                  )}
                </div>
              </div>
            </>
          )}
          
          <div style={styles.analysisSection}>
            <h4 style={styles.sectionTitle}>💡 复盘分析</h4>
            <div style={styles.analysisPoints}>
              <p style={styles.analysisPoint}>
                • 共完成 {replayData.completedCount} / {replayData.totalCount} 位患者治疗
              </p>
              <p style={styles.analysisPoint}>
                • 有 {replayData.totalMisallocations} 次分配失误
              </p>
              <p style={styles.analysisPoint}>
                • 最大连击 {replayData.maxCombo} 次
              </p>
            </div>
            {!isWin && (
              <div style={styles.improveTip}>
                <strong>失败原因：</strong>
                {replayData.result === 'timeup' 
                  ? '时间不足，未能在限时内完成所有患者治疗'
                  : '训练未达标'
                }
              </div>
            )}
          </div>
        </div>
        
        <div style={styles.controlsPanel}>
          <div 
            style={styles.progressSection}
            onClick={handleProgressClick}
          >
            <div className="progress-bar" style={styles.progressBar}>
              <div 
                className="progress-fill"
                style={{ ...styles.progressFill, width: `${progress}%` }}
              />
              {replayData.events.map((event, idx) => (
                <div
                  key={idx}
                  style={{
                    ...styles.eventMarker,
                    left: `${(event.startTime / replayData.timeLimit) * 100}%`,
                  }}
                  title={`${formatTime(event.startTime)} - ${event.success ? '成功' : '失败'}`}
                />
              ))}
            </div>
            <div style={styles.timeLabels}>
              <span style={styles.timeLabel}>0:00</span>
              <span style={styles.timeLabel}>{formatTime(replayTime)}</span>
              <span style={styles.timeLabel}>{formatTime(replayData.timeLimit)}</span>
            </div>
          </div>
          
          <div style={styles.controlButtons}>
            <button 
              className="btn btn-secondary"
              style={styles.smallBtn}
              onClick={() => setReplayTime(Math.max(0, replayTime - 5))}
            >
              ⏪ -5s
            </button>
            
            <button 
              className="btn btn-secondary"
              style={styles.smallBtn}
              onClick={handleRestart}
            >
              ⏮️ 重新开始
            </button>
            
            <button 
              className="btn"
              style={styles.playBtn}
              onClick={handlePlayPause}
            >
              {isReplayPlaying ? '⏸️ 暂停' : '▶️ 播放'}
            </button>
            
            <button 
              className="btn btn-secondary"
              style={styles.smallBtn}
              onClick={() => setReplayTime(Math.min(replayData.timeLimit, replayTime + 5))}
            >
              +5s ⏩
            </button>
            
            <div style={styles.speedControls}>
              <span style={styles.speedLabel}>速度:</span>
              {[0.5, 1, 2, 4].map(speed => (
                <button
                  key={speed}
                  style={{
                    ...styles.speedBtn,
                    ...(replaySpeed === speed ? styles.speedBtnActive : {}),
                  }}
                  onClick={() => handleSpeedChange(speed)}
                >
                  {speed}x
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const styles = {
  container: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  canvasContainer: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
  },
  topBar: {
    position: 'absolute',
    top: '16px',
    left: '16px',
    right: '16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topBarLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  title: {
    fontSize: '20px',
    color: '#4facfe',
    margin: 0,
  },
  levelBadge: {
    padding: '6px 14px',
    borderRadius: '16px',
    fontWeight: 'bold',
    fontSize: '13px',
    color: '#ffffff',
  },
  backBtn: {
    padding: '8px 16px',
    fontSize: '14px',
  },
  statsRow: {
    position: 'absolute',
    top: '60px',
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    gap: '12px',
  },
  statCard: {
    padding: '10px 20px',
    background: 'rgba(26, 26, 46, 0.9)',
    borderRadius: '10px',
    textAlign: 'center',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },
  statLabel: {
    display: 'block',
    fontSize: '11px',
    color: '#a0aec0',
    marginBottom: '2px',
  },
  statValue: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#ffd93d',
  },
  leftPanel: {
    position: 'absolute',
    top: '120px',
    left: '16px',
    width: '260px',
    maxHeight: 'calc(100vh - 200px)',
    background: 'rgba(26, 26, 46, 0.9)',
    borderRadius: '16px',
    padding: '14px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    overflowY: 'auto',
  },
  panelTitle: {
    fontSize: '14px',
    margin: '0 0 10px 0',
    color: '#4facfe',
  },
  eventList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  eventItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 10px',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  eventItemPast: {
    background: 'rgba(79, 172, 254, 0.1)',
    borderLeft: '3px solid #4facfe',
  },
  eventItemFuture: {
    background: 'rgba(255, 255, 255, 0.03)',
    opacity: 0.6,
  },
  eventTime: {
    fontSize: '11px',
    color: '#718096',
    minWidth: '45px',
    fontWeight: 'bold',
  },
  eventIcon: {
    fontSize: '12px',
  },
  eventContent: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  eventText: {
    fontSize: '12px',
    color: '#cbd5e0',
    flex: 1,
  },
  insuranceTag: {
    padding: '2px 5px',
    background: '#ff6b6b',
    borderRadius: '4px',
    fontSize: '9px',
    color: '#ffffff',
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    color: '#718096',
    fontSize: '12px',
    padding: '20px',
  },
  rightPanel: {
    position: 'absolute',
    top: '120px',
    right: '16px',
    width: '220px',
    background: 'rgba(26, 26, 46, 0.9)',
    borderRadius: '16px',
    padding: '14px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },
  statusSection: {
    marginBottom: '12px',
  },
  sectionTitle: {
    fontSize: '12px',
    margin: '0 0 6px 0',
    color: '#a0aec0',
    fontWeight: '600',
  },
  patientMiniList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
  },
  patientMiniItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '11px',
    color: '#cbd5e0',
  },
  patientMiniName: {
    fontSize: '11px',
  },
  emptyMini: {
    fontSize: '11px',
    color: '#718096',
    fontStyle: 'italic',
  },
  analysisSection: {
    marginTop: '12px',
    paddingTop: '12px',
    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
  },
  analysisPoints: {
    marginBottom: '10px',
  },
  analysisPoint: {
    fontSize: '11px',
    color: '#a0aec0',
    margin: '4px 0',
    lineHeight: '1.4',
  },
  improveTip: {
    padding: '8px 10px',
    background: 'rgba(255, 107, 107, 0.1)',
    borderRadius: '8px',
    fontSize: '11px',
    color: '#ff6b6b',
    lineHeight: '1.5',
    borderLeft: '3px solid #ff6b6b',
  },
  controlsPanel: {
    position: 'absolute',
    bottom: '16px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '90%',
    maxWidth: '650px',
    padding: '14px',
    background: 'rgba(26, 26, 46, 0.95)',
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
  },
  progressSection: {
    cursor: 'pointer',
    marginBottom: '12px',
  },
  progressBar: {
    height: '12px',
    position: 'relative',
    overflow: 'visible',
  },
  progressFill: {
    height: '100%',
    borderRadius: '6px',
    position: 'relative',
    zIndex: 1,
  },
  eventMarker: {
    position: 'absolute',
    top: '-2px',
    width: '4px',
    height: '16px',
    backgroundColor: '#ffd93d',
    borderRadius: '2px',
    zIndex: 2,
    transform: 'translateX(-50%)',
  },
  timeLabels: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '4px',
  },
  timeLabel: {
    fontSize: '11px',
    color: '#718096',
  },
  controlButtons: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    flexWrap: 'wrap',
  },
  smallBtn: {
    padding: '8px 14px',
    fontSize: '13px',
  },
  playBtn: {
    padding: '10px 28px',
    fontSize: '15px',
  },
  speedControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    marginLeft: '12px',
  },
  speedLabel: {
    fontSize: '12px',
    color: '#a0aec0',
    marginRight: '4px',
  },
  speedBtn: {
    padding: '5px 10px',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '6px',
    background: 'rgba(255, 255, 255, 0.05)',
    color: '#a0aec0',
    cursor: 'pointer',
    fontSize: '11px',
    transition: 'all 0.2s ease',
  },
  speedBtnActive: {
    background: 'linear-gradient(135deg, #4facfe, #00f2fe)',
    color: '#ffffff',
    borderColor: '#4facfe',
    fontWeight: 'bold',
  },
}
