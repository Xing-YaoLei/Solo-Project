import { useState, useEffect } from "react";
import { useLoaderData, Form, useSearchParams } from "@remix-run/react";
import { json } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const page = url.searchParams.get("page") || "1";
  const pageSize = url.searchParams.get("pageSize") || "10";
  const keyword = url.searchParams.get("keyword") || "";
  const status = url.searchParams.get("status") || "";

  const params = new URLSearchParams({ page, pageSize });
  if (keyword) params.set("keyword", keyword);
  if (status) params.set("status", status);

  const apiBase =
    process.env.API_BASE_URL ||
    `${url.protocol}//${url.host}/api`;

  try {
    const res = await fetch(`${apiBase}/cars?${params.toString()}`);
    const carsData = await res.json();
    return json({ cars: carsData, keyword, status });
  } catch (error) {
    return json({ cars: { list: [], total: 0, page: 1, pageSize: 10 }, keyword, status, error: (error as Error).message });
  }
}

export default function Records() {
  const { cars, keyword, status } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedCar, setSelectedCar] = useState<any>(null);
  const [carRecords, setCarRecords] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("preparations");
  const [searchKeyword, setSearchKeyword] = useState(keyword || "");
  const [statusFilter, setStatusFilter] = useState(status || "");

  const fetchCarRecords = async (carId: string) => {
    try {
      const res = await fetch(`/api/records/car/${carId}`);
      const data = await res.json();
      setCarRecords(data);
      setSelectedCar(data.car);
    } catch (error) {
      console.error("获取车辆记录失败:", error);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchKeyword) params.set("keyword", searchKeyword);
    if (statusFilter) params.set("status", statusFilter);
    setSearchParams(params);
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; className: string }> = {
      "in-stock": { label: "在库", className: "badge badge-info" },
      preparing: { label: "整备中", className: "badge badge-warning" },
      "test-driving": { label: "试驾中", className: "badge badge-warning" },
      negotiating: { label: "洽谈中", className: "badge badge-warning" },
      transferring: { label: "过户中", className: "badge badge-info" },
      sold: { label: "已售出", className: "badge badge-success" },
      transferred: { label: "已过户", className: "badge badge-success" },
    };
    const s = map[status] || { label: status, className: "badge badge-info" };
    return <span className={s.className}>{s.label}</span>;
  };

  const formatDate = (date: string) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("zh-CN");
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">记录页</h2>
        <p className="mt-1 text-sm text-gray-500">
          同时查看整备清单、试驾记录和报价历史
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">车辆列表</h3>
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
                <label className="label">状态</label>
                <select
                  className="input"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">全部</option>
                  <option value="in-stock">在库</option>
                  <option value="preparing">整备中</option>
                  <option value="test-driving">试驾中</option>
                  <option value="negotiating">洽谈中</option>
                  <option value="transferring">过户中</option>
                  <option value="sold">已售出</option>
                  <option value="transferred">已过户</option>
                </select>
              </div>
              <button type="submit" className="btn-primary w-full">
                搜索
              </button>
            </Form>

            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {cars?.list?.length === 0 ? (
                <p className="text-gray-500 text-center py-8">暂无数据</p>
              ) : (
                cars?.list?.map((car: any) => (
                  <div
                    key={car._id}
                    onClick={() => fetchCarRecords(car._id)}
                    className={`p-3 rounded-lg cursor-pointer border transition-colors ${
                      selectedCar?._id === car._id
                        ? "border-primary-500 bg-primary-50"
                        : "border-gray-200 hover:border-primary-300 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-900">
                          {car.brand} {car.model}
                        </p>
                        <p className="text-sm text-gray-500">
                          {car.plateNumber || car.vin?.slice(-8)}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          入库: {formatDate(car.inStockDate)}
                        </p>
                      </div>
                      {getStatusBadge(car.status)}
                    </div>
                  </div>
                ))
              )}
            </div>

            {cars?.total > cars?.pageSize && (
              <div className="mt-4 flex justify-between items-center text-sm">
                <span className="text-gray-500">
                  共 {cars.total} 条
                </span>
                <div className="space-x-2">
                  <button
                    className="btn-secondary"
                    disabled={cars.page <= 1}
                    onClick={() => {
                      const params = new URLSearchParams(searchParams);
                      params.set("page", String(cars.page - 1));
                      setSearchParams(params);
                    }}
                  >
                    上一页
                  </button>
                  <button
                    className="btn-secondary"
                    disabled={cars.page * cars.pageSize >= cars.total}
                    onClick={() => {
                      const params = new URLSearchParams(searchParams);
                      params.set("page", String(cars.page + 1));
                      setSearchParams(params);
                    }}
                  >
                    下一页
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          {!selectedCar ? (
            <div className="card h-full flex items-center justify-center">
              <div className="text-center text-gray-500">
                <p className="text-5xl mb-4">🚗</p>
                <p>请选择左侧车辆查看详细记录</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="card">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      {selectedCar.brand} {selectedCar.model}
                    </h3>
                    <p className="text-gray-500 mt-1">
                      {selectedCar.plateNumber} · {selectedCar.vin}
                    </p>
                    <div className="flex gap-4 mt-2 text-sm text-gray-500">
                      <span>{selectedCar.year}年款</span>
                      <span>{selectedCar.mileage?.toLocaleString()} 公里</span>
                      <span>
                        售价: ¥{selectedCar.sellingPrice?.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  {getStatusBadge(selectedCar.status)}
                </div>
              </div>

              <div className="card">
                <div className="flex space-x-4 border-b border-gray-200 mb-4">
                  <button
                    className={`pb-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === "preparations"
                        ? "border-primary-500 text-primary-600"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                    onClick={() => setActiveTab("preparations")}
                  >
                    整备清单 ({carRecords?.preparations?.length || 0})
                  </button>
                  <button
                    className={`pb-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === "testDrives"
                        ? "border-primary-500 text-primary-600"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                    onClick={() => setActiveTab("testDrives")}
                  >
                    试驾记录 ({carRecords?.testDrives?.length || 0})
                  </button>
                  <button
                    className={`pb-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === "quotes"
                        ? "border-primary-500 text-primary-600"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                    onClick={() => setActiveTab("quotes")}
                  >
                    报价历史 ({carRecords?.quotes?.length || 0})
                  </button>
                </div>

                {activeTab === "preparations" && (
                  <div className="space-y-4">
                    {carRecords?.preparations?.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">暂无整备记录</p>
                    ) : (
                      carRecords?.preparations?.map((prep: any) => (
                        <div
                          key={prep._id}
                          className="border border-gray-200 rounded-lg p-4"
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <p className="font-medium">整备清单</p>
                              <p className="text-sm text-gray-500">
                                创建时间: {formatDate(prep.createdAt)}
                              </p>
                            </div>
                            <span
                              className={`badge ${
                                prep.status === "completed"
                                  ? "badge-success"
                                  : prep.status === "in-progress"
                                  ? "badge-warning"
                                  : "badge-info"
                              }`}
                            >
                              {prep.status === "completed"
                                ? "已完成"
                                : prep.status === "in-progress"
                                ? "进行中"
                                : "待开始"}
                            </span>
                          </div>
                          <div className="space-y-2">
                            {prep.items?.map((item: any, idx: number) => (
                              <div
                                key={idx}
                                className="flex justify-between items-center py-2 border-b last:border-0"
                              >
                                <div>
                                  <p className="text-sm font-medium">{item.name}</p>
                                  {item.description && (
                                    <p className="text-xs text-gray-500">
                                      {item.description}
                                    </p>
                                  )}
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="text-sm">
                                    ¥{item.cost?.toLocaleString()}
                                  </span>
                                  <span
                                    className={`badge ${
                                      item.status === "completed"
                                        ? "badge-success"
                                        : item.status === "in-progress"
                                        ? "badge-warning"
                                        : "badge-info"
                                    }`}
                                  >
                                    {item.status === "completed"
                                      ? "已完成"
                                      : item.status === "in-progress"
                                      ? "进行中"
                                      : "待处理"}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="mt-3 pt-3 border-t flex justify-between text-sm">
                            <span className="text-gray-500">总费用</span>
                            <span className="font-semibold">
                              ¥{prep.totalCost?.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeTab === "testDrives" && (
                  <div className="space-y-4">
                    {carRecords?.testDrives?.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">暂无试驾记录</p>
                    ) : (
                      carRecords?.testDrives?.map((drive: any) => (
                        <div
                          key={drive._id}
                          className="border border-gray-200 rounded-lg p-4"
                        >
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-gray-500">客户姓名</p>
                              <p className="font-medium">{drive.customerName || "-"}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">联系电话</p>
                              <p className="font-medium">{drive.customerPhone || "-"}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">试驾司机</p>
                              <p className="font-medium">{drive.driverId?.name || "-"}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">兴趣程度</p>
                              <span
                                className={`badge ${
                                  drive.interestLevel === "very-high"
                                    ? "badge-success"
                                    : drive.interestLevel === "high"
                                    ? "badge-success"
                                    : drive.interestLevel === "medium"
                                    ? "badge-warning"
                                    : "badge-info"
                                }`}
                              >
                                {drive.interestLevel === "very-high"
                                  ? "极高"
                                  : drive.interestLevel === "high"
                                  ? "高"
                                  : drive.interestLevel === "medium"
                                  ? "中"
                                  : "低"}
                              </span>
                            </div>
                            <div className="col-span-2">
                              <p className="text-sm text-gray-500">试驾时间</p>
                              <p className="font-medium">
                                {formatDate(drive.startTime)} -{" "}
                                {formatDate(drive.endTime)}
                              </p>
                            </div>
                            {drive.customerFeedback && (
                              <div className="col-span-2">
                                <p className="text-sm text-gray-500">客户反馈</p>
                                <p className="text-sm">{drive.customerFeedback}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeTab === "quotes" && (
                  <div className="space-y-4">
                    {carRecords?.quotes?.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">暂无报价记录</p>
                    ) : (
                      carRecords?.quotes?.map((quote: any) => (
                        <div
                          key={quote._id}
                          className="border border-gray-200 rounded-lg p-4"
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <p className="text-sm text-gray-500">报价时间</p>
                              <p className="font-medium">{formatDate(quote.createdAt)}</p>
                            </div>
                            <span
                              className={`badge ${
                                quote.quoteStatus === "accepted"
                                  ? "badge-success"
                                  : quote.quoteStatus === "rejected"
                                  ? "badge-danger"
                                  : quote.quoteStatus === "counter-offered"
                                  ? "badge-warning"
                                  : "badge-info"
                              }`}
                            >
                              {quote.quoteStatus === "accepted"
                                ? "已接受"
                                : quote.quoteStatus === "rejected"
                                ? "已拒绝"
                                : quote.quoteStatus === "counter-offered"
                                ? "已还价"
                                : quote.quoteStatus === "expired"
                                ? "已过期"
                                : "待处理"}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-gray-500">客户姓名</p>
                              <p className="font-medium">{quote.customerName || "-"}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">报价金额</p>
                              <p className="font-semibold text-lg text-primary-600">
                                ¥{quote.quotePrice?.toLocaleString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">原价</p>
                              <p className="font-medium">
                                ¥{quote.originalPrice?.toLocaleString() || "-"}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">优惠金额</p>
                              <p className="font-medium text-red-600">
                                -¥{quote.discountAmount?.toLocaleString() || 0}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">付款方式</p>
                              <p className="font-medium">
                                {quote.paymentMethod === "full"
                                  ? "全款"
                                  : quote.paymentMethod === "installment"
                                  ? "分期"
                                  : quote.paymentMethod === "loan"
                                  ? "贷款"
                                  : quote.paymentMethod === "trade-in"
                                  ? "置换"
                                  : "-"}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">洽谈人</p>
                              <p className="font-medium">{quote.negotiatorId?.name || "-"}</p>
                            </div>
                          </div>
                          {quote.remark && (
                            <div className="mt-3 pt-3 border-t">
                              <p className="text-sm text-gray-500">备注</p>
                              <p className="text-sm">{quote.remark}</p>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
