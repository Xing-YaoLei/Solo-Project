import { NextRequest, NextResponse } from "next/server";
import { getContractList, getCaliberDefinitions } from "@/services/contractService";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const merchantId = searchParams.get("merchantId");
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");
    const type = searchParams.get("type");

    if (type === "calibers") {
      const calibers = getCaliberDefinitions();
      return NextResponse.json({ calibers });
    }

    const data = await getContractList({
      merchantId: merchantId || undefined,
      page,
      pageSize,
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("Contracts API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
