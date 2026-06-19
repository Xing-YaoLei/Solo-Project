import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { createLazyFileRoute } from '@tanstack/react-router';
import { Card, Table, Tag, Button, Space, Input, Select, Modal, Form, Drawer, Timeline, App as AntdApp, Row, Col, Upload, Statistic, Tooltip, InputNumber, } from 'antd';
import { PlusOutlined, SearchOutlined, ReloadOutlined, CheckCircleOutlined, HistoryOutlined, EnvironmentOutlined, FileExcelOutlined, PaperClipOutlined, } from '@ant-design/icons';
import { useEffect, useState, useMemo } from 'react';
import { api } from '../../../api';
import { STATUS_COLORS, STATUS_LABELS } from '../../../types';
import dayjs from 'dayjs';
const { Option } = Select;
const { TextArea } = Input;
export const Route = createLazyFileRoute('/_layout/guide/heat-points')({
    component: HeatPointsPage,
});
function HeatPointsPage() {
    const { message, modal } = AntdApp.useApp();
    const [data, setData] = useState([]);
    const [routes, setRoutes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(50);
    const [filters, setFilters] = useState({});
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('create');
    const [current, setCurrent] = useState(null);
    const [form] = Form.useForm();
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const [traceOpen, setTraceOpen] = useState(false);
    const [trace, setTrace] = useState([]);
    const [attachOpen, setAttachOpen] = useState(false);
    const [attachList, setAttachList] = useState([]);
    const [attachTarget, setAttachTarget] = useState(null);
    useEffect(() => {
        api.get('/guide/routes', { page_size: 200 }).then((r) => setRoutes(r.data.items || []));
    }, []);
    const fetch = () => {
        setLoading(true);
        api.get('/guide/heat-points', { page, page_size: pageSize, ...filters }).then((r) => {
            setData(r.data.items || []);
            setTotal(r.data.total || 0);
            setLoading(false);
        }).catch(() => setLoading(false));
    };
    useEffect(fetch, [page, pageSize, filters]);
    const routeMap = useMemo(() => Object.fromEntries(routes.map((r) => [r.id, r.name])), [routes]);
    const handleSubmit = async () => {
        try {
            const v = await form.validateFields();
            if (modalMode === 'create') {
                await api.post('/guide/heat-points', v);
                message.success('创建成功');
            }
            else if (modalMode === 'update' && current) {
                await api.put(`/guide/heat-points/${current.id}`, v);
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
    const verify = async (id) => {
        await api.post(`/guide/heat-points/${id}/verify`);
        message.success('复核通过');
        fetch();
    };
    const showTrace = (id) => {
        api.get('/audit-logs/trace', { record_type: 'heat_point', record_id: id }).then((r) => {
            setTrace(r.data);
            setTraceOpen(true);
        });
    };
    const showAttachments = (id) => {
        api.get('/attachments', { record_type: 'heat_point', record_id: id }).then((r) => {
            setAttachList(r.data || []);
            setAttachTarget({ type: 'heat_point', id });
            setAttachOpen(true);
        });
    };
    const batchUpdate = () => {
        if (selectedRowKeys.length === 0)
            return;
        let newStatus = '';
        modal.confirm({
            title: `批量操作 ${selectedRowKeys.length} 个点位`,
            content: (_jsx(Form, { layout: "vertical", children: _jsx(Form.Item, { label: "\u7EDF\u4E00\u8BBE\u7F6E\u72B6\u6001", children: _jsx(Select, { placeholder: "\u9009\u62E9\u72B6\u6001", allowClear: true, onChange: (v) => { newStatus = v; }, options: [
                            { label: '草稿', value: 'draft' },
                            { label: '待审核', value: 'pending' },
                            { label: '已通过', value: 'approved' },
                            { label: '已取消', value: 'cancelled' },
                        ] }) }) })),
            onOk: async () => {
                const updates = {};
                if (newStatus)
                    updates.status = newStatus;
                if (Object.keys(updates).length === 0) {
                    message.warning('请至少设置一个字段');
                    return Promise.reject();
                }
                await api.post('/guide/heat-points/batch-update', {
                    ids: selectedRowKeys.map(Number),
                    updates,
                });
                message.success('批量任务已提交，后台处理中');
                setSelectedRowKeys([]);
                fetch();
            },
        });
    };
    const uploadProps = {
        name: 'files',
        multiple: true,
        action: '/api/v1/attachments/upload',
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token') || ''}` },
        data: () => ({ record_type: attachTarget?.type, record_id: attachTarget?.id }),
        onChange(info) {
            if (info.file.status === 'done') {
                message.success(`${info.file.name} 上传成功`);
                if (attachTarget)
                    showAttachments(attachTarget.id);
            }
            else if (info.file.status === 'error') {
                message.error(`${info.file.name} 上传失败`);
            }
        },
    };
    const importProps = {
        name: 'file',
        showUploadList: false,
        action: '/api/v1/import/heat-points',
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token') || ''}` },
        data: () => ({ route_id: filters.route_id || 1 }),
        onChange(info) {
            if (info.file.status === 'done') {
                message.success('导入任务已提交');
                fetch();
            }
        },
    };
    const columns = [
        { title: 'ID', dataIndex: 'id', width: 70 },
        {
            title: '点位名称', dataIndex: 'name', width: 180,
            render: (v, r) => (_jsx("a", { onClick: () => openModal('update', r), children: v })),
        },
        { title: '编码', dataIndex: 'code', width: 110, render: (v) => v ? _jsx(Tag, { children: v }) : '-' },
        {
            title: '所属路线', dataIndex: 'route_id', width: 140,
            render: (v) => routeMap[v] || `路线#${v}`,
        },
        { title: '纬度', dataIndex: 'latitude', width: 100, render: (v) => v?.toFixed(5) },
        { title: '经度', dataIndex: 'longitude', width: 100, render: (v) => v?.toFixed(5) },
        { title: '半径(米)', dataIndex: 'radius_meters', width: 80 },
        { title: '排序', dataIndex: 'sort_order', width: 70 },
        {
            title: '状态', dataIndex: 'status', width: 100,
            render: (v) => _jsx(Tag, { color: STATUS_COLORS[v], children: STATUS_LABELS[v] }),
        },
        { title: '复核时间', dataIndex: 'verified_at', width: 140, render: (v) => v ? dayjs(v).format('MM-DD HH:mm') : '-' },
        {
            title: '操作', key: 'actions', width: 280, fixed: 'right',
            render: (_, r) => (_jsxs(Space, { size: "small", children: [_jsx(Button, { type: "link", size: "small", icon: _jsx(HistoryOutlined, {}), onClick: () => showTrace(r.id), children: "\u75D5\u8FF9" }), _jsx(Button, { type: "link", size: "small", icon: _jsx(PaperClipOutlined, {}), onClick: () => showAttachments(r.id), children: "\u9644\u4EF6" }), _jsx(Button, { type: "link", size: "small", onClick: () => openModal('update', r), children: "\u7F16\u8F91" }), r.status !== 'approved' && (_jsx(Button, { type: "link", size: "small", icon: _jsx(CheckCircleOutlined, {}), onClick: () => verify(r.id), children: "\u590D\u6838" }))] })),
        },
    ];
    return (_jsxs(Space, { direction: "vertical", size: "large", style: { width: '100%' }, children: [_jsxs(Row, { gutter: [16, 16], children: [_jsx(Col, { xs: 24, md: 6, children: _jsx(Card, { children: _jsx(Statistic, { title: "\u70B9\u4F4D\u603B\u6570", value: total, prefix: _jsx(EnvironmentOutlined, {}) }) }) }), _jsx(Col, { xs: 24, md: 6, children: _jsx(Card, { children: _jsx(Statistic, { title: "\u5F85\u590D\u6838", value: data.filter((x) => x.status === 'pending').length, valueStyle: { color: '#faad14' } }) }) }), _jsx(Col, { xs: 24, md: 6, children: _jsx(Card, { children: _jsx(Statistic, { title: "\u5DF2\u590D\u6838", value: data.filter((x) => x.status === 'approved').length, valueStyle: { color: '#52c41a' } }) }) }), _jsx(Col, { xs: 24, md: 6, children: _jsx(Card, { children: _jsx(Statistic, { title: "\u6240\u5C5E\u8DEF\u7EBF", value: new Set(data.map((x) => x.route_id)).size, valueStyle: { color: '#722ed1' } }) }) })] }), _jsxs(Card, { styles: { body: { padding: 0 } }, children: [_jsxs("div", { style: { padding: '16px 24px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }, children: [_jsxs(Space, { wrap: true, children: [_jsx(Select, { placeholder: "\u6240\u5C5E\u8DEF\u7EBF", allowClear: true, style: { width: 180 }, onChange: (v) => { setFilters({ ...filters, route_id: v }); setPage(1); }, children: routes.map((r) => (_jsx(Option, { value: r.id, children: r.name }, r.id))) }), _jsx(Select, { placeholder: "\u72B6\u6001", allowClear: true, style: { width: 140 }, onChange: (v) => { setFilters({ ...filters, status: v }); setPage(1); }, children: ['draft', 'pending', 'approved'].map((s) => (_jsx(Option, { value: s, children: STATUS_LABELS[s] }, s))) }), _jsx(Input, { prefix: _jsx(SearchOutlined, {}), placeholder: "\u540D\u79F0/\u7F16\u7801", allowClear: true, style: { width: 180 }, onPressEnter: (e) => { setFilters({ ...filters, keyword: e.target.value }); setPage(1); } }), _jsx(Button, { icon: _jsx(ReloadOutlined, {}), onClick: () => { setFilters({}); setPage(1); }, children: "\u91CD\u7F6E" })] }), _jsxs(Space, { children: [_jsx(Upload, { ...importProps, children: _jsx(Button, { icon: _jsx(FileExcelOutlined, {}), children: "CSV \u5BFC\u5165" }) }), selectedRowKeys.length > 0 && (_jsx(Tooltip, { title: `批量处理 ${selectedRowKeys.length} 条`, children: _jsxs(Button, { type: "primary", ghost: true, onClick: batchUpdate, children: ["\u6279\u91CF\u64CD\u4F5C (", selectedRowKeys.length, ")"] }) })), _jsx(Button, { type: "primary", icon: _jsx(PlusOutlined, {}), onClick: () => openModal('create'), children: "\u65B0\u589E\u70B9\u4F4D" })] })] }), _jsx(Table, { rowKey: "id", loading: loading, dataSource: data, columns: columns, rowSelection: { selectedRowKeys, onChange: setSelectedRowKeys }, pagination: {
                            current: page, pageSize, total,
                            showSizeChanger: true, showQuickJumper: true,
                            showTotal: (t) => `共 ${t} 条`,
                            onChange: (p, ps) => { setPage(p); setPageSize(ps); },
                        }, scroll: { x: 1400 } })] }), _jsx(Modal, { title: modalMode === 'create' ? '新增热力点位' : '编辑热力点位', open: modalOpen, onCancel: () => setModalOpen(false), onOk: handleSubmit, width: 640, destroyOnClose: true, children: _jsxs(Form, { form: form, layout: "vertical", children: [_jsx(Form.Item, { label: "\u6240\u5C5E\u8DEF\u7EBF", name: "route_id", rules: [{ required: true }], children: _jsx(Select, { placeholder: "\u9009\u62E9\u8DEF\u7EBF", children: routes.map((r) => (_jsx(Option, { value: r.id, children: r.name }, r.id))) }) }), _jsxs(Row, { gutter: 12, children: [_jsx(Col, { span: 16, children: _jsx(Form.Item, { label: "\u70B9\u4F4D\u540D\u79F0", name: "name", rules: [{ required: true }], children: _jsx(Input, {}) }) }), _jsx(Col, { span: 8, children: _jsx(Form.Item, { label: "\u70B9\u4F4D\u7F16\u7801", name: "code", children: _jsx(Input, {}) }) })] }), _jsxs(Row, { gutter: 12, children: [_jsx(Col, { span: 10, children: _jsx(Form.Item, { label: "\u7EAC\u5EA6", name: "latitude", rules: [{ required: true }], children: _jsx(InputNumber, { style: { width: '100%' }, step: 0.00001, precision: 6 }) }) }), _jsx(Col, { span: 10, children: _jsx(Form.Item, { label: "\u7ECF\u5EA6", name: "longitude", rules: [{ required: true }], children: _jsx(InputNumber, { style: { width: '100%' }, step: 0.00001, precision: 6 }) }) }), _jsx(Col, { span: 4, children: _jsx(Form.Item, { label: "\u534A\u5F84(\u7C73)", name: "radius_meters", initialValue: 50, children: _jsx(InputNumber, { style: { width: '100%' } }) }) })] }), _jsxs(Row, { gutter: 12, children: [_jsx(Col, { span: 12, children: _jsx(Form.Item, { label: "\u6392\u5E8F", name: "sort_order", initialValue: 0, children: _jsx(InputNumber, { style: { width: '100%' } }) }) }), _jsx(Col, { span: 12, children: _jsx(Form.Item, { label: "\u72B6\u6001", name: "status", initialValue: "pending", children: _jsx(Select, { children: ['draft', 'pending', 'approved'].map((s) => (_jsx(Option, { value: s, children: STATUS_LABELS[s] }, s))) }) }) })] }), _jsx(Form.Item, { label: "\u70B9\u4F4D\u63CF\u8FF0", name: "description", children: _jsx(TextArea, { rows: 3 }) })] }) }), _jsx(Drawer, { title: "\u5904\u7406\u75D5\u8FF9", open: traceOpen, onClose: () => setTraceOpen(false), width: 600, children: _jsx(Timeline, { items: trace.map((t) => ({
                        color: t.action === 'create' ? 'green' : t.action === 'verify' ? 'cyan' : 'blue',
                        children: (_jsxs("div", { style: { marginBottom: 12 }, children: [_jsxs(Space, { children: [_jsx(Tag, { children: t.action }), _jsx("b", { children: t.user_name || '系统' }), _jsx("span", { style: { color: '#999' }, children: dayjs(t.at).format('MM-DD HH:mm') })] }), t.field && (_jsxs("div", { style: { marginTop: 6 }, children: [_jsxs("div", { children: [_jsx("b", { children: "\u5B57\u6BB5" }), ": ", t.field] }), t.old && _jsxs("div", { style: { color: '#f00' }, children: ["\u539F: ", t.old] }), t.new && _jsxs("div", { style: { color: '#0a0' }, children: ["\u65B0: ", t.new] })] })), t.remarks && _jsx("div", { style: { color: '#666' }, children: t.remarks })] })),
                    })) }) }), _jsxs(Drawer, { title: "\u9644\u4EF6\u7BA1\u7406", open: attachOpen, onClose: () => setAttachOpen(false), width: 500, children: [_jsx("div", { style: { marginBottom: 16 }, children: _jsxs(Upload.Dragger, { ...uploadProps, multiple: true, children: [_jsx("p", { className: "ant-upload-drag-icon", children: _jsx(PaperClipOutlined, { style: { fontSize: 36 } }) }), _jsx("p", { children: "\u70B9\u51FB\u6216\u62D6\u62FD\u6587\u4EF6\u5230\u6B64\u5904\u4E0A\u4F20" }), _jsx("p", { style: { color: '#999' }, children: "\u652F\u6301\u4EFB\u610F\u7C7B\u578B\u6587\u4EF6\u4E0A\u4F20" })] }) }), _jsxs("div", { style: { marginTop: 24 }, children: [_jsxs("h5", { children: ["\u5DF2\u4E0A\u4F20 (", attachList.length, ")"] }), attachList.length === 0 ? (_jsx("span", { style: { color: '#999' }, children: "\u6682\u65E0\u9644\u4EF6" })) : (_jsx(Space, { direction: "vertical", style: { width: '100%' }, children: attachList.map((a) => (_jsx(Card, { size: "small", children: _jsxs(Space, { style: { width: '100%' }, children: [_jsx(PaperClipOutlined, {}), _jsx("a", { href: `/api/v1/attachments/${a.id}/download`, download: true, children: a.original_name || a.file_name }), _jsxs(Tag, { children: [(a.file_size / 1024).toFixed(1), " KB"] }), _jsx("span", { style: { color: '#999' }, children: dayjs(a.created_at).format('MM-DD HH:mm') })] }) }, a.id))) }))] })] })] }));
}
