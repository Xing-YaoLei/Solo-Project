import { useGameStore } from '../store/gameStore';

export default function Tutorial() {
  const { showTutorial, tutorialStep, currentLevel, nextTutorialStep, skipTutorial } = useGameStore();

  if (!showTutorial || !currentLevel?.tutorial) return null;

  const currentTutorial = currentLevel.tutorial[tutorialStep];
  const totalSteps = currentLevel.tutorial.length;

  return (
    <div className="tutorial-overlay">
      <div className="tutorial-panel">
        <h2>
          <span className="step-number">{tutorialStep + 1}</span>
          {currentTutorial.title}
        </h2>
        
        <p style={{ color: '#cbd5e1', lineHeight: 1.6, marginBottom: 10 }}>
          {currentTutorial.content}
        </p>

        <ul>
          {currentTutorial.tips.map((tip, index) => (
            <li key={index}>
              <span className="highlight">•</span> {tip}
            </li>
          ))}
        </ul>

        <div className="tutorial-footer">
          <span className="step-indicator">
            {tutorialStep + 1} / {totalSteps}
          </span>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="tutorial-btn skip" onClick={skipTutorial}>
              跳过教程
            </button>
            <button className="tutorial-btn next" onClick={nextTutorialStep}>
              {tutorialStep < totalSteps - 1 ? '下一步' : '开始游戏'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
