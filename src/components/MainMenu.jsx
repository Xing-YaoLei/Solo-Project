import React from 'react'
import { useGameStore } from '../store/useGameStore'

export default function MainMenu() {
  const startGame = useGameStore(state => state.startGame)
  const goToStatistics = useGameStore(state => state.goToStatistics)
  
  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <h1 style={styles.title}>🏥 康复中心</h1>
        <h2 style={styles.subtitle}>器械调度训练系统</h2>
        
        <p style={styles.description}>
          作为康复中心的调度员，你需要在有限时间内合理分配康复器械，
          帮助患者完成治疗，同时注意医保拒付风险。
        </p>
        
        <div style={styles.buttonGroup}>
          <button 
            className="btn"
            style={styles.primaryBtn}
            onClick={() => startGame(1)}
          >
            🎮 开始训练 · 第1关
          </button>
          
          <button 
            className="btn btn-secondary"
            style={styles.secondaryBtn}
            onClick={goToStatistics}
          >
            📊 训练统计
          </button>
        </div>
        
        <div style={styles.infoCard}>
          <h3 style={styles.infoTitle}>训练目标</h3>
          <ul style={styles.infoList}>
            <li>📋 评估量表 - 快速判断患者情况</li>
            <li>💊 训练处方 - 制定康复方案</li>
            <li>📅 治疗日历 - 规划时间安排</li>
            <li>🎯 调度游戏 - 分配器械完成治疗</li>
            <li>📈 复盘回放 - 分析失误原因</li>
          </ul>
        </div>
        
        <div style={styles.levelSelect}>
          <h3 style={styles.infoTitle}>快速选关</h3>
          <div style={styles.levelGrid}>
            {[1, 2, 3, 4, 5].map(level => (
              <button
                key={level}
                className="btn btn-secondary"
                style={styles.levelBtn}
                onClick={() => startGame(level)}
              >
                第 {level} 关
              </button>
            ))}
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
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
  },
  content: {
    textAlign: 'center',
    maxWidth: '600px',
    padding: '40px',
  },
  title: {
    fontSize: '48px',
    marginBottom: '8px',
    background: 'linear-gradient(135deg, #4facfe, #00f2fe)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  subtitle: {
    fontSize: '24px',
    color: '#a0aec0',
    marginBottom: '32px',
    fontWeight: '400',
  },
  description: {
    fontSize: '16px',
    color: '#cbd5e0',
    lineHeight: '1.8',
    marginBottom: '32px',
  },
  buttonGroup: {
    display: 'flex',
    gap: '16px',
    justifyContent: 'center',
    marginBottom: '32px',
    flexWrap: 'wrap',
  },
  primaryBtn: {
    fontSize: '18px',
    padding: '16px 32px',
  },
  secondaryBtn: {
    fontSize: '18px',
    padding: '16px 32px',
  },
  infoCard: {
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '16px',
    padding: '24px',
    textAlign: 'left',
    marginBottom: '24px',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
  },
  infoTitle: {
    fontSize: '18px',
    marginBottom: '12px',
    color: '#4facfe',
  },
  infoList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },
  infoListLi: {
    padding: '8px 0',
    color: '#cbd5e0',
    fontSize: '14px',
  },
  levelSelect: {
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '16px',
    padding: '24px',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
  },
  levelGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: '12px',
  },
  levelBtn: {
    padding: '12px',
    fontSize: '14px',
  },
}
