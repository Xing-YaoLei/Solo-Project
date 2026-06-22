import { useEffect } from 'react';
import { useGameStore } from './store/gameStore';
import MainMenu from './components/MainMenu';
import LevelSelect from './components/LevelSelect';
import Leaderboard from './components/Leaderboard';
import Statistics from './components/Statistics';
import GameScene from './components/GameScene';
import HUD from './components/HUD';
import Tutorial from './components/Tutorial';
import ResultPanel from './components/ResultPanel';

export default function App() {
  const { currentScreen, isPlaying, isPaused, tickTime, showResult } = useGameStore();

  useEffect(() => {
    if (currentScreen !== 'game' || !isPlaying || isPaused || showResult) return;

    const timer = setInterval(() => {
      tickTime();
    }, 1000);

    return () => clearInterval(timer);
  }, [currentScreen, isPlaying, isPaused, showResult, tickTime]);

  return (
    <div className="app-container">
      {currentScreen === 'game' && (
        <div className="canvas-container">
          <GameScene />
        </div>
      )}

      <MainMenu />
      <LevelSelect />
      <Leaderboard />
      <Statistics />
      
      {currentScreen === 'game' && (
        <>
          <HUD />
          <Tutorial />
          <ResultPanel />
        </>
      )}
    </div>
  );
}
