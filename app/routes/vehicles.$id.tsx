import { useState } from "react";
import { LoaderFunction, ActionFunction, json, redirect } from "@remix-run/node";
import { useLoaderData, useActionData, useParams, Form, Link } from "@remix-run/react";
import Layout from "~/components/Layout";
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
import { UserDocument } from "~/models/user";
import { getUserFromSession } from "~/lib/auth.server";
import {
  getVehicleById,
  addInspection,
  addPreparation,
  addTestDrive,
  addQuote,
  AddInspectionData,
  AddPreparationData,
  AddTestDriveData,
  AddQuoteData,
} from "~/lib/vehicles.server";

interface LoaderData {
  user: UserDocument;
  vehicle: VehicleDetailResponse["vehicle"];
  error?: string;
}

interface ActionData {
  error?: string;
  success?: string;
  action?: string;
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

const DEFAULT_INSPECTION_ITEMS = {
  exterior: [
    { name: "前保险杠" },
    { name: "后保险杠" },
    { name: "左侧车身" },
    { name: "右侧车身" },
    { name: "车顶" },
    { name: "前挡风玻璃" },
    { name: "后挡风玻璃" },
    { name: "左前大灯" },
    { name: "右前大灯" },
    { name: "左后尾灯" },
    { name: "右后尾灯" },
  ],
  interior: [
    { name: "座椅" },
    { name: "仪表盘" },
    { name: "中控台" },
    { name: "方向盘" },
    { name: "车门内饰板" },
    { name: "车顶内衬" },
    { name: "地毯" },
  ],
  mechanical: [
    { name: "发动机" },
    { name: "变速箱" },
    { name: "离合器" },
    { name: "悬挂系统" },
    { name: "制动系统" },
    { name: "转向系统" },
    { name: "冷却系统" },
    { name: "电气系统" },
  ],
  electrical: [
    { name: "蓄电池" },
    { name: "发电机" },
    { name: "起动机" },
    { name: "空调系统" },
    { name: "音响系统" },
    { name: "电动门窗" },
    { name: "中控锁" },
  ],
};

const DEFAULT_PREPARATION_CATEGORIES = [
  "外观修复",
  "内饰清洁",
  "机械维修",
  "电气检修",
  "轮胎更换",
  "保养维护",
  "其他",
];

export const loader: LoaderFunction = async ({ params, request, context }) => {
  const user = await getUserFromSession(context as any);
  if (!user) {
    return redirect("/login");
  }

  try {
    const id = params.id;
    if (!id) {
      return json<LoaderData>({ user: user.toJSON() as any, vehicle: {} as any, error: "车辆ID不存在" });
    }
    const data = await getVehicleById(id, user);
    if (!data) {
      return json<LoaderData>({ user: user.toJSON() as any, vehicle: {} as any, error: "车辆不存在或无权限访问" });
    }
    return json<LoaderData>({ user: user.toJSON() as any, vehicle: data as any });
  } catch (e: any) {
    return json<LoaderData>({ user: user.toJSON() as any, vehicle: {} as any, error: e.message || "加载失败" });
  }
};

export const action: ActionFunction = async ({ params, request, context }) => {
  const user = await getUserFromSession(context as any);
  if (!user) {
    return redirect("/login");
  }

  const vehicleId = params.id;
  if (!vehicleId) {
    return json<ActionData>({ error: "车辆ID不存在" }, { status: 400 });
  }

  const formData = await request.formData();
  const _action = formData.get("_action") as string;

  try {
    if (_action === "addInspection") {
      const data: AddInspectionData = {
        overallGrade: formData.get("overallGrade") as "A" | "B" | "C" | "D",
        totalEstimatedCost: parseFloat(formData.get("totalEstimatedCost") as string) || 0,
        inspectionDate: formData.get("inspectionDate") as string || undefined,
        notes: formData.get("notes") as string || undefined,
        accidentHistory: {
          hasAccident: formData.get("hasAccident") === "on",
          description: formData.get("accidentDescription") as string || undefined,
        },
        testResult: {
          brakeTest: formData.get("brakeTest") === "on",
          emissionTest: formData.get("emissionTest") === "on",
          suspensionTest: formData.get("suspensionTest") === "on",
        },
        exteriorItems: parseInspectionItems(formData, "exterior"),
        interiorItems: parseInspectionItems(formData, "interior"),
        mechanicalItems: parseInspectionItems(formData, "mechanical"),
        electricalItems: parseInspectionItems(formData, "electrical"),
      };

      if (!data.overallGrade) {
        return json<ActionData>({ error: "请选择综合评级" }, { status: 400 });
      }

      await addInspection(vehicleId, data, user._id.toString(), user);
      return json<ActionData>({ success: "检测报告已提交", action: "addInspection" });
    }

    if (_action === "addPreparation") {
      const items = parsePreparationItems(formData);
      const totalEstimatedCost = items.reduce((sum, item) => sum + item.estimatedCost, 0);

      const data: AddPreparationData = {
        items,
        totalEstimatedCost,
        notes: formData.get("notes") as string || undefined,
      };

      if (items.length === 0) {
        return json<ActionData>({ error: "请至少添加一个整备项目" }, { status: 400 });
      }

      await addPreparation(vehicleId, data, user._id.toString(), user);
      return json<ActionData>({ success: "整备清单已提交", action: "addPreparation" });
    }

    if (_action === "addTestDrive") {
      const data: AddTestDriveData = {
        date: formData.get("date") as string || undefined,
        startTime: formData.get("startTime") as string,
        endTime: formData.get("endTime") as string,
        startMileage: parseInt(formData.get("startMileage") as string, 10),
        endMileage: parseInt(formData.get("endMileage") as string, 10),
        route: formData.get("route") as string,
        clientName: formData.get("clientName") as string || undefined,
        clientPhone: formData.get("clientPhone") as string || undefined,
        clientInterest: (formData.get("clientInterest") as "low" | "medium" | "high") || undefined,
        overallRating: parseInt(formData.get("overallRating") as string, 10),
        issuesFound: formData.get("issuesFound") as string || undefined,
        clientNotes: formData.get("clientNotes") as string || undefined,
        feedback: {
          engine: parseInt(formData.get("feedback_engine") as string, 10),
          transmission: parseInt(formData.get("feedback_transmission") as string, 10),
          suspension: parseInt(formData.get("feedback_suspension") as string, 10),
          brake: parseInt(formData.get("feedback_brake") as string, 10),
          steering: parseInt(formData.get("feedback_steering") as string, 10),
          noise: parseInt(formData.get("feedback_noise") as string, 10),
        },
      };

      if (!data.startTime || !data.endTime || !data.route) {
        return json<ActionData>({ error: "请填写必填项" }, { status: 400 });
      }

      await addTestDrive(vehicleId, data, user._id.toString(), user);
      return json<ActionData>({ success: "试驾记录已提交", action: "addTestDrive" });
    }

    if (_action === "addQuote") {
      const data: AddQuoteData = {
        price: parseFloat(formData.get("price") as string),
        offeredToName: formData.get("offeredToName") as string || undefined,
        offeredToPhone: formData.get("offeredToPhone") as string || undefined,
        validUntil: formData.get("validUntil") as string || undefined,
        conditions: formData.get("conditions") as string || undefined,
        status: (formData.get("status") as AddQuoteData["status"]) || "proposed",
      };

      if (!data.price || data.price <= 0) {
        return json<ActionData>({ error: "请输入有效报价" }, { status: 400 });
      }

      await addQuote(vehicleId, data, user._id.toString(), user);
      return json<ActionData>({ success: "报价已提交", action: "addQuote" });
    }

    return json<ActionData>({ error: "未知操作" }, { status: 400 });
  } catch (e: any) {
    return json<ActionData>({ error: e.message || "操作失败" }, { status: 400 });
  }
};

function parseInspectionItems(formData: FormData, category: string) {
  const items: Array<{ name: string; condition: "excellent" | "good" | "fair" | "poor"; estimatedCost?: number }> = [];
  const names = formData.getAll(`item_${category}_name`) as string[];
  const conditions = formData.getAll(`item_${category}_condition`) as string[];
  const costs = formData.getAll(`item_${category}_cost`) as string[];

  for (let i = 0; i < names.length; i++) {
    if (names[i]) {
      items.push({
        name: names[i],
        condition: (conditions[i] as "excellent" | "good" | "fair" | "poor") || "good",
        estimatedCost: costs[i] ? parseFloat(costs[i]) : 0,
      });
    }
  }
  return items;
}

function parsePreparationItems(formData: FormData) {
  const items: Array<{ name: string; category: string; priority: "low" | "medium" | "high"; estimatedCost: number }> = [];
  const names = formData.getAll("prep_item_name") as string[];
  const categories = formData.getAll("prep_item_category") as string[];
  const priorities = formData.getAll("prep_item_priority") as string[];
  const costs = formData.getAll("prep_item_cost") as string[];

  for (let i = 0; i < names.length; i++) {
    if (names[i]) {
      items.push({
        name: names[i],
        category: categories[i] || "其他",
        priority: (priorities[i] as "low" | "medium" | "high") || "medium",
        estimatedCost: costs[i] ? parseFloat(costs[i]) : 0,
      });
    }
  }
  return items;
}

export default function VehicleDetail() {
  const loaderData = useLoaderData<LoaderData>();
  const actionData = useActionData<ActionData>();
  const vehicle = loaderData.vehicle as VehicleDetailResponse["vehicle"];
  const user = loaderData.user as any;
  const error = loaderData.error;
  const [activeTab, setActiveTab] = useState<TabType>("archive");
  const [showAddCommunication, setShowAddCommunication] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [showAddInspection, setShowAddInspection] = useState(false);
  const [showAddPreparation, setShowAddPreparation] = useState(false);
  const [showAddTestDrive, setShowAddTestDrive] = useState(false);
  const [showAddQuote, setShowAddQuote] = useState(false);
  const [prepItemCount, setPrepItemCount] = useState(3);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFormSubmit = () => {
    setIsSubmitting(true);
  };

  if (error) {
    return (
      <Layout user={user} title="车辆详情">
        <div className="alert alert-error">{error}</div>
        <Link to="/vehicles" className="btn btn-secondary" style={{ marginTop: "16px" }}>
          ← 返回车辆列表
        </Link>
      </Layout>
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
                  缺失：{doc}
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
      if (!showAddInspection) {
        return (
          <div className="card">
            <div className="empty-state">
              <div className="empty-state-icon">📋</div>
              <div className="empty-state-text">暂无检测报告</div>
              <div className="empty-state-hint">该车辆还未生成检测报告</div>
              <button
                className="btn btn-primary"
                style={{ marginTop: "16px" }}
                onClick={() => setShowAddInspection(true)}>
                + 添加检测报告
              </button>
            </div>
          </div>
        );
      }

      return (
        <div className="card">
          <div className="card-header">
            <div className="card-title">添加检测报告</div>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setShowAddInspection(false)}>
              取消
            </button>
          </div>

          {actionData?.action === "addInspection" && actionData.error && (
            <div className="alert alert-error" style={{ margin: "16px" }}>
              {actionData.error}
            </div>
          )}

          <Form method="post" onSubmit={handleFormSubmit}>
            <input type="hidden" name="_action" value="addInspection" />

            <div className="form-section">
              <h3 className="form-section-title">基本信息</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">综合评级</label>
                  <select name="overallGrade" className="form-input" required>
                    <option value="">请选择</option>
                    <option value="A">A - 优秀</option>
                    <option value="B">B - 良好</option>
                    <option value="C">C - 一般</option>
                    <option value="D">D - 较差</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">检测日期</label>
                  <input type="date" name="inspectionDate" className="form-input" />
                </div>
                <div className="form-group">
                  <label className="form-label">预估整备费用(元)</label>
                  <input type="number" name="totalEstimatedCost" className="form-input" min="0" defaultValue="0" />
                </div>
              </div>
            </div>

            {(["exterior", "interior", "mechanical", "electrical"] as const).map((category) => (
              <div key={category} className="form-section">
                <h3 className="form-section-title">
                  {category === "exterior" ? "外观检测" :
                   category === "interior" ? "内饰检测" :
                   category === "mechanical" ? "机械检测" : "电气检测"}
                </h3>
                {DEFAULT_INSPECTION_ITEMS[category].map((item, idx) => (
                  <div key={idx} style={{
                    display: "grid",
                    gridTemplateColumns: "2fr 1fr 1fr",
                    gap: "12px",
                    marginBottom: "8px",
                    alignItems: "center",
                  }}>
                    <input
                      type="hidden"
                      name={`item_${category}_name`}
                      value={item.name}
                    />
                    <div style={{ padding: "8px 0" }}>{item.name}</div>
                    <select name={`item_${category}_condition`} className="form-input">
                      <option value="excellent">优秀</option>
                      <option value="good">良好</option>
                      <option value="fair">一般</option>
                      <option value="poor">较差</option>
                    </select>
                    <input
                      type="number"
                      name={`item_${category}_cost`}
                      className="form-input"
                      placeholder="预估费用"
                      min="0"
                      defaultValue="0"
                    />
                  </div>
                ))}
              </div>
            ))}

            <div className="form-section">
              <h3 className="form-section-title">事故历史</h3>
              <div className="form-group">
                <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <input type="checkbox" name="hasAccident" />
                  车辆有事故历史
                </label>
              </div>
              <div className="form-group">
                <label className="form-label">事故描述</label>
                <textarea
                  name="accidentDescription"
                  className="form-input"
                  rows={2}
                  placeholder="请输入事故描述"
                />
              </div>
            </div>

            <div className="form-section">
              <h3 className="form-section-title">测试结果</h3>
              <div style={{ display: "flex", gap: "24px" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <input type="checkbox" name="brakeTest" defaultChecked />
                  刹车测试通过
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <input type="checkbox" name="emissionTest" defaultChecked />
                  排放测试通过
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <input type="checkbox" name="suspensionTest" defaultChecked />
                  悬挂测试通过
                </label>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">备注</label>
              <textarea name="notes" className="form-input" rows={2} placeholder="检测备注" />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px" }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowAddInspection(false)}
                disabled={isSubmitting}>
                取消
              </button>
              <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                {isSubmitting ? "提交中..." : "提交检测报告"}
              </button>
            </div>
          </Form>
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
      if (!showAddPreparation) {
        return (
          <div className="card">
            <div className="empty-state">
              <div className="empty-state-icon">🔧</div>
              <div className="empty-state-text">暂无整备清单</div>
              <div className="empty-state-hint">该车辆还未生成整备清单</div>
              <button
                className="btn btn-primary"
                style={{ marginTop: "16px" }}
                onClick={() => setShowAddPreparation(true)}>
                + 添加整备清单
              </button>
            </div>
          </div>
        );
      }

      return (
        <div className="card">
          <div className="card-header">
            <div className="card-title">添加整备清单</div>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setShowAddPreparation(false);
                setPrepItemCount(3);
              }}>
              取消
            </button>
          </div>

          {actionData?.action === "addPreparation" && actionData.error && (
            <div className="alert alert-error" style={{ margin: "16px" }}>
              {actionData.error}
            </div>
          )}

          <Form method="post" onSubmit={handleFormSubmit}>
            <input type="hidden" name="_action" value="addPreparation" />

            <div className="form-section">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <h3 className="form-section-title" style={{ marginBottom: 0 }}>整备项目</h3>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setPrepItemCount((c) => c + 1)}>
                  + 添加项目
                </button>
              </div>
              {Array.from({ length: prepItemCount }).map((_, idx) => (
                <div key={idx} style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 1.5fr 1fr 1fr",
                  gap: "12px",
                  marginBottom: "8px",
                  alignItems: "center",
                }}>
                  <input
                    type="text"
                    name="prep_item_name"
                    className="form-input"
                    placeholder="项目名称"
                  />
                  <select name="prep_item_category" className="form-input">
                    {DEFAULT_PREPARATION_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <select name="prep_item_priority" className="form-input">
                    <option value="low">低</option>
                    <option value="medium" selected>中</option>
                    <option value="high">高</option>
                  </select>
                  <input
                    type="number"
                    name="prep_item_cost"
                    className="form-input"
                    placeholder="预估费用"
                    min="0"
                    defaultValue="0"
                  />
                </div>
              ))}
            </div>

            <div className="form-group">
              <label className="form-label">备注</label>
              <textarea name="notes" className="form-input" rows={2} placeholder="整备备注" />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px" }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setShowAddPreparation(false);
                  setPrepItemCount(3);
                }}
                disabled={isSubmitting}>
                取消
              </button>
              <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                {isSubmitting ? "提交中..." : "提交整备清单"}
              </button>
            </div>
          </Form>
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

