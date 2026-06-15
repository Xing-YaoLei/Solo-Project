import { CapacityRule, type ICapacityRule } from "~/models/CapacityRule";
import { cacheDel } from "~/utils/redis";
import { connectDB, isDbMockMode } from "~/utils/db";
import { mockStore, mockId } from "~/utils/mock-store";

export async function getCapacityRules() {
  if (isDbMockMode()) {
    return [...mockStore.capacityRules].sort((a, b) => a.courseType.localeCompare(b.courseType)) as any;
  }
  await connectDB();
  return CapacityRule.find({ isActive: true }).sort({ courseType: 1 });
}

export async function getCapacityRuleByCourseType(courseType: string) {
  if (isDbMockMode()) {
    return mockStore.capacityRules.find((r) => r.courseType === courseType) as any || null;
  }
  await connectDB();
  return CapacityRule.findOne({ courseType, isActive: true });
}

export async function createCapacityRule(data: Omit<ICapacityRule, "createdAt" | "updatedAt">) {
  if (isDbMockMode()) {
    const { _id, ...restData } = data as any;
    const rule: any = {
      ...restData,
      _id: mockId("cap_"),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockStore.capacityRules.push(rule);
    return rule;
  }
  await connectDB();
  const rule = await CapacityRule.create(data);
  await cacheDel(`capacity:*`);
  return rule;
}

export async function updateCapacityRule(id: string, data: Partial<ICapacityRule>) {
  if (isDbMockMode()) {
    const rule = mockStore.capacityRules.find((r) => r._id === id);
    if (!rule) throw new Response("Not found", { status: 404 });
    Object.assign(rule, data);
    return rule as any;
  }
  await connectDB();
  const rule = await CapacityRule.findByIdAndUpdate(id, data, { new: true });
  if (!rule) throw new Response("Not found", { status: 404 });
  await cacheDel(`capacity:*`);
  return rule;
}
