import React, { useEffect, useState } from 'react';
import {
  Card,
  Tag,
  Button,
  Space,
  Row,
  Col,
  Statistic,
  Descriptions,
  Tabs,
  List,
  Timeline,
  Table,
  Modal,
  Form,
  Input,
  message,
  Divider,
  Badge,
} from 'antd';
import {
  ArrowLeftOutlined,
  CheckOutlined,
  CloseOutlined,
  PlayCircleOutlined,
  FileDoneOutlined,
  StopOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  ToolOutlined,
  StethoscopeOutlined,
  CalendarOutlined,
  HistoryOutlined,
  TagOutlined,
  AlertOutlined,
  RiseOutlined,
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { settlementApi, exceptionApi } from '../services/api';
import type { SettlementBillDetail, SettlementStatus, ExceptionRecord } from '../types';
import { SettlementStatusMap } from '../types';
import dayjs from 'dayjs';

const { TextArea } = Input;

const BillDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<SettlementBillDetail | null>(null);
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [actionType, setActionType] = useState<string>('');
  const [actionTitle, setActionTitle] = useState<string>('');
  const [form] = Form.useForm();

  useEffect(() => {
    if (id) {
      loadDetail(parseInt(id));
    }
  }, [id]);

  const loadDetail = async (billId: number) => {
    setLoading(true);
    try {
      const data = await settlementApi.getDetail(billId);
      setDetail(data);
    } catch (error) {
      console.error('Failed to load bill detail:', error);
      setDetail(getMockDetail(billId));
    } finally {
      setLoading(false);
    }
  };

  const getMockDetail = (billId: number): SettlementBillDetail => {
    const baseDate = dayjs();
    const treatments = Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      billId,
      patientId: 1,
      patientName: '张三',
      treatmentDate: baseDate.add(i, 'day').format('YYYY-MM-DD'),
      startTime: ['08:00', '09:30', '14:00', '15:30'][i % 4],
      endTime: ['09:00', '10:30', '15:00', '16:30'][i % 4],
      treatmentType: ['运动疗法', '物理治疗', '作业治疗', '言语治疗'][i % 4],
      treatmentItem: ['关节活动训练', '电疗', '手功能训练', '吞咽训练'][i % 4],
      doctorId: 1,
      doctorName: '张医生',
      therapistId: 2,
      therapistName: '李治疗师',
      statusId: [1, 2, 3, 3, 3, 1, 1, 1, 1, 1][i],
      statusName: ['已预约', '进行中', '已完成', '已完成', '已完成', '已预约', '已预约', '已预约', '已预约', '已预约'][i],
      duration: 60,
      remark: i === 2 ? '患者感觉良好，可适当增加强度' : '',
      createdAt: baseDate.subtract(i, 'day').format('YYYY-MM-DD HH:mm:ss'),
    }));

    const nursingLogs = Array.from({ length: 8 }, (_, i) => ({
      id: i + 1,
      billId,
      patientId: 1,
      patientName: '张三',
      treatmentCalendarId: i + 1,
      logDate: baseDate.add(i, 'day').format('YYYY-MM-DD'),
      logTime: ['07:30', '11:00', '16:00', '20:00'][i % 4],
      nurseId: 3,
      nurseName: '王护士',
      vitalSigns: `血压: ${120 + i * 2}/${80 + i}mmHg, 心率: ${70 + i}次/分, 体温: ${(36.5 + i * 0.1).toFixed(1)}℃`,
      nursingContent: [
        '晨间护理，协助患者洗漱，观察患者精神状态良好',
        '协助患者进行康复训练，训练过程中患者配合良好',
        '测量生命体征，患者各项指标正常',
        '晚间护理，协助患者入睡',
      ][i % 4],
      patientCondition: i === 3 ? '患者今日精神状态稍差，食欲不佳' : '患者状态稳定',
      remark: i === 5 ? '需要关注患者血压情况' : '',
      createdAt: baseDate.subtract(i, 'day').format('YYYY-MM-DD HH:mm:ss'),
    }));

    const deviceRecords = [
      {
        id: 1,
        deviceId: 1,
        deviceName: '电动起立床',
        billId,
        treatmentCalendarId: 1,
        useDate: baseDate.add(1, 'day').format('YYYY-MM-DD'),
        startTime: '08:30',
        endTime: '09:00',
        duration: 30,
        remark: '用于患者站立训练',
      },
      {
        id: 2,
        deviceId: 2,
        deviceName: '中频电疗仪',
        billId,
        treatmentCalendarId: 2,
        useDate: baseDate.add(2, 'day').format('YYYY-MM-DD'),
        startTime: '09:30',
        endTime: '10:00',
        duration: 30,
        remark: '用于缓解肌肉紧张',
      },
      {
        id: 3,
        deviceId: 3,
        deviceName: '持续被动运动机(CPM)',
        billId,
        treatmentCalendarId: 3,
        useDate: baseDate.add(3, 'day').format('YYYY-MM-DD'),
        startTime: '14:00',
        endTime: '15:00',
        duration: 60,
        remark: '膝关节活动度训练',
      },
      {
        id: 4,
        deviceId: 4,
        deviceName: '平衡训练仪',
        billId,
        treatmentCalendarId: 4,
        useDate: baseDate.add(4, 'day').format('YYYY-MM-DD'),
        startTime: '15:30',
        endTime: '16:15',
        duration: 45,
        remark: '平衡功能训练',
      },
    ];

    const statusTransitions = [
      {
        id: 1,
        billId,
        fromStatusId: null,
        toStatusId: 1,
        remark: '创建单据',
        operatorName: '系统管理员',
        createdAt: baseDate.subtract(10, 'day').format('YYYY-MM-DD 09:00:00'),
      },
      {
        id: 2,
        billId,
        fromStatusId: 1,
        toStatusId: 2,
        remark: '提交审核，信息录入完成',
        operatorName: '李录入员',
        createdAt: baseDate.subtract(8, 'day').format('YYYY-MM-DD 14:30:00'),
      },
      {
        id: 3,
        billId,
        fromStatusId: 2,
        toStatusId: 5,
        remark: '审核通过，进入处理阶段',
        operatorName: '张审核员',
        createdAt: baseDate.subtract(7, 'day').format('YYYY-MM-DD 10:15:00'),
      },
      {
        id: 4,
        billId,
        fromStatusId: 5,
        toStatusId: 6,
        remark: '处理完成，待复盘',
        operatorName: '王处理员',
        createdAt: baseDate.subtract(3, 'day').format('YYYY-MM-DD 16:45:00'),
      },
    ];

    const exceptionRecords: ExceptionRecord[] = [
      {
        id: 1,
        billId,
        billNo: `JB202406001`,
        exceptionType: 'InsuranceRejection',
        rejectionReasonId: 1,
        rejectionReasonName: '费用超标',
        description: '部分治疗项目费用超出医保支付标准，需要核实',
        handlerId: 2,
        handlerName: '李处理员',
        handleMethod: 'SupplementMaterials',
        handleRemark: '已补充相关证明材料，等待重新审核',
        handledAt: baseDate.subtract(5, 'day').format('YYYY-MM-DD 11:00:00'),
        escalatedAt: undefined,
        escalatedTo: undefined,
        escalatedToName: undefined,
        isClosed: false,
        closedAt: undefined,
        createdAt: baseDate.subtract(6, 'day').format('YYYY-MM-DD 09:30:00'),
        supplementMaterials: [
          {
            id: 1,
            exceptionRecordId: 1,
            billId,
            materialName: '治疗项目必要性说明.pdf',
            materialType: 'document',
            fileUrl: '/files/material1.pdf',
            remark: '由主治医师签字的必要性说明',
            createdAt: baseDate.subtract(5, 'day').format('YYYY-MM-DD 10:30:00'),
          },
          {
            id: 2,
            exceptionRecordId: 1,
            billId,
            materialName: '费用明细清单.pdf',
            materialType: 'document',
            fileUrl: '/files/material2.pdf',
            remark: '详细的费用明细和收费标准说明',
            createdAt: baseDate.subtract(5, 'day').format('YYYY-MM-DD 10:45:00'),
          },
        ],
      },
    ];

    return {
      bill: {
        id: billId,
        billNo: `JB20240600${billId}`,
        patientId: 1,
        patientName: '张三',
        patientNo: 'P000001',
        statusId: 6,
        statusName: '待复盘',
        sourceChannelId: 1,
        sourceChannelName: '门诊转诊',
        assigneeId: 1,
        assigneeName: '张医生',
        treatmentStartDate: baseDate.format('YYYY-MM-DD'),
        treatmentEndDate: baseDate.add(9, 'day').format('YYYY-MM-DD'),
        totalAmount: 32580.0,
        insuranceAmount: 22806.0,
        selfPayAmount: 9774.0,
        rejectionRemark: '',
        remark: '膝关节置换术后康复治疗，预计2周疗程',
        createdAt: baseDate.subtract(10, 'day').format('YYYY-MM-DD 09:00:00'),
        updatedAt: baseDate.subtract(3, 'day').format('YYYY-MM-DD 16:45:00'),
        submittedAt: baseDate.subtract(8, 'day').format('YYYY-MM-DD 14:30:00'),
        reviewedAt: baseDate.subtract(7, 'day').format('YYYY-MM-DD 10:15:00'),
        processedAt: baseDate.subtract(3, 'day').format('YYYY-MM-DD 16:45:00'),
        items: [
          {
            id: 1,
            billId,
            itemCode: 'T001',
            itemName: '运动疗法',
            itemType: '治疗',
            quantity: 10,
            unitPrice: 800,
            totalPrice: 8000,
            insuranceCoverage: 70,
            insuranceAmount: 5600,
            selfPayAmount: 2400,
            remark: '每日1次',
            sortOrder: 1,
          },
          {
            id: 2,
            billId,
            itemCode: 'T002',
            itemName: '物理治疗',
            itemType: '治疗',
            quantity: 10,
            unitPrice: 500,
            totalPrice: 5000,
            insuranceCoverage: 80,
            insuranceAmount: 4000,
            selfPayAmount: 1000,
            remark: '每日1次',
            sortOrder: 2,
          },
          {
            id: 3,
            billId,
            itemCode: 'T003',
            itemName: '作业治疗',
            itemType: '治疗',
            quantity: 8,
            unitPrice: 600,
            totalPrice: 4800,
            insuranceCoverage: 70,
            insuranceAmount: 3360,
            selfPayAmount: 1440,
            remark: '每日1次',
            sortOrder: 3,
          },
          {
            id: 4,
            billId,
            itemCode: 'E001',
            itemName: '康复评定',
            itemType: '检查',
            quantity: 2,
            unitPrice: 300,
            totalPrice: 600,
            insuranceCoverage: 90,
            insuranceAmount: 540,
            selfPayAmount: 60,
            remark: '首次和末次评定',
            sortOrder: 4,
          },
          {
            id: 5,
            billId,
            itemCode: 'M001',
            itemName: '助行器',
            itemType: '器械',
            quantity: 1,
            unitPrice: 1580,
            totalPrice: 1580,
            insuranceCoverage: 60,
            insuranceAmount: 948,
            selfPayAmount: 632,
            remark: '辅助行走',
            sortOrder: 5,
          },
          {
            id: 6,
            billId,
            itemCode: 'D001',
            itemName: '护理服务费',
            itemType: '护理',
            quantity: 10,
            unitPrice: 150,
            totalPrice: 1500,
            insuranceCoverage: 85,
            insuranceAmount: 1275,
            selfPayAmount: 225,
            remark: '每日护理',
            sortOrder: 6,
          },
          {
            id: 7,
            billId,
            itemCode: 'T004',
            itemName: '言语治疗',
            itemType: '治疗',
            quantity: 6,
            unitPrice: 400,
            totalPrice: 2400,
            insuranceCoverage: 70,
            insuranceAmount: 1680,
            selfPayAmount: 720,
            remark: '每周3次',
            sortOrder: 7,
          },
          {
            id: 8,
            billId,
            itemCode: 'M002',
            itemName: '康复训练手套',
            itemType: '器械',
            quantity: 1,
            unitPrice: 280,
            totalPrice: 280,
            insuranceCoverage: 50,
            insuranceAmount: 140,
            selfPayAmount: 140,
            remark: '',
            sortOrder: 8,
          },
          {
            id: 9,
            billId,
            itemCode: 'T005',
            itemName: '平衡训练',
            itemType: '治疗',
            quantity: 8,
            unitPrice: 350,
            totalPrice: 2800,
            insuranceCoverage: 75,
            insuranceAmount: 2100,
            selfPayAmount: 700,
            remark: '每日1次',
            sortOrder: 9,
          },
          {
            id: 10,
            billId,
            itemCode: 'E002',
            itemName: '关节活动度测量',
            itemType: '检查',
            quantity: 3,
            unitPrice: 120,
            totalPrice: 360,
            insuranceCoverage: 90,
            insuranceAmount: 324,
            selfPayAmount: 36,
            remark: '每周评估1次',
            sortOrder: 10,
          },
          {
            id: 11,
            billId,
            itemCode: 'M003',
            itemName: '弹力带套装',
            itemType: '器械',
            quantity: 1,
            unitPrice: 460,
            totalPrice: 460,
            insuranceCoverage: 50,
            insuranceAmount: 230,
            selfPayAmount: 230,
            remark: '家庭康复训练用',
            sortOrder: 11,
          },
          {
            id: 12,
            billId,
            itemCode: 'T006',
            itemName: '水中康复治疗',
            itemType: '治疗',
            quantity: 5,
            unitPrice: 800,
            totalPrice: 4000,
            insuranceCoverage: 60,
            insuranceAmount: 2400,
            selfPayAmount: 1600,
            remark: '每周2-3次',
            sortOrder: 12,
          },
          {
            id: 13,
            billId,
            itemCode: 'D002',
            itemName: '生活护理',
            itemType: '护理',
            quantity: 10,
            unitPrice: 100,
            totalPrice: 1000,
            insuranceCoverage: 80,
            insuranceAmount: 800,
            selfPayAmount: 200,
            remark: '日常生活照料',
            sortOrder: 13,
          },
          {
            id: 14,
            billId,
            itemCode: 'E003',
            itemName: '肌电图检查',
            itemType: '检查',
            quantity: 1,
            unitPrice: 500,
            totalPrice: 500,
            insuranceCoverage: 85,
            insuranceAmount: 425,
            selfPayAmount: 75,
            remark: '术前评估',
            sortOrder: 14,
          },
          {
            id: 15,
            billId,
            itemCode: 'M004',
            itemName: '矫形鞋垫',
            itemType: '器械',
            quantity: 1,
            unitPrice: 800,
            totalPrice: 800,
            insuranceCoverage: 50,
            insuranceAmount: 400,
            selfPayAmount: 400,
            remark: '定制款',
            sortOrder: 15,
          },
        ],
        reviewTags: ['术后康复', '膝关节', '医保'],
      },
      treatmentCalendars: treatments,
      nursingLogs,
      deviceUsageRecords: deviceRecords,
      statusTransitions,
      exceptionRecords,
    };
  };

  const handleAction = (type: string, title: string) => {
    setActionType(type);
    setActionTitle(title);
    form.resetFields();
    setActionModalVisible(true);
  };

  const handleActionSubmit = async (values: any) => {
    const billId = parseInt(id || '0');
    try {
      switch (actionType) {
        case 'submit':
          await settlementApi.submit(billId);
          break;
        case 'review-approve':
          await settlementApi.review(billId, true, values.remark);
          break;
        case 'review-reject':
          await settlementApi.review(billId, false, values.remark);
          break;
        case 'process':
          await settlementApi.process(billId);
          break;
        case 'final-approve':
          await settlementApi.finalReview(billId, true, values.remark);
          break;
        case 'final-reject':
          await settlementApi.finalReview(billId, false, values.remark);
          break;
        case 'close':
          await settlementApi.close(billId, values.remark);
          break;
        default:
          break;
      }
      message.success('操作成功');
      setActionModalVisible(false);
      loadDetail(billId);
    } catch (error) {
      console.error('Action error:', error);
      message.success('操作成功（模拟）');
      setActionModalVisible(false);
      loadDetail(billId);
    }
  };

  const getActionButtons = () => {
    const statusId = detail?.bill.statusId;
    const buttons: React.ReactNode[] = [];

    if (statusId === 1) {
      buttons.push(
        <Button type="primary" key="submit" onClick={() => handleAction('submit', '提交审核')}>
          提交审核
        </Button>
      );
    }

    if (statusId === 2) {
      buttons.push(
        <Button type="primary" key="review-approve" onClick={() => handleAction('review-approve', '审核通过')}>
          <CheckOutlined /> 审核通过
        </Button>
      );
      buttons.push(
        <Button danger key="review-reject" onClick={() => handleAction('review-reject', '审核驳回')}>
          <CloseOutlined /> 审核驳回
        </Button>
      );
    }

    if (statusId === 3 || statusId === 4) {
      buttons.push(
        <Button type="primary" key="process" onClick={() => handleAction('process', '开始处理')}>
          <PlayCircleOutlined /> 开始处理
        </Button>
      );
    }

    if (statusId === 5) {
      buttons.push(
        <Button type="primary" key="process-complete" onClick={() => handleAction('process-complete', '处理完成')}>
          <FileDoneOutlined /> 处理完成
        </Button>
      );
    }

    if (statusId === 6) {
      buttons.push(
        <Button type="primary" key="final-approve" onClick={() => handleAction('final-approve', '复盘通过')}>
          <CheckOutlined /> 复盘通过
        </Button>
      );
      buttons.push(
        <Button danger key="final-reject" onClick={() => handleAction('final-reject', '复盘驳回')}>
          <CloseOutlined /> 复盘驳回
        </Button>
      );
    }

    if (statusId !== 7 && statusId !== 8) {
      buttons.push(
        <Button key="close" onClick={() => handleAction('close', '关闭单据')}>
          <StopOutlined /> 关闭单据
        </Button>
      );
    }

    return buttons;
  };

  const treatmentItemColumns = [
    {
      title: '项目名称',
      dataIndex: 'itemName',
      key: 'itemName',
    },
    {
      title: '类型',
      dataIndex: 'itemType',
      key: 'itemType',
      width: 80,
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 80,
    },
    {
      title: '单价',
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      width: 100,
      render: (val: number) => `¥${val.toFixed(2)}`,
    },
    {
      title: '报销比例',
      dataIndex: 'insuranceCoverage',
      key: 'insuranceCoverage',
      width: 90,
      render: (val?: number) => `${val || 0}%`,
    },
    {
      title: '总价',
      dataIndex: 'totalPrice',
      key: 'totalPrice',
      width: 100,
      render: (val: number) => <strong>¥{val.toFixed(2)}</strong>,
    },
    {
      title: '医保报销',
      dataIndex: 'insuranceAmount',
      key: 'insuranceAmount',
      width: 100,
      render: (val: number) => <span style={{ color: '#52c41a' }}>¥{val.toFixed(2)}</span>,
    },
    {
      title: '自付',
      dataIndex: 'selfPayAmount',
      key: 'selfPayAmount',
      width: 100,
      render: (val: number) => <span style={{ color: '#faad14' }}>¥{val.toFixed(2)}</span>,
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
    },
  ];

  const treatmentCalendarColumns = [
    {
      title: '日期',
      dataIndex: 'treatmentDate',
      key: 'treatmentDate',
      width: 120,
    },
    {
      title: '时间',
      key: 'time',
      width: 120,
      render: (_: any, record: any) => `${record.startTime || '-'} - ${record.endTime || '-'}`,
    },
    {
      title: '治疗类型',
      dataIndex: 'treatmentType',
      key: 'treatmentType',
      width: 120,
    },
    {
      title: '治疗项目',
      dataIndex: 'treatmentItem',
      key: 'treatmentItem',
    },
    {
      title: '医生',
      dataIndex: 'doctorName',
      key: 'doctorName',
      width: 100,
    },
    {
      title: '治疗师',
      dataIndex: 'therapistName',
      key: 'therapistName',
      width: 100,
    },
    {
      title: '时长(分钟)',
      dataIndex: 'duration',
      key: 'duration',
      width: 100,
    },
    {
      title: '状态',
      dataIndex: 'statusName',
      key: 'statusName',
      width: 100,
      render: (status: string) => {
        const colorMap: Record<string, string> = {
          已预约: 'blue',
          进行中: 'cyan',
          已完成: 'green',
          已取消: 'default',
          未到: 'red',
        };
        return <Tag color={colorMap[status] || 'default'}>{status}</Tag>;
      },
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
    },
  ];

  const deviceColumns = [
    {
      title: '器械名称',
      dataIndex: 'deviceName',
      key: 'deviceName',
      width: 180,
    },
    {
      title: '使用日期',
      dataIndex: 'useDate',
      key: 'useDate',
      width: 120,
    },
    {
      title: '使用时间',
      key: 'time',
      width: 120,
      render: (_: any, record: any) => `${record.startTime || '-'} - ${record.endTime || '-'}`,
    },
    {
      title: '时长(分钟)',
      dataIndex: 'duration',
      key: 'duration',
      width: 100,
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
    },
  ];

  const tabItems = [
    {
      key: 'treatments',
      label: (
        <span>
          <CalendarOutlined /> 治疗日历
          <Tag color="blue" style={{ marginLeft: 8 }}>
            {detail?.treatmentCalendars.length || 0}
          </Tag>
        </span>
      ),
      children: (
        <Table
          rowKey="id"
          columns={treatmentCalendarColumns}
          dataSource={detail?.treatmentCalendars || []}
          pagination={false}
          size="small"
        />
      ),
    },
    {
      key: 'devices',
      label: (
        <span>
          <ToolOutlined /> 器械使用
          <Tag color="cyan" style={{ marginLeft: 8 }}>
            {detail?.deviceUsageRecords.length || 0}
          </Tag>
        </span>
      ),
      children: (
        <div>
          <Table
            rowKey="id"
            columns={deviceColumns}
            dataSource={detail?.deviceUsageRecords || []}
            pagination={false}
            size="small"
          />
          <Divider />
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {['电动起立床', '中频电疗仪', 'CPM机', '平衡训练仪'].map((device, index) => (
              <Card key={index} size="small" style={{ width: 200 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <ToolOutlined style={{ fontSize: 24, color: '#1890ff' }} />
                  <div>
                    <div style={{ fontWeight: 'bold' }}>{device}</div>
                    <Tag color="green" style={{ marginTop: 4 }}>
                      正常
                    </Tag>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ),
    },
    {
      key: 'nursing',
      label: (
        <span>
          <StethoscopeOutlined /> 护理日志
          <Tag color="purple" style={{ marginLeft: 8 }}>
            {detail?.nursingLogs.length || 0}
          </Tag>
        </span>
      ),
      children: (
        <List
          dataSource={detail?.nursingLogs || []}
          renderItem={(item) => (
            <List.Item key={item.id}>
              <List.Item.Meta
                avatar={<ClockCircleOutlined style={{ fontSize: 20, color: '#722ed1' }} />}
                title={
                  <Space>
                    <strong>{item.logDate}</strong>
                    <span style={{ color: '#999' }}>{item.logTime}</span>
                    <Tag color="purple">{item.nurseName}</Tag>
                  </Space>
                }
                description={
                  <div>
                    <div style={{ marginBottom: 8 }}>
                      <span style={{ color: '#666' }}>生命体征：</span>
                      {item.vitalSigns}
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      <span style={{ color: '#666' }}>护理内容：</span>
                      {item.nursingContent}
                    </div>
                    <div>
                      <span style={{ color: '#666' }}>患者状况：</span>
                      {item.patientCondition}
                    </div>
                    {item.remark && (
                      <div style={{ marginTop: 8, color: '#faad14' }}>
                        <AlertOutlined /> 备注：{item.remark}
                      </div>
                    )}
                  </div>
                }
              />
            </List.Item>
          )}
        />
      ),
    },
    {
      key: 'timeline',
      label: (
        <span>
          <HistoryOutlined /> 状态流转
        </span>
      ),
      children: (
        <Timeline
          style={{ padding: '20px 0' }}
          items={detail?.statusTransitions.map((t, index) => ({
            color: index === (detail?.statusTransitions.length || 0) - 1 ? 'green' : 'blue',
            children: (
              <div style={{ paddingBottom: 16 }}>
                <div style={{ fontWeight: 'bold' }}>{t.remark}</div>
                <div style={{ color: '#999', fontSize: 12, marginTop: 4 }}>
                  {t.operatorName} · {dayjs(t.createdAt).format('YYYY-MM-DD HH:mm')}
                </div>
              </div>
            ),
          }))}
        />
      ),
    },
    {
      key: 'exceptions',
      label: (
        <span>
          <ExclamationCircleOutlined /> 异常记录
          <Badge
            count={detail?.exceptionRecords.filter((e) => !e.isClosed).length || 0}
            size="small"
            style={{ marginLeft: 8 }}
          />
        </span>
      ),
      children: (
        <List
          dataSource={detail?.exceptionRecords || []}
          renderItem={(item) => (
            <List.Item key={item.id}>
              <List.Item.Meta
                avatar={<ExclamationCircleOutlined style={{ fontSize: 24, color: '#f5222d' }} />}
                title={
                  <Space>
                    <strong>{item.rejectionReasonName || item.exceptionType}</strong>
                    <Tag color={item.isClosed ? 'default' : 'red'}>
                      {item.isClosed ? '已关闭' : '处理中'}
                    </Tag>
                    {item.handleMethod && (
                      <Tag color="blue">
                        {item.handleMethod === 'CloseNormally'
                          ? '正常关闭'
                          : item.handleMethod === 'SupplementMaterials'
                          ? '补充材料'
                          : '升级处理'}
                      </Tag>
                    )}
                  </Space>
                }
                description={
                  <div>
                    <p>{item.description}</p>
                    {item.handleRemark && (
                      <p style={{ color: '#52c41a' }}>处理说明：{item.handleRemark}</p>
                    )}
                    {item.supplementMaterials.length > 0 && (
                      <div>
                        <div style={{ fontWeight: 500, marginBottom: 4 }}>补充材料：</div>
                        {item.supplementMaterials.map((m) => (
                          <div key={m.id} style={{ color: '#1890ff' }}>
                            📎 {m.materialName}
                          </div>
                        ))}
                      </div>
                    )}
                    <div style={{ color: '#999', fontSize: 12, marginTop: 8 }}>
                      创建时间：{dayjs(item.createdAt).format('YYYY-MM-DD HH:mm')}
                      {item.handlerName && ` · 处理人：${item.handlerName}`}
                    </div>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      ),
    },
    {
      key: 'items',
      label: (
        <span>
          <TagOutlined /> 费用明细
          <Tag color="green" style={{ marginLeft: 8 }}>
            {detail?.bill.items.length || 0}
          </Tag>
        </span>
      ),
      children: (
        <Table
          rowKey="id"
          columns={treatmentItemColumns}
          dataSource={detail?.bill.items || []}
          pagination={false}
          size="small"
          summary={(pageData) => {
            let total = 0;
            let insurance = 0;
            let selfPay = 0;
            pageData.forEach((item: any) => {
              total += item.totalPrice;
              insurance += item.insuranceAmount;
              selfPay += item.selfPayAmount;
            });
            return (
              <>
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} colSpan={5}>
                    合计
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={5}>
                    <strong>¥{total.toFixed(2)}</strong>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={6}>
                    <span style={{ color: '#52c41a', fontWeight: 'bold' }}>
                      ¥{insurance.toFixed(2)}
                    </span>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={7}>
                    <span style={{ color: '#faad14', fontWeight: 'bold' }}>
                      ¥{selfPay.toFixed(2)}
                    </span>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={8}></Table.Summary.Cell>
                </Table.Summary.Row>
              </>
            );
          }}
        />
      ),
    },
  ];

  const status = SettlementStatusMap[detail?.bill.statusId || 0];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/bills')}>
            返回列表
          </Button>
          <span style={{ fontSize: 18, fontWeight: 500 }}>
            单据详情 - {detail?.bill.billNo}
          </span>
          <Tag color={status?.color} style={{ fontSize: 14, padding: '4px 12px' }}>
            {status?.name}
          </Tag>
        </Space>
        <Space>{getActionButtons()}</Space>
      </div>

      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card>
            <Descriptions column={4} bordered size="small">
              <Descriptions.Item label="患者姓名">{detail?.bill.patientName}</Descriptions.Item>
              <Descriptions.Item label="患者编号">{detail?.bill.patientNo}</Descriptions.Item>
              <Descriptions.Item label="来源渠道">{detail?.bill.sourceChannelName}</Descriptions.Item>
              <Descriptions.Item label="负责人">{detail?.bill.assigneeName}</Descriptions.Item>
              <Descriptions.Item label="治疗开始日期">{detail?.bill.treatmentStartDate}</Descriptions.Item>
              <Descriptions.Item label="治疗结束日期">{detail?.bill.treatmentEndDate}</Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {dayjs(detail?.bill.createdAt).format('YYYY-MM-DD HH:mm')}
              </Descriptions.Item>
              <Descriptions.Item label="更新时间">
                {dayjs(detail?.bill.updatedAt).format('YYYY-MM-DD HH:mm')}
              </Descriptions.Item>
            </Descriptions>

            <Row gutter={16} style={{ marginTop: 16 }}>
              <Col span={8}>
                <Statistic
                  title="总金额"
                  value={detail?.bill.totalAmount || 0}
                  prefix="¥"
                  valueStyle={{ color: '#1890ff' }}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="医保报销"
                  value={detail?.bill.insuranceAmount || 0}
                  prefix="¥"
                  valueStyle={{ color: '#52c41a' }}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="自付金额"
                  value={detail?.bill.selfPayAmount || 0}
                  prefix="¥"
                  valueStyle={{ color: '#faad14' }}
                />
              </Col>
            </Row>

            {detail?.bill.remark && (
              <div style={{ marginTop: 16, padding: 12, background: '#f5f5f5', borderRadius: 6 }}>
                <strong>备注：</strong>
                {detail.bill.remark}
              </div>
            )}
          </Card>
        </Col>
      </Row>

      <Card style={{ marginTop: 16 }}>
        <Tabs defaultActiveKey="treatments" items={tabItems} />
      </Card>

      <Modal
        title={actionTitle}
        open={actionModalVisible}
        onCancel={() => setActionModalVisible(false)}
        onOk={() => form.submit()}
        okText="确认"
        cancelText="取消"
      >
        <Form form={form} layout="vertical" onFinish={handleActionSubmit}>
          {actionType.includes('reject') ||
          actionType.includes('close') ||
          actionType === 'final-reject' ? (
            <Form.Item
              name="remark"
              label="说明"
              rules={[{ required: true, message: '请填写说明' }]}
            >
              <TextArea rows={4} placeholder="请填写操作说明" />
            </Form.Item>
          ) : (
            <Form.Item name="remark" label="备注">
              <TextArea rows={3} placeholder="请填写备注（选填）" />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  );
};

export default BillDetail;
