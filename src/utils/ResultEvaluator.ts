import type { WorkOrderResult, RepairItem, DiagnosisItem } from '@/types';
import { getRequiredItemsForFaultCodes } from '@/data/repairs';
import { calculateItemTotal, calculateTotalPrice } from '@/utils/QuoteCalculator';
import { GAME_CONFIG } from '@/config/constants';

interface EvaluatorInput {
  selectedItemIds: string[];
  availableItems: RepairItem[];
  faultCodes: string[];
  elapsedTime: number;
  timeLimit: number;
}

export function evaluateWorkOrder(input: EvaluatorInput): WorkOrderResult {
  const { selectedItemIds, availableItems, faultCodes, elapsedTime, timeLimit } = input;

  const requiredItemIds = getRequiredItemsForFaultCodes(faultCodes);
  const selectedItems = availableItems.filter(item => selectedItemIds.includes(item.id));
  const selectedRequiredItems = selectedItems.filter(item => requiredItemIds.includes(item.id));

  const missingItems = requiredItemIds.filter(id => !selectedItemIds.includes(id));
  const unnecessaryItems = selectedItemIds.filter(id => {
    const item = availableItems.find(i => i.id === id);
    return item && !item.required && !requiredItemIds.includes(id) && !item.relatedFaultId;
  });

  const selectedTotal = calculateTotalPrice(selectedItems);
  const idealTotal = calculateTotalPrice(
    availableItems.filter(item => requiredItemIds.includes(item.id))
  );

  const priceDiff = Math.abs(selectedTotal - idealTotal);
  const priceAccuracy = Math.max(0, 1 - priceDiff / Math.max(idealTotal, 1));

  const isRework = missingItems.length > 0;
  const isComplaint = unnecessaryItems.length >= 3;

  let score = 100;
  let stars = 5;

  score -= missingItems.length * 20;
  score -= unnecessaryItems.length * 8;
  score -= Math.max(0, priceAccuracy < 0.85 ? (0.85 - priceAccuracy) * 100 : 0);

  const timeRatio = elapsedTime / timeLimit;
  if (timeRatio > 0.9) score -= 10;
  else if (timeRatio < 0.4) score += 10;

  score = Math.max(0, Math.min(100, score));

  if (score >= 90) stars = 5;
  else if (score >= 75) stars = 4;
  else if (score >= 60) stars = 3;
  else if (score >= 40) stars = 2;
  else stars = 1;

  let message = '';
  if (!isRework && !isComplaint && score >= 85) {
    message = '非常专业！诊断准确，报价合理，客户非常满意！';
  } else if (isRework) {
    message = `有 ${missingItems.length} 项必要维修遗漏了，客户回来返修了...下次要更仔细！`;
  } else if (isComplaint) {
    message = '报价项目太多了，客户觉得你在过度维修，投诉到了老板那里...';
  } else if (score >= 60) {
    message = '整体还不错，但报价可以更精准一些。';
  } else {
    message = '需要多加练习，建议重新查看诊断结果。';
  }

  return {
    success: !isRework && !isComplaint,
    score: Math.round(score),
    isRework,
    isComplaint,
    missingItems,
    unnecessaryItems,
    priceAccuracy: Math.round(priceAccuracy * 100),
    message,
    stars
  };
}

export function getDiagnosisFromFaultCodes(faultCodes: string[], allItems: RepairItem[]): DiagnosisItem[] {
  const diagnosis: DiagnosisItem[] = faultCodes.map((code, index) => {
    const relatedItem = allItems.find(item => item.relatedFaultId === code);
    return {
      id: `diag_${code}`,
      name: relatedItem?.name || `故障码 ${code}`,
      confirmed: index === 0,
      severity: (Math.min(5, Math.max(1, 3 - index + Math.floor(Math.random() * 3))) as 1 | 2 | 3 | 4 | 5),
      description: relatedItem?.description || '检测到异常，需进一步排查',
      relatedFaultCode: code
    };
  });
  return diagnosis;
}
