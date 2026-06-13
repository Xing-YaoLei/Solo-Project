'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  ChevronUp,
  Clock,
  DollarSign,
  Star,
  AlertTriangle,
  Edit3,
} from 'lucide-react';
import { HandOrder } from '@/types';
import {
  formatCurrency,
  formatDateTime,
  getStatusColor,
  getStatusText,
} from '@/utils/format';
import { cn } from '@/utils/cn';
import { useAuth } from '@/contexts/AuthContext';

interface OrderCardProps {
  order: HandOrder;
  onMarkAbnormal?: (usageId: string, isAbnormal: boolean, note: string) => void;
}

export default function OrderCard({ order, onMarkAbnormal }: OrderCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [abnormalNote, setAbnormalNote] = useState<Record<string, string>>({});
  const { user } = useAuth();
  const isTechnician = user?.role === 'TECHNICIAN';

  const handleMarkAbnormal = (usageId: string, currentAbnormal: boolean) => {
    const note = abnormalNote[usageId] || '';
    if (onMarkAbnormal) {
      onMarkAbnormal(usageId, !currentAbnormal, note);
    }
  };

  return (
    <motion.div
      layout
      className="card overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <div
        className="p-5 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className="font-mono text-sm text-dark-500 bg-cream-100 px-2 py-0.5 rounded">
                {order.handNo}
              </span>
              <span className={cn('status-badge', getStatusColor(order.status))}>
                {getStatusText(order.status)}
              </span>
            </div>
            <h4 className="font-semibold text-dark-800 mb-1">
              {order.customerName || '未命名客户'}
            </h4>
            <p className="text-sm text-dark-600">
              {order.serviceItems.join('、')}
            </p>
            <div className="flex items-center gap-4 mt-3 text-sm text-dark-500">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {formatDateTime(order.createdAt)}
              </span>
              <span className="flex items-center gap-1">
                <DollarSign className="w-4 h-4 text-accent-500" />
                {formatCurrency(order.totalAmount)}
              </span>
              {order.review && (
                <span className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-accent-500 fill-accent-500" />
                  {order.review.rating}
                </span>
              )}
            </div>
          </div>
          <button className="p-2 text-dark-400 hover:text-primary-600 transition-colors">
            {expanded ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="border-t border-cream-200"
          >
            <div className="p-5 bg-cream-50/50">
              {order.review && (
                <div className="mb-4 p-4 bg-white rounded-xl">
                  <h5 className="font-medium text-dark-700 mb-2 flex items-center gap-2">
                    <Star className="w-4 h-4 text-accent-500 fill-accent-500" />
                    客户评价
                  </h5>
                  <div className="flex items-center gap-2 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          'w-4 h-4',
                          i < order.review!.rating
                            ? 'text-accent-500 fill-accent-500'
                            : 'text-gray-300'
                        )}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-dark-600">{order.review.content}</p>
                  {(order.review.hasBeforePhoto || order.review.hasAfterPhoto) && (
                    <div className="flex gap-2 mt-3">
                      {order.review.hasBeforePhoto && (
                        <span className="text-xs bg-primary-100 text-primary-600 px-2 py-1 rounded">
                          术前照
                        </span>
                      )}
                      {order.review.hasAfterPhoto && (
                        <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded">
                          术后照
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}

              {order.inventoryItems && order.inventoryItems.length > 0 && (
                <div>
                  <h5 className="font-medium text-dark-700 mb-3">耗材领用</h5>
                  <div className="space-y-3">
                    {order.inventoryItems.map(usage => (
                      <div
                        key={usage.id}
                        className={cn(
                          'flex items-center justify-between p-3 rounded-xl transition-all',
                          usage.isAbnormal ? 'bg-red-50 border border-red-200' : 'bg-white'
                        )}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-dark-800">
                              {usage.inventory?.productName}
                            </p>
                            {usage.isAbnormal && (
                              <AlertTriangle className="w-4 h-4 text-red-500" />
                            )}
                          </div>
                          <p className="text-sm text-dark-500">
                            {usage.inventory?.category} · 领用 {usage.quantity} {usage.inventory?.unit}
                          </p>
                          {usage.abnormalNote && (
                            <p className="text-xs text-red-600 mt-1">
                              备注: {usage.abnormalNote}
                            </p>
                          )}
                        </div>
                        {isTechnician && (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              placeholder="异常备注..."
                              value={abnormalNote[usage.id] || ''}
                              onChange={e => setAbnormalNote(prev => ({
                                ...prev,
                                [usage.id]: e.target.value
                              }))}
                              onClick={e => e.stopPropagation()}
                              className="input-field text-sm py-2 w-32"
                            />
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                handleMarkAbnormal(usage.id, usage.isAbnormal);
                              }}
                              className={cn(
                                'p-2 rounded-lg transition-all',
                                usage.isAbnormal
                                  ? 'bg-red-100 text-red-600 hover:bg-red-200'
                                  : 'bg-cream-200 text-dark-600 hover:bg-red-100 hover:text-red-600'
                              )}
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
