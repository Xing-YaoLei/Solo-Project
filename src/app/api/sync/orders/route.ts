import { NextResponse } from "next/server";
import { SyncService } from "@/services/sync.service";
import { OrderStatus } from "@prisma/client";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orders } = body;

    if (!Array.isArray(orders) || orders.length === 0) {
      return NextResponse.json(
        { success: false, error: "Orders array is required and must not be empty" },
        { status: 400 }
      );
    }

    const validStatuses = Object.values(OrderStatus);
    const validOrders = orders.map((order: any) => ({
      ...order,
      status: validStatuses.includes(order.status)
        ? order.status
        : OrderStatus.PENDING,
      orderedAt: new Date(order.orderedAt),
      assignedAt: order.assignedAt ? new Date(order.assignedAt) : undefined,
      pickedUpAt: order.pickedUpAt ? new Date(order.pickedUpAt) : undefined,
      deliveredAt: order.deliveredAt ? new Date(order.deliveredAt) : undefined,
    }));

    const result = await SyncService.syncOrders(validOrders);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Failed to sync orders:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
