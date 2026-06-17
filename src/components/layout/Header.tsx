import React from 'react';
import { Settings, HelpCircle, Home, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useGameStore } from '@/store/useGameStore';
import { formatTime } from '@/data/mockData';
import { useTimer } from '@/hooks/useTimer';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  showBack?: boolean;
  showTimer?: boolean;
  showScore?: boolean;
  title?: string;
}

export const Header: React.FC<HeaderProps> = ({
  showBack = false,
  showTimer = false,
  showScore = false,
  title,
}) => {
  const navigate = useNavigate();
  const { soundEnabled, musicEnabled, setSoundEnabled, setMusicEnabled } = useSettingsStore();
  const { score, currentPhase, phaseStartTime } = useGameStore();
  const { time: elapsedTime } = useTimer({ autoStart: showTimer });

  const handleBack = () => {
    if (currentPhase !== 'menu') {
      navigate('/');
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-30 bg-gray-900/80 backdrop-blur-md border-b border-gray-700/50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {showBack && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              keyboardShortcut="Esc"
            >
              <Home className="w-4 h-4 mr-1" />
              返回
            </Button>
          )}
          {title && (
            <h1 className="text-lg font-bold text-white">{title}</h1>
          )}
        </div>

        <div className="flex items-center gap-6">
          {showTimer && (
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-sm">用时:</span>
              <span className="font-mono text-xl font-bold text-white">
                {formatTime(elapsedTime)}
              </span>
            </div>
          )}

          {showScore && (
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-sm">得分:</span>
              <span className="font-mono text-xl font-bold text-accent-400">
                {Math.round(score)}
              </span>
            </div>
          )}

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSoundEnabled(!soundEnabled)}
            >
              {soundEnabled ? (
                <Volume2 className="w-5 h-5" />
              ) : (
                <VolumeX className="w-5 h-5 text-gray-500" />
              )}
            </Button>
            
            <Button variant="ghost" size="sm">
              <HelpCircle className="w-5 h-5" />
            </Button>
            
            <Button variant="ghost" size="sm">
              <Settings className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
