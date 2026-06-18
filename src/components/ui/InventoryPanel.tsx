import { useGameStore } from '../../store/gameStore';
import { MATERIALS } from '../../config/gameConfig';
import { getConfigByDifficulty } from '../../config/gameConfig';

export function InventoryPanel() {
  const inventory = useGameStore(state => state.inventory);
  const difficulty = useGameStore(state => state.difficulty);
  const config = getConfigByDifficulty(difficulty);

  const getInventoryStatus = (quantity: number) => {
    if (quantity <= 0) return { color: 'bg-red-500', text: '短缺', textColor: 'text-red-400' };
    if (quantity < 20) return { color: 'bg-yellow-500', text: '偏低', textColor: 'text-yellow-400' };
    if (quantity > config.maxInventory * 0.8) return { color: 'bg-orange-500', text: '偏高', textColor: 'text-orange-400' };
    return { color: 'bg-green-500', text: '正常', textColor: 'text-green-400' };
  };

  return (
    <div className="bg-black/70 backdrop-blur-lg rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-bold text-lg">📦 库存状态</h3>
        <span className="text-blue-300 text-sm">上限: {config.maxInventory}</span>
      </div>

      <div className="space-y-3">
        {inventory.map(inv => {
          const material = MATERIALS[inv.materialType];
          const status = getInventoryStatus(inv.quantity);
          const percentage = Math.min(100, (inv.quantity / config.maxInventory) * 100);

          return (
            <div key={inv.materialType} className="bg-white/5 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{material.icon}</span>
                  <div>
                    <div className="text-white font-medium">{material.name}</div>
                    <div className="text-blue-300 text-xs">{material.unit}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-bold ${status.textColor}`}>
                    {inv.quantity} {material.unit}
                  </div>
                  <div className={`text-xs px-2 py-0.5 rounded-full ${status.color} text-white`}>
                    {status.text}
                  </div>
                </div>
              </div>

              <div className="relative h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${status.color}`}
                  style={{ width: `${percentage}%` }}
                />
              </div>

              {inv.incoming > 0 && (
                <div className="mt-2 text-xs text-green-400 flex items-center gap-1">
                  <span>🚚</span>
                  <span>在途: {inv.incoming} {material.unit}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {inventory.length === 0 && (
        <div className="text-center text-gray-400 py-8">
          <div className="text-4xl mb-2">📭</div>
          <p>暂无库存数据</p>
        </div>
      )}
    </div>
  );
}
