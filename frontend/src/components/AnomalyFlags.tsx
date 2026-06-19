import { useState } from 'react';
import type { AnomalyFlag } from '../types';

interface AnomalyFlagsProps {
  anomalies: AnomalyFlag[];
  detecting: boolean;
  onDetect: () => void;
  onAnomalyClick?: (complaintId: string, anomalyFlagId: string) => void;
}

const FLAG_CONFIG: Record<AnomalyFlag['flagType'], { label: string; color: string; icon: string }> = {
  door_lock_delay: { label: '门锁记录延迟', color: '#f5a623', icon: '🔒' },
  payment_gap: { label: '收款流水缺失', color: '#e74c3c', icon: '💰' },
  cs_message_change: { label: '客服消息口径变化', color: '#9b59b6', icon: '💬' },
};

const SEVERITY_LABEL: Record<AnomalyFlag['severity'], string> = {
  low: '低',
  medium: '中',
  high: '高',
};

export default function AnomalyFlags({ anomalies, detecting, onDetect, onAnomalyClick }: AnomalyFlagsProps) {
  const [expandedType, setExpandedType] = useState<AnomalyFlag['flagType'] | null>(null);

  const grouped = anomalies.reduce<Record<AnomalyFlag['flagType'], AnomalyFlag[]>>(
    (acc, a) => {
      acc[a.flagType] = acc[a.flagType] ?? [];
      acc[a.flagType].push(a);
      return acc;
    },
    { door_lock_delay: [], payment_gap: [], cs_message_change: [] },
  );

  const getSeverityCounts = (items: AnomalyFlag[]) => {
    const counts = { low: 0, medium: 0, high: 0 };
    items.forEach((item) => { counts[item.severity]++; });
    return counts;
  };

  return (
    <div className="anomaly-flags-panel">
      <div className="panel-header">
        <h3>异常标记</h3>
        <button
          className="detect-btn"
          onClick={onDetect}
          disabled={detecting}
        >
          {detecting ? '检测中...' : '重新检测'}
        </button>
      </div>
      <div className="flag-cards">
        {(Object.entries(grouped) as [AnomalyFlag['flagType'], AnomalyFlag[]][]).map(
          ([flagType, items]) => {
            const config = FLAG_CONFIG[flagType];
            const severityCounts = getSeverityCounts(items);
            const isExpanded = expandedType === flagType;

            return (
              <div
                key={flagType}
                className="flag-card"
                style={{ borderLeftColor: config.color }}
              >
                <div
                  className="flag-card-header"
                  onClick={() => setExpandedType(isExpanded ? null : flagType)}
                >
                  <span className="flag-icon">{config.icon}</span>
                  <span className="flag-label">{config.label}</span>
                  <span className="flag-count" style={{ backgroundColor: config.color }}>
                    {items.length}
                  </span>
                </div>
                <div className="flag-severity-row">
                  {(['high', 'medium', 'low'] as const).map((sev) => (
                    <span key={sev} className={`severity-badge severity-${sev}`}>
                      {SEVERITY_LABEL[sev]}: {severityCounts[sev]}
                    </span>
                  ))}
                </div>
                {isExpanded && (
                  <div className="flag-detail-list">
                    {items.length === 0 && <div className="no-data">暂无异常</div>}
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="flag-detail-item"
                        style={{ cursor: onAnomalyClick ? 'pointer' : 'default' }}
                        onClick={() => onAnomalyClick?.(item.complaintId, item.id)}
                      >
                        <div className="flag-detail-id">{item.complaintId}</div>
                        <div className="flag-detail-desc">{item.description}</div>
                        <div className="flag-detail-meta">
                          <span>{item.detectedAt}</span>
                          <span className={`severity-text severity-${item.severity}`}>
                            {SEVERITY_LABEL[item.severity]}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          },
        )}
      </div>
    </div>
  );
}
