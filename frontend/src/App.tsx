import { useState } from 'react';
import { useFunnelData } from './hooks/useFunnelData';
import { useAnomaly } from './hooks/useAnomaly';
import FunnelChart from './components/FunnelChart';
import AnomalyFlags from './components/AnomalyFlags';
import ViewSelector from './components/ViewSelector';
import NoteEditor from './components/NoteEditor';
import ExportPanel from './components/ExportPanel';
import type { SavedView, DateRange } from './types';

export default function App() {
  const { data, loading, dateRange, setDateRange, refresh } = useFunnelData();
  const { anomalies, detecting, detect } = useAnomaly();
  const [savedViews, setSavedViews] = useState<SavedView[]>([]);
  const [selectedComplaintId, setSelectedComplaintId] = useState('');
  const [selectedAnomalyFlagId, setSelectedAnomalyFlagId] = useState<string | undefined>();

  const handleSaveView = (viewName: string, viewType: SavedView['viewType'], filtersJson: string) => {
    const view: SavedView = {
      id: crypto.randomUUID(),
      viewName,
      viewType,
      filtersJson,
      createdBy: 'current_user',
      createdAt: new Date().toISOString(),
    };
    setSavedViews((prev) => [...prev, view]);
  };

  const handleSelectView = (view: SavedView) => {
    try {
      const filters = JSON.parse(view.filtersJson);
      if (filters.dateRange) {
        setDateRange(filters.dateRange as DateRange);
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
          <button className="refresh-btn" onClick={refresh}>
            刷新数据
          </button>
        </div>
      </header>
      <main className="app-main">
        <aside className="sidebar-left">
          <AnomalyFlags
            anomalies={anomalies}
            detecting={detecting}
            onDetect={detect}
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
            onSaveView={handleSaveView}
            onSelectView={handleSelectView}
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
