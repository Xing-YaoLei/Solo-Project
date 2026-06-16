import React, { useEffect, useState, useCallback } from 'react';
import {
  Form,
  Modal,
  Drawer,
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
  Descriptions,
  Divider,
  Tooltip,
  Empty,
  Select,
  Tag,
} from 'antd';
import {
  SearchOutlined,
  PlusOutlined,
  EditOutlined,
  EyeOutlined,
  MedicineBoxOutlined,
  DeleteOutlined,
  ReloadOutlined,
  UserOutlined,
  PhoneOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import dayjs from 'dayjs';
import PageHeader from '@/components/PageHeader';
import { GenderSelect, CareLevelTypeSelect, SourceTypeSelect } from '@/components/EnumSelect';
import { GenderTag, CareLevelTypeTag, SourceTypeTag } from '@/components/StatusTag';
import { elderService } from '@/services/elderService';
import { careLevelService } from '@/services/careLevelService';
import type {
  ElderListDto,
  ElderDetailDto,
  ElderQueryDto,
  PagedResultDto,
  CareLevelDto,
  CreateElderDto,
  UpdateElderDto,
  MedicationDto,
  CreateMedicationDto,
  Gender,
  CareLevelType,
  SourceType,
} from '@/types';
import { useAppStore } from '@/store/useAppStore';
import { getEnumOptions, careLevelTypeMap } from '@/utils/enumUtils';

const { RangePicker } = DatePicker;
const { TextArea } = Input;

interface QueryFormValues {
  keyword?: string;
  gender?: Gender;
  careLevelType?: CareLevelType;
  sourceType?: SourceType;
  isActive?: boolean;
}

interface ElderFormValues {
  name: string;
  gender: Gender;
  dateOfBirth: dayjs.Dayjs;
  idCardNumber?: string;
  phoneNumber?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  address?: string;
  medicalHistory?: string;
  allergyInfo?: string;
  dietaryRequirements?: string;
  notes?: string;
  sourceType: SourceType;
  sourceDetail?: string;
  careLevelId?: string;
  isActive?: boolean;
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
  sideEffects?: string;
  remainingQuantity?: number;
  storageConditions?: string;
}

const ElderManagement: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { triggerRefresh, refreshTrigger } = useAppStore();

  const [queryForm] = Form.useForm<QueryFormValues>();
  const [elderForm] = Form.useForm<ElderFormValues>();
  const [medicationForm] = Form.useForm<MedicationFormValues>();

  const [loading, setLoading] = useState<boolean>(false);
  const [data, setData] = useState<ElderListDto[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [pageIndex, setPageIndex] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);

  const [drawerVisible, setDrawerVisible] = useState<boolean>(false);
  const [drawerMode, setDrawerMode] = useState<'create' | 'edit' | 'view'>('create');
  const [currentElder, setCurrentElder] = useState<ElderDetailDto | null>(null);
  const [detailLoading, setDetailLoading] = useState<boolean>(false);

  const [medicationModalVisible, setMedicationModalVisible] = useState<boolean>(false);
  const [medicationList, setMedicationList] = useState<MedicationDto[]>([]);
  const [medicationLoading, setMedicationLoading] = useState<boolean>(false);
  const [medicationElderId, setMedicationElderId] = useState<string>('');
  const [medicationElderName, setMedicationElderName] = useState<string>('');

  const [careLevels, setCareLevels] = useState<CareLevelDto[]>([]);

  useEffect(() => {
    const loadCareLevels = async () => {
      try {
        const list = await careLevelService.getAll();
        setCareLevels(list);
      } catch (error) {
        console.error('Load care levels error:', error);
      }
    };
    loadCareLevels();
  }, []);

  const fetchData = useCallback(async (query: ElderQueryDto) => {
    setLoading(true);
    try {
      const result: PagedResultDto<ElderListDto> = await elderService.getList({
        ...query,
        pageIndex,
        pageSize,
      });
      setData(result.items);
      setTotal(result.totalCount);
    } catch (error) {
      message.error('加载老人列表失败');
      console.error('Elder list error:', error);
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
      gender: values.gender,
      careLevelType: values.careLevelType,
      sourceType: values.sourceType,
      isActive: values.isActive,
    });
  };

  const handleReset = () => {
    queryForm.resetFields();
    setPageIndex(1);
    fetchData({});
  };

  const handleCreate = () => {
    setDrawerMode('create');
    setCurrentElder(null);
    elderForm.resetFields();
    elderForm.setFieldsValue({
      isActive: true,
    });
    setDrawerVisible(true);
  };

  const handleEdit = async (id: string) => {
    setDrawerMode('edit');
    setDetailLoading(true);
    try {
      const detail = await elderService.getById(id);
      setCurrentElder(detail);
      elderForm.setFieldsValue({
        name: detail.name,
        gender: detail.gender,
        dateOfBirth: dayjs(detail.dateOfBirth),
        idCardNumber: detail.idCardNumber,
        phoneNumber: detail.phoneNumber,
        emergencyContact: detail.emergencyContact,
        emergencyPhone: detail.emergencyPhone,
        address: detail.address,
        medicalHistory: detail.medicalHistory,
        allergyInfo: detail.allergyInfo,
        dietaryRequirements: detail.dietaryRequirements,
        notes: detail.notes,
        sourceType: detail.sourceType,
        sourceDetail: detail.sourceDetail,
        careLevelId: detail.careLevelId,
        isActive: detail.isActive,
      });
      setDrawerVisible(true);
    } catch (error) {
      message.error('加载老人详情失败');
      console.error('Elder detail error:', error);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleView = async (id: string) => {
    setDrawerMode('view');
    setDetailLoading(true);
    try {
      const detail = await elderService.getById(id);
      setCurrentElder(detail);
      setDrawerVisible(true);
    } catch (error) {
      message.error('加载老人详情失败');
      console.error('Elder detail error:', error);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await elderForm.validateFields();
      const commonDto = {
        name: values.name,
        gender: values.gender,
        dateOfBirth: values.dateOfBirth.format('YYYY-MM-DD'),
        idCardNumber: values.idCardNumber,
        phoneNumber: values.phoneNumber,
        emergencyContact: values.emergencyContact,
        emergencyPhone: values.emergencyPhone,
        address: values.address,
        medicalHistory: values.medicalHistory,
        allergyInfo: values.allergyInfo,
        dietaryRequirements: values.dietaryRequirements,
        notes: values.notes,
        sourceType: values.sourceType,
        sourceDetail: values.sourceDetail,
        careLevelId: values.careLevelId,
      };

      if (drawerMode === 'create') {
        await elderService.create({
          ...commonDto,
          createdBy: 'current_user',
        } as CreateElderDto);
        message.success('创建老人档案成功');
      } else if (drawerMode === 'edit' && currentElder) {
        await elderService.update(currentElder.id, {
          ...commonDto,
          isActive: values.isActive,
          updatedBy: 'current_user',
        } as UpdateElderDto);
        message.success('更新老人档案成功');
      }

      setDrawerVisible(false);
      triggerRefresh();
    } catch (error: any) {
      if (error?.errorFields) return;
      message.error(drawerMode === 'create' ? '创建老人档案失败' : '更新老人档案失败');
      console.error('Elder submit error:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await elderService.delete(id);
      message.success('删除老人档案成功');
      triggerRefresh();
    } catch (error) {
      message.error('删除老人档案失败');
      console.error('Elder delete error:', error);
    }
  };

  const handleManageMedication = async (elder: ElderListDto) => {
    setMedicationElderId(elder.id);
    setMedicationElderName(elder.name);
    medicationForm.resetFields();
    setMedicationModalVisible(true);
    await loadMedications(elder.id);
  };

  const loadMedications = async (elderId: string) => {
    setMedicationLoading(true);
    try {
      const meds = await elderService.getMedications(elderId);
      setMedicationList(meds);
    } catch (error) {
      message.error('加载药物列表失败');
      console.error('Medication list error:', error);
    } finally {
      setMedicationLoading(false);
    }
  };

  const handleAddMedication = async () => {
    try {
      const values = await medicationForm.validateFields();
      const dto: CreateMedicationDto = {
        elderId: medicationElderId,
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
        sideEffects: values.sideEffects,
        remainingQuantity: values.remainingQuantity,
        storageConditions: values.storageConditions,
        createdBy: 'current_user',
      };
      await elderService.addMedication(medicationElderId, dto);
      message.success('添加药物成功');
      medicationForm.resetFields();
      await loadMedications(medicationElderId);
    } catch (error: any) {
      if (error?.errorFields) return;
      message.error('添加药物失败');
      console.error('Medication add error:', error);
    }
  };

  const handleDeleteMedication = async (medicationId: string) => {
    try {
      await elderService.deleteMedication(medicationId);
      message.success('删除药物成功');
      await loadMedications(medicationElderId);
    } catch (error) {
      message.error('删除药物失败');
      console.error('Medication delete error:', error);
    }
  };

  const columns = [
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: ElderListDto) => (
        <Space>
          <UserOutlined />
          <a onClick={() => handleView(record.id)} style={{ fontWeight: 500 }}>{text}</a>
        </Space>
      ),
    },
    {
      title: '性别',
      dataIndex: 'gender',
      key: 'gender',
      width: 80,
      render: (val: Gender) => <GenderTag value={val} />,
    },
    {
      title: '年龄',
      dataIndex: 'age',
      key: 'age',
      width: 70,
    },
    {
      title: '联系电话',
      dataIndex: 'phoneNumber',
      key: 'phoneNumber',
      width: 140,
      render: (val?: string) => val ? (
        <Space>
          <PhoneOutlined />
          <span>{val}</span>
        </Space>
      ) : <span style={{ color: '#bfbfbf' }}>-</span>,
    },
    {
      title: '护理等级',
      dataIndex: 'careLevelType',
      key: 'careLevelType',
      width: 100,
      render: (val: CareLevelType | undefined, record: ElderListDto) => (
        <Space direction="vertical" size={0}>
          <CareLevelTypeTag value={val} />
          {record.careLevelName && <span style={{ fontSize: 12, color: '#8c8c8c' }}>{record.careLevelName}</span>}
        </Space>
      ),
    },
    {
      title: '来源',
      dataIndex: 'sourceType',
      key: 'sourceType',
      width: 110,
      render: (val: SourceType) => <SourceTypeTag value={val} />,
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 80,
      render: (val: boolean) => val ? <Tag color="success">在院</Tag> : <Tag color="default">离院</Tag>,
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
      width: 260,
      fixed: 'right' as const,
      render: (_: unknown, record: ElderListDto) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleView(record.id)}>
              详情
            </Button>
          </Tooltip>
          <Tooltip title="编辑">
            <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record.id)}>
              编辑
            </Button>
          </Tooltip>
          <Tooltip title="药物管理">
            <Button type="link" size="small" icon={<MedicineBoxOutlined />} onClick={() => handleManageMedication(record)}>
              药物
            </Button>
          </Tooltip>
          <Popconfirm
            title="确定要删除该老人档案吗？"
            description="删除后数据不可恢复"
            onConfirm={() => handleDelete(record.id)}
            okText="确认"
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

  const medicationColumns = [
    { title: '药物名称', dataIndex: 'drugName', key: 'drugName', width: 140 },
    { title: '通用名', dataIndex: 'genericName', key: 'genericName', width: 120 },
    { title: '规格', dataIndex: 'specification', key: 'specification', width: 100 },
    { title: '剂量', dataIndex: 'dosage', key: 'dosage', width: 80 },
    { title: '频次', dataIndex: 'frequency', key: 'frequency', width: 90 },
    { title: '用法', dataIndex: 'administrationRoute', key: 'administrationRoute', width: 80 },
    {
      title: '起止日期',
      key: 'dateRange',
      width: 180,
      render: (_: unknown, record: MedicationDto) => (
        <div style={{ fontSize: 12 }}>
          <div>{record.startDate ? dayjs(record.startDate).format('YYYY-MM-DD') : '-'}</div>
          <div style={{ color: '#8c8c8c' }}>至 {record.endDate ? dayjs(record.endDate).format('YYYY-MM-DD') : '长期'}</div>
        </div>
      ),
    },
    { title: '剩余量', dataIndex: 'remainingQuantity', key: 'remainingQuantity', width: 80 },
    {
      title: '操作',
      key: 'actions',
      width: 80,
      render: (_: unknown, record: MedicationDto) => (
        <Popconfirm
          title="确定要删除该药物吗？"
          onConfirm={() => handleDeleteMedication(record.id)}
          okText="确认"
          cancelText="取消"
        >
          <Button type="link" size="small" danger icon={<DeleteOutlined />}>
            删除
          </Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="老人管理"
        subtitle="管理养老院老人信息、档案和用药"
        breadcrumb={[{ title: '业务管理' }, { title: '老人管理' }]}
        actions={[
          { key: 'create', label: '新建老人', icon: <PlusOutlined />, type: 'primary', onClick: handleCreate },
          { key: 'refresh', label: '刷新', icon: <ReloadOutlined />, onClick: handleReset },
        ]}
      />

      <Card style={{ marginBottom: 16 }}>
        <Form layout="vertical" form={queryForm} onFinish={handleSearch}>
          <Row gutter={16}>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item name="keyword" label="关键词搜索">
                <Input placeholder="姓名/电话/身份证" allowClear prefix={<SearchOutlined />} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item name="gender" label="性别">
                <GenderSelect placeholder="请选择性别" allowClear />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item name="careLevelType" label="护理等级">
                <CareLevelTypeSelect placeholder="请选择护理等级" allowClear />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item name="sourceType" label="来源">
                <SourceTypeSelect placeholder="请选择来源" allowClear />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item name="isActive" label="状态">
                <Select
                  placeholder="请选择状态"
                  allowClear
                  options={[
                    { label: '在院', value: true },
                    { label: '离院', value: false },
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
          scroll={{ x: 1200 }}
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

      <Drawer
        title={drawerMode === 'create' ? '新建老人档案' : drawerMode === 'edit' ? '编辑老人档案' : '老人档案详情'}
        width={720}
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        maskClosable={false}
        extra={
          drawerMode !== 'view' ? (
            <Space>
              <Button onClick={() => setDrawerVisible(false)}>取消</Button>
              <Button type="primary" onClick={handleSubmit} loading={detailLoading}>
                {drawerMode === 'create' ? '创建' : '保存'}
              </Button>
            </Space>
          ) : null
        }
      >
        <Spin spinning={detailLoading}>
          {drawerMode === 'view' && currentElder ? (
            <div>
              <Descriptions title="基本信息" bordered size="small" column={2} style={{ marginBottom: 16 }}>
                <Descriptions.Item label="姓名" span={1}>{currentElder.name}</Descriptions.Item>
                <Descriptions.Item label="性别"><GenderTag value={currentElder.gender} /></Descriptions.Item>
                <Descriptions.Item label="出生日期">{dayjs(currentElder.dateOfBirth).format('YYYY-MM-DD')}</Descriptions.Item>
                <Descriptions.Item label="年龄">{currentElder.age} 岁</Descriptions.Item>
                <Descriptions.Item label="身份证号">{currentElder.idCardNumber || '-'}</Descriptions.Item>
                <Descriptions.Item label="联系电话">{currentElder.phoneNumber || '-'}</Descriptions.Item>
                <Descriptions.Item label="紧急联系人" span={2}>{currentElder.emergencyContact || '-'}</Descriptions.Item>
                <Descriptions.Item label="紧急电话" span={2}>{currentElder.emergencyPhone || '-'}</Descriptions.Item>
                <Descriptions.Item label="地址" span={2}>{currentElder.address || '-'}</Descriptions.Item>
              </Descriptions>

              <Descriptions title="护理信息" bordered size="small" column={2} style={{ marginBottom: 16 }}>
                <Descriptions.Item label="护理等级" span={2}>
                  {currentElder.careLevel ? (
                    <Space direction="vertical" size={4}>
                      <Space>
                        <CareLevelTypeTag value={currentElder.careLevel.levelType} />
                        <Tag color="blue">{currentElder.careLevel.levelName}</Tag>
                      </Space>
                      {currentElder.careLevel.serviceStandards && (
                        <span style={{ fontSize: 12, color: '#8c8c8c' }}>
                          {currentElder.careLevel.serviceStandards}
                        </span>
                      )}
                    </Space>
                  ) : '-'}
                </Descriptions.Item>
                <Descriptions.Item label="日护理时长">
                  {currentElder.careLevel?.dailyCareHours ? `${currentElder.careLevel.dailyCareHours} 小时` : '-'}
                </Descriptions.Item>
                <Descriptions.Item label="护患比">
                  {currentElder.careLevel?.nurseRatio ? `1:${currentElder.careLevel.nurseRatio}` : '-'}
                </Descriptions.Item>
                <Descriptions.Item label="月费用">
                  {currentElder.careLevel?.monthlyFee ? `¥${currentElder.careLevel.monthlyFee}` : '-'}
                </Descriptions.Item>
                <Descriptions.Item label="来源">
                  <SourceTypeTag value={currentElder.sourceType} />
                  {currentElder.sourceDetail && ` (${currentElder.sourceDetail})`}
                </Descriptions.Item>
                <Descriptions.Item label="状态">
                  {currentElder.isActive ? <Tag color="success">在院</Tag> : <Tag color="default">离院</Tag>}
                </Descriptions.Item>
              </Descriptions>

              <Descriptions title="健康信息" bordered size="small" column={1}>
                <Descriptions.Item label="病史">{currentElder.medicalHistory || '-'}</Descriptions.Item>
                <Descriptions.Item label="过敏史">{currentElder.allergyInfo || '-'}</Descriptions.Item>
                <Descriptions.Item label="饮食要求">{currentElder.dietaryRequirements || '-'}</Descriptions.Item>
                <Descriptions.Item label="备注">{currentElder.notes || '-'}</Descriptions.Item>
              </Descriptions>

              <Divider />

              <Divider orientation="left" plain style={{ marginTop: 0 }}>
                <Space>
                  <MedicineBoxOutlined />
                  用药清单（{currentElder.medications?.length || 0}）
                </Space>
              </Divider>
              {currentElder.medications && currentElder.medications.length > 0 ? (
                <Table
                  size="small"
                  dataSource={currentElder.medications}
                  rowKey="id"
                  pagination={false}
                  columns={[
                    { title: '药物名', dataIndex: 'drugName', key: 'drugName' },
                    { title: '规格', dataIndex: 'specification', key: 'specification' },
                    { title: '剂量', dataIndex: 'dosage', key: 'dosage' },
                    { title: '频次', dataIndex: 'frequency', key: 'frequency' },
                    { title: '用法', dataIndex: 'administrationRoute', key: 'administrationRoute' },
                    { title: '剩余量', dataIndex: 'remainingQuantity', key: 'remainingQuantity' },
                  ]}
                />
              ) : (
                <Empty description="暂无用药记录" />
              )}
            </div>
          ) : (
            <Form layout="vertical" form={elderForm} preserve={false}>
              <Divider orientation="left" plain>基本信息</Divider>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="name"
                    label="姓名"
                    rules={[{ required: true, message: '请输入姓名' }]}
                  >
                    <Input placeholder="请输入姓名" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="gender"
                    label="性别"
                    rules={[{ required: true, message: '请选择性别' }]}
                  >
                    <GenderSelect placeholder="请选择性别" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="dateOfBirth"
                    label="出生日期"
                    rules={[{ required: true, message: '请选择出生日期' }]}
                  >
                    <DatePicker style={{ width: '100%' }} placeholder="请选择出生日期" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="idCardNumber"
                    label="身份证号"
                    rules={[{ pattern: /(^\d{15}$)|(^\d{17}(\d|X|x)$)/, message: '身份证号格式不正确' }]}
                  >
                    <Input placeholder="请输入身份证号" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="phoneNumber" label="联系电话">
                    <Input placeholder="请输入联系电话" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="address" label="地址">
                    <Input placeholder="请输入地址" />
                  </Form.Item>
                </Col>
              </Row>

              <Divider orientation="left" plain>紧急联系人</Divider>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="emergencyContact" label="紧急联系人">
                    <Input placeholder="请输入紧急联系人姓名" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="emergencyPhone" label="紧急联系电话">
                    <Input placeholder="请输入紧急联系电话" />
                  </Form.Item>
                </Col>
              </Row>

              <Divider orientation="left" plain>护理信息</Divider>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="sourceType"
                    label="来源"
                    rules={[{ required: true, message: '请选择来源' }]}
                  >
                    <SourceTypeSelect placeholder="请选择来源" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="sourceDetail" label="来源说明">
                    <Input placeholder="请输入来源说明" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="careLevelId" label="护理等级">
                    <Select
                      placeholder="请选择护理等级"
                      options={careLevels.map((cl) => ({
                        label: `${cl.levelName}（${getEnumOptions(careLevelTypeMap).find(o => o.value === cl.levelType)?.label || ''}）`,
                        value: cl.id,
                      }))}
                    />
                  </Form.Item>
                </Col>
                {drawerMode === 'edit' && (
                  <Col span={12}>
                    <Form.Item name="isActive" label="状态" valuePropName="checked">
                      <Select
                        placeholder="请选择状态"
                        options={[
                          { label: '在院', value: true },
                          { label: '离院', value: false },
                        ]}
                      />
                    </Form.Item>
                  </Col>
                )}
              </Row>

              <Divider orientation="left" plain>健康信息</Divider>
              <Row gutter={16}>
                <Col span={24}>
                  <Form.Item name="medicalHistory" label="病史">
                    <TextArea rows={2} placeholder="请输入病史" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="allergyInfo" label="过敏史">
                    <TextArea rows={2} placeholder="请输入过敏史" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="dietaryRequirements" label="饮食要求">
                    <TextArea rows={2} placeholder="请输入饮食要求" />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item name="notes" label="备注">
                    <TextArea rows={2} placeholder="请输入备注" />
                  </Form.Item>
                </Col>
              </Row>
            </Form>
          )}
        </Spin>
      </Drawer>

      <Modal
        title={
          <Space>
            <MedicineBoxOutlined />
            <span>{medicationElderName} - 药物管理</span>
          </Space>
        }
        width={1100}
        open={medicationModalVisible}
        onCancel={() => setMedicationModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setMedicationModalVisible(false)}>关闭</Button>,
        ]}
        maskClosable={false}
      >
        <Card
          type="inner"
          title="新增药物"
          style={{ marginBottom: 16 }}
          size="small"
        >
          <Form layout="vertical" form={medicationForm} preserve={false}>
            <Row gutter={16}>
              <Col xs={24} sm={12} md={8}>
                <Form.Item
                  name="drugName"
                  label="药物名称 *"
                  rules={[{ required: true, message: '请输入药物名称' }]}
                >
                  <Input placeholder="请输入药物名称" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Form.Item name="genericName" label="通用名">
                  <Input placeholder="请输入通用名" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Form.Item name="specification" label="规格">
                  <Input placeholder="例如：500mg" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Form.Item name="dosage" label="剂量">
                  <Input placeholder="例如：1片" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Form.Item name="frequency" label="频次">
                  <Input placeholder="例如：每日3次" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Form.Item name="administrationRoute" label="用法">
                  <Input placeholder="例如：口服" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Form.Item name="startDate" label="开始日期">
                  <DatePicker style={{ width: '100%' }} placeholder="选择开始日期" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Form.Item name="endDate" label="结束日期">
                  <DatePicker style={{ width: '100%' }} placeholder="选择结束日期（留空为长期）" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Form.Item name="remainingQuantity" label="剩余量">
                  <Input type="number" placeholder="例如：30" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Form.Item name="prescribingDoctor" label="开方医生">
                  <Input placeholder="请输入医生姓名" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Form.Item name="storageConditions" label="储存条件">
                  <Input placeholder="例如：阴凉处" />
                </Form.Item>
              </Col>
              <Col xs={24}>
                <Form.Item style={{ marginBottom: 0 }}>
                  <Button type="primary" icon={<PlusOutlined />} onClick={handleAddMedication}>
                    添加药物
                  </Button>
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="usageInstructions" label="使用说明">
                  <TextArea rows={2} placeholder="请输入使用说明" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="precautions" label="注意事项">
                  <TextArea rows={2} placeholder="请输入注意事项" />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Card>

        <Divider orientation="left" plain style={{ marginTop: 0 }}>
          当前药物清单
        </Divider>
        <Table
          size="small"
          loading={medicationLoading}
          columns={medicationColumns}
          dataSource={medicationList}
          rowKey="id"
          pagination={false}
          scroll={{ x: 900 }}
          locale={{ emptyText: <Empty description="暂无用药记录" /> }}
        />
      </Modal>
    </div>
  );
};

export default ElderManagement;
