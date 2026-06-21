import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Tabs,
  Card,
  Descriptions,
  Timeline,
  Steps,
  Image,
  Upload,
  Button,
  Modal,
  Form,
  Tag,
  Space,
  Select,
  Input,
  message,
  Spin,
  Breadcrumb,
} from 'antd';
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  PlusOutlined,
  WarningOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  VerificationStatus,
  VerificationStage,
  DamageSeverity,
  DamageRange,
  ResponsibleParty,
  PhotoType,
} from '@/types';
import type { DamageReport, ReviewRecord, VerificationPhoto } from '@/types';
import { useAppStore } from '@/store';

const statusColorMap: Record<string, string> = {
  Pending: 'orange',
  Assigned: 'blue',
  InProgress: 'cyan',
  Confirmed: 'green',
  Supplemented: 'geekblue',
  Closed: 'default',
  Cancelled: 'red',
  Damaged: 'red',
  Overdue: 'magenta',
};

const severityColorMap: Record<string, string> = {
  Minor: 'green',
  Moderate: 'orange',
  Major: 'red',
  Critical: '#cf1322',
};

const severityLabel: Record<string, string> = {
  Minor: '轻微',
  Moderate: '中等',
  Major: '严重',
  Critical: '致命',
};

const rangeLabel: Record<string, string> = {
  SingleItem: '单件',
  PartialPackage: '部分包裹',
  EntirePackage: '整包',
  MultiplePackages: '多包裹',
};

const partyLabel: Record<string, string> = {
  Rider: '骑手',
  Sender: '寄件人',
  Receiver: '收件人',
  Platform: '平台',
  Undetermined: '未确定',
};

