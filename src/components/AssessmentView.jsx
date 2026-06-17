import React, { useState, useEffect } from 'react'
import { useGameStore } from '../store/useGameStore'

const ASSESSMENT_QUESTIONS = [
  {
    id: 1,
    question: '患者年龄范围？',
    options: [
      { text: '18-40岁', score: 1 },
      { text: '41-60岁', score: 2 },
      { text: '61-75岁', score: 3 },
      { text: '75岁以上', score: 4 },
    ],
  },
  {
    id: 2,
    question: '主要康复部位？',
    options: [
      { text: '上肢', score: 2 },
      { text: '下肢', score: 3 },
      { text: '核心躯干', score: 2 },
      { text: '全身综合', score: 4 },
    ],
  },
  {
    id: 3,
    question: '疼痛程度（1-10）？',
    options: [
      { text: '1-3 轻度', score: 1 },
      { text: '4-6 中度', score: 2 },
      { text: '7-8 较重', score: 3 },
      { text: '9-10 剧烈', score: 4 },
    ],
  },
  {
    id: 4,
    question: '运动功能受限程度？',
    options: [
      { text: '基本正常', score: 1 },
      { text: '轻度受限', score: 2 },
      { text: '中度受限', score: 3 },
      { text: '严重受限', score: 4 },
    ],
  },
  {
    id: 5,
    question: '既往病史复杂程度？',
    options: [
      { text: '无基础病', score: 1 },
      { text: '单一基础病', score: 2 },
      { text: '多种基础病', score: 3 },
      { text: '复杂并发症', score: 4 },
    ],
  },
]

export default function AssessmentView() {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState({})
  const [startTime] = useState(Date.now())
  const [elapsedTime, setElapsedTime] = useState(0)
  const completeAssessment = useGameStore(state => state.completeAssessment)
  const goToMenu = useGameStore(state => state.goToMenu)
  
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000))
    }, 100)
    return () => clearInterval(timer)
  }, [startTime])
  
  const handleAnswer = (optionIndex) => {
    const newAnswers = {
      ...answers,
      [currentQuestion]: optionIndex,
    }
    setAnswers(newAnswers)
    
    if (currentQuestion < ASSESSMENT_QUESTIONS.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    } else {
      const totalScore = Object.entries(newAnswers).reduce((sum, [qIdx, optIdx]) => {
        return sum + ASSESSMENT_QUESTIONS[qIdx].options[optIdx].score
      }, 0)
      const timeTaken = Math.floor((Date.now() - startTime) / 1000)
      completeAssessment(totalScore, timeTaken, newAnswers)
    }
  }
  
  const handleBack = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)
    }
  }
  
  const question = ASSESSMENT_QUESTIONS[currentQuestion]
  const progress = ((currentQuestion + 1) / ASSESSMENT_QUESTIONS.length) * 100
  
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h2 style={styles.title}>📋 评估量表</h2>
          <div style={styles.timer}>
            ⏱️ {elapsedTime}s
          </div>
        </div>
        
        <div style={styles.progressContainer}>
          <div className="progress-bar" style={styles.progressBar}>
            <div 
              className="progress-fill" 
              style={{ ...styles.progressFill, width: `${progress}%` }}
            />
          </div>
          <span style={styles.progressText}>
            {currentQuestion + 1} / {ASSESSMENT_QUESTIONS.length}
          </span>
        </div>
        
        <div style={styles.questionCard}>
          <h3 style={styles.questionText}>{question.question}</h3>
          
          <div style={styles.optionsContainer}>
            {question.options.map((option, idx) => (
              <button
                key={idx}
                style={{
                  ...styles.optionBtn,
                  ...(answers[currentQuestion] === idx ? styles.optionSelected : {}),
                }}
                onClick={() => handleAnswer(idx)}
                className={answers[currentQuestion] === idx ? 'btn' : 'btn-secondary'}
              >
                {option.text}
              </button>
            ))}
          </div>
        </div>
        
        <div style={styles.footer}>
          <button 
            className="btn btn-secondary"
            style={styles.backBtn}
            onClick={handleBack}
            disabled={currentQuestion === 0}
          >
            ← 上一题
          </button>
          <button 
            className="btn btn-danger"
            style={styles.cancelBtn}
            onClick={goToMenu}
          >
            退出
          </button>
        </div>
        
        <p style={styles.hint}>
          💡 提示：快速准确的判断将影响后续训练难度
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
    maxWidth: '500px',
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
  timer: {
    fontSize: '18px',
    color: '#ffd93d',
    fontWeight: 'bold',
  },
  progressContainer: {
    marginBottom: '24px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  progressBar: {
    flex: 1,
    height: '8px',
  },
  progressFill: {
    height: '100%',
  },
  progressText: {
    fontSize: '14px',
    color: '#a0aec0',
    minWidth: '50px',
    textAlign: 'right',
  },
  questionCard: {
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '24px',
  },
  questionText: {
    fontSize: '20px',
    color: '#ffffff',
    marginBottom: '20px',
    lineHeight: '1.5',
  },
  optionsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  optionBtn: {
    width: '100%',
    padding: '16px',
    fontSize: '16px',
    textAlign: 'left',
  },
  optionSelected: {
    border: '2px solid #4facfe',
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '12px',
    marginBottom: '16px',
  },
  backBtn: {
    flex: 1,
  },
  cancelBtn: {
    padding: '12px 20px',
  },
  hint: {
    fontSize: '13px',
    color: '#718096',
    textAlign: 'center',
    margin: 0,
    fontStyle: 'italic',
  },
}
