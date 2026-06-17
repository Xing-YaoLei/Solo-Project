import React, { useState } from 'react'
import { useGameStore, EQUIPMENT_TYPES } from '../store/useGameStore'

const PRESCRIPTION_OPTIONS = [
  {
    id: 'strength',
    name: '力量训练方案',
    description: '侧重肌力恢复，适合轻度损伤',
    duration: '30分钟/次',
    frequency: '每周3次',
    equipment: ['dumbbell', 'pulley'],
    color: '#FFA500',
  },
  {
    id: 'cardio',
    name: '心肺功能方案',
    description: '提升心肺耐力，适合康复期患者',
    duration: '45分钟/次',
    frequency: '每周5次',
    equipment: ['treadmill', 'exercise_bike'],
    color: '#4A90D9',
  },
  {
    id: 'mobility',
    name: '关节活动方案',
    description: '改善关节活动度，适合术后恢复',
    duration: '40分钟/次',
    frequency: '每周4次',
    equipment: ['parallel_bars', 'pulley'],
    color: '#9370DB',
  },
  {
    id: 'physical',
    name: '物理治疗方案',
    description: '物理因子治疗，配合运动康复',
    duration: '25分钟/次',
    frequency: '每周6次',
    equipment: ['ultrasound', 'exercise_bike'],
    color: '#00CED1',
  },
]

export default function PrescriptionView() {
  const [selectedPrescription, setSelectedPrescription] = useState(null)
  const [startTime] = useState(Date.now())
  const assessmentScore = useGameStore(state => state.assessmentScore)
  const setPrescription = useGameStore(state => state.setPrescription)
  const goToMenu = useGameStore(state => state.goToMenu)
  
  const severityLevel = assessmentScore <= 8 ? '轻度' : 
                        assessmentScore <= 14 ? '中度' : '重度'
  const severityColor = assessmentScore <= 8 ? '#90EE90' : 
                        assessmentScore <= 14 ? '#FFD700' : '#FF6347'
  
  const handleConfirm = () => {
    if (selectedPrescription) {
      const prescription = PRESCRIPTION_OPTIONS.find(p => p.id === selectedPrescription)
      const timeTaken = Math.floor((Date.now() - startTime) / 1000)
      setPrescription(prescription, timeTaken)
    }
  }
  
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h2 style={styles.title}>💊 训练处方</h2>
          <button 
            className="btn btn-danger"
            style={styles.cancelBtn}
            onClick={goToMenu}
          >
            退出
          </button>
        </div>
        
        <div style={styles.assessmentSummary}>
          <div style={styles.assessmentItem}>
            <span style={styles.label}>评估总分</span>
            <span style={styles.value}>{assessmentScore} 分</span>
          </div>
          <div style={styles.assessmentItem}>
            <span style={styles.label}>严重程度</span>
            <span style={{ ...styles.value, color: severityColor }}>{severityLevel}</span>
          </div>
        </div>
        
        <p style={styles.instruction}>
          请根据评估结果选择合适的训练方案：
        </p>
        
        <div style={styles.optionsGrid}>
          {PRESCRIPTION_OPTIONS.map(option => (
            <div
              key={option.id}
              style={{
                ...styles.optionCard,
                ...(selectedPrescription === option.id ? styles.optionSelected : {}),
                borderColor: selectedPrescription === option.id ? option.color : 'rgba(255,255,255,0.1)',
              }}
              onClick={() => setSelectedPrescription(option.id)}
            >
              <div style={styles.optionHeader}>
                <h3 style={{ ...styles.optionName, color: option.color }}>
                  {option.name}
                </h3>
              </div>
              <p style={styles.optionDesc}>{option.description}</p>
              
              <div style={styles.optionMeta}>
                <div style={styles.metaItem}>
                  <span>⏱️</span>
                  <span>{option.duration}</span>
                </div>
                <div style={styles.metaItem}>
                  <span>📅</span>
                  <span>{option.frequency}</span>
                </div>
              </div>
              
              <div style={styles.equipmentTags}>
                {option.equipment.map(eqId => {
                  const eq = Object.values(EQUIPMENT_TYPES).find(e => e.id === eqId)
                  return (
                    <span 
                      key={eqId} 
                      style={{
                        ...styles.equipmentTag,
                        backgroundColor: eq?.color + '33',
                        borderColor: eq?.color,
                      }}
                    >
                      {eq?.name}
                    </span>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
        
        <div style={styles.footer}>
          <button 
            className="btn"
            style={styles.confirmBtn}
            onClick={handleConfirm}
            disabled={!selectedPrescription}
          >
            确认处方 →
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
    overflowY: 'auto',
  },
  card: {
    background: 'rgba(26, 26, 46, 0.95)',
    borderRadius: '20px',
    padding: '32px',
    width: '100%',
    maxWidth: '700px',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  title: {
    fontSize: '24px',
    color: '#4facfe',
    margin: 0,
  },
  cancelBtn: {
    padding: '8px 16px',
    fontSize: '14px',
  },
  assessmentSummary: {
    display: 'flex',
    gap: '24px',
    marginBottom: '24px',
    padding: '16px',
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '12px',
  },
  assessmentItem: {
    flex: 1,
    textAlign: 'center',
  },
  label: {
    display: 'block',
    fontSize: '14px',
    color: '#a0aec0',
    marginBottom: '4px',
  },
  value: {
    display: 'block',
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#ffffff',
  },
  instruction: {
    fontSize: '16px',
    color: '#cbd5e0',
    marginBottom: '20px',
  },
  optionsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '16px',
    marginBottom: '24px',
  },
  optionCard: {
    padding: '20px',
    borderRadius: '12px',
    background: 'rgba(255, 255, 255, 0.05)',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    border: '2px solid transparent',
  },
  optionSelected: {
    background: 'rgba(79, 172, 254, 0.1)',
    transform: 'scale(1.02)',
  },
  optionHeader: {
    marginBottom: '8px',
  },
  optionName: {
    fontSize: '18px',
    margin: 0,
  },
  optionDesc: {
    fontSize: '14px',
    color: '#a0aec0',
    marginBottom: '12px',
    lineHeight: '1.5',
  },
  optionMeta: {
    display: 'flex',
    gap: '16px',
    marginBottom: '12px',
  },
  metaItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '13px',
    color: '#cbd5e0',
  },
  equipmentTags: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  equipmentTag: {
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '12px',
    color: '#ffffff',
    border: '1px solid',
  },
  footer: {
    textAlign: 'center',
  },
  confirmBtn: {
    padding: '14px 48px',
    fontSize: '18px',
  },
}
