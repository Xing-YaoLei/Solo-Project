import { useGameStore } from '../store/gameStore';
import { levels } from '../data/levels';

export default function Statistics() {
  const { goToScreen, currentScreen, levelStats, totalGames, bestSatisfaction, bestTime } = useGameStore();

  if (currentScreen !== 'statistics') return null;

  const completedLevels = Object.values(levelStats).filter(s => s.completed).length;
  const totalStars = Object.values(levelStats).reduce((acc, s) => acc + (s.stars || 0), 0);

  const chartData = levels.map(level => {
    const stats = levelStats[level.id] || { bestSatisfaction: 0, attempts: 0 };
    return {
      level: level.name,
      satisfaction: stats.bestSatisfaction,
      attempts: stats.attempts,
    };
  });

  const maxSatisfaction = 100;

  return (
    <div className="statistics">
      <button className="back-btn" onClick={() => goToScreen('menu')}>
        ← 返回主菜单
      </button>
      
      <h2>📊 统计数据</h2>

      <div className="stats-overview">
        <div className="stat-card">
          <div className="stat-value">{totalGames}</div>
          <div className="stat-label">总游戏次数</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{completedLevels}/{levels.length}</div>
          <div className="stat-label">已通关关卡</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{totalStars}</div>
          <div className="stat-label">获得星星</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{bestSatisfaction}%</div>
          <div className="stat-label">最高满意度</div>
        </div>
      </div>

      <div className="stats-chart">
        <h3>各关卡最佳满意度</h3>
        <div className="chart-bars">
          {chartData.map((data, index) => (
            <div key={index} className="chart-bar">
              <span className="bar-value">{data.satisfaction}%</span>
              <div 
                className="bar-fill" 
                style={{ height: `${(data.satisfaction / maxSatisfaction) * 100}%` }}
              />
              <span className="bar-label">{data.level}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="stats-chart">
        <h3>各关卡尝试次数</h3>
        <div className="chart-bars">
          {chartData.map((data, index) => (
            <div key={index} className="chart-bar">
              <span className="bar-value">{data.attempts}</span>
              <div 
                className="bar-fill" 
                style={{ 
                  height: `${Math.min((data.attempts / 10) * 100, 100)}%`,
                  background: data.attempts > 5 
                    ? 'linear-gradient(to top, #ef4444, #f87171)' 
                    : 'linear-gradient(to top, #22c55e, #4ade80)'
                }}
              />
              <span className="bar-label">{data.level}</span>
            </div>
          ))}
        </div>
        <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: 15, textAlign: 'center' }}>
          尝试次数越少的关卡，说明你掌握得越好 💪
        </p>
      </div>
    </div>
  );
}
