import { useState, useEffect, useCallback } from 'react';
import { useFunnelData } from './hooks/useFunnelData';
import { useAnomaly } from './hooks/useAnomaly';
import FunnelChart from './components/FunnelChart';
import AnomalyFlags from './components/AnomalyFlags';
import ViewSelector from './components/ViewSelector';
import NoteEditor from './components/NoteEditor';
import ExportPanel from './components/ExportPanel';
import { fetchSavedViews, createSavedView, deleteSavedView } from './api';
import type { SavedView, SavedViewCreateData, DateRange } from './types';

export default function App() {
  const { data, loading, dateRange, setDateRange, refresh: refreshFunnel } = useFunnelData();
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
      const filters = JSON.parse(view.filtersJson);
      if (filters.dateRange) {
        const dr = filters.dateRange as DateRange;
        if (dr.start && dr.end) {
          setDateRange(dr);
        }
      }
      if (filters.viewType) {
        setActiveViewType(filters.viewType as SavedView['viewType']);
      }
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
            onViewTypeChange={setActiveViewType}
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
