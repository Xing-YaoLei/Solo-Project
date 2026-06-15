import { CapacityRule, type ICapacityRule } from "~/models/CapacityRule";
import { cacheDel } from "~/utils/redis";
import { connectDB } from "~/utils/db";

export async function getCapacityRules() {
  await connectDB();
  return CapacityRule.find({ isActive: true }).sort({ courseType: 1 });
}

export async function getCapacityRuleByCourseType(courseType: string) {
  await connectDB();
  return CapacityRule.findOne({ courseType, isActive: true });
}

export async function createCapacityRule(data: Omit<ICapacityRule, "createdAt" | "updatedAt">) {
  await connectDB();
  const rule = await CapacityRule.create(data);
  await cacheDel(`capacity:*`);
  return rule;
}

export async function updateCapacityRule(id: string, data: Partial<ICapacityRule>) {
  await connectDB();
  const rule = await CapacityRule.findByIdAndUpdate(id, data, { new: true });
  if (!rule) throw new Response("Not found", { status: 404 });
  await cacheDel(`capacity:*`);
  return rule;
}
