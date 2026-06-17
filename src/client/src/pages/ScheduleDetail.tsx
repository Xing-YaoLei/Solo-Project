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
  Radio,
  DatePicker,
  Table,
  Empty,
  Popconfirm,
  Tooltip,
  Drawer,
  Select,
  Alert,
  Collapse,
  Typography,
} from 'antd';
import {
  ArrowLeftOutlined,
  EditOutlined,
  AuditOutlined,
  CheckOutlined,
  CloseOutlined,
  PlayCircleOutlined,
  StopOutlined,
  FileDoneOutlined,
  PlusOutlined,
  DeleteOutlined,
  MedicineBoxOutlined,
  WarningOutlined,
  EyeOutlined,
  FallOutlined,
  UserOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  HeartOutlined,
  AlertOutlined,
  HomeOutlined,
  TeamOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
  HistoryOutlined,
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import PageHeader from '@/components/PageHeader';
import {
  ScheduleStatusTag,
  CareLevelTypeTag,
  GenderTag,
  SourceTypeTag,
  ShiftTypeTag,
  CareStandardTag,
  ExceptionStatusTag,
  ExceptionTypeTag,
  ExceptionSeverityTag,
} from '@/components/StatusTag';
import {
  ShiftTypeSelect,
} from '@/components/EnumSelect';
import { scheduleService } from '@/services/scheduleService';
import { elderService } from '@/services/elderService';
import { exceptionService } from '@/services/exceptionService';
import type {
  ScheduleDetailDto,
  ScheduleStatusChangeDto,
  MedicationDto,
  CreateMedicationDto,
  CreateExceptionRecordDto,
  ExceptionType,
  ExceptionSeverity,
  ShiftType,
  CareStandard,
  ElderDetailDto,
} from '@/types';
import { useAppStore } from '@/store/useAppStore';
import {
  ScheduleStatus,
  ExceptionType as ExceptionTypeEnum,
  ExceptionSeverity as ExceptionSeverityEnum,
  ShiftType as ShiftTypeEnum,
} from '@/types';

const { Step } = Steps;
const { Panel } = Collapse;
const { TextArea } = Input;
const { Title, Text } = Typography;

interface StatusFormValues {
  changeReason?: string;
  reviewComments?: string;
  postReviewSummary?: string;
  careStandard?: CareStandard;
}

interface MedicationFormValues {
  drugName: string;
  genericName?: string;
  specification?: string;
  dosage?: string;
  frequency?: string;
  administrationRoute?: string;
  usageInstructions?: string;
  startDate?: dayjs.Dayjs;
  endDate?: dayjs.Dayjs;
  prescribingDoctor?: string;
  precautions?: string;
  remainingQuantity?: number;
  storageConditions?: string;
}

interface ExceptionFormValues {
  exceptionType: ExceptionType;
  severity: ExceptionSeverity;
  occurredAt: dayjs.Dayjs;
  occurredLocation?: string;
  description: string;
}

const SCHEDULE_STEPS = [
  { status: ScheduleStatus.Draft, title: '草稿' },
  { status: ScheduleStatus.Submitted, title: '已提交' },
  { status: ScheduleStatus.UnderReview, title: '审核中' },
  { status: ScheduleStatus.ReviewApproved, title: '已审核' },
  { status: ScheduleStatus.InProgress, title: '进行中' },
  { status: ScheduleStatus.Completed, title: '已完成' },
  { status: ScheduleStatus.UnderReviewPost, title: '复盘中' },
  { status: ScheduleStatus.Reviewed, title: '已复盘' },
  { status: ScheduleStatus.Closed, title: '已关闭' },
];

const ScheduleDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { triggerRefresh } = useAppStore();

  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<ScheduleDetailDto | null>(null);

  const [statusForm] = Form.useForm<StatusFormValues>();
  const [medicationForm] = Form.useForm<MedicationFormValues>();
  const [exceptionForm] = Form.useForm<ExceptionFormValues>();

  const [statusModalVisible, setStatusModalVisible] = useState<boolean>(false);
  const [statusLoading, setStatusLoading] = useState<boolean>(false);
  const [currentAction, setCurrentAction] = useState<string>('');
  const [statusFormTitle, setStatusFormTitle] = useState<string>('');
  const [statusFormTip, setStatusFormTip] = useState<string>('');

  const [medicationCollapseActive, setMedicationCollapseActive] = useState<string | string[]>([]);
  const [medicationLoading, setMedicationLoading] = useState<boolean>(false);

  const [exceptionModalVisible, setExceptionModalVisible] = useState<boolean>(false);
  const [exceptionLoading, setExceptionLoading] = useState<boolean>(false);

  const fetchData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const detail = await scheduleService.getById(id);
      setData(detail);
    } catch (error) {
      message.error('加载排班详情失败');
      console.error('Schedule detail error:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getStepStatus = (index: number) => {
    if (!data) return 'wait';
    const stepStatus = SCHEDULE_STEPS[index].status;
    const currentStatus = data.status;
    if (currentStatus >= stepStatus) return 'finish';
    if (currentStatus === stepStatus) return 'process';
    return 'wait';
  };

  const getCurrentStepIndex = () => {
    if (!data) return 0;
    const idx = SCHEDULE_STEPS.findIndex(s => s.status === data.status);
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
      tip?: string;
    }> = [];

    switch (data.status) {
      case ScheduleStatus.Draft:
        actions.push({
          key: 'submit', label: '提交审核', icon: <AuditOutlined />, type: 'primary',
          needsForm: false, title: '提交审核', tip: '确定要提交排班审核吗？',
        });
        actions.push({
          key: 'edit', label: '继续编辑', icon: <EditOutlined />, type: 'default',
        });
        break;
      case ScheduleStatus.Submitted:
      case ScheduleStatus.UnderReview:
        actions.push({
          key: 'approve', label: '审核通过', icon: <CheckOutlined />, type: 'primary',
          needsForm: true, title: '审核通过', tip: '请输入审核意见',
        });
        actions.push({
          key: 'reject', label: '审核拒绝', icon: <CloseOutlined />, danger: true,
          needsForm: true, title: '审核拒绝', tip: '请输入拒绝原因',
        });
        break;
      case ScheduleStatus.ReviewApproved:
      case ScheduleStatus.ReviewRejected:
        actions.push({
          key: 'start', label: '开始处理', icon: <PlayCircleOutlined />, type: 'primary',
          needsForm: false, title: '开始处理', tip: '确定要开始处理吗？',
        });
        break;
      case ScheduleStatus.InProgress:
      case ScheduleStatus.Processing:
      case ScheduleStatus.ExceptionOccurred:
        actions.push({
          key: 'complete', label: '完成处理', icon: <StopOutlined />, type: 'primary',
          needsForm: false, title: '完成处理', tip: '确定要完成处理吗？',
        });
        actions.push({
          key: 'recordException', label: '记录异常', icon: <WarningOutlined />, danger: true,
        });
        break;
      case ScheduleStatus.Completed:
        actions.push({
          key: 'postSubmit', label: '提交复盘', icon: <FileDoneOutlined />, type: 'primary',
          needsForm: false, title: '提交复盘', tip: '确定要提交复盘吗？',
        });
        break;
      case ScheduleStatus.UnderReviewPost:
        actions.push({
          key: 'postComplete', label: '完成复盘', icon: <FileDoneOutlined />, type: 'primary',
          needsForm: true, title: '完成复盘', tip: '请填写护理达标评分和复盘总结',
        });
        break;
      case ScheduleStatus.Reviewed:
        actions.push({
          key: 'close', label: '关闭单据', icon: <CloseOutlined />, danger: true,
          needsForm: true, title: '关闭单据', tip: '请输入关闭原因',
        });
        break;
    }
    return actions;
  };

  const handleActionClick = (action: any) => {
    if (action.key === 'edit') {
      message.info('编辑功能可在列表页操作');
      return;
    }
    if (action.key === 'recordException') {
      exceptionForm.resetFields();
      exceptionForm.setFieldsValue({
        exceptionType: ExceptionTypeEnum.Fall,
        severity: ExceptionSeverityEnum.High,
        occurredAt: dayjs(),
      });
      setExceptionModalVisible(true);
      return;
    }
    if (action.needsForm) {
      setCurrentAction(action.key);
      setStatusFormTitle(action.title);
      setStatusFormTip(action.tip);
      statusForm.resetFields();
      setStatusModalVisible(true);
    } else {
      Modal.confirm({
        title: action.title,
        content: action.tip,
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
      const dto: ScheduleStatusChangeDto = {
        operator: 'current_user',
        changeReason: values.changeReason,
        reviewComments: values.reviewComments,
        postReviewSummary: values.postReviewSummary,
        careStandard: values.careStandard,
      };

      switch (action) {
        case 'submit':
          await scheduleService.submitForReview(data.id, dto);
          break;
        case 'approve':
          dto.reviewResult = 1;
          await scheduleService.approveReview(data.id, dto);
          break;
        case 'reject':
          dto.reviewResult = 2;
          await scheduleService.rejectReview(data.id, dto);
          break;
        case 'start':
          await scheduleService.startProcessing(data.id, dto);
          break;
        case 'complete':
          await scheduleService.completeProcessing(data.id, dto);
          break;
        case 'postSubmit':
          await scheduleService.submitPostReview(data.id, dto);
          break;
        case 'postComplete':
          await scheduleService.completePostReview(data.id, dto);
          break;
        case 'close':
          await scheduleService.closeSchedule(data.id, dto);
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

  const handleAddMedication = async () => {
    if (!data) return;
    try {
      const values = await medicationForm.validateFields();
      setMedicationLoading(true);
      const dto: CreateMedicationDto = {
        elderId: data.elderId,
        drugName: values.drugName,
        genericName: values.genericName,
        specification: values.specification,
        dosage: values.dosage,
        frequency: values.frequency,
        administrationRoute: values.administrationRoute,
        usageInstructions: values.usageInstructions,
        startDate: values.startDate?.format('YYYY-MM-DD'),
        endDate: values.endDate?.format('YYYY-MM-DD'),
        prescribingDoctor: values.prescribingDoctor,
        precautions: values.precautions,
        remainingQuantity: values.remainingQuantity,
        storageConditions: values.storageConditions,
        createdBy: 'current_user',
      };
      await elderService.addMedication(data.elderId, dto);
      message.success('添加药物成功');
      medicationForm.resetFields();
      setMedicationCollapseActive([]);
      await fetchData();
    } catch (error: any) {
      if (error?.errorFields) return;
      message.error('添加药物失败');
      console.error('Add medication error:', error);
    } finally {
      setMedicationLoading(false);
    }
  };

  const handleDeleteMedication = async (medicationId: string) => {
    try {
      await elderService.deleteMedication(medicationId);
      message.success('删除药物成功');
      await fetchData();
    } catch (error) {
      message.error('删除药物失败');
      console.error('Delete medication error:', error);
    }
  };

  const handleRecordException = async () => {
    if (!data) return;
    try {
      const values = await exceptionForm.validateFields();
      setExceptionLoading(true);
      const dto: CreateExceptionRecordDto = {
        scheduleId: data.id,
        elderId: data.elderId,
        exceptionType: values.exceptionType,
        severity: values.severity,
        occurredAt: values.occurredAt.format('YYYY-MM-DD HH:mm:ss'),
        occurredLocation: values.occurredLocation,
        description: values.description,
        createdBy: 'current_user',
      };
      await exceptionService.create(dto);
      message.success('记录异常成功');
      setExceptionModalVisible(false);
      triggerRefresh();
      await fetchData();
    } catch (error: any) {
      if (error?.errorFields) return;
      message.error('记录异常失败');
      console.error('Record exception error:', error);
    } finally {
      setExceptionLoading(false);
    }
  };

  const renderStatusFormContent = () => {
    switch (currentAction) {
      case 'approve':
        return (
          <Form.Item
            name="reviewComments"
            label="审核意见"
          >
            <TextArea rows={4} placeholder="请输入审核意见（选填）" />
          </Form.Item>
        );
      case 'reject':
        return (
          <Form.Item
            name="reviewComments"
            label="拒绝原因"
            rules={[{ required: true, message: '请输入拒绝原因' }]}
          >
            <TextArea rows={4} placeholder="请输入拒绝原因" />
          </Form.Item>
        );
      case 'postComplete':
        return (
          <>
            <Form.Item
              name="careStandard"
              label="护理达标评分"
              rules={[{ required: true, message: '请选择护理达标等级' }]}
            >
              <Radio.Group>
                <Radio value={1}>未达标</Radio>
                <Radio value={2}>达标</Radio>
                <Radio value={3}>超标准</Radio>
              </Radio.Group>
            </Form.Item>
            <Form.Item
              name="postReviewSummary"
              label="复盘总结"
              rules={[{ required: true, message: '请输入复盘总结' }]}
            >
              <TextArea rows={4} placeholder="请输入复盘总结" />
            </Form.Item>
          </>
        );
      case 'close':
        return (
          <Form.Item
            name="changeReason"
            label="关闭原因"
            rules={[{ required: true, message: '请输入关闭原因' }]}
          >
            <TextArea rows={4} placeholder="请输入关闭原因" />
          </Form.Item>
        );
      default:
        return (
          <Form.Item name="changeReason" label="变更说明">
            <TextArea rows={3} placeholder="请输入变更说明（选填）" />
          </Form.Item>
        );
    }
  };

  const medicationColumns = [
    { title: '药物名', dataIndex: 'drugName', key: 'drugName', width: 110 },
    { title: '规格', dataIndex: 'specification', key: 'specification', width: 70 },
    { title: '剂量', dataIndex: 'dosage', key: 'dosage', width: 60 },
    { title: '频次', dataIndex: 'frequency', key: 'frequency', width: 70 },
    { title: '用法', dataIndex: 'administrationRoute', key: 'administrationRoute', width: 60 },
    {
      title: '起止日期',
      key: 'dateRange',
      width: 130,
      render: (_: unknown, record: MedicationDto) => (
        <div style={{ fontSize: 11 }}>
          <div>{record.startDate ? dayjs(record.startDate).format('MM-DD') : '-'}</div>
          <div style={{ color: '#8c8c8c' }}>至 {record.endDate ? dayjs(record.endDate).format('MM-DD') : '长期'}</div>
        </div>
      ),
    },
    { title: '剩余量', dataIndex: 'remainingQuantity', key: 'remainingQuantity', width: 55 },
    {
      title: '操作',
      key: 'actions',
      width: 55,
      render: (_: unknown, record: MedicationDto) => (
        <Popconfirm
          title="删除药物？"
          onConfirm={() => handleDeleteMedication(record.id)}
          okText="确认"
          cancelText="取消"
        >
          <Button type="link" size="small" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ];

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
        <Empty description="未找到排班数据" />
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/schedules')}>返回列表</Button>
        </div>
      </div>
    );
  }

  const elder = data.elder || ({} as ElderDetailDto);
  const careLevel = data.careLevel;
  const bed = data.bed;

  return (
    <div>
      <PageHeader
        title={`排班详情 - ${data.scheduleNo}`}
        subtitle={`老人：${elder.name || ''} | 当前状态：${data.statusText}`}
        breadcrumb={[
          { title: '业务管理' },
          { title: '排班管理', onClick: () => navigate('/schedules') },
          { title: data.scheduleNo },
        ]}
        actions={[
          { key: 'back', label: '返回列表', icon: <ArrowLeftOutlined />, onClick: () => navigate('/schedules') },
        ]}
      />

      <Row gutter={[16, 16]} style={{ marginBottom: 80 }}>
        <Col xs={24} lg={6}>
          <Card
            size="small"
            title={
              <Space>
                <UserOutlined style={{ color: '#1890ff' }} />
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
              <Descriptions.Item label="年龄">{elder.age || '-'} 岁</Descriptions.Item>
              <Descriptions.Item label="身份证">{elder.idCardNumber || '-'}</Descriptions.Item>
              <Descriptions.Item label="联系电话">
                {elder.phoneNumber ? (
                  <Space size={4}>
                    <PhoneOutlined />
                    <span>{elder.phoneNumber}</span>
                  </Space>
                ) : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="紧急联系人">{elder.emergencyContact || '-'}</Descriptions.Item>
              <Descriptions.Item label="紧急电话">{elder.emergencyPhone || '-'}</Descriptions.Item>
            </Descriptions>
          </Card>

          <Card
            size="small"
            title={
              <Space>
                <HeartOutlined style={{ color: '#eb2f96' }} />
                <span>护理等级</span>
              </Space>
            }
            style={{ marginBottom: 16 }}
          >
            {careLevel ? (
              <>
                <Descriptions size="small" column={1} bordered>
                  <Descriptions.Item label="级别名称">
                    <Space>
                      <CareLevelTypeTag value={careLevel.levelType} />
                      <Tag color="blue">{careLevel.levelName}</Tag>
                    </Space>
                  </Descriptions.Item>
                  <Descriptions.Item label="服务标准">
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {careLevel.serviceStandards || '-'}
                    </Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="月费用">
                    <Text strong style={{ color: '#fa8c16' }}>
                      {careLevel.monthlyFee ? `¥${careLevel.monthlyFee}` : '-'}
                    </Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="日护理时长">
                    {careLevel.dailyCareHours ? `${careLevel.dailyCareHours}h` : '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="护患比">
                    {careLevel.nurseRatio ? `1:${careLevel.nurseRatio}` : '-'}
                  </Descriptions.Item>
                </Descriptions>
              </>
            ) : (
              <Empty description="未设置护理等级" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
          </Card>

          <Card
            size="small"
            title={
              <Space>
                <HomeOutlined style={{ color: '#722ed1' }} />
                <span>来源信息</span>
              </Space>
            }
            style={{ marginBottom: 16 }}
          >
            <Descriptions size="small" column={1} bordered>
              <Descriptions.Item label="来源">
                <SourceTypeTag value={elder.sourceType} />
              </Descriptions.Item>
              <Descriptions.Item label="来源说明">
                <span style={{ fontSize: 12 }}>{elder.sourceDetail || '-'}</span>
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Alert
            type="warning"
            showIcon
            icon={<AlertOutlined />}
            message="健康提示"
            description={
              <div style={{ fontSize: 12 }}>
                <div><strong>病史：</strong>{elder.medicalHistory || '无'}</div>
                <div><strong>过敏史：</strong>{elder.allergyInfo || '无'}</div>
                <div><strong>饮食要求：</strong>{elder.dietaryRequirements || '正常'}</div>
              </div>
            }
          />
        </Col>

        <Col xs={24} lg={11}>
          <Card
            size="small"
            style={{ marginBottom: 16 }}
            title={
              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Space>
                  <CalendarOutlined style={{ color: '#1890ff' }} />
                  <span style={{ fontSize: 15 }}>{data.scheduleNo}</span>
                  <ScheduleStatusTag value={data.status} />
                </Space>
              </Space>
            }
          >
            <Steps
              size="small"
              current={getCurrentStepIndex()}
              direction="horizontal"
              responsive
              style={{ marginBottom: 16 }}
              items={SCHEDULE_STEPS.map((s, i) => ({
                title: s.title,
                status: getStepStatus(i),
              }))}
            />

            <Divider orientation="left" plain style={{ marginTop: 0 }}>
              <Space>
                <ClockCircleOutlined />
                排班信息
              </Space>
            </Divider>
            <Descriptions size="small" column={2} bordered style={{ marginBottom: 16 }}>
              <Descriptions.Item label="床位">
                {bed ? (
                  <Space>
                    <EnvironmentOutlined />
                    <span>
                      {bed.building || ''}{bed.floor || ''}{bed.roomNumber || ''}-{bed.bedNumber}
                    </span>
                  </Space>
                ) : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="日期范围">
                <div style={{ fontSize: 12 }}>
                  <div>{dayjs(data.startDate).format('YYYY-MM-DD')}</div>
                  <div style={{ color: '#8c8c8c' }}>至 {dayjs(data.endDate).format('YYYY-MM-DD')}</div>
                </div>
              </Descriptions.Item>
              <Descriptions.Item label="班次">
                <ShiftTypeTag value={data.shiftType} />
              </Descriptions.Item>
              <Descriptions.Item label="护理等级">
                {careLevel?.levelName || '-'}
              </Descriptions.Item>
            </Descriptions>

            <Divider orientation="left" plain>
              <Space>
                <TeamOutlined />
                医护团队
              </Space>
            </Divider>
            <Descriptions size="small" column={3} bordered style={{ marginBottom: 16 }}>
              <Descriptions.Item label="主责护士">{data.primaryNurse || '-'}</Descriptions.Item>
              <Descriptions.Item label="副护士">{data.secondaryNurse || '-'}</Descriptions.Item>
              <Descriptions.Item label="值班医生">{data.doctorOnDuty || '-'}</Descriptions.Item>
            </Descriptions>

            <Divider orientation="left" plain>
              <Space>
                <FileDoneOutlined />
                护理方案
              </Space>
            </Divider>
            <Descriptions size="small" column={1} bordered style={{ marginBottom: 16 }}>
              <Descriptions.Item label="护理计划">
                <span style={{ fontSize: 12 }}>{data.carePlan || '-'}</span>
              </Descriptions.Item>
              <Descriptions.Item label="特殊要求">
                <span style={{ fontSize: 12 }}>{data.specialRequirements || '-'}</span>
              </Descriptions.Item>
              <Descriptions.Item label="营养计划">
                <span style={{ fontSize: 12 }}>{data.nutritionPlan || '-'}</span>
              </Descriptions.Item>
              <Descriptions.Item label="康复计划">
                <span style={{ fontSize: 12 }}>{data.rehabilitationPlan || '-'}</span>
              </Descriptions.Item>
              <Descriptions.Item label="作息安排">
                <span style={{ fontSize: 12 }}>{data.dailySchedule || '-'}</span>
              </Descriptions.Item>
            </Descriptions>

            <Divider orientation="left" plain>
              <Space>
                <HistoryOutlined />
                处理记录
              </Space>
            </Divider>
            <Descriptions size="small" column={1} bordered>
              <Descriptions.Item label="处理备注">
                <span style={{ fontSize: 12 }}>{data.processingNotes || '-'}</span>
              </Descriptions.Item>
              <Descriptions.Item label="审核意见">
                <span style={{ fontSize: 12, color: data.reviewComments ? '#1890ff' : '#8c8c8c' }}>
                  {data.reviewComments || '-'}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="复盘总结">
                <Space direction="vertical" size={2}>
                  {data.careStandard !== undefined && data.careStandard !== 0 && (
                    <CareStandardTag value={data.careStandard} />
                  )}
                  <span style={{ fontSize: 12 }}>{data.postReviewSummary || '-'}</span>
                </Space>
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Card
            size="small"
            title={
              <Space>
                <HistoryOutlined style={{ color: '#722ed1' }} />
                <span>状态历史</span>
              </Space>
            }
          >
            {data.statusHistories && data.statusHistories.length > 0 ? (
              <Timeline
                mode="left"
                style={{ paddingLeft: 0 }}
                items={data.statusHistories.map((h) => ({
                  color: h.newStatus >= 90 ? 'gray' : h.newStatus >= 60 ? 'green' : h.newStatus >= 40 ? 'blue' : h.newStatus >= 30 ? 'cyan' : h.newStatus >= 10 ? 'gold' : 'gray',
                  children: (
                    <div style={{ fontSize: 12 }}>
                      <div>
                        <Tag color="blue">{h.newStatusText}</Tag>
                      </div>
                      {h.changeReason && (
                        <div style={{ color: '#595959', marginTop: 4 }}>{h.changeReason}</div>
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
          </Card>
        </Col>

        <Col xs={24} lg={7}>
          <Card
            size="small"
            title={
              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Space>
                  <MedicineBoxOutlined style={{ color: '#52c41a' }} />
                  <span>用药清单（{data.medications?.length || 0}）</span>
                </Space>
              </Space>
            }
            style={{ marginBottom: 16 }}
          >
            {data.medications && data.medications.length > 0 ? (
              <Table
                size="small"
                columns={medicationColumns}
                dataSource={data.medications}
                rowKey="id"
                pagination={false}
                scroll={{ x: 580 }}
                locale={{ emptyText: <Empty description="暂无用药" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
              />
            ) : (
              <Empty description="暂无用药记录" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}

            <Divider style={{ margin: '12px 0' }} />

            <Collapse
              activeKey={medicationCollapseActive}
              onChange={setMedicationCollapseActive}
              size="small"
              ghost
            >
              <Panel
                header={
                  <Space>
                    <PlusOutlined />
                    <span>新增用药</span>
                  </Space>
                }
                key="add"
              >
                <Form layout="vertical" form={medicationForm} preserve={false} size="small">
                  <Row gutter={8}>
                    <Col span={12}>
                      <Form.Item
                        name="drugName"
                        label="药物名"
                        rules={[{ required: true, message: '必填' }]}
                        style={{ marginBottom: 8 }}
                      >
                        <Input size="small" placeholder="药物名称" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="specification" label="规格" style={{ marginBottom: 8 }}>
                        <Input size="small" placeholder="规格" />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item name="dosage" label="剂量" style={{ marginBottom: 8 }}>
                        <Input size="small" placeholder="剂量" />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item name="frequency" label="频次" style={{ marginBottom: 8 }}>
                        <Input size="small" placeholder="频次" />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item name="administrationRoute" label="用法" style={{ marginBottom: 8 }}>
                        <Input size="small" placeholder="用法" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="startDate" label="开始日" style={{ marginBottom: 8 }}>
                        <DatePicker size="small" style={{ width: '100%' }} placeholder="选择" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="endDate" label="结束日" style={{ marginBottom: 8 }}>
                        <DatePicker size="small" style={{ width: '100%' }} placeholder="选择" />
                      </Form.Item>
                    </Col>
                    <Col span={24}>
                      <Form.Item style={{ marginBottom: 0 }}>
                        <Button
                          type="primary"
                          size="small"
                          icon={<PlusOutlined />}
                          loading={medicationLoading}
                          onClick={handleAddMedication}
                        >
                          添加
                        </Button>
                      </Form.Item>
                    </Col>
                  </Row>
                </Form>
              </Panel>
            </Collapse>
          </Card>

          <Card
            size="small"
            title={
              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Space>
                  <WarningOutlined style={{ color: '#ff4d4f' }} />
                  <span>异常记录（{data.exceptionRecords?.length || 0}）</span>
                </Space>
                {data.exceptionRecords && data.exceptionRecords.length > 0 && (
                  <Tag color="red">{data.exceptionRecords.filter(e => e.exceptionType === 1).length} 跌倒</Tag>
                )}
              </Space>
            }
          >
            {data.exceptionRecords && data.exceptionRecords.length > 0 ? (
              <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                {data.exceptionRecords.map((exp) => (
                  <Card
                    key={exp.id}
                    size="small"
                    style={{
                      marginBottom: 8,
                      borderColor: exp.exceptionType === 1 ? '#ff7875' : undefined,
                      backgroundColor: exp.exceptionType === 1 ? '#fff1f0' : undefined,
                    }}
                    bodyStyle={{ padding: 8 }}
                  >
                    <Space direction="vertical" size={4} style={{ width: '100%' }}>
                      <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                        <Space>
                          <ExceptionTypeTag value={exp.exceptionType} />
                          <ExceptionSeverityTag value={exp.severity} />
                        </Space>
                        <ExceptionStatusTag value={exp.status} />
                      </Space>
                      <Space size={8} wrap>
                        <span style={{ fontSize: 11, color: '#8c8c8c' }}>
                          <FallOutlined /> {dayjs(exp.occurredAt).format('MM-DD HH:mm')}
                        </span>
                        {exp.occurredLocation && (
                          <span style={{ fontSize: 11, color: '#8c8c8c' }}>
                            <EnvironmentOutlined /> {exp.occurredLocation}
                          </span>
                        )}
                      </Space>
                      <div style={{ fontSize: 12, color: '#595959' }}>
                        {exp.description?.length > 40 ? `${exp.description.substring(0, 40)}...` : exp.description}
                      </div>
                      <div>
                        <Button
                          type="link"
                          size="small"
                          icon={<EyeOutlined />}
                          onClick={() => navigate(`/exceptions/${exp.id}`)}
                          style={{ padding: 0 }}
                        >
                          查看详情
                        </Button>
                      </div>
                    </Space>
                  </Card>
                ))}
              </div>
            ) : (
              <Empty description="暂无异常记录" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
          </Card>
        </Col>
      </Row>

      <div
        style={{
          position: 'sticky',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          padding: '12px 24px',
          background: 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(8px)',
          borderTop: '1px solid #f0f0f0',
          boxShadow: '0 -2px 8px rgba(0, 0, 0, 0.06)',
        }}
      >
        <Row align="middle" justify="space-between">
          <Col>
            <Space>
              <Text type="secondary" style={{ fontSize: 13 }}>
                当前状态：
              </Text>
              <ScheduleStatusTag value={data.status} />
              {data.careStandard !== undefined && data.careStandard !== 0 && (
                <>
                  <Divider type="vertical" />
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    护理达标：
                  </Text>
                  <CareStandardTag value={data.careStandard} />
                </>
              )}
            </Space>
          </Col>
          <Col>
            <Space>
              {getAvailableActions().map((action) => (
                <Button
                  key={action.key}
                  type={action.type}
                  danger={action.danger}
                  icon={action.icon}
                  onClick={() => handleActionClick(action)}
                >
                  {action.label}
                </Button>
              ))}
            </Space>
          </Col>
        </Row>
      </div>

      <Modal
        title={statusFormTitle}
        width={520}
        open={statusModalVisible}
        onCancel={() => setStatusModalVisible(false)}
        onOk={handleStatusFormSubmit}
        confirmLoading={statusLoading}
        maskClosable={false}
        okText="确认"
        cancelText="取消"
      >
        {statusFormTip && (
          <Alert type="info" message={statusFormTip} showIcon style={{ marginBottom: 16 }} />
        )}
        <Form layout="vertical" form={statusForm} preserve={false}>
          {renderStatusFormContent()}
        </Form>
      </Modal>

      <Modal
        title={
          <Space>
            <WarningOutlined style={{ color: '#ff4d4f' }} />
            <span>记录异常</span>
          </Space>
        }
        width={640}
        open={exceptionModalVisible}
        onCancel={() => setExceptionModalVisible(false)}
        onOk={handleRecordException}
        confirmLoading={exceptionLoading}
        maskClosable={false}
        okText="提交"
        cancelText="取消"
      >
        <Alert
          type="warning"
          showIcon
          message="默认类型为跌倒"
          description="如需记录其他类型异常，请选择对应类型"
          style={{ marginBottom: 16 }}
        />
        <Form layout="vertical" form={exceptionForm} preserve={false}>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="exceptionType"
                label="异常类型"
                rules={[{ required: true, message: '请选择异常类型' }]}
              >
                <Select
                  options={[
                    { label: '跌倒', value: ExceptionTypeEnum.Fall },
                    { label: '用药错误', value: ExceptionTypeEnum.MedicationError },
                    { label: '走失', value: ExceptionTypeEnum.Missing },
                    { label: '身体不适', value: ExceptionTypeEnum.PhysicalDiscomfort },
                    { label: '设备故障', value: ExceptionTypeEnum.EquipmentFailure },
                    { label: '其他', value: ExceptionTypeEnum.Other },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="severity"
                label="严重度"
                rules={[{ required: true, message: '请选择严重度' }]}
              >
                <Select
                  options={[
                    { label: '低', value: ExceptionSeverityEnum.Low },
                    { label: '中', value: ExceptionSeverityEnum.Medium },
                    { label: '高', value: ExceptionSeverityEnum.High },
                    { label: '严重', value: ExceptionSeverityEnum.Critical },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="occurredAt"
                label="发生时间"
                rules={[{ required: true, message: '请选择发生时间' }]}
              >
                <DatePicker showTime style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="occurredLocation" label="发生地点">
                <Input placeholder="例如：3楼东侧卫生间" />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item
                name="description"
                label="异常描述"
                rules={[{ required: true, message: '请输入异常描述' }]}
              >
                <TextArea rows={4} placeholder="请详细描述异常情况" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default ScheduleDetail;
