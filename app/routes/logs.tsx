import { useState, useEffect } from "react";
import { useLoaderData, Form, useSearchParams } from "@remix-run/react";
import { json } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const page = url.searchParams.get("page") || "1";
  const pageSize = url.searchParams.get("pageSize") || "20";
  const module = url.searchParams.get("module") || "";
  const status = url.searchParams.get("status") || "";
  const startDate = url.searchParams.get("startDate") || "";
  const endDate = url.searchParams.get("endDate") || "";

  const params = new URLSearchParams({ page, pageSize });
  if (module) params.set("module", module);
  if (status) params.set("status", status);
  if (startDate) params.set("startDate", startDate);
  if (endDate) params.set("endDate", endDate);

  const apiBase =
    process.env.API_BASE_URL ||
    `${url.protocol}//${url.host}/api`;

  try {
    const res = await fetch(`${apiBase}/logs?${params.toString()}`);
    const data = await res.json();
    return json({ logs: data, module, status, startDate, endDate });
  } catch (error) {
    return json({ logs: { list: [], total: 0, page: 1, pageSize: 20 }, module, status, startDate, endDate });
  }
}

export default function Logs() {
  const { logs, module: initialModule, status: initialStatus, startDate: initialStart, endDate: initialEnd } =
    useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [moduleFilter, setModuleFilter] = useState(initialModule || "");
  const [statusFilter, setStatusFilter] = useState(initialStatus || "");
  const [startDate, setStartDate] = useState(initialStart || "");
  const [endDate, setEndDate] = useState(initialEnd || "");
  const [selectedLog, setSelectedLog] = useState<any>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (moduleFilter) params.set("module", moduleFilter);
    if (statusFilter) params.set("status", statusFilter);
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    setSearchParams(params);
  };

  const handleCloseLog = async (id: string) => {
    const remark = prompt("请输入关闭备注（可选）");
    if (remark === null) return;
    try {
      await fetch(`/api/logs/${id}/close`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ remark }),
      });
      alert("关闭成功");
      window.location.reload();
    } catch (error) {
      alert("关闭失败");
    }
  };

  const getModuleName = (module: string) => {
    const map: Record<string, string> = {
      "transfer-material": "过户材料",
      "finance-data": "金融资料",
      preparation: "整备清单",
      "test-drive": "试驾记录",
      quote: "报价记录",
      car: "车辆管理",
      notification: "消息通知",
      export: "数据导出",
      system: "系统",
      other: "其他",
    };
    return map[module] || module;
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; className: string }> = {
      open: { label: "进行中", className: "badge badge-warning" },
      closed: { label: "已关闭", className: "badge badge-success" },
      failed: { label: "失败", className: "badge badge-danger" },
    };
    const s = map[status] || map.open;
    return <span className={s.className}>{s.label}</span>;
  };

  const formatDateTime = (date: string) => {
    if (!date) return "-";
    return new Date(date).toLocaleString("zh-CN");
  };

  const getActionName = (action: string) => {
    const map: Record<string, string> = {
      create: "创建",
      update: "更新",
      delete: "删除",
      "update-item": "更新项",
      "notify-missing": "缺失通知",
      resolve: "处理",
      sync: "同步",
      export: "导出",
    };
    return map[action] || action;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">操作日志</h2>
        <p className="mt-1 text-sm text-gray-500">
          记录所有操作的原因、动作和关闭时间
        </p>
      </div>

      <div className="card">
        <Form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="label">模块</label>
            <select
              className="input"
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
            >
              <option value="">全部模块</option>
              <option value="transfer-material">过户材料</option>
              <option value="finance-data">金融资料</option>
              <option value="preparation">整备清单</option>
              <option value="test-drive">试驾记录</option>
              <option value="quote">报价记录</option>
              <option value="car">车辆管理</option>
              <option value="notification">消息通知</option>
              <option value="export">数据导出</option>
              <option value="system">系统</option>
            </select>
          </div>
          <div>
            <label className="label">状态</label>
            <select
              className="input"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
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
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <label className="label">结束日期</label>
            <input
              type="date"
              className="input"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <div className="flex items-end">
            <button type="submit" className="btn-primary w-full">
              搜索
            </button>
          </div>
        </Form>
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>操作时间</th>
                <th>模块</th>
                <th>动作</th>
                <th>操作对象</th>
                <th>原因</th>
                <th>操作人</th>
                <th>状态</th>
                <th>关闭时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {logs?.list?.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-gray-500">
                    暂无数据
                  </td>
                </tr>
              ) : (
                logs?.list?.map((log: any) => (
                  <tr key={log._id}>
                    <td className="whitespace-nowrap">
                      {formatDateTime(log.createdAt)}
                    </td>
                    <td>{getModuleName(log.module)}</td>
                    <td>{getActionName(log.action)}</td>
                    <td>
                      <button
                        className="text-primary-600 hover:underline text-left"
                        onClick={() => setSelectedLog(log)}
                      >
                        {log.targetName || "-"}
                      </button>
                    </td>
                    <td className="max-w-xs truncate">
                      {log.reason || "-"}
                    </td>
                    <td>
                      {log.operatorId?.name || log.operatorName || "-"}
                      {log.operatorId?.role && (
                        <span className="text-xs text-gray-500 block">
                          ({log.operatorId.role})
                        </span>
                      )}
                    </td>
                    <td>{getStatusBadge(log.status)}</td>
                    <td className="whitespace-nowrap">
                      {formatDateTime(log.closedAt)}
                    </td>
                    <td>
                      {log.status === "open" && (
                        <button
                          className="btn-secondary text-sm"
                          onClick={() => handleCloseLog(log._id)}
                        >
                          关闭
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {logs?.total > logs?.pageSize && (
          <div className="mt-4 flex justify-between items-center">
            <span className="text-sm text-gray-500">
              共 {logs.total} 条记录
            </span>
            <div className="space-x-2">
              <button
                className="btn-secondary"
                disabled={logs.page <= 1}
                onClick={() => {
                  const params = new URLSearchParams(searchParams);
                  params.set("page", String(logs.page - 1));
                  setSearchParams(params);
                }}
              >
                上一页
              </button>
              <span className="text-sm">
                {logs.page} / {Math.ceil(logs.total / logs.pageSize)}
              </span>
              <button
                className="btn-secondary"
                disabled={logs.page * logs.pageSize >= logs.total}
                onClick={() => {
                  const params = new URLSearchParams(searchParams);
                  params.set("page", String(logs.page + 1));
                  setSearchParams(params);
                }}
              >
                下一页
              </button>
            </div>
          </div>
        )}
      </div>

      {selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-xl font-bold">操作日志详情</h3>
              <button
                className="text-gray-500 hover:text-gray-700 text-2xl"
                onClick={() => setSelectedLog(null)}
              >
                ×
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4 max-h-[60vh]">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">操作时间</p>
                  <p className="font-medium">{formatDateTime(selectedLog.createdAt)}</p>
                </div>
                <div>
                  <p className="text-gray-500">模块 / 动作</p>
                  <p className="font-medium">
                    {getModuleName(selectedLog.module)} / {getActionName(selectedLog.action)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">操作对象</p>
                  <p className="font-medium">{selectedLog.targetName || "-"}</p>
                </div>
                <div>
                  <p className="text-gray-500">状态</p>
                  <p>{getStatusBadge(selectedLog.status)}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-gray-500">操作人</p>
                  <p className="font-medium">
                    {selectedLog.operatorId?.name || selectedLog.operatorName || "-"}
                    {selectedLog.operatorId?.role && ` (${selectedLog.operatorId.role})`}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-gray-500">原因</p>
                  <p className="font-medium">{selectedLog.reason || "-"}</p>
                </div>
              </div>

              {selectedLog.changedFields?.length > 0 && (
                <div>
                  <p className="text-gray-500 text-sm mb-2">变更字段</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedLog.changedFields.map((field: string, idx: number) => (
                      <span key={idx} className="badge badge-info">
                        {field}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedLog.oldValue && (
                <div>
                  <p className="text-gray-500 text-sm mb-2">修改前数据</p>
                  <pre className="bg-gray-50 rounded p-4 text-sm overflow-auto max-h-40">
                    {JSON.stringify(selectedLog.oldValue, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.newValue && (
                <div>
                  <p className="text-gray-500 text-sm mb-2">修改后数据</p>
                  <pre className="bg-green-50 rounded p-4 text-sm overflow-auto max-h-40">
                    {JSON.stringify(selectedLog.newValue, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.status === "closed" && (
                <div className="pt-4 border-t text-sm">
                  <p className="text-gray-500">
                    关闭时间：{formatDateTime(selectedLog.closedAt)}
                  </p>
                  <p className="text-gray-500 mt-1">
                    关闭人：{selectedLog.closedBy?.name || "-"}
                  </p>
                  {selectedLog.closeRemark && (
                    <p className="text-gray-500 mt-1">
                      关闭备注：{selectedLog.closeRemark}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
