import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { createLazyFileRoute } from '@tanstack/react-router';
import { Card, Table, Tag, Button, Space, Input, Select, Modal, Form, Drawer, Timeline, App as AntdApp, Row, Col, Statistic, InputNumber, Tooltip, Typography, Alert, } from 'antd';
import { PlusOutlined, SearchOutlined, ReloadOutlined, CheckCircleOutlined, HistoryOutlined, CheckSquareOutlined, FileTextOutlined, } from '@ant-design/icons';
import { useEffect, useState, useMemo } from 'react';
import { api } from '../../../api';
import { STATUS_LABELS } from '../../../types';
import dayjs from 'dayjs';
const { Option } = Select;
const { Title, Text } = Typography;
export const Route = createLazyFileRoute('/_layout/operations/seats')({
    component: SeatsPage,
});
function SeatsPage() {
    const { message, modal } = AntdApp.useApp();
    const [data, setData] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(50);
    const [filters, setFilters] = useState({});
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('single');
    const [current, setCurrent] = useState(null);
    const [form] = Form.useForm();
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const [traceOpen, setTraceOpen] = useState(false);
    const [trace, setTrace] = useState([]);
    useEffect(() => {
        api.get('/operations/sessions', { page_size: 200 }).then((r) => setSessions(r.data.items || []));
    }, []);
    const fetch = () => {
        setLoading(true);
        api.get('/operations/seats', { page, page_size: pageSize, ...filters }).then((r) => {
            setData(r.data.items || []);
            setTotal(r.data.total || 0);
            setLoading(false);
        }).catch(() => setLoading(false));
    };
    useEffect(fetch, [page, pageSize, filters]);
    const sessMap = useMemo(() => Object.fromEntries(sessions.map((s) => [s.id, `演出#${s.performance_id} · ${dayjs(s.start_time).format('MM-DD HH:mm')}`])), [sessions]);
    const handleSubmit = async () => {
        try {
            const v = await form.validateFields();
            if (modalMode === 'single') {
                if (!current) {
                    await api.post('/operations/seats', v);
                    message.success('添加成功');
                }
                else {
                    message.success('更新成功');
                }
            }
            else {
                await api.post('/operations/seats/batch-create', v);
                message.success('批量创建成功');
            }
            setModalOpen(false);
            fetch();
        }
        catch { }
    };
    const verify = async (id) => {
        await api.post(`/operations/seats/${id}/verify`);
        message.success('复核通过');
        fetch();
    };
    const showTrace = (id) => {
        api.get('/audit-logs/trace', { record_type: 'seat', record_id: id }).then((r) => {
            setTrace(r.data);
            setTraceOpen(true);
        });
    };
    const batchVerify = async () => {
        if (selectedRowKeys.length === 0)
            return;
        modal.confirm({
            title: `批量复核 ${selectedRowKeys.length} 个座位`,
            onOk: async () => {
                await api.post('/operations/seats/batch-update', {
                    ids: selectedRowKeys.map(Number),
                    updates: { is_verified: true },
                });
                message.success('批量任务已提交');
                setSelectedRowKeys([]);
                fetch();
            },
        });
    };
    const batchUpdate = () => {
        if (selectedRowKeys.length === 0)
            return;
        let updates = {};
        modal.confirm({
            title: `批量更新 ${selectedRowKeys.length} 个座位`,
            content: (_jsxs(Form, { layout: "vertical", children: [_jsx(Form.Item, { label: "\u533A\u57DF", children: _jsx(Input, { placeholder: "\u7EDF\u4E00\u8BBE\u7F6E\u533A\u57DF", allowClear: true, id: "batch-zone" }) }), _jsx(Form.Item, { label: "\u4EF7\u683C", children: _jsx(InputNumber, { style: { width: '100%' }, id: "batch-price", placeholder: "\u7EDF\u4E00\u4EF7\u683C" }) }), _jsx(Form.Item, { label: "\u53EF\u7528\u72B6\u6001", children: _jsx(Select, { allowClear: true, placeholder: "\u9009\u62E9\u53EF\u7528\u72B6\u6001", id: "batch-available", options: [{ label: '可用', value: true }, { label: '不可用', value: false }] }) })] })),
            onOk: async () => {
                const zone = document.getElementById('batch-zone')?.value;
                const priceEl = document.getElementById('batch-price');
                const price = priceEl ? parseFloat(priceEl.value) : NaN;
                const availableEl = document.getElementById('batch-available');
                const available = availableEl?.value;
                if (zone)
                    updates.zone = zone;
                if (!isNaN(price))
                    updates.price = price;
                if (available !== '' && available != null)
                    updates.is_available = available === 'true';
                if (Object.keys(updates).length === 0)
                    return Promise.reject();
                await api.post('/operations/seats/batch-update', {
                    ids: selectedRowKeys.map(Number), updates,
                });
                message.success('批量任务已提交');
                setSelectedRowKeys([]);
                fetch();
            },
        });
    };
    const groupedByRow = useMemo(() => {
        const m = new Map();
        data.forEach((s) => {
            if (!m.has(s.row))
                m.set(s.row, []);
            m.get(s.row).push(s);
        });
        const sortedKeys = Array.from(m.keys()).sort((a, b) => {
            const na = parseInt(a.replace(/\D/g, '')) || 0;
            const nb = parseInt(b.replace(/\D/g, '')) || 0;
            return na - nb;
        });
        return sortedKeys.map((k) => ({ row: k, seats: m.get(k).sort((a, b) => parseInt(a.number) - parseInt(b.number)) }));
    }, [data]);
    const seatCardColor = (s) => {
        if (!s.is_available)
            return '#8c8c8c';
        if (!s.is_verified)
            return '#faad14';
        return '#52c41a';
    };
    const columns = [
        { title: 'ID', dataIndex: 'id', width: 70 },
        { title: '场次', dataIndex: 'session_id', width: 160, render: (v) => sessMap[v] || `#${v}` },
        { title: '排', dataIndex: 'row', width: 80, render: (v) => _jsxs(Tag, { children: [v, "\u6392"] }) },
        { title: '号', dataIndex: 'number', width: 80, render: (v) => _jsxs(Tag, { color: "blue", children: [v, "\u53F7"] }) },
        { title: '区域', dataIndex: 'zone', width: 100, render: (v) => v ? _jsx(Tag, { color: "purple", children: v }) : '-' },
        { title: '价格', dataIndex: 'price', width: 90, render: (v) => `¥${v}` },
        {
            title: '可用', dataIndex: 'is_available', width: 80,
            render: (v) => _jsx(Tag, { color: v ? 'green' : 'default', children: v ? '是' : '否' }),
        },
        {
            title: '复核', dataIndex: 'is_verified', width: 80,
            render: (v) => v
                ? _jsxs(Tag, { color: "green", children: [_jsx(CheckCircleOutlined, {}), " \u5DF2\u590D"] })
                : _jsx(Tag, { color: "orange", children: "\u5F85\u590D" }),
        },
        { title: '复核时间', dataIndex: 'verified_at', width: 140, render: (v) => v ? dayjs(v).format('MM-DD HH:mm') : '-' },
        {
            title: '操作', key: 'actions', width: 220, fixed: 'right',
            render: (_, s) => (_jsxs(Space, { size: "small", children: [_jsx(Button, { type: "link", size: "small", icon: _jsx(HistoryOutlined, {}), onClick: () => showTrace(s.id), children: "\u75D5\u8FF9" }), !s.is_verified && (_jsx(Button, { type: "link", size: "small", icon: _jsx(CheckCircleOutlined, {}), onClick: () => verify(s.id), children: "\u590D\u6838" }))] })),
        },
    ];
    return (_jsxs(Space, { direction: "vertical", size: "large", style: { width: '100%' }, children: [_jsxs(Row, { gutter: [16, 16], children: [_jsx(Col, { xs: 24, md: 6, children: _jsx(Card, { children: _jsx(Statistic, { title: "\u5EA7\u4F4D\u603B\u6570", value: total, prefix: _jsx(FileTextOutlined, {}) }) }) }), _jsx(Col, { xs: 24, md: 6, children: _jsx(Card, { children: _jsx(Statistic, { title: "\u5DF2\u590D\u6838", value: data.filter((x) => x.is_verified).length, valueStyle: { color: '#52c41a' }, prefix: _jsx(CheckCircleOutlined, {}) }) }) }), _jsx(Col, { xs: 24, md: 6, children: _jsx(Card, { children: _jsx(Statistic, { title: "\u5F85\u590D\u6838", value: data.filter((x) => !x.is_verified).length, valueStyle: { color: '#faad14' } }) }) }), _jsx(Col, { xs: 24, md: 6, children: _jsx(Card, { children: _jsx(Statistic, { title: "\u4E0D\u53EF\u7528/\u5DF2\u552E", value: data.filter((x) => !x.is_available).length, valueStyle: { color: '#ff4d4f' } }) }) })] }), _jsx(Alert, { message: "\u6838\u5BF9\u63D0\u793A", description: "\u7EFF\u8272=\u5DF2\u590D\u6838\u4E14\u53EF\u7528 | \u9EC4\u8272=\u5F85\u590D\u6838 | \u7070\u8272=\u4E0D\u53EF\u7528/\u5DF2\u552E\u51FA\u3002\u6279\u91CF\u64CD\u4F5C\u8BF7\u5148\u52FE\u9009\u5EA7\u4F4D\u3002", type: "info", showIcon: true }), _jsxs(Card, { styles: { body: { padding: 0 } }, children: [_jsxs("div", { style: { padding: '16px 24px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }, children: [_jsxs(Space, { wrap: true, children: [_jsx(Select, { placeholder: "\u9009\u62E9\u573A\u6B21", allowClear: true, style: { width: 220 }, onChange: (v) => { setFilters({ ...filters, session_id: v }); setPage(1); }, children: sessions.map((s) => (_jsxs(Option, { value: s.id, children: [s.performance_id, " \u00B7 ", dayjs(s.start_time).format('MM-DD HH:mm'), s.status !== 'pending' ? ` (${STATUS_LABELS[s.status]})` : ''] }, s.id))) }), _jsx(Input, { prefix: _jsx(SearchOutlined, {}), placeholder: "\u533A\u57DF", allowClear: true, style: { width: 140 }, onPressEnter: (e) => { setFilters({ ...filters, zone: e.target.value }); setPage(1); } }), _jsxs(Select, { placeholder: "\u590D\u6838\u72B6\u6001", allowClear: true, style: { width: 130 }, onChange: (v) => { setFilters({ ...filters, is_verified: v }); setPage(1); }, children: [_jsx(Option, { value: true, children: "\u5DF2\u590D\u6838" }), _jsx(Option, { value: false, children: "\u5F85\u590D\u6838" })] }), _jsxs(Select, { placeholder: "\u53EF\u7528\u72B6\u6001", allowClear: true, style: { width: 130 }, onChange: (v) => { setFilters({ ...filters, is_available: v }); setPage(1); }, children: [_jsx(Option, { value: true, children: "\u53EF\u7528" }), _jsx(Option, { value: false, children: "\u4E0D\u53EF\u7528" })] }), _jsx(Button, { icon: _jsx(ReloadOutlined, {}), onClick: () => { setFilters({}); setPage(1); }, children: "\u91CD\u7F6E" })] }), _jsxs(Space, { children: [selectedRowKeys.length > 0 && (_jsxs(_Fragment, { children: [_jsx(Tooltip, { title: "\u6279\u91CF\u590D\u6838", children: _jsxs(Button, { icon: _jsx(CheckSquareOutlined, {}), onClick: batchVerify, children: ["\u6279\u91CF\u590D\u6838 (", selectedRowKeys.length, ")"] }) }), _jsx(Tooltip, { title: "\u6279\u91CF\u66F4\u65B0\u4EF7\u683C/\u533A\u57DF/\u72B6\u6001", children: _jsx(Button, { type: "primary", ghost: true, onClick: batchUpdate, children: "\u6279\u91CF\u66F4\u65B0" }) })] })), _jsx(Button, { type: "primary", ghost: true, icon: _jsx(PlusOutlined, {}), onClick: () => { setModalMode('single'); setCurrent(null); form.resetFields(); setModalOpen(true); }, children: "\u5355\u4E2A\u5F55\u5165" }), _jsx(Button, { type: "primary", icon: _jsx(PlusOutlined, {}), onClick: () => { setModalMode('batch'); form.resetFields(); setModalOpen(true); }, children: "\u6279\u91CF\u751F\u6210\u5EA7\u4F4D" })] })] }), filters.session_id && groupedByRow.length > 0 && (_jsxs("div", { style: { padding: 24, background: '#fafafa' }, children: [_jsx(Title, { level: 5, style: { marginBottom: 16 }, children: "\u5EA7\u4F4D\u77E9\u9635\u56FE" }), _jsx("div", { style: { overflowX: 'auto' }, children: groupedByRow.map((g) => (_jsxs("div", { style: { display: 'flex', alignItems: 'center', marginBottom: 6 }, children: [_jsxs("div", { style: { width: 50, textAlign: 'right', fontWeight: 600, color: '#666', marginRight: 12 }, children: [g.row, "\u6392"] }), _jsx("div", { style: { display: 'flex', gap: 4, flexWrap: 'wrap' }, children: g.seats.map((s) => (_jsx(Tooltip, { title: `${s.row}排${s.number}号 | ¥${s.price} | ${s.zone || '无区域'}`, children: _jsx("div", { onClick: () => {
                                                        const keys = [...selectedRowKeys];
                                                        const idx = keys.indexOf(s.id);
                                                        if (idx >= 0)
                                                            keys.splice(idx, 1);
                                                        else
                                                            keys.push(s.id);
                                                        setSelectedRowKeys(keys);
                                                    }, style: {
                                                        width: 36, height: 32,
                                                        border: `2px solid ${selectedRowKeys.includes(s.id) ? '#1677ff' : 'transparent'}`,
                                                        background: seatCardColor(s),
                                                        color: '#fff',
                                                        borderRadius: 4,
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        fontSize: 12, fontWeight: 600,
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s',
                                                    }, children: s.number }) }, s.id))) })] }, g.row))) }), _jsx("div", { style: { marginTop: 16 }, children: _jsxs(Space, { children: [_jsxs(Space, { children: [_jsx("span", { style: { display: 'inline-block', width: 14, height: 14, background: '#52c41a', borderRadius: 2 } }), "\u5DF2\u590D\u6838\u53EF\u7528"] }), _jsxs(Space, { children: [_jsx("span", { style: { display: 'inline-block', width: 14, height: 14, background: '#faad14', borderRadius: 2 } }), "\u5F85\u590D\u6838"] }), _jsxs(Space, { children: [_jsx("span", { style: { display: 'inline-block', width: 14, height: 14, background: '#8c8c8c', borderRadius: 2 } }), "\u4E0D\u53EF\u7528/\u5DF2\u552E"] }), _jsxs(Space, { children: [_jsx("span", { style: { display: 'inline-block', width: 14, height: 14, border: '2px solid #1677ff', borderRadius: 2 } }), "\u5DF2\u9009\u4E2D"] })] }) })] })), _jsx(Table, { rowKey: "id", loading: loading, dataSource: data, columns: columns, rowSelection: { selectedRowKeys, onChange: setSelectedRowKeys }, pagination: {
                            current: page, pageSize, total,
                            showSizeChanger: true, showQuickJumper: true,
                            showTotal: (t) => `共 ${t} 条`,
                            onChange: (p, ps) => { setPage(p); setPageSize(ps); },
                        }, scroll: { x: 1500 } })] }), _jsx(Modal, { title: modalMode === 'single' ? '单个座位录入' : '批量生成座位', open: modalOpen, onCancel: () => setModalOpen(false), onOk: handleSubmit, width: modalMode === 'single' ? 560 : 640, destroyOnClose: true, children: _jsxs(Form, { form: form, layout: "vertical", children: [_jsx(Form.Item, { label: "\u6240\u5C5E\u573A\u6B21", name: "session_id", rules: [{ required: true }], children: _jsx(Select, { placeholder: "\u9009\u62E9\u573A\u6B21", children: sessions.map((s) => (_jsxs(Option, { value: s.id, children: ["\u6F14\u51FA#", s.performance_id, " \u00B7 ", dayjs(s.start_time).format('MM-DD HH:mm')] }, s.id))) }) }), modalMode === 'single' ? (_jsxs(Row, { gutter: 12, children: [_jsx(Col, { span: 8, children: _jsx(Form.Item, { label: "\u6392\u53F7", name: "row", rules: [{ required: true }], children: _jsx(Input, { placeholder: "\u5982 A \u6216 1" }) }) }), _jsx(Col, { span: 8, children: _jsx(Form.Item, { label: "\u5EA7\u4F4D\u53F7", name: "number", rules: [{ required: true }], children: _jsx(Input, { placeholder: "\u5982 12" }) }) }), _jsx(Col, { span: 8, children: _jsx(Form.Item, { label: "\u4EF7\u683C", name: "price", initialValue: 0, children: _jsx(InputNumber, { style: { width: '100%' }, prefix: "\u00A5" }) }) }), _jsx(Col, { span: 24, children: _jsx(Form.Item, { label: "\u533A\u57DF", name: "zone", children: _jsx(Input, { placeholder: "VIP/\u666E\u901A/A\u533A..." }) }) })] })) : (_jsxs(Row, { gutter: 12, children: [_jsx(Col, { span: 14, children: _jsx(Form.Item, { label: "\u6392\u53F7\u5217\u8868", name: "rows", rules: [{ required: true }], children: _jsx(Select, { mode: "tags", placeholder: "\u8F93\u5165\u540E\u56DE\u8F66\u6DFB\u52A0\uFF0C\u5982 A,B,C \u6216 1,2,3,4,5", style: { width: '100%' }, tokenSeparators: [',', '，', ' '] }) }) }), _jsx(Col, { span: 10, children: _jsx(Form.Item, { label: "\u6BCF\u6392\u5EA7\u4F4D\u6570", name: "numbers_per_row", rules: [{ required: true }], initialValue: 20, children: _jsx(InputNumber, { style: { width: '100%' }, min: 1 }) }) }), _jsx(Col, { span: 12, children: _jsx(Form.Item, { label: "\u7EDF\u4E00\u4EF7\u683C", name: "price", initialValue: 0, children: _jsx(InputNumber, { style: { width: '100%' }, prefix: "\u00A5" }) }) }), _jsx(Col, { span: 12, children: _jsx(Form.Item, { label: "\u7EDF\u4E00\u533A\u57DF", name: "zone", children: _jsx(Input, { placeholder: "\u53EF\u9009" }) }) })] }))] }) }), _jsx(Drawer, { title: "\u5904\u7406\u75D5\u8FF9", open: traceOpen, onClose: () => setTraceOpen(false), width: 600, children: _jsx(Timeline, { items: trace.map((t) => ({
                        color: t.action === 'create' ? 'green' : t.action === 'verify' ? 'cyan' : t.action === 'batch_update' ? 'purple' : 'blue',
                        children: (_jsxs("div", { style: { marginBottom: 12 }, children: [_jsxs(Space, { children: [_jsx(Tag, { children: t.action }), _jsx("b", { children: t.user_name || '系统' }), _jsx("span", { style: { color: '#999' }, children: dayjs(t.at).format('MM-DD HH:mm') })] }), t.field && (_jsxs("div", { style: { marginTop: 6, padding: 8, background: '#fafafa', borderRadius: 4 }, children: [_jsxs("div", { children: ["\u5B57\u6BB5\uFF1A", t.field] }), t.old && _jsxs("div", { style: { color: '#f00' }, children: ["\u539F: ", t.old] }), t.new && _jsxs("div", { style: { color: '#0a0' }, children: ["\u65B0: ", t.new] })] })), t.remarks && _jsx("div", { style: { marginTop: 4 }, children: t.remarks })] })),
                    })) }) })] }));
}
