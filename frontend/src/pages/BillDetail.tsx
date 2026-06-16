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
  HeartOutlined,
  CalendarOutlined,
  HistoryOutlined,
  TagOutlined,
  AlertOutlined,
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { settlementApi } from '../services/api';
import type { SettlementBillDetail } from '../types';
import { SettlementStatusMap } from '../types';
import dayjs from 'dayjs';

const { TextArea } = Input;

const BillDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [, setLoading] = useState(false);
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
      message.error('加载单据详情失败');
    } finally {
      setLoading(false);
    }
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
        case 'process-complete':
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
      message.error('操作失败');
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
          <HeartOutlined /> 护理日志
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
