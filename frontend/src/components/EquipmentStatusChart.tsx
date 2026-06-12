import React, { useEffect, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { Card, List, Tag, Space, Typography, Button, Modal, Form, Input, Select } from 'antd';
import { AlertOutlined, ToolOutlined, CheckCircleOutlined, PlusOutlined } from '@ant-design/icons';
import type { EquipmentStatusItem, OfflineEquipment, EquipmentRemark } from '../types';
import { reportsApi, remarksApi } from '../services/api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

interface EquipmentStatusChartProps {
  className?: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  normal: { label: '正常', color: 'green', icon: <CheckCircleOutlined /> },
  offline: { label: '离线/超期', color: 'red', icon: <AlertOutlined /> },
  maintenance: { label: '维修中', color: 'orange', icon: <ToolOutlined /> },
  fault: { label: '故障', color: 'volcano', icon: <AlertOutlined /> },
};

const EquipmentStatusChart: React.FC<EquipmentStatusChartProps> = ({ className }) => {
  const [statusData, setStatusData] = useState<EquipmentStatusItem[]>([]);
  const [offlineEquipments, setOfflineEquipments] = useState<OfflineEquipment[]>([]);
  const [loading, setLoading] = useState(false);
  const [remarkModalVisible, setRemarkModalVisible] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<OfflineEquipment | null>(null);
  const [remarks, setRemarks] = useState<EquipmentRemark[]>([]);
  const [remarkLoading, setRemarkLoading] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statusRes, offlineRes] = await Promise.all([
        reportsApi.getEquipmentStatus(),
        reportsApi.getOfflineEquipments(),
      ]);
      setStatusData(statusRes.data || []);
      setOfflineEquipments(offlineRes.data || []);
    } catch (error) {
      console.error('Failed to fetch equipment status:', error);
      setStatusData([
        { status: 'normal', count: 85, percentage: 70.83 },
        { status: 'offline', count: 25, percentage: 20.83 },
        { status: 'maintenance', count: 10, percentage: 8.34 },
      ]);
      setOfflineEquipments([
        {
          id: 1,
          equipment_code: 'E1001',
          equipment_name: '意式咖啡机',
          equipment_type: 'coffee_machine',
          store_id: 1,
          store_code: 'S1001',
          store_name: '北京第1店',
          city: '北京',
          status: 'offline',
          days_since_clean: 15,
          cleaning_cycle_days: 7,
        },
        {
          id: 2,
          equipment_code: 'E1002',
          equipment_name: '磨豆机',
          equipment_type: 'grinder',
          store_id: 1,
          store_code: 'S1001',
          store_name: '北京第1店',
          city: '北京',
          status: 'maintenance',
          days_since_clean: 10,
          cleaning_cycle_days: 7,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchRemarks = async (equipmentId: number) => {
    setRemarkLoading(true);
    try {
      const res = await remarksApi.listByEquipment(equipmentId);
      setRemarks(Array.isArray(res) ? res : []);
    } catch (error) {
      console.error('Failed to fetch remarks:', error);
      setRemarks([]);
    } finally {
      setRemarkLoading(false);
    }
  };

  const handleAddRemark = (equipment: OfflineEquipment) => {
    setSelectedEquipment(equipment);
    setRemarkModalVisible(true);
    form.resetFields();
    fetchRemarks(equipment.id);
  };

  const handleSubmitRemark = async (values: any) => {
    if (!selectedEquipment) return;
    try {
      await remarksApi.create({
        equipment_id: selectedEquipment.id,
        store_id: selectedEquipment.store_id,
        remark_type: values.remark_type,
        content: values.content,
        operator: values.operator,
        related_date: values.related_date
          ? dayjs(values.related_date).format('YYYY-MM-DD HH:mm:ss')
          : undefined,
      });
      setRemarkModalVisible(false);
      form.resetFields();
      fetchRemarks(selectedEquipment.id);
    } catch (error) {
      console.error('Failed to add remark:', error);
    }
  };

  const getPieOption = () => {
    const data = statusData.map((item) => ({
      value: item.count,
      name: statusConfig[item.status]?.label || item.status,
      itemStyle: {
        color:
          item.status === 'normal'
            ? '#52c41a'
            : item.status === 'offline'
            ? '#ff4d4f'
            : item.status === 'maintenance'
            ? '#faad14'
            : '#722ed1',
      },
    }));

    return {
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} ({d}%)',
      },
      legend: {
        orient: 'vertical',
        right: '5%',
        top: 'center',
      },
      series: [
        {
          name: '设备状态',
          type: 'pie',
          radius: ['45%', '70%'],
          center: ['35%', '50%'],
          avoidLabelOverlap: false,
          label: {
            show: false,
            position: 'center',
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 16,
              fontWeight: 'bold',
              formatter: '{b}\n{c}台',
            },
          },
          labelLine: {
            show: false,
          },
          data: data,
        },
      ],
    };
  };

  return (
    <Card
      className={className}
      title="设备状态分布"
      loading={loading}
      extra={<Tag color="blue">共 {statusData.reduce((sum, item) => sum + item.count, 0)} 台设备</Tag>}
    >
      <div style={{ display: 'flex', gap: 24 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <ReactECharts option={getPieOption()} style={{ height: 280 }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Title level={5} style={{ marginTop: 0 }}>
            异常设备清单
          </Title>
          <List
            size="small"
            dataSource={offlineEquipments.slice(0, 6)}
            renderItem={(item) => (
              <List.Item
                actions={[
                  <Button
                    type="link"
                    size="small"
                    icon={<PlusOutlined />}
                    onClick={() => handleAddRemark(item)}
                  >
                    备注
                  </Button>,
                ]}
              >
                <List.Item.Meta
                  title={
                    <Space>
                      <span>{item.equipment_name}</span>
                      <Tag color={statusConfig[item.status]?.color || 'default'} style={{ fontSize: 12 }}>
                        {statusConfig[item.status]?.label || item.status}
                      </Tag>
                    </Space>
                  }
                  description={
                    <Space direction="vertical" size={0}>
                      <Text type="secondary">{item.store_name}</Text>
                      <Text type="warning">超期 {item.days_since_clean} 天未清洁</Text>
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        </div>
      </div>

      <Modal
        title={
          <Space>
            <span>设备异常备注</span>
            <Tag>{selectedEquipment?.equipment_name}</Tag>
          </Space>
        }
        open={remarkModalVisible}
        onCancel={() => setRemarkModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmitRemark}>
          <Form.Item name="remark_type" label="备注类型" rules={[{ required: true, message: '请选择备注类型' }]}>
            <Select placeholder="请选择备注类型">
              <Option value="异常备注">异常备注</Option>
              <Option value="巡检备注">巡检备注</Option>
              <Option value="清洁备注">清洁备注</Option>
              <Option value="维修备注">维修备注</Option>
            </Select>
          </Form.Item>
          <Form.Item name="content" label="备注内容" rules={[{ required: true, message: '请输入备注内容' }]}>
            <Input.TextArea rows={3} placeholder="请输入备注内容，描述异常情况和处理措施..." />
          </Form.Item>
          <Form.Item name="operator" label="操作人">
            <Input placeholder="请输入操作人姓名" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              添加备注
            </Button>
          </Form.Item>
        </Form>

        <div style={{ marginTop: 16 }}>
          <Title level={5}>历史备注</Title>
          <List
            size="small"
            loading={remarkLoading}
            dataSource={remarks}
            renderItem={(remark) => (
              <List.Item>
                <List.Item.Meta
                  title={
                    <Space>
                      <Tag color="blue">{remark.remark_type}</Tag>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {remark.operator} · {dayjs(remark.created_at).format('YYYY-MM-DD HH:mm')}
                      </Text>
                    </Space>
                  }
                  description={remark.content}
                />
              </List.Item>
            )}
          />
        </div>
      </Modal>
    </Card>
  );
};

export default EquipmentStatusChart;
