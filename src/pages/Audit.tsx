import React, { useEffect, useState } from 'react';
import { Database, CheckCircle, AlertCircle, Loader, ChevronRight, List, RefreshCw, Clock, BarChart3 } from 'lucide-react';
import { getSyncFlow, getSyncStats, getNodeLogs, getBatches, getBatchNodes } from '../services/api';
import type { SyncFlow, SyncStats, SyncLog, SyncBatch } from '../types';
import { SyncStatusBadge } from '../components/StatusBadge';
import KPICard from '../components/KPICard';

const Audit: React.FC = () => {
  const [flowData, setFlowData] = useState<SyncFlow[]>([]);
  const [stats, setStats] = useState<SyncStats[]>([]);
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [nodeLogs, setNodeLogs] = useState<SyncLog[]>([]);
  const [batches, setBatches] = useState<SyncBatch[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<string | null>(null);
  const [batchNodes, setBatchNodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'flow' | 'batches'>('flow');

  const loadData = async () => {
    setLoading(true);
    try {
      const [flowRes, statsRes, batchesRes] = await Promise.all([
        getSyncFlow(),
        getSyncStats(),
        getBatches({ pageSize: 20 }),
      ]);
      setFlowData(flowRes);
      setStats(statsRes);
      setBatches(batchesRes.data);
    } catch (error) {
      console.error('Failed to load audit data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleNodeClick = async (nodeId: string) => {
    setSelectedNode(nodeId);
    try {
      const logs = await getNodeLogs(nodeId, { pageSize: 30 });
      setNodeLogs(logs.data);
    } catch (error) {
      console.error('Failed to load node logs:', error);
    }
  };

  const handleBatchClick = async (batchId: string) => {
    setSelectedBatch(batchId);
    try {
      const nodes = await getBatchNodes(batchId);
      setBatchNodes(nodes);
    } catch (error) {
      console.error('Failed to load batch nodes:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-5 h-5 text-success-400" />;
      case 'failed': return <AlertCircle className="w-5 h-5 text-danger-400" />;
      case 'running': return <Loader className="w-5 h-5 text-info-400 animate-spin" />;
      default: return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'border-success-500/50 bg-success-500/10';
      case 'failed': return 'border-danger-500/50 bg-danger-500/10';
      case 'running': return 'border-info-500/50 bg-info-500/10 animate-pulse';
      default: return 'border-gray-500/50 bg-gray-500/10';
    }
  };

  const getSourceColor = (sourceType: string) => {
    switch (sourceType) {
      case 'door_lock': return 'from-primary-500 to-primary-600';
      case 'payment': return 'from-success-500 to-success-600';
      case 'ota': return 'from-warning-500 to-warning-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  if (loading && flowData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-white text-xl animate-pulse">加载中...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">取数链路审计</h1>
          <p className="text-gray-400">监控门锁记录、收款流水、OTA订单同步全流程</p>
        </div>
        <button
          onClick={loadData}
          className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          刷新数据
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat, idx) => (
          <KPICard
            key={stat.sourceType}
            icon={<Database className="w-6 h-6" />}
            label={stat.sourceTypeLabel}
            value={stat.total_records}
            change={stat.successRate}
            changeLabel="成功率"
            color={idx === 0 ? 'info' : idx === 1 ? 'success' : 'warning'}
            loading={false}
          />
        ))}
      </div>

      <div className="flex gap-4 border-b border-white/10">
        <button
          onClick={() => setActiveTab('flow')}
          className={`px-6 py-3 font-medium transition-all ${
            activeTab === 'flow'
              ? 'text-primary-400 border-b-2 border-primary-400'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <div className="flex items-center gap-2">
            <ChevronRight className="w-4 h-4" />
            节点流程图
          </div>
        </button>
        <button
          onClick={() => setActiveTab('batches')}
          className={`px-6 py-3 font-medium transition-all ${
            activeTab === 'batches'
              ? 'text-primary-400 border-b-2 border-primary-400'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <div className="flex items-center gap-2">
            <List className="w-4 h-4" />
            同步批次记录
          </div>
        </button>
      </div>

      {activeTab === 'flow' && (
        <div className="space-y-8">
          {flowData.map((flow) => (
            <div
              key={flow.sourceType}
              className="glass-card p-6 rounded-xl"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${getSourceColor(flow.sourceType)} flex items-center justify-center`}>
                    <Database className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{flow.sourceTypeLabel}</h3>
                    <p className="text-sm text-gray-400">共 {flow.nodes.length} 个处理节点</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedSource(selectedSource === flow.sourceType ? null : flow.sourceType)}
                  className="px-4 py-2 text-sm text-primary-400 border border-primary-400/50 rounded-lg hover:bg-primary-400/10 transition-all"
                >
                  {selectedSource === flow.sourceType ? '收起' : '展开详情'}
                </button>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-4">
                {flow.nodes.map((node, idx) => (
                  <React.Fragment key={node.id}>
                    <div
                      onClick={() => handleNodeClick(node.id)}
                      className={`flex-shrink-0 min-w-[180px] p-4 rounded-xl border-2 cursor-pointer transition-all hover:scale-105 ${
                        getStatusColor(node.status)
                      } ${selectedNode === node.id ? 'ring-2 ring-primary-400 ring-offset-2 ring-offset-slate-900' : ''}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-400">节点 {node.seq_order}</span>
                        {getStatusIcon(node.status)}
                      </div>
                      <h4 className="text-sm font-medium text-white mb-1">{node.name}</h4>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <span>成功: {node.success_count || 0}</span>
                        <span className="text-danger-400">失败: {node.fail_count || 0}</span>
                      </div>
                    </div>
                    {!node.isLast && (
                      <ChevronRight className="w-6 h-6 text-gray-500 flex-shrink-0" />
                    )}
                  </React.Fragment>
                ))}
              </div>

              {selectedSource === flow.sourceType && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <h4 className="text-sm font-medium text-white mb-3">节点运行统计</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                    {flow.nodes.map(node => (
                      <div key={node.id} className="bg-white/5 rounded-lg p-3">
                        <div className="text-xs text-gray-400 mb-1">{node.name}</div>
                        <div className="flex items-center gap-2">
                          <SyncStatusBadge status={node.status} />
                        </div>
                        <div className="text-xs text-gray-500 mt-2">
                          最近同步: {node.last_sync_time ? new Date(node.last_sync_time).toLocaleString('zh-CN') : 'N/A'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}

          {selectedNode && (
            <div className="glass-card p-6 rounded-xl">
              <h3 className="text-lg font-semibold text-white mb-4">节点同步日志</h3>
              {nodeLogs.length === 0 ? (
                <div className="text-gray-400 text-center py-8">暂无日志记录</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-400 border-b border-white/10">
                        <th className="pb-3 pr-4">批次号</th>
                        <th className="pb-3 pr-4">节点</th>
                        <th className="pb-3 pr-4">状态</th>
                        <th className="pb-3 pr-4">记录数</th>
                        <th className="pb-3 pr-4">耗时(ms)</th>
                        <th className="pb-3 pr-4">开始时间</th>
                        <th className="pb-3">错误详情</th>
                      </tr>
                    </thead>
                    <tbody>
                      {nodeLogs.map(log => (
                        <tr key={log.id} className="border-b border-white/5 hover:bg-white/5">
                          <td className="py-3 pr-4 font-mono text-xs text-gray-300">{log.batch_id.slice(0, 12)}...</td>
                          <td className="py-3 pr-4 text-white">{log.node_name}</td>
                          <td className="py-3 pr-4"><SyncStatusBadge status={log.status} /></td>
                          <td className="py-3 pr-4 text-white">{log.record_count}</td>
                          <td className="py-3 pr-4 text-white">{log.duration_ms}</td>
                          <td className="py-3 pr-4 text-gray-400">{new Date(log.started_at).toLocaleString('zh-CN')}</td>
                          <td className="py-3 text-danger-400 text-xs">{log.error_detail || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'batches' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 glass-card p-6 rounded-xl">
            <h3 className="text-lg font-semibold text-white mb-4">同步批次列表</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-400 border-b border-white/10">
                    <th className="pb-3 pr-4">批次ID</th>
                    <th className="pb-3 pr-4">类型</th>
                    <th className="pb-3 pr-4">状态</th>
                    <th className="pb-3 pr-4">总数</th>
                    <th className="pb-3 pr-4">成功</th>
                    <th className="pb-3 pr-4">失败</th>
                    <th className="pb-3">开始时间</th>
                  </tr>
                </thead>
                <tbody>
                  {batches.map(batch => (
                    <tr
                      key={batch.id}
                      onClick={() => handleBatchClick(batch.id)}
                      className={`border-b border-white/5 cursor-pointer transition-all ${
                        selectedBatch === batch.id ? 'bg-primary-500/10' : 'hover:bg-white/5'
                      }`}
                    >
                      <td className="py-3 pr-4 font-mono text-xs text-primary-400">{batch.id.slice(0, 16)}...</td>
                      <td className="py-3 pr-4 text-white">
                        {batch.source_type === 'door_lock' ? '门锁记录' : batch.source_type === 'payment' ? '收款流水' : 'OTA订单'}
                      </td>
                      <td className="py-3 pr-4"><SyncStatusBadge status={batch.status} /></td>
                      <td className="py-3 pr-4 text-white">{batch.total_count}</td>
                      <td className="py-3 pr-4 text-success-400">{batch.success_count}</td>
                      <td className="py-3 pr-4 text-danger-400">{batch.fail_count}</td>
                      <td className="py-3 text-gray-400">{new Date(batch.started_at).toLocaleString('zh-CN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {selectedBatch && (
            <div className="glass-card p-6 rounded-xl">
              <h3 className="text-lg font-semibold text-white mb-4">批次节点详情</h3>
              {batchNodes.length === 0 ? (
                <div className="text-gray-400 text-center py-8">暂无节点数据</div>
              ) : (
                <div className="space-y-3">
                  {batchNodes.map((node, idx) => (
                    <React.Fragment key={node.id}>
                      <div className={`p-3 rounded-lg border ${getStatusColor(node.status)}`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-white">{node.node_name}</span>
                          {getStatusIcon(node.status)}
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-400">记录数: {node.record_count}</span>
                          <span className="text-gray-400">耗时: {node.duration_ms}ms</span>
                        </div>
                      </div>
                      {idx < batchNodes.length - 1 && (
                        <div className="flex justify-center">
                          <ChevronRight className="w-5 h-5 text-gray-500" />
                        </div>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Audit;
