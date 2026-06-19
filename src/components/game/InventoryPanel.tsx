import { useGameStore } from '@/store/useGameStore';
import { formatCurrency } from '@/utils/format';
import { motion } from 'framer-motion';
import {
  Package,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  ArrowUpDown,
  DollarSign,
  Boxes,
  RefreshCcw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMemo, useState } from 'react';
import type { Part } from '@/types';

type SortKey = 'name' | 'stock' | 'price';

export default function InventoryPanel() {
  const { parts } = useGameStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('stock');
  const [sortAsc, setSortAsc] = useState(false);
  const [showOnlyShortage, setShowOnlyShortage] = useState(false);

  const totalParts = parts.reduce((sum, p) => sum + (p.stockCount ?? 0), 0);
  const shortageCount = parts.filter((p) => (p.stockCount ?? 0) <= 0).length;
  const alternativeCount = parts.filter((p) => p.isAlternativeAvailable).length;

  const filteredAndSortedParts = useMemo(() => {
    let result = [...parts];

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.category.toLowerCase().includes(term) ||
          p.description.toLowerCase().includes(term)
      );
    }

    if (showOnlyShortage) {
      result = result.filter((p) => (p.stockCount ?? 0) <= 0);
    }

    result.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'name':
          cmp = a.name.localeCompare(b.name);
          break;
        case 'stock':
          cmp = (a.stockCount ?? 0) - (b.stockCount ?? 0);
          break;
        case 'price':
          cmp = a.price - b.price;
          break;
      }
      return sortAsc ? cmp : -cmp;
    });

    return result;
  }, [parts, searchTerm, sortKey, sortAsc, showOnlyShortage]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  };

  const SortIcon = ({ active, ascending }: { active: boolean; ascending: boolean }) => (
    <ArrowUpDown
      className={cn(
        'h-3 w-3 transition-all',
        active && ascending && 'rotate-180',
        active ? 'text-white' : 'text-white/30'
      )}
    />
  );

  return (
    <div className="space-y-4 p-5">
      <div className="grid grid-cols-3 gap-3">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
        >
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20">
              <Boxes className="h-4 w-4 text-emerald-400" />
            </div>
            <div>
              <div className="text-xs text-white/50">总库存</div>
              <div className="text-xl font-bold text-white tabular-nums">{totalParts}</div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
        >
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500/20">
              <AlertTriangle className="h-4 w-4 text-red-400" />
            </div>
            <div>
              <div className="text-xs text-white/50">缺货</div>
              <div
                className={cn(
                  'text-xl font-bold tabular-nums',
                  shortageCount > 0 ? 'text-red-400' : 'text-white'
                )}
              >
                {shortageCount}
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
        >
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/20">
              <RefreshCcw className="h-4 w-4 text-blue-400" />
            </div>
            <div>
              <div className="text-xs text-white/50">可替代件</div>
              <div className="text-xl font-bold text-white tabular-nums">{alternativeCount}</div>
            </div>
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="flex items-center gap-2"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="搜索配件名称、分类..."
            className={cn(
              'w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4',
              'text-sm text-white placeholder:text-white/30 outline-none',
              'focus:border-white/20 focus:bg-white/[0.07] transition-all'
            )}
          />
        </div>
        <button
          onClick={() => setShowOnlyShortage(!showOnlyShortage)}
          className={cn(
            'flex h-10 items-center gap-1.5 rounded-xl border px-3 text-sm transition-all',
            showOnlyShortage
              ? 'border-red-500/30 bg-red-500/10 text-red-400'
              : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10'
          )}
        >
          <Filter className="h-4 w-4" />
          <span className="whitespace-nowrap">仅缺货</span>
        </button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="overflow-hidden rounded-2xl border border-white/10"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02]">
                <th className="py-3 pl-4 pr-2 text-left">
                  <button
                    onClick={() => handleSort('name')}
                    className="flex items-center gap-1.5 text-xs font-medium text-white/70 hover:text-white transition-colors"
                  >
                    <Package className="h-3.5 w-3.5" />
                    配件名称
                    <SortIcon active={sortKey === 'name'} ascending={sortAsc} />
                  </button>
                </th>
                <th className="px-2 py-3 text-left">
                  <button
                    onClick={() => handleSort('stock')}
                    className="flex items-center gap-1.5 text-xs font-medium text-white/70 hover:text-white transition-colors"
                  >
                    <Boxes className="h-3.5 w-3.5" />
                    库存
                    <SortIcon active={sortKey === 'stock'} ascending={sortAsc} />
                  </button>
                </th>
                <th className="px-2 py-3 text-left">
                  <button
                    onClick={() => handleSort('price')}
                    className="flex items-center gap-1.5 text-xs font-medium text-white/70 hover:text-white transition-colors"
                  >
                    <DollarSign className="h-3.5 w-3.5" />
                    价格
                    <SortIcon active={sortKey === 'price'} ascending={sortAsc} />
                  </button>
                </th>
                <th className="py-3 pr-4 pl-2 text-right">
                  <span className="flex items-center justify-end gap-1.5 text-xs font-medium text-white/70">
                    <RefreshCcw className="h-3.5 w-3.5" />
                    可替代
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedParts.map((part, idx) => (
                <PartRow key={part.id} part={part} index={idx} />
              ))}
            </tbody>
          </table>
        </div>

        {filteredAndSortedParts.length === 0 && (
          <div className="flex h-48 flex-col items-center justify-center gap-3 py-8">
            <Package className="h-12 w-12 text-white/20" />
            <div className="text-center">
              <div className="text-sm font-medium text-white/50">
                {showOnlyShortage ? '没有缺货配件' : '没有找到配件'}
              </div>
              <div className="mt-1 text-xs text-white/30">
                {searchTerm ? '尝试调整搜索关键词' : '请检查库存数据'}
              </div>
            </div>
          </div>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25 }}
        className="flex items-center justify-between text-xs text-white/40"
      >
        <span>
          显示 {filteredAndSortedParts.length} / {parts.length} 条记录
        </span>
        <span>点击表头可排序</span>
      </motion.div>
    </div>
  );
}

