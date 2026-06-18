import { LoaderFunction, json } from "@remix-run/node";
import { useLoaderData, useSearchParams, Link } from "@remix-run/react";
import { useState, useEffect } from "react";
import { api, VehicleListResponse } from "~/lib/api";
import {
  STAGE_LABELS,
  STAGE_ORDER,
  RISK_LEVEL_LABELS,
  DOCUMENT_NAMES,
  FUEL_TYPE_LABELS,
} from "~/lib/constants";
import type { AcquisitionStage, RiskLevel, VehicleDocument } from "~/models/vehicle";
import type { UserDocument } from "~/models/user";

interface VehicleWithAssignee extends Omit<VehicleDocument, "assignedTo"> {
  assignedTo: UserDocument;
}

interface LoaderData {
  vehicles: VehicleWithAssignee[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url);
  const stage = url.searchParams.get("stage") || undefined;
  const riskLevel = url.searchParams.get("riskLevel") || undefined;
  const search = url.searchParams.get("search") || undefined;
  const page = url.searchParams.get("page") ? parseInt(url.searchParams.get("page")!, 10) : 1;
  const limit = url.searchParams.get("limit") ? parseInt(url.searchParams.get("limit")!, 10) : 20;

  try {
    const data = await api.vehicles.list({
      stage,
      riskLevel,
      search,
      page,
      limit,
    });
    return json<LoaderData>({
      vehicles: data.vehicles as unknown as VehicleWithAssignee[],
      pagination: data.pagination,
    });
  } catch (error) {
    return json<LoaderData>(
      {
        vehicles: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          pages: 0,
        },
      },
      { status: 500 }
    );
  }
};

