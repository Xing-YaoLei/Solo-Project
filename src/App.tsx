import { useState, useCallback, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { Physics } from '@react-three/rapier'
import { OrbitControls, Stars } from '@react-three/drei'
import GameHUD from '@/components/ui/GameHUD'
import HeatPointCard from '@/components/ui/HeatPointCard'
import RouteSelectPanel from '@/components/ui/RouteSelectPanel'
import SeatAssignPanel from '@/components/ui/SeatAssignPanel'
import FeedbackModal from '@/components/ui/FeedbackModal'
import Leaderboard from '@/components/ui/Leaderboard'
import TutorialOverlay from '@/components/ui/TutorialOverlay'
import ReplayViewer from '@/components/ui/ReplayViewer'
import StartScreen from '@/components/ui/StartScreen'
import Scene3D from '@/components/three/Scene3D'
import { useGameStore } from '@/store/gameStore'
import type { HeatPoint } from '@/types'

export default function App() {
  const phase = useGameStore((s) => s.phase)
  const tutorialCompleted = useGameStore((s) => s.tutorialCompleted)
  const showTutorial = useGameStore((s) => s.showTutorial)
  const setShowTutorial = useGameStore((s) => s.setShowTutorial)
  const startRound = useGameStore((s) => s.startRound)
  const playerName = useGameStore((s) => s.playerName)

  const [activeHeatPoint, setActiveHeatPoint] = useState<HeatPoint | null>(null)
  const [cardPosition, setCardPosition] = useState({ x: 0, y: 0 })

  const handleHeatPointClick = useCallback((heatPoint: HeatPoint, screenPos: { x: number; y: number }) => {
    setActiveHeatPoint(heatPoint)
    setCardPosition(screenPos)
  }, [])

  const handleCloseHeatCard = useCallback(() => {
    setActiveHeatPoint(null)
  }, [])

  const handleStartGame = useCallback(() => {
    startRound()
    if (!tutorialCompleted) {
      setShowTutorial(true)
    }
  }, [startRound, tutorialCompleted, setShowTutorial])

  useEffect(() => {
    const handler = () => handleCloseHeatCard()
    window.addEventListener('click', handler)
    return () => window.removeEventListener('click', handler)
  }, [handleCloseHeatCard])

  return (
    <div className="w-full h-full relative overflow-hidden bg-deep-navy">
      <Canvas
        shadows
        camera={{ position: [0, 14, 18], fov: 45 }}
        gl={{ antialias: true, alpha: false }}
      >
        <color attach="background" args={['#0A1628']} />
        <fog attach="fog" args={['#0A1628', 25, 55]} />

        <ambientLight intensity={0.35} />
        <directionalLight
          position={[10, 20, 10]}
          intensity={1.2}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        <pointLight position={[-8, 6, -8]} intensity={0.6} color="#F5C542" />
        <pointLight position={[8, 4, 8]} intensity={0.4} color="#FF6B35" />

        <Stars radius={80} depth={40} count={1500} factor={3} fade speed={0.3} />

        <Physics gravity={[0, -9.81, 0]}>
          <Scene3D onHeatPointClick={handleHeatPointClick} />
        </Physics>

        <OrbitControls
          enablePan={false}
          minDistance={10}
          maxDistance={35}
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI / 2.2}
          enableDamping
          dampingFactor={0.08}
        />
      </Canvas>

      {phase === 'idle' && !playerName && (
        <StartScreen onStart={handleStartGame} />
      )}

      {phase !== 'idle' && <GameHUD />}

      <RouteSelectPanel />
      <SeatAssignPanel />

      <HeatPointCard
        heatPoint={activeHeatPoint}
        visible={activeHeatPoint !== null}
        x={cardPosition.x}
        y={cardPosition.y}
      />

      <FeedbackModal />
      <Leaderboard />
      <ReplayViewer />

      {showTutorial && (
        <TutorialOverlay onClose={() => setShowTutorial(false)} />
      )}
    </div>
  )
}
