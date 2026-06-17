import { useState } from 'react';
import {
  Download,
  FileSpreadsheet,
  FileText,
  ChevronDown,
  ChevronUp,
  Clock,
  AlertCircle,
  CheckCircle,
  Info,
} from 'lucide-react';
import { api, roleLabels } from '../utils/api';
import { useCurrentRole, useCurrentArea, useCurrentUser } from '../store';
import { maintenanceCaliber } from '../../shared/types';

export default function DataExport() {
  const role = useCurrentRole();
  const area = useCurrentArea();
  const user = useCurrentUser();
  const [exporting, setExporting] = useState(false);
  const [showCaliber, setShowCaliber] = useState(true);
  const [exportSuccess, setExportSuccess] = useState(false);

  const handleExport = async (format: 'excel' | 'pdf') => {
    setExporting(true);
    setExportSuccess(false);
    try {
      await api.exportReport(format, role, area);
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setExporting(false);
    }
  };

  const caliberSections = maintenanceCaliber
    .split('\n\n')
    .filter((s) => s.trim())
    .filter((s) => !s.startsWith('---'));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">数据下载</h1>
        <p className="text-sm text-slate-500 mt-1">
          导出报告包含完整数据口径说明
        </p>
      </div>

      {exportSuccess && (
        <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700">
          <CheckCircle className="w-5 h-5" />
          <span className="text-sm font-medium">报告导出成功！</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h2 className="text-lg font-semibold text-slate-900 mb-6">
              导出报告
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <button
                onClick={() => handleExport('excel')}
                disabled={exporting}
                className="flex flex-col items-center gap-4 p-8 border-2 border-dashed border-slate-200 rounded-2xl hover:border-indigo-500 hover:bg-indigo-50/50 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <FileSpreadsheet className="w-8 h-8 text-emerald-600" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-slate-900">Excel 格式</p>
                  <p className="text-sm text-slate-500 mt-1">
                    包含所有工作表和口径说明
                  </p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
                  <Download className="w-4 h-4" />
                  {exporting ? '导出中...' : '下载 Excel'}
                </div>
              </button>

              <button
                onClick={() => handleExport('pdf')}
                disabled={true}
                className="flex flex-col items-center gap-4 p-8 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 opacity-60 cursor-not-allowed"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-rose-100 to-rose-200 rounded-2xl flex items-center justify-center">
                  <FileText className="w-8 h-8 text-rose-600" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-slate-900">PDF 格式</p>
                  <p className="text-sm text-slate-500 mt-1">开发中，敬请期待</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-300 text-white rounded-lg text-sm font-medium cursor-not-allowed">
                  <Download className="w-4 h-4" />
                  暂不可用
                </div>
              </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-slate-600">
                  <p className="font-medium text-slate-700 mb-1">
                    数据范围说明
                  </p>
                  <p>
                    当前登录用户：<strong>{user?.name}</strong>（
                    {role ? roleLabels[role] : '未知角色'}
                    ）
                  </p>
                  {area && (
                    <p>
                      管辖区域：<strong>{area}</strong>
                    </p>
                  )}
                  <p className="mt-2 text-xs text-slate-500">
                    导出的报告将根据您的角色权限自动过滤数据范围
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <button
              onClick={() => setShowCaliber(!showCaliber)}
              className="w-full flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
                <div className="text-left">
                  <h2 className="text-lg font-semibold text-slate-900">
                    维修时长口径说明
                  </h2>
                  <p className="text-sm text-slate-500">
                    下载的报告中已包含此说明
                  </p>
                </div>
              </div>
              {showCaliber ? (
                <ChevronUp className="w-5 h-5 text-slate-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-slate-400" />
              )}
            </button>

            {showCaliber && (
              <div className="mt-6 space-y-4">
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-amber-800">
                    <p className="font-medium">重要提示</p>
                    <p className="mt-1">
                      维修时长统计口径直接影响KPI考核，请务必确保所有相关人员理解并遵循此统计规则。
                    </p>
                  </div>
                </div>

                {caliberSections.map((section, index) => {
                  const lines = section.split('\n').filter((l) => l.trim());
                  const title = lines[0].replace(/^##\s*/, '').replace(/^\d+\.\s*/, '');
                  const content = lines.slice(1);

                  return (
                    <div
                      key={index}
                      className="p-4 bg-slate-50 rounded-xl"
                    >
                      <h3 className="font-semibold text-slate-800 mb-2">
                        {title}
                      </h3>
                      <ul className="space-y-1.5">
                        {content.map((line, i) => {
                          const cleanLine = line
                            .replace(/^\s*-\s*/, '')
                            .replace(/^\s*\d+\.\s*/, '')
                            .replace(/\*\*/g, '');
                          return (
                            <li
                              key={i}
                              className="text-sm text-slate-600 flex items-start gap-2"
                            >
                              <span className="text-slate-400 mt-1.5">•</span>
                              <span>{cleanLine}</span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  );
                })}

                <p className="text-xs text-slate-400 text-right">
                  数据更新时间：{new Date().toLocaleString('zh-CN')}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h3 className="font-semibold text-slate-900 mb-4">报告内容</h3>
            <div className="space-y-3">
              {[
                '核心指标概览',
                '水电读数趋势',
                '验房清单构成',
                '收款流水明细',
                '投诉标签统计',
                '房源排行数据',
                '维修时长口径说明',
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-3.5 h-3.5 text-indigo-600" />
                  </div>
                  <span className="text-sm text-slate-600">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl p-6 text-white">
            <h3 className="font-semibold mb-2">数据来源</h3>
            <ul className="space-y-2 text-sm text-white/80">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-white rounded-full" />
                抄表表格系统
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-white rounded-full" />
                CRM 客户管理系统
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-white rounded-full" />
                支付流水系统（明细追溯）
              </li>
            </ul>
            <div className="mt-4 pt-4 border-t border-white/20">
              <p className="text-xs text-white/60">
                底层数据库：PostgreSQL + DuckDB
              </p>
              <p className="text-xs text-white/60 mt-1">
                数据更新频率：每小时同步
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