function PartRow({ part, index }: { part: Part; index: number }) {
  const stock = part.stockCount ?? 0;
  const isShortage = stock <= 0;
  const isLow = stock > 0 && stock <= 2;

  return (
    <motion.tr
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.02 }}
      className={cn(
        'border-b border-white/5 transition-all last:border-b-0',
        isShortage ? 'bg-red-500/[0.03] hover:bg-red-500/[0.06]' : 'hover:bg-white/[0.03]'
      )}
    >
      <td className="py-3 pl-4 pr-2">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-xl',
              isShortage
                ? 'bg-red-500/15'
                : isLow
                ? 'bg-amber-500/15'
                : 'bg-white/10'
            )}
          >
            <Package
              className={cn(
                'h-4 w-4',
                isShortage
                  ? 'text-red-400'
                  : isLow
                  ? 'text-amber-400'
                  : 'text-white/60'
              )}
            />
          </div>
          <div className="min-w-0">
            <div
              className={cn(
                'truncate text-sm font-medium',
                isShortage ? 'text-red-400' : 'text-white'
              )}
            >
              {part.name}
            </div>
            <div className="truncate text-[10px] text-white/40">
              {part.category}
            </div>
          </div>
        </div>
      </td>

      <td className="px-2 py-3">
        <div className="flex items-center gap-2">
          {isShortage && <AlertTriangle className="h-4 w-4 text-red-400 animate-pulse" />}
          <span
            className={cn(
              'font-bold tabular-nums',
              isShortage
                ? 'text-red-400'
                : isLow
                ? 'text-amber-400'
                : 'text-white'
            )}
          >
            {stock}
          </span>
          {isShortage && (
            <span className="rounded-md bg-red-500/20 px-1.5 py-0.5 text-[10px] font-medium text-red-400">
              缺货
            </span>
          )}
          {isLow && !isShortage && (
            <span className="rounded-md bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-medium text-amber-400">
              低库存
            </span>
          )}
        </div>
      </td>

      <td className="px-2 py-3">
        <span className="text-sm font-medium text-white tabular-nums">
          {formatCurrency(part.price)}
        </span>
      </td>

      <td className="py-3 pr-4 pl-2 text-right">
        {part.isAlternativeAvailable ? (
          <div className="flex items-center justify-end gap-1">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span className="text-xs text-emerald-400">有替代</span>
          </div>
        ) : (
          <div className="flex items-center justify-end gap-1">
            <XCircle className="h-4 w-4 text-white/30" />
            <span className="text-xs text-white/40">无替代</span>
          </div>
        )}
      </td>
    </motion.tr>
  );
}
