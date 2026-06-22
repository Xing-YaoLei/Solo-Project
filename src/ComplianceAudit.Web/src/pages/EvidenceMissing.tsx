import { useEffect, useState } from 'react';
import {
  Table, Tag, Button, Form, Input, Select, DatePicker, Modal,
  Card, Row, Col, Space, message, Popconfirm, Drawer,
  Descriptions, Typography, Empty, Upload, List, Avatar, Timeline
} from 'antd';
import {
  SearchOutlined, ReloadOutlined, PlusOutlined,
  ExclamationCircleOutlined, UploadOutlined, PaperClipOutlined,
  DownloadOutlined, HistoryOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import type { UploadProps } from 'antd';
import { evidenceMissingApi, evidencesApi, processingHistoryApi } from '@/services/api';
import { useRolePermissions } from '@/store/authStore';
import type { EvidenceMissingListDto, EvidenceStatus } from '@/types';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

const StatusTag = ({ status }: { status: number }) => {
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

export default function EvidenceMissing() {
  const { isAuditor, isBusinessOwner, isComplianceOfficer, isManagement } = useRolePermissions();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<EvidenceMissingListDto[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [queryForm] = Form.useForm();
  const [detailDrawer, setDetailDrawer] = useState<{ open: boolean; item?: EvidenceMissingListDto; evidences: any[]; histories: any[] }>({ open: false, evidences: [], histories: [] });
  const [requestModal, setRequestModal] = useState<{ open: boolean; id?: number }>({ open: false });
  const [supplyModal, setSupplyModal] = useState<{ open: boolean; id?: number }>({ open: false });
  const [reviewModal, setReviewModal] = useState<{ open: boolean; id?: number }>({ open: false });
  const [requestForm] = Form.useForm();
  const [supplyForm] = Form.useForm();
  const [reviewForm] = Form.useForm();
  const [supplyFiles, setSupplyFiles] = useState<any[]>([]);

  useEffect(() => { loadData(); }, [page, pageSize]);

  const loadData = async () => {
    setLoading(true);
    try {
      const v = queryForm.getFieldsValue();
      const res = await evidenceMissingApi.list({
        pageNumber: page, pageSize,
        status: v.status, responsibleId: v.responsibleId,
        myAssigned: v.myAssigned ?? false
      });
      if (res.success && res.data) {
        setData(res.data.items);
        setTotal(res.data.totalCount);
      }
    } finally { setLoading(false); }
  };

  const openDetail = async (item: EvidenceMissingListDto) => {
    const [evRes, histRes] = await Promise.all([
      evidenceMissingApi.get(item.id),
      processingHistoryApi.list({ entityType: 'EvidenceMissingRecord', entityId: item.id, pageNumber: 1, pageSize: 100 })
    ]);
    setDetailDrawer({
      open: true, item,
      evidences: (evRes.data as any)?.suppliedEvidences ?? [],
      histories: (histRes.data as any)?.items ?? []
    });
  };

  const handleRequest = async (values: any) => {
    if (!requestModal.id) return;
    try {
      const res = await evidenceMissingApi.requestSupplement({
        id: requestModal.id,
        description: values.description,
        responsibleId: values.responsibleId,
        deadline: values.deadline.toISOString()
      });
      if (res.success) {
        message.success('已发起补充请求');
        setRequestModal({ open: false });
        requestForm.resetFields();
        loadData();
      }
    } catch { message.error('操作失败'); }
  };

  const handleSupply = async (values: any) => {
    if (!supplyModal.id) return;
    try {
      const res = await evidenceMissingApi.provideEvidence({
        id: supplyModal.id,
        supplierComments: values.supplierComments,
        evidences: supplyFiles.map(f => ({ fileName: f.name, fileUrl: URL.createObjectURL(f), fileSize: f.size, contentType: f.type }))
      });
      if (res.success) {
        message.success('补充证据已提交');
        setSupplyModal({ open: false });
        supplyForm.resetFields();
        setSupplyFiles([]);
        loadData();
      }
    } catch { message.error('提交失败'); }
  };

  const handleReview = async (values: any) => {
    if (!reviewModal.id) return;
    try {
      const res = await evidenceMissingApi.review({
        id: reviewModal.id,
        newStatus: values.newStatus,
        reviewerComments: values.reviewerComments
      });
      if (res.success) {
        message.success('审核完成');
        setReviewModal({ open: false });
        reviewForm.resetFields();
        loadData();
      }
    } catch { message.error('审核失败'); }
  };

  const handleWaive = async (id: number) => {
    try {
      const res = await evidenceMissingApi.waive({ id, waiveReason: '管理层批准豁免' });
      if (res.success) { message.success('已豁免'); loadData(); }
    } catch { message.error('操作失败'); }
  };

  const columns = [
    {
      title: '缺失编号', dataIndex: 'missingNo', width: 200,
      render: (t: string, r: any) => (
        <a onClick={() => openDetail(r)}><ExclamationCircleOutlined style={{ color: '#ff4d4f' }} /> {t}</a>
      )
    },
    {
      title: '缺失说明', dataIndex: 'missingDescription', ellipsis: true,
      render: (t: string) => <Paragraph ellipsis={{ rows: 1 }} style={{ margin: 0 }}>{t}</Paragraph>
    },
    { title: '责任人', dataIndex: 'responsibleName', width: 100, render: (n: any) => n || '-' },
    {
      title: '发起时间', dataIndex: 'requestedAt', width: 160,
      render: (d: string) => dayjs(d).format('YYYY-MM-DD HH:mm')
    },
    {
      title: '补充截止', dataIndex: 'deadline', width: 120,
      render: (d?: string) => d ? dayjs(d).format('YYYY-MM-DD') : '-'
    },
    { title: '附件数', dataIndex: 'evidenceCount', width: 80 },
    { title: '豁免', dataIndex: 'isWaived', width: 80, render: (w: boolean) => w ? <Tag color="default">已豁免</Tag> : '-' },
    { title: '状态', dataIndex: 'status', width: 110, render: (s: number) => <StatusTag status={s} /> },
    {
      title: '操作', key: 'ops', width: 240, fixed: 'right' as const,
      render: (_: any, r: any) => (
        <Space size="small">
          <Button type="link" size="small" onClick={() => openDetail(r)}>详情</Button>
          {isAuditor && (r.status === 2 || r.status === 1) && (
            <Button type="link" size="small" onClick={() => setRequestModal({ open: true, id: r.id })}>请求补充</Button>
          )}
          {isBusinessOwner && r.status === 3 && (
            <Button type="link" size="small" onClick={() => setSupplyModal({ open: true, id: r.id })}>补充证据</Button>
          )}
          {isComplianceOfficer && r.status === 4 && (
            <Button type="link" size="small" onClick={() => setReviewModal({ open: true, id: r.id })}>审核</Button>
          )}
          {isManagement && !r.isWaived && (
            <Popconfirm title="确认豁免此证据要求？" onConfirm={() => handleWaive(r.id)}>
              <Button type="link" size="small">豁免</Button>
            </Popconfirm>
          )}
        </Space>
      )
    }
  ];

  const stats = [
    { label: '全部', value: total, color: '#1677ff' },
    { label: '证据缺失', value: data.filter(d => d.status === 2).length, color: '#F5222D' },
    { label: '待补充', value: data.filter(d => d.status === 3).length, color: '#FA8C16' },
    { label: '待审核', value: data.filter(d => d.status === 4).length, color: '#722ED1' },
    { label: '已完整/豁免', value: data.filter(d => d.status === 1 || d.status === 5).length, color: '#52C41A' }
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <Title level={3} style={{ margin: 0 }}>证据缺失处理</Title>
          <Text type="secondary">集中处理检查过程中的证据缺失情况，独立留痕</Text>
        </div>
        {isAuditor && (
          <Button type="primary" icon={<PlusOutlined />}>
            登记缺失
          </Button>
        )}
      </div>

      <Row gutter={12} style={{ marginBottom: 16 }}>
        {stats.map((s, i) => (
          <Col key={i} xs={12} sm={8} md={4}>
            <Card size="small" styles={{ body: { padding: 16 } }} bordered={false}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>{s.label}</Text>
                  <div style={{ fontSize: 24, fontWeight: 600, color: s.color }}>{s.value}</div>
                </div>
                <ExclamationCircleOutlined style={{ fontSize: 24, color: s.color, opacity: 0.5 }} />
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Card className="filter-bar" bordered={false} styles={{ body: { padding: 16 } }}>
        <Form form={queryForm} layout="inline" onFinish={() => { setPage(1); loadData(); }}>
          <Form.Item name="status"><Select allowClear placeholder="状态" style={{ width: 140 }}>
            <Option value={2}>缺失</Option><Option value={3}>待补充</Option>
            <Option value={4}>已补待审</Option><Option value={1}>完整</Option><Option value={5}>已豁免</Option>
          </Select></Form.Item>
          <Form.Item name="myAssigned" valuePropName="checked">
            <Space><Checkbox /> 分配给我处理的</Space>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>查询</Button>
              <Button onClick={() => { queryForm.resetFields(); loadData(); }} icon={<ReloadOutlined />}>重置</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Card bordered={false} styles={{ body: { padding: 0 } }}>
        <Table
          rowKey="id"
          loading={loading}
          dataSource={data}
          columns={columns}
          pagination={{
            current: page, pageSize, total,
            showSizeChanger: true, showQuickJumper: true,
            showTotal: (t) => `共 ${t} 条`,
            onChange: (p, ps) => { setPage(p); setPageSize(ps); }
          }}
          scroll={{ x: 1300 }}
        />
      </Card>

      <Drawer
        title={`证据缺失详情 - ${detailDrawer.item?.missingNo ?? ''}`}
        open={detailDrawer.open}
        onClose={() => setDetailDrawer({ open: false, evidences: [], histories: [] })}
        width={560}
      >
        {detailDrawer.item && (
          <>
            <Descriptions column={1} size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="缺失说明">{detailDrawer.item.missingDescription}</Descriptions.Item>
              <Descriptions.Item label="责任人">{detailDrawer.item.responsibleName ?? '-'}</Descriptions.Item>
              <Descriptions.Item label="发起时间">{dayjs(detailDrawer.item.requestedAt).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>
              <Descriptions.Item label="补充截止">{detailDrawer.item.deadline ? dayjs(detailDrawer.item.deadline).format('YYYY-MM-DD') : '-'}</Descriptions.Item>
              <Descriptions.Item label="当前状态"><StatusTag status={detailDrawer.item.status} /></Descriptions.Item>
              <Descriptions.Item label="来源关联">{detailDrawer.item.checkRecordId && <a>检查记录 #{detailDrawer.item.checkRecordId}</a>}</Descriptions.Item>
            </Descriptions>

            <Card size="small" title={<span><PaperClipOutlined /> 补充的证据 ({detailDrawer.evidences.length})</span>} style={{ marginBottom: 12 }}>
              {detailDrawer.evidences.length > 0 ? (
                <List
                  size="small"
                  dataSource={detailDrawer.evidences}
                  renderItem={(e: any) => (
                    <List.Item key={e.id}>
                      <List.Item.Meta avatar={<Avatar icon={<PaperClipOutlined />} />} title={e.fileName} description={`${(e.fileSize / 1024).toFixed(1)} KB`} />
                      <Space><Button type="link" size="small" icon={<DownloadOutlined />}>下载</Button></Space>
                    </List.Item>
                  )}
                />
              ) : <Empty description="暂无补充证据" imageStyle={{ height: 40 }} />}
            </Card>

            <Card size="small" title={<span><HistoryOutlined /> 处理溯源</span>} style={{ marginBottom: 12 }}>
              {detailDrawer.histories.length > 0 ? (
                <Timeline
                  size="small"
                  items={detailDrawer.histories.map((h: any) => ({
                    label: dayjs(h.operatedAt).format('MM-DD HH:mm'),
                    children: (
                      <div>
                        <Tag color="blue">{h.actionType}</Tag>
                        <Text type="secondary" style={{ marginLeft: 8 }}>{h.operatorName}</Text>
                        <Paragraph style={{ margin: '4px 0 0 0', color: 'rgba(0,0,0,0.65)' }}>{h.description}</Paragraph>
                      </div>
                    )
                  }))}
                />
              ) : <Empty description="暂无处理记录" imageStyle={{ height: 40 }} />}
            </Card>
          </>
        )}
      </Drawer>

      <Modal title="发起补充请求" open={requestModal.open} onCancel={() => setRequestModal({ open: false })} footer={null}>
        <Form form={requestForm} layout="vertical" onFinish={handleRequest}>
          <Form.Item name="description" label="补充要求说明" rules={[{ required: true }]}>
            <Input.TextArea rows={4} placeholder="请详细说明需要补充什么证据、格式要求等" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="responsibleId" label="责任人" rules={[{ required: true }]}>
                <Select placeholder="选择业务方负责人" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="deadline" label="补充截止日期" rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setRequestModal({ open: false })}>取消</Button>
              <Button type="primary" htmlType="submit">发起请求</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="提交补充证据" open={supplyModal.open} onCancel={() => setSupplyModal({ open: false })} footer={null}>
        <Form form={supplyForm} layout="vertical" onFinish={handleSupply}>
          <Form.Item label="上传证据附件">
            <Upload
              multiple
              fileList={supplyFiles.map((f, i) => ({ uid: String(i), name: f.name, size: f.size, status: 'done' as const }))}
              beforeUpload={(f) => { setSupplyFiles([...supplyFiles, f]); return false; }}
              onRemove={(f) => setSupplyFiles(supplyFiles.filter((_, i) => i !== Number(f.uid)))}
            >
              <Button icon={<UploadOutlined />}>点击或拖拽上传</Button>
            </Upload>
          </Form.Item>
          <Form.Item name="supplierComments" label="补充说明">
            <Input.TextArea rows={3} placeholder="简要说明补充的内容，如有需要" />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setSupplyModal({ open: false })}>取消</Button>
              <Button type="primary" htmlType="submit">提交</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="审核补充证据" open={reviewModal.open} onCancel={() => setReviewModal({ open: false })} footer={null}>
        <Form form={reviewForm} layout="vertical" onFinish={handleReview}>
          <Form.Item name="newStatus" label="审核结果" rules={[{ required: true }]} initialValue={1}>
            <Radio.Group optionType="button" buttonStyle="solid" style={{ width: '100%' }}>
              <Radio.Button value={1} style={{ width: '50%', textAlign: 'center' }}>证据完整</Radio.Button>
              <Radio.Button value={3} style={{ width: '50%', textAlign: 'center' }}>需继续补充</Radio.Button>
            </Radio.Group>
          </Form.Item>
          <Form.Item name="reviewerComments" label="审核意见" rules={[{ required: true }]}>
            <Input.TextArea rows={4} placeholder="请详细说明审核意见..." />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setReviewModal({ open: false })}>取消</Button>
              <Button type="primary" htmlType="submit">确认审核</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
