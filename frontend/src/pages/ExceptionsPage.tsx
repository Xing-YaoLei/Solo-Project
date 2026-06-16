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
  List,
  Row,
  Col,
  Statistic,
  Divider,
} from 'antd';
import {
  PlusOutlined,
  CloseOutlined,
  UploadOutlined,
  ArrowUpOutlined,
  CheckCircleOutlined,
  FileTextOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { exceptionApi, settlementApi } from '../services/api';
import type { ExceptionRecord, SupplementMaterial } from '../types';
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
      setExceptions(getMockExceptions());
    } finally {
      setLoading(false);
    }
  };

  const getMockExceptions = (): ExceptionRecord[] => {
    const baseDate = dayjs();
    return [
      {
        id: 1,
        billId: 1,
        billNo: 'JB202406001',
        exceptionType: 'InsuranceRejection',
        rejectionReasonId: 1,
        rejectionReasonName: '费用超标',
        description: '部分治疗项目费用超出医保支付标准，需要核实具体收费依据',
        handlerId: 2,
        handlerName: '李处理员',
        handleMethod: 'SupplementMaterials',
        handleRemark: '已补充相关证明材料，包括收费标准说明和医嘱单',
        handledAt: baseDate.subtract(2, 'day').format('YYYY-MM-DD HH:mm:ss'),
        escalatedAt: undefined,
        escalatedTo: undefined,
        escalatedToName: undefined,
        isClosed: false,
        closedAt: undefined,
        createdAt: baseDate.subtract(5, 'day').format('YYYY-MM-DD HH:mm:ss'),
        supplementMaterials: [
          {
            id: 1,
            exceptionRecordId: 1,
            billId: 1,
            materialName: '收费标准说明.pdf',
            materialType: 'document',
            fileUrl: '/files/material1.pdf',
            remark: '物价局核定的收费标准文件',
            createdAt: baseDate.subtract(4, 'day').format('YYYY-MM-DD HH:mm:ss'),
          },
          {
            id: 2,
            exceptionRecordId: 1,
            billId: 1,
            materialName: '医嘱单.pdf',
            materialType: 'document',
            fileUrl: '/files/material2.pdf',
            remark: '主治医师开具的治疗医嘱',
            createdAt: baseDate.subtract(4, 'day').format('YYYY-MM-DD HH:mm:ss'),
          },
          {
            id: 3,
            exceptionRecordId: 1,
            billId: 1,
            materialName: '治疗记录.pdf',
            materialType: 'document',
            fileUrl: '/files/material3.pdf',
            remark: '详细的治疗过程记录',
            createdAt: baseDate.subtract(2, 'day').format('YYYY-MM-DD HH:mm:ss'),
          },
        ],
      },
      {
        id: 2,
        billId: 3,
        billNo: 'JB202406003',
        exceptionType: 'InsuranceRejection',
        rejectionReasonId: 2,
        rejectionReasonName: '适应症不符',
        description: '医保审核认为治疗项目与诊断不符，需要提供更多临床依据',
        handlerId: 3,
        handlerName: '王医生',
        handleMethod: 'Escalate',
        handleRemark: '已提交科主任复核，等待进一步处理意见',
        handledAt: baseDate.subtract(1, 'day').format('YYYY-MM-DD HH:mm:ss'),
        escalatedAt: baseDate.subtract(1, 'day').format('YYYY-MM-DD HH:mm:ss'),
        escalatedTo: 5,
        escalatedToName: '陈主任',
        isClosed: false,
        closedAt: undefined,
        createdAt: baseDate.subtract(3, 'day').format('YYYY-MM-DD HH:mm:ss'),
        supplementMaterials: [
          {
            id: 4,
            exceptionRecordId: 2,
            billId: 3,
            materialName: '病历摘要.pdf',
            materialType: 'document',
            fileUrl: '/files/material4.pdf',
            remark: '患者完整病历摘要',
            createdAt: baseDate.subtract(3, 'day').format('YYYY-MM-DD HH:mm:ss'),
          },
        ],
      },
      {
        id: 3,
        billId: 5,
        billNo: 'JB202406005',
        exceptionType: 'InsuranceRejection',
        rejectionReasonId: 3,
        rejectionReasonName: '材料不全',
        description: '缺少必要的诊断证明和检查报告',
        handlerId: 1,
        handlerName: '张医生',
        handleMethod: 'CloseNormally',
        handleRemark: '经核实患者自愿放弃医保报销，改为自费',
        handledAt: baseDate.subtract(6, 'day').format('YYYY-MM-DD HH:mm:ss'),
        escalatedAt: undefined,
        escalatedTo: undefined,
        escalatedToName: undefined,
        isClosed: true,
        closedAt: baseDate.subtract(6, 'day').format('YYYY-MM-DD HH:mm:ss'),
        createdAt: baseDate.subtract(8, 'day').format('YYYY-MM-DD HH:mm:ss'),
        supplementMaterials: [],
      },
      {
        id: 4,
        billId: 7,
        billNo: 'JB202406007',
        exceptionType: 'InsuranceRejection',
        rejectionReasonId: 1,
        rejectionReasonName: '费用超标',
        description: '康复治疗次数超出医保支付限额',
        handlerId: undefined,
        handlerName: undefined,
        handleMethod: undefined,
        handleRemark: undefined,
        handledAt: undefined,
        escalatedAt: undefined,
        escalatedTo: undefined,
        escalatedToName: undefined,
        isClosed: false,
        closedAt: undefined,
        createdAt: baseDate.subtract(1, 'day').format('YYYY-MM-DD HH:mm:ss'),
        supplementMaterials: [],
      },
      {
        id: 5,
        billId: 9,
        billNo: 'JB202406009',
        exceptionType: 'InsuranceRejection',
        rejectionReasonId: 4,
        rejectionReasonName: '时间不符',
        description: '治疗时间与医保规定的时限要求不符',
        handlerId: 2,
        handlerName: '李处理员',
        handleMethod: 'SupplementMaterials',
        handleRemark: '已提交特殊情况说明，等待医保中心审批',
        handledAt: baseDate.subtract(4, 'day').format('YYYY-MM-DD HH:mm:ss'),
        escalatedAt: undefined,
        escalatedTo: undefined,
        escalatedToName: undefined,
        isClosed: false,
        closedAt: undefined,
        createdAt: baseDate.subtract(7, 'day').format('YYYY-MM-DD HH:mm:ss'),
        supplementMaterials: [
          {
            id: 5,
            exceptionRecordId: 5,
            billId: 9,
            materialName: '特殊情况说明.pdf',
            materialType: 'document',
            fileUrl: '/files/material5.pdf',
            remark: '由科室主任签字的特殊情况说明',
            createdAt: baseDate.subtract(4, 'day').format('YYYY-MM-DD HH:mm:ss'),
          },
          {
            id: 6,
            exceptionRecordId: 5,
            billId: 9,
            materialName: '检查报告.pdf',
            materialType: 'document',
            fileUrl: '/files/material6.pdf',
            remark: '相关检查报告佐证',
            createdAt: baseDate.subtract(4, 'day').format('YYYY-MM-DD HH:mm:ss'),
          },
        ],
      },
    ];
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
      message.success('创建成功（模拟）');
      setCreateModalVisible(false);
      loadExceptions();
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
      message.success('处理成功（模拟）');
      setHandleModalVisible(false);
      loadExceptions();
    }
  };

  const handleClose = async (record: ExceptionRecord) => {
    try {
      await exceptionApi.close({
        exceptionRecordId: record.id,
        closeRemark: '正常关闭',
      });
      message.success('关闭成功');
      loadExceptions();
    } catch (error) {
      message.success('关闭成功（模拟）');
      loadExceptions();
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
