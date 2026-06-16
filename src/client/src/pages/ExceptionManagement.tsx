import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Form,
  Modal,
  Table,
  Card,
  Button,
  Space,
  Row,
  Col,
  Input,
  DatePicker,
  Spin,
  message,
  Popconfirm,
  Tag,
  Tooltip,
  Divider,
  Select,
  Alert,
} from 'antd';
import {
  SearchOutlined,
  PlusOutlined,
  EyeOutlined,
  ReloadOutlined,
  WarningOutlined,
  FallOutlined,
  UserOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
  UsergroupAddOutlined,
  SearchOutlined as SearchIcon,
  BulbOutlined,
  SendOutlined,
  ArrowUpOutlined,
  CloseOutlined,
  FileDoneOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import PageHeader from '@/components/PageHeader';
import {
  ExceptionTypeSelect,
  ExceptionSeveritySelect,
  ExceptionStatusSelect,
  ExceptionCloseTypeSelect,
} from '@/components/EnumSelect';
import {
  ExceptionTypeTag,
  ExceptionSeverityTag,
  ExceptionStatusTag,
  ExceptionCloseTypeTag,
  ScheduleStatusTag,
} from '@/components/StatusTag';
import { exceptionService } from '@/services/exceptionService';
import { elderService } from '@/services/elderService';
import { scheduleService } from '@/services/scheduleService';
import type {
  ExceptionRecordListDto,
  ExceptionQueryDto,
  PagedResultDto,
  CreateExceptionRecordDto,
  ExceptionStatusChangeDto,
  ExceptionType,
  ExceptionSeverity,
  ExceptionStatus,
  ExceptionCloseType,
  ElderListDto,
  ScheduleListDto,
} from '@/types';
import { useAppStore } from '@/store/useAppStore';
import {
  ExceptionType as ExceptionTypeEnum,
  ExceptionSeverity as ExceptionSeverityEnum,
  ExceptionStatus as ExceptionStatusEnum,
  ExceptionCloseType as ExceptionCloseTypeEnum,
} from '@/types';

const { RangePicker } = DatePicker;
const { TextArea } = Input;

interface QueryFormValues {
  keyword?: string;
  exceptionType?: ExceptionType;
  severity?: ExceptionSeverity;
  status?: ExceptionStatus;
  closeType?: ExceptionCloseType;
  elderId?: string;
  scheduleId?: string;
  occurredFrom?: dayjs.Dayjs;
  occurredTo?: dayjs.Dayjs;
  assignedTo?: string;
}

interface CreateFormValues {
  scheduleId?: string;
  elderId: string;
  exceptionType: ExceptionType;
  severity: ExceptionSeverity;
  occurredAt: dayjs.Dayjs;
  occurredLocation?: string;
  description: string;
  fallSceneDescription?: string;
  fallCause?: string;
  fallHeight?: string;
  injuredPart?: string;
  initialSymptoms?: string;
  onSiteMeasures?: string;
}

interface StatusFormValues {
  assignedTo?: string;
  investigator?: string;
  changeReason?: string;
  supplementRequirement?: string;
  supplementDueDate?: dayjs.Dayjs;
  supplementMaterialDescription?: string;
  escalationReason?: string;
  escalatedTo?: string;
  escalationResponse?: string;
  closeType?: ExceptionCloseType;
}

const ExceptionManagement: React.FC = () => {
  const navigate = useNavigate();
  const { triggerRefresh, refreshTrigger } = useAppStore();

  const [queryForm] = Form.useForm<QueryFormValues>();
  const [createForm] = Form.useForm<CreateFormValues>();
  const [statusForm] = Form.useForm<StatusFormValues>();

  const [loading, setLoading] = useState<boolean>(false);
  const [data, setData] = useState<ExceptionRecordListDto[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [pageIndex, setPageIndex] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);

  const [createModalVisible, setCreateModalVisible] = useState<boolean>(false);
  const [createLoading, setCreateLoading] = useState<boolean>(false);

  const [statusModalVisible, setStatusModalVisible] = useState<boolean>(false);
  const [statusLoading, setStatusLoading] = useState<boolean>(false);
  const [currentRecord, setCurrentRecord] = useState<ExceptionRecordListDto | null>(null);
  const [currentAction, setCurrentAction] = useState<string>('');
  const [statusFormTitle, setStatusFormTitle] = useState<string>('');

  const [elders, setElders] = useState<ElderListDto[]>([]);
  const [schedules, setSchedules] = useState<ScheduleListDto[]>([]);

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [elderList, scheduleList] = await Promise.all([
          elderService.getList({ pageIndex: 1, pageSize: 999, isActive: true }),
          scheduleService.getList({ pageIndex: 1, pageSize: 999 }),
        ]);
        setElders(elderList.items);
        setSchedules(scheduleList.items);
      } catch (error) {
        console.error('Load options error:', error);
      }
    };
    loadOptions();
  }, []);

  const fetchData = useCallback(async (query: ExceptionQueryDto) => {
    setLoading(true);
    try {
      const result: PagedResultDto<ExceptionRecordListDto> = await exceptionService.getList({
        ...query,
        pageIndex,
        pageSize,
      });
      setData(result.items);
      setTotal(result.totalCount);
    } catch (error) {
      message.error('加载异常列表失败');
      console.error('Exception list error:', error);
    } finally {
      setLoading(false);
    }
  }, [pageIndex, pageSize]);

  useEffect(() => {
    fetchData({});
  }, [fetchData, refreshTrigger]);

  const handleSearch = () => {
    const values = queryForm.getFieldsValue();
    setPageIndex(1);
    fetchData({
      keyword: values.keyword || undefined,
      exceptionType: values.exceptionType,
      severity: values.severity,
      status: values.status,
      closeType: values.closeType,
      elderId: values.elderId,
      scheduleId: values.scheduleId,
      occurredFrom: values.occurredFrom?.format('YYYY-MM-DD'),
      occurredTo: values.occurredTo?.format('YYYY-MM-DD'),
      assignedTo: values.assignedTo || undefined,
    });
  };

  const handleReset = () => {
    queryForm.resetFields();
    setPageIndex(1);
    fetchData({});
  };

  const handleOpenCreate = () => {
    createForm.resetFields();
    createForm.setFieldsValue({
      exceptionType: ExceptionTypeEnum.Fall,
      severity: ExceptionSeverityEnum.High,
      occurredAt: dayjs(),
    });
    setCreateModalVisible(true);
  };

  const handleCreate = async () => {
    try {
      const values = await createForm.validateFields();
      setCreateLoading(true);

      let scheduleId = values.scheduleId;
      if (!scheduleId && schedules.length > 0) {
        const matched = schedules.find(s => s.elderId === values.elderId);
        if (matched) scheduleId = matched.id;
      }

      const dto: CreateExceptionRecordDto = {
        scheduleId: scheduleId || schedules[0]?.id || '',
        elderId: values.elderId,
        exceptionType: values.exceptionType,
        severity: values.severity,
        occurredAt: values.occurredAt.format('YYYY-MM-DD HH:mm:ss'),
        occurredLocation: values.occurredLocation,
        description: values.description,
        fallSceneDescription: values.fallSceneDescription,
        fallCause: values.fallCause,
        fallHeight: values.fallHeight,
        injuredPart: values.injuredPart,
        initialSymptoms: values.initialSymptoms,
        onSiteMeasures: values.onSiteMeasures,
        createdBy: 'current_user',
      };
      await exceptionService.create(dto);
      message.success('创建异常记录成功');
      setCreateModalVisible(false);
      triggerRefresh();
    } catch (error: any) {
      if (error?.errorFields) return;
      message.error('创建异常记录失败');
      console.error('Exception create error:', error);
    } finally {
      setCreateLoading(false);
    }
  };

  const getAvailableActions = (record: ExceptionRecordListDto) => {
    const actions: Array<{
      key: string;
      label: string;
      icon: React.ReactNode;
      danger?: boolean;
      needsForm?: boolean;
      title?: string;
    }> = [];

    switch (record.status) {
      case ExceptionStatusEnum.Reported:
        actions.push({ key: 'assign', label: '分配', icon: <UsergroupAddOutlined />, needsForm: true, title: '分配处理人' });
        actions.push({ key: 'investigate', label: '开始调查', icon: <SearchIcon />, needsForm: false, title: '开始调查' });
        break;
      case ExceptionStatusEnum.Investigating:
        actions.push({ key: 'handle', label: '开始处理', icon: <BulbOutlined />, needsForm: false, title: '开始处理' });
        actions.push({ key: 'requestSupplement', label: '请求补充', icon: <SendOutlined />, needsForm: true, title: '请求补充材料' });
        actions.push({ key: 'escalate', label: '升级', icon: <ArrowUpOutlined />, danger: true, needsForm: true, title: '升级处理' });
        break;
      case ExceptionStatusEnum.Handling:
        actions.push({ key: 'resolve', label: '标记解决', icon: <CheckCircleOutlined />, needsForm: false, title: '标记为已解决' });
        actions.push({ key: 'requestSupplement', label: '请求补充', icon: <SendOutlined />, needsForm: true, title: '请求补充材料' });
        actions.push({ key: 'escalate', label: '升级', icon: <ArrowUpOutlined />, danger: true, needsForm: true, title: '升级处理' });
        break;
      case ExceptionStatusEnum.PendingSupplement:
        actions.push({ key: 'submitSupplement', label: '提交补充', icon: <FileDoneOutlined />, needsForm: true, title: '提交补充材料' });
        break;
      case ExceptionStatusEnum.Escalated:
        actions.push({ key: 'resolve', label: '标记解决', icon: <CheckCircleOutlined />, needsForm: false, title: '标记为已解决' });
        break;
      case ExceptionStatusEnum.Resolved:
        actions.push({ key: 'closeNormal', label: '正常关闭', icon: <CloseOutlined />, needsForm: false, title: '正常关闭' });
        actions.push({ key: 'closeWithSupplement', label: '补充后关闭', icon: <FileDoneOutlined />, needsForm: true, title: '补充材料后关闭' });
        actions.push({ key: 'closeEscalated', label: '升级后关闭', icon: <ArrowUpOutlined />, danger: true, needsForm: true, title: '升级后关闭' });
        break;
    }
    return actions;
  };

  const handleActionClick = (record: ExceptionRecordListDto, action: any) => {
    if (action.needsForm) {
      setCurrentRecord(record);
      setCurrentAction(action.key);
      setStatusFormTitle(action.title);
      statusForm.resetFields();
      setStatusModalVisible(true);
    } else {
      Modal.confirm({
        title: action.title,
        content: `确定要对异常单号 ${record.exceptionNo} 执行「${action.label}」操作吗？`,
        okText: '确认',
        cancelText: '取消',
        onOk: async () => {
          await executeStatusChange(action.key, record, {});
        },
      });
    }
  };

  const handleStatusFormSubmit = async () => {
    if (!currentRecord) return;
    try {
      const values = await statusForm.validateFields();
      await executeStatusChange(currentAction, currentRecord, values);
      setStatusModalVisible(false);
    } catch (error: any) {
      if (error?.errorFields) return;
      message.error('操作失败');
      console.error('Status form submit error:', error);
    }
  };

  const executeStatusChange = async (
    action: string,
    record: ExceptionRecordListDto,
    values: StatusFormValues
  ) => {
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
        escalationReason: values.escalationReason,
        escalatedTo: values.escalatedTo,
        escalationResponse: values.escalationResponse,
        closeType: values.closeType,
      };

      switch (action) {
        case 'assign':
          await exceptionService.assignHandler(record.id, dto);
          break;
        case 'investigate':
          dto.investigator = values.assignedTo || 'current_user';
          await exceptionService.startInvestigation(record.id, dto);
          break;
        case 'handle':
          await exceptionService.startHandling(record.id, dto);
          break;
        case 'resolve':
          await exceptionService.resolve(record.id, dto);
          break;
        case 'requestSupplement':
          await exceptionService.requestSupplement(record.id, dto);
          break;
        case 'submitSupplement':
          dto.supplementReceived = true;
          await exceptionService.submitSupplement(record.id, dto);
          break;
        case 'escalate':
          await exceptionService.escalate(record.id, dto);
          break;
        case 'closeNormal':
          dto.closeType = ExceptionCloseTypeEnum.NormalClose;
          await exceptionService.closeNormal(record.id, dto);
          break;
        case 'closeWithSupplement':
          dto.closeType = ExceptionCloseTypeEnum.SupplementRequired;
          await exceptionService.closeWithSupplement(record.id, dto);
          break;
        case 'closeEscalated':
          dto.closeType = ExceptionCloseTypeEnum.Escalation;
          await exceptionService.closeEscalated(record.id, dto);
          break;
      }

      message.success('操作成功');
      triggerRefresh();
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
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="assignedTo"
                label="分配给"
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
            <Col xs={24}>
              <Form.Item name="changeReason" label="分配说明">
                <TextArea rows={3} placeholder="分配说明（可选）" />
              </Form.Item>
            </Col>
          </Row>
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
                <Form.Item name="escalationResponse" label="升级响应">
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

  const columns = useMemo(() => [
    {
      title: '异常单号',
      dataIndex: 'exceptionNo',
      key: 'exceptionNo',
      width: 130,
      fixed: 'left' as const,
      render: (text: string, record: ExceptionRecordListDto) => (
        <a
          onClick={() => navigate(`/exceptions/${record.id}`)}
          style={{
            fontWeight: 500,
            color: record.exceptionType === ExceptionTypeEnum.Fall ? '#ff4d4f' : undefined,
          }}
        >
          <Space>
            {record.exceptionType === ExceptionTypeEnum.Fall ? <FallOutlined style={{ color: '#ff4d4f' }} /> : <WarningOutlined />}
            {text}
          </Space>
        </a>
      ),
    },
    {
      title: '排班单号',
      dataIndex: 'scheduleNo',
      key: 'scheduleNo',
      width: 130,
      render: (text?: string) => text || '-',
    },
    {
      title: '老人',
      dataIndex: 'elderName',
      key: 'elderName',
      width: 90,
      render: (text: string) => (
        <Space>
          <UserOutlined />
          <span>{text}</span>
        </Space>
      ),
    },
    {
      title: '类型',
      dataIndex: 'exceptionType',
      key: 'exceptionType',
      width: 90,
      render: (val: ExceptionType) => {
        const isFall = val === ExceptionTypeEnum.Fall;
        return (
          <Tag
            color={isFall ? 'red' : undefined}
            icon={isFall ? <FallOutlined /> : undefined}
            style={{
              fontWeight: isFall ? 600 : undefined,
              border: isFall ? '1px solid #ff4d4f' : undefined,
            }}
          >
            <ExceptionTypeTag value={val} />
          </Tag>
        );
      },
    },
    {
      title: '严重度',
      dataIndex: 'severity',
      key: 'severity',
      width: 80,
      render: (val: ExceptionSeverity, record: ExceptionRecordListDto) => {
        const isFall = record.exceptionType === ExceptionTypeEnum.Fall;
        const isHigh = val >= ExceptionSeverityEnum.High;
        return (
          <Tag
            color={isFall && isHigh ? 'red' : undefined}
            style={{
              fontWeight: isFall && isHigh ? 600 : undefined,
            }}
          >
            <ExceptionSeverityTag value={val} />
          </Tag>
        );
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (val: ExceptionStatus) => <ExceptionStatusTag value={val} />,
    },
    {
      title: '关闭类型',
      dataIndex: 'closeType',
      key: 'closeType',
      width: 100,
      render: (val?: ExceptionCloseType) => val !== undefined ? <ExceptionCloseTypeTag value={val} /> : '-',
    },
    {
      title: '发生时间',
      dataIndex: 'occurredAt',
      key: 'occurredAt',
      width: 150,
      render: (val: string) => (
        <Space direction="vertical" size={0}>
          <span style={{ fontSize: 12 }}>{dayjs(val).format('YYYY-MM-DD')}</span>
          <span style={{ fontSize: 11, color: '#8c8c8c' }}>{dayjs(val).format('HH:mm')}</span>
        </Space>
      ),
    },
    {
      title: '地点',
      dataIndex: 'occurredLocation',
      key: 'occurredLocation',
      width: 110,
      render: (val?: string) => val ? (
        <Space size={4}>
          <EnvironmentOutlined style={{ fontSize: 11, color: '#8c8c8c' }} />
          <span style={{ fontSize: 12 }}>{val}</span>
        </Space>
      ) : '-',
    },
    {
      title: '处理人',
      dataIndex: 'assignedTo',
      key: 'assignedTo',
      width: 90,
      render: (val?: string) => val || '-',
    },
    {
      title: '操作',
      key: 'actions',
      width: 380,
      fixed: 'right' as const,
      render: (_: unknown, record: ExceptionRecordListDto) => {
        const actions = getAvailableActions(record);
        return (
          <Space size="small" wrap>
            <Tooltip title="查看详情">
              <Button
                type="link"
                size="small"
                icon={<EyeOutlined />}
                onClick={() => navigate(`/exceptions/${record.id}`)}
              >
                详情
              </Button>
            </Tooltip>
            {actions.map((action) => (
              <Popconfirm
                key={action.key}
                title={`确定要${action.label}吗？`}
                onConfirm={() => handleActionClick(record, action)}
                okText="确认"
                cancelText="取消"
                disabled={action.needsForm}
              >
                <Button
                  type="link"
                  size="small"
                  icon={action.icon}
                  danger={action.danger}
                  onClick={(e) => {
                    if (action.needsForm) {
                      e.stopPropagation();
                      handleActionClick(record, action);
                    }
                  }}
                >
                  {action.label}
                </Button>
              </Popconfirm>
            ))}
          </Space>
        );
      },
    },
  ], [navigate]);

  const isFallType = Form.useWatch('exceptionType', createForm) === ExceptionTypeEnum.Fall;

  return (
    <div>
      <PageHeader
        title="异常管理"
        subtitle="管理养老院异常事件，包括跌倒、用药错误等全流程跟踪处理"
        breadcrumb={[{ title: '业务管理' }, { title: '异常管理' }]}
        actions={[
          { key: 'create', label: '新建异常', icon: <PlusOutlined />, type: 'primary', danger: true, onClick: handleOpenCreate },
          { key: 'refresh', label: '刷新', icon: <ReloadOutlined />, onClick: handleReset },
        ]}
      />

      <Card style={{ marginBottom: 16 }}>
        <Form layout="vertical" form={queryForm} onFinish={handleSearch}>
          <Row gutter={16}>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item name="keyword" label="关键词">
                <Input placeholder="单号/老人名/描述" allowClear prefix={<SearchOutlined />} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item name="exceptionType" label="异常类型">
                <ExceptionTypeSelect placeholder="请选择类型" allowClear />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item name="severity" label="严重度">
                <ExceptionSeveritySelect placeholder="请选择严重度" allowClear />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item name="status" label="状态">
                <ExceptionStatusSelect placeholder="请选择状态" allowClear />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item name="closeType" label="关闭类型">
                <ExceptionCloseTypeSelect placeholder="请选择关闭类型" allowClear />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item name="elderId" label="老人">
                <Select
                  placeholder="请选择老人"
                  allowClear
                  showSearch
                  optionFilterProp="children"
                  options={elders.map((e) => ({ label: `${e.name}（${e.age}岁）`, value: e.id }))}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item name="scheduleId" label="排班ID">
                <Select
                  placeholder="请选择排班"
                  allowClear
                  showSearch
                  optionFilterProp="children"
                  options={schedules.map((s) => ({ label: `${s.scheduleNo} - ${s.elderName}`, value: s.id }))}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item name={['occurredFrom', 'occurredTo']} label="发生时间范围">
                <RangePicker showTime style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item name="assignedTo" label="处理人">
                <Input placeholder="处理人姓名" allowClear />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={16} lg={18}>
              <Form.Item style={{ marginBottom: 0 }}>
                <Space>
                  <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>查询</Button>
                  <Button onClick={handleReset} icon={<ReloadOutlined />}>重置</Button>
                </Space>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>

      <Card>
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1800 }}
          pagination={{
            current: pageIndex,
            pageSize,
            total,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50', '100'],
            showQuickJumper: true,
            showTotal: (t) => `共 ${t} 条`,
            onChange: (p, ps) => {
              setPageIndex(p);
              setPageSize(ps);
            },
          }}
        />
      </Card>

      <Modal
        title={
          <Space>
            <WarningOutlined style={{ color: '#ff4d4f' }} />
            <span>新建异常记录</span>
            <Tag color="red" icon={<FallOutlined />}>默认跌倒类型</Tag>
          </Space>
        }
        width={800}
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        onOk={handleCreate}
        confirmLoading={createLoading}
        maskClosable={false}
        okText="提交"
        cancelText="取消"
      >
        <Alert
          type="warning"
          showIcon
          message="跌倒异常重点关注"
          description="请务必填写下方跌倒专用字段，便于后续原因分析和预防措施制定"
          style={{ marginBottom: 16 }}
        />
        <Form layout="vertical" form={createForm} preserve={false}>
          <Divider orientation="left" plain>基础信息</Divider>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="elderId"
                label="选择老人"
                rules={[{ required: true, message: '请选择老人' }]}
              >
                <Select
                  placeholder="请选择老人"
                  showSearch
                  optionFilterProp="children"
                  options={elders.map((e) => ({ label: `${e.name}（${e.age}岁）`, value: e.id }))}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="scheduleId" label="关联排班">
                <Select
                  placeholder="请选择关联排班（可选）"
                  showSearch
                  optionFilterProp="children"
                  options={schedules.map((s) => ({ label: `${s.scheduleNo} - ${s.elderName}`, value: s.id }))}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item
                name="exceptionType"
                label="异常类型"
                rules={[{ required: true, message: '请选择异常类型' }]}
              >
                <ExceptionTypeSelect />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item
                name="severity"
                label="严重度"
                rules={[{ required: true, message: '请选择严重度' }]}
              >
                <ExceptionSeveritySelect />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item
                name="occurredAt"
                label="发生时间"
                rules={[{ required: true, message: '请选择发生时间' }]}
              >
                <DatePicker showTime style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item name="occurredLocation" label="发生地点">
                <Input placeholder="例如：3楼东侧卫生间 / 201房间" />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item
                name="description"
                label="异常描述"
                rules={[{ required: true, message: '请输入异常描述' }]}
              >
                <TextArea rows={3} placeholder="请详细描述异常情况" />
              </Form.Item>
            </Col>
          </Row>

          {isFallType && (
            <>
              <Divider orientation="left" plain style={{ borderColor: '#ffa39e' }}>
                <span style={{ color: '#ff4d4f', fontWeight: 600 }}>
                  <FallOutlined /> 跌倒专用信息
                </span>
              </Divider>
              <Card
                size="small"
                style={{
                  marginBottom: 16,
                  border: '1px solid #ffa39e',
                  backgroundColor: '#fff1f0',
                }}
              >
                <Row gutter={16}>
                  <Col xs={24} sm={12}>
                    <Form.Item name="fallSceneDescription" label="现场描述">
                      <TextArea rows={2} placeholder="跌倒时的现场情况描述" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item name="fallCause" label="跌倒原因">
                      <TextArea rows={2} placeholder="初步判断的跌倒原因" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Form.Item name="fallHeight" label="跌倒高度">
                      <Select
                        placeholder="请选择"
                        allowClear
                        options={[
                          { label: '从地面滑倒', value: 'ground' },
                          { label: '从床/椅（<50cm）', value: 'low' },
                          { label: '从高处（50-100cm）', value: 'medium' },
                          { label: '从高处（>100cm）', value: 'high' },
                        ]}
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Form.Item name="injuredPart" label="受伤部位">
                      <Select
                        mode="multiple"
                        placeholder="请选择"
                        allowClear
                        options={[
                          { label: '头部', value: 'head' },
                          { label: '上肢（手臂/手腕）', value: 'upper' },
                          { label: '下肢（腿/脚踝）', value: 'lower' },
                          { label: '躯干（胸/背/腰）', value: 'torso' },
                          { label: '其他', value: 'other' },
                        ]}
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Form.Item name="initialSymptoms" label="初步症状">
                      <Input placeholder="例如：擦伤、淤青、意识模糊等" />
                    </Form.Item>
                  </Col>
                  <Col xs={24}>
                    <Form.Item name="onSiteMeasures" label="现场处置">
                      <TextArea rows={2} placeholder="已采取的现场急救/处理措施" />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>
            </>
          )}
        </Form>
      </Modal>

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
        {currentRecord && (
          <Alert
            message={`异常单号：${currentRecord.exceptionNo}`}
            description={`老人：${currentRecord.elderName}，当前状态：${currentRecord.statusText}`}
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

export default ExceptionManagement;
