import { generateBill, sumTransactions } from './src/utils/billUtils';
import { CATEGORY_LABELS } from './src/types';
import type { DiscrepancyCategory } from './src/types';

const TYPE_LABELS: Record<string, string> = {
  order: '订单',
  refund: '退款',
  coupon: '优惠',
  platform_fee: '抽成',
  subsidy: '补贴',
  delivery: '配送'
};

function analyze(category: DiscrepancyCategory, title: string): void {
  console.log(`\n========== ${title} ==========`);
  const b = generateBill(0, 0, 0, category);
  const sum = sumTransactions(b.transactions);
  const diff = b.actualAmount - b.expectedAmount;

  console.log(`类别: ${b.discrepancyCategory} → ${CATEGORY_LABELS[b.discrepancyCategory]}`);
  console.log(`\n💵 金额面板:`);
  console.log(`  预期结算: ¥${b.expectedAmount.toFixed(2)}`);
  console.log(`  实际到账: ¥${b.actualAmount.toFixed(2)}`);
  console.log(`  差额:     ${diff >= 0 ? '+' : ''}¥${diff.toFixed(2)}`);
  console.log(`  流水汇总: ¥${sum.toFixed(2)}  ${Math.abs(sum - b.expectedAmount) < 0.01 ? '✅ = 预期' : '❌ ≠ 预期'}`);

  console.log(`\n📋 流水明细 (${b.transactions.length} 条):`);
  console.log(`  ${'类型'.padEnd(4)}  ${'单号'.padEnd(14)}  ${'金额'.padStart(12)}`);
  console.log(`  ${'─'.repeat(40)}`);
  b.transactions.slice(0, 8).forEach(tx => {
    const isPositive = tx.type === 'order' || tx.type === 'subsidy' || tx.type === 'delivery';
    const sign = isPositive ? '+' : '-';
    console.log(`  ${TYPE_LABELS[tx.type].padEnd(4)}  ${tx.orderNo.padEnd(14)}  ${sign}¥${tx.amount.toFixed(2).padStart(9)}`);
  });
  if (b.transactions.length > 8) {
    console.log(`  ... 还有 ${b.transactions.length - 8} 条`);
  }

  console.log(`\n🔍 逻辑验证:`);
  if (b.discrepancyCategory === 'refund_missing') {
    const refunds = b.transactions.filter(t => t.type === 'refund').reduce((s, t) => s + t.amount, 0);
    const manualActual = b.expectedAmount + refunds;
    const ok = Math.abs(manualActual - b.actualAmount) < 0.01;
    console.log(`  退款总额: ¥${refunds.toFixed(2)}`);
    console.log(`  预期 + 退款 = ¥${manualActual.toFixed(2)}  ${ok ? '✅ = 实际到账' : '❌ ≠ 实际到账 (¥' + b.actualAmount.toFixed(2) + ')'}`);
    console.log(`  解释: 流水有退款 ¥${refunds.toFixed(2)}，预期已扣除，但实际没扣 → 实际多了 ¥${refunds.toFixed(2)}`);
  } else if (b.discrepancyCategory === 'coupon_missing') {
    const coupons = b.transactions.filter(t => t.type === 'coupon').reduce((s, t) => s + t.amount, 0);
    const manualActual = b.expectedAmount + coupons;
    const ok = Math.abs(manualActual - b.actualAmount) < 0.01;
    console.log(`  优惠券总额: ¥${coupons.toFixed(2)}`);
    console.log(`  预期 + 优惠券 = ¥${manualActual.toFixed(2)}  ${ok ? '✅ = 实际到账' : '❌ ≠ 实际到账 (¥' + b.actualAmount.toFixed(2) + ')'}`);
    console.log(`  解释: 流水有优惠 ¥${coupons.toFixed(2)}，预期已扣除，但实际没扣 → 实际多了 ¥${coupons.toFixed(2)}`);
  } else if (b.discrepancyCategory === 'subsidy_missing') {
    const subsidy = b.transactions.filter(t => t.type === 'subsidy').reduce((s, t) => s + t.amount, 0);
    const manualActual = b.expectedAmount - subsidy;
    const ok = Math.abs(manualActual - b.actualAmount) < 0.01;
    console.log(`  补贴总额: ¥${subsidy.toFixed(2)}`);
    console.log(`  预期 - 补贴 = ¥${manualActual.toFixed(2)}  ${ok ? '✅ = 实际到账' : '❌ ≠ 实际到账 (¥' + b.actualAmount.toFixed(2) + ')'}`);
    console.log(`  解释: 流水有补贴 ¥${subsidy.toFixed(2)}，预期已包含，但实际没加 → 实际少了 ¥${subsidy.toFixed(2)}`);
  } else if (b.discrepancyCategory === 'correct') {
    console.log(`  预期 = 实际 = 流水汇总 → ✅ 金额正确`);
  } else if (b.discrepancyCategory === 'order_missing') {
    const orders = b.transactions.filter(t => t.type === 'order');
    const maxOrder = Math.max(...orders.map(o => o.amount));
    console.log(`  订单 ${orders.length} 笔，最大单笔 ¥${maxOrder.toFixed(2)}`);
    console.log(`  流水里有这笔大额订单，预期已包含，但实际没入账 → 实际少了 ¥${Math.abs(diff).toFixed(2)}`);
  }
}

analyze('correct', '金额正确');
analyze('refund_missing', '退款未扣除');
analyze('coupon_missing', '优惠未抵扣');
analyze('subsidy_missing', '补贴未到账');
analyze('order_missing', '订单漏入账');
