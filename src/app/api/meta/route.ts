import { NextResponse } from "next/server";
import { getSites, getMaterials, getMaterialCategories } from "@/lib/dataService";

export async function GET() {
  return NextResponse.json({
    sites: await getSites(),
    materials: await getMaterials(),
    categories: await getMaterialCategories(),
  });
}
