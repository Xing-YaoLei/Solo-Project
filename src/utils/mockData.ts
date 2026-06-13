import { Product, Settlement, Batch, Difficulty } from '@/types';
import {
  BATCH_COLORS,
  PRODUCT_CATEGORIES,
  PRODUCT_NAMES,
  SHELF_CONFIG,
  getDifficultyConfig,
} from './constants';

const generateId = (prefix: string) =>
  `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export const generateBatches = (count: number): Batch[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: `团购批次${String.fromCharCode(65 + i)}`,
    deliveryTime: `2024-01-${String(15 + i).padStart(2, '0')} 0${8 + i}:00`,
    totalProducts: 0,
    defectRate: 0.1 + Math.random() * 0.2,
    color: BATCH_COLORS[i % BATCH_COLORS.length],
  }));
};

export const generateProducts = (
  count: number,
  batches: Batch[],
  defectRate: number
): Product[] => {
  const products: Product[] = [];
  const { rows, cols, width, height } = SHELF_CONFIG;

  for (let i = 0; i < count; i++) {
    const batchIndex = Math.floor(Math.random() * batches.length);
    const batch = batches[batchIndex];
    const isDefective = Math.random() < defectRate;
    const defectTypes = ['shortage', 'damaged', 'wrong_item', 'expired'] as const;

    const row = Math.floor(i / cols) % rows;
    const col = i % cols;

    const x = (col - cols / 2 + 0.5) * (width / cols);
    const y = row * (height / rows) + 0.5;
    const z = (row % 2 === 0 ? 1 : -1) * 0.5;

    products.push({
      id: generateId('prod'),
      name: PRODUCT_NAMES[i % PRODUCT_NAMES.length],
      sku: `SKU${String(1000 + i).padStart(6, '0')}`,
      category: PRODUCT_CATEGORIES[Math.floor(Math.random() * PRODUCT_CATEGORIES.length)],
      batchId: batch.id,
      price: Math.round((5 + Math.random() * 95) * 100) / 100,
      quantity: Math.floor(1 + Math.random() * 5),
      tagColor: batch.color,
      isDefective,
      defectType: isDefective ? defectTypes[Math.floor(Math.random() * defectTypes.length)] : undefined,
      position: { x, y, z },
      size: { x: 0.8, y: 0.6, z: 0.8 },
      isWarning: false,
      isProcessed: false,
    });
  }

  return products;
};

export const generateSettlements = (
  count: number,
  products: Product[],
  batches: Batch[]
): Settlement[] => {
  const settlements: Settlement[] = [];
  const customerNames = ['张先生', '李女士', '王阿姨', '赵叔叔', '陈小姐'];

  const validProducts = products.filter((p) => !p.isDefective);

  const batchToSettlements: Record<number, string[]> = {};
  batches.forEach((b) => {
    batchToSettlements[b.id] = [];
  });

  for (let i = 0; i < count; i++) {
    const batch = batches[i % batches.length];
    batchToSettlements[batch.id].push(customerNames[i % customerNames.length]);
  }

  const settlementTemplates: Array<{
    batchId: number;
    index: number;
    customerName: string;
  }> = [];
  batches.forEach((batch) => {
    const sList = batchToSettlements[batch.id];
    sList.forEach((name, idx) => {
      settlementTemplates.push({
        batchId: batch.id,
        index: idx,
        customerName: name,
      });
    });
  });

  const batchProductsGroup: Record<number, Product[]> = {};
  batches.forEach((b) => {
    batchProductsGroup[b.id] = validProducts.filter(
      (p) => p.batchId === b.id
    );
  });

  settlementTemplates.forEach((template) => {
    const batchProducts = batchProductsGroup[template.batchId];
    settlements.push({
      id: generateId('settle'),
      batchId: template.batchId,
      productIds: [],
      totalAmount: 0,
      status: 'pending',
      customerName: template.customerName,
      pickupCode: `T${String(
        1000 + settlements.length * 7
      ).padStart(4, '0')}`,
    });
  });

  batches.forEach((batch) => {
    const batchProducts = batchProductsGroup[batch.id];
    const batchSettlements = settlements.filter(
      (s) => s.batchId === batch.id
    );

    if (batchSettlements.length === 0 || batchProducts.length === 0) return;

    batchProducts.forEach((product, idx) => {
      const targetSettlement =
        batchSettlements[idx % batchSettlements.length];
      targetSettlement.productIds.push(product.id);
    });

    batchSettlements.forEach((s) => {
      s.totalAmount = Math.round(
        s.productIds
          .reduce((sum, pid) => {
            const p = products.find((pp) => pp.id === pid);
            return sum + (p ? p.price * p.quantity : 0);
          }, 0) * 100
      ) / 100;
    });
  });

  return settlements.filter((s) => s.productIds.length > 0);
};

export const generateGameData = (difficulty: Difficulty) => {
  const config = getDifficultyConfig(difficulty);
  const batchCount = Math.min(config.settlementCount, 3);
  const batches = generateBatches(batchCount);
  const products = generateProducts(config.productCount, batches, config.defectRate);
  const settlements = generateSettlements(config.settlementCount, products, batches);

  batches.forEach((batch) => {
    batch.totalProducts = products.filter((p) => p.batchId === batch.id).length;
  });

  return { batches, products, settlements };
};

export const matchProductToSettlement = (
  product: Product,
  settlement: Settlement,
  batches: Batch[]
): {
  isMatch: boolean;
  errorType?:
    | 'wrong_batch'
    | 'wrong_product'
    | 'shortage'
    | 'expired'
    | 'damaged'
    | 'wrong_settlement';
} => {
  if (product.isDefective && product.defectType === 'shortage') {
    return { isMatch: false, errorType: 'shortage' };
  }

  if (product.isDefective && product.defectType === 'expired') {
    return { isMatch: false, errorType: 'expired' };
  }

  if (product.isDefective && product.defectType === 'damaged') {
    return { isMatch: false, errorType: 'damaged' };
  }

  if (product.batchId !== settlement.batchId) {
    return { isMatch: false, errorType: 'wrong_batch' };
  }

  if (!settlement.productIds.includes(product.id)) {
    return { isMatch: false, errorType: 'wrong_product' };
  }

  return { isMatch: true };
};

export const shouldTriggerWarning = (
  timeRemaining: number,
  timeThreshold: number,
  defectiveProducts: Product[],
  processedIds: string[]
): string[] => {
  if (timeRemaining > timeThreshold) return [];

  const unprocessedDefective = defectiveProducts.filter(
    (p) => !processedIds.includes(p.id)
  );

  if (unprocessedDefective.length === 0) return [];

  const warningIntensity = Math.max(
    0.3,
    Math.min(1, 1 - timeRemaining / timeThreshold)
  );

  return unprocessedDefective.map((p) => p.id);
};

export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const calculateScore = (
  correctCount: number,
  timeRemaining: number,
  difficulty: Difficulty
): number => {
  const config = getDifficultyConfig(difficulty);
  const baseScore = correctCount * config.scorePerCorrect;
  const timeBonus = Math.floor(timeRemaining * config.timeBonusMultiplier);
  return baseScore + timeBonus;
};

export const calculateOnTimeRate = (
  correctCount: number,
  totalCount: number
): number => {
  if (totalCount === 0) return 100;
  return Math.round((correctCount / totalCount) * 100);
};