export default function VehiclesIndex() {
  const loaderData = useLoaderData<LoaderData>();
  const data = loaderData as LoaderData;
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState(searchParams.get("search") || "");

  useEffect(() => {
    setSearchInput(searchParams.get("search") || "");
  }, [searchParams]);

  const handleFilterChange = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    newParams.delete("page");
    setSearchParams(newParams);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    handleFilterChange("search", searchInput);
  };

  const handlePageChange = (page: number) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("page", page.toString());
    setSearchParams(newParams);
  };

  const getRiskBadgeClass = (level: RiskLevel) => {
    return `badge badge-risk-${level}`;
  };

  const renderPagination = () => {
    const { page, pages } = data.pagination;
    const pagesToShow: number[] = [];
    
    if (pages <= 5) {
      for (let i = 1; i <= pages; i++) pagesToShow.push(i);
    } else {
      if (page <= 3) {
        pagesToShow.push(1, 2, 3, 4, 5);
      } else if (page >= pages - 2) {
        for (let i = pages - 4; i <= pages; i++) pagesToShow.push(i);
      } else {
        for (let i = page - 2; i <= page + 2; i++) pagesToShow.push(i);
      }
    }

    return (
      <div className="pagination">
        <button
          className="pagination-btn"
          onClick={() => handlePageChange(page - 1)}
          disabled={page <= 1}
        >
          上一页
        </button>
        {page > 3 && pages > 5 && (
          <>
            <button
              className="pagination-btn"
              onClick={() => handlePageChange(1)}
            >
              1
            </button>
            {page > 4 && <span className="pagination-btn" style={{ border: "none" }}>...</span>}
          </>
        )}
        {pagesToShow.map((p) => (
          <button
            key={p}
            className={`pagination-btn ${p === page ? "active" : ""}`}
            onClick={() => handlePageChange(p)}
          >
            {p}
          </button>
        ))}
        {page < pages - 2 && pages > 5 && (
          <>
            {page < pages - 3 && <span className="pagination-btn" style={{ border: "none" }}>...</span>}
            <button
              className="pagination-btn"
              onClick={() => handlePageChange(pages)}
            >
              {pages}
            </button>
          </>
        )}
        <button
          className="pagination-btn"
          onClick={() => handlePageChange(page + 1)}
          disabled={page >= pages}
        >
          下一页
        </button>
      </div>
    );
  };

  return (
    <div className="main-content">
      <div className="topbar">
        <div className="page-title">车辆列表</div>
        <div className="topbar-user">
          <Link to="/vehicles/new" className="btn btn-primary">
            + 新增车辆
          </Link>
        </div>
      </div>

      <div className="container">
        <div className="card">
          <div className="filter-bar">
            <select
              className="filter-select"
              value={searchParams.get("stage") || ""}
              onChange={(e) => handleFilterChange("stage", e.target.value)}
            >
              <option value="">所有阶段</option>
              {STAGE_ORDER.map((stage) => (
                <option key={stage} value={stage}>
                  {STAGE_LABELS[stage]}
                </option>
              ))}
            </select>

            <select
              className="filter-select"
              value={searchParams.get("riskLevel") || ""}
              onChange={(e) => handleFilterChange("riskLevel", e.target.value)}
            >
              <option value="">所有风险等级</option>
              <option value="low">{RISK_LEVEL_LABELS.low}</option>
              <option value="medium">{RISK_LEVEL_LABELS.medium}</option>
              <option value="high">{RISK_LEVEL_LABELS.high}</option>
              <option value="critical">{RISK_LEVEL_LABELS.critical}</option>
            </select>

            <form onSubmit={handleSearch} style={{ flex: 1, display: "flex" }}>
              <input
                type="text"
                className="filter-search"
                placeholder="搜索车牌号、品牌、型号..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
              <button type="submit" className="btn btn-primary btn-sm" style={{ marginLeft: "8px" }}>
                搜索
              </button>
            </form>
          </div>

          {data.vehicles.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🚗</div>
              <div className="empty-state-text">暂无车辆数据</div>
              <div className="empty-state-hint">请调整筛选条件或点击"新增车辆"添加</div>
            </div>
          ) : (
            <>
              <table className="table">
                <thead>
                  <tr>
                    <th>车牌号</th>
                    <th>品牌型号</th>
                    <th>风险等级</th>
                    <th>资料状态</th>
                    <th>当前阶段</th>
                    <th>负责人</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {data.vehicles.map((vehicle) => (
                    <tr key={vehicle._id.toString()}>
                      <td>
                        <div style={{ fontWeight: "600" }}>{vehicle.plateNumber}</div>
                        <div style={{ fontSize: "12px", color: "#6b7280" }}>
                          {vehicle.year}年 · {vehicle.mileage.toLocaleString()}公里
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: "500" }}>
                          {vehicle.brand} {vehicle.vehicleModel}
                        </div>
                        <div style={{ fontSize: "12px", color: "#6b7280" }}>
                          {vehicle.color} · {FUEL_TYPE_LABELS[vehicle.fuelType] || vehicle.fuelType}
                        </div>
                      </td>
                      <td>
                        <span className={getRiskBadgeClass(vehicle.riskLevel as RiskLevel)}>
                          {RISK_LEVEL_LABELS[vehicle.riskLevel as RiskLevel]}
                        </span>
                      </td>
                      <td>
                        {vehicle.missingDocuments && vehicle.missingDocuments.length > 0 ? (
                          <div className="missing-docs">
                            {vehicle.missingDocuments.slice(0, 3).map((doc) => (
                              <span key={doc} className="missing-doc-tag" title={DOCUMENT_NAMES[doc] || doc}>
                                {DOCUMENT_NAMES[doc] || doc}
                              </span>
                            ))}
                            {vehicle.missingDocuments.length > 3 && (
                              <span className="missing-doc-tag">
                                +{vehicle.missingDocuments.length - 3}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: "#059669", fontSize: "13px" }}>✓ 资料齐全</span>
                        )}
                      </td>
                      <td>
                        <span className="badge badge-stage">
                          {STAGE_LABELS[vehicle.stage as AcquisitionStage]}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: "500" }}>
                          {vehicle.assignedTo?.name || "-"}
                        </div>
                        <div style={{ fontSize: "12px", color: "#6b7280" }}>
                          {vehicle.assignedTo?.role === "manager" ? "经理" : "业务员"}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <Link
                            to={`/vehicles/${vehicle._id.toString()}`}
                            className="btn btn-secondary btn-sm"
                          >
                            查看
                          </Link>
                          <button className="btn btn-primary btn-sm">
                            编辑
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {renderPagination()}

              <div style={{ textAlign: "center", color: "#6b7280", fontSize: "13px", marginTop: "12px" }}>
                共 {data.pagination.total} 条记录，第 {data.pagination.page} / {data.pagination.pages} 页
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
