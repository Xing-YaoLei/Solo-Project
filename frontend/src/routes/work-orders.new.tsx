import { useNavigate } from '@tanstack/react-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, Form, Input, Select, DatePicker, Button, message, Space } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { workOrderApi } from '../lib/api';
import type { WorkOrderCreate } from '../lib/types';

export default function WorkOrderNewPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form] = Form.useForm<WorkOrderCreate>();

  const createMutation = useMutation({
    mutationFn: (values: WorkOrderCreate) => workOrderApi.create(values),
    onSuccess: (res) => {
      message.success('工单创建成功');
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      navigate({ to: '/work-orders/$id', params: { id: String(res.data.id) } });
    },
    onError: () => message.error('工单创建失败'),
  });

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate({ to: '/work-orders' })}>
          返回
        </Button>
        <span style={{ fontSize: 18, fontWeight: 600 }}>新建工单</span>
      </Space>

      <Card bordered={false}>
        <Form
          form={form}
          layout="vertical"
          onFinish={createMutation.mutate}
          initialValues={{ priority: 'normal' }}
        >
          <Form.Item label="客户信息" style={{ marginBottom: 0 }}>
            <Input.Group compact>
              <Form.Item
                name="customer_name"
                rules={[{ required: true, message: '请输入客户姓名' }]}
                style={{ display: 'inline-block', width: '50%', paddingRight: 8 }}
              >
                <Input placeholder="客户姓名" />
              </Form.Item>
              <Form.Item
                name="customer_phone"
                rules={[{ required: true, message: '请输入联系电话' }]}
                style={{ display: 'inline-block', width: '50%' }}
              >
                <Input placeholder="联系电话" />
              </Form.Item>
            </Input.Group>
          </Form.Item>

          <Form.Item label="车辆信息" style={{ marginBottom: 0 }}>
            <Input.Group compact>
              <Form.Item
                name="vehicle_plate"
                rules={[{ required: true, message: '请输入车牌号' }]}
                style={{ display: 'inline-block', width: '33%', paddingRight: 8 }}
              >
                <Input placeholder="车牌号" />
              </Form.Item>
              <Form.Item
                name="vehicle_model"
                rules={[{ required: true, message: '请输入车型' }]}
                style={{ display: 'inline-block', width: '33%', paddingRight: 8 }}
              >
                <Input placeholder="车型" />
              </Form.Item>
              <Form.Item
                name="vehicle_vin"
                style={{ display: 'inline-block', width: '34%' }}
              >
                <Input placeholder="VIN码(选填)" />
              </Form.Item>
            </Input.Group>
          </Form.Item>

          <Form.Item
            name="complaint"
            label="维修描述"
            rules={[{ required: true, message: '请输入维修描述' }]}
          >
            <Input.TextArea rows={4} placeholder="请描述车辆问题和维修需求" />
          </Form.Item>

          <Form.Item label="分配信息" style={{ marginBottom: 0 }}>
            <Input.Group compact>
              <Form.Item name="priority" style={{ display: 'inline-block', width: '33%', paddingRight: 8 }}>
                <Select
                  placeholder="优先级"
                  options={[
                    { value: 'low', label: '低' },
                    { value: 'normal', label: '普通' },
                    { value: 'high', label: '高' },
                    { value: 'urgent', label: '紧急' },
                  ]}
                />
              </Form.Item>
              <Form.Item name="estimated_completion" style={{ display: 'inline-block', width: '33%', paddingRight: 8 }}>
                <DatePicker placeholder="预计完成日期" style={{ width: '100%' }} />
              </Form.Item>
            </Input.Group>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={createMutation.isPending}>
                创建工单
              </Button>
              <Button onClick={() => navigate({ to: '/work-orders' })}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
