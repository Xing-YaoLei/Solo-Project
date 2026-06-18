import { useState, useEffect } from 'react';
import { useGameStore } from '../../store/gameStore';
import { MATERIALS } from '../../config/gameConfig';
import { MaterialType } from '../../types';

interface ScheduleDeliveryModalProps {
  onClose: () => void;
  preselectedSupplier?: string | null;
}

export function ScheduleDeliveryModal({ onClose, preselectedSupplier }: ScheduleDeliveryModalProps) {
  const suppliers = useGameStore(state => state.suppliers);
  const currentDay = useGameStore(state => state.currentDay);
  const scheduleDelivery = useGameStore(state => state.scheduleDelivery);

  const [selectedSupplier, setSelectedSupplier] = useState<string | null>(preselectedSupplier);
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialType | null>(null);
  const [quantity, setQuantity] = useState(50);
  const [daysAhead, setDaysAhead] = useState(2);

  useEffect(() => {
    if (preselectedSupplier) {
      setSelectedSupplier(preselectedSupplier);
    }
  }, [preselectedSupplier]);

  const currentSupplier = suppliers.find(s => s.id === selectedSupplier);

  const handleSubmit = () => {
    if (selectedSupplier && selectedMaterial && quantity > 0) {
      scheduleDelivery(selectedSupplier, selectedMaterial, quantity, daysAhead);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 pointer-events-auto">
      <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-lg mx-4 border border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">🚚 安排配送</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-gray-300 mb-2 font-medium">选择供应商</label>
            <div className="grid grid-cols-3 gap-2">
              {suppliers.map(supplier => (
                <button
                  key={supplier.id}
                  onClick={() => {
                    setSelectedSupplier(supplier.id);
                    setSelectedMaterial(null);
                  }}
                  className={`p-3 rounded-lg border-2 transition-all text-left ${
                    selectedSupplier === supplier.id
                      ? 'border-blue-500 bg-blue-500/20'
                      : 'border-gray-600 hover:border-gray-500 bg-gray-800'
                  }`}
                >
                  <div className="text-white font-medium text-sm">{supplier.name}</div>
                  <div className="text-gray-400 text-xs mt-1">
                    ⏱️ {supplier.deliveryTime}天 | ✅ {(supplier.reliability * 100).toFixed(0)}%
                  </div>
                </button>
              ))}
            </div>
          </div>

          {currentSupplier && (
            <div>
              <label className="block text-gray-300 mb-2 font-medium">选择材料</label>
              <div className="grid grid-cols-4 gap-2">
                {currentSupplier.materials.map(materialType => {
                  const material = MATERIALS[materialType];
                  return (
                    <button
                      key={materialType}
                      onClick={() => setSelectedMaterial(materialType)}
                      className={`p-3 rounded-lg border-2 transition-all text-center ${
                        selectedMaterial === materialType
                          ? 'border-blue-500 bg-blue-500/20'
                          : 'border-gray-600 hover:border-gray-500 bg-gray-800'
                      }`}
                    >
                      <div className="text-2xl mb-1">{material.icon}</div>
                      <div className="text-white text-xs">{material.name}</div>
                      <div className="text-gray-400 text-xs">{material.unit}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {selectedMaterial && (
            <>
              <div>
                <label className="block text-gray-300 mb-2 font-medium">
                  数量 ({MATERIALS[selectedMaterial].unit})
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="10"
                    max="200"
                    step="10"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value))}
                    className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    className="w-20 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-center"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-300 mb-2 font-medium">
                  配送时间
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="1"
                    max="7"
                    value={daysAhead}
                    onChange={(e) => setDaysAhead(parseInt(e.target.value))}
                    className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="text-white">
                    第 <span className="text-blue-400 font-bold">{currentDay + daysAhead}</span> 天
                    <span className="text-gray-400 text-sm ml-1">({daysAhead}天后)</span>
                  </div>
                </div>
              </div>

              {currentSupplier && selectedMaterial && (
                <div className="bg-gray-800 rounded-lg p-4">
                  <h4 className="text-white font-bold mb-2">配送摘要</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-gray-400">供应商:</div>
                    <div className="text-white">{currentSupplier.name}</div>
                    <div className="text-gray-400">材料:</div>
                    <div className="text-white">{MATERIALS[selectedMaterial].icon} {MATERIALS[selectedMaterial].name}</div>
                    <div className="text-gray-400">数量:</div>
                    <div className="text-white">{quantity} {MATERIALS[selectedMaterial].unit}</div>
                    <div className="text-gray-400">预计送达:</div>
                    <div className="text-yellow-400">第 {currentDay + daysAhead} 天</div>
                    <div className="text-gray-400">可靠性:</div>
                    <div className={currentSupplier.reliability >= 0.9 ? 'text-green-400' : currentSupplier.reliability >= 0.8 ? 'text-yellow-400' : 'text-red-400'}>
                      {(currentSupplier.reliability * 100).toFixed(0)}%
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-medium transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedSupplier || !selectedMaterial || quantity <= 0}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-500 disabled:to-gray-600 text-white rounded-xl font-medium transition-all disabled:cursor-not-allowed"
          >
            🚀 确认下单
          </button>
        </div>
      </div>
    </div>
  );
}
