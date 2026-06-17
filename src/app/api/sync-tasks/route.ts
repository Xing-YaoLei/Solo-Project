import { NextResponse } from "next/server";
import { getSyncTasks } from "@/lib/dataService";

export async function GET() {
  return NextResponse.json({ tasks: getSyncTasks() });
}
