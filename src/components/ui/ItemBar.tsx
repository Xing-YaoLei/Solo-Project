import { useGameStore } from '../../store/gameStore';
import { getConfigByDifficulty } from '../../config/gameConfig';

export function ItemBar() {
  const difficulty = useGameStore(state => state.difficulty);
  const itemCooldowns = useGameStore(state => state.itemCooldowns);
  const useItem = useGameStore(state => state.useItem);
  const currentDay = useGameStore(state => state.currentDay);

  const config = getConfigByDifficulty(difficulty);

  return (
    <div className="flex items-center gap-2">
      <span className="text-white text-sm font-medium mr-2">🎒 道具</span>
      {config.items.map(item => {
        const cooldown = itemCooldowns[item.id] || 0;
        const isOnCooldown = cooldown > 0;

        return (
          <button
            key={item.id}
            onClick={() => useItem(item.id)}
            disabled={isOnCooldown}
            className={`relative w-12 h-12 rounded-xl flex items-center justify-center text-2xl transition-all duration-200 ${
              isOnCooldown
                ? 'bg-gray-600 cursor-not-allowed opacity-50'
                : 'bg-purple-500/30 hover:bg-purple-500/50 cursor-pointer hover:scale-110'
            }`}
            title={`${item.name}: ${item.description}${isOnCooldown ? ` (冷却${cooldown}天)` : ''}`}
          >
            {item.icon}
            {isOnCooldown && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-xl">
                <span className="text-white text-xs font-bold">{cooldown}</span>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
