import { useEffect, useState } from 'react';
import { useAppStore } from '../store/appStore';
import OrderList from '../components/OrderList';
import OrderDetail from '../components/OrderDetail';
import ProcessPanel from '../components/ProcessPanel';
import StatisticsPanel from '../components/StatisticsPanel';
import CreateOrderModal from '../components/CreateOrderModal';
import { ClipboardList, LayoutDashboard, History, Plus, Workflow } from 'lucide-react';

export default function Home() {
  const { fetchOrders, fetchCommonMaterials, fetchRepairPersons } = useAppStore();
  const [activeTab, setActiveTab] = useState<'dispatch' | 'stats' | 'history'>('dispatch');
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchOrders();
    fetchCommonMaterials();
    fetchRepairPersons();
  }, []);

  useEffect(() => {
    const handleOpenModal = () => setShowCreateModal(true);
    window.addEventListener('openCreateModal', handleOpenModal);
    return () => window.removeEventListener('openCreateModal', handleOpenModal);
  }, []);

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="px-6 py-4 flex items-center justify-between">
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
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              新增派单
            </button>
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

        {activeTab === 'dispatch' && (
          <div className="px-6 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <Workflow className="w-4 h-4 text-primary-500" />
              <span className="text-sm font-medium text-gray-700">业务链路：</span>
              <div className="flex items-center gap-1">
                <div className="flex items-center gap-1.5 px-3 py-1 bg-white rounded-full border border-green-200 shadow-sm">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-xs font-medium text-green-700">录入派单</span>
                </div>
                <span className="text-gray-400">→</span>
                <div className="flex items-center gap-1.5 px-3 py-1 bg-white rounded-full border border-blue-200 shadow-sm">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="text-xs font-medium text-blue-700">人员分派</span>
                </div>
                <span className="text-gray-400">→</span>
                <div className="flex items-center gap-1.5 px-3 py-1 bg-white rounded-full border border-yellow-200 shadow-sm">
                  <div className="w-2 h-2 rounded-full bg-yellow-500" />
                  <span className="text-xs font-medium text-yellow-700">维修处理</span>
                </div>
                <span className="text-gray-400">→</span>
                <div className="flex items-center gap-1.5 px-3 py-1 bg-white rounded-full border border-purple-200 shadow-sm">
                  <div className="w-2 h-2 rounded-full bg-purple-500" />
                  <span className="text-xs font-medium text-purple-700">完成复核</span>
                </div>
                <span className="text-gray-400">→</span>
                <div className="flex items-center gap-1.5 px-3 py-1 bg-white rounded-full border border-gray-300 shadow-sm">
                  <div className="w-2 h-2 rounded-full bg-gray-500" />
                  <span className="text-xs font-medium text-gray-700">单据关闭</span>
                </div>
              </div>
              <div className="ml-auto text-xs text-gray-500">
                提示：点击左侧「录入」按钮或顶部「新增派单」开始完整业务流程
              </div>
            </div>
          </div>
        )}
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

      <CreateOrderModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
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
