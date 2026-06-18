import { useState } from "react";
import { json, LoaderFunction, redirect } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import Layout from "~/components/Layout";
import { api, StatisticsResponse } from "~/lib/api";
import {
  STAGE_LABELS,
  RISK_LEVEL_LABELS,
  RISK_LEVEL_COLORS,
  formatCurrency,
} from "~/lib/constants";
import { UserDocument } from "~/models/user";

interface LoaderData {
  user: UserDocument;
  statistics: StatisticsResponse;
}

export const loader: LoaderFunction = async ({ request }) => {
  try {
    const [userData, statsData] = await Promise.all([
      api.auth.me(),
      api.vehicles.statistics(),
    ]);

    if (userData.user.role !== "manager") {
      return redirect("/dashboard");
    }

    return json<LoaderData>({
      user: userData.user,
      statistics: statsData,
    });
  } catch (e) {
    return redirect("/login");
  }
};

const STAGE_COLORS = [
  "#3b82f6",
  "#8b5cf6",
  "#f59e0b",
  "#10b981",
  "#ef4444",
  "#6366f1",
  "#6b7280",
];

export default function Analytics() {
  const loaderData = useLoaderData<LoaderData>();
  const { user, statistics } = loaderData as LoaderData;
  const [activeTab, setActiveTab] = useState<"trend" | "stage" | "risk">("trend");

  const stageData = statistics.stageStats.map((item) => ({
    name: STAGE_LABELS[item._id as keyof typeof STAGE_LABELS] || item._id,
    value: item.count,
  }));

  const riskData = statistics.riskStats.map((item) => ({
    name: RISK_LEVEL_LABELS[item._id as keyof typeof RISK_LEVEL_LABELS] || item._id,
    value: item.count,
    color: RISK_LEVEL_COLORS[item._id as keyof typeof RISK_LEVEL_COLORS] || "#6b7280",
  }));

  const trendData = statistics.stockTrend.map((item) => ({
    date: item.date,
    入库车辆: item.stockIn,
  }));

  const soldData = statistics.soldStats.map((item) => ({
    date: item._id,
    售出车辆: item.count,
  }));

  const combinedTrendData = trendData.map((item) => {
    const sold = soldData.find((s) => s.date === item.date);
    return {
      ...item,
      售出车辆: sold?.售出车辆 || 0,
    };
  });

  const totalVehicles = stageData.reduce((sum, item) => sum + item.value, 0);
  const highRiskCount = riskData
    .filter((r) => r.name === "高风险" || r.name === "紧急风险")
    .reduce((sum, r) => sum + r.value, 0);

  return (
    <Layout user={user} title="管理仪表盘">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">在库车辆总数</div>
          <div className="stat-value">{totalVehicles}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">高风险车辆</div>
          <div className="stat-value" style={{ color: "#dc2626" }}>
            {highRiskCount}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">平均库存周期</div>
          <div className="stat-value">{Math.round(statistics.avgDaysInStock)} 天</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">近30天售出</div>
          <div className="stat-value" style={{ color: "#059669" }}>
            {soldData.reduce((sum, s) => sum + s.售出车辆, 0)}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">数据统计</h3>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              className={`tab ${activeTab === "trend" ? "active" : ""}`}
              onClick={() => setActiveTab("trend")}
            >
              库存周转趋势
            </button>
            <button
              className={`tab ${activeTab === "stage" ? "active" : ""}`}
              onClick={() => setActiveTab("stage")}
            >
              阶段分布
            </button>
            <button
              className={`tab ${activeTab === "risk" ? "active" : ""}`}
              onClick={() => setActiveTab("risk")}
            >
              风险分布
            </button>
          </div>
        </div>

        {activeTab === "trend" && (
          <div>
            <h4 style={{ marginBottom: "16px", color: "#374151" }}>近30天库存周转趋势</h4>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={combinedTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid #e5e7eb",
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="入库车辆"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: "#3b82f6", r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="售出车辆"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ fill: "#10b981", r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeTab === "stage" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px" }}>
            <div>
              <h4 style={{ marginBottom: "16px", color: "#374151" }}>各阶段车辆数量</h4>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stageData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "8px",
                        border: "1px solid #e5e7eb",
                      }}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {stageData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={STAGE_COLORS[index % STAGE_COLORS.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div>
              <h4 style={{ marginBottom: "16px", color: "#374151" }}>阶段占比</h4>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stageData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {stageData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={STAGE_COLORS[index % STAGE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: "8px",
                        border: "1px solid #e5e7eb",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {activeTab === "risk" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px" }}>
            <div>
              <h4 style={{ marginBottom: "16px", color: "#374151" }}>风险等级分布</h4>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={riskData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "8px",
                        border: "1px solid #e5e7eb",
                      }}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {riskData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div>
              <h4 style={{ marginBottom: "16px", color: "#374151" }}>风险占比</h4>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={riskData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {riskData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: "8px",
                        border: "1px solid #e5e7eb",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">阶段分布明细</h3>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>处理阶段</th>
              <th>车辆数量</th>
              <th>占比</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {stageData.map((item, index) => (
              <tr key={item.name}>
                <td>
                  <span
                    className="badge"
                    style={{
                      backgroundColor: `${STAGE_COLORS[index]}20`,
                      color: STAGE_COLORS[index],
                    }}
                  >
                    {item.name}
                  </span>
                </td>
                <td>{item.value} 辆</td>
                <td>
                  {totalVehicles > 0
                    ? ((item.value / totalVehicles) * 100).toFixed(1)
                    : 0}
                  %
                </td>
                <td>
                  <a
                    href={`/vehicles?stage=${
                      Object.keys(STAGE_LABELS).find(
                        (k) => STAGE_LABELS[k as keyof typeof STAGE_LABELS] === item.name
                      ) || ""
                    }`}
                    className="btn btn-sm btn-secondary"
                  >
                    查看列表
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}
