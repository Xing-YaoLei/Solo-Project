import React, { useEffect, useState } from 'react';
import {
  Card,
  Calendar,
  List,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  TimePicker,
  Button,
  Space,
  message,
  Badge,
  Row,
  Col,
} from 'antd';
import {
  CalendarOutlined,
  ClockCircleOutlined,
  UserOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { treatmentApi } from '../services/api';
import type { TreatmentCalendar } from '../types';

const { Option } = Select;
const { TextArea } = Input;

const TreatmentCalendarPage: React.FC = () => {
  const [, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [treatments, setTreatments] = useState<TreatmentCalendar[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTreatment, setEditingTreatment] = useState<TreatmentCalendar | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadTreatments();
  }, [selectedDate]);

  const loadTreatments = async () => {
    setLoading(true);
    try {
      const data = await treatmentApi.getByPatientId(
        1,
        selectedDate.startOf('month').format('YYYY-MM-DD'),
        selectedDate.endOf('month').format('YYYY-MM-DD')
      );
      setTreatments(data);
    } catch (error) {
      console.error('Failed to load treatments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getListData = (value: Dayjs) => {
    const dateStr = value.format('YYYY-MM-DD');
    const dayTreatments = treatments.filter((t) => t.treatmentDate === dateStr);
    return dayTreatments;
  };

  const dateCellRender = (value: Dayjs) => {
    const listData = getListData(value);

    return (
      <ul className="events">
        {listData.slice(0, 3).map((item) => (
          <li key={item.id}>
            <Badge
              status={
                item.statusId === 1
                  ? 'default'
                  : item.statusId === 2
                  ? 'processing'
                  : item.statusId === 3
                  ? 'success'
                  : item.statusId === 4
                  ? 'warning'
                  : 'error'
              }
              text={item.treatmentItem}
            />
          </li>
        ))}
        {listData.length > 3 && <li style={{ color: '#999' }}>+{listData.length - 3} 更多</li>}
      </ul>
    );
  };

  const handleDateSelect = (value: Dayjs) => {
    setSelectedDate(value);
  };

  const dayTreatments = getListData(selectedDate);

  const handleAdd = () => {
    setEditingTreatment(null);
    form.resetFields();
    form.setFieldsValue({
      treatmentDate: selectedDate,
    });
    setModalVisible(true);
  };

  const handleEdit = (record: TreatmentCalendar) => {
    setEditingTreatment(record);
    form.setFieldsValue({
      ...record,
      treatmentDate: dayjs(record.treatmentDate),
      startTime: record.startTime ? dayjs(record.startTime, 'HH:mm') : null,
      endTime: record.endTime ? dayjs(record.endTime, 'HH:mm') : null,
    });
    setModalVisible(true);
  };

  const handleSubmit = async (values: any) => {
    try {
      if (editingTreatment) {
        await treatmentApi.update(editingTreatment.id, {
          ...values,
          treatmentDate: values.treatmentDate?.format('YYYY-MM-DD'),
          startTime: values.startTime?.format('HH:mm'),
          endTime: values.endTime?.format('HH:mm'),
        });
        message.success('更新成功');
      } else {
        await treatmentApi.create({
          ...values,
          patientId: 1,
          billId: 1,
          treatmentDate: values.treatmentDate?.format('YYYY-MM-DD'),
          startTime: values.startTime?.format('HH:mm'),
          endTime: values.endTime?.format('HH:mm'),
        });
        message.success('创建成功');
      }
      setModalVisible(false);
      loadTreatments();
    } catch (error) {
      console.error('Submit error:', error);
      message.error('提交失败');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await treatmentApi.delete(id);
      message.success('删除成功');
      loadTreatments();
    } catch (error) {
      console.error('Delete error:', error);
      message.error('删除失败');
    }
  };

  const getStatusColor = (statusId: number) => {
    const colors: Record<number, string> = {
      1: 'blue',
      2: 'cyan',
      3: 'green',
      4: 'default',
      5: 'red',
    };
    return colors[statusId] || 'default';
  };

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0 }}>治疗日历 - {selectedDate.format('YYYY年MM月')}</h3>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新增治疗
        </Button>
      </div>

      <Row gutter={16}>
        <Col span={16}>
          <Card>
            <Calendar
              cellRender={dateCellRender as any}
              onSelect={handleDateSelect}
              value={selectedDate}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card title={`${selectedDate.format('MM月DD日')} 治疗安排`}>
            {dayTreatments.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#999', padding: '40px 0' }}>
                当日暂无治疗安排
              </div>
            ) : (
              <List
                dataSource={dayTreatments}
                renderItem={(item) => (
                  <List.Item
                    key={item.id}
                    actions={[
                      <Button
                        type="link"
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => handleEdit(item)}
                      >
                        编辑
                      </Button>,
                      <Button
                        type="link"
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleDelete(item.id)}
                      >
                        删除
                      </Button>,
                    ]}
                  >
                    <List.Item.Meta
                      avatar={<CalendarOutlined style={{ fontSize: 24, color: '#1890ff' }} />}
                      title={
                        <Space>
                          <strong>{item.treatmentItem}</strong>
                          <Tag color={getStatusColor(item.statusId)}>{item.statusName}</Tag>
                        </Space>
                      }
                      description={
                        <div>
                          <div>
                            <ClockCircleOutlined /> {item.startTime} - {item.endTime}
                          </div>
                          <div>
                            <UserOutlined /> {item.therapistName}
                          </div>
                          {item.remark && (
                            <div style={{ color: '#faad14', marginTop: 4 }}>{item.remark}</div>
                          )}
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>
      </Row>

      <Modal
        title={editingTreatment ? '编辑治疗' : '新增治疗'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        okText="确认"
        cancelText="取消"
        width={500}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="treatmentDate"
            label="治疗日期"
            rules={[{ required: true, message: '请选择日期' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item name="startTime" label="开始时间" style={{ flex: 1 }}>
              <TimePicker format="HH:mm" style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="endTime" label="结束时间" style={{ flex: 1 }}>
              <TimePicker format="HH:mm" style={{ width: '100%' }} />
            </Form.Item>
          </div>

          <Form.Item
            name="treatmentType"
            label="治疗类型"
            rules={[{ required: true, message: '请选择治疗类型' }]}
          >
            <Select placeholder="请选择治疗类型">
              <Option value="运动疗法">运动疗法</Option>
              <Option value="物理治疗">物理治疗</Option>
              <Option value="作业治疗">作业治疗</Option>
              <Option value="言语治疗">言语治疗</Option>
              <Option value="康复评定">康复评定</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="treatmentItem"
            label="治疗项目"
            rules={[{ required: true, message: '请输入治疗项目' }]}
          >
            <Input placeholder="请输入治疗项目名称" />
          </Form.Item>

          <Form.Item name="therapistId" label="治疗师">
            <Select placeholder="请选择治疗师">
              <Option value={1}>李治疗师</Option>
              <Option value={2}>王治疗师</Option>
              <Option value={3}>张治疗师</Option>
            </Select>
          </Form.Item>

          <Form.Item name="duration" label="时长(分钟)">
            <Input placeholder="请输入时长" />
          </Form.Item>

          <Form.Item name="remark" label="备注">
            <TextArea rows={3} placeholder="请输入备注" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TreatmentCalendarPage;
