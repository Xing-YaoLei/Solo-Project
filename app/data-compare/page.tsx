"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { KPICard } from "@/components/KPICard";
import { DataTable } from "@/components/DataTable";
import { Modal } from "@/components/Modal";
import { AlertTriangle, FileText, GitCompare, ArrowUpRight, Database, CreditCard } from "lucide-react";
import { formatCurrency, formatDateTime, getStatusColorClass, getStatusLabel, cn } from "@/lib/utils";
import type { DataDifference, PaymentVersion } from "@/types";

export default function DataComparePage() {
  const [differences, setDifferences] = useState<DataDifference[]>([]);
  const [payments, setPayments] = useState<PaymentVersion[]>([]);
  const [diffStats, setDiffStats] = useState({ totalCount: 0, affectedOrders: 0, totalDiffAmount: 0 });
  const [paymentStats, setPaymentStats] = useState({ totalChanges: 0, affectedOrders: 0 });
  const [selectedDiff, setSelectedDiff] = useState<DataDifference | null>(null);
  const [activeTab, setActiveTab] = useState<"differences" | "payments">("differences");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [diffRes, paymentRes] = await Promise.all([
          fetch("/api/data-compare/differences?limit=25"),
          fetch("/api/data-compare/payments"),
        ]);
        const diffJson = await diffRes.json();
        const paymentJson = await paymentRes.json();
        setDifferences(diffJson.data.list);
        setDiffStats(diffJson.data.stats);
        setPayments(paymentJson.data.list);
        setPaymentStats(paymentJson.data.stats);
      } catch (error) {
        console.error("加载数据失败:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const diffColumns = [
    {
      key: "orderNo",
      title: "工单号",
      render: (row: DataDifference) => (
        <span className="font-mono text-primary">{row.orderNo}</span>
      ),
    },
    {
      key: "diffFields",
      title: "差异字段",
      render: (row: DataDifference) => (
        <div className="flex flex-wrap gap-1">
          {row.diffFields.map((f) => (
            <span key={f} className="badge-danger">
              {f}
            </span>
          ))}
        </div>
      ),
    },
    {
      key: "crmAmount",
      title: "CRM 金额",
      render: (row: DataDifference) => (
        <span className="font-mono">
          {formatCurrency(Number((row.crmValue.amount as number) ?? 0))}
        </span>
      ),
      align: "right" as const,
    },
    {
      key: "meterAmount",
      title: "抄表金额",
      render: (row: DataDifference) => (
        <span className="font-mono">
          {formatCurrency(Number((row.meterValue.amount as number) ?? 0))}
        </span>
      ),
      align: "right" as const,
    },
    {
      key: "diffAmount",
      title: "差额",
      render: (row: DataDifference) => (
        <span
          className={cn(
            "font-mono font-medium",
            (row.diffAmount ?? 0) > 0 ? "text-success" : "text-danger"
          )}
        >
          {(row.diffAmount ?? 0) > 0 ? "+" : ""}
          {formatCurrency(row.diffAmount ?? 0)}
        </span>
      ),
      align: "right" as const,
      highlight: (row: DataDifference) => Math.abs(row.diffAmount ?? 0) > 50,
    },
    {
      key: "createdAt",
      title: "发现时间",
      render: (row: DataDifference) => formatDateTime(row.createdAt),
    },
    {
      key: "action",
      title: "操作",
      render: (row: DataDifference) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setSelectedDiff(row);
          }}
          className="btn-primary !px-2.5 !py-1 text-xs inline-flex items-center gap-1"
        >
          <FileText size={12} />
          详情
        </button>
      ),
    },
  ];

  const paymentColumns = [
    {
      key: "orderNo",
      title: "工单号",
      render: (row: PaymentVersion) => (
        <span className="font-mono text-primary">{row.orderNo}</span>
      ),
    },
    {
      key: "version",
      title: "版本",
      render: (row: PaymentVersion) => (
        <span className="badge-info">v{row.version}</span>
      ),
    },
    {
      key: "amount",
      title: "金额",
      render: (row: PaymentVersion) => (
        <span className="font-mono">{formatCurrency(row.amount)}</span>
      ),
      align: "right" as const,
    },
    {
      key: "status",
      title: "状态",
      render: (row: PaymentVersion) => (
        <span className={getStatusColorClass(row.status)}>
          {getStatusLabel(row.status)}
        </span>
      ),
    },
    {
      key: "operator",
      title: "操作人",
    },
    {
      key: "changeReason",
      title: "变更原因",
    },
    {
      key: "changedAt",
      title: "变更时间",
      render: (row: PaymentVersion) => formatDateTime(row.changedAt),
    },
  ];

  return (
    <div>
      <Header
        title="数据口径差异对比"
        subtitle="CRM、支付流水与抄表数据口径差异明细"
      />
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="差异记录数"
            value={diffStats.totalCount}
            accentColor="danger"
            icon={<GitCompare size={20} />}
          />
          <KPICard
            title="涉及工单数"
            value={diffStats.affectedOrders}
            accentColor="warning"
            icon={<AlertTriangle size={20} />}
          />
          <KPICard
            title="累计差额"
            value={diffStats.totalDiffAmount}
            format="currency"
            accentColor="danger"
            icon={<ArrowUpRight size={20} />}
          />
          <KPICard
            title="支付变更次数"
            value={paymentStats.totalChanges}
            accentColor="primary"
            icon={<CreditCard size={20} />}
          />
        </div>

        <div className="glass-card p-1 inline-flex rounded-lg">
          <button
            onClick={() => setActiveTab("differences")}
            className={cn(
              "px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2",
              activeTab === "differences"
                ? "bg-primary/20 text-primary shadow-glow"
                : "text-muted hover:text-foreground"
            )}
          >
            <Database size={16} />
            CRM 与抄表差异
          </button>
          <button
            onClick={() => setActiveTab("payments")}
            className={cn(
              "px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2",
              activeTab === "payments"
                ? "bg-primary/20 text-primary shadow-glow"
                : "text-muted hover:text-foreground"
            )}
          >
            <CreditCard size={16} />
            支付流水版本
          </button>
        </div>

        {activeTab === "differences" && (
          <DataTable
            columns={diffColumns}
            data={differences}
            rowKey="id"
            onRowClick={setSelectedDiff}
            maxHeight="560px"
          />
        )}

        {activeTab === "payments" && (
          <DataTable
            columns={paymentColumns}
            data={payments}
            rowKey="id"
            maxHeight="560px"
          />
        )}
      </div>

      <Modal
        open={!!selectedDiff}
        onClose={() => setSelectedDiff(null)}
        title="差异记录详情"
        subtitle={selectedDiff?.orderNo}
        size="lg"
      >
        {selectedDiff && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="glass-card p-4">
                <h4 className="text-sm font-medium text-primary mb-3 flex items-center gap-2">
                  <Database size={14} />
                  CRM 系统数据
                </h4>
                <dl className="space-y-2 text-sm">
                  {Object.entries(selectedDiff.crmValue).map(([k, v]) => (
                    <div key={k} className="flex justify-between">
                      <dt className="text-muted">{k}</dt>
                      <dd className="font-mono">{String(v)}</dd>
                    </div>
                  ))}
                </dl>
              </div>
              <div className="glass-card p-4">
                <h4 className="text-sm font-medium text-warning mb-3 flex items-center gap-2">
                  <AlertTriangle size={14} />
                  抄表系统数据
                </h4>
                <dl className="space-y-2 text-sm">
                  {Object.entries(selectedDiff.meterValue).map(([k, v]) => {
                    const crmVal = selectedDiff.crmValue[k];
                    const hasDiff = selectedDiff.diffFields.includes(k);
                    return (
                      <div key={k} className="flex justify-between">
                        <dt className="text-muted">{k}</dt>
                        <dd
                          className={cn(
                            "font-mono",
                            hasDiff && "text-danger font-medium"
                          )}
                        >
                          {String(v)}
                          {hasDiff && crmVal !== v && (
                            <span className="ml-2 text-xs">
                              (CRM: {String(crmVal)})
                            </span>
                          )}
                        </dd>
                      </div>
                    );
                  })}
                </dl>
              </div>
            </div>

            <div className="glass-card p-4">
              <h4 className="text-sm font-medium mb-3">差异字段分析</h4>
              <div className="flex flex-wrap gap-2">
                {selectedDiff.diffFields.map((f) => (
                  <span key={f} className="badge-danger px-3 py-1">
                    {f}
                  </span>
                ))}
              </div>
              {selectedDiff.diffAmount !== undefined && (
                <div className="mt-4 pt-4 border-t border-border/50">
                  <div className="flex justify-between items-center">
                    <span className="text-muted">金额差异</span>
                    <span
                      className={cn(
                        "text-xl font-display font-bold font-mono",
                        selectedDiff.diffAmount > 0 ? "text-success" : "text-danger"
                      )}
                    >
                      {selectedDiff.diffAmount > 0 ? "+" : ""}
                      {formatCurrency(selectedDiff.diffAmount)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
