import { useGameStore } from '../store/gameStore';

export default function HUD() {
  const { 
    currentLevel, 
    timeRemaining, 
    satisfaction, 
    assignments,
    isPlaying,
    resetLevel,
    goToScreen,
    selectedCase,
    currentScreen,
  } = useGameStore();

  if (currentScreen !== 'game') return null;

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeStatus = () => {
    if (timeRemaining <= 10) return 'danger';
    if (timeRemaining <= 30) return 'warning';
    return 'good';
  };

  const getSatisfactionStatus = () => {
    if (satisfaction >= 80) return 'good';
    if (satisfaction >= 60) return 'warning';
    return 'danger';
  };

  const assignedCount = Object.keys(assignments).length;
  const totalCases = currentLevel?.cases.length || 0;

  return (
    <div className="ui-overlay">
      <div className="hud">
        <div className="hud-left">
          <div className="hud-card">
            <div className="label">剩余时间</div>
            <div className={`value ${getTimeStatus()}`}>{formatTime(timeRemaining)}</div>
          </div>
          <div className="hud-card">
            <div className="label">客户满意度</div>
            <div className={`value ${getSatisfactionStatus()}`}>{satisfaction}%</div>
            <div className="capacity-bar">
              <div className="capacity-track">
                <div 
                  className={`capacity-fill ${getSatisfactionStatus()}`} 
                  style={{ width: `${satisfaction}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="hud-card level-info">
          <h2>{currentLevel?.name}</h2>
          <p>案件进度：{assignedCount} / {totalCases}</p>
          {selectedCase && <p style={{ color: '#3b82f6', marginTop: 8 }}>已选中案件，点击时段排期</p>}
        </div>

        <div className="hud-right">
          <div className="hud-card">
            <div className="label">难度</div>
            <div className="value" style={{ fontSize: '1rem' }}>{currentLevel?.difficulty}</div>
          </div>
          <div className="hud-card">
            <div className="label">目标满意度</div>
            <div className="value" style={{ fontSize: '1rem' }}>{currentLevel?.targetSatisfaction}%</div>
          </div>
        </div>
      </div>

      <div className="bottom-bar">
        <button className="action-btn back" onClick={() => goToScreen('levelSelect')}>
          返回选关
        </button>
        <button className="action-btn reset" onClick={resetLevel}>
          重置关卡
        </button>
        <button 
          className="action-btn confirm" 
          onClick={() => {
            const store = useGameStore.getState();
            const allAssigned = store.currentLevel?.cases.every(c => store.assignments[c.id]);
            if (allAssigned) {
              store.endLevel(true);
            } else {
              alert('请先完成所有案件的排期！');
            }
          }}
        >
          确认提交
        </button>
      </div>
    </div>
  );
}
