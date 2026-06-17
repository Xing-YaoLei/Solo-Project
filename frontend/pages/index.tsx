import { useEffect, useState } from 'react';
import { useAppStore } from '../store/appStore';
import OrderList from '../components/OrderList';
import OrderDetail from '../components/OrderDetail';
import ProcessPanel from '../components/ProcessPanel';
import StatisticsPanel from '../components/StatisticsPanel';
import { ClipboardList, LayoutDashboard, History } from 'lucide-react';

export default function Home() {
  const { fetchOrders, fetchCommonMaterials, fetchRepairPersons } = useAppStore();
  const [activeTab, setActiveTab] = useState<'dispatch' | 'stats' | 'history'>('dispatch');

  useEffect(() => {
    fetchOrders();
    fetchCommonMaterials();
    fetchRepairPersons();
  }, []);

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
              <ClipboardList className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">维修派单分派台</h1>
              <p className="text-sm text-gray-500">长租公寓维修管理系统</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('dispatch')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'dispatch'
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span className="flex items-center gap-2">
                <ClipboardList className="w-4 h-4" />
                分派台
              </span>
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'stats'
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span className="flex items-center gap-2">
                <LayoutDashboard className="w-4 h-4" />
                统计汇总
              </span>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'history'
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span className="flex items-center gap-2">
                <History className="w-4 h-4" />
                历史追溯
              </span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-hidden">
        {activeTab === 'dispatch' && (
          <div className="h-full grid grid-cols-12 gap-4 p-4">
            <div className="col-span-3 flex flex-col min-h-0">
              <OrderList />
            </div>
            <div className="col-span-6 flex flex-col min-h-0">
              <OrderDetail />
            </div>
            <div className="col-span-3 flex flex-col min-h-0">
              <ProcessPanel />
            </div>
          </div>
        )}
        {activeTab === 'stats' && (
          <div className="h-full p-4 overflow-auto">
            <StatisticsPanel />
          </div>
        )}
        {activeTab === 'history' && (
          <div className="h-full p-4">
            <HistoryPanel />
          </div>
        )}
      </main>
    </div>
  );
}

function HistoryPanel() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">历史追溯</h2>
      <p className="text-gray-500">请在左侧列表中选择派单查看详细历史记录。</p>
      <p className="text-gray-400 text-sm mt-2">提示：切换到"分派台"标签页，选择派单后可在详情中查看完整历史状态流转记录。</p>
    </div>
  );
}
