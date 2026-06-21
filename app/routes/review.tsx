import { useState, useEffect } from "react";
import { useLoaderData } from "@remix-run/react";
import { json } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const year = url.searchParams.get("year") || String(currentYear);
  const month = url.searchParams.get("month") || String(currentMonth);

  const apiBase =
    process.env.API_BASE_URL ||
    `${url.protocol}//${url.host}/api`;

  try {
    const [reviewRes, turnoverRes] = await Promise.all([
      fetch(`${apiBase}/review/monthly?year=${year}&month=${month}`),
      fetch(`${apiBase}/review/inventory-turnover?month=${year}-${month.padStart(2, "0")}&pageSize=100`),
    ]);
    const review = await reviewRes.json();
    const turnover = await turnoverRes.json();
    return json({ review, turnover, year: Number(year), month: Number(month) });
  } catch (error) {
    return json({ review: null, turnover: { list: [], stats: {} }, year: currentYear, month: currentMonth });
  }
}

export default function Review() {
  const { review, turnover, year, month } = useLoaderData<typeof loader>();
  const [selectedYear, setSelectedYear] = useState(year);
  const [selectedMonth, setSelectedMonth] = useState(month);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  const handleSync = async () => {
    if (!confirm("确定要同步库存周转数据吗？")) return;
    try {
      await fetch("/api/review/sync", { method: "POST" });
      alert("同步成功");
      window.location.reload();
    } catch (error) {
      alert("同步失败");
    }
  };

  const handleExport = async () => {
    setExportLoading(true);
    try {
      const res = await fetch("/api/export/inventory-turnover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          month: `${selectedYear}-${String(selectedMonth).padStart(2, "0")}`,
        }),
      });
      const data = await res.json();
      if (data.fileUrl) {
        window.open(data.fileUrl, "_blank");
      }
      setShowExportModal(false);
    } catch (error) {
      alert("导出失败");
    } finally {
      setExportLoading(false);
    }
  };

  const formatDate = (date: string) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("zh-CN");
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; className: string }> = {
      "in-stock": { label: "在库", className: "badge badge-info" },
      sold: { label: "已售出", className: "badge badge-warning" },
      transferred: { label: "已过户", className: "badge badge-success" },
    };
    const s = map[status] || { label: status, className: "badge badge-info" };
    return <span className={s.className}>{s.label}</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">月底复盘</h2>
          <p className="mt-1 text-sm text-gray-500">库存周转分析与销售数据统计</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary" onClick={handleSync}>
            同步数据
          </button>
          <button className="btn-primary" onClick={() => setShowExportModal(true)}>
            导出数据
          </button>
        </div>
      </div>

      <div className="card">
        <div className="flex gap-4 items-center">
          <div>
            <label className="label">年份</label>
            <select
              className="input"
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
            >
              {[2024, 2025, 2026].map((y) => (
                <option key={y} value={y}>
                  {y}年
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">月份</label>
            <select
              className="input"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>
                  {m}月
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1"></div>
          <button
            className="btn-primary mt-6"
            onClick={() => {
              const url = new URL(window.location.href);
              url.searchParams.set("year", String(selectedYear));
              url.searchParams.set("month", String(selectedMonth));
              window.location.href = url.toString();
            }}
          >
            查询
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card">
          <p className="text-sm text-gray-500">总车辆数</p>
          <p className="text-3xl font-bold mt-2">{review?.monthStats?.totalCars || 0}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">本月售出</p>
          <p className="text-3xl font-bold mt-2 text-green-600">
            {review?.monthStats?.soldCount || 0}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">售出率</p>
          <p className="text-3xl font-bold mt-2 text-primary-600">
            {review?.monthStats?.soldRate || 0}%
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">本月利润</p>
          <p className="text-3xl font-bold mt-2 text-yellow-600">
            ¥{(review?.monthStats?.totalProfit || 0)?.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="font-semibold mb-4">周转效率</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">平均库龄</span>
              <span className="font-medium">
                {review?.monthStats?.avgDaysInStock || 0} 天
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">平均售出耗时</span>
              <span className="font-medium">
                {review?.monthStats?.avgDaysToSell || 0} 天
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">平均利润率</span>
              <span className="font-medium text-green-600">
                {review?.monthStats?.avgProfitMargin || 0}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">库存超30天</span>
              <span className="font-medium text-yellow-600">
                {review?.monthStats?.currentlyOver30 || 0} 台
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">库存超60天</span>
              <span className="font-medium text-red-600">
                {review?.monthStats?.currentlyOver60 || 0} 台
              </span>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="font-semibold mb-4">营收概览</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">总营收</span>
              <span className="font-medium text-lg">
                ¥{(review?.monthStats?.totalRevenue || 0)?.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">总成本</span>
              <span className="font-medium">
                ¥{(review?.monthStats?.totalCost || 0)?.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">总利润</span>
              <span className="font-medium text-lg text-green-600">
                ¥{(review?.monthStats?.totalProfit || 0)?.toLocaleString()}
              </span>
            </div>
            <hr />
            <div>
              <p className="text-sm text-gray-500 mb-2">季度对比</p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">季度售出</p>
                  <p className="font-semibold text-lg">
                    {review?.quarterStats?.soldCount || 0}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">季度利润</p>
                  <p className="font-semibold text-lg text-green-600">
                    ¥{(review?.quarterStats?.totalProfit || 0)?.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="font-semibold mb-4">库存周转明细</h3>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>品牌/车型</th>
                <th>VIN码</th>
                <th>入库日期</th>
                <th>售出日期</th>
                <th>过户日期</th>
                <th>库龄(天)</th>
                <th>采购价</th>
                <th>售价</th>
                <th>利润</th>
                <th>利润率</th>
                <th>状态</th>
              </tr>
            </thead>
            <tbody>
              {turnover?.list?.length === 0 ? (
                <tr>
                  <td colSpan={11} className="text-center py-8 text-gray-500">
                    暂无数据
                  </td>
                </tr>
              ) : (
                turnover?.list?.map((item: any) => (
                  <tr key={item._id}>
                    <td>
                      <p className="font-medium">
                        {item.brand} {item.model}
                      </p>
                      <p className="text-xs text-gray-500">{item.year}年款</p>
                    </td>
                    <td className="font-mono text-sm">{item.vin?.slice(-8)}</td>
                    <td>{formatDate(item.inStockDate)}</td>
                    <td>{formatDate(item.soldDate)}</td>
                    <td>{formatDate(item.transferredDate)}</td>
                    <td
                      className={
                        item.daysInStock > 60
                          ? "text-red-600 font-medium"
                          : item.daysInStock > 30
                          ? "text-yellow-600 font-medium"
                          : ""
                      }
                    >
                      {item.daysInStock || "-"}
                    </td>
                    <td>¥{item.purchasePrice?.toLocaleString() || 0}</td>
                    <td className="text-primary-600 font-medium">
                      ¥{item.sellingPrice?.toLocaleString() || 0}
                    </td>
                    <td
                      className={
                        item.profit >= 0 ? "text-green-600" : "text-red-600"
                      }
                    >
                      ¥{item.profit?.toLocaleString() || 0}
                    </td>
                    <td>{item.profitMargin?.toFixed(2) || 0}%</td>
                    <td>{getStatusBadge(item.status)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h3 className="font-semibold mb-4">滞销车辆提醒（按入库时间排序）</h3>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>品牌/车型</th>
                <th>VIN码</th>
                <th>入库日期</th>
                <th>当前库龄</th>
                <th>采购价</th>
              </tr>
            </thead>
            <tbody>
              {review?.slowMovingCars?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-500">
                    暂无数据
                  </td>
                </tr>
              ) : (
                review?.slowMovingCars?.slice(0, 5)?.map((item: any) => {
                  const days =
                    (new Date().getTime() - new Date(item.inStockDate).getTime()) /
                    (1000 * 60 * 60 * 24);
                  return (
                    <tr key={item._id}>
                      <td>
                        <p className="font-medium">
                          {item.brand} {item.model}
                        </p>
                      </td>
                      <td className="font-mono text-sm">{item.vin?.slice(-8)}</td>
                      <td>{formatDate(item.inStockDate)}</td>
                      <td
                        className={
                          days > 60
                            ? "text-red-600 font-bold"
                            : days > 30
                            ? "text-yellow-600 font-medium"
                            : ""
                        }
                      >
                        {Math.floor(days)} 天
                      </td>
                      <td>¥{item.purchasePrice?.toLocaleString() || 0}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl max-w-md w-full mx-4">
            <div className="p-6 border-b">
              <h3 className="text-xl font-bold">导出库存周转数据</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="label">导出范围</label>
                <p className="text-sm text-gray-600">
                  {selectedYear}年{selectedMonth}月 库存周转数据
                </p>
              </div>
              <p className="text-sm text-gray-500">
                导出文件将包含筛选范围、生成时间和操作人信息
              </p>
            </div>
            <div className="p-6 border-t flex justify-end gap-2">
              <button
                className="btn-secondary"
                onClick={() => setShowExportModal(false)}
                disabled={exportLoading}
              >
                取消
              </button>
              <button
                className="btn-primary"
                onClick={handleExport}
                disabled={exportLoading}
              >
                {exportLoading ? "导出中..." : "确认导出"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
