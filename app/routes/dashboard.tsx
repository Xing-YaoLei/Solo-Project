import { useState } from "react";
import {
  LoaderFunction,
  json,
  redirect,
} from "@remix-run/node";
import { useLoaderData, useNavigate } from "@remix-run/react";
import Layout from "~/components/Layout";
import {
  STAGE_LABELS,
  RISK_LEVEL_LABELS,
  formatDate,
} from "~/lib/constants";
import { api, StatisticsResponse } from "~/lib/api";
import { UserDocument } from "~/models/user";
import { VehicleDocument, AcquisitionStage, RiskLevel } from "~/models/vehicle";

interface LoaderData {
  user: UserDocument;
  statistics: StatisticsResponse | null;
  vehicles: VehicleDocument[];
}

export const loader: LoaderFunction = async ({ request }) => {
  try {
    const authData = await api.auth.me();

    if (!authData.user) {
      return redirect("/login");
    }

    const [vehiclesData, statsData] = await Promise.all([
      api.vehicles.list({ limit: 100 }),
      authData.user.role === "manager"
        ? api.vehicles.statistics()
        : Promise.resolve(null),
    ]);

    return json<LoaderData>({
      user: authData.user,
      statistics: statsData,
      vehicles: vehiclesData.vehicles,
    });
  } catch (e) {
    return redirect("/login");
  }
};

const RISK_LEVEL_PRIORITY: Record<RiskLevel, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

const STAGE_PRIORITY: Record<AcquisitionStage, number> = {
  archive: 0,
  inspection: 1,
  preparation: 2,
  testdrive: 3,
  quoting: 4,
  completed: 6,
  cancelled: 5,
};

function sortVehiclesByPriority(vehicles: VehicleDocument[]): VehicleDocument[] {
  const activeVehicles = vehicles.filter(
    (v) => v.stage !== "completed" && v.stage !== "cancelled" && v.isActive
  );

  return [...activeVehicles].sort((a, b) => {
    const riskDiff = RISK_LEVEL_PRIORITY[a.riskLevel] - RISK_LEVEL_PRIORITY[b.riskLevel];
    if (riskDiff !== 0) return riskDiff;
    return STAGE_PRIORITY[a.stage] - STAGE_PRIORITY[b.stage];
  });
}

function getStageCount(vehicles: VehicleDocument[], stage: AcquisitionStage): number {
  return vehicles.filter((v) => v.stage === stage && v.isActive).length;
}

function getRiskCount(vehicles: VehicleDocument[], risk: RiskLevel): number {
  return vehicles.filter(
    (v) => v.riskLevel === risk && v.stage !== "completed" && v.stage !== "cancelled" && v.isActive
  ).length;
}

export default function Dashboard() {
  const loaderData = useLoaderData<LoaderData>();
  const { user, statistics, vehicles } = loaderData as LoaderData;
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const vehicleList = vehicles as VehicleDocument[];

  const sortedVehicles = sortVehiclesByPriority(vehicleList);
  const todayTodos = sortedVehicles.slice(0, 10);

  const activeVehicles = vehicleList.filter(
    (v) => v.stage !== "completed" && v.stage !== "cancelled" && v.isActive
  );

  const stats = [
    {
      label: "待处理车辆",
      value: activeVehicles.length,
      change: "+5",
      positive: true,
    },
    {
      label: "高风险车辆",
      value: getRiskCount(vehicleList, "high") + getRiskCount(vehicleList, "critical"),
      change: "需关注",
      positive: false,
    },
    {
      label: "检测中",
      value: getStageCount(vehicleList, "inspection"),
      change: "正常",
      positive: true,
    },
    {
      label: "报价中",
      value: getStageCount(vehicleList, "quoting"),
      change: "正常",
      positive: true,
    },
  ];

  const handleVehicleClick = (vehicleId: string) => {
    navigate(`/vehicles/${vehicleId}`);
  };

  return (
    <Layout user={user} title="工作台">
      <div className="page-header">
        <div>
          <h1 className="page-title">今日待办</h1>
          <p style={{ color: "#6b7280", marginTop: "4px" }}>
            按风险等级和处理阶段排序，优先处理紧急事项
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => navigate("/vehicles/new")}
          disabled={isLoading}
        >
          + 新增车辆
        </button>
      </div>

      <div className="stats-grid">
        {stats.map((stat, index) => (
          <div key={index} className="stat-card">
            <div className="stat-label">{stat.label}</div>
            <div className="stat-value">{stat.value}</div>
            <div className={`stat-change ${stat.positive ? "positive" : "negative"}`}>
              {stat.change}
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">今日待办列表</h2>
          <span style={{ color: "#6b7280", fontSize: "13px" }}>
            共 {todayTodos.length} 项待处理
          </span>
        </div>

        {todayTodos.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🎉</div>
            <div className="empty-state-text">今日暂无待办事项</div>
            <div className="empty-state-hint">点击上方按钮新增车辆</div>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>车牌号</th>
                <th>车辆信息</th>
                <th>当前阶段</th>
                <th>风险等级</th>
                <th>资料缺失</th>
                <th>创建时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {todayTodos.map((vehicle) => (
                <tr
                  key={vehicle._id.toString()}
                  onClick={() => handleVehicleClick(vehicle._id.toString())}
                  style={{ cursor: "pointer" }}
                >
                  <td style={{ fontWeight: 600 }}>{vehicle.plateNumber}</td>
                  <td>
                    {vehicle.brand} {vehicle.vehicleModel} {vehicle.year}
                    <div style={{ color: "#6b7280", fontSize: "12px", marginTop: "2px" }}>
                      {vehicle.color} · {formatDate(vehicle.registerDate || vehicle.createdAt)}上牌
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-stage">
                      {STAGE_LABELS[vehicle.stage]}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`badge badge-risk-${vehicle.riskLevel}`}
                    >
                      {RISK_LEVEL_LABELS[vehicle.riskLevel]}
                    </span>
                  </td>
                  <td>
                    {vehicle.missingDocuments.length > 0 ? (
                      <div className="missing-docs">
                        {vehicle.missingDocuments.slice(0, 2).map((doc, idx) => (
                          <span key={idx} className="missing-doc-tag">
                            {doc}
                          </span>
                        ))}
                        {vehicle.missingDocuments.length > 2 && (
                          <span className="missing-doc-tag">
                            +{vehicle.missingDocuments.length - 2}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span style={{ color: "#059669", fontSize: "12px" }}>✓ 资料齐全</span>
                    )}
                  </td>
                  <td style={{ color: "#6b7280", fontSize: "13px" }}>
                    {formatDate(vehicle.createdAt)}
                  </td>
                  <td>
                    <button className="btn btn-primary btn-sm" onClick={(e) => {
                      e.stopPropagation();
                      handleVehicleClick(vehicle._id.toString());
                    }}>
                      处理
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">各阶段车辆分布</h2>
        </div>
        <div className="stats-grid">
          {(["archive", "inspection", "preparation", "testdrive", "quoting"] as AcquisitionStage[]).map(
            (stage) => (
              <div
                key={stage}
                className="stat-card"
                style={{ cursor: "pointer" }}
                onClick={() => navigate(`/vehicles?stage=${stage}`)}
              >
                <div className="stat-label">{STAGE_LABELS[stage]}</div>
                <div className="stat-value">{getStageCount(vehicleList, stage)}</div>
                <div className="stat-change positive">点击查看</div>
              </div>
            )
          )}
        </div>
      </div>
    </Layout>
  );
}
