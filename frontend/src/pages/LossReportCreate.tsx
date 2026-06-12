import { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  Select,
  DatePicker,
  Button,
  InputNumber,
  message,
  Row,
  Col,
  Space,
  Alert,
} from 'antd';
import { ArrowLeftOutlined, SaveOutlined, SendOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { lossReportAPI, storeAPI, authAPI } from '@/api';
import { LossCategoryMap, type LossCategory } from '@/types';
import { useAuthStore } from '@/store/auth';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Option } = Select;

function LossReportCreate() {
  const navigate = useNavigate();
  const search = useSearch({ strict: false });
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [form] = Form.useForm();
  const [showAlert, setShowAlert] = useState(true);

  const editId = (search as any).edit_id ? Number((search as any).edit_id) : null;

  const { data: stores } = useQuery({
    queryKey: ['stores'],
    queryFn: () => storeAPI.getStores().then((res) => res.data),
  });

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: () => authAPI.getCurrentUser().then(() => []),
    enabled: false,
  });

  const { data: editData } = useQuery({
    queryKey: ['editReport', editId],
    queryFn: () => lossReportAPI.getLossReport(editId!).then((res) => res.data),
    enabled: !!editId,
  });

  useEffect(() => {
    if (editData) {
      form.setFieldsValue({
        ...editData,
        loss_date: dayjs(editData.loss_date),
      });
    }
  }, [editData, form]);

  const createMutation = useMutation({
    mutationFn: lossReportAPI.createLossReport,
    onSuccess: () => {
      message.success('报损单创建成功');
      queryClient.invalidateQueries({ queryKey: ['lossReports'] });
      navigate({ to: '/loss-reports' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => lossReportAPI.updateLossReport(editId!, data),
    onSuccess: () => {
      message.success('报损单更新成功');
      queryClient.invalidateQueries({ queryKey: ['lossReports'] });
      navigate({ to: '/loss-reports' });
    },
  });

  const handleSubmit = async (values: any, submitForReview: boolean) => {
    const data = {
      ...values,
      loss_date: values.loss_date.format('YYYY-MM-DD HH:mm:ss'),
      store_id: values.store_id || user?.store_id,
    };

    if (editId) {
      await updateMutation.mutateAsync(data);
    } else {
      const result = await createMutation.mutateAsync(data);
      if (submitForReview && result.data.id) {
        await lossReportAPI.submitForReview(result.data.id);
        message.success('报损单创建并提交成功');
        navigate({ to: '/loss-reports' });
        return;
      }
    }
  };

  const categoryOptions = Object.entries(LossCategoryMap).map(([key, label]) => ({
    value: key,
    label,
  }));

  const availableStaff = stores
    ?.find((s) => s.id === (form.getFieldValue('store_id') || user?.store_id))
    ?.code
    ? []
    : [];

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <Card size="small" className="shadow-sm">
        <div className="flex items-center justify-between">
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate({ to: '/loss-reports' })}>
              返回列表
            </Button>
            <h2 className="text-xl font-bold">{editId ? '编辑报损单' : '新建报损单'}</h2>
          </Space>
        </div>
      </Card>

      {showAlert && (
        <Alert
          message="填报流程"
          description={
            <div>
              <p>1. 先填写报损信息并保存（草稿状态）</p>
              <p>2. 提交后进入复核流程，复核人员先填写复核意见</p>
              <p>3. 复核时核对责任门店和成本金额</p>
              <p>4. 复核通过后可提交审批，审批完成后流程结束</p>
            </div>
          }
          type="info"
          showIcon
          icon={<InfoCircleOutlined />}
          closable
          onClose={() => setShowAlert(false)}
        />
      )}

      <Card className="shadow-sm">
        <Form
          form={form}
          layout="vertical"
          onFinish={(values) => handleSubmit(values, false)}
          initialValues={{
            store_id: user?.store_id,
            loss_date: dayjs(),
            sale_amount: 0,
          }}
        >
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="title"
                label="报损标题"
                rules={[{ required: true, message: '请输入报损标题' }]}
              >
                <Input placeholder="例如：2024年1月咖啡豆过期报损" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="category"
                label="报损类别"
                rules={[{ required: true, message: '请选择报损类别' }]}
              >
                <Select placeholder="请选择报损类别">
                  {categoryOptions.map((opt) => (
                    <Option key={opt.value} value={opt.value}>
                      {opt.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="store_id"
                label="责任门店"
                rules={[{ required: true, message: '请选择责任门店' }]}
              >
                <Select
                  placeholder="请选择责任门店"
                  disabled={user?.role === 'staff'}
                >
                  {stores?.map((store) => (
                    <Option key={store.id} value={store.id}>
                      {store.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="responsible_staff_id"
                label="责任人"
              >
                <Select placeholder="请选择责任人" allowClear>
                  <Option value={1}>李店员 (南京东路店)</Option>
                  <Option value={2}>王店员 (人民广场店)</Option>
                  <Option value={3}>赵店员 (陆家嘴店)</Option>
                  <Option value={4}>陈店员 (西湖店)</Option>
                  <Option value={5}>刘店员 (观前街店)</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="loss_date"
                label="报损日期"
                rules={[{ required: true, message: '请选择报损日期' }]}
              >
                <DatePicker showTime style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="cost_amount"
                label="成本金额 (元)"
                rules={[
                  { required: true, message: '请输入成本金额' },
                  { type: 'number', min: 0.01, message: '金额必须大于0' },
                ]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  step={0.01}
                  precision={2}
                  placeholder="请输入成本金额"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={8}>
              <Form.Item
                name="quantity"
                label="报损数量"
                rules={[
                  { required: true, message: '请输入报损数量' },
                  { type: 'number', min: 0.01, message: '数量必须大于0' },
                ]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  step={0.01}
                  precision={2}
                  placeholder="请输入数量"
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item
                name="unit"
                label="计量单位"
                rules={[{ required: true, message: '请输入计量单位' }]}
              >
                <Input placeholder="例如：kg、个、包、杯" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item
                name="sale_amount"
                label="销售金额 (元)"
                rules={[{ type: 'number', min: 0, message: '金额不能为负' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  step={0.01}
                  precision={2}
                  placeholder="请输入销售金额"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="报损说明"
            rules={[{ required: true, message: '请输入报损说明' }]}
          >
            <TextArea
              rows={4}
              placeholder="请详细说明报损原因、情况、涉及产品等..."
              showCount
              maxLength={500}
            />
          </Form.Item>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button onClick={() => navigate({ to: '/loss-reports' })}>
              取消
            </Button>
            <Button
              icon={<SaveOutlined />}
              htmlType="submit"
              loading={createMutation.isPending || updateMutation.isPending}
            >
              保存草稿
            </Button>
            <Button
              type="primary"
              icon={<SendOutlined />}
              loading={createMutation.isPending || updateMutation.isPending}
              onClick={async () => {
                try {
                  const values = await form.validateFields();
                  await handleSubmit(values, true);
                } catch (error) {
                  console.error('Validation failed:', error);
                }
              }}
            >
              保存并提交复核
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
}

export default LossReportCreate;
