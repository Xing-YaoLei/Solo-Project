import type { PromotionRule, PlacementResult, ShelfCell, Medicine } from '@/types/game';
import { getPromotionRulesByIds } from '@/data/promotions';

export class PromotionRuleEngine {
  private rules: PromotionRule[] = [];

  constructor(ruleIds: string[]) {
    this.rules = getPromotionRulesByIds(ruleIds);
  }

  getRules(): PromotionRule[] {
    return [...this.rules];
  }

  checkPlacement(
    medicine: Medicine,
    targetCell: ShelfCell,
    allCells: ShelfCell[][]
  ): PlacementResult {
    let matchedRule: PromotionRule | undefined;
    let maxPoints = 0;
    let isCorrect = false;
    let message = '普通摆放';

    for (const rule of this.rules) {
      const matchesPosition = rule.targetPositions.some(
        pos => pos.row === targetCell.row && pos.col === targetCell.col
      );
      if (!matchesPosition) continue;
      const matchesCategory = rule.targetCategory
        ? medicine.category === rule.targetCategory
        : true;
      const matchesMedicine = rule.targetMedicineId
        ? medicine.id === rule.targetMedicineId
        : true;
      if (matchesCategory && matchesMedicine) {
        if (rule.points > maxPoints) {
          maxPoints = rule.points;
          matchedRule = rule;
          isCorrect = true;
          message = `${rule.name}: +${rule.points}分`;
        }
      }
    }
    if (!isCorrect) {
      const applicableRules = this.rules.filter(rule =>
        rule.targetPositions.some(pos => pos.row === targetCell.row && pos.col === targetCell.col)
      );
      if (applicableRules.length > 0) {
        maxPoints = -20;
        message = '位置错误，不符合促销规则';
      }
    }
    return {
      isCorrect,
      matchedRule,
      points: maxPoints,
      message,
    };
  }

  calculatePromotionAchievement(
    placements: { cardId: string; medicine: Medicine; cell: ShelfCell }[]
  ): Record<string, number> {
    const achievement: Record<string, number> = {};
    for (const rule of this.rules) {
      const totalTargets = rule.targetPositions.length;
      let achievedTargets = 0;
      for (const pos of rule.targetPositions) {
        const placement = placements.find(
          p => p.cell.row === pos.row && p.cell.col === pos.col
        );
        if (!placement) continue;
        const matchesCategory = rule.targetCategory
          ? placement.medicine.category === rule.targetCategory
          : true;
        const matchesMedicine = rule.targetMedicineId
          ? placement.medicine.id === rule.targetMedicineId
          : true;
        if (matchesCategory && matchesMedicine) {
          achievedTargets++;
        }
      }
      achievement[rule.id] = totalTargets > 0 ? (achievedTargets / totalTargets) * 100 : 0;
    }
    return achievement;
  }

  getRuleById(id: string): PromotionRule | undefined {
    return this.rules.find(r => r.id === id);
  }

  getHighlightedPositions(): { row: number; col: number; ruleId: string; color: string }[] {
    const positions: { row: number; col: number; ruleId: string; color: string }[] = [];
    const colors = ['#4FC3F7', '#81C784', '#FFD54F', '#BA68C8', '#FFB74D', '#F06292'];
    this.rules.forEach((rule, index) => {
      const color = colors[index % colors.length];
      rule.targetPositions.forEach(pos => {
        positions.push({ ...pos, ruleId: rule.id, color });
      });
    });
    return positions;
  }

  getTotalPossiblePoints(): number {
    return this.rules.reduce((sum, rule) => sum + rule.points * rule.targetPositions.length, 0);
  }
}
