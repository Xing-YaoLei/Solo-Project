import { NextResponse } from "next/server";
import { getContractList, getCaliberDefinitions } from "@/services/contractService";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const merchantId = searchParams.get("merchantId") || undefined;
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");

    const contractsResult = await getContractList({ merchantId, page, pageSize });
    const calibers = getCaliberDefinitions();

    return NextResponse.json({
      contracts: contractsResult,
      calibers,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "未知错误";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
