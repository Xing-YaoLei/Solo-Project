import { ReactNode, useState } from "react";
import { Link, useNavigate, useLocation } from "@remix-run/react";
import { UserDocument } from "~/models/user";
import { api } from "~/lib/api";

interface LayoutProps {
  user: UserDocument;
  children: ReactNode;
  title?: string;
}

interface MenuItem {
  path: string;
  label: string;
  icon: string;
  roles?: string[];
}

const MENU_ITEMS: MenuItem[] = [
  {
    path: "/dashboard",
    label: "工作台",
    icon: "🏠",
  },
  {
    path: "/vehicles",
    label: "车辆管理",
    icon: "🚗",
  },
  {
    path: "/analytics",
    label: "仪表盘",
    icon: "📊",
    roles: ["manager"],
  },
];

export default function Layout({ user, children, title }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await api.auth.logout();
      navigate("/login");
    } catch (e) {
      console.error("登出失败:", e);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const filteredMenuItems = MENU_ITEMS.filter(
    (item) => !item.roles || item.roles.includes(user.role)
  );

  const getInitials = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  const getRoleLabel = (role: string) => {
    return role === "manager" ? "管理层" : "执行员";
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <aside className="sidebar">
        <div className="sidebar-logo">🚗 二手车收购系统</div>
        <nav className="sidebar-nav">
          {filteredMenuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`sidebar-nav-item ${
                location.pathname === item.path ? "active" : ""
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </aside>

      <div className="main-content" style={{ flex: 1 }}>
        <header className="topbar">
          <div>
            {title && <h2 style={{ fontSize: "18px", fontWeight: 600 }}>{title}</h2>}
          </div>
          <div className="topbar-user">
            <div className="user-info">
              <span className="user-name">{user.name}</span>
              <span className="user-role">{getRoleLabel(user.role)}</span>
            </div>
            <div className="user-avatar">{getInitials(user.name)}</div>
            <button
              className="btn btn-secondary btn-sm"
              onClick={handleLogout}
              disabled={isLoggingOut}
            >
              {isLoggingOut ? "登出中..." : "登出"}
            </button>
          </div>
        </header>

        <main>{children}</main>
      </div>
    </div>
  );
}
