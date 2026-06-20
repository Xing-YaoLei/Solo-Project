import type { CheckInRecord, RefundDispute, RefundOption } from '../types';

interface DisputeTemplate {
  reasons: string[];
  options: RefundOption[];
}

const DISPUTE_TEMPLATES: Record<string, DisputeTemplate> = {
  PARTIAL_REFUND: {
    reasons: [
      '{count}位顾客临时有事无法到场，要求退还相应票款',
      '部分成员因突发状况缺席，申请{count}张票的退票',
    ],
    options: [
      {
        id: 'opt-full-refund',
        label: '全额退款',
        description: '满足顾客诉求，全额退还缺席座位票款',
        scoreDelta: -10,
        occupancyImpact: -1,
      },
      {
        id: 'opt-partial-refund',
        label: '50%退款 + 补偿券',
        description: '退还50%票款，并赠送下次活动等额抵扣券',
        scoreDelta: 15,
        occupancyImpact: -0.5,
      },
      {
        id: 'opt-no-refund',
        label: '不同意退票',
        description: '按票务规则不支持临时退票，维持原座位分配',
        scoreDelta: -25,
        occupancyImpact: 0,
      },
    ],
  },
  UPGRADE_REQUEST: {
    reasons: [
      '顾客对分配的座位不满意，要求升级到更好的区域',
      '现场顾客希望补差价升级到更前排的位置',
    ],
    options: [
      {
        id: 'opt-upgrade-free',
        label: '免费升级',
        description: '如有空余高级座位，免费为顾客升级',
        scoreDelta: 20,
        occupancyImpact: 0,
      },
      {
        id: 'opt-upgrade-charge',
        label: '补差价升级',
        description: '要求顾客补足区域差价后升级',
        scoreDelta: 30,
        occupancyImpact: 0,
      },
      {
        id: 'opt-no-upgrade',
        label: '维持原座位',
        description: '告知顾客当前无可用升级选项',
        scoreDelta: -5,
        occupancyImpact: 0,
      },
    ],
  },
};

export function generateDispute(checkIn: CheckInRecord): RefundDispute | null {
  if (!checkIn.hasDispute) return null;

  const diff = checkIn.expectedCount - checkIn.actualCount;
  let templateKey = 'PARTIAL_REFUND';

  if (checkIn.disputeReason?.includes('满意') || checkIn.disputeReason?.includes('升级')) {
    templateKey = 'UPGRADE_REQUEST';
  }

  const template = DISPUTE_TEMPLATES[templateKey];
  const reasonTemplate = template.reasons[Math.floor(Math.random() * template.reasons.length)];
  const reason = (checkIn.disputeReason || reasonTemplate).replace('{count}', diff.toString());

  return {
    id: `dispute-${checkIn.id}`,
    checkInId: checkIn.id,
    orderId: checkIn.orderId,
    reason,
    affectedSeats: checkIn.checkedSeats,
    options: template.options.map((opt, idx) => ({
      ...opt,
      id: `${opt.id}-${idx}`,
    })),
  };
}

export function shouldTriggerRandomDispute(checkIn: CheckInRecord, probability = 0.15): boolean {
  if (checkIn.hasDispute) return true;
  if (checkIn.actualCount < checkIn.expectedCount) return Math.random() < 0.8;
  return Math.random() < probability;
}
