import { useState } from 'react';
import type { SavedView, DateRange, FunnelFilters } from '../types';

interface ViewSelectorProps {
  views: SavedView[];
  activeViewType: SavedView['viewType'];
  dateRange: DateRange;
  filters: FunnelFilters;
  onViewTypeChange: (viewType: SavedView['viewType']) => void;
  onFiltersChange: (filters: Partial<FunnelFilters>) => void;
  onSaveView: (viewName: string, viewType: SavedView['viewType'], filtersJson: string) => void;
  onSelectView: (view: SavedView) => void;
  onDeleteView?: (viewId: string) => void;
}

const VIEW_TABS: { key: SavedView['viewType']; label: string; filterField: keyof FunnelFilters }[] = [
  { key: 'revisit_result', label: '回访结果', filterField: 'revisitResult' },
  { key: 'responsibility', label: '责任归属', filterField: 'responsibility' },
  { key: 'problem_tag', label: '问题标签', filterField: 'problemTag' },
];

const FILTER_OPTIONS: Record<SavedView['viewType'], string[]> = {
  revisit_result: ['', '满意', '一般', '不满意'],
  responsibility: ['', '硬件', '软件', '服务', '安全', '卫生', '管理'],
  problem_tag: ['', '硬件', '软件', '服务', '安全', '卫生', '管理'],
};

export default function ViewSelector({
  views,
  activeViewType,
  dateRange,
  filters,
  onViewTypeChange,
  onFiltersChange,
  onSaveView,
  onSelectView,
  onDeleteView,
}: ViewSelectorProps) {
  const [newViewName, setNewViewName] = useState('');

  const filteredViews = views.filter((v) => v.viewType === activeViewType);
  const activeTab = VIEW_TABS.find((t) => t.key === activeViewType)!;
  const currentFilterValue = filters[activeTab.filterField] ?? '';
  const options = FILTER_OPTIONS[activeViewType];

  const handleFilterChange = (value: string) => {
    onFiltersChange({ [activeTab.filterField]: value });
  };

  const handleSave = () => {
    if (!newViewName.trim()) return;
    const payload = {
      viewType: activeViewType,
      dateRange,
      revisitResult: filters.revisitResult,
      responsibility: filters.responsibility,
      problemTag: filters.problemTag,
    };
    onSaveView(newViewName.trim(), activeViewType, JSON.stringify(payload));
    setNewViewName('');
  };

  return (
    <div className="view-selector-panel">
      <h3>视图管理</h3>
      <div className="view-tabs">
        {VIEW_TABS.map((tab) => (
          <button
            key={tab.key}
            className={`view-tab ${activeViewType === tab.key ? 'active' : ''}`}
            onClick={() => onViewTypeChange(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="view-filter-row">
        <label className="filter-label">{activeTab.label}筛选：</label>
        <select
          className="view-filter-select"
          value={currentFilterValue}
          onChange={(e) => handleFilterChange(e.target.value)}
        >
          <option value="">全部</option>
          {options.filter((o) => o !== '').map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>
      <div className="view-list">
        {filteredViews.length === 0 && (
          <div className="no-data">暂无保存的视图</div>
        )}
        {filteredViews.map((view) => (
          <div
            key={view.id}
            className="view-item"
          >
            <div className="view-item-main" onClick={() => onSelectView(view)}>
              <span className="view-item-name">{view.viewName}</span>
              <span className="view-item-meta">
                {view.createdBy} · {new Date(view.createdAt).toLocaleDateString()}
              </span>
            </div>
            {onDeleteView && (
              <button
                className="view-delete-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteView(view.id);
                }}
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>
      <div className="view-save-row">
        <input
          type="text"
          placeholder="视图名称"
          value={newViewName}
          onChange={(e) => setNewViewName(e.target.value)}
          className="view-name-input"
        />
        <button className="save-view-btn" onClick={handleSave}>
          保存
        </button>
      </div>
    </div>
  );
}