    const TestDriveForm = () => (
      <div className="card">
        <div className="card-header">
          <div className="card-title">添加试驾记录</div>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setShowAddTestDrive(false)}>
            取消
          </button>
        </div>

        {actionData?.action === "addTestDrive" && actionData.error && (
          <div className="alert alert-error" style={{ margin: "16px" }}>
            {actionData.error}
          </div>
        )}

        <Form method="post" onSubmit={handleFormSubmit}>
          <input type="hidden" name="_action" value="addTestDrive" />

          <div className="form-section">
            <h3 className="form-section-title">基本信息</h3>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">试驾日期</label>
                <input type="date" name="date" className="form-input" />
              </div>
              <div className="form-group">
                <label className="form-label">开始时间</label>
                <input type="time" name="startTime" className="form-input" required />
              </div>
              <div className="form-group">
                <label className="form-label">结束时间</label>
                <input type="time" name="endTime" className="form-input" required />
              </div>
              <div className="form-group">
                <label className="form-label">开始里程(公里)</label>
                <input type="number" name="startMileage" className="form-input" required min="0" defaultValue={vehicle.mileage || 0} />
              </div>
              <div className="form-group">
                <label className="form-label">结束里程(公里)</label>
                <input type="number" name="endMileage" className="form-input" required min="0" />
              </div>
              <div className="form-group">
                <label className="form-label">试驾路线</label>
                <input type="text" name="route" className="form-input" required placeholder="例如：市区道路-高速" />
              </div>
              <div className="form-group">
                <label className="form-label">客户姓名</label>
                <input type="text" name="clientName" className="form-input" placeholder="请输入客户姓名" />
              </div>
              <div className="form-group">
                <label className="form-label">联系电话</label>
                <input type="tel" name="clientPhone" className="form-input" placeholder="请输入联系电话" />
              </div>
              <div className="form-group">
                <label className="form-label">客户意向</label>
                <select name="clientInterest" className="form-input">
                  <option value="">请选择</option>
                  <option value="high">高</option>
                  <option value="medium">中</option>
                  <option value="low">低</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">综合评分</label>
                <select name="overallRating" className="form-input" required>
                  <option value="">请选择</option>
                  {[5, 4, 3, 2, 1].map((s) => (
                    <option key={s} value={s}>{s} 星</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3 className="form-section-title">试驾评分</h3>
            <div className="form-grid">
              {(["engine", "transmission", "suspension", "brake", "steering", "noise"] as const).map((item) => (
                <div key={item} className="form-group">
                  <label className="form-label">
                    {item === "engine" ? "发动机" :
                     item === "transmission" ? "变速箱" :
                     item === "suspension" ? "悬挂" :
                     item === "brake" ? "刹车" :
                     item === "steering" ? "转向" : "噪音"}
                  </label>
                  <select name={`feedback_${item}`} className="form-input" required>
                    <option value="">请选择</option>
                    {[5, 4, 3, 2, 1].map((s) => (
                      <option key={s} value={s}>{s} 星</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          <div className="form-section">
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">发现问题</label>
                <textarea name="issuesFound" className="form-input" rows={2} placeholder="试驾中发现的问题" />
              </div>
              <div className="form-group">
                <label className="form-label">客户备注</label>
                <textarea name="clientNotes" className="form-input" rows={2} placeholder="客户的反馈和意见" />
              </div>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px" }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setShowAddTestDrive(false)}
              disabled={isSubmitting}>
              取消
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? "提交中..." : "提交试驾记录"}
            </button>
          </div>
        </Form>
      </div>
    );

    if (showAddTestDrive) {
      return (
        <div>
          <TestDriveForm />
          {records && records.length > 0 && (
            <div style={{ marginTop: "24px" }}>
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
          )}
        </div>
      );
    }

    if (!records || records.length === 0) {
      return (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">🚗</div>
            <div className="empty-state-text">暂无试驾记录</div>
            <div className="empty-state-hint">该车辆还没有试驾记录</div>
            <button
              className="btn btn-primary"
              style={{ marginTop: "16px" }}
              onClick={() => setShowAddTestDrive(true)}>
              + 添加试驾记录
            </button>
          </div>
        </div>
      );
    }

    return (
      <div>
        <div className="card">
          <div className="card-header">
            <div className="card-title">试驾记录</div>
            <button
              className="btn btn-primary"
              onClick={() => setShowAddTestDrive(true)}>
              + 添加试驾记录
            </button>
          </div>
        </div>
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

    const QuoteForm = () => (
      <div className="card">
        <div className="card-header">
          <div className="card-title">添加报价</div>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setShowAddQuote(false)}>
            取消
          </button>
        </div>

        {actionData?.action === "addQuote" && actionData.error && (
          <div className="alert alert-error" style={{ margin: "16px" }}>
            {actionData.error}
          </div>
        )}

        <Form method="post" onSubmit={handleFormSubmit}>
          <input type="hidden" name="_action" value="addQuote" />

          <div className="form-section">
            <h3 className="form-section-title">报价信息</h3>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">报价金额(元)</label>
                <input type="number" name="price" className="form-input" required min="0" placeholder="请输入报价金额" />
              </div>
              <div className="form-group">
                <label className="form-label">报价状态</label>
                <select name="status" className="form-input" required>
                  <option value="">请选择</option>
                  <option value="proposed">已报价</option>
                  <option value="negotiating">议价中</option>
                  <option value="accepted">已接受</option>
                  <option value="rejected">已拒绝</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">客户姓名</label>
                <input type="text" name="offeredToName" className="form-input" required placeholder="请输入客户姓名" />
              </div>
              <div className="form-group">
                <label className="form-label">联系电话</label>
                <input type="tel" name="offeredToPhone" className="form-input" placeholder="请输入联系电话" />
              </div>
              <div className="form-group">
                <label className="form-label">有效期至</label>
                <input type="date" name="validUntil" className="form-input" />
              </div>
              <div className="form-group">
                <label className="form-label">上次报价(元)</label>
                <input type="number" name="previousPrice" className="form-input" min="0" placeholder="如有，请输入上次报价" />
              </div>
            </div>
          </div>

          <div className="form-section">
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">附加条件</label>
                <textarea name="conditions" className="form-input" rows={3} placeholder="报价的附加条件和说明" />
              </div>
              <div className="form-group">
                <label className="form-label">拒绝原因(如拒绝)</label>
                <textarea name="rejectionReason" className="form-input" rows={3} placeholder="如客户拒绝，填写拒绝原因" />
              </div>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px" }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setShowAddQuote(false)}
              disabled={isSubmitting}>
              取消
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? "提交中..." : "提交报价"}
            </button>
          </div>
        </Form>
      </div>
    );

    if (showAddQuote) {
      return (
        <div>
          <QuoteForm />
          {quotes && quotes.length > 0 && (
            <div style={{ marginTop: "24px" }}>
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
          )}
        </div>
      );
    }

    if (!quotes || quotes.length === 0) {
      return (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">💰</div>
            <div className="empty-state-text">暂无报价历史</div>
            <div className="empty-state-hint">该车辆还没有报价记录</div>
            <button
              className="btn btn-primary"
              style={{ marginTop: "16px" }}
              onClick={() => setShowAddQuote(true)}>
              + 添加报价
            </button>
          </div>
        </div>
      );
    }

    return (
      <div>
        <div className="card">
          <div className="card-header">
            <div className="card-title">报价历史</div>
            <button
              className="btn btn-primary"
              onClick={() => setShowAddQuote(true)}>
              + 添加报价
            </button>
          </div>
        </div>
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
    <Layout user={user} title={`${vehicle.brand} ${vehicle.vehicleModel}`}>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            {vehicle.brand} {vehicle.vehicleModel} ({vehicle.year})
          </h1>
          <div style={{ color: "#6b7280", marginTop: "4px" }}>
            车牌号：{vehicle.plateNumber} · {STAGE_LABELS[vehicle.stage as AcquisitionStage]}
          </div>
        </div>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <Link to="/vehicles" className="btn btn-secondary">
            ← 返回列表
          </Link>
          <span className={`badge badge-stage`}>
            {STAGE_LABELS[vehicle.stage as AcquisitionStage]}
          </span>
        </div>
      </div>

      <div>
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
    </Layout>
  );
}
