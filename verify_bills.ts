import { generateBill, sumTransactions } from './src/utils/billUtils';
import type { DiscrepancyCategory } from './src/types';

const cats: DiscrepancyCategory[] = [
  'correct', 'refund_missing', 'coupon_missing',
  'platform_fee_wrong', 'subsidy_missing', 'delivery_fee_wrong', 'order_missing'
];

let allOk = true;
let checked = 0;

for (const cat of cats) {
  for (let i = 0; i < 20; i++) {
    checked++;
    const b = generateBill(0, 0, i, cat);
    const sum = sumTransactions(b.transactions);
    const expVsSum = Math.abs(b.expectedAmount - sum);
    const expVsAct = Math.abs(b.expectedAmount - b.actualAmount);

    if (expVsSum > 0.005) {
      console.log(`[${cat}] ❌ expectedAmount(¥${b.expectedAmount}) != 流水汇总(¥${sum}), diff=¥${expVsSum}`);
      allOk = false;
    }

    if (cat === 'correct') {
      if (expVsAct > 0.005) {
        console.log(`[correct] ❌ 金额正确但实际(¥${b.actualAmount}) != 预期(¥${b.expectedAmount}), diff=¥${expVsAct}`);
        allOk = false;
      }
    } else {
      if (expVsAct < 0.005) {
        console.log(`[${cat}] ❌ 差异类但实际(¥${b.actualAmount}) == 预期(¥${b.expectedAmount}), 应存在差异`);
        allOk = false;
      }
    }
  }
}

console.log(`\n共检查 ${checked} 张账单`);
console.log(allOk ? '✅ 全部验证通过' : '❌ 存在问题');
process.exit(allOk ? 0 : 1);
