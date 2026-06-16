import { NavLink, Outlet } from 'react-router-dom';

const navItems = [
  { path: '/', label: '📊 患者档案', end: true },
  { path: '/medical-records', label: '📋 病历摘要' },
  { path: '/treatment-plans', label: '💊 治疗计划' },
  { path: '/warnings', label: '⚠️ 预警管理' },
  { path: '/no-show-reviews', label: '🔔 爽约复盘' },
  { path: '/conflicts', label: '⚡ 口径冲突' },
];

export default function Layout() {
  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>口腔诊所</h2>
          <p>影像归档趋势看板</p>
        </div>
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
