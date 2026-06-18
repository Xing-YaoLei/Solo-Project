import { NextResponse } from "next/server";
import { getSyncTasks, executeSyncTask } from "@/lib/dataService";
import { SyncTaskType } from "@/lib/constants";

export async function GET() {
  return NextResponse.json({ tasks: getSyncTasks() });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const taskType = body.taskType as SyncTaskType | "ALL";

    if (!taskType) {
      return NextResponse.json({ error: "taskType is required" }, { status: 400 });
    }

    const validTypes: Array<SyncTaskType | "ALL"> = [
      SyncTaskType.SUPERVISOR_PHOTO,
      SyncTaskType.PAYMENT_RECORD,
      SyncTaskType.PURCHASE_ORDER,
      "ALL",
    ];

    if (!validTypes.includes(taskType)) {
      return NextResponse.json({ error: "Invalid taskType" }, { status: 400 });
    }

    const result = await executeSyncTask(taskType);

    return NextResponse.json({
      success: true,
      ...result,
      message: result.totalAnomaliesCreated > 0
        ? `同步完成，检测到 ${result.totalAnomaliesCreated} 个问题已自动录入异常清单`
        : "同步完成，未发现问题数据",
    });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
