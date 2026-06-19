import { useState, useEffect, useCallback } from 'react';
import { useFunnelData } from './hooks/useFunnelData';
import { useAnomaly } from './hooks/useAnomaly';
import FunnelChart from './components/FunnelChart';
import AnomalyFlags from './components/AnomalyFlags';
import ViewSelector from './components/ViewSelector';
import NoteEditor from './components/NoteEditor';
import ExportPanel from './components/ExportPanel';
import { fetchSavedViews, createSavedView, deleteSavedView } from './api';
import type { SavedView, SavedViewCreateData, DateRange, FunnelFilters } from './types';

const VIEW_FIELD_MAP: Record<SavedView['viewType'], keyof FunnelFilters> = {
  revisit_result: 'revisitResult',
  responsibility: 'responsibility',
  problem_tag: 'problemTag',
};

export default function App() {
  const {
    data,
    loading,
    dateRange,
    setDateRange,
    filters,
    applyFilters,
    resetFilters,
    refresh: refreshFunnel,
  } = useFunnelData();
  const { anomalies, detecting, refresh: refreshAnomaly } = useAnomaly();
  const [savedViews, setSavedViews] = useState<SavedView[]>([]);
  const [activeViewType, setActiveViewType] = useState<SavedView['viewType']>('revisit_result');
  const [selectedComplaintId, setSelectedComplaintId] = useState('');
  const [selectedAnomalyFlagId, setSelectedAnomalyFlagId] = useState<string | undefined>();

  const loadViews = useCallback(async () => {
    try {
      const views = await fetchSavedViews();
      setSavedViews(views);
    } catch {
      // silently ignore
    }
  }, []);

  useEffect(() => {
    loadViews();
  }, [loadViews]);

  const handleRefresh = async () => {
    refreshFunnel();
    refreshAnomaly();
  };

  const handleViewTypeChange = useCallback((viewType: SavedView['viewType']) => {
    setActiveViewType(viewType);
    resetFilters();
  }, [resetFilters]);

  const handleFiltersChange = useCallback((changes: Partial<FunnelFilters>) => {
    const activeField = VIEW_FIELD_MAP[activeViewType];
    const scoped: Partial<FunnelFilters> = {};
    if (activeField in changes) {
      scoped.revisitResult = activeField === 'revisitResult' ? changes[activeField] : '';
      scoped.responsibility = activeField === 'responsibility' ? changes[activeField] : '';
      scoped.problemTag = activeField === 'problemTag' ? changes[activeField] : '';
    }
    applyFilters(scoped);
  }, [activeViewType, applyFilters]);

  const handleSaveView = async (viewName: string, viewType: SavedView['viewType'], filtersJson: string) => {
    const data: SavedViewCreateData = {
      viewName,
      viewType,
      filtersJson,
      createdBy: 'current_user',
    };
    try {
      const newView = await createSavedView(data);
      setSavedViews((prev) => [newView, ...prev]);
    } catch {
      // silently ignore
    }
  };

  const handleDeleteView = async (viewId: string) => {
    try {
      await deleteSavedView(viewId);
      setSavedViews((prev) => prev.filter((v) => v.id !== viewId));
    } catch {
      // silently ignore
    }
  };

  const handleSelectView = (view: SavedView) => {
    try {
      const fs = JSON.parse(view.filtersJson);
      if (fs.dateRange) {
        const dr = fs.dateRange as DateRange;
        if (dr.start && dr.end) {
          setDateRange(dr);
        }
      }
      if (fs.viewType) {
        setActiveViewType(fs.viewType as SavedView['viewType']);
      }
      const targetField = VIEW_FIELD_MAP[view.viewType];
      const scoped: Partial<FunnelFilters> = {
        revisitResult: '',
        responsibility: '',
        problemTag: '',
      };
      if (fs[targetField] !== undefined) {
        scoped[targetField] = fs[targetField];
      }
      applyFilters(scoped);
    } catch {
      // ignore parse error
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">旅游民宿客诉处理漏斗报表</h1>
        <div className="header-controls">
          <ExportPanel dateRange={dateRange} onDateRangeChange={setDateRange} />
          <button className="refresh-btn" onClick={handleRefresh}>
            刷新数据
          </button>
        </div>
      </header>
      <main className="app-main">
        <aside className="sidebar-left">
          <AnomalyFlags
            anomalies={anomalies}
            detecting={detecting}
            onDetect={refreshAnomaly}
            onAnomalyClick={(complaintId, anomalyFlagId) => {
              setSelectedComplaintId(complaintId);
              setSelectedAnomalyFlagId(anomalyFlagId);
            }}
          />
        </aside>
        <section className="chart-area">
          <FunnelChart data={data} loading={loading} />
        </section>
        <aside className="sidebar-right">
          <ViewSelector
            views={savedViews}
            activeViewType={activeViewType}
            dateRange={dateRange}
            filters={filters}
            onViewTypeChange={handleViewTypeChange}
            onFiltersChange={handleFiltersChange}
            onSaveView={handleSaveView}
            onSelectView={handleSelectView}
            onDeleteView={handleDeleteView}
          />
          {selectedComplaintId && (
            <NoteEditor
              complaintId={selectedComplaintId}
              anomalyFlagId={selectedAnomalyFlagId}
            />
          )}
        </aside>
      </main>
    </div>
  );
}
