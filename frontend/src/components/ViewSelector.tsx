import { useState } from 'react';
import type { SavedView, DateRange } from '../types';

interface ViewSelectorProps {
  views: SavedView[];
  activeViewType: SavedView['viewType'];
  dateRange: DateRange;
  onViewTypeChange: (viewType: SavedView['viewType']) => void;
  onSaveView: (viewName: string, viewType: SavedView['viewType'], filtersJson: string) => void;
  onSelectView: (view: SavedView) => void;
  onDeleteView?: (viewId: string) => void;
}

const VIEW_TABS: { key: SavedView['viewType']; label: string }[] = [
  { key: 'revisit_result', label: '回访结果' },
  { key: 'responsibility', label: '责任归属' },
  { key: 'problem_tag', label: '问题标签' },
];

export default function ViewSelector({
  views,
  activeViewType,
  dateRange,
  onViewTypeChange,
  onSaveView,
  onSelectView,
  onDeleteView,
}: ViewSelectorProps) {
  const [newViewName, setNewViewName] = useState('');

  const filteredViews = views.filter((v) => v.viewType === activeViewType);

  const handleSave = () => {
    if (!newViewName.trim()) return;
    const filters = {
      viewType: activeViewType,
      dateRange,
    };
    onSaveView(newViewName.trim(), activeViewType, JSON.stringify(filters));
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
