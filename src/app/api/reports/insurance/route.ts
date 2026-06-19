import { NextResponse } from "next/server";
import { getInsuranceDataFromDB } from "@/lib/dbService";
import { getRolePermissions } from "@/types";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const role = (searchParams.get("role") as string) || "director";
    const token = searchParams.get("token");

    const permissions = getRolePermissions(role as any);

    if (!permissions.canViewInsurance) {
      return NextResponse.json(
        { error: "无权限访问" },
        { status: 403 }
      );
    }

    const data = await getInsuranceDataFromDB();

    if (!permissions.canExportFull) {
      return NextResponse.json({
        ...data,
        claims: data.claims.map((claim) => ({
          ...claim,
          policyNumber: claim.policyNumber.substring(0, 6) + "****",
        })),
      });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Insurance API error:", error);
    return NextResponse.json(
      { error: "获取数据失败" },
      { status: 500 }
    );
  }
}
