import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Pause, Play, Home } from 'lucide-react';
import Matter from 'matter-js';
import type { Level, GameState, DisplayCardData, ShelfCell, Medicine, PlacementResult, GameResult } from '@/types/game';
import { getMedicineById } from '@/data/medicines';
import { ShelfGrid } from '@/game/ShelfGrid';
import { DisplayCard } from '@/game/DisplayCard';
import { PromotionRuleEngine } from '@/game/PromotionRuleEngine';
import { ScoreCalculator } from '@/game/ScoreCalculator';
import { useGameStateStore } from '@/store/useGameStateStore';
import { usePlayerStore } from '@/store/usePlayerStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { audioUtils } from '@/utils/audio';
import { vibrationUtils } from '@/utils/vibration';
import { animationUtils } from '@/utils/animation';
import { GAME_CONFIG } from '@/game/GameConfig';

interface GameSceneProps {
  level: Level;
  onGameEnd: (result: GameResult) => void;
  onExit: () => void;
}

export const GameScene: React.FC<GameSceneProps> = ({ level, onGameEnd, onExit }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { animationEnabled } = useSettingsStore();
  const { initGameState, updateGameState, gameState, setLastResult } = useGameStateStore();
  const { addGameResult } = usePlayerStore();
  
  const shelfGridRef = useRef<ShelfGrid | null>(null);
  const ruleEngineRef = useRef<PromotionRuleEngine | null>(null);
  const cardsRef = useRef<DisplayCard[]>([]);
  const engineRef = useRef<Matter.Engine | null>(null);
  const runnerRef = useRef<Matter.Runner | null>(null);
  const timerRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  
  const [selectedCardIndex, setSelectedCardIndex] = useState<number>(-1);
  const [keyboardFocusCell, setKeyboardFocusCell] = useState<{ row: number; col: number } | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; isSuccess: boolean } | null>(null);
  const [floatingScores, setFloatingScores] = useState<{ id: number; x: number; y: number; score: number; isPositive: boolean }[]>([]);
  
  const cardsRefs = useRef<(HTMLDivElement | null)[]>([]);
  const cellsRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const scoreIdCounter = useRef(0);

  useEffect(() => {
    initGameState(level);
    shelfGridRef.current = new ShelfGrid(level, GAME_CONFIG.SHELF_START_X, GAME_CONFIG.SHELF_START_Y, GAME_CONFIG.CELL_WIDTH, GAME_CONFIG.CELL_HEIGHT);
    ruleEngineRef.current = new PromotionRuleEngine(level.promotionRules);
    initializeCards();
    initializePhysics();
    startGameTimer();
    
    return () => {
      cleanup();
    };
  }, [level]);

  const initializeCards = () => {
    const cards: DisplayCard[] = [];
    const startX = GAME_CONFIG.CARD_AREA_X;
    const startY = GAME_CONFIG.CARD_AREA_Y;
    const cardWidth = GAME_CONFIG.CARD_WIDTH;
    const cardHeight = GAME_CONFIG.CARD_HEIGHT;
    const gap = GAME_CONFIG.CARD_GAP;
    const cardsPerRow = 3;
    
    level.medicines.forEach((medId, index) => {
      const medicine = getMedicineById(medId);
      if (!medicine) return;
      const col = index % cardsPerRow;
      const row = Math.floor(index / cardsPerRow);
      const x = startX + col * (cardWidth + gap);
      const y = startY + row * (cardHeight + gap);
      const card = new DisplayCard(`card-${index}`, medicine, x, y, cardWidth, cardHeight);
      cards.push(card);
    });
    cardsRef.current = cards;
  };

  const initializePhysics = () => {
    const engine = Matter.Engine.create();
    engine.gravity.y = 0;
    engineRef.current = engine;
    const runner = Matter.Runner.create();
    runnerRef.current = runner;
    Matter.Runner.run(runner, engine);
    if (shelfGridRef.current) {
      const cells = shelfGridRef.current.getFlatCells();
      cells.forEach(cell => {
        const sensor = Matter.Bodies.rectangle(
          cell.x + cell.width / 2,
          cell.y + cell.height / 2,
          cell.width,
          cell.height,
          { isStatic: true, isSensor: true, label: `sensor-${cell.row}-${cell.col}` }
        );
        Matter.World.add(engine.world, sensor);
      });
    }
  };

  const startGameTimer = () => {
    lastTimeRef.current = Date.now();
    timerRef.current = window.setInterval(() => {
      if (isPaused) return;
      const { gameState } = useGameStateStore.getState();
      if (!gameState || gameState.isGameOver) return;
      const newTimeRemaining = gameState.timeRemaining - 1;
      if (newTimeRemaining <= 10 && newTimeRemaining > 0) {
        audioUtils.playCountdown();
      }
      if (newTimeRemaining <= 0) {
        endGame();
      } else {
        updateGameState({ timeRemaining: newTimeRemaining });
      }
    }, 1000);
  };

  const cleanup = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (runnerRef.current && engineRef.current) {
      Matter.Runner.stop(runnerRef.current);
      Matter.Engine.clear(engineRef.current);
    }
  };

  const showFeedback = (text: string, isSuccess: boolean) => {
    setFeedbackMessage({ text, isSuccess });
    setTimeout(() => setFeedbackMessage(null), 1500);
  };

  const addFloatingScore = (x: number, y: number, score: number, isPositive: boolean) => {
    if (!animationEnabled) return;
    const id = scoreIdCounter.current++;
    setFloatingScores(prev => [...prev, { id, x, y, score, isPositive }]);
    setTimeout(() => {
      setFloatingScores(prev => prev.filter(s => s.id !== id));
    }, 800);
  };

  const checkPlacement = useCallback((card: DisplayCard, cell: ShelfCell): PlacementResult => {
    if (!ruleEngineRef.current || !shelfGridRef.current) {
      return { isCorrect: false, points: 0, message: '' };
    }
    const result = ruleEngineRef.current.checkPlacement(
      card.getMedicine(),
      cell,
      shelfGridRef.current.getCells()
    );
    return result;
  }, []);

  const handlePlacement = useCallback((card: DisplayCard, cell: ShelfCell) => {
    if (!shelfGridRef.current || !gameState) return;
    const result = checkPlacement(card, cell);
    const now = Date.now();
    const placementTime = now - gameState.lastPlacementTime;
    const newCombo = result.isCorrect ? gameState.combo + 1 : 0;
    const newMaxCombo = Math.max(gameState.maxCombo, newCombo);
    const newScore = Math.max(0, gameState.score + result.points);
    const newErrors = result.isCorrect ? gameState.errors : gameState.errors + 1;
    const newTotalPlacements = gameState.totalPlacements + 1;
    const newCorrectPlacements = result.isCorrect ? gameState.correctPlacements + 1 : gameState.correctPlacements;
    const newPlacementTimes = [...gameState.placementTimes, placementTime];
    shelfGridRef.current.setOccupied(cell.row, cell.col, card.getId());
    card.setPlaced(true, { row: cell.row, col: cell.col });
    const targetX = cell.x + (cell.width - card.getWidth()) / 2;
    const targetY = cell.y + (cell.height - card.getHeight()) / 2;
    card.setPosition(targetX, targetY);
    if (result.isCorrect) {
      audioUtils.playSuccess();
      vibrationUtils.success();
      if (newCombo > 1) {
        audioUtils.playCombo(newCombo);
        vibrationUtils.combo(newCombo);
      }
      showFeedback(result.message, true);
    } else {
      audioUtils.playError();
      vibrationUtils.error();
      showFeedback(result.message, false);
      shelfGridRef.current.setCellCorrect(cell.row, cell.col, false);
      setTimeout(() => {
        if (shelfGridRef.current) {
          shelfGridRef.current.setCellCorrect(cell.row, cell.col, true);
        }
      }, 500);
    }
    addFloatingScore(cell.x + cell.width / 2, cell.y, result.points, result.isCorrect);
    updateGameState({
      score: newScore,
      combo: newCombo,
      maxCombo: newMaxCombo,
      errors: newErrors,
      totalPlacements: newTotalPlacements,
      correctPlacements: newCorrectPlacements,
      placementTimes: newPlacementTimes,
      lastPlacementTime: now,
    });
    setTimeout(() => {
      checkGameComplete();
    }, 300);
  }, [gameState, checkPlacement]);

  const checkGameComplete = useCallback(() => {
    if (!shelfGridRef.current || !gameState) return;
    const allPlaced = cardsRef.current.every(card => card.isPlaced());
    if (allPlaced) {
      endGame();
    }
  }, [gameState]);

  const endGame = useCallback(() => {
    if (!gameState || !shelfGridRef.current || !ruleEngineRef.current) return;
    cleanup();
    const placements = cardsRef.current
      .filter(card => card.isPlaced() && card.getPlacedCell())
      .map(card => {
        const cell = card.getPlacedCell()!;
        const shelfCell = shelfGridRef.current!.getCell(cell.row, cell.col)!;
        return {
          cardId: card.getId(),
          medicine: card.getMedicine(),
          cell: shelfCell,
        };
      });
    const result = ScoreCalculator.calculateFinalScore(
      gameState,
      level,
      ruleEngineRef.current,
      placements
    );
    audioUtils.playGameOver(result.isWin);
    vibrationUtils.gameOver(result.isWin);
    addGameResult(result);
    setLastResult(result);
    onGameEnd(result);
  }, [gameState, level, onGameEnd, addGameResult, setLastResult]);

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent, cardIndex: number) => {
    if (isPaused) return;
    const card = cardsRef.current[cardIndex];
    if (!card || card.isPlaced()) return;
    e.preventDefault();
    card.setDragging(true);
    setSelectedCardIndex(cardIndex);
    const startX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const startY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const offsetX = startX - rect.left - card.getX();
    const offsetY = startY - rect.top - card.getY();
    const handleMove = (moveEvent: MouseEvent | TouchEvent) => {
      if (!card.isDragging()) return;
      const clientX = 'touches' in moveEvent ? moveEvent.touches[0].clientX : moveEvent.clientX;
      const clientY = 'touches' in moveEvent ? moveEvent.touches[0].clientY : moveEvent.clientY;
      const newX = clientX - rect.left - offsetX;
      const newY = clientY - rect.top - offsetY;
      card.setPosition(newX, newY);
      if (shelfGridRef.current) {
        const nearest = shelfGridRef.current.getNearestCell(
          card.getCenterX(),
          card.getCenterY()
        );
        shelfGridRef.current.highlightAllCells(false);
        if (nearest) {
          shelfGridRef.current.highlightCell(nearest.row, nearest.col, true);
        }
      }
      forceUpdate({});
    };
    const handleEnd = () => {
      card.setDragging(false);
      if (shelfGridRef.current) {
        const nearest = shelfGridRef.current.getNearestCell(
          card.getCenterX(),
          card.getCenterY()
        );
        shelfGridRef.current.highlightAllCells(false);
        if (nearest && !nearest.occupiedBy) {
          handlePlacement(card, nearest);
        } else {
          card.resetPosition();
        }
      }
      setSelectedCardIndex(-1);
      forceUpdate({});
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('touchend', handleEnd);
    };
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchmove', handleMove, { passive: false });
    document.addEventListener('touchend', handleEnd);
  };

  const [, forceUpdate] = useState({});

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isPaused && e.key !== 'Escape' && e.key !== ' ') return;
      if (e.key === 'Escape') {
        setIsPaused(p => !p);
        return;
      }
      if (e.key === ' ' && isPaused) {
        setIsPaused(false);
        return;
      }
      const placedCards = cardsRef.current.filter(c => !c.isPlaced());
      if (placedCards.length === 0) return;
      if (e.key === 'Tab') {
        e.preventDefault();
        const currentPlacedIndex = selectedCardIndex >= 0
          ? placedCards.findIndex(c => cardsRef.current[selectedCardIndex]?.getId() === c.getId())
          : -1;
        let nextIndex;
        if (e.shiftKey) {
          nextIndex = currentPlacedIndex <= 0 ? placedCards.length - 1 : currentPlacedIndex - 1;
        } else {
          nextIndex = currentPlacedIndex >= placedCards.length - 1 ? 0 : currentPlacedIndex + 1;
        }
        const nextCard = placedCards[nextIndex];
        const actualIndex = cardsRef.current.findIndex(c => c.getId() === nextCard.getId());
        setSelectedCardIndex(actualIndex);
        cardsRef.current.forEach(c => c.setSelected(false));
        nextCard.setSelected(true);
        if (!keyboardFocusCell && shelfGridRef.current) {
          setKeyboardFocusCell({ row: 0, col: 0 });
        }
        forceUpdate({});
        return;
      }
      if (selectedCardIndex < 0 || !keyboardFocusCell || !shelfGridRef.current) return;
      const card = cardsRef.current[selectedCardIndex];
      if (!card || card.isPlaced()) return;
      let { row, col } = keyboardFocusCell;
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          row = Math.max(0, row - 1);
          break;
        case 'ArrowDown':
          e.preventDefault();
          row = Math.min(shelfGridRef.current.getRows() - 1, row + 1);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          col = Math.max(0, col - 1);
          break;
        case 'ArrowRight':
          e.preventDefault();
          col = Math.min(shelfGridRef.current.getCols() - 1, col + 1);
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          const targetCell = shelfGridRef.current.getCell(row, col);
          if (targetCell && !targetCell.occupiedBy) {
            handlePlacement(card, targetCell);
            setSelectedCardIndex(-1);
            setKeyboardFocusCell(null);
            card.setSelected(false);
          }
          return;
      }
      setKeyboardFocusCell({ row, col });
      const targetCell = shelfGridRef.current.getCell(row, col);
      if (targetCell) {
        card.setPosition(
          targetCell.x + (targetCell.width - card.getWidth()) / 2,
          targetCell.y + (targetCell.height - card.getHeight()) / 2
        );
        forceUpdate({});
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCardIndex, keyboardFocusCell, isPaused, handlePlacement]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isTimeWarning = gameState && gameState.timeRemaining <= 10;

  return (
    <div ref={containerRef} className="w-full h-full relative overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100">
      <div className="absolute top-0 left-0 right-0 h-16 bg-white/90 backdrop-blur-sm shadow-md px-6 flex items-center justify-between z-20">
        <div className="flex items-center gap-6">
          <button
            onClick={() => { audioUtils.playClick(); vibrationUtils.click(); onExit(); }}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <Home size={20} />
            <span className="hidden sm:inline">返回</span>
          </button>
          <div className="text-xl font-bold text-gray-800">
            {level.name}
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className={`text-3xl font-bold font-mono ${isTimeWarning ? 'timer-warning' : 'text-pharmacy-600'}`}>
            {gameState ? formatTime(gameState.timeRemaining) : '0:00'}
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-pharmacy-600">{gameState?.score || 0}</div>
            <div className="text-xs text-gray-500">得分</div>
          </div>
          {gameState && gameState.combo > 1 && (
            <div className="combo-badge combo-badge-active">
              🔥 {gameState.combo} 连击
            </div>
          )}
          <button
            onClick={() => {
              audioUtils.playClick();
              vibrationUtils.click();
              setIsPaused(p => !p);
            }}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            {isPaused ? <Play size={24} /> : <Pause size={24} />}
          </button>
        </div>
      </div>
      <div className="absolute top-16 left-0 right-0 h-12 bg-promo-50 border-b border-promo-200 px-6 flex items-center gap-4 overflow-x-auto z-10">
        {ruleEngineRef.current?.getRules().map((rule, index) => (
          <div
            key={rule.id}
            className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full shadow-sm whitespace-nowrap animate-slide-in-left"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <span className="text-xl">{rule.icon}</span>
            <span className="text-sm font-medium text-gray-700">{rule.description}</span>
            <span className="text-xs font-bold text-promo-600">+{rule.points}</span>
          </div>
        ))}
      </div>
      {shelfGridRef.current && (
        <>
          {shelfGridRef.current.getCells().map((row, rowIndex) => (
            row.map((cell, colIndex) => {
              const isHighlighted = cell.isHighlighted;
              const isFocused = keyboardFocusCell?.row === rowIndex && keyboardFocusCell?.col === colIndex;
              const isCorrect = cell.isCorrect;
              const isError = cell.isError;
              let cellClass = 'shelf-cell';
              if (isError) cellClass += ' shelf-cell-error animate-shake';
              else if (isCorrect) cellClass += ' shelf-cell-correct';
              else if (isHighlighted || isFocused) cellClass += ' shelf-cell-highlight';
              return (
                <div
                  key={`cell-${rowIndex}-${colIndex}`}
                  ref={el => { if (el) cellsRefs.current.set(`${rowIndex}-${colIndex}`, el); }}
                  className={cellClass}
                  style={{
                    position: 'absolute',
                    left: cell.x,
                    top: cell.y,
                    width: cell.width,
                    height: cell.height,
                  }}
                />
              );
            })
          ))}
        </>
      )}
      {cardsRef.current.map((card, index) => {
        const medicine = card.getMedicine();
        const isSelected = card.isSelected() || selectedCardIndex === index;
        const isDragging = card.isDragging();
        return (
          <div
            key={card.getId()}
            ref={el => { cardsRefs.current[index] = el; }}
            className={`display-card ${isDragging ? 'display-card-dragging' : ''} ${isSelected ? 'ring-4 ring-pharmacy-400' : ''}`}
            style={{
              position: 'absolute',
              left: card.getX(),
              top: card.getY(),
              width: card.getWidth(),
              height: card.getHeight(),
              backgroundColor: medicine.color + '20',
              borderColor: medicine.color,
              borderWidth: '2px',
              cursor: card.isPlaced() ? 'default' : 'grab',
              zIndex: isDragging ? 100 : 10,
              transition: isDragging ? 'none' : 'left 0.2s ease-out, top 0.2s ease-out',
              opacity: card.isPlaced() ? 0.9 : 1,
            }}
            onMouseDown={!card.isPlaced() ? (e) => handleDragStart(e, index) : undefined}
            onTouchStart={!card.isPlaced() ? (e) => handleDragStart(e, index) : undefined}
          >
            <div className="w-full h-full flex flex-col items-center justify-center p-2">
              <div className="text-3xl mb-1">{medicine.icon}</div>
              <div className="text-xs font-medium text-gray-700 text-center leading-tight">
                {medicine.name.length > 6 ? medicine.name.slice(0, 6) + '...' : medicine.name}
              </div>
              <div className="text-[10px] text-gray-500">{medicine.category}</div>
            </div>
          </div>
        );
      })}
      {floatingScores.map(fs => (
        <div
          key={fs.id}
          className={`absolute font-bold text-xl pointer-events-none animate-float-up ${fs.isPositive ? 'text-health-500' : 'text-alert-500'}`}
          style={{ left: fs.x, top: fs.y, transform: 'translate(-50%, -50%)' }}
        >
          {fs.isPositive ? `+${fs.score}` : fs.score}
        </div>
      ))}
      {feedbackMessage && (
        <div
          className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 px-8 py-4 rounded-xl text-xl font-bold animate-score-pop z-50 ${
            feedbackMessage.isSuccess
              ? 'bg-health-500 text-white'
              : 'bg-alert-500 text-white'
          }`}
        >
          {feedbackMessage.text}
        </div>
      )}
      {isPaused && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-30">
          <div className="card text-center animate-fade-in">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">游戏暂停</h2>
            <p className="text-gray-600 mb-6">按空格键或点击继续按钮恢复游戏</p>
            <div className="flex gap-4 justify-center">
              <button onClick={() => setIsPaused(false)} className="btn-primary">
                继续游戏
              </button>
              <button onClick={onExit} className="btn-secondary">
                返回菜单
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="absolute bottom-4 left-4 text-xs text-gray-500 bg-white/80 px-3 py-2 rounded-lg">
        <div>🖱️ 拖拽卡片到货架 | ⌨️ Tab选择卡片，方向键移动，Enter确认</div>
      </div>
    </div>
  );
};
