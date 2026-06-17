"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { KPICard } from "@/components/KPICard";
import { DataTable } from "@/components/DataTable";
import { Modal } from "@/components/Modal";
import {
  ClipboardList,
  CheckCircle,
  AlertTriangle,
  XCircle,
  ExternalLink,
  Package,
  FileSearch,
  Database,
  User,
  Calendar,
} from "lucide-react";
import {
  cn,
  formatDateTime,
  getStatusColorClass,
  getStatusLabel,
  formatCurrency,
} from "@/lib/utils";
import type { LoadingItemType, OriginalRecordType } from "@/types";

export default function LoadingListPage() {
  const [items, setItems] = useState<LoadingItemType[]>([]);
  const [stats, setStats] = useState({
    totalItems: 0,
    normalItems: 0,
    abnormalItems: 0,
    missingItems: 0,
  });
  const [selectedItem, setSelectedItem] = useState<LoadingItemType | null>(null);
  const [originalRecord, setOriginalRecord] = useState<OriginalRecordType | null>(null);
  const [recordModalOpen, setRecordModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch("/api/loading-list");
        const json = await res.json();
        setItems(json.data.list);
        setStats(json.data.stats);
      } catch (error) {
        console.error("加载数据失败:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleViewOriginal = async (item: LoadingItemType) => {
    setSelectedItem(item);
    setRecordModalOpen(true);
    try {
      const res = await fetch(`/api/loading-list/${item.originalRecordId}/original`);
      const json = await res.json();
      setOriginalRecord(json.data);
    } catch (error) {
      console.error("加载原始记录失败:", error);
    }
  };

  const StatusIcon = ({ status }: { status: string }) => {
    switch (status) {
      case "normal":
        return <CheckCircle size={14} />;
      case "abnormal":
        return <AlertTriangle size={14} />;
      case "missing":
        return <XCircle size={14} />;
      default:
        return null;
    }
  };

  const columns = [
    {
      key: "routeName",
      title: "路线",
      render: (row: LoadingItemType) => (
        <span className="badge-info">{row.routeName}</span>
      ),
    },
    {
      key: "orderNo",
      title: "关联工单",
      render: (row: LoadingItemType) => (
        <span className="font-mono text-primary">{row.orderNo}</span>
      ),
    },
    {
      key: "material",
      title: "物料信息",
      render: (row: LoadingItemType) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-surface-200 border border-border flex items-center justify-center">
            <Package size={14} className="text-muted" />
          </div>
          <div>
            <p className="font-medium">{row.materialName}</p>
            <p className="text-xs text-muted">
              {row.quantity} {row.unit}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "loaded",
      title: "装载情况",
      render: (row: LoadingItemType) => (
        <div className="flex items-center gap-2">
          <div className="w-24 h-2 bg-surface-300 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full",
                row.status === "normal"
                  ? "bg-success"
                  : row.status === "abnormal"
                  ? "bg-warning"
                  : "bg-danger"
              )}
              style={{
                width: `${((row.loadedQuantity ?? 0) / row.quantity) * 100}%`,
              }}
            />
          </div>
          <span className="text-xs font-mono">
            {row.loadedQuantity ?? 0}/{row.quantity} {row.unit}
          </span>
        </div>
      ),
    },
    {
      key: "status",
      title: "状态",
      render: (row: LoadingItemType) => (
        <span className={getStatusColorClass(row.status)}>
          <StatusIcon status={row.status} />
          <span className="ml-1">{getStatusLabel(row.status)}</span>
        </span>
      ),
    },
    {
      key: "remark",
      title: "异常说明",
      render: (row: LoadingItemType) => (
        <span className={cn("text-sm", row.status !== "normal" ? "text-warning" : "text-muted")}>
          {row.remark || "无"}
        </span>
      ),
    },
    {
      key: "action",
      title: "原始记录",
      render: (row: LoadingItemType) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleViewOriginal(row);
          }}
          className="btn-primary !px-2.5 !py-1 text-xs inline-flex items-center gap-1"
        >
          <ExternalLink size={12} />
          追溯
        </button>
      ),
    },
  ];

  const groupedItems = items.reduce<Record<string, LoadingItemType[]>>((acc, item) => {
    if (!acc[item.routeName]) acc[item.routeName] = [];
    acc[item.routeName].push(item);
    return acc;
  }, {});

  return (
    <div>
      <Header title="装载清单与异常追溯" subtitle="装载明细与原始录入记录关联排查" />
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="装载明细总数"
            value={stats.totalItems}
            accentColor="primary"
            icon={<ClipboardList size={20} />}
          />
          <KPICard
            title="正常装载"
            value={stats.normalItems}
            accentColor="success"
            icon={<CheckCircle size={20} />}
          />
          <KPICard
            title="装载异常"
            value={stats.abnormalItems}
            accentColor="warning"
            icon={<AlertTriangle size={20} />}
          />
          <KPICard
            title="物料缺失"
            value={stats.missingItems}
            accentColor="danger"
            icon={<XCircle size={20} />}
          />
        </div>

        <div className="glass-card p-5 gradient-border">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-display font-semibold flex items-center gap-2">
                <ClipboardList size={18} className="text-primary" />
                装载清单明细
              </h3>
              <p className="text-xs text-muted mt-0.5">
                点击「追溯」查看原始录入记录，排查口径偏差
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              {Object.entries(groupedItems).map(([route, routeItems]) => {
                const abnormalCount = routeItems.filter(
                  (i) => i.status !== "normal"
                ).length;
                return (
                  <div key={route} className="flex items-center gap-1.5">
                    <span className="text-muted">{route}</span>
                    <span className="font-mono">{routeItems.length}</span>
                    {abnormalCount > 0 && (
                      <span className="badge-danger">{abnormalCount}异常</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          <div className="-mx-5 -mb-5">
            <DataTable
              columns={columns}
              data={items}
              rowKey="id"
              onRowClick={handleViewOriginal}
              maxHeight="560px"
              className="!rounded-none border-x-0 border-b-0"
            />
          </div>
        </div>

        {items.filter((i) => i.status !== "normal").length > 0 && (
          <div className="glass-card p-5 gradient-border">
            <div className="mb-4">
              <h3 className="text-base font-display font-semibold flex items-center gap-2">
                <FileSearch size={18} className="text-warning" />
                异常点解释面板
              </h3>
              <p className="text-xs text-muted mt-0.5">
                关联异常工单与装载清单的关系说明
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {items
                .filter((i) => i.status !== "normal")
                .slice(0, 6)
                .map((item) => (
                  <div
                    key={item.id}
                    className={cn(
                      "glass-card p-4 border-l-4 cursor-pointer transition-all hover:shadow-glow",
                      item.status === "abnormal"
                        ? "border-warning"
                        : "border-danger"
                    )}
                    onClick={() => handleViewOriginal(item)}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{item.materialName}</p>
                        <p className="text-xs text-muted mt-0.5 font-mono">
                          {item.orderNo} · {item.routeName}
                        </p>
                      </div>
                      <span className={getStatusColorClass(item.status)}>
                        <StatusIcon status={item.status} />
                        <span className="ml-1">{getStatusLabel(item.status)}</span>
                      </span>
                    </div>
                    <div className="mt-3 pt-3 border-t border-border/50">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted">应装载</span>
                        <span className="font-mono">
                          {item.quantity} {item.unit}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm mt-1">
                        <span className="text-muted">实装载</span>
                        <span
                          className={cn(
                            "font-mono",
                            (item.loadedQuantity ?? 0) < item.quantity
                              ? "text-danger"
                              : ""
                          )}
                        >
                          {item.loadedQuantity ?? 0} {item.unit}
                        </span>
                      </div>
                      {item.remark && (
                        <div className="mt-2 p-2 bg-warning/10 rounded text-xs text-warning">
                          {item.remark}
                        </div>
                      )}
                    </div>
                    <div className="mt-3 flex items-center gap-1 text-xs text-primary hover:underline">
                      <ExternalLink size={12} />
                      追溯原始记录
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      <Modal
        open={recordModalOpen}
        onClose={() => setRecordModalOpen(false)}
        title="原始录入记录"
        subtitle={`记录编号: ${selectedItem?.originalRecordId}`}
        size="lg"
      >
        {selectedItem && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="glass-card p-4">
                <h4 className="text-sm font-medium text-primary mb-3 flex items-center gap-2">
                  <ClipboardList size={14} />
                  装载清单信息
                </h4>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted">工单号</dt>
                    <dd className="font-mono text-primary">{selectedItem.orderNo}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted">路线</dt>
                    <dd>{selectedItem.routeName}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted">物料名称</dt>
                    <dd>{selectedItem.materialName}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted">应装载数量</dt>
                    <dd className="font-mono">
                      {selectedItem.quantity} {selectedItem.unit}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted">实际装载</dt>
                    <dd
                      className={cn(
                        "font-mono",
                        (selectedItem.loadedQuantity ?? 0) < selectedItem.quantity &&
                          "text-danger font-medium"
                      )}
                    >
                      {selectedItem.loadedQuantity ?? 0} {selectedItem.unit}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted">状态</dt>
                    <dd className={getStatusColorClass(selectedItem.status)}>
                      {getStatusLabel(selectedItem.status)}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="glass-card p-4">
                <h4 className="text-sm font-medium text-warning mb-3 flex items-center gap-2">
                  <Database size={14} />
                  原始录入记录
                </h4>
                {!originalRecord ? (
                  <div className="py-8 text-center text-muted">加载中...</div>
                ) : (
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-muted">物料名称</dt>
                      <dd className="font-mono">{originalRecord.materialName}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted">录入数量</dt>
                      <dd className="font-mono">
                        {originalRecord.quantity} {originalRecord.unit}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted">录入人</dt>
                      <dd className="flex items-center gap-1">
                        <User size={12} className="text-muted" />
                        {originalRecord.enteredBy}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted">录入时间</dt>
                      <dd className="flex items-center gap-1 font-mono">
                        <Calendar size={12} className="text-muted" />
                        {formatDateTime(originalRecord.enteredAt)}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted">数据来源</dt>
                      <dd>{originalRecord.source}</dd>
                    </div>
                  </dl>
                )}
              </div>
            </div>

            {originalRecord && (
              <div className="glass-card p-4">
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <FileSearch size={14} className="text-primary" />
                  口径偏差排查
                </h4>
                {selectedItem.remark ? (
                  <div className="space-y-3">
                    <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg">
                      <p className="text-sm text-warning">
                        <AlertTriangle size={14} className="inline mr-1" />
                        检测到差异: {selectedItem.remark}
                      </p>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-sm">
                      <div className="p-3 bg-surface-200 rounded-lg">
                        <p className="text-xs text-muted mb-1">装载清单</p>
                        <p className="font-mono font-medium text-danger">
                          {selectedItem.loadedQuantity ?? 0} {selectedItem.unit}
                        </p>
                      </div>
                      <div className="p-3 bg-surface-200 rounded-lg">
                        <p className="text-xs text-muted mb-1">原始记录</p>
                        <p className="font-mono font-medium text-success">
                          {originalRecord.quantity} {originalRecord.unit}
                        </p>
                      </div>
                      <div className="p-3 bg-surface-200 rounded-lg">
                        <p className="text-xs text-muted mb-1">差异</p>
                        <p
                          className={cn(
                            "font-mono font-bold",
                            (selectedItem.loadedQuantity ?? 0) - originalRecord.quantity !==
                              0 && "text-danger"
                          )}
                        >
                          {(selectedItem.loadedQuantity ?? 0) - originalRecord.quantity > 0
                            ? "+"
                            : ""}
                          {(selectedItem.loadedQuantity ?? 0) - originalRecord.quantity}{" "}
                          {selectedItem.unit}
                        </p>
                      </div>
                    </div>
                    <div className="p-3 bg-surface-200 rounded-lg">
                      <p className="text-xs text-muted mb-2">原始录入扩展信息</p>
                      <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                        {Object.entries(originalRecord.rawData).map(([k, v]) => (
                          <div key={k} className="flex justify-between">
                            <span className="text-muted">{k}</span>
                            <span>{String(v)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-success/10 border border-success/20 rounded-lg text-sm text-success flex items-center gap-2">
                    <CheckCircle size={16} />
                    装载数据与原始记录一致，无口径偏差
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button className="btn-secondary" onClick={() => setRecordModalOpen(false)}>
                关闭
              </button>
              <button className="btn-primary inline-flex items-center gap-2">
                <ExternalLink size={16} />
                导出排查报告
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
