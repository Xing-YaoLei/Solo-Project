import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { createLazyFileRoute } from '@tanstack/react-router';
import { Card, Table, Tag, Button, Space, Input, Select, Modal, Form, Drawer, Timeline, App as AntdApp, Row, Col, Statistic, Tooltip, Upload, Empty, Divider, Tabs, DatePicker, InputNumber, Typography, Descriptions, } from 'antd';
import { PlusOutlined, SearchOutlined, ReloadOutlined, CheckCircleOutlined, HistoryOutlined, ShopOutlined, FileTextOutlined, PaperClipOutlined, PhoneOutlined, EnvironmentOutlined, CalendarOutlined, DollarOutlined, } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import { api } from '../../../api';
import { STATUS_COLORS, STATUS_LABELS } from '../../../types';
import dayjs from 'dayjs';
const { Option } = Select;
const { TextArea } = Input;
const { Title, Text, Paragraph } = Typography;
export const Route = createLazyFileRoute('/_layout/operations/merchants')({
    component: MerchantsPage,
});
function MerchantsPage() {
    const { message, modal } = AntdApp.useApp();
    const [tab, setTab] = useState('merchants');
    const [merchData, setMerchData] = useState([]);
    const [contData, setContData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [merchTotal, setMerchTotal] = useState(0);
    const [contTotal, setContTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalType, setModalType] = useState('merchant');
    const [modalMode, setModalMode] = useState('create');
    const [current, setCurrent] = useState(null);
    const [form] = Form.useForm();
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const [traceOpen, setTraceOpen] = useState(false);
    const [trace, setTrace] = useState([]);
    const [attachOpen, setAttachOpen] = useState(false);
    const [attachList, setAttachList] = useState([]);
    const [attachTarget, setAttachTarget] = useState(null);
    const fetchMerch = () => {
        setLoading(true);
        api.get('/operations/merchants', { page, page_size: pageSize }).then((r) => {
            setMerchData(r.data.items || []);
            setMerchTotal(r.data.total || 0);
            setLoading(false);
        });
    };
    const fetchCont = () => {
        setLoading(true);
        api.get('/operations/contracts', { page, page_size: pageSize }).then((r) => {
            setContData(r.data.items || []);
            setContTotal(r.data.total || 0);
            setLoading(false);
        });
    };
    useEffect(() => {
        if (tab === 'merchants')
            fetchMerch();
        else
            fetchCont();
    }, [tab, page, pageSize]);
    const merchMap = Object.fromEntries(merchData.map((m) => [m.id, m.name]));
    const openModal = (type, mode, record) => {
        setModalType(type);
        setModalMode(mode);
        setCurrent(record || null);
        form.resetFields();
        if (record) {
            const data = { ...record };
            if (type !== 'merchant') {
                data.start_date = record.start_date ? dayjs(record.start_date) : null;
                data.end_date = record.end_date ? dayjs(record.end_date) : null;
            }
            form.setFieldsValue(data);
        }
        setModalOpen(true);
    };
    const handleSubmit = async () => {
        try {
            const v = await form.validateFields();
            const payload = { ...v };
            if (modalType !== 'merchant') {
                payload.start_date = v.start_date?.format?.('YYYY-MM-DD') || v.start_date;
                payload.end_date = v.end_date?.format?.('YYYY-MM-DD') || v.end_date;
            }
            if (modalMode === 'create') {
                if (modalType === 'merchant')
                    await api.post('/operations/merchants', payload);
                else if (modalType === 'contract')
                    await api.post('/operations/contracts', payload);
                message.success('创建成功');
            }
            else if (current) {
                if (modalType === 'merchant')
                    await api.put(`/operations/merchants/${current.id}`, payload);
                else if (modalType === 'contract')
                    await api.put(`/operations/contracts/${current.id}`, payload);
                message.success('更新成功');
            }
            setModalOpen(false);
            if (modalType === 'merchant')
                fetchMerch();
            else
                fetchCont();
        }
        catch { }
    };
    const verifyCont = async (id) => {
        await api.post(`/operations/contracts/${id}/verify`);
        message.success('复核通过');
        fetchCont();
    };
    const batchUpdateCont = () => {
        if (selectedRowKeys.length === 0)
            return;
        let newStatus = '';
        modal.confirm({
            title: `批量更新 ${selectedRowKeys.length} 份合同`,
            content: (_jsx(Form, { layout: "vertical", children: _jsx(Form.Item, { label: "\u7EDF\u4E00\u72B6\u6001", children: _jsx(Select, { placeholder: "\u9009\u62E9\u72B6\u6001", allowClear: true, onChange: (v) => { newStatus = v; }, options: [
                            { label: '草稿', value: 'draft' },
                            { label: '待审核', value: 'pending' },
                            { label: '已通过', value: 'approved' },
                            { label: '已完成', value: 'completed' },
                        ] }) }) })),
            onOk: async () => {
                const updates = {};
                if (newStatus)
                    updates.status = newStatus;
                if (Object.keys(updates).length === 0)
                    return Promise.reject();
                await api.post('/operations/contracts/batch-update', {
                    ids: selectedRowKeys.map(Number), updates,
                });
                message.success('批量任务已提交');
                setSelectedRowKeys([]);
                fetchCont();
            },
        });
    };
    const showTrace = (type, id) => {
        api.get('/audit-logs/trace', { record_type: type, record_id: id }).then((r) => {
            setTrace(r.data);
            setTraceOpen(true);
        });
    };
    const showAttachments = (type, id) => {
        api.get('/attachments', { record_type: type, record_id: id }).then((r) => {
            setAttachList(r.data || []);
            setAttachTarget({ type, id });
            setAttachOpen(true);
        });
    };
    const uploadProps = {
        name: 'files',
        multiple: true,
        action: '/api/v1/attachments/upload',
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token') || ''}` },
        data: () => ({ record_type: attachTarget?.type, record_id: attachTarget?.id }),
        onChange: (info) => {
            if (info.file.status === 'done') {
                message.success(`${info.file.name} 上传成功`);
                showAttachments(attachTarget.type, attachTarget.id);
            }
            else if (info.file.status === 'error') {
                message.error(`${info.file.name} 上传失败`);
            }
        },
    };
    const merchColumns = [
        { title: 'ID', dataIndex: 'id', width: 70 },
        {
            title: '商户名称', dataIndex: 'name', width: 200,
            render: (v, r) => (_jsxs(Space, { children: [_jsx(ShopOutlined, { style: { color: '#fa8c16' } }), _jsx("a", { onClick: () => openModal('merchant', 'update', r), children: v })] })),
        },
        { title: '类别', dataIndex: 'category', width: 100, render: (v) => v ? _jsx(Tag, { color: "orange", children: v }) : '-' },
        { title: '联系人', dataIndex: 'contact_name', width: 100, render: (v) => v || '-' },
        { title: '电话', dataIndex: 'contact_phone', width: 130, render: (v) => v ? _jsxs("a", { href: `tel:${v}`, children: [_jsx(PhoneOutlined, {}), " ", v] }) : '-' },
        { title: '地址', dataIndex: 'address', width: 180, render: (v) => v ? _jsxs("span", { children: [_jsx(EnvironmentOutlined, {}), " ", v.slice(0, 16)] }) : '-' },
        { title: '创建', dataIndex: 'created_at', width: 140, render: (v) => dayjs(v).format('MM-DD HH:mm') },
        {
            title: '操作', key: 'actions', width: 180, fixed: 'right',
            render: (_, r) => (_jsxs(Space, { size: "small", children: [_jsx(Button, { type: "link", size: "small", icon: _jsx(HistoryOutlined, {}), onClick: () => showTrace('merchant', r.id), children: "\u75D5\u8FF9" }), _jsx(Button, { type: "link", size: "small", onClick: () => { setTab('contracts'); }, children: "\u5408\u540C" }), _jsx(Button, { type: "link", size: "small", onClick: () => openModal('merchant', 'update', r), children: "\u7F16\u8F91" })] })),
        },
    ];
    const contColumns = [
        { title: 'ID', dataIndex: 'id', width: 70 },
        {
            title: '合同编号', dataIndex: 'contract_no', width: 160,
            render: (v) => _jsx(Tag, { color: "purple", style: { fontFamily: 'monospace' }, children: v }),
        },
        {
            title: '合同标题', dataIndex: 'title', width: 220,
            render: (v, r) => (_jsx("a", { onClick: () => openModal('contract_view', 'update', r), children: v })),
        },
        { title: '商户', dataIndex: 'merchant_id', width: 140, render: (v) => merchMap[v] || `#${v}` },
        { title: '金额', dataIndex: 'amount', width: 110, render: (v) => _jsxs("span", { style: { color: '#fa8c16', fontWeight: 600 }, children: ["\u00A5", v.toLocaleString()] }) },
        {
            title: '有效期', width: 220,
            render: (_, r) => (_jsxs(Space, { children: [_jsx(CalendarOutlined, {}), _jsxs("span", { children: [dayjs(r.start_date).format('YY/MM/DD'), r.end_date ? ` ~ ${dayjs(r.end_date).format('YY/MM/DD')}` : '起'] })] })),
        },
        {
            title: '状态', dataIndex: 'status', width: 100,
            render: (v) => _jsx(Tag, { color: STATUS_COLORS[v], children: STATUS_LABELS[v] }),
        },
        { title: '复核', dataIndex: 'verified_at', width: 140, render: (v) => v ? dayjs(v).format('MM-DD HH:mm') : '-' },
        {
            title: '操作', key: 'actions', width: 280, fixed: 'right',
            render: (_, r) => (_jsxs(Space, { size: "small", children: [_jsx(Button, { type: "link", size: "small", icon: _jsx(HistoryOutlined, {}), onClick: () => showTrace('merchant_contract', r.id), children: "\u75D5\u8FF9" }), _jsx(Button, { type: "link", size: "small", icon: _jsx(PaperClipOutlined, {}), onClick: () => showAttachments('merchant_contract', r.id), children: "\u9644\u4EF6" }), _jsx(Button, { type: "link", size: "small", onClick: () => openModal('contract', 'update', r), children: "\u7F16\u8F91" }), r.status !== 'approved' && (_jsx(Button, { type: "link", size: "small", icon: _jsx(CheckCircleOutlined, {}), onClick: () => verifyCont(r.id), children: "\u590D\u6838" }))] })),
        },
    ];
    return (_jsxs(Space, { direction: "vertical", size: "large", style: { width: '100%' }, children: [_jsxs(Row, { gutter: [16, 16], children: [_jsx(Col, { xs: 24, md: 6, children: _jsx(Card, { children: _jsx(Statistic, { title: "\u5546\u6237\u603B\u6570", value: merchTotal, prefix: _jsx(ShopOutlined, { style: { color: '#fa8c16' } }), valueStyle: { color: '#fa8c16' } }) }) }), _jsx(Col, { xs: 24, md: 6, children: _jsx(Card, { children: _jsx(Statistic, { title: "\u5408\u540C\u603B\u6570", value: contTotal, prefix: _jsx(FileTextOutlined, { style: { color: '#722ed1' } }), valueStyle: { color: '#722ed1' } }) }) }), _jsx(Col, { xs: 24, md: 6, children: _jsx(Card, { children: _jsx(Statistic, { title: "\u5408\u540C\u603B\u989D", value: contData.reduce((s, c) => s + c.amount, 0), precision: 0, prefix: _jsx(DollarOutlined, { style: { color: '#52c41a' } }), valueStyle: { color: '#52c41a' } }) }) }), _jsx(Col, { xs: 24, md: 6, children: _jsx(Card, { children: _jsx(Statistic, { title: "\u5F85\u590D\u6838", value: contData.filter((c) => c.status === 'pending').length, valueStyle: { color: '#faad14' } }) }) })] }), _jsxs(Card, { styles: { body: { padding: 0 } }, children: [_jsx(Tabs, { activeKey: tab, onChange: (k) => { setTab(k); setPage(1); setSelectedRowKeys([]); }, style: { padding: '0 24px' }, items: [
                            { key: 'merchants', label: '🏪 商户管理' },
                            { key: 'contracts', label: '📄 商户合同' },
                        ] }), _jsxs("div", { style: { padding: '0 24px 16px', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }, children: [_jsxs(Space, { wrap: true, children: [_jsx(Input, { prefix: _jsx(SearchOutlined, {}), placeholder: "\u641C\u7D22\u540D\u79F0/\u7F16\u53F7", allowClear: true, style: { width: 180 } }), _jsx(Button, { icon: _jsx(ReloadOutlined, {}), onClick: () => tab === 'merchants' ? fetchMerch() : fetchCont(), children: "\u5237\u65B0" })] }), _jsxs(Space, { children: [tab === 'contracts' && selectedRowKeys.length > 0 && (_jsx(Tooltip, { title: `批量操作 ${selectedRowKeys.length} 份`, children: _jsxs(Button, { type: "primary", ghost: true, onClick: batchUpdateCont, children: ["\u6279\u91CF\u66F4\u65B0 (", selectedRowKeys.length, ")"] }) })), _jsxs(Button, { type: "primary", icon: _jsx(PlusOutlined, {}), onClick: () => openModal(tab === 'merchants' ? 'merchant' : 'contract', 'create'), children: ["\u65B0\u5EFA", tab === 'merchants' ? '商户' : '合同'] })] })] }), _jsx(Table, { rowKey: "id", loading: loading, dataSource: (tab === 'merchants' ? merchData : contData), columns: (tab === 'merchants' ? merchColumns : contColumns), rowSelection: tab === 'contracts' ? { selectedRowKeys, onChange: setSelectedRowKeys } : undefined, pagination: {
                            current: page, pageSize, total: tab === 'merchants' ? merchTotal : contTotal,
                            showSizeChanger: true, showQuickJumper: true,
                            showTotal: (t) => `共 ${t} 条`,
                            onChange: (p, ps) => { setPage(p); setPageSize(ps); },
                        }, scroll: { x: 1400 } })] }), _jsx(Modal, { title: modalType === 'merchant'
                    ? (modalMode === 'create' ? '新建商户' : '编辑商户')
                    : modalType === 'contract_view'
                        ? '合同详情'
                        : (modalMode === 'create' ? '新建合同' : '编辑合同'), open: modalOpen, onCancel: () => setModalOpen(false), onOk: modalType === 'contract_view' ? undefined : handleSubmit, okButtonProps: modalType === 'contract_view' ? { style: { display: 'none' } } : undefined, cancelText: modalType === 'contract_view' ? '关闭' : '取消', width: modalType === 'contract_view' ? 720 : 640, destroyOnClose: true, children: modalType === 'contract_view' && current ? (_jsxs("div", { children: [_jsxs(Space, { style: { marginBottom: 16 }, children: [_jsx(Tag, { color: "purple", style: { fontFamily: 'monospace', fontSize: 14 }, children: current.contract_no }), _jsx(Tag, { color: STATUS_COLORS[current.status], children: STATUS_LABELS[current.status] })] }), _jsx(Title, { level: 4, style: { margin: '8px 0 16px' }, children: current.title }), _jsxs(Descriptions, { bordered: true, size: "small", column: 2, children: [_jsx(Descriptions.Item, { label: "\u5546\u6237", span: 2, children: merchMap[current.merchant_id] || `#${current.merchant_id}` }), _jsx(Descriptions.Item, { label: "\u5F00\u59CB\u65E5\u671F", children: dayjs(current.start_date).format('YYYY-MM-DD') }), _jsx(Descriptions.Item, { label: "\u7ED3\u675F\u65E5\u671F", children: current.end_date ? dayjs(current.end_date).format('YYYY-MM-DD') : '长期' }), _jsx(Descriptions.Item, { label: "\u5408\u540C\u91D1\u989D", span: 2, children: _jsxs("span", { style: { color: '#fa8c16', fontWeight: 600, fontSize: 16 }, children: ["\u00A5", current.amount.toLocaleString()] }) }), _jsx(Descriptions.Item, { label: "\u590D\u6838\u4EBA", children: current.verified_by ? `用户#${current.verified_by}` : '-' }), _jsx(Descriptions.Item, { label: "\u590D\u6838\u65F6\u95F4", children: current.verified_at ? dayjs(current.verified_at).format('YYYY-MM-DD HH:mm') : '-' })] }), _jsx(Divider, { orientation: "left", children: "\u5408\u540C\u5185\u5BB9" }), current.content ? (_jsx(Paragraph, { style: { whiteSpace: 'pre-wrap', background: '#fafafa', padding: 16, borderRadius: 4 }, children: current.content })) : (_jsx(Empty, { description: "\u6682\u65E0\u8BE6\u7EC6\u5185\u5BB9", image: Empty.PRESENTED_IMAGE_SIMPLE })), _jsx("div", { style: { marginTop: 16 }, children: _jsx(Button, { icon: _jsx(PaperClipOutlined, {}), onClick: () => showAttachments('merchant_contract', current.id), children: "\u67E5\u770B\u9644\u4EF6" }) })] })) : modalType === 'merchant' ? (_jsxs(Form, { form: form, layout: "vertical", children: [_jsx(Form.Item, { label: "\u5546\u6237\u540D\u79F0", name: "name", rules: [{ required: true }], children: _jsx(Input, {}) }), _jsxs(Row, { gutter: 12, children: [_jsx(Col, { span: 12, children: _jsx(Form.Item, { label: "\u7C7B\u522B", name: "category", children: _jsxs(Select, { placeholder: "\u9910\u996E/\u7EAA\u5FF5\u54C1/\u4F4F\u5BBF/\u4EA4\u901A...", allowClear: true, children: [_jsx(Option, { value: "\u9910\u996E", children: "\u9910\u996E" }), _jsx(Option, { value: "\u7EAA\u5FF5\u54C1", children: "\u7EAA\u5FF5\u54C1" }), _jsx(Option, { value: "\u4F4F\u5BBF", children: "\u4F4F\u5BBF" }), _jsx(Option, { value: "\u4EA4\u901A", children: "\u4EA4\u901A" }), _jsx(Option, { value: "\u5176\u4ED6", children: "\u5176\u4ED6" })] }) }) }), _jsx(Col, { span: 12, children: _jsx(Form.Item, { label: "\u8054\u7CFB\u7535\u8BDD", name: "contact_phone", children: _jsx(Input, {}) }) })] }), _jsx(Form.Item, { label: "\u8054\u7CFB\u4EBA", name: "contact_name", children: _jsx(Input, {}) }), _jsx(Form.Item, { label: "\u5730\u5740", name: "address", children: _jsx(TextArea, { rows: 2 }) })] })) : (_jsxs(Form, { form: form, layout: "vertical", children: [_jsxs(Row, { gutter: 12, children: [_jsx(Col, { span: 14, children: _jsx(Form.Item, { label: "\u5408\u540C\u7F16\u53F7", name: "contract_no", rules: [{ required: true }], children: _jsx(Input, { placeholder: "HT-2024-001" }) }) }), _jsx(Col, { span: 10, children: _jsx(Form.Item, { label: "\u5546\u6237", name: "merchant_id", rules: [{ required: true }], children: _jsx(Select, { placeholder: "\u9009\u62E9\u5546\u6237", children: merchData.map((m) => _jsx(Option, { value: m.id, children: m.name }, m.id)) }) }) })] }), _jsx(Form.Item, { label: "\u5408\u540C\u6807\u9898", name: "title", rules: [{ required: true }], children: _jsx(Input, { placeholder: "\u7B80\u8981\u63CF\u8FF0\u5408\u540C\u5185\u5BB9" }) }), _jsxs(Row, { gutter: 12, children: [_jsx(Col, { span: 10, children: _jsx(Form.Item, { label: "\u5F00\u59CB\u65E5\u671F", name: "start_date", rules: [{ required: true }], children: _jsx(DatePicker, { style: { width: '100%' } }) }) }), _jsx(Col, { span: 10, children: _jsx(Form.Item, { label: "\u7ED3\u675F\u65E5\u671F", name: "end_date", children: _jsx(DatePicker, { style: { width: '100%' } }) }) }), _jsx(Col, { span: 4, children: _jsx(Form.Item, { label: "\u91D1\u989D", name: "amount", initialValue: 0, children: _jsx(InputNumber, { style: { width: '100%' }, prefix: "\u00A5" }) }) })] }), _jsx(Form.Item, { label: "\u72B6\u6001", name: "status", initialValue: "pending", children: _jsx(Select, { children: ['draft', 'pending', 'approved', 'completed'].map((s) => (_jsx(Option, { value: s, children: STATUS_LABELS[s] }, s))) }) }), _jsx(Form.Item, { label: "\u5408\u540C\u5185\u5BB9", name: "content", children: _jsx(TextArea, { rows: 6, placeholder: "\u8BE6\u7EC6\u6761\u6B3E\u3001\u5408\u540C\u5185\u5BB9..." }) })] })) }), _jsx(Drawer, { title: "\u5904\u7406\u75D5\u8FF9", open: traceOpen, onClose: () => setTraceOpen(false), width: 600, children: _jsx(Timeline, { items: trace.map((t) => ({
                        color: t.action === 'create' ? 'green' : t.action === 'verify' ? 'cyan' : t.action === 'batch_update' ? 'purple' : 'blue',
                        children: (_jsxs("div", { style: { marginBottom: 12 }, children: [_jsxs(Space, { children: [_jsx(Tag, { children: t.action }), _jsx("b", { children: t.user_name || '系统' }), _jsx("span", { style: { color: '#999' }, children: dayjs(t.at).format('MM-DD HH:mm') })] }), t.field && (_jsxs("div", { style: { marginTop: 6, padding: 8, background: '#fafafa', borderRadius: 4 }, children: [_jsxs("div", { children: ["\u5B57\u6BB5\uFF1A", t.field] }), t.old && _jsxs("div", { style: { color: '#f00' }, children: ["\u539F: ", t.old] }), t.new && _jsxs("div", { style: { color: '#0a0' }, children: ["\u65B0: ", t.new] })] })), t.remarks && _jsx("div", { style: { marginTop: 4 }, children: t.remarks })] })),
                    })) }) }), _jsxs(Drawer, { title: "\u5408\u540C\u9644\u4EF6", open: attachOpen, onClose: () => setAttachOpen(false), width: 500, children: [_jsxs(Upload.Dragger, { ...uploadProps, multiple: true, children: [_jsx("p", { className: "ant-upload-drag-icon", children: _jsx(PaperClipOutlined, { style: { fontSize: 36 } }) }), _jsx("p", { children: "\u4E0A\u4F20\u5408\u540C\u626B\u63CF\u4EF6/\u8865\u5145\u6587\u4EF6" }), _jsx("p", { style: { color: '#999' }, children: "PDF\u3001\u56FE\u7247\u3001Word \u7B49\u4EFB\u610F\u683C\u5F0F" })] }), _jsxs(Divider, { children: ["\u5DF2\u4E0A\u4F20 (", attachList.length, ")"] }), attachList.length === 0 ? (_jsx(Empty, { description: "\u6682\u65E0\u9644\u4EF6" })) : (_jsx(Space, { direction: "vertical", style: { width: '100%' }, children: attachList.map((a) => (_jsx(Card, { size: "small", children: _jsxs(Space, { style: { width: '100%' }, children: [_jsx(PaperClipOutlined, {}), _jsx("a", { href: `/api/v1/attachments/${a.id}/download`, download: true, children: a.original_name || a.file_name }), _jsxs(Tag, { children: [(a.file_size / 1024).toFixed(1), " KB"] }), _jsx("span", { style: { color: '#999' }, children: dayjs(a.created_at).format('MM-DD HH:mm') })] }) }, a.id))) }))] })] }));
}
