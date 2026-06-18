import { useState } from "react";
import { LoaderFunction, json } from "@remix-run/node";
import { useLoaderData, useParams, Form } from "@remix-run/react";
import { api, VehicleDetailResponse } from "~/lib/api";
import {
  STAGE_LABELS,
  STAGE_ORDER,
  RISK_LEVEL_LABELS,
  FUEL_TYPE_LABELS,
  TRANSMISSION_LABELS,
  DOCUMENT_NAMES,
  COMMUNICATION_TYPE_LABELS,
  COMMUNICATION_CATEGORY_LABELS,
  CONDITION_LABELS,
  formatCurrency,
  formatDate,
  formatDateTime,
} from "~/lib/constants";
import type { AcquisitionStage, RiskLevel } from "~/models/vehicle";
import type { CommunicationType, CommunicationCategory } from "~/models/communication";
import type { IInspectionItem } from "~/models/inspectionReport";
import type { IPreparationItem } from "~/models/preparationList";

interface LoaderData {
  vehicle: VehicleDetailResponse["vehicle"];
  error?: string;
}

type TabType =
  | "archive"
  | "inspection"
  | "preparation"
  | "testdrive"
  | "quoting"
  | "communication";

const TAB_LABELS: Record<TabType, string> = {
  archive: "档案信息",
  inspection: "检测报告",
  preparation: "整备清单",
  testdrive: "试驾记录",
  quoting: "报价历史",
  communication: "沟通记录",
};

export const loader: LoaderFunction = async ({ params, request }) => {
  try {
    const id = params.id;
    if (!id) {
      return json<LoaderData>({ vehicle: {} as any, error: "车辆ID不存在" });
    }
    const data = await api.vehicles.get(id);
    return json<LoaderData>({ vehicle: data.vehicle });
  } catch (e: any) {
    return json<LoaderData>({ vehicle: {} as any, error: e.message || "加载失败" });
  }
};

