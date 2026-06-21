import { useState, useEffect } from "react";
import { json } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const apiBase =
    process.env.API_BASE_URL ||
    `${url.protocol}//${url.host}/api`;

  try {
    const res = await fetch(`${apiBase}/export/records?pageSize=20`);
    const data = await res.json();
    return json({ exports: data });
  } catch (error) {
    return json({ exports: { list: [], total: 0 } });
  }
}

export default function ExportPage() {
  const { exports } = useLoaderData<typeof loader>();
  const [exportType, setExportType] = useState("inventory-turnover");
  const [exportParams, setExportParams] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [exportList, setExportList] = useState(exports?.list || []);

  const handleExport = async () => {
    if (!confirm("确定要导出数据吗？")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/export/${exportType}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(exportParams),
      });
      const data = await res.json();
      if (data.fileUrl) {
        window.open(data.fileUrl, "_blank");
      }
      fetchRecords();
    } catch (error) {
      alert("导出失败");
    } finally {
      setLoading(false);
    }
  };

  const fetchRecords = async () => {
    try {
      const res = await fetch("/api/export/records?pageSize=20");
      const data = await res.json();
      setExportList(data.list || []);
    } catch (error) {
      console.error(error);
    }
  };

  const getTypeName = (type: string) => {
    const map: Record<string, string> = {
      "inventory-turnover": "库存周转",
      "transfer-materials": "过户材料",
      "finance-data": "金融资料",
      "operation-logs": "操作日志",
      custom: "自定义导出",
    };
    return map[type] || type;
  };

  const formatDateTime = (date: string) => {
    if (!date) return "-";
    return new Date(date).toLocaleString("zh-CN");
  };

  const renderParamsForm = () => {
    switch (exportType) {
      case "inventory-turnover":
        return (
          <>
            <div>
              <label className="label">月份 (格式: 2026-06)</label>
              <input
                type="text"
                className="input"
                placeholder="例：2026-06"
                value={exportParams.month || ""}
                onChange={(e) =>
                  setExportParams({ ...exportParams, month: e.target.value })
                }
              />
            </div>
            <div>
              <label className="label">状态</label>
              <select
                className="input"
                value={exportParams.status || ""}
                onChange={(e) =>
                  setExportParams({ ...exportParams, status: e.target.value })
                }
              >
                <option value="">全部</option>
                <option value="in-stock">在库</option>
                <option value="sold">已售出</option>
                <option value="transferred">已过户</option>
              </select>
            </div>
          </>
        );
      case "transfer-materials":
        return (
          <div>
            <label className="label">整体状态</label>
            <select
              className="input"
              value={exportParams.overallStatus || ""}
              onChange={(e) =>
                setExportParams({ ...exportParams, overallStatus: e.target.value })
              }
            >
              <option value="">全部</option>
              <option value="incomplete">资料不完整</option>
              <option value="submitting">提交中</option>
              <option value="reviewing">审核中</option>
              <option value="approved">已通过</option>
              <option value="rejected">已驳回</option>
            </select>
          </div>
        );
      case "finance-data":
        return (
          <div>
            <label className="label">结算状态</label>
            <select
              className="input"
              value={exportParams.settlementStatus || ""}
              onChange={(e) =>
                setExportParams({ ...exportParams, settlementStatus: e.target.value })
              }
            >
              <option value="">全部</option>
              <option value="pending">待处理</option>
              <option value="in-progress">处理中</option>
              <option value="completed">已完成</option>
              <option value="on-hold">搁置</option>
            </select>
          </div>
        );
      case "operation-logs":
        return (
          <>
            <div>
              <label className="label">模块</label>
              <select
                className="input"
                value={exportParams.module || ""}
                onChange={(e) =>
                  setExportParams({ ...exportParams, module: e.target.value })
                }
              >
                <option value="">全部</option>
                <option value="transfer-material">过户材料</option>
                <option value="finance-data">金融资料</option>
                <option value="preparation">整备清单</option>
                <option value="test-drive">试驾记录</option>
                <option value="quote">报价记录</option>
                <option value="car">车辆管理</option>
                <option value="export">数据导出</option>
                <option value="system">系统</option>
              </select>
            </div>
            <div>
              <label className="label">状态</label>
              <select
                className="input"
                value={exportParams.status || ""}
                onChange={(e) =>
                  setExportParams({ ...exportParams, status: e.target.value })
                }
              >
                <option value="">全部</option>
                <option value="open">进行中</option>
                <option value="closed">已关闭</option>
                <option value="failed">失败</option>
              </select>
            </div>
            <div>
              <label className="label">开始日期</label>
              <input
                type="date"
                className="input"
                value={exportParams.startDate || ""}
                onChange={(e) =>
                  setExportParams({ ...exportParams, startDate: e.target.value })
                }
              />
            </div>
            <div>
              <label className="label">结束日期</label>
              <input
                type="date"
                className="input"
                value={exportParams.endDate || ""}
                onChange={(e) =>
                  setExportParams({ ...exportParams, endDate: e.target.value })
                }
              />
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">数据导出</h2>
        <p className="mt-1 text-sm text-gray-500">
          导出各类数据报表，自动包含筛选范围、生成时间和操作人信息
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">新建导出</h3>

          <div className="space-y-4">
            <div>
              <label className="label">导出类型</label>
              <select
                className="input"
                value={exportType}
                onChange={(e) => {
                  setExportType(e.target.value);
                  setExportParams({});
                }}
              >
                <option value="inventory-turnover">库存周转数据</option>
                <option value="transfer-materials">过户材料数据</option>
                <option value="finance-data">金融资料数据</option>
                <option value="operation-logs">操作日志数据</option>
              </select>
            </div>

            <div className="space-y-3">{renderParamsForm()}</div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>📌 导出文件将包含：</strong>
              </p>
              <ul className="text-sm text-blue-700 mt-2 list-disc list-inside space-y-1">
                <li>筛选范围（导出摘要页）</li>
                <li>生成时间</li>
                <li>操作人信息</li>
                <li>完整数据内容</li>
              </ul>
            </div>

            <button
              className="btn-primary w-full"
              onClick={handleExport}
              disabled={loading}
            >
              {loading ? "正在导出..." : "开始导出"}
            </button>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold mb-4">最近导出记录</h3>

          {exportList.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-5xl mb-4">📭</p>
              <p className="text-gray-500">暂无导出记录</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {exportList.map((exp: any) => (
                <div
                  key={exp._id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{getTypeName(exp.exportType)}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {formatDateTime(exp.generatedAt)}
                      </p>
                    </div>
                    <span
                      className={`badge ${
                        exp.status === "completed"
                          ? "badge-success"
                          : exp.status === "failed"
                          ? "badge-danger"
                          : "badge-info"
                      }`}
                    >
                      {exp.status === "completed"
                        ? "完成"
                        : exp.status === "failed"
                        ? "失败"
                        : "处理中"}
                    </span>
                  </div>
                  <div className="mt-3 text-sm text-gray-600 space-y-1">
                    <p>
                      <span className="text-gray-500">操作人：</span>
                      {exp.generatedByName || "-"}
                    </p>
                    <p>
                      <span className="text-gray-500">筛选条件：</span>
                      {exp.filterDisplay || "无"}
                    </p>
                    <p>
                      <span className="text-gray-500">数据量：</span>
                      {exp.recordCount} 条 | {Math.round((exp.fileSize || 0) / 1024)} KB
                    </p>
                  </div>
                  {exp.status === "completed" && exp.fileUrl && (
                    <div className="mt-3">
                      <a
                        href={exp.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-600 hover:underline text-sm font-medium"
                      >
                        📥 下载文件
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
