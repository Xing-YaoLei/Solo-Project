import { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import GameScene from '@/components/3d/GameScene';
import GameHUD from '@/components/ui/GameHUD';
import GameOverModal from '@/components/ui/GameOverModal';

export default function GamePage() {
  const [gameKey, setGameKey] = useState(0);

  const handleRestart = () => {
    setGameKey((k) => k + 1);
  };

  return (
    <div className="w-full h-screen bg-gray-950 relative overflow-hidden">
      <Canvas
        key={gameKey}
        shadows
        camera={{ position: [0, 5, 10], fov: 50 }}
        gl={{ antialias: true, alpha: false }}
      >
        <GameScene />
      </Canvas>
      <GameHUD onRestart={handleRestart} />
      <GameOverModal onReplay={handleRestart} />
    </div>
  );
}
