import { useState, useEffect } from 'react';
import { useAppStore } from '../store/appStore';
import {
  statusLabels,
  statusColors,
  sourceLabels,
  delayReasonLabels,
  reviewTagLabels,
  reviewTagColors,
  formatDateTime,
  formatDuration,
  priorityLabels,
  priorityColors,
} from '../lib/utils';
import {
  MapPin,
  Clock,
  AlertTriangle,
  FileCheck,
  Package,
  User,
  Phone,
  Home,
  History,
  ChevronRight,
} from 'lucide-react';

export default function OrderDetail() {
  const { selectedOrder, fetchOrderDetail } = useAppStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'route' | 'delay' | 'signoff' | 'materials' | 'history'>('overview');

  useEffect(() => {
    if (selectedOrder) {
      fetchOrderDetail(selectedOrder.id);
    }
  }, [selectedOrder?.id]);

  if (!selectedOrder) {
    return (
      <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-gray-200 items-center justify-center">
        <div className="text-center text-gray-400">
          <FileCheck className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">请选择派单查看详情</p>
          <p className="text-sm mt-2">从左侧列表中选择一个派单</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { key: 'overview', label: '概览', icon: FileCheck },
    { key: 'route', label: '路线计划', icon: MapPin },
    { key: 'delay', label: '延误记录', icon: AlertTriangle },
    { key: 'signoff', label: '签收凭证', icon: FileCheck },
    { key: 'materials', label: '使用材料', icon: Package },
    { key: 'history', label: '状态历史', icon: History },
  ];

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-gray-900">{selectedOrder.orderNo}</h2>
              <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${statusColors[selectedOrder.status]}`}>
                {statusLabels[selectedOrder.status]}
              </span>
              <span className={`px-2 py-0.5 text-xs rounded ${priorityColors[selectedOrder.priority]}`}>
                {priorityLabels[selectedOrder.priority]}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">{selectedOrder.faultType}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">来源：{sourceLabels[selectedOrder.source]}</p>
            <p className="text-xs text-gray-400 mt-1">创建时间：{formatDateTime(selectedOrder.createdAt)}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <Home className="w-4 h-4 text-gray-400" />
            <span>{selectedOrder.apartmentNo}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <User className="w-4 h-4 text-gray-400" />
            <span>{selectedOrder.tenantName}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Phone className="w-4 h-4 text-gray-400" />
            <span>{selectedOrder.tenantPhone}</span>
          </div>
        </div>
      </div>

      <div className="flex border-b border-gray-100 px-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {tab.key === 'delay' && selectedOrder.delayRecords && selectedOrder.delayRecords.length > 0 && (
              <span className="px-1.5 py-0.5 text-xs bg-red-100 text-red-600 rounded-full">
                {selectedOrder.delayRecords.length}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-4">
        {activeTab === 'overview' && <OverviewTab order={selectedOrder} />}
        {activeTab === 'route' && <RouteTab order={selectedOrder} />}
        {activeTab === 'delay' && <DelayTab order={selectedOrder} />}
        {activeTab === 'signoff' && <SignoffTab order={selectedOrder} />}
        {activeTab === 'materials' && <MaterialsTab order={selectedOrder} />}
        {activeTab === 'history' && <HistoryTab order={selectedOrder} />}
      </div>
    </div>
  );
}

function OverviewTab({ order }: { order: any }) {
  return (
    <div className="space-y-4">
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-2">故障描述</h3>
        <p className="text-sm text-gray-600">{order.faultDesc}</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-700 mb-2">计划时间</h3>
          <p className="text-sm text-blue-600">开始：{formatDateTime(order.planStartTime)}</p>
          <p className="text-sm text-blue-600 mt-1">结束：{formatDateTime(order.planEndTime)}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-green-700 mb-2">实际时间</h3>
          <p className="text-sm text-green-600">开始：{formatDateTime(order.actualStartTime)}</p>
          <p className="text-sm text-green-600 mt-1">结束：{formatDateTime(order.actualEndTime)}</p>
          {order.isOnTime !== null && (
            <p className={`text-sm mt-2 font-medium ${order.isOnTime ? 'text-green-600' : 'text-red-600'}`}>
              {order.isOnTime ? '✓ 准时完成' : '✗ 存在延误'}
            </p>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-100 p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3">维修人员</h3>
        {order.assignPerson ? (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-medium">
              {order.assignPerson.name.charAt(0)}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">{order.assignPerson.name}</p>
              <p className="text-xs text-gray-500">{order.assignPerson.skill}</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-400">尚未分派</p>
        )}
      </div>

      {order.reviewTags && order.reviewTags.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-100 p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">复盘标签</h3>
          <div className="flex flex-wrap gap-2">
            {order.reviewTags.map((tag: any) => (
              <span
                key={tag}
                className={`px-2.5 py-1 text-xs font-medium rounded-full ${reviewTagColors[tag]}`}
              >
                {reviewTagLabels[tag]}
              </span>
            ))}
          </div>
        </div>
      )}

      {order.closeRemark && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">关闭备注</h3>
          <p className="text-sm text-gray-600">{order.closeRemark}</p>
          <p className="text-xs text-gray-400 mt-2">关闭时间：{formatDateTime(order.closeTime)}</p>
        </div>
      )}
    </div>
  );
}

function RouteTab({ order }: { order: any }) {
  const routes = order.routePlans || [];

  return (
    <div className="space-y-4">
      {routes.length === 0 ? (
        <div className="text-center text-gray-400 py-8">
          <MapPin className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">暂无路线计划</p>
        </div>
      ) : (
        <div className="space-y-3">
          {routes.map((route: any, index: number) => (
            <div
              key={route.id}
              className="bg-gray-50 rounded-lg p-4 relative"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary-500 text-white text-xs flex items-center justify-center font-medium">
                    {index + 1}
                  </span>
                  <span className="text-sm font-medium text-gray-900">路线 {index + 1}</span>
                </div>
                <span className={`px-2 py-0.5 text-xs rounded ${
                  route.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                  route.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {route.status === 'COMPLETED' ? '已完成' :
                   route.status === 'IN_PROGRESS' ? '进行中' : '计划中'}
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span>{route.fromLocation}</span>
                <ChevronRight className="w-4 h-4 text-gray-300" />
                <span>{route.toLocation}</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-400 text-xs">计划出发</p>
                  <p className="text-gray-700">{formatDateTime(route.planDeparture)}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">计划到达</p>
                  <p className="text-gray-700">{formatDateTime(route.planArrival)}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">实际出发</p>
                  <p className="text-gray-700">{formatDateTime(route.actualDeparture)}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">实际到达</p>
                  <p className="text-gray-700">{formatDateTime(route.actualArrival)}</p>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  距离：{route.distanceKm.toFixed(1)} 公里
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DelayTab({ order }: { order: any }) {
  const delays = order.delayRecords || [];

  return (
    <div className="space-y-4">
      {delays.length === 0 ? (
        <div className="text-center text-gray-400 py-8">
          <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">暂无延误记录</p>
        </div>
      ) : (
        <div className="space-y-3">
          {delays.map((delay: any) => (
            <div key={delay.id} className="bg-red-50 rounded-lg p-4 border border-red-100">
              <div className="flex items-start justify-between mb-2">
                <span className="px-2.5 py-1 bg-red-100 text-red-700 text-xs font-medium rounded">
                  {delayReasonLabels[delay.reason]}
                </span>
                <span className="text-sm text-red-600 font-medium">
                  延误 {formatDuration(delay.duration)}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-2">{delay.detail}</p>
              <p className="text-xs text-gray-400">
                上报时间：{formatDateTime(delay.reportedAt)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SignoffTab({ order }: { order: any }) {
  const signoff = order.signoffProof;

  if (!signoff) {
    return (
      <div className="text-center text-gray-400 py-8">
        <FileCheck className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p className="text-sm">暂无签收凭证</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-green-50 rounded-lg p-4 border border-green-100">
        <div className="flex items-center gap-2 mb-4">
          <FileCheck className="w-5 h-5 text-green-600" />
          <span className="text-green-700 font-medium">已签收</span>
        </div>

        {signoff.signature && (
          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-2">客户签名</p>
            <div className="bg-white rounded-lg p-4 border border-green-200">
              <p className="text-lg text-gray-700">{signoff.signature}</p>
            </div>
          </div>
        )}

        {signoff.photoUrls && signoff.photoUrls.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-2">现场照片</p>
            <div className="grid grid-cols-3 gap-2">
              {signoff.photoUrls.map((url: string, idx: number) => (
                <div
                  key={idx}
                  className="aspect-square bg-gray-200 rounded-lg flex items-center justify-center text-gray-400 text-xs"
                >
                  照片 {idx + 1}
                </div>
              ))}
            </div>
          </div>
        )}

        {signoff.remark && (
          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-2">备注</p>
            <p className="text-sm text-gray-700">{signoff.remark}</p>
          </div>
        )}

        <div className="pt-3 border-t border-green-200">
          <p className="text-xs text-gray-500">
            签收人：{signoff.signedBy}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            签收时间：{formatDateTime(signoff.signedAt)}
          </p>
        </div>
      </div>
    </div>
  );
}

function MaterialsTab({ order }: { order: any }) {
  const materials = order.materials || [];

  return (
    <div className="space-y-4">
      {materials.length === 0 ? (
        <div className="text-center text-gray-400 py-8">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">暂无使用材料</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-2 font-medium text-gray-600">材料名称</th>
                <th className="text-left px-4 py-2 font-medium text-gray-600">规格</th>
                <th className="text-right px-4 py-2 font-medium text-gray-600">数量</th>
                <th className="text-right px-4 py-2 font-medium text-gray-600">单价</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {materials.map((item: any) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-900">{item.material.name}</td>
                  <td className="px-4 py-3 text-gray-500">{item.material.sku}</td>
                  <td className="px-4 py-3 text-right text-gray-700">
                    {item.quantity} {item.material.unit}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-700">
                    ¥{item.material.price}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function HistoryTab({ order }: { order: any }) {
  const logs = order.statusLogs || [];

  return (
    <div className="space-y-0">
      {logs.length === 0 ? (
        <div className="text-center text-gray-400 py-8">
          <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">暂无状态记录</p>
        </div>
      ) : (
        <div className="relative">
          <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-gray-200" />
          {logs.map((log: any, index: number) => (
            <div key={log.id} className="relative pl-8 pb-4">
              <div className={`absolute left-1.5 w-3 h-3 rounded-full border-2 border-white ${
                index === 0 ? 'bg-primary-500' : 'bg-gray-300'
              }`} />
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2 py-0.5 text-xs rounded ${statusColors[log.fromStatus]}`}>
                    {statusLabels[log.fromStatus]}
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                  <span className={`px-2 py-0.5 text-xs rounded ${statusColors[log.toStatus]}`}>
                    {statusLabels[log.toStatus]}
                  </span>
                </div>
                {log.remark && (
                  <p className="text-sm text-gray-600">{log.remark}</p>
                )}
                <p className="text-xs text-gray-400 mt-2">
                  {formatDateTime(log.createdAt)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
