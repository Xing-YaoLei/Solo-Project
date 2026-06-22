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
    conflictMessage,
    successMessage,
    checkConflicts,
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
  const conflicts = checkConflicts();

  const getSlotCapacity = (slotId) => {
    if (!currentLevel) return { current: 0, max: 0, ratio: 0 };
    const slot = currentLevel.timeSlots.find(s => s.id === slotId);
    if (!slot) return { current: 0, max: 0, ratio: 0 };
    const current = Object.values(assignments).filter(s => s === slotId).length;
    return {
      current,
      max: slot.maxCapacity,
      ratio: current / slot.maxCapacity,
    };
  };

  return (
    <div className="ui-overlay">
      {conflictMessage && (
        <div className="conflict-warning">
          {conflictMessage}
        </div>
      )}
      
      {successMessage && (
        <div className="success-toast">
          {successMessage}
        </div>
      )}

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
          {conflicts.length > 0 && (
            <div className="hud-card" style={{ borderColor: 'rgba(239, 68, 68, 0.5)', background: 'rgba(239, 68, 68, 0.2)' }}>
              <div className="label" style={{ color: '#fca5a5' }}>⚠️ 冲突检测</div>
              {conflicts.map((c, i) => (
                <div key={i} className="value" style={{ fontSize: '0.85rem', color: '#fecaca' }}>
                  {c.slotTime}: {c.currentCount}/{c.maxCapacity} 超载
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="hud-card level-info">
          <h2>{currentLevel?.name}</h2>
          <p>案件进度：{assignedCount} / {totalCases}</p>
          {selectedCase && <p style={{ color: '#3b82f6', marginTop: 8 }}>已选中案件，点击时段排期</p>}
          {!isPlaying && !conflictMessage && !successMessage && (
            <p style={{ color: '#f59e0b', marginTop: 8 }}>⚡ 点击教程「开始游戏」或跳过教程开始</p>
          )}
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
          <div className="hud-card">
            <div className="label">时段容量</div>
            {currentLevel?.timeSlots.map(slot => {
              const cap = getSlotCapacity(slot.id);
              const capStatus = cap.ratio >= 1 ? 'danger' : cap.ratio >= 0.7 ? 'warning' : 'good';
              return (
                <div key={slot.id} className="capacity-bar" style={{ margin: '4px 0' }}>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', minWidth: 50 }}>{slot.time}</span>
                  <div className="capacity-track">
                    <div 
                      className={`capacity-fill ${capStatus}`} 
                      style={{ width: `${cap.ratio * 100}%` }}
                    />
                  </div>
                  <span className={`capacity-text ${capStatus}`} style={{ fontSize: '0.75rem' }}>
                    {cap.current}/{cap.max}
                  </span>
                </div>
              );
            })}
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
            const currentConflicts = store.checkConflicts();
            if (currentConflicts.length > 0) {
              store.setState({ conflictMessage: '⚠️ 请先解决容量冲突再提交！' });
              setTimeout(() => store.setState({ conflictMessage: null }), 2000);
              return;
            }
            if (allAssigned) {
              store.endLevel(true);
            } else {
              store.setState({ conflictMessage: `⚠️ 还有 ${totalCases - assignedCount} 个案件未排期！` });
              setTimeout(() => store.setState({ conflictMessage: null }), 2000);
            }
          }}
        >
          确认提交
        </button>
      </div>
    </div>
  );
}
