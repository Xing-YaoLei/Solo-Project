import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Tag, Table, Button, Upload, Space, Timeline, Form, Select, Input, Modal, message, Popconfirm, List, Divider, Rate } from 'antd';
import { UploadOutlined, DownloadOutlined, DeleteOutlined, PlusOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useHearingStore } from '../stores/hearingStore';
import { participantService } from '../services/participantService';
import { attachmentService } from '../services/attachmentService';
import { conflictService } from '../services/conflictService';
import { reminderService } from '../services/reminderService';
import { HearingStatus, HearingStatusLabel, AttendanceStatus, AttendanceStatusLabel, AttachmentType, AttachmentTypeLabel, ConflictType, ConflictTypeLabel, ConflictResolutionStatus, ConflictResolutionStatusLabel, ReminderType } from '../types';
import type { Participant, Attachment, StatusLog, ConflictOfInterest, Reminder } from '../types';
import { getStatusColor, formatDateTime, formatTime, downloadBlob } from '../utils/helpers';
import { canEditHearing, canUpdateAttendance, canManageConflicts, canManageReminders } from '../utils/permissions';
import { useAuthStore } from '../stores/authStore';

export default function HearingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentHearing, fetchHearing, changeStatus } = useHearingStore();
  const { user } = useAuthStore();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [conflicts, setConflicts] = useState<ConflictOfInterest[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [addParticipantOpen, setAddParticipantOpen] = useState(false);
  const [addConflictOpen, setAddConflictOpen] = useState(false);
  const [addReminderOpen, setAddReminderOpen] = useState(false);
  const [statusForm] = Form.useForm();
  const [participantForm] = Form.useForm();
  const [conflictForm] = Form.useForm();
  const [reminderForm] = Form.useForm();

  useEffect(() => {
    if (id) {
      fetchHearing(id);
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    if (!id) return;
    const [p, a, c, r] = await Promise.all([
      participantService.getByHearing(id),
      attachmentService.getByHearing(id),
      conflictService.getByHearing(id),
      reminderService.getByHearing(id),
    ]);
    setParticipants(p); setAttachments(a); setConflicts(c); setReminders(r);
  };

  const handleUpload = async (file: File) => {
    if (!id) return false;
    try {
      await attachmentService.upload(id, file, AttachmentType.Other);
      message.success('上传成功');
      setAttachments(await attachmentService.getByHearing(id));
    } catch { message.error('上传失败'); }
    return false;
  };

  const handleDownload = async (attachmentId: string, fileName: string) => {
    try {
      const response = await attachmentService.download(attachmentId);
      downloadBlob(response.data, fileName);
    } catch { message.error('下载失败'); }
  };

  const handleStatusChange = async (values: any) => {
    if (!id) return;
    try {
      await changeStatus(id, values.status, values.reason, values.relatedAttachmentId);
      message.success('状态已更新');
      setStatusModalOpen(false);
      statusForm.resetFields();
      fetchHearing(id);
    } catch { message.error('操作失败'); }
  };

  const handleAddParticipant = async (values: any) => {
    if (!id) return;
    try {
      await participantService.add(id, values);
      message.success('参与人已添加');
      setAddParticipantOpen(false);
      participantForm.resetFields();
      setParticipants(await participantService.getByHearing(id));
    } catch { message.error('添加失败'); }
  };

  const handleUpdateAttendance = async (participantId: string, status: AttendanceStatus) => {
    try {
      await participantService.updateAttendance(participantId, { attendanceStatus: status });
      message.success('到场状态已更新');
      setParticipants(await participantService.getByHearing(id!));
    } catch { message.error('更新失败'); }
  };

  const handleAddConflict = async (values: any) => {
    try {
      await conflictService.create({ hearingId: id!, ...values });
      message.success('利益冲突已记录');
      setAddConflictOpen(false);
      conflictForm.resetFields();
      fetchHearing(id!);
      setConflicts(await conflictService.getByHearing(id!));
    } catch { message.error('添加失败'); }
  };

  const handleAddReminder = async (values: any) => {
    try {
      await reminderService.create({ hearingId: id!, ...values, targetUserId: user!.id });
      message.success('提醒已设置');
      setAddReminderOpen(false);
      reminderForm.resetFields();
      setReminders(await reminderService.getByHearing(id!));
    } catch { message.error('设置失败'); }
  };

  if (!currentHearing) return <Card loading />;

  return (
    <div>
      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/hearings')} style={{ marginBottom: 16 }}>返回列表</Button>
      <Card title={<Space>{currentHearing.caseNumber} <Tag color={getStatusColor(currentHearing.status)}>{HearingStatusLabel[currentHearing.status]}</Tag>{currentHearing.isConflictFlagged && <Tag color="red">利益冲突</Tag>}</Space>}
        extra={canEditHearing(user!.role) && <Button type="primary" onClick={() => setStatusModalOpen(true)}>变更状态</Button>}>
        <Descriptions column={3}>
          <Descriptions.Item label="案名">{currentHearing.caseName}</Descriptions.Item>
          <Descriptions.Item label="法院">{currentHearing.courtName}</Descriptions.Item>
          <Descriptions.Item label="法庭">{currentHearing.courtRoom}</Descriptions.Item>
          <Descriptions.Item label="开庭日期">{currentHearing.hearingDate}</Descriptions.Item>
          <Descriptions.Item label="时段">{formatTime(currentHearing.startTime)} - {formatTime(currentHearing.endTime)}</Descriptions.Item>
          <Descriptions.Item label="备注">{currentHearing.notes || '-'}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="参与人" style={{ marginTop: 16 }} extra={canUpdateAttendance(user!.role) && <Button icon={<PlusOutlined />} onClick={() => setAddParticipantOpen(true)}>添加参与人</Button>}>
        <Table rowKey="id" dataSource={participants} pagination={false} size="small"
          columns={[
            { title: '姓名', dataIndex: 'fullName' },
            { title: '角色', dataIndex: 'role' },
            { title: '到场状态', dataIndex: 'attendanceStatus', render: (s: AttendanceStatus) => <Tag color={s === AttendanceStatus.Present ? 'green' : s === AttendanceStatus.Absent ? 'red' : 'default'}>{AttendanceStatusLabel[s]}</Tag> },
            ...(canUpdateAttendance(user!.role) ? [{ title: '操作', render: (_: any, r: Participant) => (
              <Select size="small" value={r.attendanceStatus} onChange={(v) => handleUpdateAttendance(r.id, v)} style={{ width: 100 }}
                options={Object.entries(AttendanceStatusLabel).map(([k, v]) => ({ value: Number(k), label: v }))} />
            )}] : []),
          ]}
        />
      </Card>

      <Card title="附件" style={{ marginTop: 16 }} extra={
        <Upload beforeUpload={handleUpload} showUploadList={false}><Button icon={<UploadOutlined />}>上传附件</Button></Upload>
      }>
        <List dataSource={attachments} renderItem={(a) => (
          <List.Item actions={[
            <Button size="small" icon={<DownloadOutlined />} onClick={() => handleDownload(a.id, a.fileName)}>下载</Button>,
            <Popconfirm title="确认删除？" onConfirm={async () => { await attachmentService.delete(a.id); setAttachments(await attachmentService.getByHearing(id!)); message.success('已删除'); }}><Button size="small" danger icon={<DeleteOutlined />} /></Popconfirm>,
          ]}>
            <List.Item.Meta title={<Space>{a.fileName} <Tag>{AttachmentTypeLabel[a.attachmentType]}</Tag></Space>} description={`${(a.fileSize / 1024).toFixed(1)} KB | ${formatDateTime(a.createdAt)}`} />
          </List.Item>
        )}
        />
      </Card>

      {conflicts.length > 0 && (
        <Card title="利益冲突" style={{ marginTop: 16 }}>
          {conflicts.map(c => {
            const relatedAtt = attachments.find(a => a.id === c.relatedAttachmentId);
            return (
              <Card key={c.id} size="small" style={{ marginBottom: 8 }} type="inner"
                title={<Space><Tag color="red">{ConflictTypeLabel[c.conflictType]}</Tag><Tag>{ConflictResolutionStatusLabel[c.resolutionStatus]}</Tag></Space>}>
                <p>{c.description}</p>
                {c.relatedAttachmentId && relatedAtt && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: 12, color: '#1890ff' }}>📎 原始材料:</span>
                    <a onClick={() => handleDownload(relatedAtt.id, relatedAtt.fileName)} style={{ fontSize: 12 }}>
                      {relatedAtt.fileName}
                    </a>
                    <Tag style={{ fontSize: 11 }}>{AttachmentTypeLabel[relatedAtt.attachmentType]}</Tag>
                  </div>
                )}
                {c.resolution && <p style={{ color: 'green' }}>解决方案: {c.resolution}</p>}
                <p style={{ fontSize: 12, color: '#999', margin: 0 }}>检测时间: {formatDateTime(c.detectedAt)}</p>
              </Card>
            );
          })}
        </Card>
      )}
      {canManageConflicts(user!.role) && (
        <Button icon={<PlusOutlined />} onClick={() => setAddConflictOpen(true)} style={{ marginTop: 8 }}>报告利益冲突</Button>
      )}

      <Card title="提醒" style={{ marginTop: 16 }} extra={canManageReminders(user!.role) && <Button icon={<PlusOutlined />} onClick={() => setAddReminderOpen(true)}>添加提醒</Button>}>
        <List dataSource={reminders} renderItem={(r) => (
          <List.Item><Space>{r.message || `提醒`} | {formatDateTime(r.remindAt)} | <Tag>{r.status === 0 ? '待发送' : '已发送'}</Tag></Space></List.Item>
        )}
        />
      </Card>

      <Card title="状态变更记录" style={{ marginTop: 16 }}>
        <Timeline items={(currentHearing.statusLogs || []).map((log: StatusLog) => {
          const relatedAtt = attachments.find(a => a.id === log.relatedAttachmentId);
          return {
            children: <Space direction="vertical" size={2} style={{ width: '100%' }}>
              <span>{HearingStatusLabel[log.fromStatus]} → <Tag color={getStatusColor(log.toStatus)}>{HearingStatusLabel[log.toStatus]}</Tag></span>
              <span style={{ fontSize: 12, color: '#999' }}>{formatDateTime(log.createdAt)} {log.reason && `| 原因: ${log.reason}`}</span>
              {log.relatedAttachmentId && relatedAtt && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                  <span style={{ fontSize: 12, color: '#1890ff' }}>📎 关联原始材料:</span>
                  <a onClick={() => handleDownload(relatedAtt.id, relatedAtt.fileName)} style={{ fontSize: 12 }}>
                    {relatedAtt.fileName}
                  </a>
                  <Tag style={{ fontSize: 11 }}>{AttachmentTypeLabel[relatedAtt.attachmentType]}</Tag>
                </div>
              )}
              {log.relatedAttachmentId && !relatedAtt && (
                <span style={{ fontSize: 12, color: '#999' }}>📎 关联附件ID: {log.relatedAttachmentId}</span>
              )}
            </Space>,
          };
        })} />
      </Card>

      <Modal title="变更状态" open={statusModalOpen} onCancel={() => setStatusModalOpen(false)} onOk={() => statusForm.submit()}>
        <Form form={statusForm} onFinish={handleStatusChange}>
          <Form.Item name="status" label="新状态" rules={[{ required: true }]}><Select options={Object.entries(HearingStatusLabel).map(([k, v]) => ({ value: Number(k), label: v }))} /></Form.Item>
          <Form.Item name="reason" label="原因"><Input.TextArea rows={3} placeholder="请说明状态变更的原因" /></Form.Item>
          <Form.Item name="relatedAttachmentId" label="关联原始材料">
            <Select
              allowClear
              placeholder="选择关联的附件材料"
              options={attachments.map(a => ({ value: a.id, label: `${a.fileName} (${AttachmentTypeLabel[a.attachmentType]})` }))}
            />
          </Form.Item>
        </Form>
      </Modal>
      <Modal title="添加参与人" open={addParticipantOpen} onCancel={() => setAddParticipantOpen(false)} onOk={() => participantForm.submit()}>
        <Form form={participantForm} onFinish={handleAddParticipant}>
          <Form.Item name="userId" label="用户ID" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="role" label="角色" rules={[{ required: true }]}><Input placeholder="如：原告律师、被告律师、法官" /></Form.Item>
        </Form>
      </Modal>
      <Modal title="报告利益冲突" open={addConflictOpen} onCancel={() => setAddConflictOpen(false)} onOk={() => conflictForm.submit()}>
        <Form form={conflictForm} onFinish={handleAddConflict}>
          <Form.Item name="conflictType" label="冲突类型" rules={[{ required: true }]}><Select options={Object.entries(ConflictTypeLabel).map(([k, v]) => ({ value: Number(k), label: v }))} /></Form.Item>
          <Form.Item name="description" label="冲突描述" rules={[{ required: true }]}><Input.TextArea rows={4} placeholder="请详细描述利益冲突情况" /></Form.Item>
          <Form.Item name="relatedAttachmentId" label="关联原始材料">
            <Select
              allowClear
              placeholder="选择关联的证据材料"
              options={attachments.map(a => ({ value: a.id, label: `${a.fileName} (${AttachmentTypeLabel[a.attachmentType]})` }))}
            />
          </Form.Item>
        </Form>
      </Modal>
      <Modal title="添加提醒" open={addReminderOpen} onCancel={() => setAddReminderOpen(false)} onOk={() => reminderForm.submit()}>
        <Form form={reminderForm} onFinish={handleAddReminder}>
          <Form.Item name="reminderType" label="提醒类型" rules={[{ required: true }]}><Select options={[{ value: ReminderType.OneDayBefore, label: '提前一天' }, { value: ReminderType.ThreeHoursBefore, label: '提前三小时' }, { value: ReminderType.OneHourBefore, label: '提前一小时' }, { value: ReminderType.Custom, label: '自定义' }]} /></Form.Item>
          <Form.Item name="remindAt" label="提醒时间" rules={[{ required: true }]}><Input type="datetime-local" /></Form.Item>
          <Form.Item name="message" label="提醒内容"><Input.TextArea rows={2} /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
