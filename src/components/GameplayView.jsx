import React, { useState, useEffect } from 'react'
import { useGameStore, EQUIPMENT_TYPES, PATIENT_TYPES } from '../store/useGameStore'
import GameScene from './GameScene'

export default function GameplayView() {
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [showTutorial, setShowTutorial] = useState(true)
  
  const {
    score,
    combo,
    timeElapsed,
    timeLimit,
    patients,
    equipment,
    currentLevel,
    insuranceWarning,
    isPaused,
    togglePause,
    assignPatientToEquipment,
    clearInsuranceWarning,
    goToMenu,
  } = useGameStore()
  
  const timeRemaining = Math.max(0, timeLimit - timeElapsed)
  const timePercent = (timeRemaining / timeLimit) * 100
  const timeStatus = timePercent > 50 ? '' : timePercent > 25 ? 'warning' : 'danger'
  
  const waitingPatients = patients.filter(p => p.status === 'waiting')
  const completedPatients = patients.filter(p => p.status === 'completed')
  const treatmentPatients = patients.filter(p => p.status === 'treatment')
  
  const handlePatientClick = (patient) => {
    if (patient.status === 'waiting') {
      setSelectedPatient(patient.id === selectedPatient ? null : patient.id)
    }
  }
  
  const handleEquipmentClick = (eq) => {
    if (selectedPatient && !eq.isOccupied) {
      assignPatientToEquipment(selectedPatient, eq.id)
      setSelectedPatient(null)
    }
  }
  
  useEffect(() => {
    if (insuranceWarning) {
      const timer = setTimeout(() => {
        clearInsuranceWarning()
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [insuranceWarning, clearInsuranceWarning])
  
  const selectedPatientData = patients.find(p => p.id === selectedPatient)
  const requiredEqType = Object.values(EQUIPMENT_TYPES).find(
    e => e.id === selectedPatientData?.requiredEquipment
  )
  
  return (
    <div style={styles.container}>
      <div style={styles.canvasContainer}>
        <GameScene />
      </div>
      
      <div className="ui-overlay">
        <div style={styles.topBar}>
          <div style={styles.topBarLeft}>
            <div style={styles.levelBadge}>
              第 {currentLevel} 关
            </div>
            <div style={styles.scoreDisplay}>
              <span style={styles.scoreLabel}>分数</span>
              <span style={styles.scoreValue}>{score}</span>
            </div>
            {combo > 1 && (
              <div style={styles.comboDisplay}>
                🔥 {combo} 连击
              </div>
            )}
          </div>
          
          <div style={styles.timerContainer}>
            <div className={`progress-bar ${timeStatus}`} style={styles.timerBar}>
              <div 
                className={`progress-fill ${timeStatus}`} 
                style={{ ...styles.timerFill, width: `${timePercent}%` }}
              />
            </div>
            <span style={styles.timerText}>
              ⏱️ {Math.ceil(timeRemaining)}s
            </span>
          </div>
          
          <div style={styles.topBarRight}>
            <button 
              className="btn btn-secondary"
              style={styles.pauseBtn}
              onClick={togglePause}
            >
              {isPaused ? '▶️ 继续' : '⏸️ 暂停'}
            </button>
            <button 
              className="btn btn-danger"
              style={styles.menuBtn}
              onClick={goToMenu}
            >
              退出
            </button>
          </div>
        </div>
        
        <div style={styles.leftPanel}>
          <h3 style={styles.panelTitle}>👥 等待队列</h3>
          <div style={styles.patientList}>
            {waitingPatients.map((patient, idx) => {
              const patientType = Object.values(PATIENT_TYPES).find(t => t.id === patient.type)
              const reqEq = Object.values(EQUIPMENT_TYPES).find(e => e.id === patient.requiredEquipment)
              return (
                <div
                  key={patient.id}
                  style={{
                    ...styles.patientCard,
                    ...(selectedPatient === patient.id ? styles.patientSelected : {}),
                    ...(patient.insuranceRisk ? styles.patientHighRisk : {}),
                  }}
                  className={patient.insuranceRisk ? 'insurable-warning' : ''}
                  onClick={() => handlePatientClick(patient)}
                >
                  <div style={styles.patientAvatar}>
                    <span style={{ color: patientType?.color }}>●</span>
                  </div>
                  <div style={styles.patientInfo}>
                    <div style={styles.patientName}>{patient.name}</div>
                    <div style={styles.patientDetail}>
                      需要: <span style={{ color: reqEq?.color }}>{reqEq?.name}</span>
                    </div>
                    <div style={styles.patientWait}>
                      等待: {Math.floor(patient.waitTime)}s
                    </div>
                  </div>
                  {patient.insuranceRisk && (
                    <div style={styles.insuranceBadge}>
                      ⚠️医保
                    </div>
                  )}
                </div>
              )
            })}
            {waitingPatients.length === 0 && (
              <p style={styles.emptyText}>暂无等待患者</p>
            )}
          </div>
        </div>
        
        <div style={styles.rightPanel}>
          <h3 style={styles.panelTitle}>🏋️ 器械状态</h3>
          <div style={styles.equipmentList}>
            {equipment.map(eq => {
              const eqType = Object.values(EQUIPMENT_TYPES).find(e => e.id === eq.type)
              const isHighlighted = selectedPatient && 
                !eq.isOccupied && 
                selectedPatientData?.requiredEquipment === eq.type
              return (
                <div
                  key={eq.id}
                  style={{
                    ...styles.equipmentCard,
                    ...(eq.isOccupied ? styles.equipmentOccupied : {}),
                    ...(isHighlighted ? styles.equipmentHighlight : {}),
                  }}
                  onClick={() => handleEquipmentClick(eq)}
                  className={isHighlighted ? 'warning-flash' : ''}
                >
                  <div 
                    style={{
                      ...styles.equipmentIcon,
                      backgroundColor: eqType?.color + '33',
                    }}
                  >
                    <span style={{ color: eqType?.color }}>🏥</span>
                  </div>
                  <div style={styles.equipmentInfo}>
                    <div style={styles.equipmentName}>{eq.name}</div>
                    <div style={styles.equipmentStatus}>
                      {eq.isOccupied ? (
                        <span style={{ color: '#ff6b6b' }}>
                          使用中 ({Math.ceil(eq.usageTime)}s)
                        </span>
                      ) : (
                        <span style={{ color: '#6bcb77' }}>空闲</span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          
          <div style={styles.statsMini}>
            <div style={styles.statMiniItem}>
              <span style={styles.statMiniLabel}>治疗中</span>
              <span style={styles.statMiniValue}>{treatmentPatients.length}</span>
            </div>
            <div style={styles.statMiniItem}>
              <span style={styles.statMiniLabel}>已完成</span>
              <span style={{ ...styles.statMiniValue, color: '#6bcb77' }}>
                {completedPatients.length}/{patients.length}
              </span>
            </div>
          </div>
        </div>
        
        {insuranceWarning && (
          <div style={styles.insuranceWarningPopup}>
            <div style={styles.insuranceWarningContent}>
              <span style={styles.warningIcon}>⚠️</span>
              <div>
                <h4 style={styles.warningTitle}>医保拒付风险预警！</h4>
                <p style={styles.warningDesc}>
                  该患者存在医保拒付风险，请谨慎处理
                </p>
              </div>
            </div>
          </div>
        )}
        
        {selectedPatientData && (
          <div style={styles.selectionHint}>
            <p>
              已选择 <strong>{selectedPatientData.name}</strong>，
              点击 <span style={{ color: requiredEqType?.color }}>
                {requiredEqType?.name}
              </span> 进行分配
            </p>
          </div>
        )}
        
        {isPaused && (
          <div style={styles.pauseOverlay}>
            <div style={styles.pauseCard}>
              <h2 style={styles.pauseTitle}>⏸️ 游戏暂停</h2>
              <button 
                className="btn"
                style={styles.pauseResumeBtn}
                onClick={togglePause}
              >
                继续游戏
              </button>
              <button 
                className="btn btn-danger"
                style={styles.pauseQuitBtn}
                onClick={goToMenu}
              >
                返回主菜单
              </button>
            </div>
          </div>
        )}
        
        {showTutorial && (
          <div style={styles.tutorialOverlay}>
            <div style={styles.tutorialCard}>
              <h2 style={styles.tutorialTitle}>🎮 操作指南</h2>
              <div style={styles.tutorialContent}>
                <p>1. 点击左侧<span style={{ color: '#ffd93d' }}>等待队列</span>中的患者进行选择</p>
                <p>2. 查看患者需要的<span style={{ color: '#4facfe' }}>器械类型</span></p>
                <p>3. 点击右侧<span style={{ color: '#6bcb77' }}>空闲器械</span>进行分配</p>
                <p>4. ⚠️ 注意带<span style={{ color: '#ff6b6b' }}>医保标识</span>的高风险患者</p>
                <p>5. 正确分配获得分数，连续正确有连击加成</p>
              </div>
              <button 
                className="btn"
                style={styles.tutorialStartBtn}
                onClick={() => setShowTutorial(false)}
              >
                开始游戏
              </button>
            </div>
          </div>
        )}
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
    gap: '20px',
  },
  topBarLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  levelBadge: {
    padding: '8px 16px',
    background: 'linear-gradient(135deg, #667eea, #764ba2)',
    borderRadius: '20px',
    fontWeight: 'bold',
    fontSize: '14px',
    boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
  },
  scoreDisplay: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '8px 20px',
    background: 'rgba(26, 26, 46, 0.8)',
    borderRadius: '12px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },
  scoreLabel: {
    fontSize: '12px',
    color: '#a0aec0',
  },
  scoreValue: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#ffd93d',
  },
  comboDisplay: {
    padding: '8px 16px',
    background: 'linear-gradient(135deg, #ff6b6b, #ffa502)',
    borderRadius: '20px',
    fontWeight: 'bold',
    fontSize: '14px',
    animation: 'pulse 0.5s ease-in-out infinite',
  },
  timerContainer: {
    flex: 1,
    maxWidth: '400px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  timerBar: {
    flex: 1,
    height: '12px',
  },
  timerFill: {
    height: '100%',
  },
  timerText: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#ffffff',
    minWidth: '80px',
    textAlign: 'right',
  },
  topBarRight: {
    display: 'flex',
    gap: '8px',
  },
  pauseBtn: {
    padding: '8px 16px',
    fontSize: '14px',
  },
  menuBtn: {
    padding: '8px 16px',
    fontSize: '14px',
  },
  leftPanel: {
    position: 'absolute',
    top: '80px',
    left: '16px',
    width: '280px',
    maxHeight: 'calc(100vh - 120px)',
    background: 'rgba(26, 26, 46, 0.9)',
    borderRadius: '16px',
    padding: '16px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    overflowY: 'auto',
  },
  panelTitle: {
    fontSize: '16px',
    marginBottom: '12px',
    color: '#4facfe',
  },
  patientList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  patientCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    border: '2px solid transparent',
    position: 'relative',
  },
  patientSelected: {
    background: 'rgba(79, 172, 254, 0.2)',
    borderColor: '#4facfe',
  },
  patientHighRisk: {
    borderColor: 'rgba(255, 100, 100, 0.5)',
  },
  patientAvatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    background: 'rgba(255, 255, 255, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
  },
  patientInfo: {
    flex: 1,
    minWidth: 0,
  },
  patientName: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: '2px',
  },
  patientDetail: {
    fontSize: '12px',
    color: '#a0aec0',
    marginBottom: '2px',
  },
  patientWait: {
    fontSize: '11px',
    color: '#718096',
  },
  insuranceBadge: {
    position: 'absolute',
    top: '4px',
    right: '4px',
    padding: '2px 6px',
    background: '#ff6b6b',
    borderRadius: '4px',
    fontSize: '10px',
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    color: '#718096',
    fontSize: '14px',
    padding: '20px',
  },
  rightPanel: {
    position: 'absolute',
    top: '80px',
    right: '16px',
    width: '260px',
    maxHeight: 'calc(100vh - 120px)',
    background: 'rgba(26, 26, 46, 0.9)',
    borderRadius: '16px',
    padding: '16px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    overflowY: 'auto',
  },
  equipmentList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginBottom: '16px',
  },
  equipmentCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px',
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    border: '2px solid transparent',
  },
  equipmentOccupied: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
  equipmentHighlight: {
    background: 'rgba(107, 203, 119, 0.2)',
    borderColor: '#6bcb77',
    transform: 'scale(1.02)',
  },
  equipmentIcon: {
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
  },
  equipmentInfo: {
    flex: 1,
  },
  equipmentName: {
    fontSize: '13px',
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: '2px',
  },
  equipmentStatus: {
    fontSize: '11px',
  },
  statsMini: {
    display: 'flex',
    gap: '12px',
    paddingTop: '12px',
    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
  },
  statMiniItem: {
    flex: 1,
    textAlign: 'center',
  },
  statMiniLabel: {
    display: 'block',
    fontSize: '11px',
    color: '#a0aec0',
    marginBottom: '2px',
  },
  statMiniValue: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#ffffff',
  },
  insuranceWarningPopup: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    zIndex: 100,
    animation: 'fadeIn 0.3s ease',
  },
  insuranceWarningContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '20px 32px',
    background: 'rgba(255, 107, 107, 0.95)',
    borderRadius: '16px',
    boxShadow: '0 8px 32px rgba(255, 107, 107, 0.5)',
  },
  warningIcon: {
    fontSize: '40px',
  },
  warningTitle: {
    fontSize: '18px',
    margin: '0 0 4px 0',
    color: '#ffffff',
  },
  warningDesc: {
    fontSize: '14px',
    margin: 0,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  selectionHint: {
    position: 'absolute',
    bottom: '24px',
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '12px 24px',
    background: 'rgba(26, 26, 46, 0.9)',
    borderRadius: '20px',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    fontSize: '14px',
    color: '#cbd5e0',
  },
  pauseOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 200,
  },
  pauseCard: {
    background: 'rgba(26, 26, 46, 0.95)',
    borderRadius: '20px',
    padding: '40px',
    textAlign: 'center',
    border: '1px solid rgba(255, 255, 255, 0.2)',
  },
  pauseTitle: {
    fontSize: '28px',
    marginBottom: '24px',
    color: '#ffffff',
  },
  pauseResumeBtn: {
    display: 'block',
    width: '100%',
    marginBottom: '12px',
    padding: '14px 32px',
    fontSize: '16px',
  },
  pauseQuitBtn: {
    display: 'block',
    width: '100%',
    padding: '14px 32px',
    fontSize: '16px',
  },
  tutorialOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 300,
  },
  tutorialCard: {
    background: 'rgba(26, 26, 46, 0.95)',
    borderRadius: '20px',
    padding: '32px',
    maxWidth: '450px',
    border: '1px solid rgba(255, 255, 255, 0.2)',
  },
  tutorialTitle: {
    fontSize: '24px',
    marginBottom: '20px',
    color: '#4facfe',
    textAlign: 'center',
  },
  tutorialContent: {
    marginBottom: '24px',
  },
  tutorialContentP: {
    fontSize: '15px',
    color: '#cbd5e0',
    lineHeight: '2',
    marginBottom: '8px',
  },
  tutorialStartBtn: {
    width: '100%',
    padding: '14px',
    fontSize: '16px',
  },
}