export default function RecordDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentRecord, loadingRecord, fetchRecordDetail } = useAppStore();

  const [activeTab, setActiveTab] = useState('overview');
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [supplementModalOpen, setSupplementModalOpen] = useState(false);
  const [closeModalOpen, setCloseModalOpen] = useState(false);
  const [damageModalOpen, setDamageModalOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [adjustingReport, setAdjustingReport] = useState<DamageReport | null>(null);

  const [supplementForm] = Form.useForm();
  const [closeForm] = Form.useForm();
  const [damageForm] = Form.useForm();
  const [reviewForm] = Form.useForm();
  const [adjustForm] = Form.useForm();

  useEffect(() => {
    if (id) fetchRecordDetail(id);
  }, [id, fetchRecordDetail]);

  const handleConfirm = useCallback(async () => {
    setConfirmLoading(true);
    try {
      message.success('确认成功');
    } catch {
      message.error('确认失败');
    }
    setConfirmLoading(false);
  }, []);

  const handleSupplement = useCallback(async () => {
    try {
      const values = await supplementForm.validateFields();
      console.log('Supplement:', values);
      message.success('补充成功');
      setSupplementModalOpen(false);
      supplementForm.resetFields();
    } catch {
      /* validation failed */
    }
  }, [supplementForm]);

  const handleClose = useCallback(async () => {
    try {
      const values = await closeForm.validateFields();
      console.log('Close:', values);
      message.success('关闭成功');
      setCloseModalOpen(false);
      closeForm.resetFields();
    } catch {
      /* validation failed */
    }
  }, [closeForm]);

  const handleReportDamage = useCallback(async () => {
    try {
      const values = await damageForm.validateFields();
      console.log('Report damage:', values);
      message.success('损坏报告提交成功');
      setDamageModalOpen(false);
      damageForm.resetFields();
    } catch {
      /* validation failed */
    }
  }, [damageForm]);

  const handleCompleteReview = useCallback(async () => {
    try {
      const values = await reviewForm.validateFields();
      console.log('Complete review:', values);
      message.success('复盘完成');
      setReviewModalOpen(false);
      reviewForm.resetFields();
    } catch {
      /* validation failed */
    }
  }, [reviewForm]);

  const handleAdjustResponsibility = useCallback(async () => {
    try {
      const values = await adjustForm.validateFields();
      console.log('Adjust responsibility:', adjustingReport?.id, values);
      message.success('责任调整成功');
      setAdjustModalOpen(false);
      adjustForm.resetFields();
    } catch {
      /* validation failed */
    }
  }, [adjustForm, adjustingReport]);

  if (loadingRecord) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 100 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!currentRecord) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <p>未找到记录</p>
        <Button onClick={() => navigate('/records')}>返回列表</Button>
      </div>
    );
  }

  const record = currentRecord;
  const stageIndex = [VerificationStage.Entry, VerificationStage.Action, VerificationStage.Review].indexOf(
    record.stage,
  );

  const overviewTab = (
    <div>
      <Card title="基础信息" style={{ marginBottom: 16 }}>
        <Descriptions column={{ xs: 1, sm: 2, md: 3 }} bordered size="small">
          <Descriptions.Item label="核验编号">{record.recordNo}</Descriptions.Item>
          <Descriptions.Item label="订单号">{record.order?.orderNumber || '-'}</Descriptions.Item>
          <Descriptions.Item label="骑手">{record.rider?.name || '-'}</Descriptions.Item>
          <Descriptions.Item label="取件地址">{record.order?.pickupAddress || '-'}</Descriptions.Item>
          <Descriptions.Item label="送达地址">{record.order?.deliveryAddress || '-'}</Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag color={statusColorMap[record.status] || 'default'}>{record.status}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="阶段">
            <Tag>{record.stage}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="处理人">{record.handlerName || '-'}</Descriptions.Item>
          <Descriptions.Item label="创建时间">
            {dayjs(record.createdAt).format('YYYY-MM-DD HH:mm')}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {record.ratingTags && record.ratingTags.length > 0 && (
        <Card title="评价标签" style={{ marginBottom: 16 }}>
          <Space wrap>
            {record.ratingTags.map((tag) => (
              <Tag key={tag} color="blue">{tag}</Tag>
            ))}
          </Space>
        </Card>
      )}

      {record.riderTrajectory && (
        <Card title="骑手轨迹" style={{ marginBottom: 16 }}>
          <p>{record.riderTrajectory}</p>
        </Card>
      )}

      {record.attachments && record.attachments.length > 0 && (
        <Card title="附件列表" style={{ marginBottom: 16 }}>
          {record.attachments.map((att) => (
            <div key={att.id} style={{ marginBottom: 8 }}>
              <a href={att.fileUrl} target="_blank" rel="noopener noreferrer">
                {att.fileName}
              </a>
              <span style={{ marginLeft: 8, color: '#999' }}>
                ({(att.fileSize / 1024).toFixed(1)} KB)
              </span>
            </div>
          ))}
        </Card>
      )}

      {record.remark && (
        <Card title="备注" style={{ marginBottom: 16 }}>
          <p>{record.remark}</p>
        </Card>
      )}
    </div>
  );

  const photoTab = (
    <Card title="照片附件">
      <Upload
        listType="picture-card"
        showUploadList={false}
        beforeUpload={() => false}
        onChange={() => message.info('上传功能需要对接后端API')}
      >
        <div>
          <PlusOutlined />
          <div style={{ marginTop: 8 }}>上传</div>
        </div>
      </Upload>

      {record.photos && record.photos.length > 0 && (
        <Image.PreviewGroup>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 16 }}>
            {record.photos.map((photo: VerificationPhoto) => (
              <div key={photo.id} style={{ position: 'relative' }}>
                <Image
                  width={160}
                  height={120}
                  src={photo.photoUrl}
                  style={{ objectFit: 'cover', borderRadius: 4 }}
                />
                {photo.isDamagePhoto && (
                  <Tag
                    color="red"
                    style={{ position: 'absolute', top: 4, left: 4, margin: 0 }}
                  >
                    损坏
                  </Tag>
                )}
                <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                  {photo.remark || photo.photoType}
                </div>
              </div>
            ))}
          </div>
        </Image.PreviewGroup>
      )}

      {(!record.photos || record.photos.length === 0) && (
        <p style={{ color: '#999', marginTop: 16 }}>暂无照片</p>
      )}
    </Card>
  );

  const damageTab = (
    <div>
      {record.damageReports && record.damageReports.length > 0 ? (
        record.damageReports.map((report: DamageReport) => (
          <Card
            key={report.id}
            title={`损坏报告 - ${dayjs(report.reportedAt).format('YYYY-MM-DD HH:mm')}`}
            style={{ marginBottom: 16 }}
            extra={
              <Button
                size="small"
                onClick={() => {
                  setAdjustingReport(report);
                  adjustForm.setFieldsValue({
                    finalResponsibility: report.finalResponsibility || report.initialResponsibility,
                  });
                  setAdjustModalOpen(true);
                }}
              >
                调整责任
              </Button>
            }
          >
            <Descriptions column={{ xs: 1, sm: 2 }} bordered size="small">
              <Descriptions.Item label="影响范围">
                {rangeLabel[report.damageRange] || report.damageRange}
              </Descriptions.Item>
              <Descriptions.Item label="严重程度">
                <Tag color={severityColorMap[report.severity]}>
                  {severityLabel[report.severity] || report.severity}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="损坏描述" span={2}>
                {report.damageDescription}
              </Descriptions.Item>
              <Descriptions.Item label="受影响物品" span={2}>
                <Space wrap>
                  {report.affectedItems.map((item) => (
                    <Tag key={item}>{item}</Tag>
                  ))}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="初始责任">
                {partyLabel[report.initialResponsibility] || report.initialResponsibility}
              </Descriptions.Item>
              <Descriptions.Item label="最终责任">
                {report.finalResponsibility
                  ? partyLabel[report.finalResponsibility] || report.finalResponsibility
                  : '未确定'}
              </Descriptions.Item>
              <Descriptions.Item label="报告人">{report.reportedBy || '-'}</Descriptions.Item>
              <Descriptions.Item label="报告时间">
                {dayjs(report.reportedAt).format('YYYY-MM-DD HH:mm')}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        ))
      ) : (
        <Card>
          <p style={{ color: '#999' }}>暂无损坏报告</p>
        </Card>
      )}
    </div>
  );

  const timelineTab = (
    <Card title="时间线">
      {record.timePoints && record.timePoints.length > 0 ? (
        <Timeline
          items={record.timePoints
            .slice()
            .sort((a, b) => new Date(b.pointTime).getTime() - new Date(a.pointTime).getTime())
            .map((tp) => ({
              children: (
                <div>
                  <div style={{ fontWeight: 500 }}>
                    {tp.description || tp.pointType}
                  </div>
                  <div style={{ fontSize: 12, color: '#999' }}>
                    {tp.operatorName && <span>操作人: {tp.operatorName} | </span>}
                    {dayjs(tp.pointTime).format('YYYY-MM-DD HH:mm:ss')}
                  </div>
                </div>
              ),
            }))}
        />
      ) : (
        <p style={{ color: '#999' }}>暂无时间线记录</p>
      )}
    </Card>
  );

  const reviewTab = (
    <div>
      {record.reviews && record.reviews.length > 0 ? (
        record.reviews.map((review: ReviewRecord) => (
          <Card
            key={review.id}
            title={`复盘 - ${review.reviewer}`}
            style={{ marginBottom: 16 }}
            extra={dayjs(review.reviewedAt).format('YYYY-MM-DD HH:mm')}
          >
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="发现">{review.findings}</Descriptions.Item>
              <Descriptions.Item label="采取措施">
                {review.actionsTaken || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="结论">{review.conclusion}</Descriptions.Item>
              <Descriptions.Item label="需要跟进">
                <Tag color={review.followUpRequired ? 'red' : 'green'}>
                  {review.followUpRequired ? '是' : '否'}
                </Tag>
              </Descriptions.Item>
              {review.followUpNote && (
                <Descriptions.Item label="跟进说明">{review.followUpNote}</Descriptions.Item>
              )}
            </Descriptions>
          </Card>
        ))
      ) : (
        <Card>
          <p style={{ color: '#999' }}>暂无复盘记录</p>
        </Card>
      )}

      <Button
        type="primary"
        onClick={() => setReviewModalOpen(true)}
        style={{ marginTop: 16 }}
      >
        完成复盘
      </Button>
    </div>
  );

  const canConfirm =
    record.status === VerificationStatus.Pending ||
    record.status === VerificationStatus.Assigned ||
    record.status === VerificationStatus.InProgress;
  const canSupplement =
    record.status === VerificationStatus.Confirmed ||
    record.status === VerificationStatus.Supplemented;
  const canClose = record.status !== VerificationStatus.Closed && record.status !== VerificationStatus.Cancelled;

  return (
    <div style={{ padding: 24 }}>
      <Breadcrumb
        items={[
          { title: <a onClick={() => navigate('/records')}>核验记录</a> },
          { title: record.recordNo },
        ]}
        style={{ marginBottom: 16 }}
      />

      <div style={{ marginBottom: 16 }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/records')}
          style={{ marginRight: 12 }}
        >
          返回
        </Button>
        {canConfirm && (
          <Button
            type="primary"
            icon={<CheckCircleOutlined />}
            loading={confirmLoading}
            onClick={handleConfirm}
            style={{ marginRight: 8 }}
          >
            确认
          </Button>
        )}
        {canSupplement && (
          <Button
            icon={<UploadOutlined />}
            onClick={() => setSupplementModalOpen(true)}
            style={{ marginRight: 8 }}
          >
            补充
          </Button>
        )}
        {canClose && (
          <Button
            danger
            icon={<CloseCircleOutlined />}
            onClick={() => setCloseModalOpen(true)}
            style={{ marginRight: 8 }}
          >
            关闭
          </Button>
        )}
        <Button
          icon={<WarningOutlined />}
          onClick={() => setDamageModalOpen(true)}
        >
          报告损坏
        </Button>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Steps
          current={stageIndex}
          items={[
            { title: '录入' },
            { title: '动作' },
            { title: '复盘' },
          ]}
        />
      </Card>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          { key: 'overview', label: '概览', children: overviewTab },
          { key: 'photos', label: '照片附件', children: photoTab },
          { key: 'damage', label: '损坏情况', children: damageTab },
          { key: 'timeline', label: '时间线', children: timelineTab },
          { key: 'review', label: '复盘', children: reviewTab },
        ]}
      />

      <Modal
        title="补充资料"
        open={supplementModalOpen}
        onOk={handleSupplement}
        onCancel={() => setSupplementModalOpen(false)}
      >
        <Form form={supplementForm} layout="vertical">
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="files" label="上传文件">
            <Upload beforeUpload={() => false} multiple>
              <Button icon={<UploadOutlined />}>选择文件</Button>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="关闭记录"
        open={closeModalOpen}
        onOk={handleClose}
        onCancel={() => setCloseModalOpen(false)}
      >
        <Form form={closeForm} layout="vertical">
          <Form.Item name="closingRemark" label="关闭备注" rules={[{ required: true, message: '请填写关闭备注' }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="报告损坏"
        open={damageModalOpen}
        onOk={handleReportDamage}
        onCancel={() => setDamageModalOpen(false)}
        width={600}
      >
        <Form form={damageForm} layout="vertical">
          <Form.Item name="damageRange" label="影响范围" rules={[{ required: true }]}>
            <Select
              options={Object.entries(rangeLabel).map(([k, v]) => ({ label: v, value: k }))}
            />
          </Form.Item>
          <Form.Item name="severity" label="严重程度" rules={[{ required: true }]}>
            <Select
              options={Object.entries(severityLabel).map(([k, v]) => ({ label: v, value: k }))}
            />
          </Form.Item>
          <Form.Item name="damageDescription" label="损坏描述" rules={[{ required: true }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="initialResponsibility" label="责任归属" rules={[{ required: true }]}>
            <Select
              options={Object.entries(partyLabel).map(([k, v]) => ({ label: v, value: k }))}
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="完成复盘"
        open={reviewModalOpen}
        onOk={handleCompleteReview}
        onCancel={() => setReviewModalOpen(false)}
        width={600}
      >
        <Form form={reviewForm} layout="vertical">
          <Form.Item name="reviewer" label="复盘人" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="findings" label="发现" rules={[{ required: true }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="actionsTaken" label="采取措施">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="conclusion" label="结论" rules={[{ required: true }]}>
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="followUpRequired" label="需要跟进" rules={[{ required: true }]}>
            <Select
              options={[
                { label: '是', value: true },
                { label: '否', value: false },
              ]}
            />
          </Form.Item>
          <Form.Item name="followUpNote" label="跟进说明">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="调整责任"
        open={adjustModalOpen}
        onOk={handleAdjustResponsibility}
        onCancel={() => setAdjustModalOpen(false)}
      >
        <Form form={adjustForm} layout="vertical">
          <Form.Item name="finalResponsibility" label="最终责任方" rules={[{ required: true }]}>
            <Select
              options={Object.entries(partyLabel).map(([k, v]) => ({ label: v, value: k }))}
            />
          </Form.Item>
          <Form.Item name="adjustmentReason" label="调整原因">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
