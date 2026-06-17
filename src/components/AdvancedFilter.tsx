import { useState } from 'react';
import { X, Filter, ChevronDown, ChevronUp, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/appStore';
import { mockUsers } from '@/mock/data';

const statusOptions = [
  { value: 'in_stock', label: '在库' },
  { value: 'in_use', label: '领用中' },
  { value: 'shortage', label: '短缺' },
  { value: 'closed', label: '已完结' },
];

const regionOptions = [
  { value: '华东区域', label: '华东区域' },
  { value: '华南区域', label: '华南区域' },
  { value: '华北区域', label: '华北区域' },
  { value: '西南区域', label: '西南区域' },
];

const categoryOptions = [
  { value: '瓷砖', label: '瓷砖' },
  { value: '地板', label: '地板' },
  { value: '水管', label: '水管' },
  { value: '电线', label: '电线' },
  { value: '乳胶漆', label: '乳胶漆' },
  { value: '腻子', label: '腻子' },
  { value: '防水涂料', label: '防水涂料' },
  { value: '板材', label: '板材' },
];

interface FilterSectionProps {
  title: string;
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (values: string[]) => void;
}

function FilterSection({ title, options, selected, onChange }: FilterSectionProps) {
  const [expanded, setExpanded] = useState(true);

  const toggleOption = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter(v => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <span className="text-sm font-medium text-gray-700">{title}</span>
        {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>
      {expanded && (
        <div className="px-4 pb-3">
          <div className="flex flex-wrap gap-2">
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => toggleOption(option.value)}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium rounded-full border transition-all duration-200',
                  selected.includes(option.value)
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-primary-400 hover:text-primary-600'
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function AdvancedFilter() {
  const [open, setOpen] = useState(true);
  const { inventoryFilters, setInventoryFilters, resetInventoryFilters } = useAppStore();
  const personOptions = mockUsers.filter(u => u.role === 'worker').map(u => ({ value: u.name, label: u.name }));

  const hasActiveFilters =
    inventoryFilters.status.length > 0 ||
    inventoryFilters.region.length > 0 ||
    inventoryFilters.responsiblePerson.length > 0 ||
    inventoryFilters.category.length > 0 ||
    inventoryFilters.dateRange !== null;

  const activeFilterCount =
    inventoryFilters.status.length +
    inventoryFilters.region.length +
    inventoryFilters.responsiblePerson.length +
    inventoryFilters.category.length +
    (inventoryFilters.dateRange ? 1 : 0);

  return (
    <div className="card mb-6 overflow-hidden">
      <div
        className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200 cursor-pointer"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">高级筛选</span>
            {hasActiveFilters && (
              <span className="inline-flex items-center justify-center w-5 h-5 bg-primary-600 text-white text-xs font-bold rounded-full">
                {activeFilterCount}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                resetInventoryFilters();
              }}
              className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              清除筛选
            </button>
          )}
          {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </div>

      {open && (
        <div className="divide-y divide-gray-100">
          <FilterSection
            title="状态"
            options={statusOptions}
            selected={inventoryFilters.status}
            onChange={(values) => setInventoryFilters({ status: values })}
          />

          <div className="border-b border-gray-100">
            <div className="px-4 py-3">
              <span className="text-sm font-medium text-gray-700">日期范围</span>
            </div>
            <div className="px-4 pb-3 flex items-center gap-2">
              <input
                type="date"
                className="input text-sm"
                value={inventoryFilters.dateRange?.[0] || ''}
                onChange={(e) => {
                  const end = inventoryFilters.dateRange?.[1] || e.target.value;
                  setInventoryFilters({ dateRange: [e.target.value, end] });
                }}
              />
              <span className="text-gray-400">至</span>
              <input
                type="date"
                className="input text-sm"
                value={inventoryFilters.dateRange?.[1] || ''}
                onChange={(e) => {
                  const start = inventoryFilters.dateRange?.[0] || e.target.value;
                  setInventoryFilters({ dateRange: [start, e.target.value] });
                }}
              />
              {inventoryFilters.dateRange && (
                <button
                  onClick={() => setInventoryFilters({ dateRange: null })}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              )}
            </div>
          </div>

          <FilterSection
            title="区域"
            options={regionOptions}
            selected={inventoryFilters.region}
            onChange={(values) => setInventoryFilters({ region: values })}
          />

          <FilterSection
            title="负责人"
            options={personOptions}
            selected={inventoryFilters.responsiblePerson}
            onChange={(values) => setInventoryFilters({ responsiblePerson: values })}
          />

          <FilterSection
            title="材料品类"
            options={categoryOptions}
            selected={inventoryFilters.category}
            onChange={(values) => setInventoryFilters({ category: values })}
          />

          <div className="px-4 py-3 bg-gray-50 flex justify-end gap-2">
            <button
              onClick={resetInventoryFilters}
              className="btn-secondary text-xs py-1.5"
            >
              重置
            </button>
            <button className="btn-primary text-xs py-1.5 flex items-center gap-1">
              <Save className="w-3 h-3" />
              保存筛选方案
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
