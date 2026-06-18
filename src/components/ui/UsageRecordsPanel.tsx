import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { MATERIALS } from '../../config/gameConfig';

export function UsageRecordsPanel() {
  const usageRecords = useGameStore(state => state.usageRecords);
  const currentDay = useGameStore(state => state.currentDay);
  const [showAll, setShowAll] = useState(false);

  const todayRecords = usageRecords.filter(r => r.day === currentDay);
  const displayRecords = showAll ? usageRecords : todayRecords;

  const sortedRecords = [...displayRecords].sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div className="bg-black/70 backdrop-blur-lg rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-bold text-lg">📋 领用记录</h3>
        <button
          onClick={() => setShowAll(!showAll)}
          className="text-blue-300 text-sm hover:text-white transition-colors"
        >
          {showAll ? '只看今天' : '查看全部'}
        </button>
      </div>

      <div className="text-sm text-blue-300 mb-3">
        今日领用: {todayRecords.length} 条记录
      </div>

      <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
        {sortedRecords.length === 0 ? (
          <div className="text-center text-gray-400 py-4">
            <div className="text-2xl mb-1">📭</div>
            <p className="text-sm">暂无领用记录</p>
          </div>
        ) : (
          sortedRecords.slice(0, 20).map(record => {
            const material = MATERIALS[record.materialType];
            return (
              <div
                key={record.id}
                className="bg-white/5 rounded-lg p-3 text-sm"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span>{material.icon}</span>
                    <span className="text-white font-medium">{material.name}</span>
                    <span className="text-yellow-400 font-bold">-{record.quantity} {material.unit}</span>
                  </div>
                  <span className="text-blue-300 text-xs">第{record.day}天</span>
                </div>
                <div className="text-gray-400 text-xs">
                  📍 {record.workArea}
                </div>
              </div>
            );
          })
        )}
      </div>

      {sortedRecords.length > 20 && (
        <div className="mt-2 text-center text-gray-400 text-xs">
          显示最新 20 条，共 {sortedRecords.length} 条
        </div>
      )}

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
