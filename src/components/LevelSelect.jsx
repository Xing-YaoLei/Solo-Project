import { useGameStore } from '../store/gameStore';
import { levels } from '../data/levels';

export default function LevelSelect() {
  const { goToScreen, currentScreen, startLevel, unlockedLevels, levelStars } = useGameStore();

  if (currentScreen !== 'levelSelect') return null;

  const renderStars = (count) => {
    const stars = [];
    for (let i = 0; i < 3; i++) {
      stars.push(
        <span key={i} style={{ color: i < count ? '#fbbf24' : '#475569' }}>
          ★
        </span>
      );
    }
    return stars;
  };

  return (
    <div className="level-select">
      <button className="back-btn" onClick={() => goToScreen('menu')}>
        ← 返回主菜单
      </button>
      
      <h2>选择关卡</h2>
      
      <div className="level-grid">
        {levels.map((level) => {
          const isUnlocked = unlockedLevels.includes(level.id);
          const stars = levelStars[level.id] || 0;
          
          return (
            <div
              key={level.id}
              className={`level-card ${!isUnlocked ? 'locked' : ''}`}
              onClick={() => isUnlocked && startLevel(level.id)}
            >
              <div className="level-num">{level.id}</div>
              <div className="level-name">{level.name}</div>
              <div className="level-difficulty">{level.difficulty}</div>
              <div className="stars">
                {isUnlocked ? renderStars(stars) : '🔒'}
              </div>
            </div>
          );
        })}
      </div>

      <p style={{ color: '#64748b', marginTop: 20 }}>
        完成当前关卡可解锁下一关卡
      </p>
    </div>
  );
}
