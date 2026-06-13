// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';
import { Search, Filter, X, Calendar, MapPin, User, Tag } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { apiEndpoints } from '@/lib/api';
import { RefundStatus, ResponsibilityParty } from '@solo/shared';
import { statusConfig, responsibilityConfig } from '@/lib/utils';

interface FilterValues {
  keyword?: string;
  status?: string[];
  startDate?: string;
  endDate?: string;
  region?: string;
  assigneeId?: string;
  problemTag?: string;
  responsibility?: string;
  isTimeout?: string;
}

interface OrderFilterProps {
  onFilterChange: (filters: FilterValues) => void;
  initialFilters?: FilterValues;
}

export function OrderFilter({ onFilterChange, initialFilters = {} }: OrderFilterProps) {
  const [filters, setFilters] = useState<FilterValues>(initialFilters);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [regions, setRegions] = useState<string[]>([]);
  const [operators, setOperators] = useState<any[]>([]);
  const [problemTags, setProblemTags] = useState<any[]>([]);
  const [activeFilterCount, setActiveFilterCount] = useState(0);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [regionsRes, operatorsRes, configRes] = await Promise.all([
          apiEndpoints.users.regions(),
          apiEndpoints.users.operators(),
          apiEndpoints.config.getAll(),
        ]);
        setRegions(regionsRes as string[]);
        setOperators(operatorsRes as any[]);
        setProblemTags(configRes.problemTags as any[]);
      } catch (error) {
        console.error('Failed to fetch filter options:', error);
      }
    };
    fetchOptions();
  }, []);

  useEffect(() => {
    const count = Object.entries(filters).filter(([_, v]) => v && v !== '').length;
    setActiveFilterCount(count);
  }, [filters]);

  const handleChange = (key: keyof FilterValues, value: string | string[] | undefined) => {
    setFilters((prev) => {
      const newFilters = { ...prev, [key]: value };
      if (!value || (Array.isArray(value) && value.length === 0)) {
        delete newFilters[key];
      }
      return newFilters;
    });
  };

  const handleStatusToggle = (status: string) => {
    const current = filters.status || [];
    const next = current.includes(status)
      ? current.filter((s) => s !== status)
      : [...current, status];
    handleChange('status', next.length > 0 ? next : undefined);
  };

  const handleApply = () => {
    onFilterChange(filters);
  };

  const handleReset = () => {
    setFilters({});
    onFilterChange({});
  };

  const statusOptions = Object.values(RefundStatus).filter((s) => s !== 'TIMEOUT');
  const responsibilityOptions = Object.values(ResponsibilityParty);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px] max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="搜索单号、客户、商品..."
              value={filters.keyword || ''}
              onChange={(e) => handleChange('keyword', e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={showAdvanced ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            <Filter className="mr-1 h-4 w-4" />
            筛选
            {activeFilterCount > 0 && (
              <Badge variant="danger" className="ml-1">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
          {activeFilterCount > 0 && (
            <Button variant="ghost" size="sm" onClick={handleReset}>
              <X className="mr-1 h-4 w-4" />
              重置
            </Button>
          )}
          <Button variant="primary" size="sm" onClick={handleApply}>
            应用
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {statusOptions.map((status) => {
          const isActive = filters.status?.includes(status);
          const config = statusConfig[status as RefundStatus];
          return (
            <button
              key={status}
              onClick={() => handleStatusToggle(status)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                isActive
                  ? `${config.bgColor} ${config.color} ring-2 ring-offset-1 ring-${config.color.replace('text-', '')}`
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {config.label}
            </button>
          );
        })}
      </div>

      {showAdvanced && (
        <div className="grid grid-cols-1 gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="flex items-start gap-2">
            <Calendar className="mt-2 h-4 w-4 text-gray-400" />
            <div className="flex-1 space-y-2">
              <Input
                type="date"
                label="开始日期"
                value={filters.startDate || ''}
                onChange={(e) => handleChange('startDate', e.target.value)}
              />
              <Input
                type="date"
                label="结束日期"
                value={filters.endDate || ''}
                onChange={(e) => handleChange('endDate', e.target.value)}
              />
            </div>
          </div>

          <div>
            <Select
              label={<span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> 区域</span>}
              value={filters.region || ''}
              onChange={(e) => handleChange('region', e.target.value || undefined)}
              options={regions.map((r) => ({ value: r, label: r }))}
            />
          </div>

          <div>
            <Select
              label={<span className="flex items-center gap-1"><User className="h-4 w-4" /> 负责人</span>}
              value={filters.assigneeId || ''}
              onChange={(e) => handleChange('assigneeId', e.target.value || undefined)}
              options={operators.map((o) => ({ value: o.id, label: `${o.name} (${o.region || '-'})` }))}
            />
          </div>

          <div className="space-y-2">
            <Select
              label={<span className="flex items-center gap-1"><Tag className="h-4 w-4" /> 问题标签</span>}
              value={filters.problemTag || ''}
              onChange={(e) => handleChange('problemTag', e.target.value || undefined)}
              options={problemTags.map((t) => ({ value: t.name, label: t.name }))}
            />
            <Select
              label="责任归属"
              value={filters.responsibility || ''}
              onChange={(e) => handleChange('responsibility', e.target.value || undefined)}
              options={responsibilityOptions.map((r) => ({
                value: r,
                label: responsibilityConfig[r].label,
              }))}
            />
          </div>

          <div className="lg:col-span-4">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.isTimeout === 'true'}
                  onChange={(e) => handleChange('isTimeout', e.target.checked ? 'true' : undefined)}
                  className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">仅显示超时</span>
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
