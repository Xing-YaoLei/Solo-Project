import { useState } from 'react';
import {
  Card, Input, Button, Typography, Timeline, Tag, Empty, Space, Form,
  Row, Col, Divider, Table, Progress
} from 'antd';
import {
  SearchOutlined, FileSearchOutlined, HistoryOutlined,
  CheckCircleOutlined, ExclamationCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { statisticsApi, checkRecordsApi } from '@/services/api';
import type { DocumentTraceInfo } from '@/types';

const { Title, Text, Paragraph } = Typography;

export default function DocumentTrace() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [documentNo, setDocumentNo] = useState('');
  const [traces, setTraces] = useState<DocumentTraceInfo[]>([]);
  const [checkRecords, setCheckRecords] = useState<any[]>([]);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (values: any) => {
    const no = values.documentNo?.trim();
    if (!no) return;
    setLoading(true);
    setDocumentNo(no);
    setSearched(true);
    try {
      const res = await statisticsApi.getDocumentTrace(no);
      if (res.success) setTraces(res.data ?? []);
      const crRes = await checkRecordsApi.getByDocumentNo(no);
      if (crRes.success) setCheckRecords(crRes.data ?? []);
    } finally { setLoading(false); }
  };

  const typeConfig: Record<string, { color: string; label: string }> = {
    SamplingRecord: { color: '#1677ff', label: '抽样记录' },
    CheckRecord: { color: '#722ED1', label: '检查记录' },
    ProcessingHistory: { color: '#13C2C2', label: '处理动作' }
  };

  const crCols = [
    { title: '记录ID', dataIndex: 'id', width: 80 },
    {
      title: '合规判定', dataIndex: 'isCompliant', width: 100,
      render: (v: any) => v === true ? <Tag color="success" icon={<CheckCircleOutlined />}>合规</Tag>
        : v === false ? <Tag color="error" icon={<ExclamationCircleOutlined />}>不合规</Tag> : <Tag>未判定</Tag>
    },
    {
      title: '风险等级', dataIndex: 'riskLevel', width: 100,
      render: (l: number) => {
        const m: Record<number, any> = {
          1: { c: 'green', t: '低风险' }, 2: { c: 'orange', t: '中风险' },
          3: { c: 'red', t: '高风险' }, 4: { c: '#000', t: '严重风险' }
        };
        const cfg = m[l] ?? m[1];
        return <Tag color={cfg.c} style={l === 4 ? { background: '#000', color: '#ff4d4f', border: 'none' } : {}}>{cfg.t}</Tag>;
      }
    },
    { title: '发现问题', dataIndex: 'findings', ellipsis: true },
    {
      title: '证据状态', dataIndex: 'evidenceStatus', width: 110,
      render: (s: number) => {
        const m: Record<number, any> = {
          1: { c: 'success', t: '完整' }, 2: { c: 'error', t: '缺失' },
          3: { c: 'warning', t: '待补充' }, 4: { c: 'processing', t: '已补待审' }, 5: { c: 'default', t: '已豁免' }
        };
        return <Tag color={m[s]?.c}>{m[s]?.t}</Tag>;
      }
    },
    {
      title: '状态', dataIndex: 'status', width: 100,
      render: (s: number) => {
        const m: Record<number, any> = {
          1: { c: 'default', t: '待处理' }, 2: { c: 'processing', t: '进行中' },
          3: { c: 'warning', t: '待复核' }, 4: { c: 'processing', t: '已复核' },
          5: { c: 'success', t: '已通过' }, 6: { c: 'error', t: '已拒绝' }, 7: { c: 'default', t: '已关闭' }
        };
        return <Tag color={m[s]?.c}>{m[s]?.t}</Tag>;
      }
    },
    { title: '处理时间', dataIndex: 'checkedAt', width: 160, render: (d: string) => d ? dayjs(d).format('YYYY-MM-DD HH:mm') : '-' },
    { title: '来源关联', dataIndex: 'sourceReference', width: 180, render: (v: string) => v ? <Tag color="geekblue">{v}</Tag> : '-' }
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <Title level={3} style={{ margin: 0 }}>单据追溯</Title>
          <Text type="secondary">输入单据号即可查看完整的生命周期，处理前后所有动作留痕</Text>
        </div>
      </div>

      <Card
        bordered={false}
        style={{
          marginBottom: 16,
          background: 'linear-gradient(135deg, #E6F4FF 0%, #F0F5FF 100%)',
          border: '1px solid #91caff'
        }}
      >
        <Form form={form} layout="inline" onFinish={handleSearch} style={{ justifyContent: 'center', display: 'flex' }}>
          <Form.Item name="documentNo" style={{ width: 480, marginRight: 12 }}>
            <Input
              size="large"
              prefix={<FileSearchOutlined />}
              placeholder="请输入单据编号，例如：PO-2024-12345、INV-00123..."
              allowClear
            />
          </Form.Item>
          <Form.Item>
            <Button size="large" type="primary" htmlType="submit" loading={loading} icon={<SearchOutlined />}>
              追溯查询
            </Button>
          </Form.Item>
        </Form>
        <div style={{ textAlign: 'center' }}>
          <Space size={16} wrap>
            <Text type="secondary">快速示例：</Text>
            <a onClick={() => form.setFieldsValue({ documentNo: 'PO-2024-0001' })}>PO-2024-0001</a>
            <a onClick={() => form.setFieldsValue({ documentNo: 'INV-2024-0123' })}>INV-2024-0123</a>
            <a onClick={() => form.setFieldsValue({ documentNo: 'PAY-2024-0987' })}>PAY-2024-0987</a>
          </Space>
        </div>
      </Card>

      {searched && (
        <>
          {traces.length === 0 && !loading ? (
            <Empty
              description={
                <div>
                  <Paragraph>未找到单据 <Text strong>"{documentNo}"</Text> 的任何处理记录</Paragraph>
                  <Paragraph type="secondary">该单据可能还未进入审计流程，或单据号有误。请核对后再试。</Paragraph>
                </div>
              }
              style={{ padding: '80px 0' }}
            />
          ) : (
            <>
              <Row gutter={16} style={{ marginBottom: 16 }}>
                <Col xs={24} sm={6}>
                  <Card size="small" bordered={false} style={{ background: '#E6F4FF' }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>查询单据</Text>
                    <div style={{ fontSize: 18, fontWeight: 600, color: '#1677ff', marginTop: 4, wordBreak: 'break-all' }}>
                      {documentNo}
                    </div>
                  </Card>
                </Col>
                <Col xs={24} sm={6}>
                  <Card size="small" bordered={false} style={{ background: '#F9F0FF' }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>关联记录总数</Text>
                    <div style={{ fontSize: 18, fontWeight: 600, color: '#722ED1', marginTop: 4 }}>{traces.length}</div>
                  </Card>
                </Col>
                <Col xs={24} sm={6}>
                  <Card size="small" bordered={false} style={{ background: '#FFF7E6' }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>检查记录数</Text>
                    <div style={{ fontSize: 18, fontWeight: 600, color: '#FA8C16', marginTop: 4 }}>{checkRecords.length}</div>
                  </Card>
                </Col>
                <Col xs={24} sm={6}>
                  <Card size="small" bordered={false} style={{ background: '#F6FFED' }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>最早处理时间</Text>
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#52C41A', marginTop: 4 }}>
                      {traces.length > 0 ? dayjs(traces[traces.length - 1].actionTime).format('YYYY-MM-DD HH:mm') : '-'}
                    </div>
                  </Card>
                </Col>
              </Row>

              {checkRecords.length > 0 && (
                <Card
                  title={<span>关联的检查记录</span>}
                  bordered={false}
                  style={{ marginBottom: 16 }}
                  extra={<Tag color="blue">{checkRecords.length} 条</Tag>}
                >
                  <Table
                    size="middle"
                    rowKey="id"
                    pagination={false}
                    dataSource={checkRecords}
                    columns={crCols}
                    scroll={{ x: 1200 }}
                  />
                </Card>
              )}

              <Card
                title={
                  <Space>
                    <HistoryOutlined style={{ color: '#13C2C2' }} />
                    完整追溯时间线
                    <Tag color="cyan">{traces.length} 条动作</Tag>
                  </Space>
                }
                bordered={false}
                styles={{ body: { padding: 24 } }}
              >
                <Timeline
                  mode="left"
                  style={{ paddingLeft: 16 }}
                  items={traces.map((h, idx) => {
                    const cfg = typeConfig[h.entityType] ?? { color: 'gray', label: h.entityType };
                    return {
                      color: cfg.color,
                      label: (
                        <div style={{ width: 160 }}>
                          <div style={{ fontWeight: 600 }}>{dayjs(h.actionTime).format('YYYY-MM-DD')}</div>
                          <div style={{ color: 'rgba(0,0,0,0.45)' }}>{dayjs(h.actionTime).format('HH:mm:ss')}</div>
                          <Tag color={cfg.color} style={{ marginTop: 4 }}>{cfg.label}</Tag>
                        </div>
                      ),
                      dot: idx === 0 ? <div style={{
                        width: 18, height: 18, borderRadius: '50%',
                        background: '#13C2C2', border: '3px solid #fff',
                        boxShadow: '0 0 0 3px #13C2C2'
                      }} /> : undefined,
                      children: (
                        <Card
                          size="small"
                          style={{
                            marginBottom: 8,
                            border: `1px solid ${cfg.color}40`,
                            borderLeft: `4px solid ${cfg.color}`
                          }}
                          styles={{ body: { padding: '12px 16px' } }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                            <div style={{ flex: 1 }}>
                              <Space style={{ marginBottom: 6 }} wrap>
                                <Text strong style={{ color: cfg.color, fontSize: 15 }}>{h.title}</Text>
                                <Tag>{h.status}</Tag>
                              </Space>
                              {h.remarks && <Paragraph ellipsis={{ rows: 3 }} style={{ margin: '4px 0', color: 'rgba(0,0,0,0.75)' }}>{h.remarks}</Paragraph>}
                              <Space size="large" wrap style={{ marginTop: 4 }}>
                                <Text type="secondary">操作人：{h.operator}</Text>
                                {h.sourceReference && <Text type="secondary">来源：{h.sourceReference}</Text>}
                                <Text type="secondary">实体ID：#{h.entityId}</Text>
                              </Space>
                            </div>
                            {idx === 0 && (
                              <Tag color="#13C2C2" style={{ whiteSpace: 'nowrap' }}>最新</Tag>
                            )}
                          </div>
                        </Card>
                      )
                    };
                  })}
                />
                {traces.length > 10 && (
                  <div style={{ textAlign: 'center', marginTop: 16 }}>
                    <Progress percent={100} showInfo={false} status="success" />
                    <Paragraph type="secondary" style={{ marginTop: 8, marginBottom: 0 }}>
                      以上为单据 <Text strong>{documentNo}</Text> 的完整处理历史（从最新到最早）
                    </Paragraph>
                  </div>
                )}
              </Card>
            </>
          )}
        </>
      )}

      {!searched && (
        <Empty
          description={
            <div style={{ padding: '40px 0' }}>
              <Title level={4} type="secondary">请输入单据号开始追溯</Title>
              <Paragraph type="secondary">
                支持查询采购单、付款单、报销单、合同、发票等各类进入审计流程的单据
              </Paragraph>
              <Paragraph type="secondary">
                追溯结果可查看：抽样记录、检查记录、所有处理动作及操作人、证据状态变更、整改跟进等
              </Paragraph>
            </div>
          }
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      )}
    </div>
  );
}
