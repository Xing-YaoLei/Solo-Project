"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Pencil, Trash2, Save, X, Check, ChevronDown } from "lucide-react";
import clsx from "clsx";
import LoadingSkeleton from "@/components/loading-skeleton";
import type { ThresholdConfig, MetricType } from "@/lib/types";

const METRIC_TYPE_OPTIONS: { value: MetricType; label: string }[] = [
  { value: "CONGESTION", label: "拥堵" },
  { value: "SALES", label: "营收" },
  { value: "CANCELLATION", label: "取消" },
  { value: "STAY_DURATION", label: "停留时长" },
];

const METRIC_TYPE_LABELS: Record<MetricType, string> = {
  CONGESTION: "拥堵",
  SALES: "营收",
  CANCELLATION: "取消",
  STAY_DURATION: "停留时长",
};

interface FormData {
  metricType: MetricType;
  metricName: string;
  warnValue: number;
  criticalValue: number;
  unit: string;
  updatedBy: string;
}

type ToastType = "success" | "error";

interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

interface ScenicArea {
  id: string;
  name: string;
}

export default function ThresholdsPage() {
  const [scenicAreas, setScenicAreas] = useState<ScenicArea[]>([]);
  const [selectedAreaId, setSelectedAreaId] = useState<string>("");
  const [areaDropdownOpen, setAreaDropdownOpen] = useState(false);
  const [thresholds, setThresholds] = useState<ThresholdConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    metricType: "CONGESTION",
    metricName: "",
    warnValue: 0,
    criticalValue: 0,
    unit: "",
    updatedBy: "运营主管",
  });
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((type: ToastType, message: string) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  useEffect(() => {
    async function loadAreas() {
      try {
        const res = await fetch("/api/scenic-areas");
        if (!res.ok) throw new Error();
        const areas: ScenicArea[] = await res.json();
        setScenicAreas(areas);
        if (areas.length > 0) {
          setSelectedAreaId(areas[0].id);
        }
      } catch {
        setError("获取景区列表失败");
        setLoading(false);
      }
    }
    loadAreas();
  }, []);

  const fetchThresholds = useCallback(async () => {
    if (!selectedAreaId) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/thresholds?scenicAreaId=${selectedAreaId}`);
      if (!res.ok) throw new Error("获取阈值配置失败");
      const data = await res.json();
      setThresholds(data);
      setError(null);
    } catch {
      setError("获取阈值配置失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  }, [selectedAreaId]);

  useEffect(() => {
    fetchThresholds();
  }, [fetchThresholds]);

  const startEdit = (threshold: ThresholdConfig) => {
    setEditingId(threshold.id);
    setIsNew(false);
    setFormData({
      metricType: threshold.metricType,
      metricName: threshold.metricName,
      warnValue: threshold.warnValue,
      criticalValue: threshold.criticalValue,
      unit: threshold.unit,
      updatedBy: threshold.updatedBy,
    });
    setDeleteConfirmId(null);
  };

  const startNew = () => {
    setEditingId("new");
    setIsNew(true);
    setFormData({
      metricType: "CONGESTION",
      metricName: "",
      warnValue: 0,
      criticalValue: 0,
      unit: "",
      updatedBy: "运营主管",
    });
    setDeleteConfirmId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setIsNew(false);
  };

  const handleSave = async () => {
    if (!formData.metricName.trim()) {
      showToast("error", "指标名称不能为空");
      return;
    }
    if (formData.warnValue >= formData.criticalValue) {
      showToast("error", "警告值必须小于临界值");
      return;
    }

    try {
      if (isNew) {
        const res = await fetch("/api/thresholds", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...formData, scenicAreaId: selectedAreaId }),
        });
        if (!res.ok) throw new Error();
        showToast("success", "阈值配置新增成功");
      } else {
        const res = await fetch("/api/thresholds", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingId, ...formData }),
        });
        if (!res.ok) throw new Error();
        showToast("success", "阈值配置更新成功");
      }
      setEditingId(null);
      setIsNew(false);
      fetchThresholds();
    } catch {
      showToast("error", isNew ? "新增阈值配置失败" : "更新阈值配置失败");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch("/api/thresholds", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error();
      showToast("success", "阈值配置已删除");
      fetchThresholds();
    } catch {
      showToast("error", "删除阈值配置失败");
    } finally {
      setDeleteConfirmId(null);
    }
  };

  const selectedAreaName = scenicAreas.find((a) => a.id === selectedAreaId)?.name ?? "请选择景区";

  if (loading && thresholds.length === 0) {
    return (
      <div className="p-6">
        <LoadingSkeleton variant="table" />
      </div>
    );
  }

  if (error && scenicAreas.length === 0) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="card text-center">
          <p className="text-red-400 mb-2">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="rounded bg-[hsl(var(--primary))] px-4 py-2 text-sm text-white hover:opacity-90"
          >
            重试
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={clsx(
              "rounded-lg px-4 py-3 text-sm font-medium shadow-lg transition-all animate-in slide-in-from-right",
              toast.type === "success"
                ? "bg-green-500/90 text-white"
                : "bg-red-500/90 text-white"
            )}
          >
            {toast.type === "success" ? <Check className="mr-2 inline h-4 w-4" /> : <X className="mr-2 inline h-4 w-4" />}
            {toast.message}
          </div>
        ))}
      </div>

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">阈值配置</h1>
          <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">管理景区各项指标的预警和临界阈值</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              onClick={() => setAreaDropdownOpen(!areaDropdownOpen)}
              className="flex items-center gap-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-4 py-2 text-sm text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]/80 transition-colors"
            >
              <span>{selectedAreaName}</span>
              <ChevronDown className={clsx("h-4 w-4 transition-transform", areaDropdownOpen && "rotate-180")} />
            </button>
            {areaDropdownOpen && (
              <div className="absolute right-0 top-full z-10 mt-1 w-48 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] py-1 shadow-lg">
                {scenicAreas.map((area) => (
                  <button
                    key={area.id}
                    onClick={() => {
                      setSelectedAreaId(area.id);
                      setAreaDropdownOpen(false);
                      setEditingId(null);
                      setIsNew(false);
                    }}
                    className={clsx(
                      "w-full px-4 py-2 text-left text-sm transition-colors hover:bg-[hsl(var(--muted))]",
                      area.id === selectedAreaId
                        ? "text-[hsl(var(--primary))] font-medium"
                        : "text-[hsl(var(--foreground))]"
                    )}
                  >
                    {area.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={startNew}
            disabled={!selectedAreaId}
            className="flex items-center gap-2 rounded-lg bg-[hsl(var(--primary))] px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            新增阈值
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-[hsl(var(--border))]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[hsl(var(--border))] bg-[hsl(var(--muted))]/50">
              <th className="px-4 py-3 text-left font-medium text-[hsl(var(--muted-foreground))]">指标类型</th>
              <th className="px-4 py-3 text-left font-medium text-[hsl(var(--muted-foreground))]">指标名称</th>
              <th className="px-4 py-3 text-left font-medium text-[hsl(var(--muted-foreground))]">警告值</th>
              <th className="px-4 py-3 text-left font-medium text-[hsl(var(--muted-foreground))]">临界值</th>
              <th className="px-4 py-3 text-left font-medium text-[hsl(var(--muted-foreground))]">单位</th>
              <th className="px-4 py-3 text-left font-medium text-[hsl(var(--muted-foreground))]">更新人</th>
              <th className="px-4 py-3 text-left font-medium text-[hsl(var(--muted-foreground))]">最后更新</th>
              <th className="px-4 py-3 text-right font-medium text-[hsl(var(--muted-foreground))]">操作</th>
            </tr>
          </thead>
          <tbody>
            {isNew && editingId === "new" && (
              <tr className="border-b border-[hsl(var(--border))] bg-blue-500/5">
                <td className="px-4 py-3">
                  <select
                    value={formData.metricType}
                    onChange={(e) => setFormData({ ...formData, metricType: e.target.value as MetricType })}
                    className="w-full rounded border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-2 py-1.5 text-[hsl(var(--foreground))]"
                  >
                    {METRIC_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <input
                    type="text"
                    value={formData.metricName}
                    onChange={(e) => setFormData({ ...formData, metricName: e.target.value })}
                    placeholder="输入指标名称"
                    className="w-full rounded border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-2 py-1.5 text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))]"
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    type="number"
                    value={formData.warnValue}
                    onChange={(e) => setFormData({ ...formData, warnValue: Number(e.target.value) })}
                    className="w-20 rounded border border-yellow-500/50 bg-[hsl(var(--background))] px-2 py-1.5 text-yellow-400"
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    type="number"
                    value={formData.criticalValue}
                    onChange={(e) => setFormData({ ...formData, criticalValue: Number(e.target.value) })}
                    className="w-20 rounded border border-red-500/50 bg-[hsl(var(--background))] px-2 py-1.5 text-red-400"
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    type="text"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    placeholder="单位"
                    className="w-20 rounded border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-2 py-1.5 text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))]"
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    type="text"
                    value={formData.updatedBy}
                    onChange={(e) => setFormData({ ...formData, updatedBy: e.target.value })}
                    className="w-24 rounded border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-2 py-1.5 text-[hsl(var(--foreground))]"
                  />
                </td>
                <td className="px-4 py-3 text-[hsl(var(--muted-foreground))]">-</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={handleSave}
                      className="rounded p-1.5 text-green-400 hover:bg-green-400/10"
                      title="保存"
                    >
                      <Save className="h-4 w-4" />
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="rounded p-1.5 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]"
                      title="取消"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            )}
            {thresholds.map((threshold) => (
              editingId === threshold.id ? (
                <tr key={threshold.id} className="border-b border-[hsl(var(--border))] bg-blue-500/5">
                  <td className="px-4 py-3">
                    <select
                      value={formData.metricType}
                      onChange={(e) => setFormData({ ...formData, metricType: e.target.value as MetricType })}
                      className="w-full rounded border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-2 py-1.5 text-[hsl(var(--foreground))]"
                    >
                      {METRIC_TYPE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      value={formData.metricName}
                      onChange={(e) => setFormData({ ...formData, metricName: e.target.value })}
                      className="w-full rounded border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-2 py-1.5 text-[hsl(var(--foreground))]"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      value={formData.warnValue}
                      onChange={(e) => setFormData({ ...formData, warnValue: Number(e.target.value) })}
                      className="w-20 rounded border border-yellow-500/50 bg-[hsl(var(--background))] px-2 py-1.5 text-yellow-400"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      value={formData.criticalValue}
                      onChange={(e) => setFormData({ ...formData, criticalValue: Number(e.target.value) })}
                      className="w-20 rounded border border-red-500/50 bg-[hsl(var(--background))] px-2 py-1.5 text-red-400"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      className="w-20 rounded border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-2 py-1.5 text-[hsl(var(--foreground))]"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      value={formData.updatedBy}
                      onChange={(e) => setFormData({ ...formData, updatedBy: e.target.value })}
                      className="w-24 rounded border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-2 py-1.5 text-[hsl(var(--foreground))]"
                    />
                  </td>
                  <td className="px-4 py-3 text-[hsl(var(--muted-foreground))]">-</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={handleSave}
                        className="rounded p-1.5 text-green-400 hover:bg-green-400/10"
                        title="保存"
                      >
                        <Save className="h-4 w-4" />
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="rounded p-1.5 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]"
                        title="取消"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                <tr key={threshold.id} className="border-b border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))]/30 transition-colors">
                  <td className="px-4 py-3">
                    <span className="inline-flex rounded bg-[hsl(var(--muted))] px-2 py-0.5 text-xs font-medium text-[hsl(var(--foreground))]">
                      {METRIC_TYPE_LABELS[threshold.metricType]}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-[hsl(var(--foreground))]">{threshold.metricName}</td>
                  <td className="px-4 py-3 text-yellow-400 font-semibold">{threshold.warnValue}</td>
                  <td className="px-4 py-3 text-red-400 font-semibold">{threshold.criticalValue}</td>
                  <td className="px-4 py-3 text-[hsl(var(--muted-foreground))]">{threshold.unit}</td>
                  <td className="px-4 py-3 text-[hsl(var(--muted-foreground))]">{threshold.updatedBy}</td>
                  <td className="px-4 py-3 text-[hsl(var(--muted-foreground))]">
                    {new Date(threshold.updatedAt).toLocaleString("zh-CN")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => startEdit(threshold)}
                        className="rounded p-1.5 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]"
                        title="编辑"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      {deleteConfirmId === threshold.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDelete(threshold.id)}
                            className="rounded bg-red-500/20 px-2 py-1 text-xs text-red-400 hover:bg-red-500/30"
                          >
                            确认
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="rounded bg-[hsl(var(--muted))] px-2 py-1 text-xs text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                          >
                            取消
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirmId(threshold.id)}
                          className="rounded p-1.5 text-[hsl(var(--muted-foreground))] hover:bg-red-500/10 hover:text-red-400"
                          title="删除"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            ))}
            {thresholds.length === 0 && !isNew && selectedAreaId && (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-[hsl(var(--muted-foreground))]">
                  暂无阈值配置，点击&ldquo;新增阈值&rdquo;添加
                </td>
              </tr>
            )}
            {!selectedAreaId && (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-[hsl(var(--muted-foreground))]">
                  请先选择景区
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
