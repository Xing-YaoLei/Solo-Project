import React, { useEffect, useState } from 'react';
import { Table, Button, Input, Select, DatePicker, Space, Card, Tag, Modal, Form, message, Popconfirm } from 'antd';
import { PlusOutlined, SearchOutlined, EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { settlementApi } from '../services/api';
import type { SettlementBill, BillListQuery, PagedResult } from '../types';
import { SettlementStatusMap } from '../types';
import dayjs from 'dayjs';
import BillForm from '../components/BillForm';

const { RangePicker } = DatePicker;
const { Option } = Select;

const BillList: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<PagedResult<SettlementBill>>({
    items: [],
    totalCount: 0,
    pageIndex: 1,
    pageSize: 20,
    totalPages: 0,
  });
  const [query, setQuery] = useState<BillListQuery>({
    pageIndex: 1,
    pageSize: 20,
  });
  const [formModalVisible, setFormModalVisible] = useState(false);
  const [editingBill, setEditingBill] = useState<SettlementBill | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadData();
  }, [query]);

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await settlementApi.getList(query);
      setData(result);
    } catch (error) {
      console.error('Failed to load bills:', error);
      message.error('加载单据列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setQuery({ ...query, pageIndex: 1 });
  };

  const handleReset = () => {
    setQuery({
      statusId: undefined,
      assigneeId: undefined,
      sourceChannelId: undefined,
      searchKeyword: undefined,
      startDate: undefined,
      endDate: undefined,
      pageIndex: 1,
      pageSize: 20,
    });
  };

  const handleAdd = () => {
    setEditingBill(null);
    form.resetFields();
    setFormModalVisible(true);
  };

  const handleEdit = (record: SettlementBill) => {
    setEditingBill(record);
    form.setFieldsValue(record);
    setFormModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await settlementApi.delete(id);
      message.success('删除成功');
      loadData();
    } catch (error) {
      console.error('Delete error:', error);
      message.error('删除失败');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      if (editingBill) {
        await settlementApi.update(editingBill.id, values);
        message.success('更新成功');
      } else {
        await settlementApi.create(values);
        message.success('创建成功');
      }
      setFormModalVisible(false);
      loadData();
    } catch (error) {
      console.error('Submit error:', error);
      message.error('提交失败');
    }
  };

  const columns = [
    {
      title: '单据编号',
      dataIndex: 'billNo',
      key: 'billNo',
      width: 140,
      render: (text: string, record: SettlementBill) => (
        <a onClick={() => navigate(`/bills/${record.id}`)}>{text}</a>
      ),
    },
    {
      title: '患者姓名',
      dataIndex: 'patientName',
      key: 'patientName',
      width: 100,
    },
    {
      title: '患者编号',
      dataIndex: 'patientNo',
      key: 'patientNo',
      width: 120,
    },
    {
      title: '状态',
      dataIndex: 'statusId',
      key: 'statusId',
      width: 110,
      render: (statusId: number) => {
        const status = SettlementStatusMap[statusId];
        return <Tag color={status?.color}>{status?.name}</Tag>;
      },
    },
    {
      title: '来源渠道',
      dataIndex: 'sourceChannelName',
      key: 'sourceChannelName',
      width: 110,
    },
    {
      title: '负责人',
      dataIndex: 'assigneeName',
      key: 'assigneeName',
      width: 100,
    },
    {
      title: '总金额',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: 110,
      render: (val: number) => `¥${val.toLocaleString()}`,
    },
    {
      title: '医保报销',
      dataIndex: 'insuranceAmount',
      key: 'insuranceAmount',
      width: 110,
      render: (val: number) => `¥${val.toLocaleString()}`,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (val: string) => dayjs(val).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'actions',
      width: 180,
      fixed: 'right' as const,
      render: (_: any, record: SettlementBill) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/bills/${record.id}`)}
          >
            详情
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Form layout="inline" onFinish={handleSearch}>
          <Form.Item name="searchKeyword" label="搜索">
            <Input placeholder="单据号/患者姓名/编号" allowClear style={{ width: 200 }} />
          </Form.Item>
          <Form.Item name="statusId" label="状态">
            <Select placeholder="全部状态" allowClear style={{ width: 140 }}>
              {Object.entries(SettlementStatusMap).map(([id, status]) => (
                <Option key={id} value={Number(id)}>
                  {status.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="sourceChannel" label="来源渠道">
            <Select placeholder="全部渠道" allowClear style={{ width: 140 }}>
              <Option value={1}>门诊转诊</Option>
              <Option value={2}>住院转诊</Option>
              <Option value={3}>社区推荐</Option>
              <Option value={4}>线上预约</Option>
            </Select>
          </Form.Item>
          <Form.Item name="dateRange" label="创建时间">
            <RangePicker />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
                搜索
              </Button>
              <Button onClick={handleReset}>重置</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Card
        title="结算单据列表"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增单据
          </Button>
        }
      >
        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={data.items}
          pagination={{
            current: data.pageIndex,
            pageSize: data.pageSize,
            total: data.totalCount,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
            onChange: (page, pageSize) => {
              setQuery({ ...query, pageIndex: page, pageSize });
            },
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      <Modal
        title={editingBill ? '编辑单据' : '新增单据'}
        open={formModalVisible}
        onCancel={() => setFormModalVisible(false)}
        width={800}
        footer={null}
        destroyOnClose
      >
        <BillForm
          form={form}
          initialData={editingBill}
          onSubmit={handleSubmit}
          onCancel={() => setFormModalVisible(false)}
        />
      </Modal>
    </div>
  );
};

export default BillList;
