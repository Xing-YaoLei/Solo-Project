import { useGameStore } from '../store/gameStore';

export default function MainMenu() {
  const { goToScreen, currentScreen } = useGameStore();

  if (currentScreen !== 'menu') return null;

  return (
    <div className="main-menu">
      <h1>⚖️ 开庭日历调度</h1>
      <p className="subtitle">法律服务解谜训练游戏</p>
      
      <div className="menu-buttons">
        <button className="menu-btn primary" onClick={() => goToScreen('levelSelect')}>
          🎮 开始游戏
        </button>
        <button className="menu-btn secondary" onClick={() => goToScreen('leaderboard')}>
          🏆 排行榜
        </button>
        <button className="menu-btn secondary" onClick={() => goToScreen('statistics')}>
          📊 统计数据
        </button>
      </div>

      <div style={{ marginTop: 60, color: '#64748b', fontSize: '0.9rem' }}>
        <p>使用 Three.js + React Three Fiber + Rapier 构建</p>
      </div>
    </div>
  );
}
