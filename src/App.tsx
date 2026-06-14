import { AnimatePresence } from 'framer-motion';
import { useGameStore } from './store/gameStore';
import GameScene from './components/GameScene';
import MainMenu from './components/MainMenu';
import GameView from './components/GameView';
import Leaderboard from './components/Leaderboard';
import StatsPage from './components/StatsPage';
import TutorialOverlay from './components/TutorialOverlay';
import MenuOverlay from './components/MenuOverlay';

function App() {
  const { currentView, showTutorial } = useGameStore();

  const renderView = () => {
    switch (currentView) {
      case 'menu':
        return (
          <>
            <GameScene />
            <MenuOverlay />
          </>
        );
      case 'game':
        return <GameView />;
      case 'leaderboard':
        return <Leaderboard />;
      case 'stats':
        return <StatsPage />;
      default:
        return (
          <>
            <GameScene />
            <MainMenu />
          </>
        );
    }
  };

  return (
    <div className="w-full h-full relative overflow-hidden">
      <AnimatePresence mode="wait">
        {renderView()}
      </AnimatePresence>
      {showTutorial && <TutorialOverlay />}
    </div>
  );
}

export default App;
