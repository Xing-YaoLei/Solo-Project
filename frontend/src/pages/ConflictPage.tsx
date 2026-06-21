import { useState, useEffect } from 'react';
import { Card, Table, Tag, Button, Modal, Form, Input, Select, Space, Tabs, message, Descriptions } from 'antd';
import { useNavigate } from 'react-router-dom';
import { conflictService } from '../services/conflictService';
import { attachmentService } from '../services/attachmentService';
import type { ConflictOfInterest } from '../types';
import { ConflictType, ConflictTypeLabel, ConflictResolutionStatus, ConflictResolutionStatusLabel, AttachmentType } from '../types';
import { formatDateTime } from '../utils/helpers';
import { Upload } from 'antd';
import { UploadOutlined } from '@ant-design/icons';

export default function ConflictPage() {
  const [conflicts, setConflicts] = useState<ConflictOfInterest[]>([]);
  const [activeTab, setActiveTab] = useState('active');
  const [resolveModalOpen, setResolveModalOpen] = useState(false);
  const [selectedConflict, setSelectedConflict] = useState<ConflictOfInterest | null>(null);
  const [resolveForm] = Form.useForm();
  const navigate = useNavigate();

  useEffect(() => { loadConflicts(); }, []);

  const loadConflicts = async () => {
    const data = await conflictService.getActive();
    setConflicts(data);
  };

  const handleResolve = async (values: any) => {
    if (!selectedConflict) return;
    try {
      await conflictService.resolve(selectedConflict.id, values);
      message.success('冲突已处理');
      setResolveModalOpen(false);
      resolveForm.resetFields();
      loadConflicts();
    } catch { message.error('操作失败'); }
  };

  const activeConflicts = conflicts.filter(c => c.resolutionStatus !== ConflictResolutionStatus.Resolved && c.resolutionStatus !== ConflictResolutionStatus.Waived);
  const resolvedConflicts = conflicts.filter(c => c.resolutionStatus === ConflictResolutionStatus.Resolved || c.resolutionStatus === ConflictResolutionStatus.Waived);
  const displayConflicts = activeTab === 'active' ? activeConflicts : resolvedConflicts;

  const columns = [
    { title: '关联案号', key: 'hearingId', render: (_: any, r: ConflictOfInterest) => <a onClick={() => navigate(`/hearings/${r.hearingId}`)}>查看排程</a> },
    { title: '冲突类型', dataIndex: 'conflictType', render: (t: ConflictType) => <Tag color="red">{ConflictTypeLabel[t]}</Tag> },
    { title: '描述', dataIndex: 'description', ellipsis: true },
    { title: '检测时间', dataIndex: 'detectedAt', render: (d: string) => formatDateTime(d) },
    { title: '解决状态', dataIndex: 'resolutionStatus', render: (s: ConflictResolutionStatus) => <Tag color={s === ConflictResolutionStatus.Resolved ? 'green' : s === ConflictResolutionStatus.Escalated ? 'red' : 'orange'}>{ConflictResolutionStatusLabel[s]}</Tag> },
    { title: '操作', key: 'actions', render: (_: any, r: ConflictOfInterest) => (
      <Space>
        <Button size="small" onClick={() => { setSelectedConflict(r); setResolveModalOpen(true); }}>处理</Button>
        <Button size="small" onClick={() => navigate(`/hearings/${r.hearingId}`)}>查看排程</Button>
      </Space>
    )},
  ];

  return (
    <Card title="利益冲突管理">
      <Tabs activeKey={activeTab} onChange={setActiveTab} items={[
        { key: 'active', label: `活跃冲突 (${activeConflicts.length})` },
        { key: 'resolved', label: `已解决 (${resolvedConflicts.length})` },
      ]} />
      <Table rowKey="id" dataSource={displayConflicts} columns={columns} expandable={{
        expandedRowRender: (r: ConflictOfInterest) => (
          <Descriptions column={2} size="small">
            <Descriptions.Item label="检测人">{r.detectedBy}</Descriptions.Item>
            <Descriptions.Item label="解决状态">{ConflictResolutionStatusLabel[r.resolutionStatus]}</Descriptions.Item>
            {r.resolution && <Descriptions.Item label="解决方案" span={2}>{r.resolution}</Descriptions.Item>}
            {r.resolvedBy && <Descriptions.Item label="解决人">{r.resolvedBy}</Descriptions.Item>}
            {r.resolvedAt && <Descriptions.Item label="解决时间">{formatDateTime(r.resolvedAt)}</Descriptions.Item>}
          </Descriptions>
        ),
      }} />
      <Modal title="处理利益冲突" open={resolveModalOpen} onCancel={() => setResolveModalOpen(false)} onOk={() => resolveForm.submit()} width={600}>
        {selectedConflict && (
          <div style={{ marginBottom: 16, padding: 12, background: '#fff2f0', borderRadius: 8 }}>
            <Space><Tag color="red">{ConflictTypeLabel[selectedConflict.conflictType]}</Tag>{selectedConflict.description}</Space>
          </div>
        )}
        <Form form={resolveForm} onFinish={handleResolve}>
          <Form.Item name="resolutionStatus" label="处理结果" rules={[{ required: true }]}>
            <Select options={[
              { value: ConflictResolutionStatus.UnderReview, label: '审核中' },
              { value: ConflictResolutionStatus.Resolved, label: '已解决' },
              { value: ConflictResolutionStatus.Escalated, label: '升级处理' },
              { value: ConflictResolutionStatus.Waived, label: '豁免' },
            ]} />
          </Form.Item>
          <Form.Item name="resolution" label="解决方案" rules={[{ required: true }]}>
            <Input.TextArea rows={4} />
          </Form.Item>
          <Form.Item name="relatedAttachmentId" label="关联附件ID">
            <Input placeholder="可选：关联已有附件的ID以追溯到原始材料" />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
