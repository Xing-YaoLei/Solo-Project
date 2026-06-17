import { NextResponse } from "next/server";
import { getSites, getMaterials, getMaterialCategories } from "@/lib/dataService";

export async function GET() {
  return NextResponse.json({
    sites: getSites(),
    materials: getMaterials(),
    categories: getMaterialCategories(),
  });
}
