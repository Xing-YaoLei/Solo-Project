import { NextResponse } from "next/server";
import { SyncService } from "@/services/sync.service";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { payments } = body;

    if (!Array.isArray(payments) || payments.length === 0) {
      return NextResponse.json(
        { success: false, error: "Payments array is required and must not be empty" },
        { status: 400 }
      );
    }

    const validPayments = payments.map((payment: any) => ({
      ...payment,
      paidAt: new Date(payment.paidAt),
    }));

    const result = await SyncService.syncPayments(validPayments);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Failed to sync payments:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
