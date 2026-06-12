import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownLeft, RefreshCw, Gift } from 'lucide-react';
import type { Transaction, Member } from '@/types/member';
import { getTransactionsByMemberId } from '@/data/mockMembers';
import { formatDateTime } from '@/utils/scoring';

interface TransactionListProps {
  transactions?: Transaction[];
  member?: Member;
}

const typeIcons: Record<string, typeof ArrowUpRight> = {
  recharge: ArrowDownLeft,
  purchase: ArrowUpRight,
  refund: RefreshCw,
  gift: Gift,
};

const typeColors: Record<string, string> = {
  recharge: 'text-[#66BB6A]',
  purchase: 'text-[#EF5350]',
  refund: 'text-[#FFA726]',
  gift: 'text-[#AB47BC]',
};

const typeLabels: Record<string, string> = {
  recharge: '储值',
  purchase: '消费',
  refund: '退款',
  gift: '赠送',
};

const statusColors: Record<string, string> = {
  completed: 'bg-[#66BB6A]/20 text-[#66BB6A]',
  pending: 'bg-[#FFA726]/20 text-[#FFA726]',
  cancelled: 'bg-[#EF5350]/20 text-[#EF5350]',
};

const statusLabels: Record<string, string> = {
  completed: '已完成',
  pending: '处理中',
  cancelled: '已取消',
};

export function TransactionList({ transactions, member }: TransactionListProps) {
  const [memberTransactions, setMemberTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    if (member) {
      const txs = getTransactionsByMemberId(member.id);
      setMemberTransactions(txs);
    }
  }, [member]);

  const displayTransactions = transactions || memberTransactions;
  
  if (displayTransactions.length === 0) {
    return (
      <div className="text-center py-12 text-[#8D6E63]">
        <p>暂无交易记录</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
      {displayTransactions.map((tx, index) => {
        const Icon = typeIcons[tx.type] || ArrowUpRight;
        const isPositive = tx.type === 'recharge' || tx.type === 'gift';
        
        return (
          <motion.div
            key={tx.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex items-center gap-4 p-4 bg-[#4E342E]/30 rounded-xl hover:bg-[#5D4037]/30 transition-colors"
          >
            <div className={`w-10 h-10 rounded-full bg-[#5D4037]/50 flex items-center justify-center ${typeColors[tx.type]}`}>
              <Icon className="w-5 h-5" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <p className="font-semibold text-[#FFF8E1] truncate">{tx.description}</p>
                <span className={`font-bold ${isPositive ? 'text-[#66BB6A]' : 'text-[#EF5350]'}`}>
                  {isPositive ? '+' : ''}{tx.amount.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#8D6E63]">{formatDateTime(tx.createdAt)}</span>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[tx.status]}`}>
                    {statusLabels[tx.status]}
                  </span>
                  <span className="text-xs text-[#8D6E63]">
                    余额: ¥{tx.balanceAfter.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
