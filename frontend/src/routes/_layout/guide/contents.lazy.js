import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { createLazyFileRoute } from '@tanstack/react-router';
import { Card, Table, Tag, Button, Space, Input, Select, Modal, Form, Drawer, Timeline, App as AntdApp, Row, Col, Statistic, Tooltip, Radio, Upload, Empty, Typography, } from 'antd';
import { PlusOutlined, SearchOutlined, ReloadOutlined, CheckCircleOutlined, HistoryOutlined, PlayCircleOutlined, FileTextOutlined, PaperClipOutlined, AudioOutlined, VideoCameraOutlined, } from '@ant-design/icons';
import { useEffect, useState, useMemo } from 'react';
import { api } from '../../../api';
import { STATUS_COLORS, STATUS_LABELS } from '../../../types';
import dayjs from 'dayjs';
const { Option } = Select;
const { TextArea } = Input;
const { Title, Paragraph, Text } = Typography;
export const Route = createLazyFileRoute('/_layout/guide/contents')({
    component: GuideContentsPage,
});
function GuideContentsPage() {
    const { message, modal } = AntdApp.useApp();
    const [data, setData] = useState([]);
    const [routes, setRoutes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
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
        api.get('/guide/contents', { page, page_size: pageSize, ...filters }).then((r) => {
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
                await api.post('/guide/contents', v);
                message.success('创建成功');
            }
            else if (modalMode === 'update' && current) {
                await api.put(`/guide/contents/${current.id}`, v);
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
        await api.post(`/guide/contents/${id}/verify`);
        message.success('复核通过');
        fetch();
    };
    const showTrace = (id) => {
        api.get('/audit-logs/trace', { record_type: 'guide_content', record_id: id }).then((r) => {
            setTrace(r.data);
            setTraceOpen(true);
        });
    };
    const showAttachments = (id) => {
        api.get('/attachments', { record_type: 'guide_content', record_id: id }).then((r) => {
            setAttachList(r.data || []);
            setAttachTarget({ type: 'guide_content', id });
            setAttachOpen(true);
        });
    };
    const batchUpdate = () => {
        if (selectedRowKeys.length === 0)
            return;
        let newStatus = '';
        modal.confirm({
            title: `批量操作 ${selectedRowKeys.length} 条内容`,
            content: (_jsx(Form, { layout: "vertical", children: _jsx(Form.Item, { label: "\u7EDF\u4E00\u8BBE\u7F6E\u72B6\u6001", children: _jsx(Select, { placeholder: "\u9009\u62E9\u72B6\u6001", allowClear: true, onChange: (v) => { newStatus = v; }, options: [
                            { label: '草稿', value: 'draft' },
                            { label: '待审核', value: 'pending' },
                            { label: '已通过', value: 'approved' },
                        ] }) }) })),
            onOk: async () => {
                const updates = {};
                if (newStatus)
                    updates.status = newStatus;
                if (Object.keys(updates).length === 0)
                    return Promise.reject();
                await api.post('/guide/contents/batch-update', {
                    ids: selectedRowKeys.map(Number), updates,
                });
                message.success('批量任务已提交');
                setSelectedRowKeys([]);
                fetch();
            },
        });
    };
    const contentTypeIcon = (t) => {
        if (t === 'audio')
            return _jsx(AudioOutlined, { style: { color: '#1677ff' } });
        if (t === 'video')
            return _jsx(VideoCameraOutlined, { style: { color: '#eb2f96' } });
        return _jsx(FileTextOutlined, { style: { color: '#52c41a' } });
    };
    const columns = [
        { title: 'ID', dataIndex: 'id', width: 70 },
        {
            title: '标题', dataIndex: 'title', width: 220,
            render: (v, r) => (_jsxs(Space, { children: [contentTypeIcon(r.content_type), _jsx("a", { onClick: () => openModal('view', r), children: v })] })),
        },
        { title: '类型', dataIndex: 'content_type', width: 80, render: (v) => _jsx(Tag, { children: v }) },
        { title: '语言', dataIndex: 'language', width: 80, render: (v) => _jsx(Tag, { color: "blue", children: v }) },
        {
            title: '所属路线', dataIndex: 'route_id', width: 140,
            render: (v) => routeMap[v] || `#${v}`,
        },
        { title: '排序', dataIndex: 'sort_order', width: 70 },
        {
            title: '状态', dataIndex: 'status', width: 100,
            render: (v) => _jsx(Tag, { color: STATUS_COLORS[v], children: STATUS_LABELS[v] }),
        },
        {
            title: '复核时间', dataIndex: 'verified_at', width: 140,
            render: (v) => v ? dayjs(v).format('MM-DD HH:mm') : '-',
        },
        {
            title: '操作', key: 'actions', width: 280, fixed: 'right',
            render: (_, r) => (_jsxs(Space, { size: "small", children: [_jsx(Button, { type: "link", size: "small", icon: _jsx(HistoryOutlined, {}), onClick: () => showTrace(r.id), children: "\u75D5\u8FF9" }), _jsx(Button, { type: "link", size: "small", icon: _jsx(PaperClipOutlined, {}), onClick: () => showAttachments(r.id), children: "\u9644\u4EF6" }), _jsx(Button, { type: "link", size: "small", onClick: () => openModal('update', r), children: "\u7F16\u8F91" }), r.status !== 'approved' && (_jsx(Button, { type: "link", size: "small", icon: _jsx(CheckCircleOutlined, {}), onClick: () => verify(r.id), children: "\u590D\u6838" }))] })),
        },
    ];
    const uploadProps = {
        name: 'files',
        multiple: true,
        action: '/api/v1/attachments/upload',
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token') || ''}` },
        data: () => ({ record_type: attachTarget?.type, record_id: attachTarget?.id }),
        onChange: (info) => {
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
    return (_jsxs(Space, { direction: "vertical", size: "large", style: { width: '100%' }, children: [_jsxs(Row, { gutter: [16, 16], children: [_jsx(Col, { xs: 24, md: 6, children: _jsx(Card, { children: _jsx(Statistic, { title: "\u5185\u5BB9\u603B\u6570", value: total, prefix: _jsx(PlayCircleOutlined, {}) }) }) }), _jsx(Col, { xs: 24, md: 6, children: _jsx(Card, { children: _jsx(Statistic, { title: "\u5F85\u590D\u6838", value: data.filter((x) => x.status === 'pending').length, valueStyle: { color: '#faad14' } }) }) }), _jsx(Col, { xs: 24, md: 6, children: _jsx(Card, { children: _jsx(Statistic, { title: "\u5DF2\u590D\u6838", value: data.filter((x) => x.status === 'approved').length, valueStyle: { color: '#52c41a' } }) }) }), _jsx(Col, { xs: 24, md: 6, children: _jsx(Card, { children: _jsx(Statistic, { title: "\u6240\u5C5E\u8DEF\u7EBF", value: new Set(data.map((x) => x.route_id)).size, valueStyle: { color: '#722ed1' } }) }) })] }), _jsxs(Card, { styles: { body: { padding: 0 } }, children: [_jsxs("div", { style: { padding: '16px 24px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }, children: [_jsxs(Space, { wrap: true, children: [_jsx(Select, { placeholder: "\u6240\u5C5E\u8DEF\u7EBF", allowClear: true, style: { width: 180 }, onChange: (v) => { setFilters({ ...filters, route_id: v }); setPage(1); }, children: routes.map((r) => _jsx(Option, { value: r.id, children: r.name }, r.id)) }), _jsxs(Select, { placeholder: "\u5185\u5BB9\u7C7B\u578B", allowClear: true, style: { width: 120 }, onChange: (v) => { setFilters({ ...filters, content_type: v }); setPage(1); }, children: [_jsx(Option, { value: "text", children: "\u6587\u672C" }), _jsx(Option, { value: "audio", children: "\u97F3\u9891" }), _jsx(Option, { value: "video", children: "\u89C6\u9891" })] }), _jsx(Select, { placeholder: "\u72B6\u6001", allowClear: true, style: { width: 140 }, onChange: (v) => { setFilters({ ...filters, status: v }); setPage(1); }, children: ['draft', 'pending', 'approved'].map((s) => _jsx(Option, { value: s, children: STATUS_LABELS[s] }, s)) }), _jsx(Input, { prefix: _jsx(SearchOutlined, {}), placeholder: "\u641C\u7D22\u6807\u9898", allowClear: true, style: { width: 180 }, onPressEnter: (e) => { setFilters({ ...filters, keyword: e.target.value }); setPage(1); } }), _jsx(Button, { icon: _jsx(ReloadOutlined, {}), onClick: () => { setFilters({}); setPage(1); }, children: "\u91CD\u7F6E" })] }), _jsxs(Space, { children: [selectedRowKeys.length > 0 && (_jsx(Tooltip, { title: `批量处理 ${selectedRowKeys.length} 条`, children: _jsxs(Button, { type: "primary", ghost: true, onClick: batchUpdate, children: ["\u6279\u91CF\u64CD\u4F5C (", selectedRowKeys.length, ")"] }) })), _jsx(Button, { type: "primary", icon: _jsx(PlusOutlined, {}), onClick: () => openModal('create'), children: "\u65B0\u5EFA\u5185\u5BB9" })] })] }), _jsx(Table, { rowKey: "id", loading: loading, dataSource: data, columns: columns, rowSelection: { selectedRowKeys, onChange: setSelectedRowKeys }, pagination: { current: page, pageSize, total, showSizeChanger: true, showQuickJumper: true, showTotal: (t) => `共 ${t} 条`, onChange: (p, ps) => { setPage(p); setPageSize(ps); } }, scroll: { x: 1300 } })] }), _jsx(Modal, { title: modalMode === 'create' ? '新建导览内容' : modalMode === 'update' ? '编辑导览内容' : '内容预览', open: modalOpen, onCancel: () => setModalOpen(false), onOk: modalMode === 'view' ? undefined : handleSubmit, okButtonProps: modalMode === 'view' ? { style: { display: 'none' } } : undefined, cancelText: modalMode === 'view' ? '关闭' : '取消', width: 720, destroyOnClose: true, children: modalMode === 'view' && current ? (_jsxs("div", { children: [_jsxs(Space, { style: { marginBottom: 16 }, children: [contentTypeIcon(current.content_type), _jsx(Tag, { color: "blue", children: current.language }), _jsx(Tag, { color: STATUS_COLORS[current.status], children: STATUS_LABELS[current.status] })] }), _jsx(Title, { level: 4, style: { margin: 0 }, children: current.title }), _jsxs("div", { style: { marginTop: 16 }, children: [current.content_text && _jsx(Paragraph, { style: { whiteSpace: 'pre-wrap', background: '#fafafa', padding: 16, borderRadius: 6 }, children: current.content_text }), current.audio_url && (_jsxs("div", { style: { marginTop: 12 }, children: [_jsx(Text, { type: "secondary", children: "\u97F3\u9891\uFF1A" }), _jsx("audio", { controls: true, src: current.audio_url, style: { width: '100%' } })] })), current.video_url && (_jsxs("div", { style: { marginTop: 12 }, children: [_jsx(Text, { type: "secondary", children: "\u89C6\u9891\uFF1A" }), _jsx("video", { controls: true, src: current.video_url, style: { width: '100%' } })] })), _jsxs("div", { style: { marginTop: 16, color: '#666' }, children: ["\u6240\u5C5E\u8DEF\u7EBF\uFF1A", routeMap[current.route_id] || `#${current.route_id}`, " \u00B7 \u6392\u5E8F\uFF1A", current.sort_order] })] })] })) : (_jsxs(Form, { form: form, layout: "vertical", children: [_jsx(Form.Item, { label: "\u6240\u5C5E\u8DEF\u7EBF", name: "route_id", rules: [{ required: true }], children: _jsx(Select, { children: routes.map((r) => _jsx(Option, { value: r.id, children: r.name }, r.id)) }) }), _jsxs(Row, { gutter: 12, children: [_jsx(Col, { span: 16, children: _jsx(Form.Item, { label: "\u6807\u9898", name: "title", rules: [{ required: true }], children: _jsx(Input, {}) }) }), _jsx(Col, { span: 4, children: _jsx(Form.Item, { label: "\u8BED\u8A00", name: "language", initialValue: "zh-CN", children: _jsxs(Select, { children: [_jsx(Option, { value: "zh-CN", children: "\u4E2D\u6587" }), _jsx(Option, { value: "en-US", children: "English" })] }) }) }), _jsx(Col, { span: 4, children: _jsx(Form.Item, { label: "\u6392\u5E8F", name: "sort_order", initialValue: 0, children: _jsx(Input, { type: "number" }) }) })] }), _jsxs(Row, { gutter: 12, children: [_jsx(Col, { span: 8, children: _jsx(Form.Item, { label: "\u5185\u5BB9\u7C7B\u578B", name: "content_type", initialValue: "text", children: _jsxs(Radio.Group, { children: [_jsx(Radio, { value: "text", children: "\u6587\u672C" }), _jsx(Radio, { value: "audio", children: "\u97F3\u9891" }), _jsx(Radio, { value: "video", children: "\u89C6\u9891" })] }) }) }), _jsx(Col, { span: 8, children: _jsx(Form.Item, { label: "\u72B6\u6001", name: "status", initialValue: "pending", children: _jsx(Select, { children: ['draft', 'pending', 'approved'].map((s) => _jsx(Option, { value: s, children: STATUS_LABELS[s] }, s)) }) }) })] }), _jsx(Form.Item, { noStyle: true, shouldUpdate: (prev, cur) => prev.content_type !== cur.content_type, children: ({ getFieldValue }) => {
                                const type = getFieldValue('content_type');
                                return (_jsxs(_Fragment, { children: [type === 'text' && (_jsx(Form.Item, { label: "\u6587\u672C\u5185\u5BB9", name: "content_text", children: _jsx(TextArea, { rows: 6 }) })), type === 'audio' && (_jsx(Form.Item, { label: "\u97F3\u9891URL", name: "audio_url", children: _jsx(Input, { placeholder: "https://...mp3" }) })), type === 'video' && (_jsx(Form.Item, { label: "\u89C6\u9891URL", name: "video_url", children: _jsx(Input, { placeholder: "https://...mp4" }) }))] }));
                            } })] })) }), _jsx(Drawer, { title: "\u5904\u7406\u75D5\u8FF9", open: traceOpen, onClose: () => setTraceOpen(false), width: 600, children: _jsx(Timeline, { items: trace.map((t) => ({
                        color: t.action === 'create' ? 'green' : t.action === 'verify' ? 'cyan' : 'blue',
                        children: (_jsxs("div", { style: { marginBottom: 12 }, children: [_jsxs(Space, { children: [_jsx(Tag, { children: t.action }), _jsx("b", { children: t.user_name || '系统' }), _jsx("span", { style: { color: '#999' }, children: dayjs(t.at).format('MM-DD HH:mm') })] }), t.field && (_jsxs("div", { style: { marginTop: 6, padding: 8, background: '#fafafa', borderRadius: 4 }, children: [_jsxs("div", { children: ["\u5B57\u6BB5\uFF1A", t.field] }), t.old && _jsxs("div", { style: { color: '#f00' }, children: ["\u539F: ", t.old] }), t.new && _jsxs("div", { style: { color: '#0a0' }, children: ["\u65B0: ", t.new] })] })), t.remarks && _jsx("div", { children: t.remarks })] })),
                    })) }) }), _jsxs(Drawer, { title: "\u9644\u4EF6\u7BA1\u7406", open: attachOpen, onClose: () => setAttachOpen(false), width: 500, children: [_jsx("div", { style: { marginBottom: 16 }, children: _jsxs(Upload.Dragger, { ...uploadProps, multiple: true, children: [_jsx("p", { className: "ant-upload-drag-icon", children: _jsx(PaperClipOutlined, { style: { fontSize: 36 } }) }), _jsx("p", { children: "\u70B9\u51FB\u6216\u62D6\u62FD\u6587\u4EF6\u5230\u6B64\u5904\u4E0A\u4F20" }), _jsx("p", { style: { color: '#999' }, children: "\u652F\u6301\u4EFB\u610F\u7C7B\u578B\u6587\u4EF6\u4E0A\u4F20" })] }) }), _jsxs("div", { style: { marginTop: 24 }, children: [_jsxs(Title, { level: 5, children: ["\u5DF2\u4E0A\u4F20 (", attachList.length, ")"] }), attachList.length === 0 ? (_jsx(Empty, { description: "\u6682\u65E0\u9644\u4EF6" })) : (_jsx(Space, { direction: "vertical", style: { width: '100%' }, children: attachList.map((a) => (_jsx(Card, { size: "small", children: _jsxs(Space, { style: { width: '100%' }, children: [_jsx(PaperClipOutlined, {}), _jsx("a", { href: `/api/v1/attachments/${a.id}/download`, download: true, children: a.original_name || a.file_name }), _jsxs(Tag, { children: [(a.file_size / 1024).toFixed(1), " KB"] }), _jsx("span", { style: { color: '#999' }, children: dayjs(a.created_at).format('MM-DD HH:mm') })] }) }, a.id))) }))] })] })] }));
}
