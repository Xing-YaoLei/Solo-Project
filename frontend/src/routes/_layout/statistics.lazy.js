import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { createLazyFileRoute } from '@tanstack/react-router';
import { Card, Row, Col, Statistic, DatePicker, Tabs, Table, Tag, Button, Space, Select, Modal, Descriptions, Progress, Tooltip, App as AntdApp, Typography, } from 'antd';
import { DollarOutlined, RiseOutlined, ShoppingCartOutlined, BarChartOutlined, PieChartOutlined, FileTextOutlined, DownloadOutlined, SearchOutlined, } from '@ant-design/icons';
import { useEffect, useState, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { api } from '../../api';
import dayjs from 'dayjs';
const { RangePicker } = DatePicker;
const { Option } = Select;
const { Title, Text } = Typography;
export const Route = createLazyFileRoute('/_layout/statistics')({
    component: StatisticsPage,
});
function StatisticsPage() {
    const { message } = AntdApp.useApp();
    const [tab, setTab] = useState('overview');
    const [range, setRange] = useState([
        dayjs().subtract(7, 'day').startOf('day'),
        dayjs().endOf('day'),
    ]);
    const [loading, setLoading] = useState(false);
    const [ticketStats, setTicketStats] = useState([]);
    const [conversion, setConversion] = useState([]);
    const [detailData, setDetailData] = useState([]);
    const [detailTotal, setDetailTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [ticketList, setTicketList] = useState([]);
    const [saleList, setSaleList] = useState([]);
    const [detailModal, setDetailModal] = useState(null);
    const fetch = () => {
        if (!range || range.length < 2)
            return;
        setLoading(true);
        const [s, e] = [range[0].format('YYYY-MM-DD'), range[1].format('YYYY-MM-DD')];
        Promise.all([
            api.get('/statistics/tickets', { start_date: s, end_date: e }),
            api.get('/statistics/conversion', { start_date: s, end_date: e }),
            api.get('/statistics/secondary-detail', { start_date: s, end_date: e, page, page_size: pageSize }),
            api.get('/tickets', { page_size: pageSize }),
            api.get('/secondary-sales', { start_date: s, end_date: e, page_size: pageSize }),
        ]).then(([ts, cv, dt, tk, sl]) => {
            setTicketStats(ts.data);
            setConversion(cv.data);
            setDetailData(dt.data.items || []);
            setDetailTotal(dt.data.total || 0);
            setTicketList(tk.data.items || []);
            setSaleList(sl.data.items || []);
        }).finally(() => setLoading(false));
    };
    useEffect(fetch, [range, page, pageSize, tab]);
    const totalTickets = ticketStats.reduce((s, t) => s + t.total_tickets, 0);
    const totalRevenue = ticketStats.reduce((s, t) => s + t.total_revenue, 0);
    const conversionDays = conversion.reduce((s, c) => s + c.ticket_count, 0);
    const conversionRevenue = conversion.reduce((s, c) => s + c.total_revenue, 0);
    const avgConversion = conversionDays > 0
        ? (conversion.reduce((s, c) => s + c.secondary_conversion_rate, 0) / conversion.length).toFixed(4)
        : '0.0000';
    const avgSecondaryPerTicket = conversionDays > 0
        ? (conversion.reduce((s, c) => s + c.secondary_per_ticket, 0) / conversion.length).toFixed(2)
        : '0.00';
    const lineChartOption = useMemo(() => ({
        tooltip: { trigger: 'axis' },
        legend: { data: ['票量', '已核销', '营收(¥)', '二消转化率(%)'] },
        grid: { left: 60, right: 60, top: 40, bottom: 40 },
        xAxis: { type: 'category', data: ticketStats.map((t) => t.date) },
        yAxis: [
            { type: 'value', name: '数量' },
            { type: 'value', name: '金额/率', axisLabel: { formatter: (v) => v > 1 ? `${v / 100}` : `${(v * 100).toFixed(0)}%` } },
        ],
        series: [
            { name: '票量', type: 'bar', data: ticketStats.map((t) => t.total_tickets), itemStyle: { color: '#1677ff' } },
            { name: '已核销', type: 'bar', data: ticketStats.map((t) => t.used_tickets), itemStyle: { color: '#52c41a' } },
            {
                name: '营收(¥)', type: 'line', yAxisIndex: 1, smooth: true,
                data: ticketStats.map((t) => t.total_revenue), itemStyle: { color: '#fa8c16' },
            },
            {
                name: '二消转化率(%)', type: 'line', yAxisIndex: 1, smooth: true,
                data: conversion.map((c) => c.secondary_conversion_rate * 100), itemStyle: { color: '#eb2f96' },
            },
        ],
    }), [ticketStats, conversion]);
    const conversionChartOption = useMemo(() => ({
        tooltip: { trigger: 'axis' },
        legend: { data: ['门票营收', '二消营收', '单客二消(¥)', '转化率(%)'] },
        grid: { left: 60, right: 60, top: 40, bottom: 40 },
        xAxis: { type: 'category', data: conversion.map((c) => c.date) },
        yAxis: [
            { type: 'value', name: '金额(¥)' },
            { type: 'value', name: '率(%)', axisLabel: { formatter: '{value}%' } },
        ],
        series: [
            {
                name: '门票营收', type: 'bar', stack: 'total',
                data: conversion.map((c) => c.total_revenue - (c.secondary_per_ticket * c.ticket_count)),
                itemStyle: { color: '#1677ff' },
            },
            {
                name: '二消营收', type: 'bar', stack: 'total',
                data: conversion.map((c) => c.secondary_per_ticket * c.ticket_count),
                itemStyle: { color: '#52c41a' },
            },
            {
                name: '单客二消(¥)', type: 'line', yAxisIndex: 0, smooth: true,
                data: conversion.map((c) => c.secondary_per_ticket), itemStyle: { color: '#fa8c16' },
            },
            {
                name: '转化率(%)', type: 'line', yAxisIndex: 1, smooth: true,
                data: conversion.map((c) => (c.secondary_conversion_rate * 100).toFixed(2)),
                itemStyle: { color: '#eb2f96' }, areaStyle: { opacity: 0.1 },
            },
        ],
    }), [conversion]);
    const categoryMap = useMemo(() => {
        const m = {};
        saleList.forEach((s) => {
            const cat = s.item_category || '其他';
            m[cat] = (m[cat] || 0) + s.total_amount;
        });
        return m;
    }, [saleList]);
    const pieOption = useMemo(() => ({
        tooltip: { trigger: 'item', formatter: '{b}: ¥{c} ({d}%)' },
        legend: { bottom: 0 },
        series: [{
                type: 'pie', radius: ['45%', '70%'], avoidLabelOverlap: false,
                label: { show: true, formatter: '{b}\n{d}%' },
                data: Object.entries(categoryMap).map(([n, v]) => ({ name: n, value: v })),
            }],
    }), [categoryMap]);
    const detailColumns = [
        {
            title: '票号', dataIndex: 'ticket_no', width: 140,
            render: (v, r) => (_jsx("a", { onClick: () => setDetailModal(r), style: { fontFamily: 'monospace' }, children: v })),
        },
        { title: '购票人', dataIndex: 'buyer_name', width: 100, render: (v) => v || '-' },
        { title: '路线', dataIndex: 'route_name', width: 140, render: (v) => v || '-' },
        {
            title: '二消次数', dataIndex: 'secondary_count', width: 100,
            render: (v) => _jsxs(Tag, { color: "blue", children: [v, " \u6B21"] }),
        },
        {
            title: '二消金额', dataIndex: 'secondary_total', width: 120,
            render: (v) => _jsxs("span", { style: { color: '#52c41a', fontWeight: 600 }, children: ["\u00A5", v.toFixed(2)] }),
        },
        {
            title: '明细查看', key: 'view', width: 100,
            render: (_, r) => (_jsx(Button, { type: "link", size: "small", onClick: () => setDetailModal(r), children: "\u67E5\u770B\u660E\u7EC6" })),
        },
    ];
    const exportDetail = () => {
        message.info('正在导出，请稍候...');
    };
    return (_jsxs(Space, { direction: "vertical", size: "large", style: { width: '100%' }, children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }, children: [_jsxs("div", { children: [_jsx(Title, { level: 3, style: { margin: 0 }, children: "\uD83D\uDCCA \u7EDF\u8BA1\u5206\u6790" }), _jsx(Text, { type: "secondary", children: "\u4ECE\u4E8C\u6D88\u8F6C\u5316\u8FFD\u5230\u5177\u4F53\u5355\u636E\uFF0C\u5168\u94FE\u8DEF\u6570\u636E\u53EF\u89C6\u5316" })] }), _jsxs(Space, { children: [_jsx(RangePicker, { showTime: true, value: range, onChange: setRange, ranges: {
                                    '近7天': [dayjs().subtract(7, 'day'), dayjs()],
                                    '近30天': [dayjs().subtract(30, 'day'), dayjs()],
                                    '本月': [dayjs().startOf('month'), dayjs().endOf('month')],
                                } }), _jsx(Button, { icon: _jsx(SearchOutlined, {}), type: "primary", onClick: fetch, children: "\u67E5\u8BE2" })] })] }), _jsxs(Row, { gutter: [16, 16], children: [_jsx(Col, { xs: 24, sm: 12, lg: 6, children: _jsx(Card, { children: _jsx(Statistic, { title: "\u51FA\u7968\u603B\u91CF", value: totalTickets, prefix: _jsx(FileTextOutlined, { style: { color: '#1677ff' } }), valueStyle: { color: '#1677ff' } }) }) }), _jsx(Col, { xs: 24, sm: 12, lg: 6, children: _jsx(Card, { children: _jsx(Statistic, { title: "\u603B\u8425\u6536(\u95E8\u7968+\u4E8C\u6D88)", value: conversionRevenue, precision: 2, prefix: _jsx(DollarOutlined, { style: { color: '#fa8c16' } }), valueStyle: { color: '#fa8c16' } }) }) }), _jsx(Col, { xs: 24, sm: 12, lg: 6, children: _jsxs(Card, { children: [_jsx(Statistic, { title: "\u5E73\u5747\u4E8C\u6D88\u8F6C\u5316\u7387", value: avgConversion, precision: 4, suffix: "%", prefix: _jsx(RiseOutlined, { style: { color: '#52c41a' } }), valueStyle: { color: '#52c41a' } }), _jsx(Progress, { percent: parseFloat(avgConversion) * 100, showInfo: false, size: "small", style: { marginTop: 8 } })] }) }), _jsx(Col, { xs: 24, sm: 12, lg: 6, children: _jsx(Card, { children: _jsx(Statistic, { title: "\u5355\u5BA2\u4E8C\u6D88\u8D21\u732E", value: avgSecondaryPerTicket, precision: 2, prefix: _jsx(ShoppingCartOutlined, { style: { color: '#eb2f96' } }), valueStyle: { color: '#eb2f96' }, suffix: "\u5143" }) }) })] }), _jsx(Tabs, { activeKey: tab, onChange: setTab, items: [
                    { key: 'overview', label: _jsxs("span", { children: [_jsx(BarChartOutlined, {}), " \u6574\u4F53\u8D8B\u52BF"] }) },
                    { key: 'conversion', label: _jsxs("span", { children: [_jsx(PieChartOutlined, {}), " \u4E8C\u6D88\u8F6C\u5316"] }) },
                    { key: 'detail', label: _jsxs("span", { children: [_jsx(FileTextOutlined, {}), " \u8F6C\u5316\u660E\u7EC6(\u8FFD\u5230\u5355\u636E)"] }) },
                ] }), tab === 'overview' && (_jsxs(Space, { direction: "vertical", size: "large", style: { width: '100%' }, children: [_jsx(Card, { title: "\uD83D\uDCC8 \u7968\u52A1+\u6838\u9500+\u8425\u6536\u8D8B\u52BF", loading: loading, children: _jsx(ReactECharts, { option: lineChartOption, style: { height: 400 }, notMerge: true, lazyUpdate: true }) }), _jsxs(Row, { gutter: 16, children: [_jsx(Col, { xs: 24, md: 14, children: _jsx(Card, { title: "\uD83D\uDCCA \u6BCF\u65E5\u6838\u9500\u7387", loading: loading, children: _jsx(Table, { rowKey: "date", size: "small", dataSource: ticketStats, pagination: false, columns: [
                                            { title: '日期', dataIndex: 'date', width: 120 },
                                            { title: '出票', dataIndex: 'total_tickets', width: 90 },
                                            { title: '核销', dataIndex: 'used_tickets', width: 90 },
                                            { title: '营收(¥)', dataIndex: 'total_revenue', width: 120, render: (v) => `¥${v.toFixed(2)}` },
                                            {
                                                title: '核销率', key: 'rate',
                                                render: (_, r) => (_jsx(Progress, { percent: Math.round(r.utilization_rate * 100), size: "small" })),
                                            },
                                        ] }) }) }), _jsx(Col, { xs: 24, md: 10, children: _jsx(Card, { title: "\uD83E\uDD67 \u4E8C\u6D88\u54C1\u7C7B\u5206\u5E03", loading: loading, children: _jsx(ReactECharts, { option: pieOption, style: { height: 380 }, notMerge: true }) }) })] })] })), tab === 'conversion' && (_jsxs(Space, { direction: "vertical", size: "large", style: { width: '100%' }, children: [_jsx(Card, { title: "\uD83D\uDCB9 \u4E8C\u6D88\u8F6C\u5316\u8D8B\u52BF\uFF08\u95E8\u7968\u8425\u6536 vs \u4E8C\u6D88\u8425\u6536\uFF09", loading: loading, children: _jsx(ReactECharts, { option: conversionChartOption, style: { height: 420 }, notMerge: true, lazyUpdate: true }) }), _jsx(Card, { title: "\uD83D\uDCCB \u6BCF\u65E5\u8F6C\u5316\u660E\u7EC6", loading: loading, extra: _jsx(Button, { icon: _jsx(DownloadOutlined, {}), children: "\u5BFC\u51FA\u62A5\u8868" }), children: _jsx(Table, { rowKey: "date", dataSource: conversion, pagination: false, size: "middle", columns: [
                                { title: '日期', dataIndex: 'date', width: 120 },
                                { title: '购票人次', dataIndex: 'ticket_count', width: 100 },
                                {
                                    title: '转化率',
                                    dataIndex: 'secondary_conversion_rate',
                                    width: 180,
                                    render: (v) => (_jsx(Progress, { percent: Math.round(v * 100), format: (p) => `${p}%`, size: "small" })),
                                },
                                {
                                    title: '单客二消', dataIndex: 'secondary_per_ticket', width: 120,
                                    render: (v) => _jsxs("span", { style: { color: '#fa8c16' }, children: ["\u00A5", v.toFixed(2)] }),
                                },
                                {
                                    title: '当日总营收', dataIndex: 'total_revenue', width: 140,
                                    render: (v) => _jsxs("span", { style: { color: '#52c41a', fontWeight: 600 }, children: ["\u00A5", v.toFixed(2)] }),
                                },
                            ] }) })] })), tab === 'detail' && (_jsx(Card, { title: "\uD83D\uDD17 \u4E8C\u6D88\u8F6C\u5316\u660E\u7EC6\uFF08\u6BCF\u5F20\u7968\u5BF9\u5E94\u7684\u4E8C\u6D88\u8BB0\u5F55\uFF0C\u53EF\u70B9\u8FDB\u67E5\u770B\u5177\u4F53\u5355\u636E\uFF09", loading: loading, extra: _jsx(Tooltip, { title: "\u5BFC\u51FA\u5168\u90E8\u8F6C\u5316\u660E\u7EC6\uFF08\u542B\u5177\u4F53\u5546\u54C1\uFF09", children: _jsx(Button, { icon: _jsx(DownloadOutlined, {}), onClick: exportDetail, children: "\u5BFC\u51FA\u660E\u7EC6" }) }), children: _jsx(Table, { rowKey: "ticket_id", dataSource: detailData, columns: detailColumns, pagination: {
                        current: page, pageSize, total: detailTotal,
                        showSizeChanger: true, showQuickJumper: true,
                        showTotal: (t) => `共 ${t} 条转化记录`,
                        onChange: (p, ps) => { setPage(p); setPageSize(ps); },
                    }, scroll: { x: 900 } }) })), _jsx(Modal, { title: "\uD83D\uDD0D \u5177\u4F53\u5355\u636E\uFF1A\u4E8C\u6D88\u660E\u7EC6", open: !!detailModal, onCancel: () => setDetailModal(null), footer: null, width: 640, children: detailModal && (_jsxs("div", { children: [_jsxs(Descriptions, { bordered: true, size: "small", column: 2, style: { marginBottom: 16 }, children: [_jsx(Descriptions.Item, { label: "\u7968\u53F7", children: _jsx("span", { style: { fontFamily: 'monospace' }, children: detailModal.ticket_no }) }), _jsx(Descriptions.Item, { label: "\u8D2D\u7968\u4EBA", children: detailModal.buyer_name || '-' }), _jsx(Descriptions.Item, { label: "\u8DEF\u7EBF", span: 2, children: detailModal.route_name || '-' }), _jsx(Descriptions.Item, { label: "\u4E8C\u6D88\u6B21\u6570", children: _jsxs(Tag, { color: "blue", children: [detailModal.secondary_count, " \u6B21"] }) }), _jsx(Descriptions.Item, { label: "\u4E8C\u6D88\u91D1\u989D", children: _jsxs("span", { style: { color: '#52c41a', fontWeight: 600 }, children: ["\u00A5", detailModal.secondary_total.toFixed(2)] }) })] }), _jsx(Title, { level: 5, children: "\u5177\u4F53\u5546\u54C1\u660E\u7EC6" }), _jsx(Table, { rowKey: "id", size: "small", dataSource: detailModal.items, pagination: false, columns: [
                                { title: '商品', dataIndex: 'item', width: 180 },
                                { title: '品类', dataIndex: 'category', width: 100, render: (v) => v ? _jsx(Tag, { children: v }) : '-' },
                                { title: '数量', dataIndex: 'qty', width: 80 },
                                { title: '单价', dataIndex: 'price', width: 100, render: (v) => `¥${v}` },
                                { title: '小计', dataIndex: 'total', width: 110, render: (v) => _jsxs("span", { style: { color: '#fa8c16' }, children: ["\u00A5", v] }) },
                                { title: '日期', dataIndex: 'at', width: 110 },
                            ] })] })) })] }));
}
