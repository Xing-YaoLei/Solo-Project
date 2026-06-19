import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { createLazyFileRoute } from '@tanstack/react-router';
import { Card, Table, Tag, Button, Space, Input, Select, Modal, Form, Descriptions, Drawer, Timeline, App as AntdApp, Tooltip, Row, Col, Statistic, Typography, } from 'antd';
import { PlusOutlined, SearchOutlined, ReloadOutlined, CheckCircleOutlined, HistoryOutlined, FileTextOutlined, EnvironmentOutlined, EnvironmentFilled, } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import { api } from '../../../api';
import { STATUS_COLORS, STATUS_LABELS } from '../../../types';
import dayjs from 'dayjs';
const { Option } = Select;
const { TextArea } = Input;
const { Title } = Typography;
export const Route = createLazyFileRoute('/_layout/guide/routes')({
    component: GuideRoutesPage,
});
function GuideRoutesPage() {
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
    const [traceTarget, setTraceTarget] = useState(null);
    const fetch = () => {
        setLoading(true);
        api.get('/guide/routes', { page, page_size: pageSize, ...filters }).then((r) => {
            setData(r.data.items || []);
            setTotal(r.data.total || 0);
            setLoading(false);
        }).catch(() => setLoading(false));
    };
    useEffect(fetch, [page, pageSize, filters]);
    const handleSubmit = async () => {
        try {
            const v = await form.validateFields();
            if (modalMode === 'create') {
                await api.post('/guide/routes', v);
                message.success('创建成功');
            }
            else if (modalMode === 'update' && current) {
                await api.put(`/guide/routes/${current.id}`, v);
                message.success('更新成功');
            }
            setModalOpen(false);
            fetch();
        }
        catch { }
    };
    const openModal = (mode, record) => {
        setModalMode(mode);
        setCurrent(record || null);
        form.resetFields();
        if (record)
            form.setFieldsValue(record);
        setModalOpen(true);
    };
    const showTrace = (type, id) => {
        api.get('/audit-logs/trace', { record_type: type, record_id: id }).then((r) => {
            setTrace(r.data);
            setTraceTarget({ type, id });
            setTraceOpen(true);
        });
    };
    const approve = (id) => {
        modal.confirm({
            title: '确认审核通过？',
            onOk: async () => {
                await api.post(`/guide/routes/${id}/approve`);
                message.success('审核通过');
                fetch();
            },
        });
    };
    const columns = [
        { title: 'ID', dataIndex: 'id', width: 70 },
        {
            title: '路线名称', dataIndex: 'name', width: 200,
            render: (v, r) => _jsx("a", { onClick: () => openModal('view', r), children: v }),
        },
        { title: '编码', dataIndex: 'code', width: 120, render: (v) => _jsx(Tag, { children: v }) },
        {
            title: '状态', dataIndex: 'status', width: 100,
            render: (v) => _jsx(Tag, { color: STATUS_COLORS[v], children: STATUS_LABELS[v] }),
        },
        { title: '时长(分)', dataIndex: 'duration_minutes', width: 90 },
        { title: '距离(米)', dataIndex: 'distance_meters', width: 100 },
        { title: '排序', dataIndex: 'sort_order', width: 70 },
        {
            title: '创建时间', dataIndex: 'created_at', width: 160,
            render: (v) => dayjs(v).format('MM-DD HH:mm'),
        },
        {
            title: '操作', key: 'actions', width: 260, fixed: 'right',
            render: (_, r) => (_jsxs(Space, { size: "small", children: [_jsx(Button, { type: "link", size: "small", icon: _jsx(HistoryOutlined, {}), onClick: () => showTrace('guide_route', r.id), children: "\u75D5\u8FF9" }), _jsx(Button, { type: "link", size: "small", onClick: () => openModal('view', r), children: "\u67E5\u770B" }), _jsx(Button, { type: "link", size: "small", onClick: () => openModal('update', r), children: "\u7F16\u8F91" }), r.status === 'pending' && (_jsx(Button, { type: "link", size: "small", icon: _jsx(CheckCircleOutlined, {}), onClick: () => approve(r.id), children: "\u901A\u8FC7" }))] })),
        },
    ];
    return (_jsxs(Space, { direction: "vertical", size: "large", style: { width: '100%' }, children: [_jsxs(Row, { gutter: [16, 16], children: [_jsx(Col, { xs: 24, md: 6, children: _jsx(Card, { children: _jsx(Statistic, { title: "\u8DEF\u7EBF\u603B\u6570", value: total, prefix: _jsx(EnvironmentOutlined, { style: { color: '#1677ff' } }), valueStyle: { color: '#1677ff' } }) }) }), _jsx(Col, { xs: 24, md: 6, children: _jsx(Card, { children: _jsx(Statistic, { title: "\u8349\u7A3F", value: data.filter((x) => x.status === 'draft').length, prefix: _jsx(FileTextOutlined, { style: { color: '#8c8c8c' } }) }) }) }), _jsx(Col, { xs: 24, md: 6, children: _jsx(Card, { children: _jsx(Statistic, { title: "\u5F85\u5BA1\u6838", value: data.filter((x) => x.status === 'pending').length, prefix: _jsx(EnvironmentFilled, { style: { color: '#faad14' } }), valueStyle: { color: '#faad14' } }) }) }), _jsx(Col, { xs: 24, md: 6, children: _jsx(Card, { children: _jsx(Statistic, { title: "\u5DF2\u53D1\u5E03", value: data.filter((x) => x.status === 'approved').length, prefix: _jsx(CheckCircleOutlined, { style: { color: '#52c41a' } }), valueStyle: { color: '#52c41a' } }) }) })] }), _jsxs(Card, { styles: { body: { padding: 0 } }, children: [_jsxs("div", { style: { padding: '16px 24px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }, children: [_jsxs(Space, { wrap: true, children: [_jsx(Select, { placeholder: "\u72B6\u6001", allowClear: true, style: { width: 140 }, onChange: (v) => { setFilters({ ...filters, status: v }); setPage(1); }, children: ['draft', 'pending', 'approved', 'rejected'].map((s) => (_jsx(Option, { value: s, children: STATUS_LABELS[s] }, s))) }), _jsx(Input, { prefix: _jsx(SearchOutlined, {}), placeholder: "\u540D\u79F0/\u7F16\u7801", allowClear: true, style: { width: 200 }, onPressEnter: (e) => { setFilters({ ...filters, keyword: e.target.value }); setPage(1); } }), _jsx(Button, { icon: _jsx(ReloadOutlined, {}), onClick: () => { setFilters({}); setPage(1); }, children: "\u91CD\u7F6E" })] }), _jsx(Space, { children: _jsx(Button, { type: "primary", icon: _jsx(PlusOutlined, {}), onClick: () => openModal('create'), children: "\u65B0\u5EFA\u8DEF\u7EBF" }) })] }), _jsx(Table, { rowKey: "id", loading: loading, dataSource: data, columns: columns, pagination: {
                            current: page, pageSize, total,
                            showSizeChanger: true, showQuickJumper: true,
                            showTotal: (t) => `共 ${t} 条`,
                            onChange: (p, ps) => { setPage(p); setPageSize(ps); },
                        }, scroll: { x: 1200 } })] }), _jsx(Modal, { title: modalMode === 'create' ? '新建导览路线' : modalMode === 'update' ? '编辑导览路线' : '路线详情', open: modalOpen, onCancel: () => setModalOpen(false), onOk: modalMode === 'view' ? undefined : handleSubmit, okButtonProps: modalMode === 'view' ? { style: { display: 'none' } } : undefined, cancelText: modalMode === 'view' ? '关闭' : '取消', width: 640, destroyOnClose: true, children: modalMode === 'view' && current ? (_jsxs(Descriptions, { column: 1, bordered: true, size: "small", children: [_jsx(Descriptions.Item, { label: "\u540D\u79F0", children: current.name }), _jsx(Descriptions.Item, { label: "\u7F16\u7801", children: current.code }), _jsx(Descriptions.Item, { label: "\u72B6\u6001", children: _jsx(Tag, { color: STATUS_COLORS[current.status], children: STATUS_LABELS[current.status] }) }), _jsxs(Descriptions.Item, { label: "\u65F6\u957F", children: [current.duration_minutes, " \u5206\u949F"] }), _jsxs(Descriptions.Item, { label: "\u8DDD\u79BB", children: [current.distance_meters, " \u7C73"] }), _jsx(Descriptions.Item, { label: "\u6392\u5E8F", children: current.sort_order }), _jsx(Descriptions.Item, { label: "\u63CF\u8FF0", children: current.description || '-' }), _jsx(Descriptions.Item, { label: "\u521B\u5EFA", children: dayjs(current.created_at).format('YYYY-MM-DD HH:mm') })] })) : (_jsxs(Form, { form: form, layout: "vertical", children: [_jsx(Form.Item, { label: "\u8DEF\u7EBF\u540D\u79F0", name: "name", rules: [{ required: true, message: '请输入名称' }], children: _jsx(Input, { placeholder: "\u4F8B\u5982\uFF1A\u7ECF\u5178\u4E00\u65E5\u6E38" }) }), _jsxs(Row, { gutter: 12, children: [_jsx(Col, { span: 12, children: _jsx(Form.Item, { label: "\u8DEF\u7EBF\u7F16\u7801", name: "code", rules: [{ required: true }], children: _jsx(Input, { placeholder: "ROUTE-001" }) }) }), _jsx(Col, { span: 6, children: _jsx(Form.Item, { label: "\u65F6\u957F(\u5206)", name: "duration_minutes", initialValue: 60, children: _jsx(Input, { type: "number" }) }) }), _jsx(Col, { span: 6, children: _jsx(Form.Item, { label: "\u8DDD\u79BB(\u7C73)", name: "distance_meters", initialValue: 0, children: _jsx(Input, { type: "number" }) }) })] }), _jsxs(Row, { gutter: 12, children: [_jsx(Col, { span: 12, children: _jsx(Form.Item, { label: "\u72B6\u6001", name: "status", initialValue: "draft", children: _jsx(Select, { children: ['draft', 'pending', 'approved'].map((s) => (_jsx(Option, { value: s, children: STATUS_LABELS[s] }, s))) }) }) }), _jsx(Col, { span: 12, children: _jsx(Form.Item, { label: "\u6392\u5E8F\u6743\u91CD", name: "sort_order", initialValue: 0, children: _jsx(Input, { type: "number" }) }) })] }), _jsx(Form.Item, { label: "\u5C01\u9762\u56FE URL", name: "cover_image", children: _jsx(Input, { placeholder: "https://..." }) }), _jsx(Form.Item, { label: "\u8DEF\u7EBF\u63CF\u8FF0", name: "description", children: _jsx(TextArea, { rows: 4 }) })] })) }), _jsxs(Drawer, { title: "\u5904\u7406\u75D5\u8FF9", open: traceOpen, onClose: () => setTraceOpen(false), width: 600, children: [_jsx(Tooltip, { title: `类型: ${traceTarget?.type} #${traceTarget?.id}`, children: _jsxs(Tag, { color: "blue", children: [traceTarget?.type, " #", traceTarget?.id] }) }), _jsx("div", { style: { marginTop: 16 }, children: _jsx(Timeline, { items: trace.map((t) => ({
                                color: t.action === 'create' ? 'green' : t.action === 'delete' ? 'red' : 'blue',
                                children: (_jsxs("div", { style: { marginBottom: 12 }, children: [_jsxs(Space, { children: [_jsx(Tag, { color: "processing", children: t.action }), _jsx("b", { children: t.user_name || `用户#${t.user_id}` }), _jsx("span", { style: { color: '#999', fontSize: 12 }, children: dayjs(t.at).format('YYYY-MM-DD HH:mm:ss') })] }), t.field && (_jsxs("div", { style: { marginTop: 6, padding: 8, background: '#fafafa', borderRadius: 4 }, children: [_jsxs("div", { children: [_jsx("b", { children: "\u5B57\u6BB5\uFF1A" }), t.field] }), t.old && _jsxs("div", { children: [_jsx("b", { children: "\u539F\u503C\uFF1A" }), _jsx("span", { style: { color: '#ff4d4f' }, children: t.old })] }), t.new && _jsxs("div", { children: [_jsx("b", { children: "\u65B0\u503C\uFF1A" }), _jsx("span", { style: { color: '#52c41a' }, children: t.new })] })] })), t.remarks && _jsx("div", { style: { color: '#666', marginTop: 4 }, children: t.remarks })] })),
                            })) }) })] })] }));
}
