import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { createLazyFileRoute } from '@tanstack/react-router';
import { Card, Table, Tag, Button, Space, Input, Select, DatePicker, App as AntdApp, Row, Col, Statistic, Timeline, Descriptions, Drawer, Tooltip, Badge, Typography, Alert, } from 'antd';
import { SearchOutlined, ReloadOutlined, DownloadOutlined, HistoryOutlined, ExportOutlined, FileTextOutlined, DeleteOutlined, CheckCircleOutlined, EditOutlined, PlusOutlined, WarningOutlined, TeamOutlined, ClockCircleOutlined, } from '@ant-design/icons';
import { useEffect, useState, useMemo } from 'react';
import { api } from '../../api';
import dayjs from 'dayjs';
const { RangePicker } = DatePicker;
const { Option } = Select;
const { Title, Text } = Typography;
const ACTION_COLORS = {
    create: 'green',
    update: 'blue',
    delete: 'red',
    approve: 'cyan',
    reject: 'magenta',
    cancel: 'volcano',
    batch_update: 'purple',
    verify: 'geekblue',
};
const ACTION_LABELS = {
    create: '创建',
    update: '更新',
    delete: '删除',
    approve: '审核通过',
    reject: '审核拒绝',
    cancel: '取消',
    batch_update: '批量更新',
    verify: '复核',
};
export const Route = createLazyFileRoute('/_layout/audit-logs')({
    component: AuditLogsPage,
});
function AuditLogsPage() {
    const { message, modal } = AntdApp.useApp();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(50);
    const [filters, setFilters] = useState({});
    const [dateRange, setDateRange] = useState(null);
    const [traceOpen, setTraceOpen] = useState(false);
    const [trace, setTrace] = useState([]);
    const [traceTarget, setTraceTarget] = useState(null);
    const fetch = () => {
        setLoading(true);
        const params = { page, page_size: pageSize, ...filters };
        if (dateRange && dateRange.length === 2) {
            params.start_date = dateRange[0].format('YYYY-MM-DD');
            params.end_date = dateRange[1].format('YYYY-MM-DD');
        }
        api.get('/audit-logs', params).then((r) => {
            setData(r.data.items || []);
            setTotal(r.data.total || 0);
            setLoading(false);
        }).catch(() => setLoading(false));
    };
    useEffect(fetch, [page, pageSize, filters, dateRange]);
    const recordTypes = useMemo(() => Array.from(new Set(data.map((x) => x.record_type).filter(Boolean))), [data]);
    const showTrace = (record_type, record_id, title) => {
        if (!record_type || !record_id)
            return;
        api.get('/audit-logs/trace', { record_type, record_id }).then((r) => {
            setTrace(r.data);
            setTraceTarget({ type: record_type, id: record_id, title });
            setTraceOpen(true);
        });
    };
    const exportLogs = () => {
        modal.confirm({
            title: '导出审计日志',
            content: '将根据当前筛选条件导出操作记录',
            onOk: () => {
                message.info('导出任务已提交，完成后将在下载目录中生成 CSV 文件');
            },
        });
    };
    const totalCreate = data.filter((x) => x.action === 'create').length;
    const totalUpdate = data.filter((x) => x.action === 'update').length;
    const totalVerify = data.filter((x) => x.action === 'verify').length;
    const totalBatch = data.filter((x) => x.action === 'batch_update').length;
    const actionIcon = (a) => {
        switch (a) {
            case 'create': return _jsx(PlusOutlined, {});
            case 'update': return _jsx(EditOutlined, {});
            case 'delete': return _jsx(DeleteOutlined, {});
            case 'approve': return _jsx(CheckCircleOutlined, {});
            case 'verify': return _jsx(CheckCircleOutlined, {});
            case 'cancel': return _jsx(WarningOutlined, {});
            case 'batch_update': return _jsx(TeamOutlined, {});
            default: return _jsx(FileTextOutlined, {});
        }
    };
    const columns = [
        { title: 'ID', dataIndex: 'id', width: 80 },
        {
            title: '操作', dataIndex: 'action', width: 110,
            render: (v) => (_jsx(Tag, { color: ACTION_COLORS[v] || 'default', icon: actionIcon(v), children: ACTION_LABELS[v] || v })),
        },
        {
            title: '记录类型', dataIndex: 'record_type', width: 150,
            render: (v) => v ? _jsx(Tag, { color: "blue", children: v }) : _jsx("span", { style: { color: '#999' }, children: "\u7CFB\u7EDF" }),
        },
        {
            title: '记录ID', dataIndex: 'record_id', width: 90,
            render: (v, r) => (v && r.record_type ? (_jsxs("a", { onClick: () => showTrace(r.record_type, v, `${r.record_type}#${v}`), children: ["#", v, " \uD83D\uDD17"] })) : v ? `#${v}` : '-'),
        },
        {
            title: '批量ID', dataIndex: 'batch_ids', width: 140,
            render: (v) => v && v.length > 0 ? (_jsx(Tooltip, { title: `批量处理 ${v.length} 条: ${v.slice(0, 5).join(',')}${v.length > 5 ? '...' : ''}`, children: _jsxs(Tag, { color: "purple", children: [v.length, " \u6761\u8BB0\u5F55"] }) })) : '-',
        },
        {
            title: '字段变更', width: 220,
            render: (_, r) => (r.field_name ? (_jsxs(Space, { direction: "vertical", size: 0, style: { fontSize: 12 }, children: [_jsxs(Text, { type: "secondary", children: [r.field_name, ":"] }), _jsxs("div", { children: [r.old_value && _jsx("span", { style: { color: '#ff4d4f', textDecoration: 'line-through' }, children: String(r.old_value).slice(0, 12) }), r.old_value && r.new_value && ' → ', r.new_value && _jsx("span", { style: { color: '#52c41a', fontWeight: 500 }, children: String(r.new_value).slice(0, 12) })] })] })) : '-'),
        },
        {
            title: '备注', dataIndex: 'remarks', width: 240,
            render: (v) => v ? (_jsx(Text, { ellipsis: true, style: { maxWidth: 240 }, children: v })) : _jsx("span", { style: { color: '#999' }, children: "-" }),
        },
        { title: '操作人ID', dataIndex: 'user_id', width: 90, render: (v) => v ? `#${v}` : '系统' },
        { title: 'IP', dataIndex: 'ip_address', width: 120, render: (v) => v || '-' },
        {
            title: '时间', dataIndex: 'created_at', width: 160,
            render: (v) => dayjs(v).format('YYYY-MM-DD HH:mm:ss'),
        },
        {
            title: '溯源', key: 'trace', width: 100, fixed: 'right',
            render: (_, r) => (r.record_type && r.record_id ? (_jsx(Button, { type: "link", size: "small", icon: _jsx(HistoryOutlined, {}), onClick: () => showTrace(r.record_type, r.record_id, `${r.record_type}#${r.record_id}`), children: "\u5168\u94FE\u8DEF" })) : null),
        },
    ];
    return (_jsxs(Space, { direction: "vertical", size: "large", style: { width: '100%' }, children: [_jsxs("div", { children: [_jsxs(Title, { level: 3, style: { margin: 0 }, children: [_jsx(HistoryOutlined, {}), " \u5904\u7406\u75D5\u8FF9\uFF08\u5BA1\u8BA1\u65E5\u5FD7\uFF09"] }), _jsx(Text, { type: "secondary", children: "\u5168\u64CD\u4F5C\u7559\u75D5\uFF1A\u521B\u5EFA/\u4FEE\u6539/\u590D\u6838/\u6279\u91CF\u64CD\u4F5C\uFF0C\u70B9\u51FB\u300C\uD83D\uDD17\u300D\u6216\u300C\u5168\u94FE\u8DEF\u300D\u67E5\u770B\u8BB0\u5F55\u5B8C\u6574\u5904\u7406\u8F68\u8FF9" })] }), _jsxs(Row, { gutter: [16, 16], children: [_jsx(Col, { xs: 12, md: 6, children: _jsx(Card, { children: _jsx(Statistic, { title: "\u603B\u8BB0\u5F55", value: total, prefix: _jsx(ClockCircleOutlined, { style: { color: '#1677ff' } }) }) }) }), _jsx(Col, { xs: 12, md: 6, children: _jsx(Card, { children: _jsx(Statistic, { title: "\u521B\u5EFA", value: totalCreate, prefix: _jsx(PlusOutlined, { style: { color: '#52c41a' } }), valueStyle: { color: '#52c41a' } }) }) }), _jsx(Col, { xs: 12, md: 6, children: _jsx(Card, { children: _jsx(Statistic, { title: "\u66F4\u65B0", value: totalUpdate, prefix: _jsx(EditOutlined, { style: { color: '#1677ff' } }), valueStyle: { color: '#1677ff' } }) }) }), _jsx(Col, { xs: 12, md: 6, children: _jsx(Card, { children: _jsx(Statistic, { title: "\u590D\u6838/\u6279\u91CF", value: `${totalVerify}+${totalBatch}`, prefix: _jsx(CheckCircleOutlined, { style: { color: '#722ed1' } }), valueStyle: { color: '#722ed1' } }) }) })] }), _jsxs(Card, { styles: { body: { padding: 0 } }, children: [_jsxs("div", { style: { padding: '16px 24px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }, children: [_jsxs(Space, { wrap: true, children: [_jsx(Select, { placeholder: "\u8BB0\u5F55\u7C7B\u578B", allowClear: true, style: { width: 180 }, onChange: (v) => { setFilters({ ...filters, record_type: v }); setPage(1); }, showSearch: true, options: recordTypes.map((t) => ({ label: t, value: t })) }), _jsx(Select, { placeholder: "\u64CD\u4F5C\u7C7B\u578B", allowClear: true, style: { width: 150 }, onChange: (v) => { setFilters({ ...filters, action: v }); setPage(1); }, options: Object.entries(ACTION_LABELS).map(([k, v]) => ({ label: v, value: k })) }), _jsx(Input, { prefix: _jsx(SearchOutlined, {}), placeholder: "\u7528\u6237ID/\u5907\u6CE8", allowClear: true, style: { width: 180 }, onPressEnter: (e) => { setFilters({ ...filters, keyword: e.target.value }); setPage(1); } }), _jsx(RangePicker, { showTime: true, value: dateRange, onChange: setDateRange }), _jsx(Button, { icon: _jsx(ReloadOutlined, {}), onClick: () => { setFilters({}); setDateRange(null); setPage(1); }, children: "\u91CD\u7F6E" })] }), _jsx(Space, { children: _jsx(Button, { icon: _jsx(ExportOutlined, {}), onClick: exportLogs, children: "\u5BFC\u51FA" }) })] }), _jsx(Table, { rowKey: "id", loading: loading, dataSource: data, columns: columns, pagination: {
                            current: page, pageSize, total,
                            showSizeChanger: true, showQuickJumper: true,
                            showTotal: (t) => `共 ${t} 条操作记录`,
                            onChange: (p, ps) => { setPage(p); setPageSize(ps); },
                        }, scroll: { x: 1600 } })] }), _jsxs(Drawer, { title: _jsxs(Space, { children: [_jsx(Badge, { status: "processing" }), _jsx("span", { children: "\u5168\u94FE\u8DEF\u5904\u7406\u8F68\u8FF9" }), _jsxs(Tag, { color: "blue", children: [traceTarget?.type, " #", traceTarget?.id] })] }), open: traceOpen, onClose: () => setTraceOpen(false), width: 640, extra: _jsx(Button, { size: "small", icon: _jsx(DownloadOutlined, {}), children: "\u5BFC\u51FA\u8BE5\u8BB0\u5F55\u8F68\u8FF9" }), children: [_jsx(Alert, { message: "\u4EC0\u4E48\u662F\u5168\u94FE\u8DEF\u8F68\u8FF9\uFF1F", description: "\u4ECE\u8BB0\u5F55\u88AB\u521B\u5EFA\u5F00\u59CB\uFF0C\u6BCF\u4E00\u6B21\u4FEE\u6539\u3001\u590D\u6838\u3001\u6279\u91CF\u66F4\u65B0\u3001\u72B6\u6001\u53D8\u66F4\u3001\u751A\u81F3\u5173\u8054\u7684\u5F02\u5E38\u5904\u7406\uFF0C\u90FD\u4F1A\u6309\u7167\u65F6\u95F4\u987A\u5E8F\u5448\u73B0\u3002\u4EFB\u4F55\u4E00\u6B65\u90FD\u80FD\u56DE\u770B\u5230\u539F\u503C\u2192\u65B0\u503C\u7684\u53D8\u5316\u3002", type: "info", showIcon: true, style: { marginBottom: 24 } }), trace.length === 0 ? (_jsxs("div", { style: { textAlign: 'center', padding: '40px 0', color: '#999' }, children: [_jsx(HistoryOutlined, { style: { fontSize: 48, opacity: 0.5 } }), _jsx("div", { style: { marginTop: 12 }, children: "\u6682\u65E0\u64CD\u4F5C\u75D5\u8FF9" })] })) : (_jsx(Timeline, { mode: "left", items: trace.map((t, idx) => ({
                            color: t.action === 'create' ? 'green' :
                                t.action === 'delete' ? 'red' :
                                    t.action === 'verify' || t.action === 'approve' ? 'cyan' :
                                        t.action === 'batch_update' ? 'purple' :
                                            t.action === 'cancel' ? 'volcano' : 'blue',
                            label: (_jsxs(Space, { direction: "vertical", size: 0, style: { fontSize: 12 }, children: [_jsx(Text, { type: "secondary", style: { fontWeight: 600 }, children: dayjs(t.at).format('HH:mm:ss') }), _jsx(Text, { type: "secondary", children: dayjs(t.at).format('YYYY-MM-DD') })] })),
                            children: (_jsxs(Card, { size: "small", styles: { body: { padding: 12 } }, style: { marginBottom: idx === trace.length - 1 ? 0 : 12 }, children: [_jsxs(Space, { style: { marginBottom: 8 }, children: [_jsxs(Tag, { color: ACTION_COLORS[t.action] || 'default', children: [actionIcon(t.action), " ", ACTION_LABELS[t.action] || t.action] }), _jsx(Text, { strong: true, children: t.user_name
                                                    ? `${t.user_name}${t.user_id ? ` (#${t.user_id})` : ''}`
                                                    : t.user_id ? `用户#${t.user_id}` : '系统' })] }), t.field ? (_jsxs(Descriptions, { size: "small", column: 1, bordered: true, style: { marginBottom: 8 }, styles: { label: { width: 80, background: '#fafafa' } }, children: [_jsx(Descriptions.Item, { label: "\u5B57\u6BB5", children: t.field }), t.old && (_jsx(Descriptions.Item, { label: "\u539F\u503C", children: _jsx("span", { style: { color: '#ff4d4f' }, children: t.old }) })), t.new && (_jsx(Descriptions.Item, { label: "\u65B0\u503C", children: _jsx("span", { style: { color: '#52c41a', fontWeight: 600 }, children: t.new }) }))] })) : null, t.remarks && (_jsxs("div", { style: { fontSize: 13, color: '#555', background: '#f6ffed', padding: '6px 10px', borderRadius: 4 }, children: ["\uD83D\uDCAC ", t.remarks] }))] })),
                        })) }))] })] }));
}