export default function VehicleDetail() {
  const loaderData = useLoaderData<LoaderData>();
  const vehicle = loaderData.vehicle as VehicleDetailResponse["vehicle"];
  const error = loaderData.error;
  const [activeTab, setActiveTab] = useState<TabType>("archive");
  const [showAddCommunication, setShowAddCommunication] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");

  if (error) {
    return (
      <div className="main-content">
        <div className="container">
          <div className="alert alert-error">{error}</div>
        </div>
      </div>
    );
  }

  const currentStageIndex = STAGE_ORDER.indexOf(vehicle.stage as AcquisitionStage);

  const renderRiskIndicator = () => {
    const riskLevel = vehicle.riskLevel as RiskLevel;
    return (
      <div className={`risk-indicator risk-indicator-${riskLevel}`}>
        <span style={{ fontWeight: 600 }}>风险等级：</span>
        <span className={`badge badge-risk-${riskLevel}`}>
          {RISK_LEVEL_LABELS[riskLevel]}
        </span>
        {vehicle.missingDocuments && vehicle.missingDocuments.length > 0 && (
          <span style={{ marginLeft: "auto", fontSize: "13px" }}>
            缺失 {vehicle.missingDocuments.length} 份资料
          </span>
        )}
      </div>
    );
  };

  const renderProgressBar = () => {
    const displayStages = STAGE_ORDER.filter(
      (stage) => stage !== "completed" && stage !== "cancelled"
    );
    return (
      <div className="progress-steps">
        {displayStages.map((stage, index) => {
          let stepClass = "progress-step";
          if (index < currentStageIndex) {
            stepClass += " completed";
          } else if (index === currentStageIndex) {
            stepClass += " active";
          }
          return (
            <div key={stage} className={stepClass}>
              {STAGE_LABELS[stage]}
            </div>
          );
        })}
      </div>
    );
  };

  const renderArchiveTab = () => {
    return (
      <div className="vehicle-detail-grid">
        <div className="card">
          <div className="card-header">
            <div className="card-title">基本信息</div>
          </div>
          <div className="info-item">
            <span className="info-label">车牌号</span>
            <span className="info-value">{vehicle.plateNumber}</span>
          </div>
          <div className="info-item">
            <span className="info-label">车架号</span>
            <span className="info-value">{vehicle.vin}</span>
          </div>
          <div className="info-item">
            <span className="info-label">品牌</span>
            <span className="info-value">{vehicle.brand}</span>
          </div>
          <div className="info-item">
            <span className="info-label">型号</span>
            <span className="info-value">{vehicle.vehicleModel}</span>
          </div>
          <div className="info-item">
            <span className="info-label">年款</span>
            <span className="info-value">{vehicle.year}年</span>
          </div>
          <div className="info-item">
            <span className="info-label">颜色</span>
            <span className="info-value">{vehicle.color}</span>
          </div>
          <div className="info-item">
            <span className="info-label">里程</span>
            <span className="info-value">
              {vehicle.mileage.toLocaleString()} 公里</span>
          </div>
          <div className="info-item">
            <span className="info-label">燃油类型</span>
            <span className="info-value">
              {FUEL_TYPE_LABELS[vehicle.fuelType] || vehicle.fuelType}
            </span>
          </div>
          <div className="info-item">
            <span className="info-label">变速箱</span>
            <span className="info-value">
              {TRANSMISSION_LABELS[vehicle.transmission] ||
              vehicle.transmission}
            </span>
          </div>
          {vehicle.displacement && (
            <div className="info-item">
              <span className="info-label">排量</span>
              <span className="info-value">{vehicle.displacement}</span>
            </div>
          )}
          {vehicle.registerDate && (
            <div className="info-item">
              <span className="info-label">注册日期</span>
              <span className="info-value">
                {formatDate(vehicle.registerDate)}
              </span>
            </div>
          )}
        </div>

        <div>
          <div className="card">
            <div className="card-header">
              <div className="card-title">资料检查</div>
            </div>
            <div className="info-item">
              <span className="info-label">机动车登记证书</span>
              <span className="info-value">
                {vehicle.documentCheck?.registration ? (
                  <span style={{ color: "#059669" }}>✓</span>
                ) : (
                  <span style={{ color: "#dc2626" }}>✗</span>
                )}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">行驶证</span>
              <span className="info-value">
                {vehicle.documentCheck?.drivingLicense ? (
                  <span style={{ color: "#059669" }}>✓</span>
                ) : (
                  <span style={{ color: "#dc2626" }}>✗</span>
                )}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">保险单</span>
              <span className="info-value">
                {vehicle.documentCheck?.insurance ? (
                  <span style={{ color: "#059669" }}>✓</span>
                ) : (
                  <span style={{ color: "#dc2626" }}>✗</span>
                )}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">保养记录</span>
              <span className="info-value">
                {vehicle.documentCheck?.maintenanceRecord ? (
                  <span style={{ color: "#059669" }}>✓</span>
                ) : (
                  <span style={{ color: "#dc2626" }}>✗</span>
                )}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">事故记录</span>
              <span className="info-value">
                {vehicle.documentCheck?.accidentRecord ? (
                  <span style={{ color: "#059669" }}>✓</span>
                ) : (
                  <span style={{ color: "#dc2626" }}>✗</span>
                )}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">排放标准检测</span>
              <span className="info-value">
                {vehicle.documentCheck?.emissionTest ? (
                  <span style={{ color: "#059669" }}>✓</span>
                ) : (
                  <span style={{ color: "#dc2626" }}>✗</span>
                )}
              </span>
            </div>
            {vehicle.missingDocuments && vehicle.missingDocuments.length > 0 && (
              <div className="missing-docs">
                {vehicle.missingDocuments.map((doc: string) => (
                  <span key={doc} className="missing-doc-tag">
                  缺失：{DOCUMENT_NAMES[doc] || doc}
                </span>
                ))}
              </div>
            )}
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-title">价格信息</div>
            </div>
            {vehicle.purchasePrice && (
              <div className="info-item">
                <span className="info-label">收购价</span>
                <span className="info-value">
                  {formatCurrency(vehicle.purchasePrice)}
                </span>
              </div>
            )}
            {vehicle.expectedPrice && (
              <div className="info-item">
                <span className="info-label">预期售价</span>
                <span className="info-value">
                  {formatCurrency(vehicle.expectedPrice)}
                </span>
              </div>
            )}
            {vehicle.soldPrice && (
              <div className="info-item">
                <span className="info-label">实际售价</span>
                <span className="info-value">
                  {formatCurrency(vehicle.soldPrice)}
                </span>
              </div>
            )}
            <div className="info-item">
              <span className="info-label">在库天数</span>
              <span className="info-value">{vehicle.daysInStock} 天</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderInspectionItems = (items: IInspectionItem[]) => {
    if (!items || items.length === 0) {
      return (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <div className="empty-state-text">暂无检测项目</div>
        </div>
      );
    }
    return (
      <div className="inspection-items">
        {items.map((item, index) => (
          <div key={index} className="inspection-item">
            <span className="inspection-item-name">{item.name}</span>
            <span
              className={`inspection-item-condition condition-${item.condition}`}>
              {CONDITION_LABELS[item.condition]}
            </span>
          </div>
        ))}
      </div>
    );
  };

  const renderInspectionTab = () => {
    const report = vehicle.inspectionReport;
    if (!report) {
      return (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <div className="empty-state-text">暂无检测报告</div>
            <div className="empty-state-hint">该车辆还未生成检测报告</div>
          </div>
        </div>
      );
    }

    return (
      <div>
        <div className="card">
          <div className="card-header">
            <div className="card-title">检测概览</div>
          </div>
          <div className="form-row">
            <div className="info-item">
              <span className="info-label">综合评级</span>
              <span className="info-value">
                <span
                  className="badge"
                  style={{
                    backgroundColor:
                      report.overallGrade === "A"
                        ? "#d1fae5"
                        : report.overallGrade === "B"
                        ? "#dbeafe"
                        : report.overallGrade === "C"
                        ? "#fef3c7"
                        : "#fee2e2",
                    color:
                      report.overallGrade === "A"
                        ? "#065f46"
                        : report.overallGrade === "B"
                        ? "#1e40af"
                        : report.overallGrade === "C"
                        ? "#92400e"
                        : "#991b1b",
                  }}>
                  {report.overallGrade}
                </span>
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">检测日期</span>
              <span className="info-value">
                {formatDate(report.inspectionDate)}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">预估整备费用</span>
              <span className="info-value">
                {formatCurrency(report.totalEstimatedCost)}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">检测状态</span>
              <span className="info-value">
                <span
                  className="badge"
                  style={{
                    backgroundColor:
                      report.status === "completed"
                        ? "#d1fae5"
                        : report.status === "in_progress"
                        ? "#dbeafe"
                        : "#fef3c7",
                    color:
                      report.status === "completed"
                        ? "#065f46"
                        : report.status === "in_progress"
                        ? "#1e40af"
                        : "#92400e",
                  }}>
                  {report.status === "completed"
                    ? "已完成"
                    : report.status === "in_progress"
                    ? "进行中"
                    : report.status === "pending"
                    ? "待检测"
                    : "已拒绝"}
                </span>
              </span>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">外观检测</div>
          </div>
          {renderInspectionItems(report.exteriorItems)}
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">内饰检测</div>
          </div>
          {renderInspectionItems(report.interiorItems)}
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">机械检测</div>
          </div>
          {renderInspectionItems(report.mechanicalItems)}
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">电气检测</div>
          </div>
          {renderInspectionItems(report.electricalItems)}
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">事故历史</div>
          </div>
          <div className="info-item">
            <span className="info-label">是否有事故</span>
            <span className="info-value">
              {report.accidentHistory?.hasAccident ? "是" : "否"}
            </span>
          </div>
          {report.accidentHistory?.description && (
            <div className="info-item">
              <span className="info-label">事故描述</span>
              <span className="info-value">
                {report.accidentHistory.description}
              </span>
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">测试结果</div>
          </div>
          <div className="info-item">
            <span className="info-label">刹车测试</span>
            <span className="info-value">
              {report.testResult?.brakeTest ? (
                <span style={{ color: "#059669" }}>通过</span>
              ) : (
                <span style={{ color: "#dc2626" }}>未通过</span>
              )}
            </span>
          </div>
          <div className="info-item">
            <span className="info-label">排放测试</span>
            <span className="info-value">
              {report.testResult?.emissionTest ? (
                <span style={{ color: "#059669" }}>通过</span>
              ) : (
                <span style={{ color: "#dc2626" }}>未通过</span>
              )}
            </span>
          </div>
          <div className="info-item">
            <span className="info-label">悬挂测试</span>
            <span className="info-value">
              {report.testResult?.suspensionTest ? (
                <span style={{ color: "#059669" }}>通过</span>
              ) : (
                <span style={{ color: "#dc2626" }}>未通过</span>
              )}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const renderPreparationTab = () => {
    const list = vehicle.preparationList;
    if (!list) {
      return (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">🔧</div>
            <div className="empty-state-text">暂无整备清单</div>
            <div className="empty-state-hint">该车辆还未生成整备清单</div>
          </div>
        </div>
      );
    }

    return (
      <div>
        <div className="card">
          <div className="card-header">
            <div className="card-title">整备概览</div>
          </div>
          <div className="form-row">
            <div className="info-item">
              <span className="info-label">整备状态</span>
              <span className="info-value">
                <span
                  className="badge"
                  style={{
                    backgroundColor:
                      list.status === "completed"
                        ? "#d1fae5"
                        : list.status === "in_progress"
                        ? "#dbeafe"
                        : list.status === "pending"
                        ? "#fef3c7"
                        : "#fee2e2",
                    color:
                      list.status === "completed"
                        ? "#065f46"
                        : list.status === "in_progress"
                        ? "#1e40af"
                        : list.status === "pending"
                        ? "#92400e"
                        : "#991b1b",
                  }}>
                  {list.status === "completed"
                    ? "已完成"
                    : list.status === "in_progress"
                    ? "进行中"
                    : list.status === "pending"
                    ? "待开始"
                    : "已取消"}
                </span>
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">预估总费用</span>
              <span className="info-value">
                {formatCurrency(list.totalEstimatedCost)}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">实际总费用</span>
              <span className="info-value">
                {formatCurrency(list.totalActualCost || 0)}
              </span>
            </div>
            {list.startDate && (
              <div className="info-item">
                <span className="info-label">开始日期</span>
                <span className="info-value">
                  {formatDate(list.startDate)}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">
              整备项目 ({list.items?.length || 0})
            </div>
          </div>
          {list.items && list.items.length > 0 ? (
            <table className="table">
              <thead>
                <tr>
                  <th>项目名称</th>
                  <th>分类</th>
                  <th>优先级</th>
                  <th>预估费用</th>
                  <th>实际费用</th>
                  <th>状态</th>
                </tr>
              </thead>
              <tbody>
                {list.items.map((item: IPreparationItem, index: number) => (
                  <tr key={index}>
                    <td>{item.name}</td>
                    <td>{item.category}</td>
                    <td>
                      <span
                        className="badge"
                        style={{
                          backgroundColor:
                            item.priority === "high"
                              ? "#fee2e2"
                              : item.priority === "medium"
                              ? "#fef3c7"
                              : "#d1fae5",
                          color:
                            item.priority === "high"
                              ? "#991b1b"
                              : item.priority === "medium"
                              ? "#92400e"
                              : "#065f46",
                        }}>
                        {item.priority === "high"
                          ? "高"
                          : item.priority === "medium"
                          ? "中"
                          : "低"}
                      </span>
                    </td>
                    <td>{formatCurrency(item.estimatedCost)}</td>
                    <td>{formatCurrency(item.actualCost || 0)}</td>
                    <td>
                      <span
                        className="badge"
                        style={{
                          backgroundColor:
                            item.status === "completed"
                              ? "#d1fae5"
                              : item.status === "in_progress"
                              ? "#dbeafe"
                              : "#fef3c7",
                          color:
                            item.status === "completed"
                              ? "#065f46"
                              : item.status === "in_progress"
                              ? "#1e40af"
                              : "#92400e",
                        }}>
                        {item.status === "completed"
                          ? "已完成"
                          : item.status === "in_progress"
                          ? "进行中"
                          : "待处理"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty-state">
              <div className="empty-state-text">暂无整备项目</div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderStars = (rating: number) => {
    return (
      <div className="rating-stars">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={star <= rating ? "star" : "star empty"}>
            ★
          </span>
        ))}
      </div>
    );
  };

  const renderTestDriveTab = () => {
    const records = vehicle.testDriveRecords;
    if (!records || records.length === 0) {
      return (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">🚗</div>
            <div className="empty-state-text">暂无试驾记录</div>
            <div className="empty-state-hint">该车辆还没有试驾记录</div>
          </div>
        </div>
      );
    }

    return (
      <div>
        {records.map((record: any, index: number) => (
        <div key={index} className="card">
          <div className="card-header">
            <div className="card-title">
              试驾记录 - {formatDate(record.date)}
            </div>
            <span className="badge badge-stage">
              {record.startTime} - {record.endTime}
            </span>
          </div>
          <div className="form-row">
            <div className="info-item">
              <span className="info-label">客户姓名</span>
              <span className="info-value">
                {record.clientName || "-"}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">联系电话</span>
              <span className="info-value">
                {record.clientPhone || "-"}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">开始里程</span>
              <span className="info-value">
                {record.startMileage.toLocaleString()} 公里
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">结束里程</span>
              <span className="info-value">
                {record.endMileage.toLocaleString()} 公里
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">试驾路线</span>
              <span className="info-value">{record.route}</span>
            </div>
            <div className="info-item">
              <span className="info-label">客户意向</span>
              <span className="info-value">
                <span
                  className="badge"
                  style={{
                    backgroundColor:
                      record.clientInterest === "high"
                        ? "#d1fae5"
                        : record.clientInterest === "medium"
                        ? "#fef3c7"
                        : record.clientInterest === "low"
                        ? "#fee2e2"
                        : "#e5e7eb",
                    color:
                      record.clientInterest === "high"
                        ? "#065f46"
                        : record.clientInterest === "medium"
                        ? "#92400e"
                        : record.clientInterest === "low"
                        ? "#991b1b"
                        : "#6b7280",
                  }}>
                  {record.clientInterest === "high"
                    ? "高"
                    : record.clientInterest === "medium"
                    ? "中"
                    : record.clientInterest === "low"
                    ? "低"
                    : "无"}
                </span>
              </span>
            </div>
          </div>

          <div style={{ marginTop: "16px" }}>
            <div className="inspection-section">
              <div className="inspection-section-title">试驾评分</div>
              <div className="form-row">
                <div className="info-item">
                  <span className="info-label">发动机</span>
                  <span className="info-value">
                    {renderStars(record.feedback?.engine || 0)}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">变速箱</span>
                  <span className="info-value">
                    {renderStars(record.feedback?.transmission || 0)}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">悬挂</span>
                  <span className="info-value">
                    {renderStars(record.feedback?.suspension || 0)}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">刹车</span>
                  <span className="info-value">
                    {renderStars(record.feedback?.brake || 0)}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">转向</span>
                  <span className="info-value">
                    {renderStars(record.feedback?.steering || 0)}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">噪音</span>
                  <span className="info-value">
                    {renderStars(record.feedback?.noise || 0)}
                  </span>
                </div>
              </div>
            </div>
            <div className="info-item">
              <span className="info-label">综合评分</span>
              <span className="info-value">
                {renderStars(record.overallRating || 0)}
              </span>
            </div>
            {record.issuesFound && (
              <div className="info-item">
                <span className="info-label">发现问题</span>
                <span className="info-value">{record.issuesFound}</span>
              </div>
            )}
            {record.clientNotes && (
              <div className="info-item">
                <span className="info-label">客户备注</span>
                <span className="info-value">{record.clientNotes}</span>
              </div>
            )}
          </div>
        </div>
      ))}
      </div>
    );
  };

  const renderQuotingTab = () => {
    const quotes = vehicle.priceQuotes;
    if (!quotes || quotes.length === 0) {
      return (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">💰</div>
            <div className="empty-state-text">暂无报价历史</div>
            <div className="empty-state-hint">该车辆还没有报价记录</div>
          </div>
        </div>
      );
    }

    return (
      <div>
        {quotes.map((quote: any, index: number) => (
        <div key={index} className="card">
          <div className="card-header">
            <div className="card-title">
              报价记录 - {formatCurrency(quote.price)}
            </div>
            <span
              className="badge"
              style={{
                backgroundColor:
                  quote.status === "accepted"
                    ? "#d1fae5"
                    : quote.status === "negotiating"
                    ? "#dbeafe"
                    : quote.status === "proposed"
                    ? "#fef3c7"
                    : quote.status === "rejected"
                    ? "#fee2e2"
                    : "#e5e7eb",
                color:
                  quote.status === "accepted"
                    ? "#065f46"
                    : quote.status === "negotiating"
                    ? "#1e40af"
                    : quote.status === "proposed"
                    ? "#92400e"
                    : quote.status === "rejected"
                    ? "#991b1b"
                    : "#6b7280",
              }}>
              {quote.status === "accepted"
                ? "已接受"
                : quote.status === "negotiating"
                ? "议价中"
                : quote.status === "proposed"
                ? "已报价"
                : quote.status === "rejected"
                ? "已拒绝"
                : "已过期"}
            </span>
          </div>
          <div className="form-row">
            <div className="info-item">
              <span className="info-label">报价对象</span>
              <span className="info-value">
                {quote.offeredToName || "-"}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">联系电话</span>
              <span className="info-value">
                {quote.offeredToPhone || "-"}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">报价时间</span>
              <span className="info-value">
                {formatDateTime(quote.createdAt)}
              </span>
            </div>
            {quote.validUntil && (
              <div className="info-item">
                <span className="info-label">有效期至</span>
                <span className="info-value">
                  {formatDate(quote.validUntil)}
                </span>
              </div>
            )}
            {quote.previousPrice && (
              <div className="info-item">
                <span className="info-label">上次报价</span>
                <span className="info-value">
                  {formatCurrency(quote.previousPrice)}
                </span>
              </div>
            )}
            {quote.acceptanceDate && (
              <div className="info-item">
                <span className="info-label">接受时间</span>
                <span className="info-value">
                  {formatDateTime(quote.acceptanceDate)}
                </span>
              </div>
            )}
          </div>
          {quote.conditions && (
            <div className="info-item">
              <span className="info-label">附加条件</span>
              <span className="info-value">{quote.conditions}</span>
            </div>
          )}
          {quote.rejectionReason && (
            <div className="info-item">
              <span className="info-label">拒绝原因</span>
              <span className="info-value">{quote.rejectionReason}</span>
            </div>
          )}
          {quote.negotiationHistory &&
            quote.negotiationHistory.length > 0 && (
              <div style={{ marginTop: "16px" }}>
                <div className="inspection-section-title">议价历史</div>
                <div className="timeline">
                  {quote.negotiationHistory.map(
                    (history: any, hIndex: number) => (
                      <div key={hIndex} className="timeline-item">
                        <div className="timeline-date">
                          {formatDateTime(history.date)}
                        </div>
                        <div className="timeline-content">
                          报价：{formatCurrency(history.price)}
                          {history.note && (
                            <div style={{ marginTop: "8px", color: "#6b7280" }}>
                              备注：{history.note}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}
        </div>
        ))}
      </div>
    );
  };

  const handleAddCommunication = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      type: formData.get("type") as CommunicationType,
      category: formData.get("category") as CommunicationCategory,
      participantName: formData.get("participantName") as string,
      participantPhone: formData.get("participantPhone") as string,
      participantEmail: formData.get("participantEmail") as string,
      content: formData.get("content") as string,
      followUpRequired: formData.get("followUpRequired") === "on",
      followUpDate: formData.get("followUpDate") as string,
    };

    api.vehicles.addCommunication(String(vehicle._id), data).then(() => {
      setShowAddCommunication(false);
      window.location.reload();
    });
  };

  const handleReview = (commId: string) => {
    api.vehicles
      .reviewCommunication(String(vehicle._id), commId, reviewNotes).then(() => {
      setShowReviewModal(null);
      setReviewNotes("");
      window.location.reload();
    });
  };

  const renderCommunicationTab = () => {
    const communications = vehicle.communications;

    return (
      <div>
        <div className="card">
          <div className="card-header">
            <div className="card-title">沟通记录</div>
            <button
              className="btn btn-primary"
              onClick={() => setShowAddCommunication(true)}>
              + 添加沟通
            </button>
          </div>

          {communications && communications.length > 0 ? (
            <div>
              {communications.map((comm: any) => (
                <div key={comm._id} className="communication-card">
                  <div className="communication-header">
                    <div className="communication-meta">
                      <span
                        className="badge"
                        style={{
                          backgroundColor: "#dbeafe",
                          color: "#1e40af",
                        }}>
                        {COMMUNICATION_TYPE_LABELS[comm.type] || comm.type}
                      </span>
                      <span
                        className="badge"
                        style={{
                          backgroundColor: "#fef3c7",
                          color: "#92400e",
                        }}>
                        {COMMUNICATION_CATEGORY_LABELS[comm.category] ||
                          comm.category}
                      </span>
                      <span style={{ color: "#6b7280", fontSize: "13px" }}>
                        {comm.participantName}
                      </span>
                    </div>
                    <span style={{ color: "#6b7280", fontSize: "12px" }}>
                      {formatDateTime(comm.createdAt)}
                    </span>
                  </div>
                  <div style={{ marginBottom: "8px" }}>
                    {comm.content}
                  </div>
                  {comm.followUpRequired && (
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#dc2626",
                        marginBottom: "8px",
                      }}>
                      ⏰ 需要跟进
                      {comm.followUpDate &&
                        ` - 跟进日期：${formatDate(comm.followUpDate)}`}
                    </div>
                  )}
                  {comm.reviewNotes && (
                    <div className="communication-review">
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#6b7280",
                          marginBottom: "4px",
                        }}>
                        管理层复核：
                      </div>
                      <div>{comm.reviewNotes}</div>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#6b7280",
                          marginTop: "4px",
                        }}>
                        复核时间：{formatDateTime(comm.reviewedAt)}
                      </div>
                    </div>
                  )}
                  {!comm.reviewNotes && (
                    <div style={{ marginTop: "12px" }}>
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => setShowReviewModal(comm._id)}>
                        管理层复核
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">💬</div>
              <div className="empty-state-text">暂无沟通记录</div>
              <div className="empty-state-hint">点击上方按钮添加沟通记录</div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderAddCommunicationModal = () => {
    if (!showAddCommunication) return null;

    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="modal-header">
            <div className="modal-title">添加沟通记录</div>
            <button
              className="modal-close"
              onClick={() => setShowAddCommunication(false)}>
              ×
            </button>
          </div>
          <Form method="post" onSubmit={handleAddCommunication}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">沟通方式</label>
                <select name="type" className="form-select" required>
                  <option value="">请选择</option>
                  {Object.entries(COMMUNICATION_TYPE_LABELS).map(
                    ([key, value]) => (
                      <option key={key} value={key}>
                        {value}
                      </option>
                    )
                  )}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">沟通类别</label>
                <select name="category" className="form-select" required>
                  <option value="">请选择</option>
                  {Object.entries(COMMUNICATION_CATEGORY_LABELS).map(
                    ([key, value]) => (
                      <option key={key} value={key}>
                        {value}
                      </option>
                    )
                  )}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">参与人姓名</label>
              <input
                type="text"
                name="participantName"
                className="form-input"
                required
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">联系电话</label>
                <input
                  type="tel"
                  name="participantPhone"
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label">邮箱</label>
                <input
                  type="email"
                  name="participantEmail"
                  className="form-input"
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">沟通内容</label>
              <textarea
                name="content"
                className="form-textarea"
                required></textarea>
            </div>
            <div className="form-group" style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <input
                type="checkbox"
                name="followUpRequired"
                id="followUpRequired"
                style={{ width: "18px", height: "18px" }}
              />
              <label
                htmlFor="followUpRequired"
                style={{ fontSize: "14px", color: "#374151" }}>
                需要跟进
              </label>
            </div>
            <div className="form-group">
              <label className="form-label">跟进日期</label>
              <input
                type="date"
                name="followUpDate"
                className="form-input"
              />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowAddCommunication(false)}>
                取消
              </button>
              <button type="submit" className="btn btn-primary">
                保存
              </button>
            </div>
          </Form>
        </div>
      </div>
    );
  };

  const renderReviewModal = () => {
    if (!showReviewModal) return null;

    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="modal-header">
            <div className="modal-title">管理层复核</div>
            <button
              className="modal-close"
              onClick={() => setShowReviewModal(null)}>
              ×
            </button>
          </div>
          <div className="form-group">
            <label className="form-label">复核意见</label>
            <textarea
              className="form-textarea"
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              placeholder="请输入复核意见..."
            ></textarea>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
            <button
              className="btn btn-secondary"
              onClick={() => setShowReviewModal(null)}>
              取消
            </button>
            <button
              className="btn btn-primary"
              onClick={() => handleReview(showReviewModal)}>
              确认复核
            </button>
          </div>
        </div>
      </div>
    );
  };

  const tabs: TabType[] = [
    "archive",
    "inspection",
    "preparation",
    "testdrive",
    "quoting",
    "communication",
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "archive":
        return renderArchiveTab();
      case "inspection":
        return renderInspectionTab();
      case "preparation":
        return renderPreparationTab();
      case "testdrive":
        return renderTestDriveTab();
      case "quoting":
        return renderQuotingTab();
      case "communication":
        return renderCommunicationTab();
      default:
        return null;
    }
  };

  return (
    <div className="main-content">
      <div className="topbar">
        <div>
          <div className="page-title">
            {vehicle.brand} {vehicle.vehicleModel} ({vehicle.year})
          </div>
          <div style={{ fontSize: "14px", color: "#6b7280" }}>
            车牌号：{vehicle.plateNumber}
          </div>
        </div>
        <div className="topbar-user">
          <span
            className={`badge badge-stage`}>
            {STAGE_LABELS[vehicle.stage as AcquisitionStage]}
          </span>
        </div>
      </div>

      <div className="container">
        {renderRiskIndicator()}
        {renderProgressBar()}

        <div className="tabs">
          {tabs.map((tab) => (
            <button
              key={tab}
              className={`tab ${activeTab === tab ? "active" : ""}`}
              onClick={() => setActiveTab(tab)}>
              {TAB_LABELS[tab]}
            </button>
          ))}
        </div>

        {renderTabContent()}
      </div>

      {renderAddCommunicationModal()}
      {renderReviewModal()}
    </div>
  );
}
