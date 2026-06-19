import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { createLazyFileRoute } from '@tanstack/react-router';
import { Card, Table, Tag, Button, Space, Input, Select, Modal, Form, Drawer, Timeline, App as AntdApp, Row, Col, Statistic, Tooltip, Badge, Descriptions, Alert, Divider, Typography, } from 'antd';
import { PlusOutlined, ReloadOutlined, CheckCircleOutlined, HistoryOutlined, WarningOutlined, RollbackOutlined, CloseCircleOutlined, ThunderboltOutlined, ThunderboltFilled, SafetyCertificateOutlined, QuestionCircleOutlined, ExclamationCircleOutlined, EnvironmentOutlined, } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import { api } from '../../../api';
import { STATUS_COLORS, STATUS_LABELS, EXCEPTION_LABELS, } from '../../../types';
import dayjs from 'dayjs';
const { Option } = Select;
const { TextArea } = Input;
const { Title, Text, Paragraph } = Typography;
const EXCEPTION_ICONS = {
    performance_cancel: _jsx(CloseCircleOutlined, {}),
    route_change: _jsx(EnvironmentOutlined, {}),
    equipment_failure: _jsx(ThunderboltFilled, {}),
    weather_issue: _jsx(QuestionCircleOutlined, {}),
    staff_absence: _jsx(ExclamationCircleOutlined, {}),
    other: _jsx(WarningOutlined, {}),
};
const EXCEPTION_COLORS = {
    performance_cancel: '#ff4d4f',
    route_change: '#1677ff',
    equipment_failure: '#722ed1',
    weather_issue: '#13c2c2',
    staff_absence: '#fa8c16',
    other: '#8c8c8c',
};
export const Route = createLazyFileRoute('/_layout/operations/exceptions')({
    component: ExceptionsPage,
});
function ExceptionsPage() {
    const { message, modal } = AntdApp.useApp();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [filters, setFilters] = useState({});
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('create');
    const [current, setCurrent] = useState(null);
    const [form] = Form.useForm();
    const [traceOpen, setTraceOpen] = useState(false);
    const [trace, setTrace] = useState([]);
    const [originalOpen, setOriginalOpen] = useState(false);
    const [original, setOriginal] = useState(null);
    const fetch = () => {
        setLoading(true);
        api.get('/operations/exceptions', { page, page_size: pageSize, ...filters }).then((r) => {
            setData(r.data.items || []);
            setTotal(r.data.total || 0);
            setLoading(false);
        }).catch(() => setLoading(false));
    };
    useEffect(fetch, [page, pageSize, filters]);
    const openModal = (mode, record) => {
        setModalMode(mode);
        setCurrent(record || null);
        form.resetFields();
        if (record)
            form.setFieldsValue(record);
        setModalOpen(true);
    };
    const handleSubmit = async () => {
        try {
            const v = await form.validateFields();
            const payload = { ...v };
            if (modalMode === 'create') {
                await api.post('/operations/exceptions', payload);
                message.success('已创建异常记录');
            }
            else if (modalMode === 'update' && current) {
                await api.put(`/operations/exceptions/${current.id}`, payload);
                message.success('更新成功');
            }
            setModalOpen(false);
            fetch();
        }
        catch { }
    };
    const resolve = (r) => {
        modal.confirm({
            title: '处理完成？',
            icon: _jsx(SafetyCertificateOutlined, { style: { color: '#52c41a' } }),
            content: (_jsxs(Form, { layout: "vertical", id: "resolve-form", children: [_jsx(Form.Item, { label: "\u6839\u56E0\u5206\u6790", name: "root_cause", children: _jsx(TextArea, { id: "resolve-cause", rows: 3, placeholder: "\u5206\u6790\u6839\u672C\u539F\u56E0" }) }), _jsx(Form.Item, { label: "\u5904\u7406\u65B9\u6848\u4E0E\u7ED3\u679C", name: "resolution", children: _jsx(TextArea, { id: "resolve-resolution", rows: 4, placeholder: "\u8BE6\u7EC6\u8BF4\u660E\u5982\u4F55\u5904\u7406\u3001\u6D89\u53CA\u54EA\u4E9B\u4EBA\u5458\u548C\u8865\u507F\u63AA\u65BD\u7B49" }) })] })),
            onOk: async () => {
                const cause = document.getElementById('resolve-cause')?.value;
                const resolution = document.getElementById('resolve-resolution')?.value;
                await api.put(`/operations/exceptions/${r.id}`, {
                    status: 'completed',
                    root_cause: cause || undefined,
                    resolution: resolution || undefined,
                });
                message.success('处理完成');
                fetch();
            },
        });
    };
    const showTrace = (id) => {
        api.get('/audit-logs/trace', { record_type: 'exception_record', record_id: id }).then((r) => {
            setTrace(r.data);
            setTraceOpen(true);
        });
    };
    const showOriginal = async (r) => {
        if (!r.original_record_type || !r.original_record_id) {
            message.warning('该异常未关联原始记录');
            return;
        }
        try {
            const res = await api.get(`/operations/exceptions/${r.id}/original`);
            setOriginal(res.data);
            setOriginalOpen(true);
        }
        catch {
            message.error('获取原始记录失败');
        }
    };
    const columns = [
        {
            title: '类型', dataIndex: 'exception_type', width: 120,
            render: (v) => (_jsx(Tag, { color: EXCEPTION_COLORS[v], icon: EXCEPTION_ICONS[v], children: EXCEPTION_LABELS[v] })),
        },
        {
            title: '标题', dataIndex: 'title', width: 260,
            render: (v, r) => (_jsxs(Space, { children: [_jsx("a", { onClick: () => openModal('view', r), children: v }), r.original_record_type && (_jsx(Tooltip, { title: `关联${r.original_record_type}#${r.original_record_id}，点击查看原始数据`, children: _jsx(Button, { type: "link", size: "small", icon: _jsx(RollbackOutlined, {}), onClick: (e) => { e.stopPropagation(); showOriginal(r); }, children: "\u6EAF\u6E90" }) }))] })),
        },
        {
            title: '关联对象', width: 140,
            render: (_, r) => (r.related_type ? _jsxs(Tag, { children: [r.related_type, " #", r.related_id] }) : '-'),
        },
        {
            title: '状态', dataIndex: 'status', width: 100,
            render: (v) => (_jsx(Space, { children: _jsx(Badge, { status: v === 'completed' ? 'success' : v === 'cancelled' ? 'default' : v === 'rejected' ? 'error' : 'warning', text: _jsx(Tag, { color: STATUS_COLORS[v], style: { margin: 0 }, children: STATUS_LABELS[v] }) }) })),
        },
        {
            title: '发生时间', dataIndex: 'occurred_at', width: 160,
            render: (v) => v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '-',
        },
        {
            title: '处理时间', dataIndex: 'resolved_at', width: 160,
            render: (v) => v ? dayjs(v).format('YYYY-MM-DD HH:mm') : _jsx(Tag, { color: "warning", children: "\u5904\u7406\u4E2D" }),
        },
        {
            title: '创建', dataIndex: 'created_at', width: 140,
            render: (v) => dayjs(v).format('MM-DD HH:mm'),
        },
        {
            title: '操作', key: 'actions', width: 260, fixed: 'right',
            render: (_, r) => (_jsxs(Space, { size: "small", children: [_jsx(Button, { type: "link", size: "small", icon: _jsx(HistoryOutlined, {}), onClick: () => showTrace(r.id), children: "\u75D5\u8FF9" }), _jsx(Button, { type: "link", size: "small", onClick: () => openModal('view', r), children: "\u8BE6\u60C5" }), r.status !== 'completed' && r.status !== 'cancelled' && (_jsxs(_Fragment, { children: [_jsx(Button, { type: "link", size: "small", onClick: () => openModal('update', r), children: "\u66F4\u65B0" }), _jsx(Button, { size: "small", type: "primary", icon: _jsx(CheckCircleOutlined, {}), onClick: () => resolve(r), children: "\u5904\u7406\u5B8C\u6210" })] }))] })),
        },
    ];
    // 统计
    const pendingCount = data.filter((x) => x.status === 'pending').length;
    const perfCancelCount = data.filter((x) => x.exception_type === 'performance_cancel').length;
    const todayCount = data.filter((x) => dayjs(x.created_at).isSame(dayjs(), 'day')).length;
    return (_jsxs(Space, { direction: "vertical", size: "large", style: { width: '100%' }, children: [_jsx(Alert, { message: "\u5F02\u5E38\u5904\u7406\u8BF4\u660E", description: (_jsxs(Space, { direction: "vertical", size: 4, children: [_jsx(Text, { children: "1. \u6F14\u51FA\u53D6\u6D88\u7B49\u7279\u6B8A\u60C5\u51B5\u4F1A\u81EA\u52A8\u521B\u5EFA\u5F02\u5E38\u8BB0\u5F55\u5E76\u6807\u8BB0\u5173\u8054\uFF0C\u53EF\u4E00\u952E\"\u6EAF\u6E90\"\u67E5\u770B\u539F\u59CB\u6570\u636E" }), _jsx(Text, { children: "2. \u5904\u7406\u5B8C\u6210\u524D\u8BF7\u8865\u5145\u6839\u56E0\u5206\u6790\u548C\u89E3\u51B3\u65B9\u6848\uFF0C\u6240\u6709\u4FEE\u6539\u90FD\u4F1A\u8BB0\u5F55\u64CD\u4F5C\u75D5\u8FF9" })] })), type: "warning", showIcon: true, closable: true }), _jsxs(Row, { gutter: [16, 16], children: [_jsx(Col, { xs: 24, md: 6, children: _jsx(Card, { children: _jsx(Statistic, { title: "\u5F02\u5E38\u603B\u6570", value: total, prefix: _jsx(WarningOutlined, { style: { color: '#faad14' } }), valueStyle: { color: '#faad14' } }) }) }), _jsx(Col, { xs: 24, md: 6, children: _jsx(Card, { children: _jsx(Statistic, { title: "\u5F85\u5904\u7406", value: pendingCount, prefix: _jsx(Badge, { status: "warning" }), valueStyle: { color: '#fa8c16' } }) }) }), _jsx(Col, { xs: 24, md: 6, children: _jsx(Card, { children: _jsx(Statistic, { title: "\u6F14\u51FA\u53D6\u6D88", value: perfCancelCount, prefix: _jsx(CloseCircleOutlined, { style: { color: '#ff4d4f' } }), valueStyle: { color: '#ff4d4f' } }) }) }), _jsx(Col, { xs: 24, md: 6, children: _jsx(Card, { children: _jsx(Statistic, { title: "\u4ECA\u65E5\u65B0\u589E", value: todayCount, prefix: _jsx(ThunderboltOutlined, { style: { color: '#1677ff' } }), valueStyle: { color: '#1677ff' } }) }) })] }), _jsxs(Card, { styles: { body: { padding: 0 } }, children: [_jsxs("div", { style: { padding: '16px 24px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }, children: [_jsxs(Space, { wrap: true, children: [_jsx(Select, { placeholder: "\u5F02\u5E38\u7C7B\u578B", allowClear: true, style: { width: 160 }, onChange: (v) => { setFilters({ ...filters, exception_type: v }); setPage(1); }, children: Object.keys(EXCEPTION_LABELS).map((t) => (_jsx(Option, { value: t, children: EXCEPTION_LABELS[t] }, t))) }), _jsxs(Select, { placeholder: "\u5173\u8054\u7C7B\u578B", allowClear: true, style: { width: 150 }, onChange: (v) => { setFilters({ ...filters, related_type: v }); setPage(1); }, children: [_jsx(Option, { value: "performance_session", children: "\u6F14\u51FA\u573A\u6B21" }), _jsx(Option, { value: "guide_route", children: "\u5BFC\u89C8\u8DEF\u7EBF" }), _jsx(Option, { value: "heat_point", children: "\u70ED\u529B\u70B9\u4F4D" }), _jsx(Option, { value: "ticket", children: "\u7968\u52A1" })] }), _jsx(Select, { placeholder: "\u5904\u7406\u72B6\u6001", allowClear: true, style: { width: 140 }, onChange: (v) => { setFilters({ ...filters, status: v }); setPage(1); }, children: ['pending', 'approved', 'completed', 'cancelled', 'rejected'].map((s) => (_jsx(Option, { value: s, children: STATUS_LABELS[s] }, s))) }), _jsx(Button, { icon: _jsx(ReloadOutlined, {}), onClick: () => { setFilters({}); setPage(1); }, children: "\u91CD\u7F6E" })] }), _jsx(Button, { type: "primary", icon: _jsx(PlusOutlined, {}), onClick: () => openModal('create'), children: "\u65B0\u589E\u5F02\u5E38\u8BB0\u5F55" })] }), _jsx(Table, { rowKey: "id", loading: loading, dataSource: data, columns: columns, pagination: {
                            current: page, pageSize, total,
                            showSizeChanger: true, showQuickJumper: true,
                            showTotal: (t) => `共 ${t} 条`,
                            onChange: (p, ps) => { setPage(p); setPageSize(ps); },
                        }, scroll: { x: 1400 } })] }), _jsx(Modal, { title: modalMode === 'create'
                    ? '📝 新增异常记录'
                    : modalMode === 'update'
                        ? '✏️ 更新异常记录'
                        : '🔍 异常详情', open: modalOpen, onCancel: () => setModalOpen(false), onOk: modalMode === 'view' ? undefined : handleSubmit, okButtonProps: modalMode === 'view' ? { style: { display: 'none' } } : undefined, cancelText: modalMode === 'view' ? '关闭' : '取消', width: 720, destroyOnClose: true, children: modalMode === 'view' && current ? (_jsxs("div", { children: [_jsxs(Space, { style: { marginBottom: 16 }, children: [_jsx(Tag, { color: EXCEPTION_COLORS[current.exception_type], icon: EXCEPTION_ICONS[current.exception_type], children: EXCEPTION_LABELS[current.exception_type] }), _jsx(Badge, { status: current.status === 'completed' ? 'success' :
                                        current.status === 'pending' ? 'warning' :
                                            current.status === 'cancelled' ? 'default' : 'error', text: _jsx(Tag, { color: STATUS_COLORS[current.status], style: { margin: 0 }, children: STATUS_LABELS[current.status] }) }), current.original_record_type && (_jsxs(Button, { size: "small", icon: _jsx(RollbackOutlined, {}), onClick: () => showOriginal(current), children: ["\u67E5\u770B\u539F\u59CB\u8BB0\u5F55 (", current.original_record_type, "#", current.original_record_id, ")"] }))] }), _jsx(Title, { level: 4, style: { margin: 0 }, children: current.title }), _jsxs(Descriptions, { bordered: true, size: "small", column: 2, style: { marginTop: 16 }, children: [_jsx(Descriptions.Item, { label: "\u5173\u8054\u5BF9\u8C61", children: current.related_type ? `${current.related_type} #${current.related_id}` : '-' }), _jsx(Descriptions.Item, { label: "\u53D1\u751F\u65F6\u95F4", children: current.occurred_at ? dayjs(current.occurred_at).format('YYYY-MM-DD HH:mm') : '-' }), _jsx(Descriptions.Item, { label: "\u5904\u7406\u4EBA", children: current.handled_by ? `用户#${current.handled_by}` : '-' }), _jsx(Descriptions.Item, { label: "\u89E3\u51B3\u65F6\u95F4", children: current.resolved_at ? dayjs(current.resolved_at).format('YYYY-MM-DD HH:mm') : '-' }), _jsx(Descriptions.Item, { label: "\u521B\u5EFA\u4EBA", children: current.created_by ? `用户#${current.created_by}` : '-' }), _jsx(Descriptions.Item, { label: "\u521B\u5EFA\u65F6\u95F4", children: dayjs(current.created_at).format('YYYY-MM-DD HH:mm') })] }), _jsx(Divider, { orientation: "left", children: "\u63CF\u8FF0" }), _jsx(Paragraph, { style: { whiteSpace: 'pre-wrap' }, children: current.description || _jsx(Text, { type: "secondary", children: "\u65E0" }) }), current.root_cause && (_jsxs(_Fragment, { children: [_jsx(Divider, { orientation: "left", children: "\u6839\u56E0\u5206\u6790" }), _jsx(Paragraph, { style: { whiteSpace: 'pre-wrap', background: '#fffbe6', padding: 12, borderRadius: 4 }, children: current.root_cause })] })), current.resolution && (_jsxs(_Fragment, { children: [_jsx(Divider, { orientation: "left", children: "\u5904\u7406\u65B9\u6848\u4E0E\u7ED3\u679C" }), _jsx(Paragraph, { style: { whiteSpace: 'pre-wrap', background: '#f6ffed', padding: 12, borderRadius: 4 }, children: current.resolution })] }))] })) : (_jsxs(Form, { form: form, layout: "vertical", children: [_jsx(Form.Item, { label: "\u5F02\u5E38\u7C7B\u578B", name: "exception_type", rules: [{ required: true }], children: _jsx(Select, { children: Object.keys(EXCEPTION_LABELS).map((t) => (_jsx(Option, { value: t, children: EXCEPTION_LABELS[t] }, t))) }) }), _jsx(Form.Item, { label: "\u6807\u9898", name: "title", rules: [{ required: true }], children: _jsx(Input, { placeholder: "\u7B80\u660E\u63CF\u8FF0\u95EE\u9898\uFF0C\u5982\uFF1A10:00\u573A\u6B21\u4E34\u65F6\u53D6\u6D88" }) }), _jsxs(Row, { gutter: 12, children: [_jsx(Col, { span: 12, children: _jsx(Form.Item, { label: "\u5173\u8054\u7C7B\u578B", name: "related_type", children: _jsxs(Select, { allowClear: true, placeholder: "\u5982\u6F14\u51FA\u573A\u6B21/\u5BFC\u89C8\u8DEF\u7EBF\u7B49", children: [_jsx(Option, { value: "performance_session", children: "\u6F14\u51FA\u573A\u6B21" }), _jsx(Option, { value: "guide_route", children: "\u5BFC\u89C8\u8DEF\u7EBF" }), _jsx(Option, { value: "heat_point", children: "\u70ED\u529B\u70B9\u4F4D" }), _jsx(Option, { value: "ticket", children: "\u7968\u52A1" }), _jsx(Option, { value: "guide_content", children: "\u5BFC\u89C8\u5185\u5BB9" }), _jsx(Option, { value: "seat", children: "\u5EA7\u4F4D" }), _jsx(Option, { value: "merchant_contract", children: "\u5546\u6237\u5408\u540C" })] }) }) }), _jsx(Col, { span: 12, children: _jsx(Form.Item, { label: "\u5173\u8054ID", name: "related_id", children: _jsx(Input, { type: "number", placeholder: "\u8F93\u5165\u5BF9\u5E94\u8BB0\u5F55ID" }) }) })] }), _jsxs(Row, { gutter: 12, children: [_jsx(Col, { span: 12, children: _jsx(Form.Item, { label: "\u539F\u59CB\u8BB0\u5F55\u7C7B\u578B", name: "original_record_type", children: _jsxs(Select, { allowClear: true, placeholder: "\u7528\u4E8E\u6EAF\u6E90", children: [_jsx(Option, { value: "performance_session", children: "\u6F14\u51FA\u573A\u6B21" }), _jsx(Option, { value: "guide_route", children: "\u5BFC\u89C8\u8DEF\u7EBF" }), _jsx(Option, { value: "ticket", children: "\u7968\u52A1" })] }) }) }), _jsx(Col, { span: 12, children: _jsx(Form.Item, { label: "\u539F\u59CB\u8BB0\u5F55ID", name: "original_record_id", children: _jsx(Input, { type: "number" }) }) })] }), modalMode === 'update' && (_jsx(Row, { gutter: 12, children: _jsx(Col, { span: 12, children: _jsx(Form.Item, { label: "\u72B6\u6001", name: "status", initialValue: "pending", children: _jsx(Select, { children: ['pending', 'approved', 'completed', 'rejected', 'cancelled'].map((s) => (_jsx(Option, { value: s, children: STATUS_LABELS[s] }, s))) }) }) }) })), _jsx(Form.Item, { label: "\u95EE\u9898\u63CF\u8FF0", name: "description", children: _jsx(TextArea, { rows: 4, placeholder: "\u8BE6\u7EC6\u63CF\u8FF0\u53D1\u751F\u4E86\u4EC0\u4E48\uFF0C\u5F71\u54CD\u54EA\u4E9B\u7528\u6237\u7B49" }) }), modalMode === 'update' && (_jsxs(_Fragment, { children: [_jsx(Form.Item, { label: "\u6839\u56E0\u5206\u6790", name: "root_cause", children: _jsx(TextArea, { rows: 3 }) }), _jsx(Form.Item, { label: "\u5904\u7406\u65B9\u6848", name: "resolution", children: _jsx(TextArea, { rows: 4 }) })] }))] })) }), _jsx(Drawer, { title: "\uD83D\uDD0D \u6EAF\u6E90\uFF1A\u67E5\u770B\u539F\u59CB\u8BB0\u5F55", open: originalOpen, onClose: () => setOriginalOpen(false), width: 640, children: original && original.has_original ? (_jsxs("div", { children: [_jsx(Alert, { message: `记录类型: ${original.record_type} #${original.record_id}`, type: "info", showIcon: true, style: { marginBottom: 16 } }), _jsx(Descriptions, { bordered: true, size: "small", column: 1, children: original.data ? Object.entries(original.data).map(([k, v]) => (_jsx(Descriptions.Item, { label: k, children: String(v || '-') }, k))) : null })] })) : (_jsx(Alert, { message: "\u672A\u5173\u8054\u539F\u59CB\u8BB0\u5F55", type: "info", showIcon: true })) }), _jsx(Drawer, { title: "\u5904\u7406\u75D5\u8FF9", open: traceOpen, onClose: () => setTraceOpen(false), width: 600, children: _jsx(Timeline, { items: trace.map((t) => ({
                        color: t.action === 'create' ? 'orange' : t.action === 'approve' ? 'green' : t.action === 'cancel' ? 'red' : 'blue',
                        children: (_jsxs("div", { style: { marginBottom: 12 }, children: [_jsxs(Space, { children: [_jsx(Tag, { children: t.action }), _jsx("b", { children: t.user_name || '系统' }), _jsx("span", { style: { color: '#999' }, children: dayjs(t.at).format('MM-DD HH:mm') })] }), t.field && (_jsxs("div", { style: { marginTop: 6, padding: 8, background: '#fafafa', borderRadius: 4 }, children: [_jsxs("div", { children: ["\u5B57\u6BB5\uFF1A", t.field] }), t.old && _jsxs("div", { style: { color: '#f00' }, children: ["\u539F: ", t.old] }), t.new && _jsxs("div", { style: { color: '#0a0' }, children: ["\u65B0: ", t.new] })] })), t.remarks && _jsx("div", { style: { marginTop: 4 }, children: t.remarks })] })),
                    })) }) })] }));
}
