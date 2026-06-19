import { useGameStore } from '@/store/useGameStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Car, Stethoscope, ClipboardList, Package, ChevronRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ActivePanel } from '@/types';
import VehicleArchive from './VehicleArchive';
import DiagnosisPanel from './DiagnosisPanel';
import DispatchPanel from './DispatchPanel';
import InventoryPanel from './InventoryPanel';

const tabs: { key: ActivePanel; label: string; icon: typeof Car }[] = [
  { key: 'archive', label: '档案', icon: Car },
  { key: 'diagnosis', label: '诊断', icon: Stethoscope },
  { key: 'dispatch', label: '分配', icon: ClipboardList },
  { key: 'inventory', label: '库存', icon: Package },
];

export default function SidePanel() {
  const { activePanel, setActivePanel, selectedVehicleId } = useGameStore();
  const isOpen = activePanel !== null;

  const handleClose = () => {
    setActivePanel(null);
  };

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            onClick={() => setActivePanel(selectedVehicleId ? 'archive' : 'inventory')}
            className={cn(
              'fixed right-0 top-1/2 z-40 -translate-y-1/2',
              'flex h-24 w-8 items-center justify-center rounded-l-xl',
              'bg-white/10 backdrop-blur-xl border border-r-0 border-white/20',
              'hover:bg-white/20 transition-all active:scale-95'
            )}
          >
            <ChevronRight className="h-5 w-5 text-white/70" />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="fixed right-0 top-0 z-50 flex h-full w-[480px] max-w-full flex-col"
          >
            <div className={cn(
              'flex h-full flex-col overflow-hidden',
              'bg-slate-900/95 backdrop-blur-2xl border-l border-white/10',
              'shadow-[-20px_0_60px_rgba(0,0,0,0.4)]'
            )}>
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                    {(() => {
                      const currentTab = tabs.find((t) => t.key === activePanel);
                      if (currentTab) {
                        const Icon = currentTab.icon;
                        return <Icon className="h-5 w-5 text-white" />;
                      }
                      return null;
                    })()}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">
                      {tabs.find((t) => t.key === activePanel)?.label || '面板'}
                    </div>
                    <div className="text-xs text-white/50">汽车维修管理</div>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-lg transition-all',
                    'bg-white/5 hover:bg-white/15 border border-white/10',
                    'active:scale-95'
                  )}
                >
                  <X className="h-4 w-4 text-white/70" />
                </button>
              </div>

              <div className="flex items-center gap-1 border-b border-white/10 px-3 py-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activePanel === tab.key;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setActivePanel(tab.key)}
                      className={cn(
                        'relative flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5',
                        'text-sm font-medium transition-all',
                        isActive
                          ? 'text-white bg-white/10'
                          : 'text-white/60 hover:text-white hover:bg-white/5'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{tab.label}</span>
                      {isActive && (
                        <motion.div
                          layoutId="activeTabIndicator"
                          className="absolute bottom-0 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-gradient-to-r from-blue-400 to-cyan-400"
                        />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="flex-1 overflow-y-auto">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activePanel}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="h-full"
                  >
                    {activePanel === 'archive' && <VehicleArchive />}
                    {activePanel === 'diagnosis' && <DiagnosisPanel />}
                    {activePanel === 'dispatch' && <DispatchPanel />}
                    {activePanel === 'inventory' && <InventoryPanel />}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
