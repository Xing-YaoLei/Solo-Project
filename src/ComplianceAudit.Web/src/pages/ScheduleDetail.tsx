import { useEffect, useState, useMemo } from 'react';
import {
  Tabs, Card, Descriptions, Tag, Button, Space, Table, Modal, Form, Input,
  Select, InputNumber, DatePicker, Row, Col, message, Drawer, List, Upload,
  Popconfirm, Checkbox, Typography, Badge, Divider, Tooltip, Progress,
  Dropdown, Avatar, Empty, Timeline
} from 'antd';
import {
  ArrowLeftOutlined, PlusOutlined, UploadOutlined, SendOutlined,
  CheckSquareOutlined, FileTextOutlined, PaperClipOutlined,
  AuditOutlined, FileSearchOutlined, WarningOutlined, ReloadOutlined,
  ExclamationCircleOutlined, HistoryOutlined, SettingOutlined,
  DownloadOutlined, SafetyCertificateOutlined
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import type { UploadProps } from 'antd';
import {
  schedulesApi, checklistApi, samplingApi, checkRecordsApi,
  rectificationsApi, evidenceMissingApi, evidencesApi, regulationsApi,
  processingHistoryApi
} from '@/services/api';
import { useRolePermissions } from '@/store/authStore';
import type {
  ScheduleDetailDto, ChecklistItemDto, SamplingListDto, CheckRecordListDto,
  RectificationListDto, EvidenceMissingListDto, EvidenceDto, ProcessingHistoryDto,
  CheckStatus, RiskLevel as RiskLevelEnum
} from '@/types';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const RiskTag = ({ level }: { level: number }) => {
  const map: Record<number, { color: string; text: string; cls: string }> = {
    1: { color: 'green', text: '低', cls: 'tag-low' },
    2: { color: 'orange', text: '中', cls: 'tag-medium' },
    3: { color: 'red', text: '高', cls: 'tag-high' },
    4: { color: '#000', text: '严重', cls: 'tag-critical' }
  };
  const cfg = map[level] ?? map[1];
  return <Tag className={cfg.cls} color={cfg.color}>{cfg.text}风险</Tag>;
};

const StatusTag = ({ status }: { status: number }) => {
  const map: Record<number, { color: string; text: string }> = {
    1: { color: 'default', text: '待处理' },
    2: { color: 'processing', text: '进行中' },
    3: { color: 'warning', text: '待复核' },
    4: { color: 'processing', text: '已复核' },
    5: { color: 'success', text: '已通过' },
    6: { color: 'error', text: '已拒绝' },
    7: { color: 'default', text: '已关闭' }
  };
  const cfg = map[status] ?? map[1];
  return <Tag color={cfg.color}>{cfg.text}</Tag>;
};

const RectStatusTag = ({ status }: { status: number }) => {
  const map: Record<number, { color: string; text: string }> = {
    1: { color: 'default', text: '未开始' },
    2: { color: 'processing', text: '整改中' },
    3: { color: 'warning', text: '待复核' },
    4: { color: 'success', text: '已验证' },
    5: { color: 'default', text: '已关闭' },
    6: { color: 'error', text: '已逾期' }
  };
  const cfg = map[status] ?? map[1];
  return <Tag color={cfg.color}>{cfg.text}</Tag>;
};

const EvStatusTag = ({ status }: { status: number }) => {
  const map: Record<number, { color: string; text: string }> = {
    1: { color: 'success', text: '完整' },
    2: { color: 'error', text: '缺失' },
    3: { color: 'warning', text: '待补充' },
    4: { color: 'processing', text: '已补待审' },
    5: { color: 'default', text: '已豁免' }
  };
  const cfg = map[status] ?? map[2];
  return <Tag color={cfg.color}>{cfg.text}</Tag>;
};

export default function ScheduleDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const scheduleId = Number(id);
  const { isAuditor, isBusinessOwner, isComplianceOfficer, isManagement } = useRolePermissions();

  const [loading, setLoading] = useState(false);
  const [schedule, setSchedule] = useState<ScheduleDetailDto | null>(null);
  const [checklist, setChecklist] = useState<ChecklistItemDto[]>([]);
  const [sampling, setSampling] = useState<SamplingListDto[]>([]);
  const [checkRecords, setCheckRecords] = useState<CheckRecordListDto[]>([]);
  const [rectifications, setRectifications] = useState<RectificationListDto[]>([]);
  const [evidenceMissing, setEvidenceMissing] = useState<EvidenceMissingListDto[]>([]);
  const [histories, setHistories] = useState<ProcessingHistoryDto[]>([]);
  const [activeTab, setActiveTab] = useState('overview');

  const [selectedChecklist, setSelectedChecklist] = useState<React.Key[]>([]);
  const [selectedSampling, setSelectedSampling] = useState<React.Key[]>([]);
  const [selectedCheckRecords, setSelectedCheckRecords] = useState<React.Key[]>([]);

  const [checklistDrawer, setChecklistDrawer] = useState<{ open: boolean; item?: ChecklistItemDto }>({ open: false });
  const [evidenceDrawer, setEvidenceDrawer] = useState<{ open: boolean; type: string; id: number } | null>(null);
  const [evidences, setEvidences] = useState<EvidenceDto[]>([]);
  const [historyDrawer, setHistoryDrawer] = useState<{ open: boolean; type: string; id: number }>({ open: false });

  const [samplingModalOpen, setSamplingModalOpen] = useState(false);
  const [samplingForm] = Form.useForm();
  const [samplingBatch, setSamplingBatch] = useState<any[]>([]);

  const [rectificationModal, setRectificationModal] = useState<{ open: boolean; data?: any }>({ open: false });
  const [rectificationForm] = Form.useForm();

  const [reviewModal, setReviewModal] = useState<{ open: boolean; type: string; id: number } | null>(null);
  const [reviewForm] = Form.useForm();

  const [evMissingModal, setEvMissingModal] = useState<{ open: boolean; checkRecordId?: number; checklistItemId?: number }>({ open: false });
  const [evMissingForm] = Form.useForm();

  const [generateChecklistModal, setGenerateChecklistModal] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    loadAll();
  }, [scheduleId]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [schRes, clRes, sampRes, crRes, rectRes, emRes, usersRes] = await Promise.all([
        schedulesApi.get(scheduleId),
        checklistApi.getByScheduleId(scheduleId),
        samplingApi.getAllByScheduleId(scheduleId),
        checkRecordsApi.getByScheduleId(scheduleId),
        rectificationsApi.getByScheduleId(scheduleId),
        evidenceMissingApi.getByScheduleId(scheduleId),
        regulationsApi.getTemplates((await schedulesApi.get(scheduleId)).data?.regulationId ?? 0)
      ]);
      if (schRes.success) setSchedule(schRes.data!);
      if (clRes.success) setChecklist(clRes.data ?? []);
      if (sampRes.success) setSampling(sampRes.data ?? []);
      if (crRes.success) setCheckRecords(crRes.data ?? []);
      if (rectRes.success) setRectifications(rectRes.data ?? []);
      if (emRes.success) setEvidenceMissing(emRes.data ?? []);
      if (usersRes.success) setTemplates(usersRes.data ?? []);
      try {
        const u = await (await import('@/services/api')).authApi.getUsers();
        if (u.success) setUsers(u.data ?? []);
      } catch {}
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async (type: string, entityId: number) => {
    try {
      const res = await processingHistoryApi.list({ entityType: type, entityId, pageNumber: 1, pageSize: 200 });
      if (res.success) setHistories((res.data as any)?.items ?? []);
    } catch { setHistories([]); }
  };

  const loadEvidences = async (type: string, id: number) => {
    try {
      let res: any;
      if (type === 'checkRecord') res = await evidencesApi.getByCheckRecordId(id);
      else if (type === 'checklistItem') res = await evidencesApi.getByChecklistItemId(id);
      else if (type === 'sampling') res = await evidencesApi.getBySamplingId(id);
      else if (type === 'rectification') res = await evidencesApi.getByRectificationId(id);
      if (res?.success) setEvidences(res.data ?? []);
    } catch { setEvidences([]); }
  };

  const handleSaveChecklistResult = async (values: any) => {
    if (!checklistDrawer.item) return;
    try {
      if (values.isCompliant !== undefined) {
        await checklistApi.setResult(checklistDrawer.item.id, values.isCompliant, values.findings);
      }
      await checklistApi.update({
        id: checklistDrawer.item.id,
        auditNotes: values.auditNotes,
        evidenceStatus: values.evidenceStatus,
        status: 2,
        content: checklistDrawer.item.content,
        riskLevel: checklistDrawer.item.riskLevel,
        evidenceRequirements: checklistDrawer.item.evidenceRequirements,
        isCompliant: values.isCompliant ?? checklistDrawer.item.isCompliant,
        findings: values.findings ?? checklistDrawer.item.findings
      });
      message.success('保存成功');
      setChecklistDrawer({ open: false });
      loadAll();
    } catch {
      message.error('保存失败');
    }
  };

  const handleCreateSampling = async (values: any) => {
    const records = samplingBatch.map(b => ({
      sourceSystem: values.sourceSystem,
      sourceModule: values.sourceModule,
      documentType: values.documentType,
      ...b
    }));
    try {
      const res = await samplingApi.create({ scheduleId, items: records });
      if (res.success) {
        message.success(`成功创建${res.data}条抽样记录`);
        setSamplingModalOpen(false);
        samplingForm.resetFields();
        setSamplingBatch([]);
        loadAll();
      }
    } catch { message.error('创建失败'); }
  };

  const handleCreateRectification = async (values: any) => {
    try {
      const res = await rectificationsApi.create({
        scheduleId,
        ...values,
        deadline: values.deadline.toISOString(),
        riskLevel: values.riskLevel ?? 2
      });
      if (res.success) {
        message.success('整改计划创建成功');
        setRectificationModal({ open: false });
        rectificationForm.resetFields();
        loadAll();
      }
    } catch { message.error('创建失败'); }
  };

  const handleBulkChecklistStatus = async (status: number) => {
    if (selectedChecklist.length === 0) return;
    try {
      const res = await checklistApi.bulkUpdateStatus(selectedChecklist as number[], status);
      if (res.success) {
        message.success(`批量处理成功，${selectedChecklist.length}条`);
        setSelectedChecklist([]);
        loadAll();
      }
    } catch { message.error('操作失败'); }
  };

  const handleBulkSamplingStatus = async (status: number) => {
    if (selectedSampling.length === 0) return;
    try {
      const res = await samplingApi.bulkUpdateStatus(selectedSampling as number[], status);
      if (res.success) {
        message.success(`批量处理成功，${selectedSampling.length}条`);
        setSelectedSampling([]);
        loadAll();
      }
    } catch { message.error('操作失败'); }
  };

  const handleBulkCheckRecordsStatus = async (status: number) => {
    if (selectedCheckRecords.length === 0) return;
    try {
      const res = await checkRecordsApi.bulkUpdateStatus(selectedCheckRecords as number[], status);
      if (res.success) {
        message.success(`批量处理成功，${selectedCheckRecords.length}条`);
        setSelectedCheckRecords([]);
        loadAll();
      }
    } catch { message.error('操作失败'); }
  };

  const handleCreateEvMissing = async (values: any) => {
    try {
      const res = await evidenceMissingApi.create({
        checkRecordId: evMissingModal.checkRecordId,
        checklistItemId: evMissingModal.checklistItemId,
        ...values
      });
      if (res.success) {
        message.success('证据缺失记录已创建');
        setEvMissingModal({ open: false });
        evMissingForm.resetFields();
        loadAll();
      }
    } catch { message.error('创建失败'); }
  };

  const handleApproveRect = async (id: number, data: any) => {
    try {
      const res = await rectificationsApi.verify({ id, ...data });
      if (res.success) {
        message.success(data.isVerified ? '整改验证通过' : '整改验证未通过');
        setReviewModal(null);
        reviewForm.resetFields();
        loadAll();
      }
    } catch { message.error('操作失败'); }
  };

  const handleGenerateChecklist = async (templateId: number) => {
    try {
      const res = await schedulesApi.generateChecklist(scheduleId, templateId);
      if (res.success) {
        message.success('检查清单已生成');
        setGenerateChecklistModal(false);
        loadAll();
      }
    } catch { message.error('生成失败'); }
  };

  const checklistCols = [
    { title: '序号', dataIndex: 'sortOrder', width: 60 },
    { title: '条款号', dataIndex: 'itemNo', width: 100 },
    {
      title: '检查内容', dataIndex: 'content', ellipsis: true,
      render: (t: string, r: any) => (
        <a onClick={() => setChecklistDrawer({ open: true, item: r })}>{t}</a>
      )
    },
    { title: '风险', dataIndex: 'riskLevel', width: 80, render: (l: number) => <RiskTag level={l} /> },
    { title: '证据状态', dataIndex: 'evidenceStatus', width: 100, render: (s: number) => <EvStatusTag status={s} /> },
    {
      title: '合规判定', dataIndex: 'isCompliant', width: 100,
      render: (v: boolean | undefined) => v === undefined ? <Tag>待判定</Tag>
        : v ? <Tag color="success">合规</Tag> : <Tag color="error">不合规</Tag>
    },
    { title: '附件数', dataIndex: 'evidenceCount', width: 80 },
    { title: '状态', dataIndex: 'status', width: 100, render: (s: number) => <StatusTag status={s} /> },
    {
      title: '操作', key: 'ops', width: 220, fixed: 'right' as const,
      render: (_: any, r: any) => (
        <Space size="small">
          <Button type="link" size="small" onClick={() => setChecklistDrawer({ open: true, item: r })}>录入</Button>
          <Button type="link" size="small" onClick={() => { setEvidenceDrawer({ type: 'checklistItem', id: r.id }); loadEvidences('checklistItem', r.id); }}>
            <PaperClipOutlined /> 附件({r.evidenceCount})
          </Button>
          <Button type="link" size="small" onClick={() => { setHistoryDrawer({ open: true, type: 'ChecklistItem', id: r.id }); loadHistory('ChecklistItem', r.id); }}>
            <HistoryOutlined /> 历史
          </Button>
          {isAuditor && <Popconfirm title="创建证据缺失记录？" onConfirm={() => setEvMissingModal({ open: true, checklistItemId: r.id })}>
            <Button type="link" size="small" danger icon={<ExclamationCircleOutlined />}>缺证据</Button>
          </Popconfirm>}
        </Space>
      )
    }
  ];

  const samplingCols = [
    { title: '抽样号', dataIndex: 'samplingNo', width: 180 },
    { title: '单据号', dataIndex: 'documentNo', width: 160 },
    { title: '类型', dataIndex: 'documentType', width: 100 },
    { title: '单据日期', dataIndex: 'documentDate', width: 120, render: (d: string) => dayjs(d).format('YYYY-MM-DD') },
    { title: '来源系统', dataIndex: 'sourceSystem', width: 120 },
    { title: '业务负责人', dataIndex: 'businessOwner', width: 100 },
    { title: '风险', dataIndex: 'riskLevel', width: 80, render: (l: number) => <RiskTag level={l} /> },
    { title: '检查数', dataIndex: 'checkRecordCount', width: 80 },
    { title: '状态', dataIndex: 'status', width: 100, render: (s: number) => <StatusTag status={s} /> },
    {
      title: '操作', key: 'ops', width: 200, fixed: 'right' as const,
      render: (_: any, r: any) => (
        <Space size="small">
          <Button type="link" size="small" onClick={() => setActiveTab('checkRecords')}>关联检查</Button>
          <Button type="link" size="small" onClick={() => { setEvidenceDrawer({ type: 'sampling', id: r.id }); loadEvidences('sampling', r.id); }}>
            <PaperClipOutlined /> 附件
          </Button>
        </Space>
      )
    }
  ];

  const crCols = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: '关联检查项', dataIndex: 'checklistItemNo', width: 100, render: (v: any) => v ?? '-' },
    { title: '关联单据', dataIndex: 'samplingDocNo', width: 140, render: (v: any) => v ?? '-' },
    {
      title: '发现问题', dataIndex: 'findings', ellipsis: true,
      render: (v: string) => <Paragraph ellipsis={{ rows: 2 }} style={{ margin: 0 }}>{v || '无'}</Paragraph>
    },
    { title: '风险', dataIndex: 'riskLevel', width: 80, render: (l: number) => <RiskTag level={l} /> },
    {
      title: '合规', dataIndex: 'isCompliant', width: 80,
      render: (v: boolean | undefined) => v === undefined ? <Tag>-</Tag> : v ? <Tag color="success">是</Tag> : <Tag color="error">否</Tag>
    },
    { title: '证据', dataIndex: 'evidenceStatus', width: 100, render: (s: number) => <EvStatusTag status={s} /> },
    { title: '附件', dataIndex: 'evidenceCount', width: 60 },
    { title: '状态', dataIndex: 'status', width: 100, render: (s: number) => <StatusTag status={s} /> },
    { title: '来源', dataIndex: 'sourceReference', width: 160, ellipsis: true },
    {
      title: '操作', key: 'ops', width: 260, fixed: 'right' as const,
      render: (_: any, r: any) => (
        <Space size="small">
          {isAuditor && r.status !== 5 && (
            <Popconfirm title="确认提交复核？" onConfirm={() => checkRecordsApi.submit(r.id).then(() => { message.success('已提交'); loadAll(); })}>
              <Button type="link" size="small" icon={<SendOutlined />}>提交</Button>
            </Popconfirm>
          )}
          {isComplianceOfficer && r.status === 3 && (
            <Button type="link" size="small" icon={<CheckSquareOutlined />} onClick={() => setReviewModal({ type: 'checkRecord', id: r.id })}>复核</Button>
          )}
          <Button type="link" size="small" onClick={() => { setEvidenceDrawer({ type: 'checkRecord', id: r.id }); loadEvidences('checkRecord', r.id); }}>
            <PaperClipOutlined /> 附件
          </Button>
          {isAuditor && <Popconfirm title="创建证据缺失记录？" onConfirm={() => setEvMissingModal({ open: true, checkRecordId: r.id })}>
            <Button type="link" size="small" danger icon={<ExclamationCircleOutlined />}>缺证据</Button>
          </Popconfirm>}
          <Button type="link" size="small" onClick={() => { setHistoryDrawer({ open: true, type: 'CheckRecord', id: r.id }); loadHistory('CheckRecord', r.id); }}>
            <HistoryOutlined /> 溯源
          </Button>
        </Space>
      )
    }
  ];

  const rectCols = [
    { title: '编号', dataIndex: 'rectificationNo', width: 180 },
    { title: '整改内容', dataIndex: 'title', ellipsis: true },
    { title: '负责人', dataIndex: 'ownerName', width: 100 },
    {
      title: '截止日期', dataIndex: 'deadline', width: 120,
      render: (d: string, r: any) => {
        const overdue = r.status === 6 || dayjs(d).isBefore(dayjs());
        return <Text type={overdue ? 'danger' : undefined}>{dayjs(d).format('YYYY-MM-DD')}</Text>;
      }
    },
    { title: '风险', dataIndex: 'riskLevel', width: 80, render: (l: number) => <RiskTag level={l} /> },
    { title: '状态', dataIndex: 'status', width: 100, render: (s: number) => <RectStatusTag status={s} /> },
    { title: '关联排程', dataIndex: 'scheduleTitle', width: 140, ellipsis: true },
    {
      title: '操作', key: 'ops', width: 220,
      render: (_: any, r: any) => (
        <Space size="small">
          {isBusinessOwner && r.status <= 2 && (
            <Popconfirm title="确认提交整改复核？" onConfirm={() => rectificationsApi.submit(r.id).then(() => { message.success('已提交'); loadAll(); })}>
              <Button type="link" size="small">提交</Button>
            </Popconfirm>
          )}
          {isComplianceOfficer && r.status === 3 && (
            <Button type="link" size="small" onClick={() => { rectificationForm.setFieldsValue(r); setRectificationModal({ open: true, data: r, mode: 'verify' as any }); }}>验证</Button>
          )}
          <Button type="link" size="small" onClick={() => { setEvidenceDrawer({ type: 'rectification', id: r.id }); loadEvidences('rectification', r.id); }}>
            <PaperClipOutlined />
          </Button>
        </Space>
      )
    }
  ];

  const emCols = [
    { title: '编号', dataIndex: 'missingNo', width: 180 },
    { title: '缺失说明', dataIndex: 'missingDescription', ellipsis: true },
    { title: '责任人', dataIndex: 'responsibleName', width: 100 },
    { title: '请求时间', dataIndex: 'requestedAt', width: 160, render: (d: string) => dayjs(d).format('YYYY-MM-DD HH:mm') },
    { title: '截止', dataIndex: 'deadline', width: 120, render: (d?: string) => d ? dayjs(d).format('YYYY-MM-DD') : '-' },
    { title: '附件数', dataIndex: 'evidenceCount', width: 80 },
    { title: '状态', dataIndex: 'status', width: 100, render: (s: number) => <EvStatusTag status={s} /> },
    {
      title: '操作', key: 'ops', width: 220,
      render: (_: any, r: any) => (
        <Space size="small">
          {isBusinessOwner && r.status === 3 && (
            <Button type="link" size="small">补充证据</Button>
          )}
          {isComplianceOfficer && r.status === 4 && (
            <Button type="link" size="small" onClick={() => setReviewModal({ type: 'evidenceMissing', id: r.id })}>审核</Button>
          )}
          {isManagement && !r.isWaived && (
            <Popconfirm title="确认豁免此证据要求？" onConfirm={() => evidenceMissingApi.waive({ id: r.id, waiveReason: '管理层豁免' }).then(() => { message.success('已豁免'); loadAll(); })}>
              <Button type="link" size="small">豁免</Button>
            </Popconfirm>
          )}
        </Space>
      )
    }
  ];

  const progressPct = useMemo(() => {
    if (!checklist.length) return 0;
    const done = checklist.filter(c => c.isCompliant !== undefined).length;
    return Math.round(done / checklist.length * 100);
  }, [checklist]);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/schedules')}>返回</Button>
        <div style={{ flex: 1 }}>
          <Title level={3} style={{ margin: 0 }}>
            {schedule?.title}
            <Space style={{ marginLeft: 12 }}>
              <StatusTag status={schedule?.status ?? 1} />
              <RiskTag level={schedule?.riskLevel ?? 2} />
            </Space>
          </Title>
          <Text type="secondary">编号：{schedule?.scheduleNo} · 创建：{dayjs(schedule?.createdAt).format('YYYY-MM-DD HH:mm')}</Text>
        </div>
        <Space>
          {isAuditor && checklist.length === 0 && (
            <Button icon={<FileTextOutlined />} onClick={() => setGenerateChecklistModal(true)}>生成检查清单</Button>
          )}
          {isAuditor && (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setSamplingModalOpen(true)}>新增抽样</Button>
          )}
          <Button icon={<ReloadOutlined />} onClick={loadAll}>刷新</Button>
        </Space>
      </div>

      {schedule && (
        <Card bordered={false} style={{ marginBottom: 16 }} styles={{ body: { padding: 20 } }}>
          <Descriptions column={4} size="small">
            <Descriptions.Item label="制度">{schedule.regulationName}</Descriptions.Item>
            <Descriptions.Item label="审计员">{schedule.auditorName}</Descriptions.Item>
            <Descriptions.Item label="业务负责人">{schedule.businessOwnerName || '-'}</Descriptions.Item>
            <Descriptions.Item label="截止日期"><Text type={dayjs(schedule.dueDate).isBefore(dayjs()) ? 'danger' : undefined}>{dayjs(schedule.dueDate).format('YYYY-MM-DD')}</Text></Descriptions.Item>
            <Descriptions.Item label="检查周期">{dayjs(schedule.startDate).format('YYYY-MM-DD')} ~ {dayjs(schedule.endDate).format('YYYY-MM-DD')}</Descriptions.Item>
            <Descriptions.Item label="检查项">{schedule.checklistItemCount} 项</Descriptions.Item>
            <Descriptions.Item label="抽样">{schedule.samplingRecordCount} 条</Descriptions.Item>
            <Descriptions.Item label="整改">{schedule.rectificationCount} 项</Descriptions.Item>
          </Descriptions>
          <Divider style={{ margin: '16px 0' }} />
          <Row gutter={[24, 0]}>
            <Col span={8}>
              <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>检查完成进度</Text>
              <Progress percent={progressPct} />
            </Col>
            <Col span={8}>
              <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>发现问题</Text>
              <Space>
                <Badge color="#52c41a" text={`合规 ${checklist.filter(c => c.isCompliant === true).length}`} />
                <Badge color="#ff4d4f" text={`不合规 ${checklist.filter(c => c.isCompliant === false).length}`} />
                <Badge color="#d9d9d9" text={`待判定 ${checklist.filter(c => c.isCompliant === undefined).length}`} />
              </Space>
            </Col>
            <Col span={8}>
              <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>证据状态</Text>
              <Space>
                <Badge status="success" text={`完整 ${checklist.filter(c => c.evidenceStatus === 1).length}`} />
                <Badge status="error" text={`缺失 ${checklist.filter(c => c.evidenceStatus === 2).length}`} />
                <Badge status="warning" text={`待补充 ${checklist.filter(c => c.evidenceStatus === 3).length}`} />
              </Space>
            </Col>
          </Row>
        </Card>
      )}

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'overview',
            label: <span><AuditOutlined /> 总览</span>,
            children: (
              <Row gutter={16}>
                <Col span={12}>
                  <Card title="检查清单概览" bordered={false} extra={<a onClick={() => setActiveTab('checklist')}>查看全部</a>}>
                    {checklist.length > 0 ? (
                      <List
                        size="small"
                        dataSource={checklist.slice(0, 5)}
                        renderItem={(item) => (
                          <List.Item key={item.id} onClick={() => setChecklistDrawer({ open: true, item })} style={{ cursor: 'pointer' }}>
                            <List.Item.Meta
                              title={<Space><Text>{item.itemNo}</Text><RiskTag level={item.riskLevel} /></Space>}
                              description={item.content}
                            />
                            <div>
                              {item.isCompliant === true ? <Tag color="success">合规</Tag> : item.isCompliant === false ? <Tag color="error">不合规</Tag> : <Tag>待判定</Tag>}
                            </div>
                          </List.Item>
                        )}
                      />
                    ) : <Empty description="暂无检查清单" />}
                  </Card>
                </Col>
                <Col span={12}>
                  <Card title="最近处理历史" bordered={false}>
                    <Timeline
                      mode="left"
                      items={histories.slice(0, 10).map((h, idx) => ({
                        color: idx === 0 ? 'blue' : undefined,
                        label: dayjs(h.operatedAt).format('MM-DD HH:mm'),
                        children: (
                          <div>
                            <Text strong>{h.actionType}</Text> · <Text type="secondary">{h.operatorName} ({h.operatorRoleName})</Text>
                            <Paragraph style={{ margin: '4px 0 0 0', color: 'rgba(0,0,0,0.65)' }} ellipsis={{ rows: 2 }}>{h.description}</Paragraph>
                          </div>
                        )
                      }))}
                    />
                  </Card>
                </Col>
              </Row>
            )
          },
          {
            key: 'checklist',
            label: <span><FileTextOutlined /> 检查清单 <Badge count={checklist.length} size="small" /></span>,
            children: (
              <>
                {selectedChecklist.length > 0 && (
                  <div className="bulk-action-bar">
                    <Space>
                      <Text>已选 <Badge count={selectedChecklist.length} style={{ backgroundColor: '#1677ff' }} /> 项</Text>
                      <Checkbox onChange={(e) => setSelectedChecklist(e.target.checked ? checklist.map(c => c.id as any) : [])}>全选</Checkbox>
                    </Space>
                    <Space>
                      {isAuditor && <Button type="primary" size="small" onClick={() => handleBulkChecklistStatus(2)}>批量标记进行中</Button>}
                      {isAuditor && <Button size="small" onClick={() => handleBulkChecklistStatus(3)}>批量提交复核</Button>}
                      {isComplianceOfficer && <Button size="small" onClick={() => handleBulkChecklistStatus(4)}>批量复核通过</Button>}
                      <Button size="small" onClick={() => setSelectedChecklist([])}>取消选择</Button>
                    </Space>
                  </div>
                )}
                <Card bordered={false} styles={{ body: { padding: 0 } }}>
                  <Table
                    size="middle"
                    rowKey="id"
                    dataSource={checklist}
                    columns={checklistCols}
                    rowSelection={{ selectedRowKeys: selectedChecklist, onChange: setSelectedChecklist }}
                    scroll={{ x: 1200 }}
                    pagination={false}
                  />
                </Card>
              </>
            )
          },
          {
            key: 'sampling',
            label: <span><FileSearchOutlined /> 抽样记录 <Badge count={sampling.length} size="small" /></span>,
            children: (
              <>
                {selectedSampling.length > 0 && (
                  <div className="bulk-action-bar">
                    <Text>已选 <Badge count={selectedSampling.length} /> 项</Text>
                    <Space>
                      {isAuditor && <Button type="primary" size="small" onClick={() => handleBulkSamplingStatus(2)}>批量开始</Button>}
                      <Button size="small" onClick={() => setSelectedSampling([])}>取消</Button>
                    </Space>
                  </div>
                )}
                <Card bordered={false} styles={{ body: { padding: 0 } }}>
                  <Table
                    size="middle"
                    rowKey="id"
                    dataSource={sampling}
                    columns={samplingCols}
                    rowSelection={{ selectedRowKeys: selectedSampling, onChange: setSelectedSampling }}
                    scroll={{ x: 1200 }}
                    pagination={{ pageSize: 20 }}
                  />
                </Card>
              </>
            )
          },
          {
            key: 'checkRecords',
            label: <span><CheckSquareOutlined /> 检查记录 <Badge count={checkRecords.length} size="small" /></span>,
            children: (
              <>
                <div style={{ marginBottom: 12, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  {isAuditor && (
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => {
                      checkRecordsApi.create({ scheduleId, riskLevel: 2, evidenceStatus: 2 }).then(r => {
                        if (r.success) { message.success('已创建'); loadAll(); }
                      });
                    }}>新增检查记录</Button>
                  )}
                </div>
                {selectedCheckRecords.length > 0 && (
                  <div className="bulk-action-bar">
                    <Text>已选 <Badge count={selectedCheckRecords.length} /> 项</Text>
                    <Space>
                      {isAuditor && <Button type="primary" size="small" onClick={() => handleBulkCheckRecordsStatus(3)}>批量提交复核</Button>}
                      {isComplianceOfficer && <Button size="small" onClick={() => handleBulkCheckRecordsStatus(4)}>批量复核通过</Button>}
                      <Button size="small" onClick={() => setSelectedCheckRecords([])}>取消</Button>
                    </Space>
                  </div>
                )}
                <Card bordered={false} styles={{ body: { padding: 0 } }}>
                  <Table
                    size="middle"
                    rowKey="id"
                    dataSource={checkRecords}
                    columns={crCols}
                    rowSelection={{ selectedRowKeys: selectedCheckRecords, onChange: setSelectedCheckRecords }}
                    scroll={{ x: 1400 }}
                    pagination={{ pageSize: 20 }}
                  />
                </Card>
              </>
            )
          },
          {
            key: 'rectifications',
            label: <span><SafetyCertificateOutlined /> 整改计划 <Badge count={rectifications.length} size="small" /></span>,
            children: (
              <>
                <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button type="primary" icon={<PlusOutlined />} onClick={() => setRectificationModal({ open: true })}>新建整改计划</Button>
                </div>
                <Card bordered={false} styles={{ body: { padding: 0 } }}>
                  <Table
                    size="middle"
                    rowKey="id"
                    dataSource={rectifications}
                    columns={rectCols}
                    scroll={{ x: 1200 }}
                    pagination={{ pageSize: 20 }}
                  />
                </Card>
              </>
            )
          },
          {
            key: 'evidenceMissing',
            label: <span><WarningOutlined /> 证据缺失处理 <Badge count={evidenceMissing.length} size="small" /></span>,
            children: (
              <Card bordered={false} styles={{ body: { padding: 0 } }}>
                <Table
                  size="middle"
                  rowKey="id"
                  dataSource={evidenceMissing}
                  columns={emCols}
                  scroll={{ x: 1200 }}
                  pagination={{ pageSize: 20 }}
                />
              </Card>
            )
          }
        ]}
      />

      <Drawer
        title={`检查项录入 - ${checklistDrawer.item?.itemNo ?? ''}`}
        open={checklistDrawer.open}
        onClose={() => setChecklistDrawer({ open: false })}
        width={640}
        footer={
          <Space style={{ justifyContent: 'flex-end', display: 'flex' }}>
            <Button onClick={() => setChecklistDrawer({ open: false })}>取消</Button>
            <Button type="primary" onClick={() => checklistDrawer.item && handleSaveChecklistResult({
              isCompliant: (document.querySelector('[data-result]') as HTMLSelectElement)?.value as any,
              findings: (document.querySelector('[data-findings]') as HTMLTextAreaElement)?.value,
              auditNotes: (document.querySelector('[data-notes]') as HTMLTextAreaElement)?.value,
              evidenceStatus: Number((document.querySelector('[data-evstatus]') as HTMLSelectElement)?.value)
            })}>保存结果</Button>
          </Space>
        }
      >
        {checklistDrawer.item && (
          <Form layout="vertical" initialValues={{
            isCompliant: checklistDrawer.item.isCompliant,
            findings: checklistDrawer.item.findings,
            auditNotes: checklistDrawer.item.auditNotes,
            evidenceStatus: checklistDrawer.item.evidenceStatus
          }}>
            <Card size="small" title="检查项信息" style={{ marginBottom: 16 }}>
              <Descriptions column={1} size="small">
                <Descriptions.Item label="条款号">{checklistDrawer.item.itemNo}</Descriptions.Item>
                <Descriptions.Item label="内容"><Paragraph>{checklistDrawer.item.content}</Paragraph></Descriptions.Item>
                <Descriptions.Item label="风险等级"><RiskTag level={checklistDrawer.item.riskLevel} /></Descriptions.Item>
                <Descriptions.Item label="证据要求"><Paragraph type="secondary">{checklistDrawer.item.evidenceRequirements || '无特殊要求'}</Paragraph></Descriptions.Item>
              </Descriptions>
            </Card>
            <Form.Item label="合规判定" name="isCompliant" rules={[{ required: true, message: '请选择判定结果' }]}>
              <Select data-result>
                <Option value={true}>合规</Option>
                <Option value={false}>不合规</Option>
              </Select>
            </Form.Item>
            <Form.Item label="检查发现" name="findings">
              <TextArea data-findings rows={4} placeholder="描述检查发现的问题..." />
            </Form.Item>
            <Form.Item label="证据状态" name="evidenceStatus">
              <Select data-evstatus>
                <Option value={1}>完整</Option>
                <Option value={2}>缺失</Option>
                <Option value={3}>待补充</Option>
                <Option value={4}>已补待审</Option>
                <Option value={5}>已豁免</Option>
              </Select>
            </Form.Item>
            <Form.Item label="审计备注" name="auditNotes">
              <TextArea data-notes rows={3} />
            </Form.Item>
            <Divider />
            <Space style={{ width: '100%', justifyContent: 'space-between' }}>
              <Button icon={<PaperClipOutlined />} onClick={() => { setEvidenceDrawer({ type: 'checklistItem', id: checklistDrawer.item!.id }); loadEvidences('checklistItem', checklistDrawer.item!.id); }}>
                管理附件 ({checklistDrawer.item.evidenceCount})
              </Button>
              <Button icon={<HistoryOutlined />} onClick={() => { setHistoryDrawer({ open: true, type: 'ChecklistItem', id: checklistDrawer.item!.id }); loadHistory('ChecklistItem', checklistDrawer.item!.id); }}>
                处理历史
              </Button>
            </Space>
          </Form>
        )}
      </Drawer>

      <Drawer
        title="附件管理"
        open={!!evidenceDrawer}
        onClose={() => setEvidenceDrawer(null)}
        width={480}
        extra={
          isAuditor && (
            <Upload {...{
              multiple: true,
              beforeUpload: (f) => {
                setEvidences(prev => [...prev, {
                  id: Date.now(),
                  fileName: f.name,
                  fileUrl: URL.createObjectURL(f),
                  fileSize: f.size,
                  contentType: f.type,
                  isSupplement: false,
                  createdAt: new Date().toISOString()
                }]);
                message.success('附件已上传');
                return false;
              }
            } as UploadProps}>
              <Button icon={<UploadOutlined />}>上传附件</Button>
            </Upload>
          )
        }
      >
        {evidences.length > 0 ? (
          <List
            dataSource={evidences}
            renderItem={(e) => (
              <List.Item
                key={e.id}
                actions={[
                  <Button type="link" size="small" icon={<DownloadOutlined />}>下载</Button>,
                  isAuditor && <Popconfirm title="删除附件？">
                    <Button type="link" size="small" danger>删除</Button>
                  </Popconfirm>
                ]}
              >
                <List.Item.Meta
                  avatar={<Avatar icon={<PaperClipOutlined />} />}
                  title={<Space>{e.fileName}{e.isSupplement && <Tag color="orange">补充</Tag>}</Space>}
                  description={
                    <Space size="large">
                      <Text type="secondary">{(e.fileSize / 1024).toFixed(1)} KB</Text>
                      <Text type="secondary">{dayjs(e.createdAt).format('YYYY-MM-DD HH:mm')}</Text>
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        ) : <Empty description="暂无附件" />}
      </Drawer>

      <Drawer
        title="处理历史 / 溯源记录"
        open={historyDrawer.open}
        onClose={() => setHistoryDrawer({ open: false, type: '', id: 0 })}
        width={520}
      >
        {histories.length > 0 ? (
          <Timeline
            mode="left"
            items={histories.map((h) => ({
              label: dayjs(h.operatedAt).format('YYYY-MM-DD HH:mm:ss'),
              children: (
                <Card size="small" style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <Space>
                      <Tag color="blue">{h.actionType}</Tag>
                      {h.fromStatus && <StatusTag status={h.fromStatus} />}
                      {h.toStatus && <span>→</span>}
                      {h.toStatus && <StatusTag status={h.toStatus} />}
                    </Space>
                    {h.batchId && <Tag color="purple">批量: {h.batchId}</Tag>}
                  </div>
                  <Paragraph style={{ margin: 0 }}>{h.description}</Paragraph>
                  <Divider style={{ margin: '8px 0' }} />
                  <Row gutter={16}>
                    <Col span={12}><Text type="secondary">操作人：</Text>{h.operatorName}</Col>
                    <Col span={12}><Text type="secondary">角色：</Text>{h.operatorRoleName}</Col>
                    {h.sourceReference && <Col span={24}><Text type="secondary">来源：</Text>{h.sourceReference}</Col>}
                  </Row>
                </Card>
              )
            }))}
          />
        ) : <Empty description="暂无历史记录" />}
      </Drawer>

      <Modal
        title="批量新增抽样记录"
        open={samplingModalOpen}
        onCancel={() => setSamplingModalOpen(false)}
        width={880}
        footer={
          <Space style={{ justifyContent: 'flex-end', display: 'flex' }}>
            <Button onClick={() => setSamplingModalOpen(false)}>取消</Button>
            <Button type="primary" onClick={() => samplingForm.submit()}>创建抽样</Button>
          </Space>
        }
      >
        <Form form={samplingForm} layout="vertical" onFinish={handleCreateSampling}>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="sourceSystem" label="来源系统" initialValue="ERP" rules={[{ required: true }]}>
                <Select>
                  <Option value="ERP">ERP系统</Option>
                  <Option value="CRM">CRM系统</Option>
                  <Option value="OA">OA系统</Option>
                  <Option value="HR">HR系统</Option>
                  <Option value="Other">其他</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="sourceModule" label="来源模块" initialValue="财务" rules={[{ required: true }]}>
                <Select>
                  <Option value="财务">财务</Option>
                  <Option value="采购">采购</Option>
                  <Option value="销售">销售</Option>
                  <Option value="库存">库存</Option>
                  <Option value="人事">人事</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="documentType" label="单据类型" initialValue="付款单" rules={[{ required: true }]}>
                <Select>
                  <Option value="付款单">付款单</Option>
                  <Option value="报销单">报销单</Option>
                  <Option value="采购单">采购单</Option>
                  <Option value="合同">合同</Option>
                  <Option value="发票">发票</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Divider orientation="left">抽样明细 <Button type="link" size="small" onClick={() => setSamplingBatch([...samplingBatch, { documentNo: '', documentDate: dayjs(), riskLevel: 2 }])}>
            <PlusOutlined /> 添加一条
          </Button></Divider>
          <div style={{ maxHeight: 360, overflow: 'auto' }}>
            {samplingBatch.map((_, idx) => (
              <Card size="small" key={idx} style={{ marginBottom: 8 }} title={`#${idx + 1}`} extra={
                <Button type="text" danger onClick={() => setSamplingBatch(samplingBatch.filter((_, i) => i !== idx))}>删除</Button>
              }>
                <Row gutter={8}>
                  <Col span={8}>
                    <Form.Item name={[idx, 'documentNo']} style={{ margin: 0 }} initialValue={samplingBatch[idx]?.documentNo}>
                      <Input placeholder="单据号" onChange={(e) => { const b = [...samplingBatch]; b[idx].documentNo = e.target.value; setSamplingBatch(b); }} />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <DatePicker style={{ width: '100%' }} value={samplingBatch[idx]?.documentDate} onChange={(d) => { const b = [...samplingBatch]; b[idx].documentDate = d; setSamplingBatch(b); }} />
                  </Col>
                  <Col span={4}>
                    <Select value={samplingBatch[idx]?.riskLevel} onChange={(v) => { const b = [...samplingBatch]; b[idx].riskLevel = v; setSamplingBatch(b); }}>
                      <Option value={1}>低</Option><Option value={2}>中</Option>
                      <Option value={3}>高</Option><Option value={4}>严重</Option>
                    </Select>
                  </Col>
                  <Col span={4}>
                    <InputNumber placeholder="金额" style={{ width: '100%' }} value={samplingBatch[idx]?.amount} onChange={(v) => { const b = [...samplingBatch]; b[idx].amount = v; setSamplingBatch(b); }} />
                  </Col>
                </Row>
              </Card>
            ))}
            {samplingBatch.length === 0 && <Empty description="点击上方"添加一条"开始录入" />}
          </div>
        </Form>
      </Modal>

      <Modal
        title={rectificationModal.data?.mode === 'verify' ? '整改验证' : '新建整改计划'}
        open={rectificationModal.open}
        onCancel={() => setRectificationModal({ open: false })}
        width={720}
        footer={null}
      >
        {rectificationModal.data?.mode === 'verify' ? (
          <Form layout="vertical" onFinish={(v) => handleApproveRect(rectificationModal.data!.id, v)}>
            <Form.Item name="isVerified" label="验证结果" initialValue={true}>
              <Radio.Group optionType="button" buttonStyle="solid" style={{ width: '100%' }}>
                <Radio.Button value={true} style={{ width: '50%', textAlign: 'center' }}>验证通过</Radio.Button>
                <Radio.Button value={false} style={{ width: '50%', textAlign: 'center' }}>验证未通过</Radio.Button>
              </Radio.Group>
            </Form.Item>
            <Form.Item name="verificationResult" label="验证意见" rules={[{ required: true }]}>
              <TextArea rows={5} />
            </Form.Item>
            <Form.Item style={{ margin: 0, textAlign: 'right' }}>
              <Space>
                <Button onClick={() => setRectificationModal({ open: false })}>取消</Button>
                <Button type="primary" htmlType="submit">确认验证</Button>
              </Space>
            </Form.Item>
          </Form>
        ) : (
          <Form form={rectificationForm} layout="vertical" onFinish={handleCreateRectification}>
            <Row gutter={16}>
              <Col span={16}>
                <Form.Item name="title" label="整改标题" rules={[{ required: true }]}>
                  <Input placeholder="简要描述整改内容" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="ownerId" label="整改负责人" rules={[{ required: true }]}>
                  <Select placeholder="请选择">
                    {users.filter(u => u.role === 2).map(u => <Option key={u.id} value={u.id}>{u.fullName}</Option>)}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item name="description" label="问题描述" rules={[{ required: true }]}>
                  <TextArea rows={2} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="rootCause" label="根本原因" rules={[{ required: true }]}>
                  <TextArea rows={2} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="actionPlan" label="整改措施" rules={[{ required: true }]}>
                  <TextArea rows={2} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="deadline" label="整改截止日期" rules={[{ required: true }]}>
                  <DatePicker style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="riskLevel" label="风险等级" initialValue={2}>
                  <Select>
                    <Option value={1}>低</Option><Option value={2}>中</Option>
                    <Option value={3}>高</Option><Option value={4}>严重</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="checkRecordId" label="关联检查记录">
                  <Select allowClear placeholder="可选">
                    {checkRecords.map(cr => <Option key={cr.id} value={cr.id}>{cr.findings?.slice(0, 30) || `#${cr.id}`}</Option>)}
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            <Form.Item style={{ margin: 0, textAlign: 'right' }}>
              <Space>
                <Button onClick={() => setRectificationModal({ open: false })}>取消</Button>
                <Button type="primary" htmlType="submit">创建整改</Button>
              </Space>
            </Form.Item>
          </Form>
        )}
      </Modal>

      <Modal
        title={reviewModal?.type === 'checkRecord' ? '复核检查记录' : reviewModal?.type === 'evidenceMissing' ? '审核补充证据' : '复核'}
        open={!!reviewModal}
        onCancel={() => setReviewModal(null)}
        footer={null}
      >
        <Form form={reviewForm} layout="vertical" onFinish={async (v) => {
          if (!reviewModal) return;
          try {
            if (reviewModal.type === 'checkRecord') {
              const res = await checkRecordsApi.review({ id: reviewModal.id, ...v });
              if (res.success) { message.success(v.approved ? '已通过' : '已拒绝'); setReviewModal(null); loadAll(); }
            } else if (reviewModal.type === 'evidenceMissing') {
              const res = await evidenceMissingApi.review({ id: reviewModal.id, newStatus: v.approved ? 1 : 3, reviewerComments: v.reviewerComments });
              if (res.success) { message.success(v.approved ? '审核通过，证据已完整' : '需要继续补充'); setReviewModal(null); loadAll(); }
            }
          } catch { message.error('操作失败'); }
        }}>
          <Form.Item name="approved" label="复核结果" initialValue={true}>
            <Radio.Group optionType="button" buttonStyle="solid" style={{ width: '100%' }}>
              <Radio.Button value={true} style={{ width: '50%', textAlign: 'center' }}>通过</Radio.Button>
              <Radio.Button value={false} style={{ width: '50%', textAlign: 'center' }}>拒绝</Radio.Button>
            </Radio.Group>
          </Form.Item>
          <Form.Item name={reviewModal?.type === 'evidenceMissing' ? 'reviewerComments' : 'reviewComments'} label="复核意见" rules={[{ required: true }]}>
            <TextArea rows={4} />
          </Form.Item>
          <Form.Item style={{ margin: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setReviewModal(null)}>取消</Button>
              <Button type="primary" htmlType="submit">确认</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="创建证据缺失处理"
        open={evMissingModal.open}
        onCancel={() => setEvMissingModal({ open: false })}
        footer={null}
      >
        <Form form={evMissingForm} layout="vertical" onFinish={handleCreateEvMissing}>
          <Form.Item name="missingDescription" label="缺失描述" rules={[{ required: true, message: '请描述缺失内容' }]}>
            <TextArea rows={4} placeholder="说明缺少什么证据、为什么需要..." />
          </Form.Item>
          <Form.Item name="responsibleId" label="责任人（业务方）">
            <Select placeholder="请选择负责补充证据的人员">
              {users.filter(u => u.role === 2).map(u => <Option key={u.id} value={u.id}>{u.fullName}</Option>)}
            </Select>
          </Form.Item>
          <Form.Item style={{ margin: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setEvMissingModal({ open: false })}>取消</Button>
              <Button type="primary" htmlType="submit">创建</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="从模板生成检查清单"
        open={generateChecklistModal}
        onCancel={() => setGenerateChecklistModal(false)}
        footer={null}
      >
        {templates.length > 0 ? (
          <List
            dataSource={templates}
            renderItem={(t) => (
              <List.Item
                key={t.id}
                actions={[<Button type="primary" size="small" onClick={() => handleGenerateChecklist(t.id)}>使用此模板</Button>]}
              >
                <List.Item.Meta
                  title={t.name}
                  description={`${t.items?.length ?? 0} 个检查项`}
                />
              </List.Item>
            )}
          />
        ) : <Empty description="该制度暂无检查模板，请先在制度模块配置" />}
      </Modal>
    </div>
  );
}
