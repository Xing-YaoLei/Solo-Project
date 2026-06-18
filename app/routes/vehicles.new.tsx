import { useState } from "react";
import {
  LoaderFunction,
  ActionFunction,
  json,
  redirect,
} from "@remix-run/node";
import { useLoaderData, useActionData, Form, Link, useNavigate } from "@remix-run/react";
import Layout from "~/components/Layout";
import {
  FUEL_TYPE_LABELS,
  TRANSMISSION_LABELS,
  DOCUMENT_NAMES,
} from "~/lib/constants";
import { UserDocument } from "~/models/user";
import { getUserFromSession } from "~/lib/auth.server";
import { createVehicle } from "~/lib/vehicles.server";

interface LoaderData {
  user: UserDocument;
}

interface ActionData {
  error?: string;
  success?: boolean;
  vehicleId?: string;
}

export const loader: LoaderFunction = async ({ context }) => {
  const user = await getUserFromSession(context as any);
  if (!user) {
    return redirect("/login");
  }
  return json<LoaderData>({ user: user.toJSON() as any });
};

export const action: ActionFunction = async ({ request, context }) => {
  const user = await getUserFromSession(context as any);
  if (!user) {
    return redirect("/login");
  }

  const formData = await request.formData();

  try {
    const vehicleData = {
      plateNumber: formData.get("plateNumber") as string,
      vin: formData.get("vin") as string,
      brand: formData.get("brand") as string,
      vehicleModel: formData.get("vehicleModel") as string,
      year: parseInt(formData.get("year") as string, 10),
      color: formData.get("color") as string,
      mileage: parseInt(formData.get("mileage") as string, 10),
      fuelType: formData.get("fuelType") as string,
      transmission: formData.get("transmission") as string,
      displacement: formData.get("displacement") as string || undefined,
      registerDate: formData.get("registerDate") as string || undefined,
      firstOwnerName: formData.get("firstOwnerName") as string || undefined,
      firstOwnerPhone: formData.get("firstOwnerPhone") as string || undefined,
      notes: formData.get("notes") as string || undefined,
      documentCheck: {
        registration: formData.get("doc_registration") === "on",
        drivingLicense: formData.get("doc_drivingLicense") === "on",
        insurance: formData.get("doc_insurance") === "on",
        maintenanceRecord: formData.get("doc_maintenanceRecord") === "on",
        accidentRecord: formData.get("doc_accidentRecord") === "on",
        emissionTest: formData.get("doc_emissionTest") === "on",
      },
    };

    if (!vehicleData.plateNumber || !vehicleData.vin || !vehicleData.brand || !vehicleData.vehicleModel) {
      return json<ActionData>({ error: "请填写必填项" }, { status: 400 });
    }

    const vehicle = await createVehicle(vehicleData, user._id.toString());

    return redirect(`/vehicles`);
  } catch (e: any) {
    return json<ActionData>({ error: e.message || "保存失败" }, { status: 400 });
  }
};

export default function NewVehicle() {
  const loaderData = useLoaderData<LoaderData>();
  const actionData = useActionData<ActionData>();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const user = loaderData.user as any;

  const documentKeys = [
    "registration",
    "drivingLicense",
    "insurance",
    "maintenanceRecord",
    "accidentRecord",
    "emissionTest",
  ] as const;

  return (
    <Layout user={user} title="新增车辆">
      <div className="page-header">
        <div>
          <h1 className="page-title">新增车辆档案</h1>
          <p style={{ color: "#6b7280", marginTop: "4px" }}>
            录入车辆基本信息，系统将自动评估风险等级
          </p>
        </div>
        <Link to="/vehicles" className="btn btn-secondary">
          ← 返回列表
        </Link>
      </div>

      <div className="card">
        {actionData?.error && (
          <div className="alert alert-error" style={{ marginBottom: "20px" }}>
            {actionData.error}
          </div>
        )}

        <Form method="post" onSubmit={() => setIsSubmitting(true)}>
          <div className="form-section">
            <h3 className="form-section-title">基本信息</h3>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">
                  车牌号 <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  type="text"
                  name="plateNumber"
                  className="form-input"
                  placeholder="例如：京A12345"
                  required
                  maxLength={10}
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  VIN码 <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  type="text"
                  name="vin"
                  className="form-input"
                  placeholder="17位车辆识别代码"
                  required
                  maxLength={17}
                  style={{ textTransform: "uppercase" }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  品牌 <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  type="text"
                  name="brand"
                  className="form-input"
                  placeholder="例如：宝马"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  型号 <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  type="text"
                  name="vehicleModel"
                  className="form-input"
                  placeholder="例如：325Li"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  年款 <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  type="number"
                  name="year"
                  className="form-input"
                  placeholder="例如：2022"
                  required
                  min={1990}
                  max={new Date().getFullYear()}
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  颜色 <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  type="text"
                  name="color"
                  className="form-input"
                  placeholder="例如：白色"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  里程数(公里) <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  type="number"
                  name="mileage"
                  className="form-input"
                  placeholder="例如：15000"
                  required
                  min={0}
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  燃油类型 <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <select name="fuelType" className="form-input" required>
                  <option value="">请选择</option>
                  {Object.entries(FUEL_TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">
                  变速箱 <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <select name="transmission" className="form-input" required>
                  <option value="">请选择</option>
                  {Object.entries(TRANSMISSION_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">排量</label>
                <input
                  type="text"
                  name="displacement"
                  className="form-input"
                  placeholder="例如：2.0T"
                />
              </div>

              <div className="form-group">
                <label className="form-label">上牌日期</label>
                <input
                  type="date"
                  name="registerDate"
                  className="form-input"
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3 className="form-section-title">车主信息</h3>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">原车主姓名</label>
                <input
                  type="text"
                  name="firstOwnerName"
                  className="form-input"
                  placeholder="请输入姓名"
                />
              </div>

              <div className="form-group">
                <label className="form-label">原车主电话</label>
                <input
                  type="tel"
                  name="firstOwnerPhone"
                  className="form-input"
                  placeholder="请输入手机号"
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3 className="form-section-title">资料检查</h3>
            <p style={{ color: "#6b7280", fontSize: "14px", marginBottom: "16px" }}>
              勾选已有的资料，系统将根据资料完整性自动评估风险等级
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
              {documentKeys.map((key) => (
                <label
                  key={key}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "10px 12px",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    cursor: "pointer",
                    transition: "border-color 0.2s",
                  }}
                  className="doc-checkbox-label"
                >
                  <input
                    type="checkbox"
                    name={`doc_${key}`}
                    style={{ width: "16px", height: "16px", cursor: "pointer" }}
                  />
                  <span style={{ fontSize: "14px", color: "#374151" }}>
                    {DOCUMENT_NAMES[key] || key}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="form-section">
            <h3 className="form-section-title">备注</h3>
            <div className="form-group">
              <textarea
                name="notes"
                className="form-input"
                rows={3}
                placeholder="输入备注信息..."
                style={{ resize: "vertical" }}
              />
            </div>
          </div>

          <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "24px" }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate(-1)}
              disabled={isSubmitting}
            >
              取消
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? "保存中..." : "保存档案"}
            </button>
          </div>
        </Form>
      </div>
    </Layout>
  );
}
