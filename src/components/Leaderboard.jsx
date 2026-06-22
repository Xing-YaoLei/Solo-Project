import { useGameStore } from '../store/gameStore';

export default function Leaderboard() {
  const { goToScreen, currentScreen, leaderboardTab, setLeaderboardTab, getLeaderboard } = useGameStore();

  if (currentScreen !== 'leaderboard') return null;

  const { list, playerEntry, playerRank } = getLeaderboard();

  const getRankClass = (rank) => {
    if (rank === 1) return 'gold';
    if (rank === 2) return 'silver';
    if (rank === 3) return 'bronze';
    return '';
  };

  return (
    <div className="leaderboard">
      <button className="back-btn" onClick={() => goToScreen('menu')}>
        ← 返回主菜单
      </button>
      
      <h2>🏆 排行榜</h2>

      <div className="leaderboard-tabs">
        <button
          className={`tab-btn ${leaderboardTab === 'satisfaction' ? 'active' : ''}`}
          onClick={() => setLeaderboardTab('satisfaction')}
        >
          😊 客户满意度
        </button>
        <button
          className={`tab-btn ${leaderboardTab === 'time' ? 'active' : ''}`}
          onClick={() => setLeaderboardTab('time')}
        >
          ⏱️ 完成时间
        </button>
      </div>

      <div className="leaderboard-table">
        <div className="leaderboard-row header">
          <div className="rank">排名</div>
          <div className="player-name">玩家</div>
          <div className="player-score">
            {leaderboardTab === 'satisfaction' ? '满意度' : '用时(秒)'}
          </div>
        </div>

        {list.map((entry) => (
          <div key={entry.rank} className="leaderboard-row">
            <div className={`rank ${getRankClass(entry.rank)}`}>
              {entry.rank <= 3 ? ['🥇', '🥈', '🥉'][entry.rank - 1] : entry.rank}
            </div>
            <div className="player-name">{entry.name}</div>
            <div className="player-score">
              {leaderboardTab === 'satisfaction' ? `${entry.score}%` : entry.score}
            </div>
          </div>
        ))}

        {playerRank > 10 && (
          <div className="leaderboard-row" style={{ background: 'rgba(59, 130, 246, 0.1)' }}>
            <div className="rank">{playerRank}</div>
            <div className="player-name" style={{ color: '#3b82f6' }}>
              {playerEntry.name} (你)
            </div>
            <div className="player-score" style={{ color: '#3b82f6' }}>
              {typeof playerEntry.score === 'number' 
                ? (leaderboardTab === 'satisfaction' ? `${playerEntry.score}%` : playerEntry.score)
                : playerEntry.score}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
