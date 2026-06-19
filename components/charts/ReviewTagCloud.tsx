'use client';

import React from 'react';
import type { ReviewTag } from '@/types';
import { cn, getSentimentColor } from '@/lib/utils';
import { AlertTriangle, TrendingUp, TrendingDown, Minus, Tags } from 'lucide-react';

interface ReviewTagCloudProps {
  tags: ReviewTag[];
  height?: number;
}

export function ReviewTagCloud({ tags, height = 400 }: ReviewTagCloudProps) {
  const maxCount = Math.max(...tags.map(t => t.count), 1);

  const getTagSize = (count: number) => {
    const ratio = count / maxCount;
    if (ratio > 0.8) return 'text-2xl';
    if (ratio > 0.6) return 'text-xl';
    if (ratio > 0.4) return 'text-lg';
    if (ratio > 0.2) return 'text-base';
    return 'text-sm';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-3 h-3" />;
      case 'down':
        return <TrendingDown className="w-3 h-3" />;
      default:
        return <Minus className="w-3 h-3" />;
    }
  };

  const getTrendColor = (trend: string, sentiment: string) => {
    if (trend === 'up') {
      return sentiment === 'negative' ? 'text-risk-high' : 'text-risk-low';
    }
    if (trend === 'down') {
      return sentiment === 'negative' ? 'text-risk-low' : 'text-risk-high';
    }
    return 'text-slate-400';
  };

  const sortedTags = [...tags].sort((a, b) => {
    if (a.isAnomaly !== b.isAnomaly) return a.isAnomaly ? -1 : 1;
    return b.count - a.count;
  });

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-4">
        <Tags className="w-5 h-5 text-blue-400" />
        <h3 className="text-lg font-semibold text-white">点评标签分析</h3>
        <span className="text-sm text-slate-400 ml-auto">
          共 {tags.length} 个标签
        </span>
      </div>

      {tags.filter(t => t.isAnomaly).length > 0 && (
        <div className="mb-6 p-4 rounded-lg bg-risk-high/10 border border-risk-high/30">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-risk-high" />
            <span className="font-medium text-risk-high">异常标签预警</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {tags.filter(t => t.isAnomaly).map(tag => (
              <div
                key={tag.id}
                className="flex items-center gap-1 px-3 py-1 rounded-full bg-risk-high/20 border border-risk-high/40 anomaly-pulse"
              >
                <AlertTriangle className="w-3 h-3 text-risk-high" />
                <span className="text-sm text-risk-high font-medium">{tag.tagName}</span>
                <span className="text-xs text-risk-high/80">({tag.count}次)</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div
        className="flex flex-wrap items-center justify-center gap-4 p-6 rounded-xl bg-slate-800/30 border border-slate-700/50"
        style={{ minHeight: height - 100 }}
      >
        {sortedTags.length === 0 ? (
          <p className="text-slate-400">暂无点评标签数据</p>
        ) : (
          sortedTags.map((tag, index) => (
            <div
              key={tag.id}
              className={cn(
                "group relative inline-flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 cursor-pointer hover:scale-105",
                tag.isAnomaly
                  ? "bg-risk-high/20 border-2 border-risk-high/60 shadow-lg shadow-risk-high/20"
                  : tag.sentiment === 'positive'
                  ? "bg-risk-low/10 border border-risk-low/30"
                  : tag.sentiment === 'negative'
                  ? "bg-risk-high/10 border border-risk-high/30"
                  : "bg-slate-700/50 border border-slate-600"
              )}
              style={{
                animationDelay: `${index * 50}ms`,
                opacity: 0,
                animation: 'fadeIn 0.5s ease-out forwards',
              }}
            >
              <span className={cn("font-medium", getTagSize(tag.count))}>
                {tag.tagName}
              </span>
              <span className="text-sm opacity-70">{tag.count}</span>
              <span className={cn("flex items-center gap-0.5", getTrendColor(tag.trend, tag.sentiment))}>
                {getTrendIcon(tag.trend)}
              </span>

              {tag.isAnomaly && (
                <AlertTriangle className="w-4 h-4 text-risk-high absolute -top-1 -right-1" />
              )}

              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 shadow-xl">
                <p className="font-medium text-white">{tag.tagName}</p>
                <p className="text-slate-400">出现次数: {tag.count}</p>
                <p className="text-slate-400">
                  情感: {tag.sentiment === 'positive' ? '正面' : tag.sentiment === 'negative' ? '负面' : '中性'}
                </p>
                {tag.isAnomaly && tag.anomalyReason && (
                  <p className="text-risk-high mt-1 text-xs">{tag.anomalyReason}</p>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="flex items-center justify-center gap-6 mt-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-risk-low/50 border border-risk-low" />
          <span className="text-slate-400">正面</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-slate-600 border border-slate-500" />
          <span className="text-slate-400">中性</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-risk-high/50 border border-risk-high" />
          <span className="text-slate-400">负面</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-risk-high border-2 border-risk-high animate-pulse" />
          <span className="text-slate-400">异常预警</span>
        </div>
      </div>
    </div>
  );
}
