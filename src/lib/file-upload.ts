import * as XLSX from "xlsx";

export interface ParsedPaymentRecord {
  materialName: string;
  category: string;
  specification?: string;
  quantity: number;
  unit: string;
  supplierName: string;
  amount: number;
  paymentDate: string;
  projectName: string;
}

export interface ParsedDesignRecord {
  materialName: string;
  category: string;
  specification?: string;
  quantity: number;
  unit: string;
  projectName: string;
}

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  瓷砖: ["砖", "瓷砖", "地砖", "墙砖", "抛光砖", "抛釉砖", "瓷片"],
  涂料: ["漆", "涂料", "乳胶漆", "真石漆", "底漆", "面漆"],
  管材: ["管", "水管", "线管", "PPR", "PVC", "地暖", "排水管"],
  五金: ["锁", "合页", "角阀", "龙头", "五金", "螺丝", "铰链"],
  电线: ["线", "电线", "电缆", "网线", "BV线", "护套线"],
  木材: ["板", "木", "地板", "木工板", "密度板", "生态板", "实木"],
  玻璃: ["玻璃", "钢化", "中空", "磨砂", "夹胶"],
  防水材料: ["防水", "卷材", "堵漏", "聚氨酯", "JS", "防水涂料"],
};

export function detectCategory(materialName: string): string {
  const name = materialName.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (name.includes(keyword.toLowerCase())) {
        return category;
      }
    }
  }
  return "其他";
}

export async function parseExcelFile<T = any>(file: File): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as T[];
        resolve(jsonData);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error("文件读取失败"));
    };

    reader.readAsBinaryString(file);
  });
}

export async function parsePaymentFile(
  file: File
): Promise<ParsedPaymentRecord[]> {
  const records: ParsedPaymentRecord[] = [];
  const ext = file.name.split(".").pop()?.toLowerCase();

  if (ext === "csv" || file.type === "text/csv") {
    const content = await file.text();
    const lines = content.split("\n").filter((line) => line.trim());
    const headers = lines[0].split(/[,|\t]/).map((h) => h.trim());

    const nameIdx = headers.findIndex(
      (h) => h.includes("材料") || h.includes("名称") || h.includes("品名")
    );
    const qtyIdx = headers.findIndex(
      (h) => h.includes("数量") || h.includes("件数")
    );
    const unitIdx = headers.findIndex((h) => h.includes("单位"));
    const supplierIdx = headers.findIndex(
      (h) => h.includes("供应商") || h.includes("厂家")
    );
    const amountIdx = headers.findIndex(
      (h) => h.includes("金额") || h.includes("总价")
    );
    const dateIdx = headers.findIndex(
      (h) => h.includes("日期") || h.includes("时间")
    );
    const projectIdx = headers.findIndex(
      (h) => h.includes("项目") || h.includes("工地")
    );
    const specIdx = headers.findIndex(
      (h) => h.includes("规格") || h.includes("型号")
    );

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(/[,|\t]/).map((v) => v.trim());
      if (values.length < 3) continue;

      const materialName = values[nameIdx] || values[0];
      const quantity = parseFloat(values[qtyIdx] || values[2]) || 0;
      const unit = values[unitIdx] || values[3] || "件";
      const supplierName = values[supplierIdx] || values[4] || "未知供应商";
      const amount = parseFloat(values[amountIdx] || values[5]) || 0;
      const paymentDate = values[dateIdx] || values[6] || new Date().toISOString().split("T")[0];
      const projectName = values[projectIdx] || values[7] || "默认项目";
      const specification = values[specIdx] || undefined;

      if (!materialName || quantity <= 0) continue;

      records.push({
        materialName,
        category: detectCategory(materialName),
        specification,
        quantity,
        unit,
        supplierName,
        amount,
        paymentDate,
        projectName,
      });
    }
  } else if (
    ext === "xlsx" ||
    ext === "xls" ||
    file.type ===
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  ) {
    const data = await parseExcelFile(file);

    for (const row of data) {
      const keys = Object.keys(row);
      const nameKey = keys.find(
        (k) => k.includes("材料") || k.includes("名称") || k.includes("品名")
      ) || keys[0];
      const qtyKey = keys.find(
        (k) => k.includes("数量") || k.includes("件数")
      ) || keys[2];
      const unitKey = keys.find((k) => k.includes("单位")) || keys[3];
      const supplierKey = keys.find(
        (k) => k.includes("供应商") || k.includes("厂家")
      ) || keys[4];
      const amountKey = keys.find(
        (k) => k.includes("金额") || k.includes("总价")
      ) || keys[5];
      const dateKey = keys.find(
        (k) => k.includes("日期") || k.includes("时间")
      ) || keys[6];
      const projectKey = keys.find(
        (k) => k.includes("项目") || k.includes("工地")
      ) || keys[7];
      const specKey = keys.find(
        (k) => k.includes("规格") || k.includes("型号")
      ) || keys[8];

      const materialName = String(row[nameKey] || "");
      const quantity = parseFloat(row[qtyKey]) || 0;
      const unit = String(row[unitKey] || "件");
      const supplierName = String(row[supplierKey] || "未知供应商");
      const amount = parseFloat(row[amountKey]) || 0;
      const rawDate = row[dateKey];
      let paymentDate = "";
      if (rawDate instanceof Date) {
        paymentDate = rawDate.toISOString().split("T")[0];
      } else if (typeof rawDate === "number") {
        const date = XLSX.SSF.parse_date_code(rawDate);
        paymentDate = `${date.y}-${String(date.m).padStart(2, "0")}-${String(
          date.d
        ).padStart(2, "0")}`;
      } else {
        paymentDate = String(rawDate || new Date().toISOString().split("T")[0]);
      }
      const projectName = String(row[projectKey] || "默认项目");
      const specification = row[specKey] ? String(row[specKey]) : undefined;

      if (!materialName || quantity <= 0) continue;

      records.push({
        materialName,
        category: detectCategory(materialName),
        specification,
        quantity,
        unit,
        supplierName,
        amount,
        paymentDate,
        projectName,
      });
    }
  }

  return records;
}

