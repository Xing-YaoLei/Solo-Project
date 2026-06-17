import { useEffect } from 'react'
import { useGameStore } from './store/gameStore'
import { Game3DScene } from './components/Game3DScene'
import { GameHUD } from './components/GameHUD'
import { MenuScreen } from './components/MenuScreen'
import { PauseScreen } from './components/PauseScreen'
import { ReviewScreen } from './components/ReviewScreen'
import { ReplayScreen } from './components/ReplayScreen'
import { SettingsScreen } from './components/SettingsScreen'

export default function App() {
  const { gameState, pauseGame, resumeGame } = useGameStore()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (gameState === 'playing') {
          pauseGame()
        } else if (gameState === 'paused') {
          resumeGame()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [gameState, pauseGame, resumeGame])

  return (
    <div className="w-full h-full relative overflow-hidden">
      {(gameState === 'playing' || gameState === 'paused') && (
        <>
          <Game3DScene />
          <GameHUD />
        </>
      )}

      {gameState === 'menu' && <MenuScreen />}
      
      {gameState === 'paused' && <PauseScreen />}
      
      {gameState === 'review' && <ReviewScreen />}
      
      {gameState === 'replay' && <ReplayScreen />}
      
      {gameState === 'settings' && <SettingsScreen />}
    </div>
  )
}
