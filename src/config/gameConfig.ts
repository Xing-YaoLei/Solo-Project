import type { Sponsor, TicketType, LevelConfig, VerificationRecord } from '../types/game';

export const sponsors: Sponsor[] = [
  {
    id: 'sponsor_gold',
    name: '金耀集团',
    description: '首席赞助商，享有最高级别的品牌曝光权',
    color: '#E9B824',
    benefits: [
      { id: 'ben_vip', name: 'VIP 通道', description: '专属快速入场通道' },
      { id: 'ben_lounge', name: '贵宾休息室', description: '专属休息区域' },
      { id: 'ben_gift', name: '限量礼品', description: '定制纪念礼品' },
    ],
  },
  {
    id: 'sponsor_tech',
    name: '星辰科技',
    description: '科技合作伙伴，提供技术支持与互动体验',
    color: '#219C90',
    benefits: [
      { id: 'ben_tech', name: '科技体验区', description: '最新科技产品体验' },
      { id: 'ben_wifi', name: '专属 Wi-Fi', description: '高速网络服务' },
    ],
  },
  {
    id: 'sponsor_food',
    name: '美味餐饮',
    description: '官方餐饮供应商，提供美食体验',
    color: '#D83F31',
    benefits: [
      { id: 'ben_food', name: '餐饮券', description: '免费餐饮兑换' },
      { id: 'ben_drink', name: '饮品券', description: '指定饮品免费' },
    ],
  },
  {
    id: 'sponsor_media',
    name: '环球传媒',
    description: '官方媒体合作伙伴，全程报道活动',
    color: '#6C5CE7',
    benefits: [
      { id: 'ben_media', name: '媒体专访', description: '获得媒体采访机会' },
      { id: 'ben_photo', name: '专业摄影', description: '活动纪念照片' },
    ],
  },
];

export const ticketTypes: TicketType[] = [
  {
    id: 'ticket_vvip',
    name: 'VVIP 至尊票',
    color: '#E9B824',
    price: 2999,
    benefits: ['ben_vip', 'ben_lounge', 'ben_gift', 'ben_food', 'ben_drink', 'ben_tech', 'ben_media', 'ben_photo'],
    scoringRules: [
      { id: 'rule_vvip_correct', condition: '正确核销', points: 50, type: 'bonus' },
      {
        id: 'rule_vvip_sponsor_match',
        condition: '匹配首席赞助商',
        points: 30,
        type: 'bonus',
        sponsorCondition: {
          sponsorIds: ['sponsor_gold'],
          matchType: 'any',
        },
      },
      { id: 'rule_vvip_wrong', condition: '核销错误', points: -25, type: 'penalty' },
    ],
  },
  {
    id: 'ticket_vip',
    name: 'VIP 贵宾票',
    color: '#9B59B6',
    price: 1299,
    benefits: ['ben_vip', 'ben_lounge', 'ben_food', 'ben_drink'],
    scoringRules: [
      { id: 'rule_vip_correct', condition: '正确核销', points: 30, type: 'bonus' },
      {
        id: 'rule_vip_sponsor_match',
        condition: '匹配科技赞助商',
        points: 20,
        type: 'bonus',
        sponsorCondition: {
          sponsorIds: ['sponsor_tech'],
          matchType: 'any',
        },
      },
      { id: 'rule_vip_wrong', condition: '核销错误', points: -15, type: 'penalty' },
    ],
  },
  {
    id: 'ticket_standard',
    name: '标准票',
    color: '#3498DB',
    price: 399,
    benefits: ['ben_food'],
    scoringRules: [
      { id: 'rule_std_correct', condition: '正确核销', points: 15, type: 'bonus' },
      { id: 'rule_std_wrong', condition: '核销错误', points: -10, type: 'penalty' },
    ],
  },
  {
    id: 'ticket_student',
    name: '学生票',
    color: '#2ECC71',
    price: 199,
    benefits: ['ben_drink'],
    scoringRules: [
      { id: 'rule_stu_correct', condition: '正确核销', points: 15, type: 'bonus' },
      { id: 'rule_stu_wrong', condition: '核销错误', points: -10, type: 'penalty' },
    ],
  },
];

export const levels: LevelConfig[] = [
  {
    id: 'level_1',
    name: '入门：社区嘉年华',
    description: '熟悉核销流程，处理简单的票务记录',
    difficulty: 'easy',
    targetScore: 200,
    sponsorIds: ['sponsor_food'],
    ticketTypeIds: ['ticket_standard', 'ticket_student'],
    recordCount: 10,
    disputeChance: 0.1,
    unlocked: true,
    stars: 0,
  },
  {
    id: 'level_2',
    name: '进阶：科技峰会',
    description: '多种票型与赞助商，处理更复杂的核销',
    difficulty: 'medium',
    targetScore: 500,
    sponsorIds: ['sponsor_tech', 'sponsor_food'],
    ticketTypeIds: ['ticket_vip', 'ticket_standard', 'ticket_student'],
    recordCount: 15,
    disputeChance: 0.2,
    unlocked: false,
    stars: 0,
  },
  {
    id: 'level_3',
    name: '高级：年度盛典',
    description: '全票种多赞助商，高争议率的终极挑战',
    difficulty: 'hard',
    targetScore: 1000,
    sponsorIds: ['sponsor_gold', 'sponsor_tech', 'sponsor_food', 'sponsor_media'],
    ticketTypeIds: ['ticket_vvip', 'ticket_vip', 'ticket_standard', 'ticket_student'],
    recordCount: 20,
    disputeChance: 0.3,
    unlocked: false,
    stars: 0,
  },
];

