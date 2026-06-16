import React, { useEffect, useState } from 'react';
import {
  Card,
  Table,
  Tag,
  Button,
  Space,
  Modal,
  Form,
  Select,
  Input,
  Upload,
  message,
  Tabs,
  Row,
  Col,
  Statistic,
} from 'antd';
import {
  PlusOutlined,
  UploadOutlined,
  ArrowUpOutlined,
  CheckCircleOutlined,
  FileTextOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { exceptionApi } from '../services/api';
import type { ExceptionRecord } from '../types';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';

const { Option } = Select;
const { TextArea } = Input;

const ExceptionsPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [exceptions, setExceptions] = useState<ExceptionRecord[]>([]);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [handleModalVisible, setHandleModalVisible] = useState(false);
  const [selectedException, setSelectedException] = useState<ExceptionRecord | null>(null);
  const [handleMethod, setHandleMethod] = useState<string>('');
  const [form] = Form.useForm();
  const [handleForm] = Form.useForm();

  useEffect(() => {
    loadExceptions();
  }, []);

  const loadExceptions = async () => {
    setLoading(true);
    try {
      const data = await exceptionApi.getList();
      setExceptions(data);
    } catch (error) {
      console.error('Failed to load exceptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    form.resetFields();
    setCreateModalVisible(true);
  };

  const handleCreateSubmit = async (values: any) => {
    try {
      await exceptionApi.create({
        ...values,
        exceptionType: 'InsuranceRejection',
      });
      message.success('创建成功');
      setCreateModalVisible(false);
      loadExceptions();
    } catch (error) {
      console.error('Create error:', error);
      message.error('创建失败');
    }
  };

  const openHandleModal = (record: ExceptionRecord, method: string) => {
    setSelectedException(record);
    setHandleMethod(method);
    handleForm.resetFields();
    setHandleModalVisible(true);
  };

  const handleHandleSubmit = async (values: any) => {
    if (!selectedException) return;

    try {
      await exceptionApi.handle({
        exceptionRecordId: selectedException.id,
        handleMethod,
        handleRemark: values.remark,
        escalatedTo: values.escalatedTo,
      });
      message.success('处理成功');
      setHandleModalVisible(false);
      loadExceptions();
    } catch (error) {
      console.error('Handle error:', error);
      message.error('处理失败');
    }
  };

  const uploadProps: UploadProps = {
    beforeUpload: (file) => {
      console.log('Upload file:', file.name);
      return false;
    },
  };

  const columns = [
    {
      title: '单据编号',
      dataIndex: 'billNo',
      key: 'billNo',
      width: 140,
      render: (text: string, record: ExceptionRecord) => (
        <a onClick={() => navigate(`/bills/${record.billId}`)}>{text}</a>
      ),
    },
    {
      title: '拒付原因',
      dataIndex: 'rejectionReasonName',
      key: 'rejectionReasonName',
      width: 130,
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '处理方式',
      dataIndex: 'handleMethod',
      key: 'handleMethod',
      width: 120,
      render: (method?: string) => {
        if (!method) return <Tag color="default">待处理</Tag>;
        const methodMap: Record<string, { name: string; color: string }> = {
          CloseNormally: { name: '正常关闭', color: 'green' },
          SupplementMaterials: { name: '补充材料', color: 'blue' },
          Escalate: { name: '升级处理', color: 'orange' },
        };
        const m = methodMap[method];
        return m ? <Tag color={m.color}>{m.name}</Tag> : method;
      },
    },
    {
      title: '处理人',
      dataIndex: 'handlerName',
      key: 'handlerName',
      width: 100,
      render: (name?: string) => name || '未分配',
    },
    {
      title: '状态',
      dataIndex: 'isClosed',
      key: 'isClosed',
      width: 100,
      render: (isClosed: boolean) => (
        <Tag color={isClosed ? 'default' : 'red'}>{isClosed ? '已关闭' : '处理中'}</Tag>
      ),
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
      width: 280,
      render: (_: any, record: ExceptionRecord) => (
        <Space size="small">
          {!record.isClosed && !record.handleMethod && (
            <>
              <Button
                size="small"
                type="link"
                icon={<CheckCircleOutlined />}
                onClick={() => openHandleModal(record, 'CloseNormally')}
              >
                正常关闭
              </Button>
              <Button
                size="small"
                type="link"
                icon={<UploadOutlined />}
                onClick={() => openHandleModal(record, 'SupplementMaterials')}
              >
                补充材料
              </Button>
              <Button
                size="small"
                type="link"
                icon={<ArrowUpOutlined />}
                onClick={() => openHandleModal(record, 'Escalate')}
              >
                升级处理
              </Button>
            </>
          )}
          {record.isClosed && (
            <Tag color="default">已关闭</Tag>
          )}
          <Button
            size="small"
            type="link"
            onClick={() => navigate(`/bills/${record.billId}`)}
          >
            查看单据
          </Button>
        </Space>
      ),
    },
  ];

  const openExceptions = exceptions.filter((e) => !e.isClosed);
  const closedExceptions = exceptions.filter((e) => e.isClosed);

  const pendingCount = exceptions.filter((e) => !e.handleMethod).length;
  const supplementingCount = exceptions.filter((e) => e.handleMethod === 'SupplementMaterials').length;
  const escalatedCount = exceptions.filter((e) => e.handleMethod === 'Escalate').length;
  const closedCount = closedExceptions.length;

  const tabItems = [
    {
      key: 'all',
      label: '全部',
      children: (
        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={exceptions}
          pagination={{ pageSize: 10 }}
        />
      ),
    },
    {
      key: 'open',
      label: (
        <span>
          待处理
          <Tag color="red" style={{ marginLeft: 8 }}>
            {pendingCount}
          </Tag>
        </span>
      ),
      children: (
        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={openExceptions.filter((e) => !e.handleMethod)}
          pagination={{ pageSize: 10 }}
        />
      ),
    },
    {
      key: 'supplementing',
      label: (
        <span>
          补充材料中
          <Tag color="blue" style={{ marginLeft: 8 }}>
            {supplementingCount}
          </Tag>
        </span>
      ),
      children: (
        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={openExceptions.filter((e) => e.handleMethod === 'SupplementMaterials')}
          pagination={{ pageSize: 10 }}
        />
      ),
    },
    {
      key: 'escalated',
      label: (
        <span>
          升级处理
          <Tag color="orange" style={{ marginLeft: 8 }}>
            {escalatedCount}
          </Tag>
        </span>
      ),
      children: (
        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={openExceptions.filter((e) => e.handleMethod === 'Escalate')}
          pagination={{ pageSize: 10 }}
        />
      ),
    },
    {
      key: 'closed',
      label: (
        <span>
          已关闭
          <Tag style={{ marginLeft: 8 }}>
            {closedCount}
          </Tag>
        </span>
      ),
      children: (
        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={closedExceptions}
          pagination={{ pageSize: 10 }}
        />
      ),
    },
  ];

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="待处理异常"
              value={pendingCount}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="补充材料中"
              value={supplementingCount}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="升级处理"
              value={escalatedCount}
              prefix={<ArrowUpOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="已关闭"
              value={closedCount}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title="医保拒付异常处理"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            新增异常
          </Button>
        }
      >
        <Tabs defaultActiveKey="all" items={tabItems} />
      </Card>

      <Modal
        title="新增异常记录"
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        onOk={() => form.submit()}
        okText="确认"
        cancelText="取消"
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleCreateSubmit}>
          <Form.Item
            name="billId"
            label="关联单据"
            rules={[{ required: true, message: '请选择单据' }]}
          >
            <Select placeholder="请选择单据" showSearch>
              <Option value={1}>JB202406001 - 张三</Option>
              <Option value={2}>JB202406002 - 李四</Option>
              <Option value={3}>JB202406003 - 王五</Option>
              <Option value={5}>JB202406005 - 赵六</Option>
              <Option value={7}>JB202406007 - 钱七</Option>
              <Option value={9}>JB202406009 - 孙八</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="rejectionReasonId"
            label="拒付原因"
            rules={[{ required: true, message: '请选择拒付原因' }]}
          >
            <Select placeholder="请选择拒付原因">
              <Option value={1}>费用超标</Option>
              <Option value={2}>适应症不符</Option>
              <Option value={3}>材料不全</Option>
              <Option value={4}>时间不符</Option>
              <Option value={5}>其他</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="description"
            label="详细描述"
            rules={[{ required: true, message: '请填写详细描述' }]}
          >
            <TextArea rows={4} placeholder="请详细描述拒付原因和情况" />
          </Form.Item>

          <Form.Item name="handlerId" label="处理人">
            <Select placeholder="请选择处理人">
              <Option value={1}>张医生</Option>
              <Option value={2}>李处理员</Option>
              <Option value={3}>王医生</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={
          handleMethod === 'CloseNormally'
            ? '正常关闭'
            : handleMethod === 'SupplementMaterials'
            ? '补充材料'
            : '升级处理'
        }
        open={handleModalVisible}
        onCancel={() => setHandleModalVisible(false)}
        onOk={() => handleForm.submit()}
        okText="确认"
        cancelText="取消"
        width={600}
      >
        <Form form={handleForm} layout="vertical" onFinish={handleHandleSubmit}>
          {handleMethod === 'Escalate' && (
            <Form.Item
              name="escalatedTo"
              label="升级至"
              rules={[{ required: true, message: '请选择升级对象' }]}
            >
              <Select placeholder="请选择升级处理的人员">
                <Option value={5}>陈主任</Option>
                <Option value={6}>刘副主任</Option>
                <Option value={7}>医保办</Option>
              </Select>
            </Form.Item>
          )}

          {handleMethod === 'SupplementMaterials' && (
            <Form.Item label="上传补充材料">
              <Upload {...uploadProps} multiple>
                <Button icon={<UploadOutlined />}>点击上传文件</Button>
              </Upload>
            </Form.Item>
          )}

          <Form.Item
            name="remark"
            label={
              handleMethod === 'CloseNormally'
                ? '关闭说明'
                : handleMethod === 'SupplementMaterials'
                ? '补充说明'
                : '升级说明'
            }
            rules={[{ required: true, message: '请填写说明' }]}
          >
            <TextArea rows={4} placeholder="请填写处理说明" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ExceptionsPage;
