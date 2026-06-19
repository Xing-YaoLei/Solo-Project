import { useState } from 'react';
import type { DateRange } from '../types';
import { exportReport } from '../api';

interface ExportPanelProps {
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
}

const CLOSURE_RULES = [
  {
    ruleName: '标准关闭',
    ruleDescription: '客诉从创建到最终解决的总时长',
    formula: 'T_关闭 = T_解决 - T_创建',
  },
  {
    ruleName: '首次响应',
    ruleDescription: '客诉创建到客服首次响应的时间',
    formula: 'T_响应 = T_首次响应 - T_创建',
  },
  {
    ruleName: '处理耗时',
    ruleDescription: '客诉在各阶段的平均停留时长',
    formula: 'T_阶段 = Σ(T_离开 - T_进入) / N',
  },
];

export default function ExportPanel({ dateRange, onDateRangeChange }: ExportPanelProps) {
  const [exporting, setExporting] = useState(false);
  const [showRules, setShowRules] = useState(false);

  const handleExport = async (format: 'csv' | 'excel') => {
    setExporting(true);
    try {
      const blob = await exportReport(format, dateRange);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `complaint-funnel-report.${format === 'csv' ? 'csv' : 'xlsx'}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // silently ignore
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="export-panel">
      <div className="export-controls">
        <div className="date-range-row">
          <label>
            起始
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) =>
                onDateRangeChange({ ...dateRange, start: e.target.value })
              }
              className="date-input"
            />
          </label>
          <label>
            截止
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) =>
                onDateRangeChange({ ...dateRange, end: e.target.value })
              }
              className="date-input"
            />
          </label>
        </div>
        <div className="export-btn-row">
          <button
            className="export-btn"
            onClick={() => handleExport('csv')}
            disabled={exporting}
          >
            导出 CSV
          </button>
          <button
            className="export-btn excel"
            onClick={() => handleExport('excel')}
            disabled={exporting}
          >
            导出 Excel
          </button>
          <button
            className="rules-btn"
            onClick={() => setShowRules(!showRules)}
          >
            {showRules ? '隐藏规则' : '关闭时长规则'}
          </button>
        </div>
      </div>
      {showRules && (
        <div className="closure-rules">
          <h4>关闭时长计算规则</h4>
          {CLOSURE_RULES.map((rule) => (
            <div key={rule.ruleName} className="rule-item">
              <div className="rule-name">{rule.ruleName}</div>
              <div className="rule-desc">{rule.ruleDescription}</div>
              <code className="rule-formula">{rule.formula}</code>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
