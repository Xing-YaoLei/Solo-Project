import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { createFileRoute, Outlet, useNavigate, Link } from '@tanstack/react-router';
import { Layout, Menu, Dropdown, Avatar, Badge, Space, Button } from 'antd';
import { DashboardOutlined, EnvironmentOutlined, PlayCircleOutlined, UserOutlined, FileTextOutlined, ShopOutlined, WarningOutlined, BarChartOutlined, HistoryOutlined, LogoutOutlined, DownOutlined, HomeOutlined, } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import { useAuth } from '../store/auth';
import { ROLE_LABELS } from '../types';
const { Header, Sider, Content } = Layout;
export const Route = createFileRoute('/_layout')({
    beforeLoad: ({ context }) => {
        const { isAuthenticated, user, token } = useAuth.getState();
        if (!token || !isAuthenticated) {
            throw new Error('登录状态已失效，请重新登录');
        }
        return { user };
    },
    errorComponent: ({ error, reset }) => {
        const navigate = useNavigate();
        useEffect(() => {
            useAuth.getState().logout();
            navigate({ to: '/login' });
        }, []);
        return _jsx("div", { style: { padding: 40, textAlign: 'center' }, children: _jsx("p", { children: error?.message || '需要登录' }) });
    },
    component: AppLayout,
});
const MENU_ITEMS = [
    {
        key: '/',
        icon: _jsx(DashboardOutlined, {}),
        label: _jsx(Link, { to: "/", children: "\u5DE5\u4F5C\u53F0" }),
        roles: ['tourist', 'ticket_clerk', 'patrol', 'operation', 'admin'],
    },
    {
        key: '/guide/routes',
        icon: _jsx(EnvironmentOutlined, {}),
        label: _jsx(Link, { to: "/guide/routes", children: "\u5BFC\u89C8\u8DEF\u7EBF" }),
        roles: ['tourist', 'ticket_clerk', 'patrol', 'operation', 'admin'],
    },
    {
        key: '/guide/heat-points',
        icon: _jsx(HomeOutlined, {}),
        label: _jsx(Link, { to: "/guide/heat-points", children: "\u70ED\u529B\u70B9\u4F4D" }),
        roles: ['patrol', 'operation', 'admin'],
    },
    {
        key: '/guide/contents',
        icon: _jsx(PlayCircleOutlined, {}),
        label: _jsx(Link, { to: "/guide/contents", children: "\u5BFC\u89C8\u5185\u5BB9" }),
        roles: ['ticket_clerk', 'patrol', 'operation', 'admin'],
    },
    {
        key: '/operations/performances',
        icon: _jsx(UserOutlined, {}),
        label: _jsx(Link, { to: "/operations/performances", children: "\u6F14\u51FA\u7BA1\u7406" }),
        roles: ['ticket_clerk', 'operation', 'admin'],
    },
    {
        key: '/operations/seats',
        icon: _jsx(FileTextOutlined, {}),
        label: _jsx(Link, { to: "/operations/seats", children: "\u5EA7\u4F4D\u6838\u5BF9" }),
        roles: ['ticket_clerk', 'operation', 'admin'],
    },
    {
        key: '/operations/merchants',
        icon: _jsx(ShopOutlined, {}),
        label: _jsx(Link, { to: "/operations/merchants", children: "\u5546\u6237\u4E0E\u5408\u540C" }),
        roles: ['operation', 'admin'],
    },
    {
        key: '/operations/exceptions',
        icon: _jsx(WarningOutlined, {}),
        label: _jsx(Link, { to: "/operations/exceptions", children: _jsxs(Space, { children: ["\u5F02\u5E38\u8BB0\u5F55", _jsx(Badge, { count: 0, showZero: false, size: "small" })] }) }),
        roles: ['patrol', 'ticket_clerk', 'operation', 'admin'],
    },
    {
        key: '/statistics',
        icon: _jsx(BarChartOutlined, {}),
        label: _jsx(Link, { to: "/statistics", children: "\u7EDF\u8BA1\u5206\u6790" }),
        roles: ['operation', 'admin'],
    },
    {
        key: '/audit-logs',
        icon: _jsx(HistoryOutlined, {}),
        label: _jsx(Link, { to: "/audit-logs", children: "\u5904\u7406\u75D5\u8FF9" }),
        roles: ['operation', 'admin'],
    },
];
function AppLayout() {
    const { user, logout, hasRole, fetchMe } = useAuth();
    const navigate = useNavigate();
    const [collapsed, setCollapsed] = useState(false);
    useEffect(() => {
        if (!user && useAuth.getState().token) {
            fetchMe();
        }
    }, [user, fetchMe]);
    const visibleMenu = MENU_ITEMS.filter((item) => hasRole(...item.roles));
    const userMenu = {
        items: [
            {
                key: 'profile',
                icon: _jsx(UserOutlined, {}),
                label: `${user?.full_name} (${ROLE_LABELS[user?.role || 'tourist']})`,
                disabled: true,
            },
            {
                key: 'logout',
                icon: _jsx(LogoutOutlined, {}),
                label: '退出登录',
            },
        ],
        onClick: ({ key }) => {
            if (key === 'logout') {
                logout();
                navigate({ to: '/login' });
            }
        },
    };
    return (_jsxs(Layout, { style: { minHeight: '100vh' }, children: [_jsxs(Sider, { collapsible: true, collapsed: collapsed, onCollapse: setCollapsed, theme: "dark", width: 230, children: [_jsxs("div", { style: {
                            height: 64,
                            margin: 10,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: collapsed ? 'center' : 'flex-start',
                            paddingLeft: collapsed ? 0 : 16,
                            color: '#fff',
                            fontSize: collapsed ? 22 : 18,
                            fontWeight: 600,
                            background: 'rgba(255,255,255,0.08)',
                            borderRadius: 8,
                        }, children: ["\uD83C\uDFA1 ", !collapsed && '导览跟进台'] }), _jsx(Menu, { theme: "dark", mode: "inline", defaultSelectedKeys: [window.location.pathname], selectedKeys: [window.location.pathname], items: visibleMenu, style: { border: 0, marginTop: 8 } })] }), _jsxs(Layout, { children: [_jsxs(Header, { style: {
                            background: '#fff',
                            padding: '0 24px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            boxShadow: '0 1px 4px rgba(0,21,41,.08)',
                        }, children: [_jsx("div", { style: { fontSize: 16, fontWeight: 500, color: '#1f1f1f' }, children: "\u666F\u533A\u8FD0\u8425\u5BFC\u89C8\u8DEF\u7EBF\u8DDF\u8FDB\u53F0" }), _jsx(Dropdown, { menu: userMenu, placement: "bottomRight", children: _jsx(Button, { type: "text", style: { padding: '0 8px' }, children: _jsxs(Space, { children: [_jsx(Avatar, { size: "small", icon: _jsx(UserOutlined, {}) }), _jsx("span", { children: user?.full_name || '用户' }), _jsxs("span", { style: { color: '#8c8c8c' }, children: ["(", ROLE_LABELS[user?.role || 'tourist'], ")"] }), _jsx(DownOutlined, { style: { fontSize: 10 } })] }) }) })] }), _jsx(Content, { style: {
                            margin: 16,
                            padding: 24,
                            background: '#fff',
                            borderRadius: 8,
                            minHeight: 'calc(100vh - 112px)',
                        }, children: _jsx(Outlet, {}) })] })] }));
}
