import React, { useState } from 'react'
import { useGameStore, EQUIPMENT_TYPES } from '../store/useGameStore'

export default function SettlementView() {
  const [activeTab, setActiveTab] = useState('summary')
  
  const {
    gameResult,
    score,
    maxCombo,
    currentLevel,
    patients,
    equipment,
    replayData,
    scheduledPatients,
    statistics,
    goToMenu,
    startGame,
    goToReplay,
  } = useGameStore()
  
  const completedCount = patients.filter(p => p.status === 'completed').length
  const totalCount = patients.length
  const completionRate = Math.round((completedCount / totalCount) * 100)
  
  const isWin = gameResult === 'success'
  
  const errorStats = statistics.equipmentErrorReasons
  const totalErrors = Object.values(errorStats).reduce((a, b) => a + b, 0)
  
  const errorDetails = [
    { key: 'misallocation', label: '器械错配', description: '分配了错误的器械类型', color: '#ff6b6b' },
    { key: 'timingConflict', label: '时间冲突', description: '器械占用时重复分配', color: '#ffa502' },
    { key: 'riskMismatch', label: '风险不匹配', description: '高风险器械给轻症患者', color: '#a55eea' },
    { key: 'overcapacity', label: '超负荷', description: '超出器械承载能力', color: '#2ed573' },
  ]
  
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h1 style={{ ...styles.title, color: isWin ? '#6bcb77' : '#ff6b6b' }}>
            {isWin ? '🎉 训练完成！' : '⏱️ 时间结束'}
          </h1>
          <p style={styles.subtitle}>
            第 {currentLevel} 关 · {isWin ? '所有患者已完成治疗' : '部分患者未能完成'}
          </p>
        </div>
        
        <div style={styles.scoreSection}>
          <div style={styles.scoreMain}>
            <span style={styles.scoreLabel}>最终得分</span>
            <span style={styles.scoreValue}>{score}</span>
          </div>
          <div style={styles.scoreStats}>
            <div style={styles.statItem}>
              <span style={styles.statIcon}>🏆</span>
              <span style={styles.statValue}>{maxCombo}</span>
              <span style={styles.statLabel}>最大连击</span>
            </div>
            <div style={styles.statItem}>
              <span style={styles.statIcon}>✅</span>
              <span style={styles.statValue}>{completedCount}/{totalCount}</span>
              <span style={styles.statLabel}>完成数</span>
            </div>
            <div style={styles.statItem}>
              <span style={styles.statIcon}>📊</span>
              <span style={styles.statValue}>{completionRate}%</span>
              <span style={styles.statLabel}>完成率</span>
            </div>
          </div>
        </div>
        
        <div style={styles.tabs}>
          <button
            style={{
              ...styles.tab,
              ...(activeTab === 'summary' ? styles.tabActive : {}),
            }}
            onClick={() => setActiveTab('summary')}
          >
            总览
          </button>
          <button
            style={{
              ...styles.tab,
              ...(activeTab === 'equipment' ? styles.tabActive : {}),
            }}
            onClick={() => setActiveTab('equipment')}
          >
            器械错因
          </button>
          <button
            style={{
              ...styles.tab,
              ...(activeTab === 'patients' ? styles.tabActive : {}),
            }}
            onClick={() => setActiveTab('patients')}
          >
            患者详情
          </button>
        </div>
        
        <div style={styles.tabContent}>
          {activeTab === 'summary' && (
            <div style={styles.summaryContent}>
              <div style={styles.summaryCard}>
                <h3 style={styles.summaryCardTitle}>📈 本局表现</h3>
                <div style={styles.summaryGrid}>
                  <div style={styles.summaryItem}>
                    <span style={styles.summaryItemLabel}>总分</span>
                    <span style={styles.summaryItemValue}>{score}</span>
                  </div>
                  <div style={styles.summaryItem}>
                    <span style={styles.summaryItemLabel}>治疗调度次数</span>
                    <span style={styles.summaryItemValue}>{scheduledPatients.length}</span>
                  </div>
                  <div style={styles.summaryItem}>
                    <span style={styles.summaryItemLabel}>器械使用数</span>
                    <span style={styles.summaryItemValue}>{equipment.length}</span>
                  </div>
                  <div style={styles.summaryItem}>
                    <span style={styles.summaryItemLabel}>失败次数</span>
                    <span style={{ ...styles.summaryItemValue, color: '#ff6b6b' }}>
                      {scheduledPatients.filter(s => s.result === 'fail').length}
                    </span>
                  </div>
                </div>
              </div>
              
              <div style={styles.summaryCard}>
                <h3 style={styles.summaryCardTitle}>🏅 评级</h3>
                <div style={styles.ratingDisplay}>
                  <span style={styles.ratingStar}>
                    {completionRate >= 90 ? '⭐⭐⭐' : completionRate >= 70 ? '⭐⭐' : completionRate >= 50 ? '⭐' : '☆'}
                  </span>
                  <span style={styles.ratingText}>
                    {completionRate >= 90 ? '优秀' : 
                     completionRate >= 70 ? '良好' : 
                     completionRate >= 50 ? '及格' : '需加强'}
                  </span>
                </div>
                <div className="progress-bar" style={styles.ratingProgress}>
                  <div 
                    className="progress-fill" 
                    style={{ 
                      width: `${completionRate}%`,
                      background: completionRate >= 70 ? 'linear-gradient(90deg, #6bcb77, #4dd4ac)' :
                                  completionRate >= 50 ? 'linear-gradient(90deg, #ffa751, #ffe259)' :
                                  'linear-gradient(90deg, #f5576c, #f093fb)'
                    }}
                  />
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'equipment' && (
            <div style={styles.equipmentContent}>
              <h3 style={styles.sectionTitle}>🔧 器械状态错因分析</h3>
              <p style={styles.sectionDesc}>
                本局共出现 {totalErrors} 次器械相关失误
              </p>
              
              <div style={styles.errorList}>
                {errorDetails.map(error => {
                  const count = errorStats[error.key] || 0
                  const percentage = totalErrors > 0 ? (count / totalErrors) * 100 : 0
                  return (
                    <div key={error.key} style={styles.errorItem}>
                      <div style={styles.errorHeader}>
                        <div style={styles.errorLabel}>
                          <span 
                            style={{ 
                              ...styles.errorDot, 
                              backgroundColor: error.color,
                            }} 
                          />
                          {error.label}
                        </div>
                        <span style={styles.errorCount}>{count} 次</span>
                      </div>
                      <p style={styles.errorDesc}>{error.description}</p>
                      <div className="progress-bar" style={styles.errorProgress}>
                        <div 
                          className="progress-fill"
                          style={{
                            width: `${percentage}%`,
                            background: error.color,
                          }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
              
              <div style={styles.equipmentUsage}>
                <h4 style={styles.subSectionTitle}>器械使用情况</h4>
                <div style={styles.equipmentUsageList}>
                  {equipment.map(eq => {
                    const eqType = Object.values(EQUIPMENT_TYPES).find(e => e.id === eq.type)
                    return (
                      <div key={eq.id} style={styles.eqUsageItem}>
                        <span style={{ color: eqType?.color }}>●</span>
                        <span style={styles.eqUsageName}>{eq.name}</span>
                        <span style={styles.eqUsageStatus}>
                          {eq.isOccupied ? '使用中' : '空闲'}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'patients' && (
            <div style={styles.patientsContent}>
              <h3 style={styles.sectionTitle}>👥 患者治疗详情</h3>
              
              <div style={styles.patientList}>
                {patients.map(patient => {
                  const statusMap = {
                    waiting: { label: '等待中', color: '#ffd93d' },
                    treatment: { label: '治疗中', color: '#6bcb77' },
                    completed: { label: '已完成', color: '#4facfe' },
                  }
                  const status = statusMap[patient.status]
                  const reqEq = Object.values(EQUIPMENT_TYPES).find(e => e.id === patient.requiredEquipment)
                  
                  return (
                    <div key={patient.id} style={styles.patientItem}>
                      <div style={styles.patientItemHeader}>
                        <span style={styles.patientItemName}>{patient.name}</span>
                        <span style={{ ...styles.patientItemStatus, color: status.color }}>
                          {status.label}
                        </span>
                      </div>
                      <div style={styles.patientItemDetails}>
                        <span>所需器械: <span style={{ color: reqEq?.color }}>{reqEq?.name}</span></span>
                        <span>等待时间: {Math.floor(patient.waitTime)}s</span>
                      </div>
                      {patient.insuranceRisk && (
                        <span style={styles.insuranceTag}>⚠️ 医保高风险</span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
        
        <div style={styles.actions}>
          <button 
            className="btn"
            style={styles.actionBtn}
            onClick={() => startGame(currentLevel)}
          >
            🔄 再练一次
          </button>
          {isWin && currentLevel < 5 && (
            <button 
              className="btn btn-secondary"
              style={styles.actionBtn}
              onClick={() => startGame(currentLevel + 1)}
            >
              ➡️ 下一关
            </button>
          )}
          {replayData && (
            <button 
              className="btn btn-secondary"
              style={styles.actionBtn}
              onClick={() => goToReplay(replayData)}
            >
              🎬 查看回放
            </button>
          )}
          <button 
            className="btn btn-danger"
            style={styles.actionBtn}
            onClick={goToMenu}
          >
            🏠 返回主菜单
          </button>
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
  },
  header: {
    textAlign: 'center',
    marginBottom: '24px',
  },
  title: {
    fontSize: '32px',
    margin: '0 0 8px 0',
  },
  subtitle: {
    fontSize: '16px',
    color: '#a0aec0',
    margin: 0,
  },
  scoreSection: {
    marginBottom: '24px',
    padding: '24px',
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '16px',
  },
  scoreMain: {
    textAlign: 'center',
    marginBottom: '20px',
  },
  scoreLabel: {
    display: 'block',
    fontSize: '14px',
    color: '#a0aec0',
    marginBottom: '4px',
  },
  scoreValue: {
    fontSize: '48px',
    fontWeight: 'bold',
    background: 'linear-gradient(135deg, #ffd93d, #ff9500)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  scoreStats: {
    display: 'flex',
    justifyContent: 'space-around',
  },
  statItem: {
    textAlign: 'center',
  },
  statIcon: {
    display: 'block',
    fontSize: '24px',
    marginBottom: '4px',
  },
  statValue: {
    display: 'block',
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: '2px',
  },
  statLabel: {
    fontSize: '12px',
    color: '#718096',
  },
  tabs: {
    display: 'flex',
    gap: '8px',
    marginBottom: '20px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    paddingBottom: '12px',
  },
  tab: {
    flex: 1,
    padding: '10px 16px',
    border: 'none',
    borderRadius: '8px',
    background: 'rgba(255, 255, 255, 0.05)',
    color: '#a0aec0',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  tabActive: {
    background: 'linear-gradient(135deg, #4facfe, #00f2fe)',
    color: '#ffffff',
    fontWeight: 'bold',
  },
  tabContent: {
    minHeight: '300px',
    marginBottom: '24px',
  },
  summaryContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  summaryCard: {
    padding: '20px',
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '12px',
  },
  summaryCardTitle: {
    fontSize: '16px',
    margin: '0 0 16px 0',
    color: '#4facfe',
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '16px',
  },
  summaryItem: {
    textAlign: 'left',
  },
  summaryItemLabel: {
    display: 'block',
    fontSize: '13px',
    color: '#718096',
    marginBottom: '4px',
  },
  summaryItemValue: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#ffffff',
  },
  ratingDisplay: {
    textAlign: 'center',
    marginBottom: '16px',
  },
  ratingStar: {
    fontSize: '40px',
    display: 'block',
    marginBottom: '8px',
  },
  ratingText: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#ffd93d',
  },
  ratingProgress: {
    height: '12px',
  },
  equipmentContent: {},
  sectionTitle: {
    fontSize: '18px',
    margin: '0 0 8px 0',
    color: '#ffffff',
  },
  sectionDesc: {
    fontSize: '14px',
    color: '#a0aec0',
    marginBottom: '16px',
  },
  errorList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginBottom: '20px',
  },
  errorItem: {
    padding: '16px',
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '12px',
  },
  errorHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '6px',
  },
  errorLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontWeight: 'bold',
    color: '#ffffff',
    fontSize: '14px',
  },
  errorDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
  },
  errorCount: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#ff6b6b',
  },
  errorDesc: {
    fontSize: '12px',
    color: '#718096',
    margin: '0 0 10px 0',
  },
  errorProgress: {
    height: '6px',
  },
  equipmentUsage: {
    padding: '16px',
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '12px',
  },
  subSectionTitle: {
    fontSize: '14px',
    margin: '0 0 12px 0',
    color: '#4facfe',
  },
  equipmentUsageList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  eqUsageItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    color: '#cbd5e0',
  },
  eqUsageName: {
    flex: 1,
  },
  eqUsageStatus: {
    fontSize: '12px',
    color: '#718096',
  },
  patientsContent: {},
  patientList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    maxHeight: '350px',
    overflowY: 'auto',
  },
  patientItem: {
    padding: '14px',
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '10px',
  },
  patientItemHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '6px',
  },
  patientItemName: {
    fontWeight: 'bold',
    color: '#ffffff',
    fontSize: '14px',
  },
  patientItemStatus: {
    fontSize: '12px',
    fontWeight: 'bold',
  },
  patientItemDetails: {
    display: 'flex',
    gap: '16px',
    fontSize: '12px',
    color: '#a0aec0',
  },
  insuranceTag: {
    display: 'inline-block',
    marginTop: '8px',
    padding: '2px 8px',
    background: 'rgba(255, 107, 107, 0.2)',
    borderRadius: '4px',
    fontSize: '11px',
    color: '#ff6b6b',
  },
  actions: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px',
    justifyContent: 'center',
  },
  actionBtn: {
    flex: 1,
    minWidth: '140px',
    padding: '14px',
    fontSize: '15px',
  },
}
