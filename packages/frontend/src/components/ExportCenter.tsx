'use client';

import React, { useState, useMemo } from 'react';
import {
  Card,
  Button,
  Table,
  Tag,
  Space,
  Typography,
  DatePicker,
  Checkbox,
  Row,
  Col,
  Divider,
  Spin,
  Empty,
  theme,
  Tooltip,
  Modal,
  Tabs,
  message,
  Collapse,
  Alert,
  Progress,
} from 'antd';
import {
  FileExcelOutlined,
  DownloadOutlined,
  CalendarOutlined,
  FilterOutlined,
  EyeOutlined,
  HistoryOutlined,
  CheckSquareOutlined,
  FileTextOutlined,
  ExclamationCircleOutlined,
  TeamOutlined,
  WarningOutlined,
  BellOutlined,
  SolutionOutlined,
  ReloadOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { CheckboxChangeEvent } from 'antd/es/checkbox';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { exportApi } from '@/lib/api';
import {
  ExportType,
  ExportRecord,
} from '@/types';

const { RangePicker } = DatePicker;
const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;

interface ExportTypeConfig {
  type: ExportType;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  defaultFields: string[];
  fields: { label: string; value: string; required?: boolean }[];
  caliberNote: string;
  generalCalibers: string[];
}

const EXPORT_TYPE_CONFIG: ExportTypeConfig[] = [
  {
    type: ExportType.HEARING_SUMMARY,
    title: '开庭汇总表',
    description: '导出指定时间范围内所有开庭信息，包含案件、法庭、人员等完整信息',
    icon: <FileTextOutlined />,
    color: '#1890ff',
    defaultFields: [
      'hearingNo', 'startTime', 'endTime', 'hearingType', 'status',
      'caseNo', 'caseTitle', 'courtName', 'courtRoom',
      'presidingJudge', 'lawyers', 'attendanceCount',
    ],
    fields: [
      { label: '开庭编号', value: 'hearingNo', required: true },
      { label: '开始时间', value: 'startTime', required: true },
      { label: '结束时间', value: 'endTime', required: true },
      { label: '开庭类型', value: 'hearingType' },
      { label: '开庭状态', value: 'status', required: true },
      { label: '案件编号', value: 'caseNo' },
      { label: '案件标题', value: 'caseTitle' },
      { label: '案件类型', value: 'caseType' },
      { label: '法院名称', value: 'courtName' },
      { label: '法庭名称', value: 'courtRoom' },
      { label: '审判长', value: 'presidingJudge' },
      { label: '主办律师', value: 'lawyers' },
      { label: '应到人数', value: 'attendanceCount' },
      { label: '实到人数', value: 'actualAttendance' },
      { label: '重要程度', value: 'priority' },
      { label: '备注', value: 'notes' },
    ],
    caliberNote: '口径说明：1. 时间范围以开庭开始时间为准；2. 状态变更以最后一次为准；3. 律师信息包含所有分配人员',
    generalCalibers: [
      '数据统计周期：按自然日统计，每日00:00:00至23:59:59',
      '数据时效性：T+1，即次日生成前一日最终数据',
      '删除数据：已删除的开庭记录不包含在导出范围内',
    ],
  },
  {
    type: ExportType.ATTENDANCE_STATS,
    title: '签到统计表',
    description: '导出指定时间范围内的签到数据统计，支持按人员、按开庭维度分析',
    icon: <TeamOutlined />,
    color: '#52c41a',
    defaultFields: [
      'hearingNo', 'personName', 'attendeeType', 'plannedRole',
      'status', 'checkInTime', 'checkOutTime', 'seatLocation',
    ],
    fields: [
      { label: '开庭编号', value: 'hearingNo', required: true },
      { label: '开庭时间', value: 'hearingTime' },
      { label: '姓名', value: 'personName', required: true },
      { label: '人员类型', value: 'attendeeType' },
      { label: '担任角色', value: 'plannedRole' },
      { label: '签到状态', value: 'status', required: true },
      { label: '签到时间', value: 'checkInTime' },
      { label: '签退时间', value: 'checkOutTime' },
      { label: '座位位置', value: 'seatLocation' },
      { label: '签到方式', value: 'signType' },
      { label: '迟到时长(分钟)', value: 'lateMinutes' },
      { label: '早退时长(分钟)', value: 'earlyLeaveMinutes' },
      { label: '备注', value: 'remark' },
      { label: '登记人', value: 'recordedBy' },
    ],
    caliberNote: '口径说明：1. 迟到判定：晚于开庭开始时间后15分钟；2. 早退判定：早于开庭结束时间前离场；3. 请假需有审批记录',
    generalCalibers: [
      '签到有效时间：开庭前2小时至开庭后2小时内签到有效',
      '异常数据：手工修改的签到记录会在备注中标注',
    ],
  },
  {
    type: ExportType.EXCEPTION_STATS,
    title: '异常统计表',
    description: '导出异常单数据，包含异常类型、处理状态、影响范围、责任分析等信息',
    icon: <WarningOutlined />,
    color: '#ff4d4f',
    defaultFields: [
      'exceptionNo', 'title', 'exceptionType', 'severity', 'status',
      'hearingNo', 'caseNo', 'impactScope', 'creator', 'createdAt', 'resolvedAt',
    ],
    fields: [
      { label: '异常编号', value: 'exceptionNo', required: true },
      { label: '异常标题', value: 'title', required: true },
      { label: '异常类型', value: 'exceptionType' },
      { label: '严重程度', value: 'severity' },
      { label: '当前状态', value: 'status', required: true },
      { label: '关联开庭', value: 'hearingNo' },
      { label: '关联案件', value: 'caseNo' },
      { label: '影响范围', value: 'impactScope' },
      { label: '创建人', value: 'creator' },
      { label: '创建时间', value: 'createdAt' },
      { label: '处理人', value: 'resolver' },
      { label: '解决时间', value: 'resolvedAt' },
      { label: '关闭时间', value: 'closedAt' },
      { label: '预估损失', value: 'estimatedLoss' },
      { label: '实际损失', value: 'actualLoss' },
      { label: '客户满意度', value: 'customerSatisfaction' },
      { label: '根本原因', value: 'rootCause' },
      { label: '纠正措施', value: 'correctiveAction' },
      { label: '预防措施', value: 'preventiveMeasure' },
    ],
    caliberNote: '口径说明：1. 统计时间以异常创建时间为准；2. 已关闭异常的处理时长 = 关闭时间 - 创建时间；3. 损失金额按人民币统计',
    generalCalibers: [
      '严重程度定义：低(不影响正常业务)、中(影响单个案件)、高(影响多个案件)、严重(重大业务中断)',
      'MTTR平均修复时间：从创建到解决的平均时间',
    ],
  },
  {
    type: ExportType.CONFLICT_STATS,
    title: '冲突统计表',
    description: '导出时间冲突检测数据，包含冲突类型、严重程度、处理状态等信息',
    icon: <ExclamationCircleOutlined />,
    color: '#faad14',
    defaultFields: [
      'conflictType', 'severity', 'description', 'involvedPartyA', 'involvedPartyB',
      'hearingNoA', 'hearingNoB', 'isResolved', 'resolution', 'resolvedAt',
    ],
    fields: [
      { label: '冲突ID', value: 'id', required: true },
      { label: '冲突类型', value: 'conflictType', required: true },
      { label: '严重程度', value: 'severity' },
      { label: '冲突描述', value: 'description' },
      { label: '涉及方A', value: 'involvedPartyA' },
      { label: '涉及方B', value: 'involvedPartyB' },
      { label: '关联开庭A', value: 'hearingNoA' },
      { label: '关联开庭B', value: 'hearingNoB' },
      { label: '关联案件', value: 'caseNo' },
      { label: '是否解决', value: 'isResolved' },
      { label: '解决方案', value: 'resolution' },
      { label: '解决人', value: 'resolvedBy' },
      { label: '解决时间', value: 'resolvedAt' },
      { label: '创建时间', value: 'createdAt' },
    ],
    caliberNote: '口径说明：1. 自动检测的冲突会标记来源；2. 同一场次的相同冲突会去重；3. 已解决冲突不再重复提示',
    generalCalibers: [
      '检测范围：仅检测排期中、已确认状态的开庭',
      '律师时间冲突：同一律师在重叠时间被分配到多个开庭',
      '法庭冲突：同一法庭在重叠时间被分配到多个开庭',
    ],
  },
  {
    type: ExportType.REMINDER_SUMMARY,
    title: '提醒汇总表',
    description: '导出提醒发送记录，包含提醒类型、发送状态、接收人、送达回执等信息',
    icon: <BellOutlined />,
    color: '#722ed1',
    defaultFields: [
      'title', 'reminderType', 'content', 'scheduledTime', 'sentAt', 'status',
      'recipientName', 'recipientContact', 'deliveryStatus', 'readAt',
    ],
    fields: [
      { label: '提醒ID', value: 'id', required: true },
      { label: '提醒标题', value: 'title', required: true },
      { label: '提醒类型', value: 'reminderType' },
      { label: '提醒内容', value: 'content' },
      { label: '关联开庭', value: 'hearingNo' },
      { label: '计划发送时间', value: 'scheduledTime' },
      { label: '实际发送时间', value: 'sentAt' },
      { label: '发送状态', value: 'status', required: true },
      { label: '接收人姓名', value: 'recipientName' },
      { label: '联系方式', value: 'recipientContact' },
      { label: '发送方式', value: 'contactType' },
      { label: '送达状态', value: 'deliveryStatus' },
      { label: '送达时间', value: 'deliveredAt' },
      { label: '已读时间', value: 'readAt' },
      { label: '确认时间', value: 'confirmedAt' },
      { label: '失败原因', value: 'failReason' },
      { label: '重试次数', value: 'retryCount' },
      { label: '发送人', value: 'sender' },
    ],
    caliberNote: '口径说明：1. 发送状态以接收端回执为准；2. 已读状态仅支持APP和微信类型；3. 失败记录包含最后一次错误信息',
    generalCalibers: [
      '送达时效：短信/邮件一般5分钟内送达，APP推送实时送达',
      '已读判定：用户点击消息或打开通知即视为已读',
      '确认判定：用户主动点击"确认收到"按钮',
    ],
  },
  {
    type: ExportType.CASE_SUMMARY,
    title: '案件汇总表',
    description: '导出案件基础信息、关联开庭、承办律师、客户信息等完整汇总',
    icon: <SolutionOutlined />,
    color: '#13c2c2',
    defaultFields: [
      'caseNo', 'title', 'caseType', 'status', 'courtCaseNo',
      'clientName', 'lawyerInCharge', 'acceptanceDate', 'hearingCount',
    ],
    fields: [
      { label: '案件编号', value: 'caseNo', required: true },
      { label: '法院案号', value: 'courtCaseNo' },
      { label: '案件标题', value: 'title', required: true },
      { label: '案件类型', value: 'caseType' },
      { label: '案件类别', value: 'caseCategory' },
      { label: '案件状态', value: 'status', required: true },
      { label: '客户名称', value: 'clientName' },
      { label: '客户编号', value: 'clientNo' },
      { label: '主办律师', value: 'lawyerInCharge' },
      { label: '协办律师', value: 'assistantInCharge' },
      { label: '受理日期', value: 'acceptanceDate' },
      { label: '截止日期', value: 'deadlineDate' },
      { label: '受理法院', value: 'courtLevel' },
      { label: '管辖区域', value: 'jurisdiction' },
      { label: '涉案金额', value: 'amountInvolved' },
      { label: '律师费', value: 'retentionFee' },
      { label: '支付状态', value: 'paymentStatus' },
      { label: '开庭次数', value: 'hearingCount' },
      { label: '最近开庭', value: 'lastHearingDate' },
      { label: '创建时间', value: 'createdAt' },
    ],
    caliberNote: '口径说明：1. 案件状态以最新为准；2. 开庭次数统计所有历史开庭（含已取消）；3. 金额单位为人民币元',
    generalCalibers: [
      '案件生命周期：待受理 → 进行中 → 已结案/已中止',
      '承办律师变更：仅记录当前主办律师，历史变更详见操作日志',
    ],
  },
];

const ExportCenter: React.FC = () => {
  const { token } = theme.useToken();
  const queryClient = useQueryClient();
  const [selectedType, setSelectedType] = useState<ExportType | null>(null);
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>([
    dayjs().subtract(30, 'day'),
    dayjs(),
  ]);
  const [selectedFields, setSelectedFields] = useState<Record<ExportType, string[]>>(
    EXPORT_TYPE_CONFIG.reduce(
      (acc, config) => ({ ...acc, [config.type]: config.defaultFields }),
      {} as Record<ExportType, string[]>
    )
  );
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewType, setPreviewType] = useState<ExportType | null>(null);
  const [exporting, setExporting] = useState<ExportType | null>(null);

  const { data: recordsData, isLoading: recordsLoading, refetch } = useQuery(
    ['exportRecords'],
    async () => {
      const res = await exportApi.records({ page: 1, limit: 50 });
      return res.data;
    }
  );

  const { data: calibersData } = useQuery(['exportCalibers'], async () => {
    const res = await exportApi.calibers();
    return res.data as any[];
  });

  const currentConfig = useMemo(
    () => EXPORT_TYPE_CONFIG.find((c) => c.type === selectedType),
    [selectedType]
  );

  const selectedTypeFields = useMemo(
    () => (selectedType ? selectedFields[selectedType] : []),
    [selectedFields, selectedType]
  );

  const handleSelectCard = (type: ExportType) => {
    setSelectedType(selectedType === type ? null : type);
  };

  const handleFieldsChange = (checkedValues: any[]) => {
    if (selectedType) {
      const config = EXPORT_TYPE_CONFIG.find((c) => c.type === selectedType)!;
      const requiredFields = config.fields.filter((f) => f.required).map((f) => f.value);
      const stringValues = checkedValues.map(String);
      const merged = Array.from(new Set([...requiredFields, ...stringValues]));
      setSelectedFields((prev) => ({ ...prev, [selectedType]: merged }));
    }
  };

  const handleSelectAllFields = (e: CheckboxChangeEvent) => {
    if (selectedType) {
      const config = EXPORT_TYPE_CONFIG.find((c) => c.type === selectedType)!;
      setSelectedFields((prev) => ({
        ...prev,
        [selectedType]: e.target.checked ? config.fields.map((f) => f.value) : config.defaultFields,
      }));
    }
  };

  const handlePreviewCaliber = (type: ExportType) => {
    setPreviewType(type);
    setPreviewOpen(true);
  };

  const handleExport = async (type: ExportType) => {
    if (!dateRange) {
      void message.warning('请选择日期范围');
      return;
    }
    const config = EXPORT_TYPE_CONFIG.find((c) => c.type === type)!;
    const fields = selectedFields[type] || config.defaultFields;
    if (fields.length === 0) {
      void message.warning('请至少选择一个导出字段');
      return;
    }

    setExporting(type);
    try {
      const params = {
        startTime: dateRange[0].toISOString(),
        endTime: dateRange[1].toISOString(),
        includedFields: fields,
        caliberNote: config.caliberNote,
      };

      switch (type) {
        case ExportType.HEARING_SUMMARY:
          await exportApi.hearingSummary(params);
          break;
        case ExportType.ATTENDANCE_STATS:
          await exportApi.attendanceStats(params);
          break;
        case ExportType.EXCEPTION_STATS:
          await exportApi.exceptionStats(params);
          break;
        case ExportType.CONFLICT_STATS:
          await exportApi.conflictStats(params);
          break;
        case ExportType.REMINDER_SUMMARY:
          await exportApi.reminderSummary(params);
          break;
        default:
          void message.error('未知的导出类型');
          setExporting(null);
          return;
      }
      void message.success('导出任务已提交，文件下载中...');
      void queryClient.invalidateQueries(['exportRecords']);
    } catch {
      void message.error('导出失败，请稍后重试');
    } finally {
      setExporting(null);
    }
  };

  const recordsColumns: ColumnsType<ExportRecord> = [
    {
      title: '导出类型',
      dataIndex: 'exportType',
      key: 'exportType',
      width: 130,
      render: (type: ExportType) => {
        const config = EXPORT_TYPE_CONFIG.find((c) => c.type === type);
        return (
          <Tag icon={config?.icon} color={config?.color}>
            {config?.title || type}
          </Tag>
        );
      },
    },
    {
      title: '文件名称',
      dataIndex: 'fileName',
      key: 'fileName',
      render: (text: string, record: ExportRecord) => (
        <Space>
          <FileExcelOutlined style={{ color: '#52c41a' }} />
          {record.fileUrl ? (
            <a href={record.fileUrl} target="_blank" rel="noopener noreferrer">
              {text}
            </a>
          ) : (
            <Text>{text}</Text>
          )}
        </Space>
      ),
    },
    {
      title: '时间范围',
      key: 'timeRange',
      width: 240,
      render: (_, record: ExportRecord) => (
        <Text type="secondary" style={{ fontSize: 12 }}>
          {dayjs(record.startTimeRange).format('YYYY-MM-DD')} ~{' '}
          {dayjs(record.endTimeRange).format('YYYY-MM-DD')}
        </Text>
      ),
    },
    {
      title: '记录数',
      dataIndex: 'recordCount',
      key: 'recordCount',
      width: 100,
      align: 'center',
      render: (count: number) => <Tag color="blue">{count} 条</Tag>,
    },
    {
      title: '字段数',
      dataIndex: 'includedFields',
      key: 'fieldCount',
      width: 100,
      align: 'center',
      render: (fields: string[]) => <Tag color="green">{fields?.length || 0} 个</Tag>,
    },
    {
      title: '导出人',
      dataIndex: 'exportedByName',
      key: 'exportedByName',
      width: 120,
    },
    {
      title: '导出时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 170,
      render: (time: string) => dayjs(time).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record: ExportRecord) => (
        <Space>
          {record.fileUrl && (
            <Button
              type="link"
              size="small"
              icon={<DownloadOutlined />}
              onClick={() => window.open(record.fileUrl!, '_blank')}
            >
              下载
            </Button>
          )}
          <Tooltip title={record.caliberNote}>
            <Button type="link" size="small" icon={<EyeOutlined />}>
              口径
            </Button>
          </Tooltip>
        </Space>
      ),
    },
  ];

  const renderPreviewModal = () => {
    const config = EXPORT_TYPE_CONFIG.find((c) => c.type === previewType);
    if (!config) return null;
    const caliberFromApi = (calibersData || []).find((c: any) => c.type === previewType);
    return (
      <Modal
        title={
          <Space>
            <FileTextOutlined style={{ color: config.color }} />
            <span>{config.title} - 口径说明预览</span>
          </Space>
        }
        open={previewOpen}
        onCancel={() => setPreviewOpen(false)}
        footer={[
          <Button key="close" onClick={() => setPreviewOpen(false)}>
            关闭
          </Button>,
        ]}
        width={720}
      >
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Alert
            message="导出口径说明"
            description={config.caliberNote}
            type="info"
            showIcon
          />
          <Card size="small" title="通用口径规则" bordered={false} style={{ backgroundColor: token.colorFillAlter }}>
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              {config.generalCalibers.map((caliber, idx) => (
                <li key={idx} style={{ marginBottom: 8 }}>
                  {caliber}
                </li>
              ))}
              {caliberFromApi?.generalCalibers?.map(
                (caliber: string, idx: number) => (
                  <li key={`api-${idx}`} style={{ marginBottom: 8 }}>
                    {caliber}
                  </li>
                )
              )}
            </ul>
          </Card>
          <Card
            size="small"
            title={`本次将导出字段 (${selectedFields[config.type]?.length || 0} 个)`}
            bordered={false}
          >
            <Row gutter={[12, 8]}>
              {config.fields.map((field) => {
                const isSelected = (selectedFields[config.type] || []).includes(field.value);
                if (!isSelected) return null;
                return (
                  <Col xs={12} sm={8} key={field.value}>
                    <Tag
                      color={field.required ? 'red' : 'blue'}
                      icon={field.required ? <ExclamationCircleOutlined /> : undefined}
                    >
                      {field.label}
                      {field.required && ' (必填)'}
                    </Tag>
                  </Col>
                );
              })}
            </Row>
          </Card>
          <Alert
            message="温馨提示"
            description="导出文件为 Excel 格式（.xlsx），包含 Sheet1: 数据明细、Sheet2: 口径说明。请确保已安装 Excel 或 WPS 等办公软件。"
            type="warning"
            showIcon
          />
        </Space>
      </Modal>
    );
  };

  return (
    <div style={{ padding: 16 }}>
      <Card
        bordered
        style={{ marginBottom: 16, borderRadius: 8 }}
        title={
          <Space>
            <CalendarOutlined style={{ color: token.colorPrimary }} />
            <span>导出时间范围</span>
          </Space>
        }
        extra={
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => refetch()}
            >
              刷新历史
            </Button>
          </Space>
        }
      >
        <Space>
          <RangePicker
            value={dateRange}
            onChange={(range) => setDateRange(range as [Dayjs, Dayjs] | null)}
            allowClear
            style={{ width: 360 }}
          />
          <Button onClick={() => setDateRange([dayjs().subtract(7, 'day'), dayjs()])}>
            最近7天
          </Button>
          <Button onClick={() => setDateRange([dayjs().subtract(30, 'day'), dayjs()])}>
            最近30天
          </Button>
          <Button onClick={() => setDateRange([dayjs().startOf('month'), dayjs()])}>
            本月
          </Button>
          <Button onClick={() => setDateRange([dayjs().subtract(1, 'month').startOf('month'), dayjs().subtract(1, 'month').endOf('month')])}>
            上月
          </Button>
          <Button onClick={() => setDateRange([dayjs().startOf('year'), dayjs()])}>
            本年度
          </Button>
        </Space>
      </Card>

      <Divider orientation="left">
        <Space>
          <FileExcelOutlined />
          选择导出类型
          <Text type="secondary" style={{ fontSize: 12, fontWeight: 'normal' }}>
            （点击卡片展开字段配置）
          </Text>
        </Space>
      </Divider>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        {EXPORT_TYPE_CONFIG.map((config) => {
          const isSelected = selectedType === config.type;
          const fieldCount = selectedFields[config.type]?.length || config.defaultFields.length;
          const isExporting = exporting === config.type;
          return (
            <Col xs={24} sm={12} lg={8} key={config.type}>
              <Card
                hoverable
                bordered
                onClick={() => handleSelectCard(config.type)}
                style={{
                  borderRadius: 8,
                  borderColor: isSelected ? config.color : undefined,
                  boxShadow: isSelected ? `0 0 0 2px ${config.color}20` : undefined,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <Space direction="vertical" size={12} style={{ width: '100%' }}>
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Space>
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 8,
                          backgroundColor: `${config.color}15`,
                          color: config.color,
                          fontSize: 20,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {config.icon}
                      </div>
                      <div>
                        <Title level={5} style={{ margin: 0 }}>
                          {config.title}
                        </Title>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {fieldCount} 个字段 · 默认口径
                        </Text>
                      </div>
                    </Space>
                    {isSelected && (
                      <Tag color={config.color}>
                        <CheckSquareOutlined /> 已选
                      </Tag>
                    )}
                  </Space>
                  <Paragraph
                    ellipsis={{ rows: 2 }}
                    style={{ marginBottom: 0, color: token.colorTextSecondary }}
                  >
                    {config.description}
                  </Paragraph>
                  <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                    <Button
                      size="small"
                      icon={<EyeOutlined />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePreviewCaliber(config.type);
                      }}
                    >
                      预览口径
                    </Button>
                    <Button
                      type="primary"
                      size="small"
                      icon={isExporting ? <ReloadOutlined spin /> : <DownloadOutlined />}
                      loading={isExporting}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleExport(config.type);
                      }}
                      disabled={!dateRange}
                    >
                      {isExporting ? '导出中...' : '立即导出'}
                    </Button>
                  </Space>
                </Space>
              </Card>
            </Col>
          );
        })}
      </Row>

      {currentConfig && (
        <Card
          bordered
          style={{ marginBottom: 16, borderRadius: 8 }}
          title={
            <Space>
              <FilterOutlined style={{ color: currentConfig.color }} />
              <span>{currentConfig.title} - 字段配置</span>
              <Tag color={currentConfig.color}>
                已选 {selectedTypeFields.length} / {currentConfig.fields.length}
              </Tag>
              <Progress
                percent={Math.round((selectedTypeFields.length / currentConfig.fields.length) * 100)}
                size="small"
                style={{ width: 150, marginLeft: 8 }}
              />
            </Space>
          }
          extra={
            <Space>
              <Checkbox
                indeterminate={
                  selectedTypeFields.length > 0 &&
                  selectedTypeFields.length < currentConfig.fields.length
                }
                checked={selectedTypeFields.length === currentConfig.fields.length}
                onChange={handleSelectAllFields}
              >
                全选字段
              </Checkbox>
              <Button
                onClick={() =>
                  setSelectedFields((prev) => ({
                    ...prev,
                    [currentConfig.type]: currentConfig.defaultFields,
                  }))
                }
              >
                恢复默认
              </Button>
            </Space>
          }
        >
          <Alert
            message="字段说明"
            description="标记为 (必填) 的字段是导出必需的，无法取消选择。建议仅选择需要的字段以减小文件体积。"
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
          <Checkbox.Group
            value={selectedTypeFields}
            onChange={handleFieldsChange}
            style={{ width: '100%' }}
          >
            <Row gutter={[16, 12]}>
              {currentConfig.fields.map((field) => (
                <Col xs={12} sm={8} md={6} key={field.value}>
                  <Checkbox value={field.value} disabled={field.required}>
                    {field.label}
                    {field.required && (
                      <Text type="danger" style={{ marginLeft: 2 }}>
                        *
                      </Text>
                    )}
                  </Checkbox>
                </Col>
              ))}
            </Row>
          </Checkbox.Group>

          <Divider orientation="left" style={{ marginTop: 24 }}>
            口径说明
          </Divider>
          <Collapse ghost defaultActiveKey={['caliber', 'general']}>
            <Panel header="专项口径" key="caliber">
              <Paragraph style={{ marginBottom: 0 }}>{currentConfig.caliberNote}</Paragraph>
            </Panel>
            <Panel header="通用口径规则" key="general">
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                {currentConfig.generalCalibers.map((c, idx) => (
                  <li key={idx} style={{ marginBottom: 8 }}>
                    {c}
                  </li>
                ))}
              </ul>
            </Panel>
          </Collapse>

          <div style={{ marginTop: 24, textAlign: 'right' }}>
            <Space>
              <Button
                icon={<EyeOutlined />}
                onClick={() => handlePreviewCaliber(currentConfig.type)}
              >
                完整预览
              </Button>
              <Button
                type="primary"
                icon={
                  exporting === currentConfig.type ? (
                    <ReloadOutlined spin />
                  ) : (
                    <DownloadOutlined />
                  )
                }
                loading={exporting === currentConfig.type}
                onClick={() => handleExport(currentConfig.type)}
                disabled={!dateRange || selectedTypeFields.length === 0}
                size="large"
              >
                {exporting === currentConfig.type
                  ? '正在生成文件...'
                  : `导出 ${currentConfig.title}`}
              </Button>
            </Space>
          </div>
        </Card>
      )}

      <Divider orientation="left">
        <Space>
          <HistoryOutlined />
          导出历史记录
        </Space>
      </Divider>

      <Card bordered style={{ borderRadius: 8 }} bodyStyle={{ padding: 0 }}>
        <Spin spinning={recordsLoading}>
          {!recordsData?.list || recordsData.list.length === 0 ? (
            <div style={{ padding: 60 }}>
              <Empty description="暂无导出历史" />
            </div>
          ) : (
            <Table
              rowKey="id"
              dataSource={recordsData.list}
              columns={recordsColumns}
              pagination={{
                total: recordsData.total,
                pageSize: recordsData.limit,
                current: recordsData.page,
              }}
              scroll={{ x: 1000 }}
            />
          )}
        </Spin>
      </Card>

      {renderPreviewModal()}
    </div>
  );
};

export default ExportCenter;
