import React, { useState, useEffect, useRef } from 'react'
import { useGameStore, EQUIPMENT_TYPES, PATIENT_TYPES } from '../store/useGameStore'
import GameScene from './GameScene'

export default function ReplayView() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [replayTime, setReplayTime] = useState(0)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  
  const {
    replayData,
    goToMenu,
  } = useGameStore()
  
  const intervalRef = useRef(null)
  
  useEffect(() => {
    if (isPlaying && replayData) {
      intervalRef.current = setInterval(() => {
        setReplayTime(prev => {
          if (prev >= 180) {
            setIsPlaying(false)
            return prev
          }
          return prev + 0.1 * playbackSpeed
        })
      }, 100)
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isPlaying, playbackSpeed, replayData])
  
  if (!replayData) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h2 style={styles.title}>无回放数据</h2>
          <button 
            className="btn"
            onClick={goToMenu}
          >
            返回主菜单
          </button>
        </div>
      </div>
    )
  }
  
  const totalTime = 180
  const progress = (replayTime / totalTime) * 100
  
  const handlePlayPause = () => {
    setIsPlaying(!isPlaying)
  }
  
  const handleRestart = () => {
    setReplayTime(0)
    setIsPlaying(true)
  }
  
  const handleSpeedChange = (speed) => {
    setPlaybackSpeed(speed)
  }
  
  const isWin = replayData.result === 'success'
  
  return (
    <div style={styles.container}>
      <div style={styles.canvasContainer}>
        <GameScene />
      </div>
      
      <div className="ui-overlay">
        <div style={styles.topBar}>
          <div style={styles.topBarLeft}>
            <h2 style={styles.title}>🎬 复盘回放</h2>
            <span style={styles.levelBadge}>第 {replayData.level} 关</span>
          </div>
          <button 
            className="btn btn-secondary"
            style={styles.backBtn}
            onClick={goToMenu}
          >
            返回
          </button>
        </div>
        
        <div style={styles.infoPanel}>
          <div style={styles.infoCard}>
            <span style={styles.infoLabel}>最终得分</span>
            <span style={styles.infoValue}>{replayData.score}</span>
          </div>
          <div style={styles.infoCard}>
            <span style={styles.infoLabel}>结果</span>
            <span style={{ 
              ...styles.infoValue, 
              color: isWin ? '#6bcb77' : '#ff6b6b' 
            }}>
              {isWin ? '成功' : '失败'}
            </span>
          </div>
          <div style={styles.infoCard}>
            <span style={styles.infoLabel}>完成率</span>
            <span style={styles.infoValue}>
              {Math.round(replayData.completionRate * 100)}%
            </span>
          </div>
        </div>
        
        <div style={styles.controlsPanel}>
          <div style={styles.progressSection}>
            <div className="progress-bar" style={styles.progressBar}>
              <div 
                className="progress-fill"
                style={{ ...styles.progressFill, width: `${progress}%` }}
              />
            </div>
            <span style={styles.timeText}>
              {Math.floor(replayTime)}s / {totalTime}s
            </span>
          </div>
          
          <div style={styles.controlButtons}>
            <button 
              className="btn btn-secondary"
              style={styles.controlBtn}
              onClick={handleRestart}
            >
              ⏮️ 重新播放
            </button>
            
            <button 
              className="btn"
              style={styles.playBtn}
              onClick={handlePlayPause}
            >
              {isPlaying ? '⏸️ 暂停' : '▶️ 播放'}
            </button>
            
            <div style={styles.speedControls}>
              <span style={styles.speedLabel}>速度:</span>
              {[0.5, 1, 2, 4].map(speed => (
                <button
                  key={speed}
                  style={{
                    ...styles.speedBtn,
                    ...(playbackSpeed === speed ? styles.speedBtnActive : {}),
                  }}
                  onClick={() => handleSpeedChange(speed)}
                >
                  {speed}x
                </button>
              ))}
            </div>
          </div>
        </div>
        
        <div style={styles.eventLog}>
          <h3 style={styles.eventLogTitle}>📋 调度记录</h3>
          <div style={styles.eventList}>
            {replayData.scheduledPatients.map((event, idx) => {
              const patient = replayData.patients.find(p => p.id === event.patientId)
              const equipment = replayData.equipment.find(e => e.id === event.equipmentId)
              const patientType = patient ? 
                Object.values(PATIENT_TYPES).find(t => t.id === patient.type) : null
              const eqType = equipment ? 
                Object.values(EQUIPMENT_TYPES).find(e => e.id === equipment.type) : null
              
              return (
                <div 
                  key={idx} 
                  style={{
                    ...styles.eventItem,
                    ...(event.result === 'success' ? styles.eventSuccess : styles.eventFail),
                  }}
                >
                  <span style={styles.eventTime}>
                    {Math.floor(event.startTime)}s
                  </span>
                  <span style={styles.eventIcon}>
                    {event.result === 'success' ? '✅' : '❌'}
                  </span>
                  <span style={styles.eventText}>
                    {patient?.name || '未知患者'} → {equipment?.name || '未知器械'}
                  </span>
                  {patient?.insuranceRisk && (
                    <span style={styles.insuranceTag}>医保</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
        
        <div style={styles.analysisPanel}>
          <h3 style={styles.analysisTitle}>💡 复盘分析</h3>
          
          <div style={styles.analysisSection}>
            <h4 style={styles.analysisSubtitle}>成功点</h4>
            <ul style={styles.analysisList}>
              <li>共完成 {replayData.scheduledPatients.filter(s => s.result === 'success').length} 次正确调度</li>
              <li>完成率 {Math.round(replayData.completionRate * 100)}%</li>
            </ul>
          </div>
          
          <div style={styles.analysisSection}>
            <h4 style={styles.analysisSubtitle}>改进点</h4>
            <ul style={styles.analysisList}>
              <li>有 {replayData.scheduledPatients.filter(s => s.result === 'fail').length} 次调度失误</li>
              <li>注意带医保标识的高风险患者</li>
              <li>可提高器械使用效率减少等待</li>
            </ul>
          </div>
          
          <div style={styles.analysisTip}>
            💡 提示：放慢速度仔细观察患者头顶的需求图标
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
    background: 'linear-gradient(135deg, #667eea, #764ba2)',
    borderRadius: '16px',
    fontWeight: 'bold',
    fontSize: '13px',
  },
  backBtn: {
    padding: '8px 16px',
    fontSize: '14px',
  },
  infoPanel: {
    position: 'absolute',
    top: '70px',
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    gap: '16px',
  },
  infoCard: {
    padding: '12px 24px',
    background: 'rgba(26, 26, 46, 0.9)',
    borderRadius: '12px',
    textAlign: 'center',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },
  infoLabel: {
    display: 'block',
    fontSize: '12px',
    color: '#a0aec0',
    marginBottom: '4px',
  },
  infoValue: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#ffd93d',
  },
  controlsPanel: {
    position: 'absolute',
    bottom: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '90%',
    maxWidth: '600px',
    padding: '16px',
    background: 'rgba(26, 26, 46, 0.95)',
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },
  progressSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '16px',
  },
  progressBar: {
    flex: 1,
    height: '10px',
  },
  progressFill: {
    height: '100%',
  },
  timeText: {
    fontSize: '14px',
    color: '#a0aec0',
    minWidth: '100px',
    textAlign: 'right',
  },
  controlButtons: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
  },
  controlBtn: {
    padding: '10px 20px',
    fontSize: '14px',
  },
  playBtn: {
    padding: '12px 32px',
    fontSize: '16px',
  },
  speedControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginLeft: '16px',
  },
  speedLabel: {
    fontSize: '13px',
    color: '#a0aec0',
    marginRight: '4px',
  },
  speedBtn: {
    padding: '6px 12px',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '6px',
    background: 'rgba(255, 255, 255, 0.05)',
    color: '#a0aec0',
    cursor: 'pointer',
    fontSize: '12px',
    transition: 'all 0.2s ease',
  },
  speedBtnActive: {
    background: 'linear-gradient(135deg, #4facfe, #00f2fe)',
    color: '#ffffff',
    borderColor: '#4facfe',
  },
  eventLog: {
    position: 'absolute',
    top: '70px',
    left: '16px',
    width: '280px',
    maxHeight: '60vh',
    background: 'rgba(26, 26, 46, 0.9)',
    borderRadius: '16px',
    padding: '16px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    overflowY: 'auto',
  },
  eventLogTitle: {
    fontSize: '15px',
    margin: '0 0 12px 0',
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
    fontSize: '12px',
  },
  eventSuccess: {
    background: 'rgba(107, 203, 119, 0.1)',
  },
  eventFail: {
    background: 'rgba(255, 107, 107, 0.1)',
  },
  eventTime: {
    color: '#718096',
    minWidth: '35px',
  },
  eventIcon: {
    fontSize: '14px',
  },
  eventText: {
    flex: 1,
    color: '#cbd5e0',
  },
  insuranceTag: {
    padding: '2px 6px',
    background: '#ff6b6b',
    borderRadius: '4px',
    fontSize: '10px',
    color: '#ffffff',
  },
  analysisPanel: {
    position: 'absolute',
    top: '70px',
    right: '16px',
    width: '260px',
    background: 'rgba(26, 26, 46, 0.9)',
    borderRadius: '16px',
    padding: '16px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },
  analysisTitle: {
    fontSize: '15px',
    margin: '0 0 12px 0',
    color: '#4facfe',
  },
  analysisSection: {
    marginBottom: '12px',
  },
  analysisSubtitle: {
    fontSize: '13px',
    margin: '0 0 8px 0',
    color: '#cbd5e0',
  },
  analysisList: {
    margin: 0,
    paddingLeft: '20px',
    fontSize: '12px',
    color: '#a0aec0',
    lineHeight: '1.8',
  },
  analysisTip: {
    padding: '10px 12px',
    background: 'rgba(79, 172, 254, 0.1)',
    borderRadius: '8px',
    fontSize: '12px',
    color: '#4facfe',
    lineHeight: '1.5',
    borderLeft: '3px solid #4facfe',
  },
}
