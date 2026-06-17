import React, { useState } from 'react'
import { useGameStore } from '../store/useGameStore'

const DAYS_OF_WEEK = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
const TIME_SLOTS = ['上午', '下午', '晚间']

export default function CalendarView() {
  const [selectedSlots, setSelectedSlots] = useState({})
  const [startTime] = useState(Date.now())
  const prescription = useGameStore(state => state.prescription)
  const setCalendarPlan = useGameStore(state => state.setCalendarPlan)
  const goToMenu = useGameStore(state => state.goToMenu)
  
  const toggleSlot = (day, slot) => {
    const key = `${day}-${slot}`
    const newSelected = { ...selectedSlots }
    if (newSelected[key]) {
      delete newSelected[key]
    } else {
      newSelected[key] = true
    }
    setSelectedSlots(newSelected)
  }
  
  const totalSlots = Object.keys(selectedSlots).length
  const recommendedMin = 3
  const recommendedMax = 6
  
  const handleConfirm = () => {
    const plan = {
      slots: selectedSlots,
      totalSlots,
      prescription: prescription?.id,
    }
    const timeTaken = Math.floor((Date.now() - startTime) / 1000)
    setCalendarPlan(plan, timeTaken)
  }
  
  const isRecommended = totalSlots >= recommendedMin && totalSlots <= recommendedMax
  
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h2 style={styles.title}>📅 治疗日历</h2>
          <button 
            className="btn btn-danger"
            style={styles.cancelBtn}
            onClick={goToMenu}
          >
            退出
          </button>
        </div>
        
        <div style={styles.prescriptionInfo}>
          <span style={styles.prescriptionLabel}>当前处方：</span>
          <span style={styles.prescriptionName}>{prescription?.name}</span>
        </div>
        
        <p style={styles.instruction}>
          请选择本周的治疗时段（建议 {recommendedMin}-{recommendedMax} 个时段）：
        </p>
        
        <div style={styles.calendarGrid}>
          <div style={styles.emptyCell}></div>
          {TIME_SLOTS.map(slot => (
            <div key={slot} style={styles.timeSlotHeader}>
              {slot}
            </div>
          ))}
          
          {DAYS_OF_WEEK.map(day => (
            <React.Fragment key={day}>
              <div style={styles.dayHeader}>{day}</div>
              {TIME_SLOTS.map(slot => {
                const key = `${day}-${slot}`
                const isSelected = selectedSlots[key]
                return (
                  <button
                    key={key}
                    style={{
                      ...styles.slotButton,
                      ...(isSelected ? styles.slotSelected : {}),
                    }}
                    onClick={() => toggleSlot(day, slot)}
                  >
                    {isSelected ? '✓' : ''}
                  </button>
                )
              })}
            </React.Fragment>
          ))}
        </div>
        
        <div style={styles.summary}>
          <div style={styles.summaryItem}>
            <span style={styles.summaryLabel}>已选时段</span>
            <span style={{
              ...styles.summaryValue,
              color: isRecommended ? '#6bcb77' : '#ff6b6b',
            }}>
              {totalSlots} 个
            </span>
          </div>
          <div style={styles.summaryItem}>
            <span style={styles.summaryLabel}>建议范围</span>
            <span style={styles.summaryValue}>{recommendedMin} - {recommendedMax} 个</span>
          </div>
          {!isRecommended && (
            <p style={styles.warning}>
              ⚠️ 时段数量不在建议范围内，可能影响治疗效果
            </p>
          )}
        </div>
        
        <div style={styles.footer}>
          <button 
            className="btn"
            style={styles.confirmBtn}
            onClick={handleConfirm}
            disabled={totalSlots === 0}
          >
            开始训练 →
          </button>
        </div>
        
        <p style={styles.hint}>
          💡 提示：合理安排治疗时间将影响游戏中的患者流量和难度
        </p>
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
  },
  card: {
    background: 'rgba(26, 26, 46, 0.95)',
    borderRadius: '20px',
    padding: '32px',
    width: '100%',
    maxWidth: '600px',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
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
  prescriptionInfo: {
    marginBottom: '16px',
    padding: '12px 16px',
    background: 'rgba(79, 172, 254, 0.1)',
    borderRadius: '8px',
    borderLeft: '4px solid #4facfe',
  },
  prescriptionLabel: {
    color: '#a0aec0',
    fontSize: '14px',
  },
  prescriptionName: {
    color: '#4facfe',
    fontSize: '16px',
    fontWeight: 'bold',
    marginLeft: '8px',
  },
  instruction: {
    fontSize: '16px',
    color: '#cbd5e0',
    marginBottom: '20px',
  },
  calendarGrid: {
    display: 'grid',
    gridTemplateColumns: '80px repeat(3, 1fr)',
    gap: '8px',
    marginBottom: '24px',
  },
  emptyCell: {
    height: '40px',
  },
  timeSlotHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '40px',
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '8px',
    fontWeight: 'bold',
    color: '#a0aec0',
    fontSize: '14px',
  },
  dayHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '50px',
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '8px',
    color: '#cbd5e0',
    fontSize: '14px',
  },
  slotButton: {
    height: '50px',
    border: '2px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '8px',
    background: 'rgba(255, 255, 255, 0.05)',
    cursor: 'pointer',
    fontSize: '20px',
    color: 'transparent',
    transition: 'all 0.2s ease',
  },
  slotSelected: {
    background: 'linear-gradient(135deg, #4facfe, #00f2fe)',
    borderColor: '#4facfe',
    color: '#ffffff',
  },
  summary: {
    display: 'flex',
    gap: '24px',
    marginBottom: '20px',
    padding: '16px',
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '12px',
    flexWrap: 'wrap',
  },
  summaryItem: {
    flex: 1,
    minWidth: '120px',
  },
  summaryLabel: {
    display: 'block',
    fontSize: '14px',
    color: '#a0aec0',
    marginBottom: '4px',
  },
  summaryValue: {
    fontSize: '24px',
    fontWeight: 'bold',
  },
  warning: {
    width: '100%',
    color: '#ff6b6b',
    fontSize: '13px',
    margin: '8px 0 0 0',
  },
  footer: {
    textAlign: 'center',
    marginBottom: '16px',
  },
  confirmBtn: {
    padding: '14px 48px',
    fontSize: '18px',
  },
  hint: {
    fontSize: '13px',
    color: '#718096',
    textAlign: 'center',
    margin: 0,
    fontStyle: 'italic',
  },
}
