import React, { useEffect, useState, useCallback } from 'react';
import {
  Card,
  Steps,
  Descriptions,
  Button,
  Space,
  Row,
  Col,
  Divider,
  Spin,
  message,
  Tag,
  Timeline,
  Modal,
  Form,
  Input,
  DatePicker,
  Empty,
  Tabs,
  Alert,
  Upload,
  Tooltip,
  Typography,
  Select,
  Radio,
  RadioChangeEvent,
} from 'antd';
import {
  ArrowLeftOutlined,
  FallOutlined,
  WarningOutlined,
  UserOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
  UsergroupAddOutlined,
  SearchOutlined,
  BulbOutlined,
  SendOutlined,
  ArrowUpOutlined,
  CloseOutlined,
  FileDoneOutlined,
  CheckCircleOutlined,
  HistoryOutlined,
  PaperClipOutlined,
  InboxOutlined,
  UploadOutlined,
  DownloadOutlined,
  TeamOutlined,
  ExclamationCircleOutlined,
  EyeOutlined,
  InfoCircleOutlined,
  HomeOutlined,
  MedicineBoxOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import PageHeader from '@/components/PageHeader';
import {
  ExceptionTypeTag,
  ExceptionSeverityTag,
  ExceptionStatusTag,
  ExceptionCloseTypeTag,
  GenderTag,
  CareLevelTypeTag,
} from '@/components/StatusTag';
import { exceptionService } from '@/services/exceptionService';
import type {
  ExceptionRecordDetailDto,
  ExceptionStatusChangeDto,
  ExceptionStatus,
  ExceptionCloseType,
  ExceptionAttachmentDto,
  ElderDetailDto,
} from '@/types';
import { useAppStore } from '@/store/useAppStore';
import {
  ExceptionStatus as ExceptionStatusEnum,
  ExceptionCloseType as ExceptionCloseTypeEnum,
  ExceptionType as ExceptionTypeEnum,
} from '@/types';

const { Step } = Steps;
const { TextArea } = Input;
const { Text, Title } = Typography;
const { Dragger } = Upload;
const { TabPane } = Tabs;

const EXCEPTION_STEPS = [
  { status: ExceptionStatusEnum.Reported, title: '已上报' },
  { status: ExceptionStatusEnum.Investigating, title: '调查中' },
  { status: ExceptionStatusEnum.Handling, title: '处理中' },
  { status: ExceptionStatusEnum.PendingSupplement, title: '待补充' },
  { status: ExceptionStatusEnum.Escalated, title: '已升级' },
  { status: ExceptionStatusEnum.Resolved, title: '已解决' },
  { status: ExceptionStatusEnum.ClosedNormal, title: '已关闭' },
];

interface StatusFormValues {
  assignedTo?: string;
  investigator?: string;
  changeReason?: string;
  supplementRequirement?: string;
  supplementDueDate?: dayjs.Dayjs;
  supplementMaterialDescription?: string;
  supplementReceived?: boolean;
  escalationReason?: string;
  escalatedTo?: string;
  escalationResponse?: string;
  closeType?: ExceptionCloseType;
}

const ExceptionDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { triggerRefresh } = useAppStore();

  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<ExceptionRecordDetailDto | null>(null);

  const [statusForm] = Form.useForm<StatusFormValues>();
  const [statusModalVisible, setStatusModalVisible] = useState<boolean>(false);
  const [statusLoading, setStatusLoading] = useState<boolean>(false);
  const [currentAction, setCurrentAction] = useState<string>('');
  const [statusFormTitle, setStatusFormTitle] = useState<string>('');

  const [uploadFileList, setUploadFileList] = useState<any[]>([]);

  const fetchData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const detail = await exceptionService.getById(id);
      setData(detail);
    } catch (error) {
      message.error('加载异常详情失败');
      console.error('Exception detail error:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getStepStatus = (index: number) => {
    if (!data) return 'wait';
    const stepStatus = EXCEPTION_STEPS[index].status;
    const currentStatus = data.status;
    if (currentStatus >= stepStatus) return 'finish';
    if (currentStatus === stepStatus) return 'process';
    return 'wait';
  };

  const getCurrentStepIndex = () => {
    if (!data) return 0;
    if (data.status >= ExceptionStatusEnum.ClosedNormal) return 6;
    const idx = EXCEPTION_STEPS.findIndex(s => s.status === data.status);
    return idx >= 0 ? idx : 0;
  };

  const getAvailableActions = () => {
    if (!data) return [];
    const actions: Array<{
      key: string;
      label: string;
      icon: React.ReactNode;
      type?: 'primary' | 'default' | 'dashed' | 'link' | 'text';
      danger?: boolean;
      needsForm?: boolean;
      title?: string;
    }> = [];

    switch (data.status) {
      case ExceptionStatusEnum.Reported:
        actions.push({
          key: 'assign', label: '分配处理人', icon: <UsergroupAddOutlined />, type: 'primary',
          needsForm: true, title: '分配处理人',
        });
        actions.push({
          key: 'investigate', label: '开始调查', icon: <SearchOutlined />, type: 'default',
          needsForm: false, title: '开始调查',
        });
        break;
      case ExceptionStatusEnum.Investigating:
        actions.push({
          key: 'handle', label: '开始处理', icon: <BulbOutlined />, type: 'primary',
          needsForm: false, title: '开始处理',
        });
        actions.push({
          key: 'requestSupplement', label: '请求补充', icon: <SendOutlined />, type: 'default',
          needsForm: true, title: '请求补充材料',
        });
        actions.push({
          key: 'escalate', label: '升级处理', icon: <ArrowUpOutlined />, type: 'default', danger: true,
          needsForm: true, title: '升级处理',
        });
        break;
      case ExceptionStatusEnum.Handling:
        actions.push({
          key: 'resolve', label: '标记解决', icon: <CheckCircleOutlined />, type: 'primary',
          needsForm: false, title: '标记为已解决',
        });
        actions.push({
          key: 'requestSupplement', label: '请求补充', icon: <SendOutlined />, type: 'default',
          needsForm: true, title: '请求补充材料',
        });
        actions.push({
          key: 'escalate', label: '升级处理', icon: <ArrowUpOutlined />, type: 'default', danger: true,
          needsForm: true, title: '升级处理',
        });
        break;
      case ExceptionStatusEnum.PendingSupplement:
        actions.push({
          key: 'submitSupplement', label: '提交补充', icon: <FileDoneOutlined />, type: 'primary',
          needsForm: true, title: '提交补充材料',
        });
        break;
      case ExceptionStatusEnum.Escalated:
        actions.push({
          key: 'resolve', label: '标记解决', icon: <CheckCircleOutlined />, type: 'primary',
          needsForm: false, title: '标记为已解决',
        });
        break;
      case ExceptionStatusEnum.Resolved:
        actions.push({
          key: 'closeNormal', label: '正常关闭', icon: <CloseOutlined />, type: 'primary',
          needsForm: false, title: '正常关闭',
        });
        actions.push({
          key: 'closeWithSupplement', label: '补充材料关闭', icon: <FileDoneOutlined />, type: 'default',
          needsForm: true, title: '补充材料后关闭',
        });
        actions.push({
          key: 'closeEscalated', label: '升级关闭', icon: <ArrowUpOutlined />, type: 'default', danger: true,
          needsForm: true, title: '升级后关闭',
        });
        break;
    }
    return actions;
  };

  const handleActionClick = (action: any) => {
    if (action.needsForm) {
      setCurrentAction(action.key);
      setStatusFormTitle(action.title);
      statusForm.resetFields();
      setStatusModalVisible(true);
    } else {
      Modal.confirm({
        title: action.title,
        content: `确定要对异常单号 ${data?.exceptionNo} 执行「${action.label}」操作吗？`,
        okText: '确认',
        cancelText: '取消',
        onOk: async () => {
          await executeStatusChange(action.key, {});
        },
      });
    }
  };

  const handleStatusFormSubmit = async () => {
    try {
      const values = await statusForm.validateFields();
      await executeStatusChange(currentAction, values);
      setStatusModalVisible(false);
    } catch (error: any) {
      if (error?.errorFields) return;
      message.error('操作失败');
      console.error('Status form submit error:', error);
    }
  };

  const executeStatusChange = async (action: string, values: StatusFormValues) => {
    if (!data) return;
    setStatusLoading(true);
    try {
      const dto: ExceptionStatusChangeDto = {
        operator: 'current_user',
        assignedTo: values.assignedTo,
        investigator: values.investigator,
        changeReason: values.changeReason,
        supplementRequirement: values.supplementRequirement,
        supplementDueDate: values.supplementDueDate?.format('YYYY-MM-DD'),
        supplementMaterialDescription: values.supplementMaterialDescription,
        supplementReceived: values.supplementReceived,
        escalationReason: values.escalationReason,
        escalatedTo: values.escalatedTo,
        escalationResponse: values.escalationResponse,
        closeType: values.closeType,
      };

      switch (action) {
        case 'assign':
          await exceptionService.assignHandler(data.id, dto);
          break;
        case 'investigate':
          dto.investigator = values.investigator || 'current_user';
          await exceptionService.startInvestigation(data.id, dto);
          break;
        case 'handle':
          await exceptionService.startHandling(data.id, dto);
          break;
        case 'resolve':
          await exceptionService.resolve(data.id, dto);
          break;
        case 'requestSupplement':
          await exceptionService.requestSupplement(data.id, dto);
          break;
        case 'submitSupplement':
          dto.supplementReceived = true;
          await exceptionService.submitSupplement(data.id, dto);
          break;
        case 'escalate':
          await exceptionService.escalate(data.id, dto);
          break;
        case 'closeNormal':
          dto.closeType = ExceptionCloseTypeEnum.NormalClose;
          await exceptionService.closeNormal(data.id, dto);
          break;
        case 'closeWithSupplement':
          dto.closeType = ExceptionCloseTypeEnum.SupplementRequired;
          await exceptionService.closeWithSupplement(data.id, dto);
          break;
        case 'closeEscalated':
          dto.closeType = ExceptionCloseTypeEnum.Escalation;
          await exceptionService.closeEscalated(data.id, dto);
          break;
      }

      message.success('操作成功');
      triggerRefresh();
      await fetchData();
    } catch (error) {
      message.error('操作失败');
      console.error('Execute status change error:', error);
    } finally {
      setStatusLoading(false);
    }
  };

  const renderStatusFormContent = () => {
    switch (currentAction) {
      case 'assign':
        return (
          <>
            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="assignedTo"
                  label="分配给（处理人）"
                  rules={[{ required: true, message: '请输入处理人姓名' }]}
                >
                  <Input placeholder="处理人姓名" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="investigator"
                  label="调查员"
                >
                  <Input placeholder="调查员姓名（可选）" />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item name="changeReason" label="分配说明">
              <TextArea rows={3} placeholder="分配说明（可选）" />
            </Form.Item>
          </>
        );
      case 'requestSupplement':
        return (
          <>
            <Form.Item
              name="supplementRequirement"
              label="补充要求"
              rules={[{ required: true, message: '请输入补充要求' }]}
            >
              <TextArea rows={4} placeholder="请详细描述需要补充的材料" />
            </Form.Item>
            <Form.Item
              name="supplementDueDate"
              label="补充截止日"
              rules={[{ required: true, message: '请选择截止日期' }]}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </>
        );
      case 'submitSupplement':
        return (
          <Form.Item
            name="supplementMaterialDescription"
            label="补充材料说明"
            rules={[{ required: true, message: '请输入补充材料说明' }]}
          >
            <TextArea rows={4} placeholder="请描述已提交的补充材料" />
          </Form.Item>
        );
      case 'escalate':
        return (
          <>
            <Form.Item
              name="escalationReason"
              label="升级原因"
              rules={[{ required: true, message: '请输入升级原因' }]}
            >
              <TextArea rows={3} placeholder="请详细说明升级原因" />
            </Form.Item>
            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="escalatedTo"
                  label="升级对象"
                  rules={[{ required: true, message: '请输入升级对象' }]}
                >
                  <Input placeholder="例如：院长办公室 / 医务科" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="escalationResponse"
                  label="升级响应"
                >
                  <Input placeholder="升级响应（可选）" />
                </Form.Item>
              </Col>
            </Row>
          </>
        );
      case 'closeWithSupplement':
        return (
          <>
            <Form.Item
              name="supplementMaterialDescription"
              label="补充材料说明"
              rules={[{ required: true, message: '请输入补充材料说明' }]}
            >
              <TextArea rows={3} placeholder="请描述已补充的材料" />
            </Form.Item>
            <Form.Item name="changeReason" label="关闭说明">
              <TextArea rows={2} placeholder="关闭说明（可选）" />
            </Form.Item>
          </>
        );
      case 'closeEscalated':
        return (
          <>
            <Form.Item
              name="escalationResponse"
              label="升级处理结果"
              rules={[{ required: true, message: '请输入升级处理结果' }]}
            >
              <TextArea rows={3} placeholder="请输入升级后的处理结果" />
            </Form.Item>
            <Form.Item name="changeReason" label="关闭说明">
              <TextArea rows={2} placeholder="关闭说明（可选）" />
            </Form.Item>
          </>
        );
      default:
        return null;
    }
  };

  const isFall = data?.exceptionType === ExceptionTypeEnum.Fall;
  const elder = data?.elder || ({} as ElderDetailDto);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 500 }}>
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ padding: 50 }}>
        <Empty description="未找到异常数据" />
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/exceptions')}>返回列表</Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={`异常详情 - ${data.exceptionNo}`}
        subtitle={`老人：${elder.name || ''} | 当前状态：${data.statusText}`}
        breadcrumb={[
          { title: '业务管理' },
          { title: '异常管理', onClick: () => navigate('/exceptions') },
          { title: data.exceptionNo },
        ]}
        actions={[
          { key: 'back', label: '返回列表', icon: <ArrowLeftOutlined />, onClick: () => navigate('/exceptions') },
        ]}
      />

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={18}>
          <Card style={{ marginBottom: 16 }}>
            <Row align="middle" gutter={16} style={{ marginBottom: 16 }}>
              <Col>
                <Title level={4} style={{ margin: 0 }}>
                  <Space>
                    {isFall ? (
                      <Tag color="red" icon={<FallOutlined style={{ fontSize: 16 }} />} />
                    ) : (
                      <WarningOutlined style={{ color: '#faad14' }} />
                    )}
                    <span style={{ color: isFall ? '#ff4d4f' : undefined }}>
                      {data.exceptionNo}
                    </span>
                  </Space>
                </Title>
              </Col>
              <Col>
                <Space>
                  <ExceptionTypeTag value={data.exceptionType} />
                  <ExceptionSeverityTag value={data.severity} />
                  <ExceptionStatusTag value={data.status} />
                  {data.closeType !== undefined && <ExceptionCloseTypeTag value={data.closeType} />}
                </Space>
              </Col>
            </Row>

            <Steps
              size="small"
              current={getCurrentStepIndex()}
              direction="horizontal"
              responsive
              items={EXCEPTION_STEPS.map((s, i) => ({
                title: s.title,
                status: getStepStatus(i),
              }))}
            />
          </Card>

          <Card style={{ marginBottom: 16 }}>
            <Tabs defaultActiveKey="1">
              <TabPane tab="基本信息" key="1">
                <Descriptions size="small" column={2} bordered style={{ marginBottom: 16 }}>
                  <Descriptions.Item label="异常类型">
                    <ExceptionTypeTag value={data.exceptionType} />
                  </Descriptions.Item>
                  <Descriptions.Item label="严重度">
                    <ExceptionSeverityTag value={data.severity} />
                  </Descriptions.Item>
                  <Descriptions.Item label="发生时间">
                    <Space>
                      <ClockCircleOutlined />
                      <span>{dayjs(data.occurredAt).format('YYYY-MM-DD HH:mm:ss')}</span>
                    </Space>
                  </Descriptions.Item>
                  <Descriptions.Item label="发生地点">
                    {data.occurredLocation ? (
                      <Space>
                        <EnvironmentOutlined />
                        <span>{data.occurredLocation}</span>
                      </Space>
                    ) : '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="创建人">{data.createdBy}</Descriptions.Item>
                  <Descriptions.Item label="处理人">{data.assignedTo || '-'}</Descriptions.Item>
                  <Descriptions.Item label="关联老人" span={2}>
                    {elder.name ? (
                      <Space>
                        <UserOutlined />
                        <a onClick={() => navigate(`/schedules/${data.scheduleId}`)}>
                          {elder.name}（{elder.age}岁）
                        </a>
                        <GenderTag value={elder.gender} />
                        <CareLevelTypeTag value={elder.careLevel?.levelType} />
                        <Tag color="blue">{data.scheduleNo}</Tag>
                      </Space>
                    ) : '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="异常描述" span={2}>
                    <span style={{ fontSize: 13 }}>{data.description || '-'}</span>
                  </Descriptions.Item>
                </Descriptions>

                {isFall && (
                  <Card
                    size="small"
                    title={
                      <Space>
                        <FallOutlined style={{ color: '#ff4d4f' }} />
                        <span style={{ color: '#ff4d4f', fontWeight: 600 }}>跌倒专用信息</span>
                      </Space>
                    }
                    style={{
                      border: '2px solid #ff7875',
                      backgroundColor: '#fff1f0',
                      marginBottom: 16,
                    }}
                    headStyle={{
                      borderBottom: '1px solid #ffccc7',
                      backgroundColor: '#fff2f0',
                    }}
                  >
                    <Descriptions size="small" column={2} bordered>
                      <Descriptions.Item label="现场描述" span={2}>
                        <span style={{ fontSize: 13 }}>{data.fallSceneDescription || '-'}</span>
                      </Descriptions.Item>
                      <Descriptions.Item label="跌倒原因" span={2}>
                        <span style={{ fontSize: 13, color: '#cf1322' }}>
                          {data.fallCause || '-'}
                        </span>
                      </Descriptions.Item>
                      <Descriptions.Item label="跌倒高度">{data.fallHeight || '-'}</Descriptions.Item>
                      <Descriptions.Item label="受伤部位">
                        {data.injuredPart ? (
                          <Tag color="red">{data.injuredPart}</Tag>
                        ) : '-'}
                      </Descriptions.Item>
                      <Descriptions.Item label="初步症状" span={2}>
                        <span style={{ fontSize: 13 }}>{data.initialSymptoms || '-'}</span>
                      </Descriptions.Item>
                      <Descriptions.Item label="现场处置" span={2}>
                        <span style={{ fontSize: 13 }}>{data.onSiteMeasures || '-'}</span>
                      </Descriptions.Item>
                    </Descriptions>
                  </Card>
                )}

                <Descriptions size="small" column={2} bordered title="分配信息">
                  <Descriptions.Item label="分配给">{data.assignedTo || '-'}</Descriptions.Item>
                  <Descriptions.Item label="分配时间">
                    {data.assignedAt ? dayjs(data.assignedAt).format('YYYY-MM-DD HH:mm') : '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="调查员">{data.investigator || '-'}</Descriptions.Item>
                  <Descriptions.Item label="调查开始时间">
                    {data.investigationStartedAt ? dayjs(data.investigationStartedAt).format('YYYY-MM-DD HH:mm') : '-'}
                  </Descriptions.Item>
                </Descriptions>
              </TabPane>

              <TabPane tab="处理过程" key="2">
                <Descriptions size="small" column={1} bordered>
                  <Descriptions.Item label="调查结果">
                    <span style={{ fontSize: 13 }}>{data.investigationResult || '-'}</span>
                  </Descriptions.Item>
                  <Descriptions.Item label="处理措施">
                    <span style={{ fontSize: 13 }}>{data.handlingMeasures || '-'}</span>
                  </Descriptions.Item>
                  <Descriptions.Item label="治疗结果">
                    <span style={{ fontSize: 13 }}>{data.treatmentResult || '-'}</span>
                  </Descriptions.Item>
                  <Descriptions.Item label="根本原因分析">
                    <span style={{ fontSize: 13 }}>{data.rootCauseAnalysis || '-'}</span>
                  </Descriptions.Item>
                  <Descriptions.Item label="纠正措施">
                    <span style={{ fontSize: 13 }}>{data.correctiveActions || '-'}</span>
                  </Descriptions.Item>
                  <Descriptions.Item label="预防措施">
                    <span style={{ fontSize: 13 }}>{data.preventiveMeasures || '-'}</span>
                  </Descriptions.Item>
                </Descriptions>
              </TabPane>

              <TabPane tab="补充材料" key="3">
                <Descriptions size="small" column={2} bordered style={{ marginBottom: 16 }}>
                  <Descriptions.Item label="补充要求">
                    <span style={{ fontSize: 13 }}>{data.supplementRequirement || '-'}</span>
                  </Descriptions.Item>
                  <Descriptions.Item label="补充截止日">
                    {data.supplementDueDate ? dayjs(data.supplementDueDate).format('YYYY-MM-DD') : '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="是否已接收">
                    {data.supplementReceived ? (
                      <Tag color="success">已接收</Tag>
                    ) : (
                      <Tag color="default">未接收</Tag>
                    )}
                  </Descriptions.Item>
                  <Descriptions.Item label="接收时间">
                    {data.supplementReceivedAt ? dayjs(data.supplementReceivedAt).format('YYYY-MM-DD HH:mm') : '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="补充材料说明" span={2}>
                    <span style={{ fontSize: 13 }}>{data.supplementMaterialDescription || '-'}</span>
                  </Descriptions.Item>
                </Descriptions>

                <Divider orientation="left" plain style={{ marginTop: 0 }}>
                  <Space>
                    <PaperClipOutlined />
                    附件列表（{data.attachments?.length || 0}）
                  </Space>
                </Divider>

                <Card size="small" style={{ marginBottom: 16 }}>
                  <Dragger
                    multiple
                    fileList={uploadFileList}
                    onChange={({ fileList }) => setUploadFileList(fileList)}
                    beforeUpload={() => false}
                    style={{ marginBottom: 12 }}
                  >
                    <p className="ant-upload-drag-icon">
                      <InboxOutlined />
                    </p>
                    <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
                    <p className="ant-upload-hint">支持多文件上传</p>
                  </Dragger>
                  <Button type="primary" icon={<UploadOutlined />} onClick={() => message.success('附件已上传（模拟）')}>
                    上传附件
                  </Button>
                </Card>

                {data.attachments && data.attachments.length > 0 ? (
                  <div>
                    {data.attachments.map((att: ExceptionAttachmentDto) => (
                      <Card
                        key={att.id}
                        size="small"
                        style={{ marginBottom: 8 }}
                      >
                        <Row align="middle" justify="space-between">
                          <Col>
                            <Space>
                              <PaperClipOutlined />
                              <span style={{ fontWeight: 500 }}>{att.fileName}</span>
                              {att.fileType && <Tag color="blue">{att.fileType}</Tag>}
                              {att.fileSize && (
                                <span style={{ fontSize: 12, color: '#8c8c8c' }}>
                                  {att.fileSize > 1024 * 1024
                                    ? `${(att.fileSize / 1024 / 1024).toFixed(2)} MB`
                                    : `${(att.fileSize / 1024).toFixed(2)} KB`}
                                </span>
                              )}
                              {att.description && (
                                <span style={{ fontSize: 12, color: '#8c8c8c' }}>
                                  {att.description}
                                </span>
                              )}
                            </Space>
                          </Col>
                          <Col>
                            <Space>
                              <Tooltip title="下载">
                                <Button type="link" icon={<DownloadOutlined />} size="small" />
                              </Tooltip>
                              <Tooltip title="预览">
                                <Button type="link" icon={<EyeOutlined />} size="small" />
                              </Tooltip>
                            </Space>
                          </Col>
                        </Row>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Empty description="暂无附件" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                )}
              </TabPane>

              <TabPane tab="升级处理" key="4">
                <Descriptions size="small" column={2} bordered>
                  <Descriptions.Item label="升级原因">
                    <span style={{ fontSize: 13, color: '#d46b08' }}>
                      {data.escalationReason || '-'}
                    </span>
                  </Descriptions.Item>
                  <Descriptions.Item label="升级时间">
                    {data.escalatedAt ? dayjs(data.escalatedAt).format('YYYY-MM-DD HH:mm') : '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="升级人">{data.escalatedBy || '-'}</Descriptions.Item>
                  <Descriptions.Item label="升级对象">{data.escalatedTo || '-'}</Descriptions.Item>
                  <Descriptions.Item label="升级响应" span={2}>
                    <span style={{ fontSize: 13 }}>{data.escalationResponse || '-'}</span>
                  </Descriptions.Item>
                </Descriptions>
              </TabPane>

              <TabPane tab="结案总结" key="5">
                <Descriptions size="small" column={1} bordered>
                  <Descriptions.Item label="最终结论">
                    <span style={{ fontSize: 13 }}>{data.finalConclusion || '-'}</span>
                  </Descriptions.Item>
                  <Descriptions.Item label="经验教训">
                    <span style={{ fontSize: 13 }}>{data.lessonsLearned || '-'}</span>
                  </Descriptions.Item>
                  <Descriptions.Item label="关闭类型">
                    {data.closeType !== undefined ? (
                      <ExceptionCloseTypeTag value={data.closeType} />
                    ) : '-'}
                  </Descriptions.Item>
                </Descriptions>
              </TabPane>

              <TabPane tab="状态历史" key="6">
                {data.statusHistories && data.statusHistories.length > 0 ? (
                  <Timeline
                    mode="left"
                    style={{ paddingLeft: 0 }}
                    items={data.statusHistories.map((h) => ({
                      color:
                        h.newStatus >= ExceptionStatusEnum.ClosedNormal
                          ? 'gray'
                          : h.newStatus >= ExceptionStatusEnum.Resolved
                          ? 'green'
                          : h.newStatus >= ExceptionStatusEnum.Handling
                          ? 'blue'
                          : h.newStatus >= ExceptionStatusEnum.Investigating
                          ? 'gold'
                          : 'blue',
                      children: (
                        <div style={{ fontSize: 13 }}>
                          <div>
                            <Space>
                              <Tag color="blue">{h.newStatusText}</Tag>
                            </Space>
                          </div>
                          {h.changeReason && (
                            <div style={{ color: '#595959', marginTop: 4 }}>
                              {h.changeReason}
                            </div>
                          )}
                          <div style={{ color: '#8c8c8c', marginTop: 2 }}>
                            {h.changedBy} · {dayjs(h.changedAt).format('YYYY-MM-DD HH:mm')}
                          </div>
                        </div>
                      ),
                      label: (
                        <span style={{ fontSize: 11, color: '#8c8c8c' }}>
                          {dayjs(h.changedAt).format('HH:mm')}
                        </span>
                      ),
                    }))}
                  />
                ) : (
                  <Empty description="暂无状态变更" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                )}
              </TabPane>
            </Tabs>
          </Card>
        </Col>

        <Col xs={24} lg={6}>
          <div
            style={{
              position: 'sticky',
              top: 24,
            }}
          >
            <Card
              title={
                <Space>
                  <InfoCircleOutlined style={{ color: '#1890ff' }} />
                  <span>快捷操作</span>
                </Space>
              }
              style={{ marginBottom: 16 }}
            >
              <Space direction="vertical" style={{ width: '100%' }}>
                {getAvailableActions().length > 0 ? (
                  getAvailableActions().map((action) => (
                    <Button
                      key={action.key}
                      type={action.type}
                      danger={action.danger}
                      icon={action.icon}
                      block
                      onClick={() => handleActionClick(action)}
                    >
                      {action.label}
                    </Button>
                  ))
                ) : (
                  <Text type="secondary" style={{ textAlign: 'center', padding: '12px 0' }}>
                    该状态下无可用操作
                  </Text>
                )}
              </Space>
            </Card>

            <Card
              size="small"
              title={
                <Space>
                  <UserOutlined style={{ color: '#722ed1' }} />
                  <span>老人档案</span>
                </Space>
              }
              style={{ marginBottom: 16 }}
            >
              <Descriptions size="small" column={1} bordered>
                <Descriptions.Item label="姓名">{elder.name || '-'}</Descriptions.Item>
                <Descriptions.Item label="性别">
                  <GenderTag value={elder.gender} />
                </Descriptions.Item>
                <Descriptions.Item label="年龄">{elder.age ? `${elder.age}岁` : '-'}</Descriptions.Item>
                <Descriptions.Item label="护理等级">
                  <CareLevelTypeTag value={elder.careLevel?.levelType} />
                </Descriptions.Item>
                <Descriptions.Item label="联系电话">{elder.phoneNumber || '-'}</Descriptions.Item>
                <Descriptions.Item label="紧急联系人">{elder.emergencyContact || '-'}</Descriptions.Item>
              </Descriptions>
            </Card>

            {elder.medicalHistory || elder.allergyInfo ? (
              <Alert
                type="warning"
                showIcon
                icon={<ExclamationCircleOutlined />}
                message="健康提示"
                description={
                  <div style={{ fontSize: 12 }}>
                    {elder.medicalHistory && (
                      <div>
                        <strong>病史：</strong>
                        {elder.medicalHistory}
                      </div>
                    )}
                    {elder.allergyInfo && (
                      <div>
                        <strong>过敏史：</strong>
                        {elder.allergyInfo}
                      </div>
                    )}
                    {elder.dietaryRequirements && (
                      <div>
                        <strong>饮食要求：</strong>
                        {elder.dietaryRequirements}
                      </div>
                    )}
                  </div>
                }
              />
            ) : null}
          </div>
        </Col>
      </Row>

      <Modal
        title={statusFormTitle}
        width={600}
        open={statusModalVisible}
        onCancel={() => setStatusModalVisible(false)}
        onOk={handleStatusFormSubmit}
        confirmLoading={statusLoading}
        maskClosable={false}
        okText="确认"
        cancelText="取消"
      >
        {data && (
          <Alert
            message={`异常单号：${data.exceptionNo}`}
            description={`老人：${elder.name}，当前状态：${data.statusText}`}
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}
        <Form layout="vertical" form={statusForm} preserve={false}>
          {renderStatusFormContent()}
        </Form>
      </Modal>
    </div>
  );
};

export default ExceptionDetail;
