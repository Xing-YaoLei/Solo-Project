'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Crown, Star, TrendingUp, Users } from 'lucide-react';
import { TechnicianRank } from '@/types';
import { formatCurrency, formatNumber } from '@/utils/format';
import { cn } from '@/utils/cn';

interface TechnicianRankProps {
  data: TechnicianRank[];
}

export default function TechnicianRankComponent({ data }: TechnicianRankProps) {
  const [sortBy, setSortBy] = useState<'revenue' | 'orders' | 'rating'>('revenue');

  const sortedData = [...data].sort((a, b) => {
    if (sortBy === 'revenue') return b.totalRevenue - a.totalRevenue;
    if (sortBy === 'orders') return b.orderCount - a.orderCount;
    return b.avgRating - a.avgRating;
  });

  const sortOptions = [
    { key: 'revenue', label: '按产值', icon: TrendingUp },
    { key: 'orders', label: '按服务量', icon: Users },
    { key: 'rating', label: '按好评', icon: Star },
  ];

  const getRankBadge = (index: number) => {
    if (index === 0) return <Crown className="w-5 h-5 text-accent-500" />;
    if (index === 1) return <span className="text-lg font-bold text-dark-400">🥈</span>;
    if (index === 2) return <span className="text-lg font-bold text-dark-400">🥉</span>;
    return <span className="text-dark-500 font-medium">{index + 1}</span>;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      className="card p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-display text-xl font-semibold text-dark-800">技师排行</h3>
        <div className="flex bg-cream-100 rounded-lg p-1">
          {sortOptions.map(option => {
            const Icon = option.icon;
            return (
              <button
                key={option.key}
                onClick={() => setSortBy(option.key as any)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all',
                  sortBy === option.key
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-dark-600 hover:text-dark-800'
                )}
              >
                <Icon className="w-4 h-4" />
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-3">
        {sortedData.map((tech, index) => (
          <motion.div
            key={tech.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.1 * index }}
            className={cn(
              'flex items-center gap-4 p-4 rounded-xl transition-all',
              index === 0 ? 'bg-gradient-to-r from-accent-50 to-primary-50' : 'bg-cream-50 hover:bg-cream-100'
            )}
          >
            <div className="w-8 text-center">
              {getRankBadge(index)}
            </div>
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-300 to-accent-300 flex items-center justify-center text-white font-semibold text-lg">
              {tech.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-dark-800">{tech.name}</p>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-sm text-dark-500">
                  <Users className="w-3.5 h-3.5 inline mr-1" />
                  {formatNumber(tech.orderCount)} 单
                </span>
                <span className="text-sm text-dark-500">
                  <Star className="w-3.5 h-3.5 inline mr-1 text-accent-500" />
                  {tech.avgRating.toFixed(2)}
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-lg text-primary-600">
                {formatCurrency(tech.totalRevenue)}
              </p>
              <p className="text-xs text-dark-500">总产值</p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
