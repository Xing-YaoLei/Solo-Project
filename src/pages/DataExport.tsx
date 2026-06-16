import { useState } from 'react';
import { PageHeader, Card } from '@/components/UI';
import { caliberNotes } from '@/mock/data';
import { Download, FileSpreadsheet, ChevronRight, ChevronLeft, Check, Info } from 'lucide-react';

const DIMENSIONS = [
  { key: 'store', label: '门店维度' },
  { key: 'date', label: '日期维度' },
  { key: 'status', label: '状态维度' },
  { key: 'type', label: '处方类型维度' },
];

const FORMAT_OPTIONS = [
  { value: 'xlsx', label: 'Excel (.xlsx)' },
  { value: 'csv', label: 'CSV (.csv)' },
  { value: 'pdf', label: 'PDF (.pdf)' },
];

const STEPS = ['选择导出维度', '配置参数', '预览与导出'];

export default function DataExport() {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedDimensions, setSelectedDimensions] = useState<string[]>(['store']);
  const [dateStart, setDateStart] = useState('2025-06-01');
  const [dateEnd, setDateEnd] = useState('2025-06-12');
  const [format, setFormat] = useState('xlsx');
  const [includeCaliber, setIncludeCaliber] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exportDone, setExportDone] = useState(false);
  const [progress, setProgress] = useState(0);

  const toggleDimension = (key: string) => {
    setSelectedDimensions((prev) =>
      prev.includes(key) ? prev.filter((d) => d !== key) : [...prev, key]
    );
  };

  const canNext = () => {
    if (currentStep === 1) return selectedDimensions.length > 0;
    if (currentStep === 2) return dateStart && dateEnd;
    return true;
  };

  const handleExport = () => {
    setExporting(true);
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setExporting(false);
          setExportDone(true);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const handleReset = () => {
    setExportDone(false);
    setProgress(0);
    setCurrentStep(1);
    setSelectedDimensions(['store']);
    setDateStart('2025-06-01');
    setDateEnd('2025-06-12');
    setFormat('xlsx');
    setIncludeCaliber(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="数据导出" description="导出处方审核数据，附带口径说明便于回访解释" />

      <Card>
        <div className="flex items-center justify-between mb-8">
          {STEPS.map((label, idx) => {
            const step = idx + 1;
            const isActive = step === currentStep;
            const isCompleted = step < currentStep;
            return (
              <div key={label} className="flex items-center flex-1 last:flex-none">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                      isCompleted
                        ? 'bg-mint-400 text-white'
                        : isActive
                        ? 'bg-brand-500 text-white'
                        : 'bg-slate-200 text-slate-400'
                    }`}
                  >
                    {isCompleted ? <Check className="w-4 h-4" /> : step}
                  </div>
                  <span
                    className={`text-sm font-medium ${
                      isActive ? 'text-brand-500' : isCompleted ? 'text-mint-400' : 'text-slate-400'
                    }`}
                  >
                    {label}
                  </span>
                </div>
                {idx < STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-4 ${
                      isCompleted ? 'bg-mint-400' : 'bg-slate-200'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>

        {currentStep === 1 && (
          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-4">选择导出维度</h3>
            <div className="grid grid-cols-2 gap-3">
              {DIMENSIONS.map((dim) => (
                <label
                  key={dim.key}
                  className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                    selectedDimensions.includes(dim.key)
                      ? 'border-brand-500 bg-brand-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedDimensions.includes(dim.key)}
                    onChange={() => toggleDimension(dim.key)}
                    className="w-4 h-4 rounded border-slate-300 text-brand-500 focus:ring-brand-500"
                  />
                  <span className="text-sm text-slate-700">{dim.label}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-4">日期范围</h3>
              <div className="flex items-center gap-3">
                <input
                  type="date"
                  value={dateStart}
                  onChange={(e) => setDateStart(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
                <span className="text-slate-400">至</span>
                <input
                  type="date"
                  value={dateEnd}
                  onChange={(e) => setDateEnd(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-4">导出格式</h3>
              <div className="flex gap-3">
                {FORMAT_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border cursor-pointer transition-colors ${
                      format === opt.value
                        ? 'border-brand-500 bg-brand-50 text-brand-500'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="format"
                      value={opt.value}
                      checked={format === opt.value}
                      onChange={() => setFormat(opt.value)}
                      className="sr-only"
                    />
                    {opt.value === 'xlsx' && <FileSpreadsheet className="w-4 h-4" />}
                    {opt.value === 'csv' && <Download className="w-4 h-4" />}
                    {opt.value === 'pdf' && <FileSpreadsheet className="w-4 h-4" />}
                    <span className="text-sm font-medium">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-3">是否附带口径说明</h3>
              <button
                type="button"
                onClick={() => setIncludeCaliber(!includeCaliber)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  includeCaliber ? 'bg-brand-500' : 'bg-slate-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    includeCaliber ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className="ml-2 text-sm text-slate-600">
                {includeCaliber ? '已开启' : '已关闭'}
              </span>
              <p className="text-2xs text-slate-400 mt-1 flex items-center gap-1">
                <Info className="w-3 h-3" />
                附带口径说明可在回访时帮助解释数据统计口径
              </p>
            </div>
          </div>
        )}

        {currentStep === 3 && !exportDone && !exporting && (
          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-4">导出预览</h3>
            <div className="bg-slate-25 rounded-lg border border-slate-100 p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">导出维度</span>
                <span className="text-slate-700">
                  {selectedDimensions
                    .map((d) => DIMENSIONS.find((dim) => dim.key === d)?.label)
                    .join('、')}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">日期范围</span>
                <span className="text-slate-700">
                  {dateStart} 至 {dateEnd}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">导出格式</span>
                <span className="text-slate-700">
                  {FORMAT_OPTIONS.find((o) => o.value === format)?.label}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">口径说明</span>
                <span className={includeCaliber ? 'text-mint-400' : 'text-slate-400'}>
                  {includeCaliber ? '已附带' : '未附带'}
                </span>
              </div>
            </div>
            <button
              onClick={handleExport}
              className="mt-6 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600 transition-colors"
            >
              <Download className="w-4 h-4" />
              开始导出
            </button>
          </div>
        )}

        {exporting && (
          <div className="text-center py-8">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full border-4 border-brand-100 border-t-brand-500 animate-spin" />
            <p className="text-sm text-slate-600 mb-2">正在生成导出文件...</p>
            <div className="w-64 mx-auto h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-500 rounded-full transition-all duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-2xs text-slate-400 mt-2">{progress}%</p>
          </div>
        )}

        {exportDone && (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-mint-50 rounded-full flex items-center justify-center">
              <Check className="w-8 h-8 text-mint-400" />
            </div>
            <p className="text-sm font-semibold text-slate-700 mb-1">导出完成</p>
            <p className="text-2xs text-slate-400 mb-4">文件已生成，可点击下载</p>
            <a
              href="#"
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600 transition-colors"
            >
              <Download className="w-4 h-4" />
              下载文件
            </a>
            <button
              onClick={handleReset}
              className="ml-3 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              重新导出
            </button>
          </div>
        )}

        <div className="flex items-center justify-between mt-8 pt-5 border-t border-slate-100">
          <button
            onClick={() => setCurrentStep((s) => Math.max(1, s - 1))}
            disabled={currentStep === 1 || exporting}
            className="flex items-center gap-1 px-3 py-2 text-sm text-slate-600 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            上一步
          </button>
          {currentStep < 3 && (
            <button
              onClick={() => setCurrentStep((s) => Math.min(3, s + 1))}
              disabled={!canNext()}
              className="flex items-center gap-1 px-4 py-2 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              下一步
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </Card>

      <Card title="口径说明">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left py-2.5 px-3 text-slate-500 font-medium">指标</th>
                <th className="text-left py-2.5 px-3 text-slate-500 font-medium">定义</th>
                <th className="text-left py-2.5 px-3 text-slate-500 font-medium">排除项</th>
                <th className="text-left py-2.5 px-3 text-slate-500 font-medium">备注</th>
              </tr>
            </thead>
            <tbody>
              {caliberNotes.map((note) => (
                <tr key={note.id} className="border-b border-slate-50 hover:bg-slate-25">
                  <td className="py-3 px-3 font-medium text-slate-700">{note.metric}</td>
                  <td className="py-3 px-3 text-slate-600">{note.definition}</td>
                  <td className="py-3 px-3">
                    <div className="flex flex-wrap gap-1">
                      {note.exclusions.map((ex, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center px-2 py-0.5 rounded text-2xs font-medium bg-amber-50 text-amber-600"
                        >
                          {ex}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-slate-500 text-xs">{note.remarks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
