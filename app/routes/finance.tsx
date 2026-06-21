import { useState, useEffect } from "react";
import { useLoaderData, Form, useSearchParams } from "@remix-run/react";
import { json } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const page = url.searchParams.get("page") || "1";
  const pageSize = url.searchParams.get("pageSize") || "10";
  const keyword = url.searchParams.get("keyword") || "";
  const settlementStatus = url.searchParams.get("settlementStatus") || "";

  const params = new URLSearchParams({ page, pageSize });
  if (keyword) params.set("keyword", keyword);
  if (settlementStatus) params.set("settlementStatus", settlementStatus);

  const apiBase =
    process.env.API_BASE_URL ||
    `${url.protocol}//${url.host}/api`;

  try {
    const res = await fetch(`${apiBase}/finance?${params.toString()}`);
    const data = await res.json();
    return json({ financeList: data, keyword, settlementStatus });
  } catch (error) {
    return json({ financeList: { list: [], total: 0, page: 1, pageSize: 10 }, keyword, settlementStatus });
  }
}

export default function Finance() {
  const { financeList, keyword, settlementStatus } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedFinance, setSelectedFinance] = useState<any>(null);
  const [changeLogs, setChangeLogs] = useState<any[]>([]);
  const [showChanges, setShowChanges] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState<any>({});
  const [changeReason, setChangeReason] = useState("");
  const [searchKeyword, setSearchKeyword] = useState(keyword || "");
  const [statusFilter, setStatusFilter] = useState(settlementStatus || "");

  const fetchFinanceDetail = async (carId: string) => {
    try {
      const res = await fetch(`/api/finance/${carId}`);
      const data = await res.json();
      setSelectedFinance(data);
      setEditData({
        purchasePrice: data.purchasePrice,
        preparationCost: data.preparationCost,
        sellingPrice: data.sellingPrice,
        dealDate: data.dealDate,
        actualReceived: data.actualReceived,
        settlementStatus: data.settlementStatus,
        buyerName: data.buyerName,
        buyerPhone: data.buyerPhone,
        remark: data.remark,
      });
      setEditMode(false);
    } catch (error) {
      console.error("获取金融资料失败:", error);
    }
  };

  const fetchChangeLogs = async (carId: string) => {
    try {
      const res = await fetch(`/api/finance/${carId}/changes`);
      const data = await res.json();
      setChangeLogs(data.changeLogs || []);
      setShowChanges(true);
    } catch (error) {
      console.error("获取变更记录失败:", error);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchKeyword) params.set("keyword", searchKeyword);
    if (statusFilter) params.set("settlementStatus", statusFilter);
    setSearchParams(params);
  };

  const handleSave = async () => {
    if (!selectedFinance) return;
    try {
      const res = await fetch(`/api/finance/${selectedFinance.carId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...editData, changeReason }),
      });
      const data = await res.json();
      setSelectedFinance(data);
      setEditMode(false);
      setChangeReason("");
      alert("保存成功");
    } catch (error) {
      alert("保存失败");
    }
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; className: string }> = {
      pending: { label: "待处理", className: "badge badge-info" },
      "in-progress": { label: "处理中", className: "badge badge-warning" },
      completed: { label: "已完成", className: "badge badge-success" },
      "on-hold": { label: "搁置", className: "badge badge-danger" },
    };
    const s = map[status] || { label: status, className: "badge badge-info" };
    return <span className={s.className}>{s.label}</span>;
  };

  const formatDate = (date: string) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("zh-CN");
  };

  const formatDateTime = (date: string) => {
    if (!date) return "-";
    return new Date(date).toLocaleString("zh-CN");
  };

  const getFieldLabel = (field: string) => {
    const map: Record<string, string> = {
      purchasePrice: "采购价",
      purchaseDate: "采购日期",
      preparationCost: "整备成本",
      totalCost: "总成本",
      sellingPrice: "售价",
      dealDate: "成交日期",
      actualReceived: "实收金额",
      profit: "利润",
      profitMargin: "利润率",
      settlementStatus: "结算状态",
      buyerName: "买家姓名",
      buyerPhone: "买家电话",
    };
    return map[field] || field;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">金融资料</h2>
        <p className="mt-1 text-sm text-gray-500">
          管理车辆金融信息，所有改动都会保留前后值记录
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">金融资料列表</h3>
            <Form onSubmit={handleSearch} className="mb-4 space-y-3">
              <div>
                <label className="label">关键词搜索</label>
                <input
                  type="text"
                  className="input"
                  placeholder="VIN码、车牌号、品牌、车型"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                />
              </div>
              <div>
                <label className="label">结算状态</label>
                <select
                  className="input"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">全部</option>
                  <option value="pending">待处理</option>
                  <option value="in-progress">处理中</option>
                  <option value="completed">已完成</option>
                  <option value="on-hold">搁置</option>
                </select>
              </div>
              <button type="submit" className="btn-primary w-full">
                搜索
              </button>
            </Form>

            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {financeList?.list?.length === 0 ? (
                <p className="text-gray-500 text-center py-8">暂无数据</p>
              ) : (
                financeList?.list?.map((item: any) => (
                  <div
                    key={item._id}
                    onClick={() => fetchFinanceDetail(item.carId?._id || item.carId)}
                    className={`p-3 rounded-lg cursor-pointer border transition-colors ${
                      selectedFinance?._id === item._id
                        ? "border-primary-500 bg-primary-50"
                        : "border-gray-200 hover:border-primary-300 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-900">
                          {item.carId?.brand} {item.carId?.model}
                        </p>
                        <p className="text-sm text-gray-500">
                          {item.carId?.plateNumber || item.carId?.vin?.slice(-8)}
                        </p>
                      </div>
                      {getStatusBadge(item.settlementStatus)}
                    </div>
                    <div className="flex justify-between mt-2 text-sm">
                      <span className="text-gray-500">售价</span>
                      <span className="font-medium text-primary-600">
                        ¥{item.sellingPrice?.toLocaleString() || 0}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          {!selectedFinance ? (
            <div className="card h-full flex items-center justify-center">
              <div className="text-center text-gray-500">
                <p className="text-5xl mb-4">💰</p>
                <p>请选择左侧车辆查看金融资料</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="card">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      {selectedFinance.carId?.brand} {selectedFinance.carId?.model}
                    </h3>
                    <p className="text-gray-500 mt-1">
                      {selectedFinance.carId?.plateNumber} ·{" "}
                      {selectedFinance.carId?.vin}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="btn-secondary"
                      onClick={() => {
                        fetchChangeLogs(selectedFinance.carId?._id);
                      }}
                    >
                      查看变更记录
                    </button>
                    {!editMode ? (
                      <button className="btn-primary" onClick={() => setEditMode(true)}>
                        编辑
                      </button>
                    ) : (
                      <>
                        <button
                          className="btn-secondary"
                          onClick={() => {
                            setEditMode(false);
                            setChangeReason("");
                          }}
                        >
                          取消
                        </button>
                        <button className="btn-primary" onClick={handleSave}>
                          保存
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="card">
                <h4 className="font-semibold mb-4">基本信息</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">结算状态</label>
                    {editMode ? (
                      <select
                        className="input"
                        value={editData.settlementStatus || ""}
                        onChange={(e) =>
                          setEditData({ ...editData, settlementStatus: e.target.value })
                        }
                      >
                        <option value="pending">待处理</option>
                        <option value="in-progress">处理中</option>
                        <option value="completed">已完成</option>
                        <option value="on-hold">搁置</option>
                      </select>
                    ) : (
                      <p className="text-lg">{getStatusBadge(selectedFinance.settlementStatus)}</p>
                    )}
                  </div>
                  <div>
                    <label className="label">采购价</label>
                    {editMode ? (
                      <input
                        type="number"
                        className="input"
                        value={editData.purchasePrice || ""}
                        onChange={(e) =>
                          setEditData({ ...editData, purchasePrice: Number(e.target.value) })
                        }
                      />
                    ) : (
                      <p className="text-lg font-medium">
                        ¥{selectedFinance.purchasePrice?.toLocaleString() || 0}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="label">整备成本</label>
                    {editMode ? (
                      <input
                        type="number"
                        className="input"
                        value={editData.preparationCost || ""}
                        onChange={(e) =>
                          setEditData({ ...editData, preparationCost: Number(e.target.value) })
                        }
                      />
                    ) : (
                      <p className="text-lg font-medium">
                        ¥{selectedFinance.preparationCost?.toLocaleString() || 0}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="label">总成本</label>
                    <p className="text-lg font-medium">
                      ¥{selectedFinance.totalCost?.toLocaleString() || 0}
                    </p>
                  </div>
                  <div>
                    <label className="label">售价</label>
                    {editMode ? (
                      <input
                        type="number"
                        className="input"
                        value={editData.sellingPrice || ""}
                        onChange={(e) =>
                          setEditData({ ...editData, sellingPrice: Number(e.target.value) })
                        }
                      />
                    ) : (
                      <p className="text-lg font-medium text-primary-600">
                        ¥{selectedFinance.sellingPrice?.toLocaleString() || 0}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="label">实收金额</label>
                    {editMode ? (
                      <input
                        type="number"
                        className="input"
                        value={editData.actualReceived || ""}
                        onChange={(e) =>
                          setEditData({ ...editData, actualReceived: Number(e.target.value) })
                        }
                      />
                    ) : (
                      <p className="text-lg font-medium">
                        ¥{selectedFinance.actualReceived?.toLocaleString() || 0}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="label">利润</label>
                    <p
                      className={`text-lg font-bold ${
                        selectedFinance.profit >= 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      ¥{selectedFinance.profit?.toLocaleString() || 0}
                    </p>
                  </div>
                  <div>
                    <label className="label">利润率</label>
                    <p className="text-lg font-medium">
                      {selectedFinance.profitMargin?.toFixed(2) || 0}%
                    </p>
                  </div>
                  <div>
                    <label className="label">买家姓名</label>
                    {editMode ? (
                      <input
                        type="text"
                        className="input"
                        value={editData.buyerName || ""}
                        onChange={(e) =>
                          setEditData({ ...editData, buyerName: e.target.value })
                        }
                      />
                    ) : (
                      <p className="text-lg font-medium">{selectedFinance.buyerName || "-"}</p>
                    )}
                  </div>
                  <div>
                    <label className="label">买家电话</label>
                    {editMode ? (
                      <input
                        type="text"
                        className="input"
                        value={editData.buyerPhone || ""}
                        onChange={(e) =>
                          setEditData({ ...editData, buyerPhone: e.target.value })
                        }
                      />
                    ) : (
                      <p className="text-lg font-medium">{selectedFinance.buyerPhone || "-"}</p>
                    )}
                  </div>
                  <div className="col-span-2">
                    <label className="label">备注</label>
                    {editMode ? (
                      <textarea
                        className="input"
                        rows={3}
                        value={editData.remark || ""}
                        onChange={(e) =>
                          setEditData({ ...editData, remark: e.target.value })
                        }
                      />
                    ) : (
                      <p className="text-gray-700">{selectedFinance.remark || "-"}</p>
                    )}
                  </div>
                </div>
              </div>

              {editMode && (
                <div className="card">
                  <label className="label">
                    <span className="text-red-500">*</span> 变更原因
                  </label>
                  <textarea
                    className="input"
                    rows={2}
                    value={changeReason}
                    onChange={(e) => setChangeReason(e.target.value)}
                    placeholder="请输入本次修改的原因"
                    required
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showChanges && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-xl font-bold">变更记录</h3>
              <button
                className="text-gray-500 hover:text-gray-700 text-2xl"
                onClick={() => setShowChanges(false)}
              >
                ×
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {changeLogs.length === 0 ? (
                <p className="text-center text-gray-500 py-8">暂无变更记录</p>
              ) : (
                <div className="space-y-4">
                  {changeLogs.map((log: any, idx: number) => (
                    <div key={idx} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <span className="font-medium">{getFieldLabel(log.field)}</span>
                        <span className="text-sm text-gray-500">
                          {formatDateTime(log.changedAt)}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500 mb-1">修改前</p>
                          <p className="bg-gray-100 rounded px-3 py-2 font-mono">
                            {JSON.stringify(log.oldValue ?? "空", null, 2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 mb-1">修改后</p>
                          <p className="bg-green-50 rounded px-3 py-2 font-mono text-green-700">
                            {JSON.stringify(log.newValue ?? "空", null, 2)}
                          </p>
                        </div>
                      </div>
                      {log.changeReason && (
                        <p className="mt-3 text-sm text-gray-600">
                          <span className="font-medium">变更原因：</span>
                          {log.changeReason}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
