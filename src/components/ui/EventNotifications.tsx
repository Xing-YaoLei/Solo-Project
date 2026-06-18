import { useGameStore } from '../../store/gameStore';
import { MATERIALS } from '../../config/gameConfig';

export function EventNotifications() {
  const activeEvents = useGameStore(state => state.activeEvents);
  const resolveEvent = useGameStore(state => state.resolveEvent);

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'shortage': return '⚠️';
      case 'delay': return '⏰';
      case 'quality': return '🔍';
      case 'extra_demand': return '📈';
      default: return '❓';
    }
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'shortage': return 'border-red-500 bg-red-500/10';
      case 'delay': return 'border-yellow-500 bg-yellow-500/10';
      case 'quality': return 'border-orange-500 bg-orange-500/10';
      case 'extra_demand': return 'border-blue-500 bg-blue-500/10';
      default: return 'border-gray-500 bg-gray-500/10';
    }
  };

  const getEventTypeText = (type: string) => {
    switch (type) {
      case 'shortage': return '短缺';
      case 'delay': return '延误';
      case 'quality': return '质量';
      case 'extra_demand': return '追加';
      default: return '事件';
    }
  };

  return (
    <div className="bg-black/70 backdrop-blur-lg rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-bold text-lg">⚠️ 突发事件</h3>
        {activeEvents.length > 0 && (
          <span className="px-2 py-1 bg-red-500 text-white text-xs rounded-full animate-pulse">
            {activeEvents.length} 待处理
          </span>
        )}
      </div>

      <div className="space-y-3 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
        {activeEvents.length === 0 ? (
          <div className="text-center text-gray-400 py-6">
            <div className="text-4xl mb-2">✅</div>
            <p>一切顺利</p>
            <p className="text-xs mt-1">暂无突发事件</p>
          </div>
        ) : (
          activeEvents.map(event => {
            const material = event.materialType ? MATERIALS[event.materialType] : null;

            return (
              <div
                key={event.id}
                className={`border-l-4 rounded-lg p-3 ${getEventTypeColor(event.type)}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{getEventTypeIcon(event.type)}</span>
                    <div>
                      <span className="text-white font-bold text-sm">
                        {getEventTypeText(event.type)}事件
                      </span>
                      <span className="text-gray-400 text-xs ml-2">第{event.day}天</span>
                    </div>
                  </div>
                </div>

                <p className="text-gray-300 text-sm mb-3">{event.message}</p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {material && (
                      <span className="text-sm" style={{ color: material.color }}>
                        {material.icon} {material.name}
                      </span>
                    )}
                    {event.impact > 0 && (
                      <span className="text-red-400 text-sm">
                        影响: {event.impact}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => resolveEvent(event.id)}
                    className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white text-sm rounded-lg transition-colors"
                  >
                    标记已处理
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.3);
          border-radius: 2px;
        }
      `}</style>
    </div>
  );
}
