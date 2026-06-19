import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { createLazyFileRoute } from '@tanstack/react-router';
import { Card, Table, Tag, Button, Space, Input, Select, Modal, Form, Drawer, Timeline, App as AntdApp, Row, Col, Statistic, DatePicker, InputNumber, Tabs, } from 'antd';
import { PlusOutlined, SearchOutlined, ReloadOutlined, HistoryOutlined, UserOutlined, CalendarOutlined, CloseCircleOutlined, } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import { api } from '../../../api';
import { STATUS_COLORS, STATUS_LABELS, ExceptionTypeEnum, } from '../../../types';
import dayjs from 'dayjs';
const { Option } = Select;
const { RangePicker } = DatePicker;
const { TextArea } = Input;
export const Route = createLazyFileRoute('/_layout/operations/performances')({
    component: PerformancesPage,
});
function PerformancesPage() {
    const { message, modal } = AntdApp.useApp();
    const [tab, setTab] = useState('performances');
    const [perfData, setPerfData] = useState([]);
    const [sessData, setSessData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [perfTotal, setPerfTotal] = useState(0);
    const [sessTotal, setSessTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalType, setModalType] = useState('perf');
    const [modalMode, setModalMode] = useState('create');
    const [current, setCurrent] = useState(null);
    const [form] = Form.useForm();
    const [traceOpen, setTraceOpen] = useState(false);
    const [trace, setTrace] = useState([]);
    const fetchPerf = () => {
        setLoading(true);
        api.get('/operations/performances', { page, page_size: pageSize }).then((r) => {
            setPerfData(r.data.items || []);
            setPerfTotal(r.data.total || 0);
            setLoading(false);
        });
    };
    const fetchSess = () => {
        setLoading(true);
        api.get('/operations/sessions', { page, page_size: pageSize }).then((r) => {
            setSessData(r.data.items || []);
            setSessTotal(r.data.total || 0);
            setLoading(false);
        });
    };
    useEffect(() => {
        if (tab === 'performances')
            fetchPerf();
        else
            fetchSess();
    }, [tab, page, pageSize]);
    const perfMap = Object.fromEntries(perfData.map((p) => [p.id, p.name]));
    const openModal = (type, mode, record) => {
        setModalType(type);
        setModalMode(mode);
        setCurrent(record || null);
        form.resetFields();
        if (record) {
            const data = { ...record };
            if (type === 'sess') {
                data.start_time = record.start_time ? dayjs(record.start_time) : null;
                data.end_time = record.end_time ? dayjs(record.end_time) : null;
            }
            form.setFieldsValue(data);
        }
        setModalOpen(true);
    };
    const handleSubmit = async () => {
        try {
            const v = await form.validateFields();
            const payload = { ...v };
            if (modalType === 'sess') {
                payload.start_time = v.start_time?.toISOString?.() || v.start_time;
                payload.end_time = v.end_time?.toISOString?.() || v.end_time;
            }
            if (modalMode === 'create') {
                await api.post(modalType === 'perf' ? '/operations/performances' : '/operations/sessions', payload);
                message.success('创建成功');
            }
            else if (modalMode === 'update' && current) {
                const url = modalType === 'perf'
                    ? `/operations/performances/${current.id}`
                    : `/operations/sessions/${current.id}`;
                await api.put(url, payload);
                message.success('更新成功');
            }
            setModalOpen(false);
            if (modalType === 'perf')
                fetchPerf();
            else
                fetchSess();
        }
        catch { }
    };
    const cancelSession = (s) => {
        modal.confirm({
            title: '取消演出场次？',
            content: '这将生成异常记录，并标记为"演出取消"',
            okButtonProps: { danger: true },
            onOk: async () => {
                await api.post('/operations/exceptions', {
                    exception_type: ExceptionTypeEnum.PERFORMANCE_CANCEL,
                    related_type: 'performance_session',
                    related_id: s.id,
                    title: `演出取消：${perfMap[s.performance_id] || s.performance_id} ${dayjs(s.start_time).format('MM-DD HH:mm')}`,
                    description: `原定于 ${dayjs(s.start_time).format('YYYY-MM-DD HH:mm')} 的演出场次被取消`,
                    status: 'pending',
                });
                message.success('已创建异常记录，场次状态已变更');
                fetchSess();
            },
        });
    };
    const showTrace = (type, id) => {
        api.get('/audit-logs/trace', { record_type: type, record_id: id }).then((r) => {
            setTrace(r.data);
            setTraceOpen(true);
        });
    };
    const perfColumns = [
        { title: 'ID', dataIndex: 'id', width: 70 },
        { title: '演出名称', dataIndex: 'name', width: 200, render: (v, r) => _jsx("a", { onClick: () => openModal('perf', 'update', r), children: v }) },
        { title: '编码', dataIndex: 'code', width: 140, render: (v) => _jsx(Tag, { children: v }) },
        { title: '场地', dataIndex: 'venue', width: 140, render: (v) => v || '-' },
        { title: '时长(分)', dataIndex: 'duration_minutes', width: 90 },
        { title: '创建时间', dataIndex: 'created_at', width: 160, render: (v) => dayjs(v).format('MM-DD HH:mm') },
        {
            title: '操作', key: 'actions', width: 220, fixed: 'right',
            render: (_, r) => (_jsxs(Space, { size: "small", children: [_jsx(Button, { type: "link", size: "small", icon: _jsx(HistoryOutlined, {}), onClick: () => showTrace('performance', r.id), children: "\u75D5\u8FF9" }), _jsx(Button, { type: "link", size: "small", onClick: () => { setTab('sessions'); }, children: "\u573A\u6B21" }), _jsx(Button, { type: "link", size: "small", onClick: () => openModal('perf', 'update', r), children: "\u7F16\u8F91" })] })),
        },
    ];
    const sessColumns = [
        { title: 'ID', dataIndex: 'id', width: 70 },
        { title: '演出', dataIndex: 'performance_id', width: 180, render: (v) => perfMap[v] || `演出#${v}` },
        { title: '开始时间', dataIndex: 'start_time', width: 160, render: (v) => dayjs(v).format('YYYY-MM-DD HH:mm') },
        { title: '结束时间', dataIndex: 'end_time', width: 160, render: (v) => v ? dayjs(v).format('MM-DD HH:mm') : '-' },
        { title: '总座位', dataIndex: 'total_seats', width: 90 },
        {
            title: '状态', dataIndex: 'status', width: 100,
            render: (v) => _jsx(Tag, { color: STATUS_COLORS[v], children: STATUS_LABELS[v] }),
        },
        { title: '创建', dataIndex: 'created_at', width: 140, render: (v) => dayjs(v).format('MM-DD HH:mm') },
        {
            title: '操作', key: 'actions', width: 280, fixed: 'right',
            render: (_, s) => (_jsxs(Space, { size: "small", children: [_jsx(Button, { type: "link", size: "small", icon: _jsx(HistoryOutlined, {}), onClick: () => showTrace('performance_session', s.id), children: "\u75D5\u8FF9" }), _jsx(Button, { type: "link", size: "small", onClick: () => window.location.href = '/operations/seats?sid=' + s.id, children: "\u5EA7\u4F4D" }), _jsx(Button, { type: "link", size: "small", onClick: () => openModal('sess', 'update', s), children: "\u7F16\u8F91" }), s.status !== 'cancelled' && (_jsx(Button, { type: "link", size: "small", danger: true, icon: _jsx(CloseCircleOutlined, {}), onClick: () => cancelSession(s), children: "\u53D6\u6D88" }))] })),
        },
    ];
    return (_jsxs(Space, { direction: "vertical", size: "large", style: { width: '100%' }, children: [_jsxs(Row, { gutter: [16, 16], children: [_jsx(Col, { xs: 24, md: 6, children: _jsx(Card, { children: _jsx(Statistic, { title: "\u6F14\u51FA\u9879\u76EE", value: perfTotal, prefix: _jsx(UserOutlined, { style: { color: '#13c2c2' } }), valueStyle: { color: '#13c2c2' } }) }) }), _jsx(Col, { xs: 24, md: 6, children: _jsx(Card, { children: _jsx(Statistic, { title: "\u573A\u6B21\u603B\u6570", value: sessTotal, prefix: _jsx(CalendarOutlined, { style: { color: '#1677ff' } }), valueStyle: { color: '#1677ff' } }) }) }), _jsx(Col, { xs: 24, md: 6, children: _jsx(Card, { children: _jsx(Statistic, { title: "\u5F85\u6F14\u51FA", value: sessData.filter((x) => x.status === 'pending' || x.status === 'approved').length, valueStyle: { color: '#faad14' } }) }) }), _jsx(Col, { xs: 24, md: 6, children: _jsx(Card, { children: _jsx(Statistic, { title: "\u5DF2\u53D6\u6D88", value: sessData.filter((x) => x.status === 'cancelled').length, valueStyle: { color: '#ff4d4f' } }) }) })] }), _jsxs(Card, { styles: { body: { padding: 0 } }, children: [_jsx(Tabs, { activeKey: tab, onChange: (k) => { setTab(k); setPage(1); }, style: { padding: '0 24px' }, items: [
                            { key: 'performances', label: '🎭 演出项目' },
                            { key: 'sessions', label: '📅 演出场次' },
                        ] }), _jsxs("div", { style: { padding: '0 24px 16px', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }, children: [_jsxs(Space, { wrap: true, children: [_jsx(Input, { prefix: _jsx(SearchOutlined, {}), placeholder: "\u641C\u7D22\u540D\u79F0/\u7F16\u7801", allowClear: true, style: { width: 180 } }), _jsx(Button, { icon: _jsx(ReloadOutlined, {}), onClick: () => tab === 'performances' ? fetchPerf() : fetchSess(), children: "\u5237\u65B0" })] }), _jsxs(Button, { type: "primary", icon: _jsx(PlusOutlined, {}), onClick: () => openModal(tab === 'performances' ? 'perf' : 'sess', 'create'), children: ["\u65B0\u5EFA", tab === 'performances' ? '演出' : '场次'] })] }), _jsx(Table, { rowKey: "id", loading: loading, dataSource: (tab === 'performances' ? perfData : sessData), columns: (tab === 'performances' ? perfColumns : sessColumns), pagination: {
                            current: page, pageSize, total: tab === 'performances' ? perfTotal : sessTotal,
                            showSizeChanger: true, showQuickJumper: true,
                            showTotal: (t) => `共 ${t} 条`,
                            onChange: (p, ps) => { setPage(p); setPageSize(ps); },
                        }, scroll: { x: 1200 } })] }), _jsx(Modal, { title: (modalType === 'perf' ? '演出项目' : '演出场次')
                    + (modalMode === 'create' ? ' · 新建' : ' · 编辑'), open: modalOpen, onCancel: () => setModalOpen(false), onOk: handleSubmit, width: 640, destroyOnClose: true, children: _jsx(Form, { form: form, layout: "vertical", children: modalType === 'perf' ? (_jsxs(_Fragment, { children: [_jsx(Form.Item, { label: "\u6F14\u51FA\u540D\u79F0", name: "name", rules: [{ required: true }], children: _jsx(Input, {}) }), _jsxs(Row, { gutter: 12, children: [_jsx(Col, { span: 12, children: _jsx(Form.Item, { label: "\u7F16\u7801", name: "code", rules: [{ required: true }], children: _jsx(Input, { placeholder: "PERF-001" }) }) }), _jsx(Col, { span: 12, children: _jsx(Form.Item, { label: "\u65F6\u957F(\u5206)", name: "duration_minutes", initialValue: 60, children: _jsx(InputNumber, { style: { width: '100%' } }) }) })] }), _jsx(Form.Item, { label: "\u573A\u5730", name: "venue", children: _jsx(Input, {}) }), _jsx(Form.Item, { label: "\u6F14\u51FA\u8BF4\u660E", name: "description", children: _jsx(TextArea, { rows: 3 }) })] })) : (_jsxs(_Fragment, { children: [_jsx(Form.Item, { label: "\u6240\u5C5E\u6F14\u51FA", name: "performance_id", rules: [{ required: true }], children: _jsx(Select, { placeholder: "\u9009\u62E9\u6F14\u51FA\u9879\u76EE", children: perfData.map((p) => _jsx(Option, { value: p.id, children: p.name }, p.id)) }) }), _jsxs(Row, { gutter: 12, children: [_jsx(Col, { span: 12, children: _jsx(Form.Item, { label: "\u5F00\u59CB\u65F6\u95F4", name: "start_time", rules: [{ required: true }], children: _jsx(DatePicker, { showTime: true, style: { width: '100%' } }) }) }), _jsx(Col, { span: 12, children: _jsx(Form.Item, { label: "\u7ED3\u675F\u65F6\u95F4", name: "end_time", children: _jsx(DatePicker, { showTime: true, style: { width: '100%' } }) }) })] }), _jsxs(Row, { gutter: 12, children: [_jsx(Col, { span: 12, children: _jsx(Form.Item, { label: "\u603B\u5EA7\u4F4D\u6570", name: "total_seats", initialValue: 0, children: _jsx(InputNumber, { style: { width: '100%' } }) }) }), _jsx(Col, { span: 12, children: _jsx(Form.Item, { label: "\u72B6\u6001", name: "status", initialValue: "pending", children: _jsx(Select, { children: ['pending', 'approved', 'cancelled', 'completed'].map((s) => (_jsx(Option, { value: s, children: STATUS_LABELS[s] }, s))) }) }) })] })] })) }) }), _jsx(Drawer, { title: "\u5904\u7406\u75D5\u8FF9", open: traceOpen, onClose: () => setTraceOpen(false), width: 600, children: _jsx(Timeline, { items: trace.map((t) => ({
                        color: t.action === 'create' ? 'green' : t.action === 'cancel' ? 'red' : 'blue',
                        children: (_jsxs("div", { style: { marginBottom: 12 }, children: [_jsxs(Space, { children: [_jsx(Tag, { children: t.action }), _jsx("b", { children: t.user_name || '系统' }), _jsx("span", { style: { color: '#999' }, children: dayjs(t.at).format('MM-DD HH:mm') })] }), t.field && (_jsxs("div", { style: { marginTop: 6 }, children: [_jsxs("div", { children: ["\u5B57\u6BB5\uFF1A", t.field] }), t.old && _jsxs("div", { style: { color: '#f00' }, children: ["\u539F: ", t.old] }), t.new && _jsxs("div", { style: { color: '#0a0' }, children: ["\u65B0: ", t.new] })] })), t.remarks && _jsx("div", { children: t.remarks })] })),
                    })) }) })] }));
}
