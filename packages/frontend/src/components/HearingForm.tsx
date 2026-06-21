'use client';

import { useEffect, useMemo } from 'react';
import {
  Form,
  Select,
  DatePicker,
  Input,
  InputNumber,
  Switch,
  Button,
  Space,
  Row,
  Col,
  Divider,
  App,
  SelectProps,
} from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import type { Case, Court, CourtRoom, Judge, User, Hearing } from '@/types';
import { HearingStatus } from '@/types';

const { TextArea } = Input;
const { RangePicker } = DatePicker;

export interface HearingFormValues {
  caseId: string;
  courtId: string;
  courtRoomId: string;
  presidingJudgeId?: string;
  timeRange: [Dayjs, Dayjs];
  hearingType: string;
  judgeSummary?: string;
  preparationItems?: string;
  materials?: string;
  status: HearingStatus;
  isImportant: boolean;
  priority: number;
  lawyerIds: string[];
}

interface HearingFormProps {
  initialValues?: Partial<Hearing>;
  loading?: boolean;
  onSubmit: (values: HearingFormValues) => void;
  onCancel: () => void;
}

const mockCases: Case[] = [
  {
    id: 'case-1',
    caseNo: 'AJ2024001',
    title: '某某公司诉张三合同纠纷案',
    caseType: '民事',
    status: 'ACTIVE' as any,
    ownerClientId: 'client-1',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
  {
    id: 'case-2',
    caseNo: 'AJ2024002',
    title: '李四与王五离婚财产分割案',
    caseType: '民事',
    status: 'ACTIVE' as any,
    ownerClientId: 'client-2',
    createdAt: '2024-01-02',
    updatedAt: '2024-01-02',
  },
  {
    id: 'case-3',
    caseNo: 'AJ2024003',
    title: '赵六职务侵占案',
    caseType: '刑事',
    status: 'ACTIVE' as any,
    ownerClientId: 'client-3',
    createdAt: '2024-01-03',
    updatedAt: '2024-01-03',
  },
];

const mockCourts: Court[] = [
  {
    id: 'court-1',
    name: '北京市朝阳区人民法院',
    level: '基层法院',
    province: '北京市',
    city: '北京市',
    district: '朝阳区',
    address: '北京市朝阳区朝阳公园南路甲2号',
  },
  {
    id: 'court-2',
    name: '北京市海淀区人民法院',
    level: '基层法院',
    province: '北京市',
    city: '北京市',
    district: '海淀区',
    address: '北京市海淀区丹棱街12号',
  },
];

const mockCourtRooms: CourtRoom[] = [
  { id: 'room-1', courtId: 'court-1', roomNo: 'A101', roomName: '第一法庭', capacity: 50, floor: '1层' },
  { id: 'room-2', courtId: 'court-1', roomNo: 'A102', roomName: '第二法庭', capacity: 30, floor: '1层' },
  { id: 'room-3', courtId: 'court-1', roomNo: 'B201', roomName: '第三法庭', capacity: 80, floor: '2层' },
  { id: 'room-4', courtId: 'court-2', roomNo: '001', roomName: '中关村法庭', capacity: 40, floor: '1层' },
  { id: 'room-5', courtId: 'court-2', roomNo: '002', roomName: '四季青法庭', capacity: 35, floor: '2层' },
];

const mockJudges: Judge[] = [
  { id: 'judge-1', courtId: 'court-1', name: '陈法官', title: '审判员', department: '民事一庭' },
  { id: 'judge-2', courtId: 'court-1', name: '刘法官', title: '审判长', department: '民事一庭' },
  { id: 'judge-3', courtId: 'court-1', name: '周法官', title: '审判员', department: '刑事庭' },
  { id: 'judge-4', courtId: 'court-2', name: '吴法官', title: '审判员', department: '知产庭' },
  { id: 'judge-5', courtId: 'court-2', name: '郑法官', title: '审判长', department: '知产庭' },
];

const mockLawyers: User[] = [
  {
    id: 'lawyer-1',
    username: 'lawyer_zhang',
    email: 'zhang@firm.com',
    realName: '张律师',
    role: 'LAWYER' as any,
    barNumber: '11101202000001',
    department: '诉讼一部',
    isActive: true,
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 'lawyer-2',
    username: 'lawyer_li',
    email: 'li@firm.com',
    realName: '李律师',
    role: 'LAWYER' as any,
    barNumber: '11101202000002',
    department: '诉讼一部',
    isActive: true,
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 'lawyer-3',
    username: 'lawyer_wang',
    email: 'wang@firm.com',
    realName: '王律师',
    role: 'LAWYER' as any,
    barNumber: '11101202000003',
    department: '诉讼二部',
    isActive: true,
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 'lawyer-4',
    username: 'lawyer_zhao',
    email: 'zhao@firm.com',
    realName: '赵律师',
    role: 'LAWYER' as any,
    barNumber: '11101202000004',
    department: '知产部',
    isActive: true,
    createdAt: '',
    updatedAt: '',
  },
];

const hearingTypeOptions = [
  { value: '一审开庭', label: '一审开庭' },
  { value: '二审开庭', label: '二审开庭' },
  { value: '听证', label: '听证' },
  { value: '调解', label: '调解' },
  { value: '仲裁', label: '仲裁' },
  { value: '谈话', label: '谈话' },
  { value: '宣判', label: '宣判' },
];

const statusOptions = [
  { value: HearingStatus.SCHEDULED, label: '已排期' },
  { value: HearingStatus.CONFIRMED, label: '已确认' },
];

export default function HearingForm({
  initialValues,
  loading,
  onSubmit,
  onCancel,
}: HearingFormProps) {
  const [form] = Form.useForm<HearingFormValues>();
  const { message } = App.useApp();

  const selectedCourtId = Form.useWatch('courtId', form);

  const filteredCourtRooms = useMemo<SelectProps['options']>(() => {
    if (!selectedCourtId) return [];
    return mockCourtRooms
      .filter((r) => r.courtId === selectedCourtId)
      .map((r) => ({
        value: r.id,
        label: `${r.roomNo} ${r.roomName || ''} (${r.floor || ''})`.trim(),
      }));
  }, [selectedCourtId]);

  const filteredJudges = useMemo<SelectProps['options']>(() => {
    if (!selectedCourtId) return [];
    return mockJudges
      .filter((j) => j.courtId === selectedCourtId)
      .map((j) => ({
        value: j.id,
        label: `${j.name} - ${j.title || ''} ${j.department || ''}`.trim(),
      }));
  }, [selectedCourtId]);

  const caseOptions: SelectProps['options'] = mockCases.map((c) => ({
    value: c.id,
    label: `[${c.caseNo}] ${c.title}`,
  }));

  const courtOptions: SelectProps['options'] = mockCourts.map((c) => ({
    value: c.id,
    label: c.name,
  }));

  const lawyerOptions: SelectProps['options'] = mockLawyers.map((l) => ({
    value: l.id,
    label: `${l.realName} (${l.department || ''})`.trim(),
  }));

  useEffect(() => {
    if (initialValues) {
      const startTime = initialValues.startTime ? dayjs(initialValues.startTime) : null;
      const endTime = initialValues.endTime ? dayjs(initialValues.endTime) : null;

      const lawyerIds = initialValues.assignments
        ?.filter((a) => a.assigneeId)
        .map((a) => a.assigneeId) || [];

      form.setFieldsValue({
        caseId: initialValues.caseId,
        courtId: initialValues.courtId,
        courtRoomId: initialValues.courtRoomId,
        presidingJudgeId: initialValues.presidingJudgeId,
        timeRange: startTime && endTime ? [startTime, endTime] : undefined,
        hearingType: initialValues.hearingType,
        judgeSummary: initialValues.judgeSummary,
        preparationItems: initialValues.preparationItems,
        materials: initialValues.materials,
        status: initialValues.status || HearingStatus.SCHEDULED,
        isImportant: initialValues.isImportant || false,
        priority: initialValues.priority || 5,
        lawyerIds,
      });
    }
  }, [initialValues, form]);

  const handleFinish = (values: HearingFormValues) => {
    if (!values.timeRange || values.timeRange.length < 2) {
      message.error('请选择开庭时间范围');
      return;
    }
    onSubmit(values);
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleFinish}
      initialValues={{
        status: HearingStatus.SCHEDULED,
        isImportant: false,
        priority: 5,
      }}
    >
      <Divider orientation="left" plain style={{ marginTop: 0 }}>
        基础信息
      </Divider>
      <Row gutter={16}>
        <Col span={24}>
          <Form.Item
            label="案件选择"
            name="caseId"
            rules={[{ required: true, message: '请选择案件' }]}
          >
            <Select
              placeholder="请选择案件"
              showSearch
              optionFilterProp="label"
              options={caseOptions}
            />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            label="法院"
            name="courtId"
            rules={[{ required: true, message: '请选择法院' }]}
          >
            <Select
              placeholder="请选择法院"
              options={courtOptions}
              onChange={() => {
                form.setFieldsValue({ courtRoomId: undefined, presidingJudgeId: undefined });
              }}
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label="法庭"
            name="courtRoomId"
            rules={[{ required: true, message: '请选择法庭' }]}
          >
            <Select
              placeholder="请先选择法院"
              options={filteredCourtRooms}
              disabled={!selectedCourtId}
            />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item label="法官" name="presidingJudgeId">
            <Select
              placeholder="请先选择法院"
              options={filteredJudges}
              disabled={!selectedCourtId}
              allowClear
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label="开庭类型"
            name="hearingType"
            rules={[{ required: true, message: '请选择开庭类型' }]}
          >
            <Select
              placeholder="请选择开庭类型"
              options={hearingTypeOptions}
            />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={24}>
          <Form.Item
            label="开庭时间"
            name="timeRange"
            rules={[{ required: true, message: '请选择开庭时间' }]}
          >
            <RangePicker
              showTime={{
                showMinute: true,
                showSecond: false,
                format: 'HH:mm',
              }}
              format="YYYY-MM-DD HH:mm"
              style={{ width: '100%' }}
              placeholder={['开始时间', '结束时间']}
            />
          </Form.Item>
        </Col>
      </Row>

      <Divider orientation="left" plain>
        分派律师
      </Divider>
      <Row gutter={16}>
        <Col span={24}>
          <Form.Item
            label="分派律师（可多选）"
            name="lawyerIds"
            rules={[{ required: true, message: '请至少选择一位律师' }]}
          >
            <Select
              mode="multiple"
              placeholder="请选择分派的律师"
              options={lawyerOptions}
              optionFilterProp="label"
              maxTagCount="responsive"
            />
          </Form.Item>
        </Col>
      </Row>

      <Divider orientation="left" plain>
        状态与备注
      </Divider>
      <Row gutter={16}>
        <Col span={8}>
          <Form.Item label="状态" name="status">
            <Select options={statusOptions} />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item label="优先级" name="priority">
            <InputNumber min={1} max={10} style={{ width: '100%' }} />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item label="重要开庭" name="isImportant" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={24}>
          <Form.Item label="法官摘要" name="judgeSummary">
            <TextArea rows={2} placeholder="请输入法官摘要信息" maxLength={500} showCount />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={24}>
          <Form.Item label="准备事项" name="preparationItems">
            <TextArea rows={2} placeholder="请输入准备事项" maxLength={500} showCount />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={24}>
          <Form.Item label="材料说明" name="materials">
            <TextArea rows={2} placeholder="请输入材料说明" maxLength={500} showCount />
          </Form.Item>
        </Col>
      </Row>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 8 }}>
        <Space>
          <Button onClick={onCancel}>取消</Button>
          <Button type="primary" htmlType="submit" loading={loading}>
            {initialValues ? '保存修改' : '创建开庭'}
          </Button>
        </Space>
      </div>
    </Form>
  );
}

export { mockCases, mockCourts, mockCourtRooms, mockJudges, mockLawyers };
