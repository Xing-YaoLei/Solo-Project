import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { createLazyFileRoute } from '@tanstack/react-router';
import { Card, Col, Row, Statistic, Space, Typography, List, Tag } from 'antd';
import { EnvironmentOutlined, PlayCircleOutlined, FileTextOutlined, ShopOutlined, WarningOutlined, UserOutlined, MoneyCollectOutlined, } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import { api } from '../../api';
import { STATUS_COLORS } from '../../types';
import dayjs from 'dayjs';
const { Title, Text } = Typography;
export const Route = createLazyFileRoute('/_layout/')({
    component: DashboardPage,
});
function DashboardPage() {
    const [stats, setStats] = useState({
        routes: 0, heat_points: 0, contents: 0, performances: 0,
        seats: 0, merchants: 0, contracts: 0, exceptions: 0,
        today_tickets: 0, today_revenue: 0,
        pending_verify: { heat: 0, content: 0, seats: 0, contracts: 0 },
        recent_changes: [],
    });
    useEffect(() => {
        fetchData();
    }, []);
    const fetchData = async () => {
        try {
            const [routes, hp, contents, perfs, merchants, contracts, exps, tickets, audits] = await Promise.all([
                api.get('/guide/routes', { page_size: 1 }),
                api.get('/guide/heat-points', { page_size: 1 }),
                api.get('/guide/contents', { page_size: 1 }),
                api.get('/operations/performances', { page_size: 1 }),
                api.get('/operations/merchants', { page_size: 1 }),
                api.get('/operations/contracts', { page_size: 1 }),
                api.get('/operations/exceptions', { status: 'pending', page_size: 1 }),
                api.get('/tickets', { page_size: 1 }),
                api.get('/audit-logs', { page_size: 8 }),
            ]);
            setStats({
                routes: routes.data.total || 0,
                heat_points: hp.data.total || 0,
                contents: contents.data.total || 0,
                performances: perfs.data.total || 0,
                merchants: merchants.data.total || 0,
                contracts: contracts.data.total || 0,
                exceptions: exps.data.total || 0,
                today_tickets: tickets.data.total || 0,
                today_revenue: (tickets.data.items || []).reduce((s, t) => s + (t.price || 0), 0),
                pending_verify: {
                    heat: (hp.data.items || []).filter((x) => x.status === 'pending').length,
                    content: (contents.data.items || []).filter((x) => x.status === 'pending').length,
                    seats: 0,
                    contracts: (contracts.data.items || []).filter((x) => x.status === 'pending').length,
                },
                recent_changes: audits.data.items || [],
            });
        }
        catch (e) {
            /* ignore */
        }
    };
    const verifyCards = [
        { label: '点位待复核', value: stats.pending_verify.heat, color: '#fa8c16', icon: _jsx(EnvironmentOutlined, {}), to: '/guide/heat-points' },
        { label: '内容待复核', value: stats.pending_verify.content, color: '#eb2f96', icon: _jsx(PlayCircleOutlined, {}), to: '/guide/contents' },
        { label: '合同待复核', value: stats.pending_verify.contracts, color: '#52c41a', icon: _jsx(FileTextOutlined, {}), to: '/operations/merchants' },
        { label: '待处理异常', value: stats.exceptions, color: '#ff4d4f', icon: _jsx(WarningOutlined, {}), to: '/operations/exceptions' },
    ];
    return (_jsxs(Space, { direction: "vertical", size: "large", style: { width: '100%' }, children: [_jsxs("div", { children: [_jsx(Title, { level: 3, style: { margin: 0 }, children: "\u5DE5\u4F5C\u53F0" }), _jsx(Text, { type: "secondary", children: "\u4ECA\u65E5\u6982\u89C8 \u00B7 \u5F85\u529E\u6838\u5BF9 \u00B7 \u6700\u8FD1\u52A8\u6001" })] }), _jsx(Row, { gutter: [16, 16], children: [
                    { title: '导览路线', value: stats.routes, icon: _jsx(EnvironmentOutlined, {}), color: '#1677ff' },
                    { title: '热力点位', value: stats.heat_points, icon: _jsx(UserOutlined, {}), color: '#722ed1' },
                    { title: '导览内容', value: stats.contents, icon: _jsx(PlayCircleOutlined, {}), color: '#eb2f96' },
                    { title: '演出项目', value: stats.performances, icon: _jsx(UserOutlined, {}), color: '#13c2c2' },
                    { title: '商户数', value: stats.merchants, icon: _jsx(ShopOutlined, {}), color: '#52c41a' },
                    { title: '生效合同', value: stats.contracts, icon: _jsx(FileTextOutlined, {}), color: '#fa8c16' },
                    { title: '票据总量', value: stats.today_tickets, icon: _jsx(FileTextOutlined, {}), color: '#1677ff' },
                    { title: '票务营收', value: `¥${stats.today_revenue.toFixed(0)}`, icon: _jsx(MoneyCollectOutlined, {}), color: '#52c41a' },
                ].map((c, i) => (_jsx(Col, { xs: 12, sm: 8, md: 6, xl: 3, children: _jsx(Card, { hoverable: true, children: _jsx(Statistic, { title: _jsx("span", { style: { color: '#666', fontSize: 13 }, children: c.title }), value: c.value, prefix: _jsx("span", { style: { color: c.color }, children: c.icon }), valueStyle: { color: c.color, fontSize: 22, fontWeight: 600 } }) }) }, i))) }), _jsxs(Row, { gutter: 16, children: [_jsx(Col, { xs: 24, md: 12, children: _jsx(Card, { title: "\uD83D\uDD0D \u5F85\u529E\u590D\u6838", styles: { body: { padding: 0 } }, children: _jsx(List, { itemLayout: "horizontal", dataSource: verifyCards, renderItem: (item) => (_jsxs(List.Item, { style: { cursor: 'pointer', padding: '16px 24px', borderBottom: '1px solid #f0f0f0' }, onClick: () => window.location.href = item.to, children: [_jsx(List.Item.Meta, { avatar: _jsx("div", { style: { fontSize: 28, color: item.color }, children: item.icon }), title: _jsx("span", { style: { color: '#333' }, children: item.label }) }), _jsxs(Tag, { color: item.color, style: { fontSize: 16, padding: '4px 12px', borderRadius: 16 }, children: [item.value, " \u9879"] })] })) }) }) }), _jsx(Col, { xs: 24, md: 12, children: _jsx(Card, { title: "\uD83D\uDCDC \u6700\u8FD1\u64CD\u4F5C\u75D5\u8FF9", styles: { body: { padding: 0 } }, children: _jsx(List, { itemLayout: "horizontal", dataSource: stats.recent_changes, locale: { emptyText: '暂无记录' }, renderItem: (log) => (_jsx(List.Item, { style: { padding: '12px 24px', borderBottom: '1px solid #f0f0f0' }, children: _jsx(List.Item.Meta, { avatar: _jsx("div", { style: {
                                                width: 32, height: 32, borderRadius: 6,
                                                background: '#e6f4ff', color: '#1677ff',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontWeight: 600, fontSize: 12,
                                            }, children: log.action?.slice(0, 2).toUpperCase() }), title: _jsxs(Space, { size: 8, children: [_jsx(Text, { strong: true, children: log.record_type || '系统' }), _jsx(Tag, { color: STATUS_COLORS[log.action === 'create' ? 'approved' : 'pending'], style: { margin: 0 }, children: log.action }), log.field_name && _jsxs(Text, { type: "secondary", style: { fontSize: 12 }, children: ["\u5B57\u6BB5: ", log.field_name] })] }), description: _jsxs(Space, { direction: "vertical", size: 2, children: [_jsx(Text, { type: "secondary", style: { fontSize: 12 }, children: log.remarks || (log.old_value && log.new_value ? `${log.old_value.slice(0, 20)} → ${log.new_value.slice(0, 20)}` : '') }), _jsxs(Text, { type: "secondary", style: { fontSize: 12 }, children: [dayjs(log.created_at).format('MM-DD HH:mm'), " \u00B7 \u7528\u6237#", log.user_id || 'sys'] })] }) }) })) }) }) })] })] }));
}
