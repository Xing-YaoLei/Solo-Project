import React, { useEffect } from 'react'
import {
  Card,
  Form,
  Input,
  Select,
  DatePicker,
  Button,
  Space,
  Row,
  Col,
  Radio,
  App as AntdApp,
} from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useSearch } from '@tanstack/react-router'
import dayjs from 'dayjs'
import { rectificationApi } from '@/api/rectification'
import { samplingApi } from '@/api/sampling'
import { vendorApi } from '@/api/vendor'
import { RectificationPlanFormData } from '@/types'
import { RiskLevel } from '@/types/enums'

interface RectificationFormProps {
  id?: number
}

const RectificationForm: React.FC<RectificationFormProps> = ({ id }) => {
  const [form] = Form.useForm<any>()
  const { message } = AntdApp.useApp()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isEdit = !!id
  const search = useSearch({ strict: false }) as { samplingId?: string }

  const { data: samplingsData } = useQuery({
    queryKey: ['samplings-select-rectification'],
    queryFn: () => samplingApi.list({ skip: 0, limit: 200 }),
  })

  const { data: vendorsData } = useQuery({
    queryKey: ['vendors-select-rectification'],
    queryFn: () => vendorApi.list({ skip: 0, limit: 100 }),
  })

  const { data: record, isLoading } = useQuery({
    queryKey: ['rectification', id],
    queryFn: () => (id ? rectificationApi.get(id) : Promise.resolve(null)),
    enabled: isEdit,
  })

  useEffect(() => {
    if (record) {
      form.setFieldsValue({
        samplingId: record.samplingId,
        title: record.title,
        description: record.description,
        riskLevel: record.riskLevel,
        deadline: record.deadline ? dayjs(record.deadline) : undefined,
        responsiblePerson: record.responsiblePerson,
        vendorId: record.vendorId,
      })
    } else {
      const initialSamplingId = search.samplingId ? Number(search.samplingId) : undefined
      form.setFieldsValue({
        riskLevel: RiskLevel.MEDIUM,
        samplingId: initialSamplingId,
      })
    }
  }, [record, form, isEdit, search.samplingId])

  const createMutation = useMutation({
    mutationFn: (data: RectificationPlanFormData) => rectificationApi.create(data),
    onSuccess: () => {
      message.success('创建成功')
      queryClient.invalidateQueries({ queryKey: ['rectifications'] })
      navigate({ to: '/rectification' })
    },
    onError: () => message.error('创建失败'),
  })

  const updateMutation = useMutation({
    mutationFn: (data: Partial<RectificationPlanFormData>) => rectificationApi.update(id!, data),
    onSuccess: () => {
      message.success('更新成功')
      queryClient.invalidateQueries({ queryKey: ['rectifications'] })
      navigate({ to: '/rectification' })
    },
    onError: () => message.error('更新失败'),
  })

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      const data: RectificationPlanFormData = {
        samplingId: values.samplingId,
        title: values.title,
        description: values.description,
        riskLevel: values.riskLevel,
        deadline: values.deadline ? dayjs(values.deadline).toISOString() : undefined,
        responsiblePerson: values.responsiblePerson,
        vendorId: values.vendorId,
      }
      if (isEdit) {
        updateMutation.mutate(data)
      } else {
        createMutation.mutate(data)
      }
    } catch {
    }
  }

  const samplingOptions = (samplingsData?.items || []).map((s) => ({
    label: `${s.sampleCode} - ${s.sampleName}`,
    value: s.id,
  }))

  const vendorOptions = (vendorsData?.items || []).map((v) => ({
    label: v.name,
    value: v.id,
  }))

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center' }}>
        <Button
          icon={<ArrowLeftOutlined />}
          style={{ marginRight: 16 }}
          onClick={() => navigate({ to: '/rectification' })}
        >
          返回
        </Button>
        <h2 style={{ margin: 0 }}>{isEdit ? '编辑整改计划' : '新增整改计划'}</h2>
      </div>

      <Card loading={isEdit && isLoading}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="关联抽样记录"
                name="samplingId"
                rules={[{ required: true, message: '请选择关联抽样记录' }]}
              >
                <Select
                  placeholder="请选择关联抽样记录"
                  options={samplingOptions}
                  showSearch
                  optionFilterProp="label"
                  disabled={isEdit}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="风险等级"
                name="riskLevel"
                rules={[{ required: true, message: '请选择风险等级' }]}
              >
                <Radio.Group>
                  <Radio value={RiskLevel.LOW}>低风险</Radio>
                  <Radio value={RiskLevel.MEDIUM}>中风险</Radio>
                  <Radio value={RiskLevel.HIGH}>高风险</Radio>
                  <Radio value={RiskLevel.CRITICAL}>严重风险</Radio>
                </Radio.Group>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="整改标题"
            name="title"
            rules={[{ required: true, message: '请输入整改标题' }]}
          >
            <Input placeholder="请简明描述整改内容" />
          </Form.Item>

          <Form.Item label="整改描述" name="description">
            <Input.TextArea rows={4} placeholder="详细描述整改要求、措施等（可选）" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="截止日期" name="deadline">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="负责人" name="responsiblePerson">
                <Input placeholder="请输入负责人姓名（可选）" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="关联供应商" name="vendorId">
            <Select
              placeholder="请选择关联供应商（可选）"
              options={vendorOptions}
              allowClear
              showSearch
              optionFilterProp="label"
            />
          </Form.Item>

          <div
            style={{
              textAlign: 'right',
              paddingTop: 24,
              marginTop: 24,
              borderTop: '1px solid #f0f0f0',
            }}
          >
            <Space>
              <Button onClick={() => navigate({ to: '/rectification' })}>取消</Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={createMutation.isPending || updateMutation.isPending}
              >
                {isEdit ? '保存修改' : '创建'}
              </Button>
            </Space>
          </div>
        </Form>
      </Card>
    </div>
  )
}

export default RectificationForm
