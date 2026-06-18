import { useGameStore, useGamePhase } from './store/gameStore';
import { GameMode } from './types';
import { MainMenu } from './components/ui/MainMenu';
import { GameScene } from './components/GameScene';
import { GameUI } from './components/ui/GameUI';
import { SettlementPage } from './components/ui/SettlementPage';
import { ReviewPage } from './components/ui/ReviewPage';

function App() {
  const phase = useGamePhase();
  const startGame = useGameStore(state => state.startGame);
  const resetGame = useGameStore(state => state.resetGame);
  const backToMenu = useGameStore(state => state.backToMenu);

  const handleStartGame = (_levelId: string, _mode: GameMode) => {
    startGame();
  };

  const handleSettlementComplete = () => {
  };

  const handlePlayAgain = () => {
    resetGame();
    startGame();
  };

  const handleBackToMenu = () => {
    backToMenu();
  };

  return (
    <div className="w-full h-screen overflow-hidden">
      {phase === 'menu' && (
        <MainMenu onStartGame={handleStartGame} />
      )}

      {phase === 'playing' && (
        <div className="relative w-full h-full">
          <GameScene />
          <GameUI />
        </div>
      )}

      {phase === 'settlement' && (
        <SettlementPage onComplete={handleSettlementComplete} />
      )}

      {phase === 'review' && (
        <ReviewPage
          onBackToMenu={handleBackToMenu}
          onPlayAgain={handlePlayAgain}
        />
      )}
    </div>
  );
}

export default App;
