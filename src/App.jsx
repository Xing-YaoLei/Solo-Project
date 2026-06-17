import React from 'react'
import { useGameStore } from './store/useGameStore'
import MainMenu from './components/MainMenu'
import AssessmentView from './components/AssessmentView'
import PrescriptionView from './components/PrescriptionView'
import CalendarView from './components/CalendarView'
import GameplayView from './components/GameplayView'
import SettlementView from './components/SettlementView'
import StatisticsView from './components/StatisticsView'
import ReplayView from './components/ReplayView'

export default function App() {
  const phase = useGameStore(state => state.phase)

  const renderPhase = () => {
    switch (phase) {
      case 'menu':
        return <MainMenu />
      case 'assessment':
        return <AssessmentView />
      case 'prescription':
        return <PrescriptionView />
      case 'calendar':
        return <CalendarView />
      case 'gameplay':
        return <GameplayView />
      case 'settlement':
        return <SettlementView />
      case 'statistics':
        return <StatisticsView />
      case 'replay':
        return <ReplayView />
      default:
        return <MainMenu />
    }
  }

  return (
    <div className="app-container">
      {renderPhase()}
    </div>
  )
}
