import { useState, useEffect } from 'react';
import {
  Card,
  DatePicker,
  Select,
  Tag,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Upload,
  List,
  Empty,
  Descriptions,
  message,
  Divider,
  Timeline,
  Space,
  Statistic,
  Row,
  Col
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  HistoryOutlined,
  CameraOutlined,
  DeleteOutlined,
  MessageOutlined
} from '@ant-design/icons';
import type { UploadProps } from 'antd';
import dayjs from 'dayjs';
import {
  dietRecordApi,
  bodyMeasurementApi,
  coachCommentApi,
  authApi
} from '../services/api';
import { useAuthStore } from '../hooks/useAuthStore';
import type { DietRecord, BodyMeasurement, User, CoachCommentHistory } from '../types';
import { MealType } from '../types';

const { RangePicker } = DatePicker;
const { TextArea } = Input;

const mealTypeMap: Record<MealType, { label: string; color: string }> = {
  [MealType.Breakfast]: { label: '早餐', color: 'gold' },
  [MealType.Lunch]: { label: '午餐', color: 'orange' },
  [MealType.Dinner]: { label: '晚餐', color: 'geekblue' },
  [MealType.Snack]: { label: '加餐', color: 'green' }
};

const Records = () => {
  const { user, isCoach } = useAuthStore();
  const [clients, setClients] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);
  const [dietRecords, setDietRecords] = useState<DietRecord[]>([]);
  const [measurements, setMeasurements] = useState<BodyMeasurement[]>([]);
  const [loading, setLoading] = useState(false);

  const [recordModal, setRecordModal] = useState(false);
  const [measurementModal, setMeasurementModal] = useState(false);
  const [commentModal, setCommentModal] = useState(false);
  const [historyModal, setHistoryModal] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<DietRecord | null>(null);
  const [commentHistory, setCommentHistory] = useState<CoachCommentHistory[]>([]);

  const [recordForm] = Form.useForm();
  const [measurementForm] = Form.useForm();
  const [commentForm] = Form.useForm();
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);

  useEffect(() => {
    if (user) {
      if (isCoach()) {
        authApi.getClients(user.id).then((list) => {
          setClients(list);
          if (list.length > 0) setSelectedUserId(list[0].id);
        });
      } else {
        setSelectedUserId(user.id);
      }
    }
  }, [user]);

  useEffect(() => {
    if (selectedUserId) {
      loadData();
    }
  }, [selectedUserId, dateRange]);

  const loadData = async () => {
    if (!selectedUserId) return;
    setLoading(true);
    try {
      const start = dateRange?.[0]?.format('YYYY-MM-DD');
      const end = dateRange?.[1]?.format('YYYY-MM-DD');
      const [records, measures] = await Promise.all([
        dietRecordApi.list(selectedUserId, start, end),
        bodyMeasurementApi.list(selectedUserId, start, end)
      ]);
      setDietRecords(records);
      setMeasurements(measures);
    } catch {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAddRecord = async (values: any) => {
    if (!selectedUserId) return;
    try {
      await dietRecordApi.create({
        userId: selectedUserId,
        recordDate: values.recordDate.format('YYYY-MM-DD'),
        mealType: values.mealType,
        foodItems: values.foodItems,
        calories: values.calories,
        protein: values.protein,
        carbs: values.carbs,
        fat: values.fat,
        notes: values.notes,
        photoUrls: photoUrls.length > 0 ? photoUrls : undefined
      });
      message.success('饮食记录已添加');
      setRecordModal(false);
      recordForm.resetFields();
      setPhotoUrls([]);
      loadData();
    } catch {
      message.error('添加失败');
    }
  };

  const handleAddMeasurement = async (values: any) => {
    if (!selectedUserId) return;
    try {
      await bodyMeasurementApi.create({
        userId: selectedUserId,
        measureDate: values.measureDate.format('YYYY-MM-DD'),
        weight: values.weight,
        bodyFatPercentage: values.bodyFatPercentage,
        muscleMass: values.muscleMass,
        bmi: values.bmi,
        waist: values.waist,
        hip: values.hip,
        chest: values.chest,
        biceps: values.biceps,
        thigh: values.thigh,
        notes: values.notes
      });
      message.success('体测指标已添加');
      setMeasurementModal(false);
      measurementForm.resetFields();
      loadData();
    } catch {
      message.error('添加失败');
    }
  };

  const handleOpenComment = (record: DietRecord) => {
    setCurrentRecord(record);
    commentForm.setFieldsValue({ comment: record.coachComment?.comment || '' });
    setCommentModal(true);
  };

  const handleSaveComment = async (values: any) => {
    if (!currentRecord || !user) return;
    try {
      if (currentRecord.coachComment) {
        await coachCommentApi.update(currentRecord.coachComment.id, values.comment, user.id);
      } else {
        await coachCommentApi.create({
          dietRecordId: currentRecord.id,
          coachId: user.id,
          comment: values.comment
        });
      }
      message.success('点评已保存');
      setCommentModal(false);
      loadData();
    } catch {
      message.error('保存失败');
    }
  };

  const handleViewHistory = async (record: DietRecord) => {
    if (!record.coachComment) return;
    try {
      const history = await coachCommentApi.getHistory(record.coachComment.id);
      setCommentHistory(history);
      setHistoryModal(true);
    } catch {
      message.error('加载历史失败');
    }
  };

  const uploadProps: UploadProps = {
    listType: 'picture-card',
    beforeUpload: (file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoUrls((prev) => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
      return false;
    },
    onRemove: (_file, fileList) => {
      setPhotoUrls(fileList.map((f) => (f.originFileObj ? URL.createObjectURL(f.originFileObj as Blob) : f.url || '')));
    }
  };

  const groupedRecords = dietRecords.reduce((acc, record) => {
    const key = dayjs(record.recordDate).format('YYYY-MM-DD');
    if (!acc[key]) acc[key] = [];
    acc[key].push(record);
    return acc;
  }, {} as Record<string, DietRecord[]>);

  const sortedDates = Object.keys(groupedRecords).sort().reverse();

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Space wrap>
          {isCoach() && (
            <Select
              style={{ width: 180 }}
              placeholder="选择学员"
              value={selectedUserId}
              onChange={setSelectedUserId}
              options={clients.map((c) => ({ label: c.userName, value: c.id }))}
            />
          )}
          <RangePicker
            value={dateRange as any}
            onChange={(v) => setDateRange(v as any)}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setRecordModal(true)}>
            添加饮食记录
          </Button>
          <Button icon={<PlusOutlined />} onClick={() => setMeasurementModal(true)}>
            添加体测
          </Button>
        </Space>
      </Card>

      {measurements.length > 0 && (
        <Card title="体测指标" style={{ marginBottom: 16 }}>
          <Row gutter={[16, 16]}>
            {measurements.slice(0, 5).map((m) => (
              <Col xs={24} sm={12} md={8} lg={6} key={m.id}>
                <Card size="small">
                  <Descriptions column={1} size="small" title={dayjs(m.measureDate).format('YYYY-MM-DD')}>
                    <Descriptions.Item label="体重">{m.weight} kg</Descriptions.Item>
                    <Descriptions.Item label="体脂率">
                      <span style={{ color: '#f5222d', fontWeight: 600 }}>{m.bodyFatPercentage}%</span>
                    </Descriptions.Item>
                    {m.muscleMass && <Descriptions.Item label="肌肉量">{m.muscleMass} kg</Descriptions.Item>}
                    {m.bmi && <Descriptions.Item label="BMI">{m.bmi}</Descriptions.Item>}
                  </Descriptions>
                </Card>
              </Col>
            ))}
          </Row>
        </Card>
      )}

      <Card title="饮食打卡记录" loading={loading}>
        {sortedDates.length === 0 ? (
          <Empty description="暂无饮食记录" />
        ) : (
          sortedDates.map((date) => (
            <div key={date} style={{ marginBottom: 24 }}>
              <Divider orientation="left" style={{ fontWeight: 600 }}>
                📅 {date}
              </Divider>
              {groupedRecords[date]
                .sort((a, b) => a.mealType - b.mealType)
                .map((record) => (
                  <Card
                    key={record.id}
                    className="record-card"
                    size="small"
                    title={
                      <Space>
                        <Tag color={mealTypeMap[record.mealType].color} className="meal-tag">
                          {mealTypeMap[record.mealType].label}
                        </Tag>
                        <span>{dayjs(record.recordDate).format('HH:mm')}</span>
                      </Space>
                    }
                    extra={
                      <Space>
                        {isCoach() && (
                          <Button
                            size="small"
                            icon={<MessageOutlined />}
                            onClick={() => handleOpenComment(record)}
                          >
                            {record.coachComment ? '编辑点评' : '点评'}
                          </Button>
                        )}
                        {record.coachComment && (
                          <Button
                            size="small"
                            icon={<HistoryOutlined />}
                            onClick={() => handleViewHistory(record)}
                          >
                            变更历史
                          </Button>
                        )}
                      </Space>
                    }
                  >
                    <p style={{ margin: '0 0 8px' }}>
                      <strong>食物：</strong>
                      {record.foodItems}
                    </p>
                    <Space size={16} style={{ marginBottom: 8 }}>
                      {record.calories != null && <span>🔥 {record.calories} kcal</span>}
                      {record.protein != null && <span>🥩 蛋白 {record.protein}g</span>}
                      {record.carbs != null && <span>🍚 碳水 {record.carbs}g</span>}
                      {record.fat != null && <span>🥑 脂肪 {record.fat}g</span>}
                    </Space>
                    {record.notes && <p style={{ color: '#666', margin: '0 0 8px' }}>备注：{record.notes}</p>}
                    {record.photos.length > 0 && (
                      <div className="photo-grid">
                        {record.photos.map((p) => (
                          <img key={p.id} src={p.photoUrl} alt="打卡照片" />
                        ))}
                      </div>
                    )}
                    {record.coachComment && (
                      <div style={{ marginTop: 12, padding: 12, background: '#e6f4ff', borderRadius: 4 }}>
                        <p style={{ margin: '0 0 4px', fontWeight: 600, color: '#1677ff' }}>
                          💬 {record.coachComment.coachName} 教练点评
                        </p>
                        <p style={{ margin: 0 }}>{record.coachComment.comment}</p>
                        {record.coachComment.updatedAt && (
                          <p style={{ margin: '4px 0 0', fontSize: 12, color: '#999' }}>
                            更新于 {dayjs(record.coachComment.updatedAt).format('YYYY-MM-DD HH:mm')}
                          </p>
                        )}
                      </div>
                    )}
                  </Card>
                ))}
            </div>
          ))
        )}
      </Card>

      <Modal
        title="添加饮食记录"
        open={recordModal}
        onCancel={() => { setRecordModal(false); recordForm.resetFields(); setPhotoUrls([]); }}
        footer={null}
        width={600}
      >
        <Form form={recordForm} layout="vertical" onFinish={handleAddRecord}>
          <Form.Item name="recordDate" label="日期时间" rules={[{ required: true }]}>
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="mealType" label="餐次" rules={[{ required: true }]}>
            <Select options={[
              { label: '早餐', value: MealType.Breakfast },
              { label: '午餐', value: MealType.Lunch },
              { label: '晚餐', value: MealType.Dinner },
              { label: '加餐', value: MealType.Snack }
            ]} />
          </Form.Item>
          <Form.Item name="foodItems" label="食物内容" rules={[{ required: true }]}>
            <TextArea rows={3} placeholder="例如：2个鸡蛋、1杯牛奶、1片全麦面包" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item name="calories" label="热量(kcal)">
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="protein" label="蛋白(g)">
                <InputNumber style={{ width: '100%' }} min={0} step={0.1} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="carbs" label="碳水(g)">
                <InputNumber style={{ width: '100%' }} min={0} step={0.1} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="fat" label="脂肪(g)">
                <InputNumber style={{ width: '100%' }} min={0} step={0.1} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="notes" label="备注">
            <Input placeholder="选填" />
          </Form.Item>
          <Form.Item label="打卡照片">
            <Upload {...uploadProps} fileList={photoUrls.map((url, i) => ({ uid: `-${i}`, name: `photo${i}`, status: 'done', url }))}>
              <div>
                <CameraOutlined />
                <div style={{ marginTop: 4 }}>上传照片</div>
              </div>
            </Upload>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>保存</Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="添加体测指标"
        open={measurementModal}
        onCancel={() => { setMeasurementModal(false); measurementForm.resetFields(); }}
        footer={null}
        width={600}
      >
        <Form form={measurementForm} layout="vertical" onFinish={handleAddMeasurement}>
          <Form.Item name="measureDate" label="测量日期" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="weight" label="体重(kg)" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} min={0} step={0.1} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="bodyFatPercentage" label="体脂率(%)" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} min={0} max={100} step={0.1} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="muscleMass" label="肌肉量(kg)">
                <InputNumber style={{ width: '100%' }} min={0} step={0.1} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="bmi" label="BMI">
                <InputNumber style={{ width: '100%' }} min={0} step={0.1} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="waist" label="腰围(cm)">
                <InputNumber style={{ width: '100%' }} min={0} step={0.1} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="hip" label="臀围(cm)">
                <InputNumber style={{ width: '100%' }} min={0} step={0.1} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="chest" label="胸围(cm)">
                <InputNumber style={{ width: '100%' }} min={0} step={0.1} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="thigh" label="大腿围(cm)">
                <InputNumber style={{ width: '100%' }} min={0} step={0.1} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="notes" label="备注">
            <Input placeholder="选填" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>保存</Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={currentRecord?.coachComment ? '编辑教练点评' : '添加教练点评'}
        open={commentModal}
        onCancel={() => setCommentModal(false)}
        footer={null}
      >
        <Form form={commentForm} layout="vertical" onFinish={handleSaveComment}>
          <Form.Item name="comment" label="点评内容" rules={[{ required: true, message: '请输入点评内容' }]}>
            <TextArea rows={5} placeholder="请输入您的专业指导意见..." />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>保存点评</Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="点评变更历史"
        open={historyModal}
        onCancel={() => setHistoryModal(false)}
        footer={[<Button key="close" onClick={() => setHistoryModal(false)}>关闭</Button>]}
        width={600}
      >
        {commentHistory.length === 0 ? (
          <Empty />
        ) : (
          <Timeline
            items={commentHistory.map((h) => ({
              color: 'blue',
              children: (
                <div className="history-item">
                  <div style={{ color: '#666', fontSize: 12, marginBottom: 4 }}>
                    {dayjs(h.changedAt).format('YYYY-MM-DD HH:mm')} · {h.changedByName}
                  </div>
                  {h.oldValue && (
                    <div className="comment-diff" style={{ background: '#fff1f0' }}>
                      <strong style={{ color: '#ff4d4f' }}>修改前：</strong>
                      {h.oldValue}
                    </div>
                  )}
                  <div className="comment-diff" style={{ background: '#f6ffed' }}>
                    <strong style={{ color: '#52c41a' }}>修改后：</strong>
                    {h.newValue}
                  </div>
                </div>
              )
            }))}
          />
        )}
      </Modal>
    </div>
  );
};

export default Records;