export async function parseDesignFile(
  file: File
): Promise<ParsedDesignRecord[]> {
  const records: ParsedDesignRecord[] = [];
  const ext = file.name.split(".").pop()?.toLowerCase();

  if (ext === "csv" || file.type === "text/csv") {
    const content = await file.text();
    const lines = content.split("\n").filter((line) => line.trim());
    const headers = lines[0].split(/[,|\t]/).map((h) => h.trim());

    const nameIdx = headers.findIndex(
      (h) => h.includes("材料") || h.includes("名称")
    );
    const qtyIdx = headers.findIndex((h) => h.includes("数量"));
    const unitIdx = headers.findIndex((h) => h.includes("单位"));
    const projectIdx = headers.findIndex(
      (h) => h.includes("项目") || h.includes("空间")
    );
    const specIdx = headers.findIndex(
      (h) => h.includes("规格") || h.includes("型号")
    );

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(/[,|\t]/).map((v) => v.trim());
      if (values.length < 3) continue;

      const materialName = values[nameIdx] || values[0];
      const quantity = parseFloat(values[qtyIdx] || values[2]) || 0;
      const unit = values[unitIdx] || values[3] || "件";
      const projectName = values[projectIdx] || values[4] || "默认项目";
      const specification = values[specIdx] || undefined;

      if (!materialName || quantity <= 0) continue;

      records.push({
        materialName,
        category: detectCategory(materialName),
        specification,
        quantity,
        unit,
        projectName,
      });
    }
  } else if (
    ext === "xlsx" ||
    ext === "xls" ||
    file.type ===
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  ) {
    const data = await parseExcelFile(file);

    for (const row of data) {
      const keys = Object.keys(row);
      const nameKey = keys.find(
        (k) => k.includes("材料") || k.includes("名称")
      ) || keys[0];
      const qtyKey = keys.find((k) => k.includes("数量")) || keys[2];
      const unitKey = keys.find((k) => k.includes("单位")) || keys[3];
      const projectKey = keys.find(
        (k) => k.includes("项目") || k.includes("空间")
      ) || keys[4];
      const specKey = keys.find(
        (k) => k.includes("规格") || k.includes("型号")
      ) || keys[5];

      const materialName = String(row[nameKey] || "");
      const quantity = parseFloat(row[qtyKey]) || 0;
      const unit = String(row[unitKey] || "件");
      const projectName = String(row[projectKey] || "默认项目");
      const specification = row[specKey] ? String(row[specKey]) : undefined;

      if (!materialName || quantity <= 0) continue;

      records.push({
        materialName,
        category: detectCategory(materialName),
        specification,
        quantity,
        unit,
        projectName,
      });
    }
  }

  return records;
}

export async function uploadImportData(
  source: "PAYMENT" | "DESIGN_EXPORT" | "PHOTO",
  formData: FormData
): Promise<any> {
  const response = await fetch("/api/import", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "导入失败");
  }

  return response.json();
}

export function generateBatchNo(source: string): string {
  const now = new Date();
  const year = now.getFullYear();
  const timestamp = String(now.getTime()).slice(-6);
  const prefix =
    source === "PAYMENT"
      ? "PAY"
      : source === "DESIGN_EXPORT"
      ? "DES"
      : "PHO";
  return `${prefix}-${year}-${timestamp}`;
}
