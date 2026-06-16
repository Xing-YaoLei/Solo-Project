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
  Radio,
  Alert,
} from 'antd';
import {
  SearchOutlined,
  PlusOutlined,
  EyeOutlined,
  ReloadOutlined,
  CalendarOutlined,
  CheckOutlined,
  CloseOutlined,
  PlayCircleOutlined,
  StopOutlined,
  FileDoneOutlined,
  AuditOutlined,
  ExclamationCircleOutlined,
  WarningOutlined,
  UserOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import PageHeader from '@/components/PageHeader';
import {
  ScheduleStatusSelect,
  CareLevelTypeSelect,
  ShiftTypeSelect,
} from '@/components/EnumSelect';
import {
  ScheduleStatusTag,
  CareLevelTypeTag,
  ShiftTypeTag,
} from '@/components/StatusTag';
import { scheduleService } from '@/services/scheduleService';
import { elderService } from '@/services/elderService';
import { careLevelService } from '@/services/careLevelService';
import { bedService } from '@/services/bedService';
import type {
  ScheduleListDto,
  ScheduleQueryDto,
  PagedResultDto,
  CreateScheduleDto,
  ScheduleStatusChangeDto,
  ScheduleStatus,
  ShiftType,
  CareLevelType,
  ElderListDto,
  CareLevelDto,
  BedDto,
} from '@/types';
import { useAppStore } from '@/store/useAppStore';
import { getEnumOptions, shiftTypeMap } from '@/utils/enumUtils';

const { RangePicker } = DatePicker;
const { TextArea } = Input;

interface QueryFormValues {
  keyword?: string;
  status?: ScheduleStatus;
  elderId?: string;
  careLevelId?: string;
  startDateFrom?: dayjs.Dayjs;
  startDateTo?: dayjs.Dayjs;
  primaryNurse?: string;
  hasExceptions?: boolean;
}

interface CreateFormValues {
  elderId: string;
  bedId?: string;
  careLevelId?: string;
  startDate: dayjs.Dayjs;
  endDate: dayjs.Dayjs;
  shiftType: ShiftType;
  primaryNurse?: string;
  secondaryNurse?: string;
  doctorOnDuty?: string;
  carePlan?: string;
  specialRequirements?: string;
  nutritionPlan?: string;
  rehabilitationPlan?: string;
  dailySchedule?: string;
}

interface StatusChangeFormValues {
  changeReason?: string;
  reviewComments?: string;
  postReviewSummary?: string;
  careStandard?: number;
}

const ScheduleManagement: React.FC = () => {
  const navigate = useNavigate();
  const { triggerRefresh, refreshTrigger } = useAppStore();

  const [queryForm] = Form.useForm<QueryFormValues>();
  const [createForm] = Form.useForm<CreateFormValues>();
  const [statusChangeForm] = Form.useForm<StatusChangeFormValues>();

  const [loading, setLoading] = useState<boolean>(false);
  const [data, setData] = useState<ScheduleListDto[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [pageIndex, setPageIndex] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);

  const [createModalVisible, setCreateModalVisible] = useState<boolean>(false);
  const [createLoading, setCreateLoading] = useState<boolean>(false);

  const [statusChangeModalVisible, setStatusChangeModalVisible] = useState<boolean>(false);
  const [statusChangeLoading, setStatusChangeLoading] = useState<boolean>(false);
  const [currentSchedule, setCurrentSchedule] = useState<ScheduleListDto | null>(null);
  const [currentAction, setCurrentAction] = useState<string>('');

  const [elders, setElders] = useState<ElderListDto[]>([]);
  const [careLevels, setCareLevels] = useState<CareLevelDto[]>([]);
  const [beds, setBeds] = useState<BedDto[]>([]);

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [elderList, clList, bedList] = await Promise.all([
          elderService.getList({ pageIndex: 1, pageSize: 999, isActive: true }),
          careLevelService.getAll(),
          bedService.getAll(),
        ]);
        setElders(elderList.items);
        setCareLevels(clList);
        setBeds(bedList);
      } catch (error) {
        console.error('Load options error:', error);
      }
    };
    loadOptions();
  }, []);

  const fetchData = useCallback(async (query: ScheduleQueryDto) => {
    setLoading(true);
    try {
      const result: PagedResultDto<ScheduleListDto> = await scheduleService.getList({
        ...query,
        pageIndex,
        pageSize,
      });
      setData(result.items);
      setTotal(result.totalCount);
    } catch (error) {
      message.error('加载排班列表失败');
      console.error('Schedule list error:', error);
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
      status: values.status,
      elderId: values.elderId,
      careLevelId: values.careLevelId,
      startDateFrom: values.startDateFrom?.format('YYYY-MM-DD'),
      startDateTo: values.startDateTo?.format('YYYY-MM-DD'),
      primaryNurse: values.primaryNurse || undefined,
      hasExceptions: values.hasExceptions,
    });
  };

  const handleReset = () => {
    queryForm.resetFields();
    setPageIndex(1);
    fetchData({});
  };

  const handleOpenCreate = () => {
    createForm.resetFields();
    setCreateModalVisible(true);
  };

  const handleCreate = async () => {
    try {
      const values = await createForm.validateFields();
      setCreateLoading(true);
      const dto: CreateScheduleDto = {
        elderId: values.elderId,
        bedId: values.bedId,
        careLevelId: values.careLevelId,
        startDate: values.startDate.format('YYYY-MM-DD'),
        endDate: values.endDate.format('YYYY-MM-DD'),
        shiftType: values.shiftType,
        primaryNurse: values.primaryNurse,
        secondaryNurse: values.secondaryNurse,
        doctorOnDuty: values.doctorOnDuty,
        carePlan: values.carePlan,
        specialRequirements: values.specialRequirements,
        nutritionPlan: values.nutritionPlan,
        rehabilitationPlan: values.rehabilitationPlan,
        dailySchedule: values.dailySchedule,
        createdBy: 'current_user',
      };
      await scheduleService.create(dto);
      message.success('创建排班成功');
      setCreateModalVisible(false);
      triggerRefresh();
    } catch (error: any) {
      if (error?.errorFields) return;
      message.error('创建排班失败');
      console.error('Schedule create error:', error);
    } finally {
      setCreateLoading(false);
    }
  };

  const getAvailableActions = (status: ScheduleStatus) => {
    const actions: Array<{ key: string; label: string; icon: React.ReactNode; type?: 'primary' | 'default' | 'danger' | 'ghost' | 'link'; danger?: boolean }> = [];
    switch (status) {
      case 0:
        actions.push({ key: 'submit', label: '提交审核', icon: <AuditOutlined />, type: 'primary' });
        break;
      case 10:
      case 20:
        actions.push({ key: 'approve', label: '审核通过', icon: <CheckOutlined />, type: 'primary' });
        actions.push({ key: 'reject', label: '审核拒绝', icon: <CloseOutlined />, danger: true });
        break;
      case 30:
        actions.push({ key: 'start', label: '开始处理', icon: <PlayCircleOutlined />, type: 'primary' });
        break;
      case 40:
      case 45:
      case 50:
        actions.push({ key: 'complete', label: '完成处理', icon: <StopOutlined />, type: 'primary' });
        break;
      case 60:
        actions.push({ key: 'postSubmit', label: '提交复盘', icon: <FileDoneOutlined />, type: 'primary' });
        break;
      case 70:
        actions.push({ key: 'postComplete', label: '完成复盘', icon: <FileDoneOutlined />, type: 'primary' });
        break;
      case 80:
        actions.push({ key: 'close', label: '关闭', icon: <CloseOutlined />, danger: true });
        break;
    }
    return actions;
  };

  const openStatusChange = (record: ScheduleListDto, action: string) => {
    setCurrentSchedule(record);
    setCurrentAction(action);
    statusChangeForm.resetFields();
    setStatusChangeModalVisible(true);
  };

  const getStatusChangeTitle = () => {
    const titles: Record<string, string> = {
      submit: '提交审核',
      approve: '审核通过',
      reject: '审核拒绝',
      start: '开始处理',
      complete: '完成处理',
      postSubmit: '提交复盘',
      postComplete: '完成复盘',
      close: '关闭单据',
    };
    return titles[currentAction] || '状态变更';
  };

  const handleStatusChange = async () => {
    if (!currentSchedule) return;
    try {
      const values = await statusChangeForm.validateFields();
      setStatusChangeLoading(true);

      let dto: ScheduleStatusChangeDto = {
        operator: 'current_user',
        changeReason: values.changeReason,
      };

      let result;
      switch (currentAction) {
        case 'submit':
          result = await scheduleService.submitForReview(currentSchedule.id, dto);
          break;
        case 'approve':
          dto = { ...dto, reviewComments: values.reviewComments, reviewResult: 1 };
          result = await scheduleService.approveReview(currentSchedule.id, dto);
          break;
        case 'reject':
          dto = { ...dto, reviewComments: values.reviewComments, reviewResult: 2 };
          result = await scheduleService.rejectReview(currentSchedule.id, dto);
          break;
        case 'start':
          result = await scheduleService.startProcessing(currentSchedule.id, dto);
          break;
        case 'complete':
          result = await scheduleService.completeProcessing(currentSchedule.id, dto);
          break;
        case 'postSubmit':
          result = await scheduleService.submitPostReview(currentSchedule.id, dto);
          break;
        case 'postComplete':
          dto = { ...dto, postReviewSummary: values.postReviewSummary, careStandard: values.careStandard as any };
          result = await scheduleService.completePostReview(currentSchedule.id, dto);
          break;
        case 'close':
          result = await scheduleService.closeSchedule(currentSchedule.id, dto);
          break;
      }

      message.success(`${getStatusChangeTitle()}成功`);
      setStatusChangeModalVisible(false);
      triggerRefresh();
    } catch (error: any) {
      if (error?.errorFields) return;
      message.error(`${getStatusChangeTitle()}失败`);
      console.error('Status change error:', error);
    } finally {
      setStatusChangeLoading(false);
    }
  };

  const columns = useMemo(() => [
    {
      title: '排班单号',
      dataIndex: 'scheduleNo',
      key: 'scheduleNo',
      width: 140,
      render: (text: string, record: ScheduleListDto) => (
        <a onClick={() => navigate(`/schedules/${record.id}`)} style={{ fontWeight: 500 }}>
          <Space>
            <CalendarOutlined />
            {text}
          </Space>
        </a>
      ),
    },
    {
      title: '老人',
      key: 'elder',
      width: 120,
      render: (_: unknown, record: ScheduleListDto) => (
        <Space>
          <UserOutlined />
          <span>{record.elderName}</span>
        </Space>
      ),
    },
    {
      title: '床位',
      dataIndex: 'bedNumber',
      key: 'bedNumber',
      width: 90,
    },
    {
      title: '护理等级',
      dataIndex: 'careLevelName',
      key: 'careLevelName',
      width: 100,
    },
    {
      title: '日期',
      key: 'date',
      width: 200,
      render: (_: unknown, record: ScheduleListDto) => (
        <div style={{ fontSize: 12 }}>
          <div>
            <ClockCircleOutlined style={{ marginRight: 4 }} />
            {dayjs(record.startDate).format('YYYY-MM-DD')}
          </div>
          <div style={{ color: '#8c8c8c' }}>
            至 {dayjs(record.endDate).format('YYYY-MM-DD')}
          </div>
        </div>
      ),
    },
    {
      title: '班次',
      dataIndex: 'shiftType',
      key: 'shiftType',
      width: 80,
      render: (val: ShiftType) => <ShiftTypeTag value={val} />,
    },
    {
      title: '主责护士',
      dataIndex: 'primaryNurse',
      key: 'primaryNurse',
      width: 100,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (val: ScheduleStatus) => <ScheduleStatusTag value={val} />,
    },
    {
      title: '异常数',
      dataIndex: 'exceptionCount',
      key: 'exceptionCount',
      width: 90,
      render: (val: number) => val > 0 ? (
        <Tag color="red" icon={<WarningOutlined />}>
          {val}
        </Tag>
      ) : (
        <Tag color="default">0</Tag>
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
      width: 340,
      fixed: 'right' as const,
      render: (_: unknown, record: ScheduleListDto) => {
        const actions = getAvailableActions(record.status);
        return (
          <Space size="small" wrap>
            <Tooltip title="查看详情">
              <Button
                type="link"
                size="small"
                icon={<EyeOutlined />}
                onClick={() => navigate(`/schedules/${record.id}`)}
              >
                详情
              </Button>
            </Tooltip>
            {actions.map((action) => (
              <Popconfirm
                key={action.key}
                title={`确定要${action.label}吗？`}
                onConfirm={() => {
                  if (['approve', 'reject', 'postComplete', 'close'].includes(action.key)) {
                    openStatusChange(record, action.key);
                  } else {
                    quickStatusChange(record, action.key);
                  }
                }}
                okText="确认"
                cancelText="取消"
              >
                <Button
                  type="link"
                  size="small"
                  icon={action.icon}
                  danger={action.danger}
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

  const quickStatusChange = async (record: ScheduleListDto, action: string) => {
    try {
      const dto: ScheduleStatusChangeDto = { operator: 'current_user' };
      switch (action) {
        case 'submit':
          await scheduleService.submitForReview(record.id, dto);
          break;
        case 'start':
          await scheduleService.startProcessing(record.id, dto);
          break;
        case 'complete':
          await scheduleService.completeProcessing(record.id, dto);
          break;
        case 'postSubmit':
          await scheduleService.submitPostReview(record.id, dto);
          break;
      }
      message.success('操作成功');
      triggerRefresh();
    } catch (error) {
      message.error('操作失败');
      console.error('Quick status change error:', error);
    }
  };

  const statusChangeContent = () => {
    switch (currentAction) {
      case 'approve':
      case 'reject':
        return (
          <Form.Item
            name="reviewComments"
            label="审核意见"
            rules={[{ required: currentAction === 'reject', message: '请输入审核意见' }]}
          >
            <TextArea rows={4} placeholder={currentAction === 'reject' ? '请输入拒绝原因' : '请输入审核意见（选填）'} />
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

  return (
    <div>
      <PageHeader
        title="排班管理"
        subtitle="管理养老院护理排班，包括创建、审核、处理和复盘全流程"
        breadcrumb={[{ title: '业务管理' }, { title: '排班管理' }]}
        actions={[
          { key: 'create', label: '新建排班', icon: <PlusOutlined />, type: 'primary', onClick: handleOpenCreate },
          { key: 'refresh', label: '刷新', icon: <ReloadOutlined />, onClick: handleReset },
        ]}
      />

      <Card style={{ marginBottom: 16 }}>
        <Form layout="vertical" form={queryForm} onFinish={handleSearch}>
          <Row gutter={16}>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item name="keyword" label="关键词">
                <Input placeholder="单号/老人名/护士" allowClear prefix={<SearchOutlined />} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item name="status" label="状态">
                <ScheduleStatusSelect placeholder="请选择状态" allowClear />
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
              <Form.Item name="careLevelId" label="护理等级">
                <Select
                  placeholder="请选择护理等级"
                  allowClear
                  options={careLevels.map((cl) => ({ label: cl.levelName, value: cl.id }))}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item name={['startDateFrom', 'startDateTo']} label="日期范围">
                <RangePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item name="primaryNurse" label="主责护士">
                <Input placeholder="护士姓名" allowClear />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item name="hasExceptions" label="是否有异常">
                <Select
                  placeholder="请选择"
                  allowClear
                  options={[
                    { label: '是', value: true },
                    { label: '否', value: false },
                  ]}
                />
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
          scroll={{ x: 1600 }}
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
        title="新建排班"
        width={900}
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        onOk={handleCreate}
        confirmLoading={createLoading}
        maskClosable={false}
        okText="创建"
        cancelText="取消"
      >
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
              <Form.Item name="bedId" label="床位">
                <Select
                  placeholder="请选择床位"
                  options={beds.map((b) => ({
                    label: `${b.building || ''}${b.floor || ''}${b.roomNumber || ''}-${b.bedNumber}`,
                    value: b.id,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="careLevelId" label="护理等级">
                <Select
                  placeholder="请选择护理等级"
                  options={careLevels.map((cl) => ({ label: cl.levelName, value: cl.id }))}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="shiftType"
                label="班次"
                rules={[{ required: true, message: '请选择班次' }]}
              >
                <ShiftTypeSelect placeholder="请选择班次" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="startDate"
                label="开始日期"
                rules={[{ required: true, message: '请选择开始日期' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="endDate"
                label="结束日期"
                rules={[{ required: true, message: '请选择结束日期' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left" plain>医护团队</Divider>
          <Row gutter={16}>
            <Col xs={24} sm={8}>
              <Form.Item name="primaryNurse" label="主责护士">
                <Input placeholder="主责护士姓名" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item name="secondaryNurse" label="副护士">
                <Input placeholder="副护士姓名" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item name="doctorOnDuty" label="值班医生">
                <Input placeholder="值班医生姓名" />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left" plain>护理方案</Divider>
          <Row gutter={16}>
            <Col xs={24}>
              <Form.Item name="carePlan" label="护理计划">
                <TextArea rows={2} placeholder="请输入护理计划" />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item name="specialRequirements" label="特殊要求">
                <TextArea rows={2} placeholder="请输入特殊要求" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item name="nutritionPlan" label="营养计划">
                <TextArea rows={2} placeholder="请输入营养计划" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item name="rehabilitationPlan" label="康复计划">
                <TextArea rows={2} placeholder="请输入康复计划" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item name="dailySchedule" label="作息安排">
                <TextArea rows={2} placeholder="请输入作息安排" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      <Modal
        title={getStatusChangeTitle()}
        width={600}
        open={statusChangeModalVisible}
        onCancel={() => setStatusChangeModalVisible(false)}
        onOk={handleStatusChange}
        confirmLoading={statusChangeLoading}
        maskClosable={false}
        okText="确认"
        cancelText="取消"
      >
        {currentSchedule && (
          <Alert
            message={`排班单号：${currentSchedule.scheduleNo}`}
            description={`老人：${currentSchedule.elderName}，当前状态：${currentSchedule.statusText}`}
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}
        <Form layout="vertical" form={statusChangeForm} preserve={false}>
          {statusChangeContent()}
        </Form>
      </Modal>
    </div>
  );
};

export default ScheduleManagement;
