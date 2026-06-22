import { useGameStore } from '../store/gameStore';

export default function ResultPanel() {
  const { showResult, resultData, currentLevel, retryLevel, nextLevel, goToScreen, unlockedLevels } = useGameStore();

  if (!showResult || !resultData) return null;

  const { success, satisfaction, timeSpent, stars } = resultData;
  const hasNextLevel = currentLevel && unlockedLevels.includes(currentLevel.id + 1);

  const renderStars = () => {
    const starElements = [];
    for (let i = 0; i < 3; i++) {
      starElements.push(
        <span 
          key={i} 
          style={{ 
            fontSize: '2.5rem',
            color: i < stars ? '#fbbf24' : '#475569',
            margin: '0 5px'
          }}
        >
          ★
        </span>
      );
    }
    return starElements;
  };

  const getSatisfactionColor = () => {
    if (satisfaction >= 80) return '#22c55e';
    if (satisfaction >= 60) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div className="result-overlay">
      <div className="result-panel">
        <h2 className={success ? 'success' : 'failure'}>
          {success ? '🎉 关卡完成！' : '😅 时间到！'}
        </h2>

        <div style={{ margin: '20px 0' }}>
          {renderStars()}
        </div>

        <div className="result-stats">
          <div className="result-stat">
            <div className="label">客户满意度</div>
            <div className="value" style={{ color: getSatisfactionColor() }}>
              {satisfaction}%
            </div>
          </div>
          <div className="result-stat">
            <div className="label">用时</div>
            <div className="value">{timeSpent}秒</div>
          </div>
        </div>

        {success && satisfaction >= currentLevel.targetSatisfaction && (
          <p style={{ color: '#22c55e', marginBottom: 20 }}>
            ✅ 达成目标满意度 {currentLevel.targetSatisfaction}%
          </p>
        )}

        {success && satisfaction < currentLevel.targetSatisfaction && (
          <p style={{ color: '#f59e0b', marginBottom: 20 }}>
            ⚠️ 未达到目标满意度 {currentLevel.targetSatisfaction}%，再试试？
          </p>
        )}

        {!success && (
          <p style={{ color: '#94a3b8', marginBottom: 20 }}>
            别灰心，再试一次吧！
          </p>
        )}

        <div className="result-actions">
          <button className="action-btn back" onClick={() => goToScreen('levelSelect')}>
            返回选关
          </button>
          <button className="action-btn reset" onClick={retryLevel}>
            再试一次
          </button>
          {success && hasNextLevel && (
            <button className="action-btn confirm" onClick={nextLevel}>
              下一关
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
