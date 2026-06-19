import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Table, Tag, Button, Space, Input, Select, Form, Modal, Drawer, Descriptions, App as AntdApp, Tooltip, Typography, Timeline, } from 'antd';
import { PlusOutlined, SearchOutlined, ReloadOutlined, EditOutlined, CheckCircleOutlined, HistoryOutlined } from '@ant-design/icons';
import { useAuth } from '../store/auth';
import { api } from '../api';
import { STATUS_COLORS, STATUS_LABELS } from '../types';
import dayjs from 'dayjs';
const { Option } = Select;
const { TextArea } = Input;
const { Text } = Typography;
export function buildCRUD(opts) {
    const { message, modal } = AntdApp.useApp();
    const { hasRole } = useAuth();
    const [form] = Form.useForm();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [search, setSearch] = useState({});
    const [modalType, setModalType] = useState(null);
    const [current, setCurrent] = useState(null);
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const [trace, setTrace] = useState([]);
    const canEdit = !opts.role || (Array.isArray(opts.role) ? opts.role.some(r => hasRole(r)) : hasRole(opts.role));
    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await api.get(opts.baseUrl, {
                page, page_size: pageSize, ...search,
            });
            setData(res.data.items || []);
            setTotal(res.data.total || 0);
        }
        finally {
            setLoading(false);
        }
    };
    const openModal = (type, record) => {
        setCurrent(record || null);
        setModalType(type);
        if (type === 'update' && record) {
            form.setFieldsValue(record);
        }
        else if (type === 'create') {
            form.resetFields();
        }
        if (type === 'trace' && record && opts.auditType) {
            api.get('/audit-logs/trace', {
                record_type: opts.auditType,
                record_id: record.id,
            }).then(r => setTrace(r.data));
        }
    };
    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            if (modalType === 'create') {
                await api.post(opts.baseUrl, values);
                message.success('创建成功');
            }
            else if (modalType === 'update' && current) {
                await api.put(`${opts.baseUrl}/${current.id}`, values);
                message.success('更新成功');
            }
            setModalType(null);
            fetchData();
        }
        catch (e) { /* handled */ }
    };
    const handleVerify = async (record) => {
        if (!opts.verifyUrl)
            return;
        await api.post(opts.verifyUrl(record.id));
        message.success('复核完成');
        fetchData();
    };
    const handleDelete = async (record) => {
        const deleteFn = opts.deleteUrl;
        if (!deleteFn)
            return;
        modal.confirm({
            title: '确认删除？',
            content: `删除后不可恢复`,
            okButtonProps: { danger: true },
            onOk: async () => {
                await api.delete(deleteFn(record.id));
                message.success('删除成功');
                fetchData();
            },
        });
    };
    const handleBatchUpdate = async () => {
        if (selectedRowKeys.length === 0)
            return;
        modal.confirm({
            title: `批量更新 ${selectedRowKeys.length} 条${opts.name}`,
            content: (_jsx(Form, { layout: "vertical", id: "batch-form", children: _jsx(Form.Item, { label: "\u72B6\u6001", children: _jsx(Select, { id: "batch-status", allowClear: true, placeholder: "\u9009\u62E9\u8981\u7EDF\u4E00\u8BBE\u7F6E\u7684\u72B6\u6001", style: { width: '100%' }, options: [
                            { label: '草稿', value: 'draft' },
                            { label: '待审核', value: 'pending' },
                            { label: '已通过', value: 'approved' },
                            { label: '已取消', value: 'cancelled' },
                            { label: '已完成', value: 'completed' },
                        ] }) }) })),
            onOk: async () => {
                const status = document.getElementById('batch-status')?.value;
                const updates = {};
                if (status)
                    updates.status = status;
                if (Object.keys(updates).length === 0) {
                    message.warning('请至少设置一个字段');
                    return;
                }
                await api.post(opts.batchUrl || `${opts.baseUrl}/batch-update`, {
                    ids: selectedRowKeys.map(Number),
                    updates,
                    remarks: `批量更新${selectedRowKeys.length}条`,
                });
                message.success('批量任务已提交');
                setSelectedRowKeys([]);
                fetchData();
            },
        });
    };
    const StatusTag = (v) => (_jsx(Tag, { color: STATUS_COLORS[v], children: STATUS_LABELS[v] || v }));
    const searchFields = opts.columns.filter(c => c.searchable);
    const columns = [
        ...opts.columns.map(c => ({
            title: c.title,
            dataIndex: c.dataIndex,
            key: c.key,
            width: c.width,
            render: (v, rec, i) => {
                if (c.render)
                    return c.render(v, rec, i);
                if (opts.statusKey && c.key === opts.statusKey)
                    return StatusTag(v);
                if (typeof v === 'string' && v.includes('T'))
                    return dayjs(v).format('YYYY-MM-DD HH:mm');
                return v;
            },
        })),
        {
            title: '操作',
            key: 'actions',
            width: 200,
            fixed: 'right',
            render: (_, rec) => (_jsxs(Space, { size: "small", children: [_jsx(Button, { type: "link", size: "small", icon: _jsx(HistoryOutlined, {}), onClick: () => openModal('trace', rec), children: "\u75D5\u8FF9" }), _jsx(Button, { type: "link", size: "small", onClick: () => openModal('view', rec), children: "\u67E5\u770B" }), canEdit && (_jsx(Button, { type: "link", size: "small", icon: _jsx(EditOutlined, {}), onClick: () => openModal('update', rec), children: "\u7F16\u8F91" })), opts.verifyUrl && canEdit && rec.status !== 'approved' && (_jsx(Button, { type: "link", size: "small", icon: _jsx(CheckCircleOutlined, {}), onClick: () => handleVerify(rec), children: "\u590D\u6838" }))] })),
        },
    ];
    return {
        renderPage: () => (_jsxs(Space, { direction: "vertical", size: "large", style: { width: '100%' }, children: [_jsxs(Space, { style: { justifyContent: 'space-between', width: '100%' }, children: [_jsxs(Space, { wrap: true, children: [searchFields.map(c => (c.searchType === 'select' ? (_jsx(Select, { placeholder: c.title, allowClear: true, style: { width: 160 }, options: c.searchOptions, onChange: (v) => { setSearch({ ...search, [c.key]: v }); setPage(1); } }, c.key)) : (_jsx(Input, { prefix: _jsx(SearchOutlined, {}), placeholder: `搜索${c.title}`, allowClear: true, style: { width: 180 }, onPressEnter: (e) => { setSearch({ ...search, [c.key]: e.target.value }); setPage(1); } }, c.key)))), _jsx(Input, { placeholder: "\u5173\u952E\u8BCD\u641C\u7D22", prefix: _jsx(SearchOutlined, {}), allowClear: true, style: { width: 180 }, onPressEnter: (e) => { setSearch({ ...search, keyword: e.target.value }); setPage(1); } }), _jsx(Button, { icon: _jsx(ReloadOutlined, {}), onClick: () => { setSearch({}); setPage(1); fetchData(); }, children: "\u91CD\u7F6E" })] }), _jsxs(Space, { children: [canEdit && opts.batchUrl !== null && selectedRowKeys.length > 0 && (_jsx(Tooltip, { title: `批量更新 ${selectedRowKeys.length} 条`, children: _jsxs(Button, { type: "primary", ghost: true, onClick: handleBatchUpdate, children: ["\u6279\u91CF\u64CD\u4F5C (", selectedRowKeys.length, ")"] }) })), canEdit && (_jsxs(Button, { type: "primary", icon: _jsx(PlusOutlined, {}), onClick: () => openModal('create'), children: ["\u65B0\u5EFA", opts.name] }))] })] }), _jsx(Table, { rowKey: "id", loading: loading, dataSource: data, columns: columns, rowSelection: canEdit ? {
                        selectedRowKeys,
                        onChange: setSelectedRowKeys,
                    } : undefined, pagination: {
                        current: page, pageSize, total,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (t) => `共 ${t} 条`,
                        onChange: (p, ps) => { setPage(p); setPageSize(ps); },
                    }, scroll: { x: 1200 } }), _jsx(Modal, { title: modalType === 'create' ? `新建${opts.name}` : modalType === 'update' ? `编辑${opts.name}` : `查看${opts.name}`, open: modalType === 'create' || modalType === 'update' || modalType === 'view', onCancel: () => setModalType(null), onOk: handleSubmit, okButtonProps: modalType === 'view' ? { style: { display: 'none' } } : undefined, cancelText: modalType === 'view' ? '关闭' : '取消', okText: "\u63D0\u4EA4", width: 640, destroyOnClose: true, children: _jsx(Form, { form: form, layout: "vertical", disabled: modalType === 'view', initialValues: current || {}, children: opts.columns.filter(c => c.key !== 'id').map(c => (_jsx(Form.Item, { label: c.title, name: c.dataIndex, rules: c.key === opts.nameKey || c.key === 'code' ? [{ required: true }] : undefined, children: c.dataIndex === 'description' || c.dataIndex === 'content' || c.dataIndex === 'content_text' ? (_jsx(TextArea, { rows: 4 })) : (_jsx(Input, {})) }, c.key))) }) }), _jsx(Drawer, { title: "\u5904\u7406\u75D5\u8FF9", open: modalType === 'trace', onClose: () => setModalType(null), width: 640, children: _jsx(Timeline, { items: trace.map(t => ({
                            color: t.action === 'create' ? 'green' : t.action === 'delete' ? 'red' : 'blue',
                            children: (_jsxs(Space, { direction: "vertical", size: 0, style: { marginBottom: 12 }, children: [_jsxs(Space, { children: [_jsx(Tag, { children: t.action }), _jsx(Text, { strong: true, children: t.user_name || `用户#${t.user_id}` }), _jsx(Text, { type: "secondary", style: { fontSize: 12 }, children: dayjs(t.at).format('YYYY-MM-DD HH:mm:ss') })] }), t.field && (_jsxs(Descriptions, { column: 1, size: "small", style: { marginTop: 4 }, children: [_jsx(Descriptions.Item, { label: "\u5B57\u6BB5", children: t.field }), t.old && _jsx(Descriptions.Item, { label: "\u539F\u503C", children: _jsx(Text, { delete: true, type: "danger", children: t.old }) }), t.new && _jsx(Descriptions.Item, { label: "\u65B0\u503C", children: _jsx(Text, { strong: true, type: "success", children: t.new }) })] })), t.remarks && _jsx(Text, { type: "secondary", style: { fontSize: 12 }, children: t.remarks })] })),
                        })) }) })] })),
        fetchData,
    };
}