const attendeeNames = [
  '张明', '李华', '王芳', '刘伟', '陈静', '杨帆', '赵磊', '周婷',
  '吴强', '郑丽', '孙浩', '马超', '朱琳', '胡军', '林雪', '徐峰',
  '何欣', '罗杰', '梁宇', '宋雨',
];

function formatTime(hour: number, minute: number): string {
  const h = hour.toString().padStart(2, '0');
  const m = minute.toString().padStart(2, '0');
  return `${h}:${m}`;
}

function getAllowedBenefits(ticket: TicketType, sponsor: Sponsor | null): string[] {
  const allowed = [...ticket.benefits];
  if (sponsor) {
    allowed.push(...sponsor.benefits.map(b => b.id));
  }
  return [...new Set(allowed)];
}

function computeValidity(
  claimedBenefits: string[],
  allowedBenefits: string[]
): { isValid: boolean; invalidReason?: string } {
  const extra = claimedBenefits.filter(b => !allowedBenefits.includes(b));
  if (extra.length > 0) {
    const allSponsorBenefits = sponsors.flatMap(s => s.benefits);
    const extraNames = extra.map(id => {
      const b = allSponsorBenefits.find(sb => sb.id === id);
      return b ? b.name : id;
    });
    return {
      isValid: false,
      invalidReason: `权益越权: ${extraNames.join('、')} 不在持票人可享范围内`,
    };
  }
  return { isValid: true };
}

export function generateRecords(levelConfig: LevelConfig): VerificationRecord[] {
  const records: VerificationRecord[] = [];
  const { recordCount, ticketTypeIds, sponsorIds, disputeChance } = levelConfig;

  const availableTickets = ticketTypes.filter(t => ticketTypeIds.includes(t.id));
  const availableSponsors = sponsors.filter(s => sponsorIds.includes(s.id));
  const allSponsorBenefitIds = availableSponsors.flatMap(s => s.benefits.map(b => b.id));

  for (let i = 0; i < recordCount; i++) {
    const ticket = availableTickets[Math.floor(Math.random() * availableTickets.length)];
    const sponsor = availableSponsors.length > 0
      ? availableSponsors[Math.floor(Math.random() * availableSponsors.length)]
      : null;

    const baseHour = 9 + Math.floor(Math.random() * 6);
    const baseMinute = Math.floor(Math.random() * 60);

    const allowedBenefits = getAllowedBenefits(ticket, sponsor);

    const hasDispute = Math.random() < disputeChance;

    const shouldInvalidate = hasDispute || Math.random() < 0.35;

    let claimedBenefits: string[];
    let invalidReason: string | undefined;

    if (shouldInvalidate) {
      const validClaimCount = 1 + Math.floor(Math.random() * Math.min(ticket.benefits.length, 3));
      const validClaims = [...ticket.benefits].sort(() => Math.random() - 0.5).slice(0, validClaimCount);

      const extraPool = allSponsorBenefitIds.filter(b => !allowedBenefits.includes(b));
      if (extraPool.length > 0) {
        const extraCount = 1 + Math.floor(Math.random() * Math.min(extraPool.length, 2));
        const extras = extraPool.sort(() => Math.random() - 0.5).slice(0, extraCount);
        claimedBenefits = [...new Set([...validClaims, ...extras])];
      } else {
        const nonTicketBenefitIds = sponsors
          .filter(s => !sponsorIds.includes(s.id))
          .flatMap(s => s.benefits.map(b => b.id));
        if (nonTicketBenefitIds.length > 0) {
          const fakeBenefit = nonTicketBenefitIds[Math.floor(Math.random() * nonTicketBenefitIds.length)];
          claimedBenefits = [...new Set([...validClaims, fakeBenefit])];
        } else {
          claimedBenefits = validClaims;
        }
      }
    } else {
      const claimCount = 1 + Math.floor(Math.random() * Math.min(allowedBenefits.length, 4));
      claimedBenefits = [...allowedBenefits].sort(() => Math.random() - 0.5).slice(0, claimCount);
    }

    const { isValid, invalidReason: reason } = computeValidity(claimedBenefits, allowedBenefits);
    invalidReason = reason;

    const displayBenefits = [...claimedBenefits].sort(() => Math.random() - 0.5);

    let disputeReason: string | undefined;
    if (hasDispute) {
      const reasons = [
        '票券二维码损坏',
        '身份证件与购票信息不符',
        '票种权益与实际不符',
        '已超过入场时间限制',
        '票券已被核销使用',
        '赞助商权益未激活',
      ];
      disputeReason = reasons[Math.floor(Math.random() * reasons.length)];
    }

    records.push({
      id: `record_${i + 1}`,
      ticketType: ticket.id,
      attendeeName: attendeeNames[i % attendeeNames.length],
      time: formatTime(baseHour, baseMinute),
      sponsorId: sponsor?.id,
      benefits: displayBenefits,
      claimedBenefits,
      isValid,
      invalidReason,
      hasDispute,
      disputeReason,
      isChecked: false,
    });
  }

  return records;
}
