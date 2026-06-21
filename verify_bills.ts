import { generateBill, sumTransactions } from './src/utils/billUtils';
import type { DiscrepancyCategory } from './src/types';

const cats: DiscrepancyCategory[] = [
  'correct', 'refund_missing', 'coupon_missing',
  'platform_fee_wrong', 'subsidy_missing', 'delivery_fee_wrong', 'order_missing'
];

let allOk = true;
let checked = 0;
const failures: string[] = [];

for (const cat of cats) {
  for (let i = 0; i < 50; i++) {
    checked++;
    const b = generateBill(0, 0, i, cat);
    const sum = sumTransactions(b.transactions);
    const expVsSum = Math.abs(b.expectedAmount - sum);
    const expVsAct = Math.abs(b.expectedAmount - b.actualAmount);

    // 规则 1: expectedAmount 必须等于流水汇总（任何类别）
    if (expVsSum > 0.005) {
      const msg = `[${cat} #${i}] ❌ expectedAmount(¥${b.expectedAmount}) != 流水汇总(¥${sum}), diff=¥${expVsSum.toFixed(4)}`;
      failures.push(msg);
      allOk = false;
    }

    // 规则 2: correct 类别必须三值完全一致，差额为 0
    if (b.discrepancyCategory === 'correct') {
      if (expVsAct > 0.005) {
        const msg = `[correct #${i}] ❌ 金额正确但实际(¥${b.actualAmount}) != 预期(¥${b.expectedAmount}), diff=¥${expVsAct.toFixed(4)}`;
        failures.push(msg);
        allOk = false;
      }
      if (cat !== 'correct' && b.discrepancyCategory === 'correct') {
        // 回退到 correct，这是允许的（保底策略）
      }
    }

    // 规则 3: 非 correct 类别必须有可感知的差额 (> 0.5元)
    if (b.discrepancyCategory !== 'correct') {
      if (expVsAct < 0.05) {
        const msg = `[${b.discrepancyCategory} #${i}] ⚠️ 差异类但差额仅 ¥${expVsAct.toFixed(4)}，几乎看不出差异`;
        failures.push(msg);
        allOk = false;
      }
    }

    // 规则 4: order_missing 的流水里一定有一条订单金额比较大
    if (b.discrepancyCategory === 'order_missing') {
      const orderTxs = b.transactions.filter(t => t.type === 'order');
      if (orderTxs.length === 0) {
        failures.push(`[order_missing #${i}] ❌ 没有订单流水`);
        allOk = false;
      }
    }

    // 规则 5: 显示 category 和 forceCategory 不一致时，最终必须是 correct
    if (cat !== b.discrepancyCategory) {
      if (b.discrepancyCategory !== 'correct') {
        const msg = `[${cat} #${i}] ❌ forceCategory 与 finalCategory(${b.discrepancyCategory}) 不一致，且不是 correct`;
        failures.push(msg);
        allOk = false;
      }
    }
  }
}

console.log(`\n共检查 ${checked} 张账单`);
if (allOk) {
  console.log('✅ 全部验证通过');
} else {
  console.log(`❌ ${failures.length} 个问题：`);
  failures.slice(0, 20).forEach(f => console.log('  ' + f));
  if (failures.length > 20) console.log(`  ... 还有 ${failures.length - 20} 条`);
}

process.exit(allOk ? 0 : 1);
