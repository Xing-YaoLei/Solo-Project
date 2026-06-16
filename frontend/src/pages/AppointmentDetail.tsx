import { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Tag,
  Button,
  Space,
  Tabs,
  Descriptions,
  List,
  Avatar,
  Modal,
  Form,
  Input,
  message,
  Select,
} from 'antd';
import {
  ArrowLeftOutlined,
  UserOutlined,
  FileTextOutlined,
  PhoneOutlined,
  PictureOutlined,
  DollarOutlined,
  EditOutlined,
  CheckOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { appointmentApi, followUpApi, imageApi, billingApi } from '../services';
import {
  AppointmentStatus,
  FollowUpStatus,
  FollowUpType,
  TreatmentStatus,
} from '../types';
import type { AppointmentDetail } from '../types';
import {
  getAppointmentStatusText,
  getAppointmentStatusColor,
  getRiskLevelText,
  getRiskBadgeClass,
  formatDate,
  formatTime,
  formatCurrency,
  formatFileSize,
  getFollowUpStatusText,
  getFollowUpTypeText,
  getGenderText,
  getMemberLevelText,
  getTreatmentStatusText,
} from '../utils/format';

const AppointmentDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState<AppointmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('treatment');
  const [communicationModalVisible, setCommunicationModalVisible] = useState(false);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    if (id) {
      loadAppointmentDetail();
    }
  }, [id]);

  const loadAppointmentDetail = async () => {
    try {
      setLoading(true);
      const response = await appointmentApi.getAppointment(Number(id));
      setAppointment(response.data);
    } catch (error) {
      console.error('加载预约详情失败:', error);
      message.error('加载预约详情失败');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (status: AppointmentStatus) => {
    try {
      await appointmentApi.updateStatus(Number(id), status);
      message.success('状态更新成功');
      loadAppointmentDetail();
    } catch (error) {
      message.error('状态更新失败');
    }
  };

  const handleSaveCommunication = async (values: any) => {
    try {
      await appointmentApi.updateCommunicationNotes(Number(id), values.notes);
      message.success('沟通备注已保存');
      setCommunicationModalVisible(false);
      loadAppointmentDetail();
    } catch (error) {
      message.error('保存失败');
    }
  };

  const handleSaveReview = async (values: any) => {
    try {
      await appointmentApi.updateReviewComments(Number(id), values.comments);
      message.success('复核意见已保存');
      setReviewModalVisible(false);
      loadAppointmentDetail();
    } catch (error) {
      message.error('保存失败');
    }
  };

  if (loading) {
    return <div style={{ padding: 50, textAlign: 'center' }}>加载中...</div>;
  }

  if (!appointment) {
    return <div style={{ padding: 50, textAlign: 'center' }}>未找到预约信息</div>;
  }

  const tabItems = [
    {
      key: 'treatment',
      label: (
        <span>
          <FileTextOutlined /> 治疗计划
        </span>
      ),
      children: (
        <div>
          {appointment.treatmentPlanId ? (
            <div>
              <Descriptions
                title="治疗计划信息"
                column={2}
                style={{ marginBottom: 16 }}
              >
                <Descriptions.Item label="计划名称">
                  {appointment.treatmentPlanName}
                </Descriptions.Item>
                <Descriptions.Item label="状态">
                  <Tag color={appointment.treatmentPlanStatus === TreatmentStatus.Completed ? 'green' : 'blue'}>
                    {getTreatmentStatusText(appointment.treatmentPlanStatus || TreatmentStatus.Planned)}
                  </Tag>
                </Descriptions.Item>
              </Descriptions>

              <h4 className="section-title">治疗项目</h4>
              <List
                dataSource={appointment.planItems || []}
                renderItem={(item) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={<Avatar icon={<FileTextOutlined />} />}
                      title={
                        <span>
                          {item.sequence}. {item.itemName}
                          {item.isCompleted && (
                            <Tag color="green" style={{ marginLeft: 8 }}>
                              已完成
                            </Tag>
                          )}
                        </span>
                      }
                      description={item.description}
                    />
                    <div>
                      <div>{formatCurrency(item.price)} × {item.quantity}</div>
                      <div style={{ fontWeight: 600, color: '#1890ff' }}>
                        {formatCurrency(item.price * item.quantity)}
                      </div>
                    </div>
                  </List.Item>
                )}
              />
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
              <FileTextOutlined style={{ fontSize: 48, marginBottom: 16 }} />
              <div>暂无治疗计划</div>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'followup',
      label: (
        <span>
          <PhoneOutlined /> 随访任务
        </span>
      ),
      children: (
        <div>
          {appointment.followUpTasks && appointment.followUpTasks.length > 0 ? (
            <List
              dataSource={appointment.followUpTasks}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar icon={<PhoneOutlined />} />}
                    title={
                      <span>
                        {item.title}
                        <Tag style={{ marginLeft: 8 }}>
                          {getFollowUpTypeText(item.type)}
                        </Tag>
                        <Tag color={item.status === FollowUpStatus.Completed ? 'green' : 'orange'} style={{ marginLeft: 4 }}>
                          {getFollowUpStatusText(item.status)}
                        </Tag>
                      </span>
                    }
                    description={
                      <div>
                        <div>{item.content}</div>
                        <div style={{ marginTop: 4, color: '#999' }}>
                          计划时间: {item.scheduledDate ? formatDate(item.scheduledDate) : '-'}
                          {item.assignedTo && ` · 负责人: ${item.assignedTo}`}
                        </div>
                        {item.result && (
                          <div style={{ marginTop: 4, color: '#52c41a' }}>
                            结果: {item.result}
                          </div>
                        )}
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          ) : (
            <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
              <PhoneOutlined style={{ fontSize: 48, marginBottom: 16 }} />
              <div>暂无随访任务</div>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'images',
      label: (
        <span>
          <PictureOutlined /> 影像附件
        </span>
      ),
      children: (
        <div>
          {appointment.imageAttachments && appointment.imageAttachments.length > 0 ? (
            <Row gutter={[16, 16]}>
              {appointment.imageAttachments.map((img) => (
                <Col span={6} key={img.id}>
                  <Card
                    hoverable
                    cover={
                      <div
                        style={{
                          height: 120,
                          background: '#f5f5f5',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <PictureOutlined style={{ fontSize: 48, color: '#ccc' }} />
                      </div>
                    }
                  >
                    <Card.Meta
                      title={img.fileName}
                      description={
                        <div>
                          <div>{img.category || '未分类'}</div>
                          <div style={{ fontSize: 12, color: '#999' }}>
                            {formatFileSize(img.fileSize)}
                          </div>
                        </div>
                      }
                    />
                  </Card>
                </Col>
              ))}
            </Row>
          ) : (
            <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
              <PictureOutlined style={{ fontSize: 48, marginBottom: 16 }} />
              <div>暂无影像附件</div>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'billing',
      label: (
        <span>
          <DollarOutlined /> 收费明细
        </span>
      ),
      children: (
        <div>
          {appointment.billingRecords && appointment.billingRecords.length > 0 ? (
            <List
              dataSource={appointment.billingRecords}
              renderItem={(record) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar icon={<DollarOutlined />} />}
                    title={
                      <span>
                        {record.invoiceNo}
                        <Tag color={record.status === 2 ? 'green' : 'orange'} style={{ marginLeft: 8 }}>
                          {record.status === 2 ? '已缴费' : record.status === 1 ? '部分缴费' : '未缴费'}
                        </Tag>
                      </span>
                    }
                    description={
                      <div>
                        <div>日期: {formatDate(record.billingDate)}</div>
                        <div style={{ marginTop: 4 }}>
                          总金额: {formatCurrency(record.totalAmount)}
                        </div>
                      </div>
                    }
                  />
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: '#52c41a', fontWeight: 600 }}>
                      已付: {formatCurrency(record.paidAmount)}
                    </div>
                    <div style={{ color: record.remainingAmount > 0 ? '#f5222d' : '#52c41a' }}>
                      剩余: {formatCurrency(record.remainingAmount)}
                    </div>
                  </div>
                </List.Item>
              )}
            />
          ) : (
            <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
              <DollarOutlined style={{ fontSize: 48, marginBottom: 16 }} />
              <div>暂无收费记录</div>
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate(-1)}
        style={{ marginBottom: 16 }}
      >
        返回列表
      </Button>

      <Card style={{ marginBottom: 16 }}>
        <Row gutter={24}>
          <Col span={16}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
              <Avatar size={64} icon={<UserOutlined />} />
              <div style={{ marginLeft: 16 }}>
                <h2 style={{ margin: 0 }}>{appointment.patientName}</h2>
                <div style={{ color: '#666', marginTop: 4 }}>
                  {getGenderText(appointment.patientGender)} · {appointment.patientPhone}
                  {appointment.patientEmail && ` · ${appointment.patientEmail}`}
                </div>
                <div style={{ marginTop: 4 }}>
                  <Tag color="purple">{getMemberLevelText(appointment.memberLevel)}</Tag>
                  <span className={getRiskBadgeClass(appointment.riskLevel)}>
                    {getRiskLevelText(appointment.riskLevel)}
                  </span>
                </div>
              </div>
            </div>

            <Descriptions column={3} size="small">
              <Descriptions.Item label="预约时间">
                {formatDate(appointment.appointmentDate)} {formatTime(appointment.startTime)}-
                {formatTime(appointment.endTime)}
              </Descriptions.Item>
              <Descriptions.Item label="医生">
                {appointment.doctorName || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="椅位">
                {appointment.chairNumber || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="预约事项">
                {appointment.subject || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="状态" span={2}>
                <Tag color={getAppointmentStatusColor(appointment.status)}>
                  {getAppointmentStatusText(appointment.status)}
                </Tag>
              </Descriptions.Item>
              {appointment.description && (
                <Descriptions.Item label="备注" span={3}>
                  {appointment.description}
                </Descriptions.Item>
              )}
            </Descriptions>
          </Col>

          <Col span={8}>
            <div className="section-title">快捷操作</div>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button
                type="primary"
                icon={<CheckOutlined />}
                onClick={() => handleStatusChange(2)}
                block
              >
                开始治疗
              </Button>
              <Button
                icon={<CheckOutlined />}
                onClick={() => handleStatusChange(3)}
                block
              >
                完成预约
              </Button>
              <Button danger icon={<CloseOutlined />} onClick={() => handleStatusChange(5)} block>
                标记爽约
              </Button>
              <Button
                icon={<EditOutlined />}
                onClick={() => {
                  form.setFieldsValue({ notes: appointment.communicationNotes || '' });
                  setCommunicationModalVisible(true);
                }}
                block
              >
                沟通备注
              </Button>
              <Button
                icon={<EditOutlined />}
                onClick={() => {
                  form.setFieldsValue({ comments: appointment.reviewComments || '' });
                  setReviewModalVisible(true);
                }}
                block
              >
                复核意见
              </Button>
            </Space>

            {appointment.communicationNotes && (
              <div style={{ marginTop: 16, padding: 12, background: '#e6f7ff', borderRadius: 4 }}>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>沟通备注</div>
                <div style={{ color: '#666' }}>{appointment.communicationNotes}</div>
              </div>
            )}

            {appointment.reviewComments && (
              <div style={{ marginTop: 12, padding: 12, background: '#fff7e6', borderRadius: 4 }}>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>复核意见</div>
                <div style={{ color: '#666' }}>{appointment.reviewComments}</div>
              </div>
            )}
          </Col>
        </Row>
      </Card>

      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
      </Card>

      <Modal
        title="沟通备注"
        open={communicationModalVisible}
        onCancel={() => setCommunicationModalVisible(false)}
        footer={null}
      >
        <Form form={form} onFinish={handleSaveCommunication}>
          <Form.Item name="notes" rules={[{ required: false }]}>
            <Input.TextArea rows={6} placeholder="请输入沟通备注内容" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              保存备注
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="复核意见"
        open={reviewModalVisible}
        onCancel={() => setReviewModalVisible(false)}
        footer={null}
      >
        <Form form={form} onFinish={handleSaveReview}>
          <Form.Item name="comments" rules={[{ required: false }]}>
            <Input.TextArea rows={6} placeholder="请输入复核意见" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              保存意见
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AppointmentDetail;
