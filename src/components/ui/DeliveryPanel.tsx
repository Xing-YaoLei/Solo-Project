import { useGameStore } from '../../store/gameStore';
import { MATERIALS } from '../../config/gameConfig';

interface DeliveryPanelProps {
  onSchedule: () => void;
}

export function DeliveryPanel({ onSchedule }: DeliveryPanelProps) {
  const deliveries = useGameStore(state => state.deliveries);
  const currentDay = useGameStore(state => state.currentDay);
  const acceptDelivery = useGameStore(state => state.acceptDelivery);
  const suppliers = useGameStore(state => state.suppliers);

  const pendingDeliveries = deliveries.filter(d => d.status === 'pending');
  const arrivedDeliveries = deliveries.filter(d => d.status === 'arrived');
  const shortageDeliveries = deliveries.filter(d => d.status === 'shortage');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-blue-500';
      case 'arrived': return 'bg-green-500';
      case 'shortage': return 'bg-red-500';
      case 'accepted': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return '在途';
      case 'arrived': return '已到待验';
      case 'shortage': return '短缺';
      case 'accepted': return '已签收';
      default: return status;
    }
  };

  const getSupplierName = (supplierId: string) => {
    return suppliers.find(s => s.id === supplierId)?.name || '未知供应商';
  };

  return (
    <div className="bg-black/70 backdrop-blur-lg rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-bold text-lg">🚚 配送管理</h3>
        <button
          onClick={onSchedule}
          className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg transition-colors"
        >
          + 新配送
        </button>
      </div>

      <div className="flex gap-2 mb-4 text-sm">
        <span className="px-2 py-1 bg-blue-500/30 text-blue-300 rounded">
          在途: {pendingDeliveries.length}
        </span>
        <span className="px-2 py-1 bg-green-500/30 text-green-300 rounded">
          待验: {arrivedDeliveries.length}
        </span>
        <span className="px-2 py-1 bg-red-500/30 text-red-300 rounded">
          短缺: {shortageDeliveries.length}
        </span>
      </div>

      <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
        {deliveries.length === 0 ? (
          <div className="text-center text-gray-400 py-4">
            <div className="text-2xl mb-1">📭</div>
            <p className="text-sm">暂无配送计划</p>
            <p className="text-xs mt-1">点击上方按钮添加配送</p>
          </div>
        ) : (
          [...deliveries]
            .sort((a, b) => b.scheduledDay - a.scheduledDay)
            .slice(0, 15)
            .map(delivery => {
              const material = MATERIALS[delivery.materialType];
              const isToday = delivery.scheduledDay === currentDay;
              const isOverdue = delivery.scheduledDay < currentDay && delivery.status === 'pending';

              return (
                <div
                  key={delivery.id}
                  className={`bg-white/5 rounded-lg p-3 text-sm ${
                    isOverdue ? 'border-l-4 border-red-500' :
                    isToday ? 'border-l-4 border-yellow-500' : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{material.icon}</span>
                      <div>
                        <div className="text-white font-medium">{material.name}</div>
                        <div className="text-gray-400 text-xs">{getSupplierName(delivery.supplierId)}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-white font-bold">{delivery.quantity} {material.unit}</div>
                      <span className={`text-xs px-2 py-0.5 rounded-full text-white ${getStatusColor(delivery.status)}`}>
                        {getStatusText(delivery.status)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-blue-300 text-xs">
                      预计第 {delivery.scheduledDay} 天
                      {isToday && <span className="text-yellow-400 ml-1">(今日)</span>}
                      {isOverdue && <span className="text-red-400 ml-1">(逾期)</span>}
                    </div>

                    {delivery.shortageAmount && delivery.shortageAmount > 0 && (
                      <div className="text-red-400 text-xs">
                        短缺 {delivery.shortageAmount} {material.unit}
                      </div>
                    )}

                    {delivery.status === 'arrived' && (
                      <button
                        onClick={() => acceptDelivery(delivery.id)}
                        className="px-2 py-1 bg-green-500 hover:bg-green-600 text-white text-xs rounded transition-colors"
                      >
                        确认签收
                      </button>
                    )}
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
