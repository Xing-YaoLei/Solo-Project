import { useState } from 'react';
import { mockUsers } from '@/data/mockData';
import type { UserRoleType } from '@/types';

const roleTabs: { key: UserRoleType; label: string }[] = [
  { key: 'tenant', label: '租户' },
  { key: 'butler', label: '管家' },
  { key: 'maintenance', label: '维修员' },
  { key: 'finance', label: '财务' },
];

const allRoutes = [
  { name: '排程调度台', path: '/' },
  { name: '路线计划', path: '/route-planner' },
  { name: '轨迹回放', path: '/trajectory' },
  { name: '工单管理', path: '/work-orders' },
  { name: '待办池', path: '/todo-pool' },
  { name: '报表分析', path: '/reports' },
  { name: '角色权限', path: '/permissions' },
];

const allScopes = [
  { key: 'own_orders', name: '个人工单', desc: '仅可导出本人相关工单' },
  { key: 'all_orders', name: '全部工单', desc: '可导出所有工单数据' },
  { key: 'routes', name: '路线数据', desc: '可导出路线规划及轨迹数据' },
  { key: 'reports', name: '报表数据', desc: '可导出统计报表数据' },
  { key: 'cost_reports', name: '费用报表', desc: '可导出费用及成本报表' },
];

const allSensitiveFields = [
  { key: 'tenantPhone', name: '租客手机号', desc: '手机号脱敏处理', preview: '138****5678' },
  { key: 'cost', name: '费用明细', desc: '费用金额脱敏处理', preview: '***' },
  { key: 'tenantAddress', name: '租客地址', desc: '详细地址脱敏处理', preview: '***室' },
  { key: 'signatureUrl', name: '签名', desc: '签名图片隐藏处理', preview: '[已隐藏]' },
];

function getRoleConfig(role: UserRoleType) {
  const user = mockUsers.find((u) => u.role === role);
  return {
    accessibleRoutes: user ? [...user.accessibleRoutes] : [],
    exportScope: user ? [...user.exportScope] : [],
    sensitiveFields: user ? [...user.sensitiveFields] : [],
  };
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      className={`relative w-10 h-5 rounded-full transition-colors duration-200 flex-shrink-0 ${
        on ? 'bg-amber-500' : 'bg-navy-600'
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
          on ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

export default function Permissions() {
  const [activeRole, setActiveRole] = useState<UserRoleType>('tenant');
  const [configs, setConfigs] = useState<Record<UserRoleType, ReturnType<typeof getRoleConfig>>>(() => ({
    tenant: getRoleConfig('tenant'),
    butler: getRoleConfig('butler'),
    maintenance: getRoleConfig('maintenance'),
    finance: getRoleConfig('finance'),
  }));
  const [saved, setSaved] = useState(false);

  const current = configs[activeRole];

  function setRouteAccess(path: string, enabled: boolean) {
    setConfigs((prev) => ({
      ...prev,
      [activeRole]: {
        ...prev[activeRole],
        accessibleRoutes: enabled
          ? [...prev[activeRole].accessibleRoutes, path]
          : prev[activeRole].accessibleRoutes.filter((r) => r !== path),
      },
    }));
  }

  function setExportScope(scope: string, enabled: boolean) {
    setConfigs((prev) => ({
      ...prev,
      [activeRole]: {
        ...prev[activeRole],
        exportScope: enabled
          ? [...prev[activeRole].exportScope, scope]
          : prev[activeRole].exportScope.filter((s) => s !== scope),
      },
    }));
  }

  function setSensitiveField(field: string, masked: boolean) {
    setConfigs((prev) => ({
      ...prev,
      [activeRole]: {
        ...prev[activeRole],
        sensitiveFields: masked
          ? [...prev[activeRole].sensitiveFields, field]
          : prev[activeRole].sensitiveFields.filter((f) => f !== field),
      },
    }));
  }

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="p-4 h-full overflow-y-auto scrollbar-thin">
      <h1 className="font-heading font-bold text-white text-lg mb-4">角色权限</h1>

      <div className="flex gap-2 mb-6">
        {roleTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveRole(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
              activeRole === tab.key
                ? 'bg-amber-500 text-navy-900'
                : 'bg-navy-700 text-gray-300 hover:bg-navy-600'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="space-y-6">
        <div className="rounded-lg bg-navy-800 border border-navy-700/50 p-5">
          <h2 className="font-heading font-semibold text-white text-sm mb-4">入口控制</h2>
          <div className="space-y-3">
            {allRoutes.map((route) => {
              const enabled = current.accessibleRoutes.includes(route.path);
              return (
                <div
                  key={route.path}
                  className="flex items-center justify-between py-2 px-3 rounded-md bg-navy-700/30"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-200">{route.name}</span>
                    <span className="text-xs text-gray-500 font-mono-data">{route.path}</span>
                  </div>
                  <Toggle on={enabled} onChange={(v) => setRouteAccess(route.path, v)} />
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-lg bg-navy-800 border border-navy-700/50 p-5">
          <h2 className="font-heading font-semibold text-white text-sm mb-4">导出范围</h2>
          <div className="space-y-3">
            {allScopes.map((scope) => {
              const checked = current.exportScope.includes(scope.key);
              return (
                <label
                  key={scope.key}
                  className="flex items-center gap-3 py-2 px-3 rounded-md bg-navy-700/30 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => setExportScope(scope.key, e.target.checked)}
                    className={`w-4 h-4 rounded border-navy-600 accent-amber-500 bg-navy-600`}
                  />
                  <div className="flex-1">
                    <span className="text-sm text-gray-200">{scope.name}</span>
                    <span className="text-xs text-gray-500 ml-2">{scope.desc}</span>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        <div className="rounded-lg bg-navy-800 border border-navy-700/50 p-5">
          <h2 className="font-heading font-semibold text-white text-sm mb-4">敏感字段</h2>
          <div className="space-y-3">
            {allSensitiveFields.map((field) => {
              const masked = current.sensitiveFields.includes(field.key);
              return (
                <div
                  key={field.key}
                  className="flex items-center justify-between py-2 px-3 rounded-md bg-navy-700/30"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="min-w-0">
                      <span className="text-sm text-gray-200">{field.name}</span>
                      <span className="text-xs text-gray-500 ml-2">{field.desc}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <span className="text-xs font-mono-data text-gray-400 w-24 text-right truncate">
                      {masked ? field.preview : '可见'}
                    </span>
                    <Toggle on={masked} onChange={(v) => setSensitiveField(field.key, v)} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-4">
        <button
          onClick={handleSave}
          className="px-6 py-2.5 rounded-lg bg-amber-500 text-navy-900 font-semibold text-sm hover:bg-amber-400 transition-colors duration-200"
        >
          保存配置
        </button>
        {saved && (
          <span className="text-sm text-green-400 animate-fade-in">配置已保存</span>
        )}
      </div>
    </div>
  );
}
