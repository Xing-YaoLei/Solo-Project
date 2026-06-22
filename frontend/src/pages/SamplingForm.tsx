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
import { useNavigate } from '@tanstack/react-router'
import dayjs from 'dayjs'
import { samplingApi } from '@/api/sampling'
import { checklistApi } from '@/api/checklist'
import { SamplingRecordFormData } from '@/types'
import { EvidenceStatus } from '@/types/enums'

interface SamplingFormProps {
  id?: number
}

const SamplingForm: React.FC<SamplingFormProps> = ({ id }) => {
  const [form] = Form.useForm<any>()
  const { message } = AntdApp.useApp()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isEdit = !!id

  const { data: checklistsData } = useQuery({
    queryKey: ['checklists-select-sampling'],
    queryFn: () => checklistApi.list({ skip: 0, limit: 100 }),
  })

  const { data: record, isLoading } = useQuery({
    queryKey: ['sampling', id],
    queryFn: () => (id ? samplingApi.get(id) : Promise.resolve(null)),
    enabled: isEdit,
  })

  useEffect(() => {
    if (record) {
      form.setFieldsValue({
        checklistId: record.checklistId,
        sampleName: record.sampleName,
        sampleCode: record.sampleCode,
        source: record.source,
        samplingDate: record.samplingDate ? dayjs(record.samplingDate) : undefined,
        sampledBy: record.sampledBy,
        evidenceStatus: record.evidenceStatus,
        sampleDataText: record.sampleData ? JSON.stringify(record.sampleData, null, 2) : '',
      })
    } else {
      form.setFieldsValue({
        evidenceStatus: EvidenceStatus.COMPLETE,
      })
    }
  }, [record, form, isEdit])

  const createMutation = useMutation({
    mutationFn: (data: SamplingRecordFormData) => samplingApi.create(data),
    onSuccess: () => {
      message.success('创建成功')
      queryClient.invalidateQueries({ queryKey: ['samplings'] })
      navigate({ to: '/sampling' })
    },
    onError: () => message.error('创建失败'),
  })

  const updateMutation = useMutation({
    mutationFn: (data: Partial<SamplingRecordFormData>) => samplingApi.update(id!, data),
    onSuccess: () => {
      message.success('更新成功')
      queryClient.invalidateQueries({ queryKey: ['samplings'] })
      navigate({ to: '/sampling' })
    },
    onError: () => message.error('更新失败'),
  })

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      let sampleData: Record<string, any> | undefined = undefined
      if (values.sampleDataText) {
        try {
          sampleData = JSON.parse(values.sampleDataText)
        } catch {
          message.error('抽样数据格式错误，请输入有效的 JSON')
          return
        }
      }
      const data: SamplingRecordFormData = {
        checklistId: values.checklistId,
        sampleName: values.sampleName,
        sampleCode: values.sampleCode,
        source: values.source,
        samplingDate: dayjs(values.samplingDate).toISOString(),
        sampledBy: values.sampledBy,
        evidenceStatus: values.evidenceStatus,
        sampleData,
      }
      if (isEdit) {
        updateMutation.mutate(data)
      } else {
        createMutation.mutate(data)
      }
    } catch {
    }
  }

  const checklistOptions = (checklistsData?.items || []).map((c) => ({
    label: c.title,
    value: c.id,
  }))

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center' }}>
        <Button
          icon={<ArrowLeftOutlined />}
          style={{ marginRight: 16 }}
          onClick={() => navigate({ to: '/sampling' })}
        >
          返回
        </Button>
        <h2 style={{ margin: 0 }}>{isEdit ? '编辑抽样记录' : '新增抽样记录'}</h2>
      </div>

      <Card loading={isEdit && isLoading}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="关联检查清单"
                name="checklistId"
                rules={[{ required: true, message: '请选择检查清单' }]}
              >
                <Select
                  placeholder="请选择检查清单"
                  options={checklistOptions}
                  showSearch
                  optionFilterProp="label"
                  disabled={isEdit}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="样本名称"
                name="sampleName"
                rules={[{ required: true, message: '请输入样本名称' }]}
              >
                <Input placeholder="请输入样本名称" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="样本编码"
                name="sampleCode"
                rules={[{ required: true, message: '请输入样本编码' }]}
              >
                <Input placeholder="如 SPL-2025-001" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="来源" name="source">
                <Input placeholder="请输入来源（可选）" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="抽样日期"
                name="samplingDate"
                rules={[{ required: true, message: '请选择抽样日期' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="抽样人" name="sampledBy">
                <Input placeholder="请输入抽样人姓名（可选）" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="证据状态"
            name="evidenceStatus"
            rules={[{ required: true, message: '请选择证据状态' }]}
          >
            <Radio.Group>
              <Radio value={EvidenceStatus.COMPLETE}>证据完整</Radio>
              <Radio value={EvidenceStatus.PARTIAL}>部分证据</Radio>
              <Radio value={EvidenceStatus.MISSING}>证据缺失</Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item label="抽样数据（JSON 格式）" name="sampleDataText">
            <Input.TextArea
              rows={6}
              placeholder='请输入 JSON 格式的抽样数据，例如：{"batchNo": "B20250601", "quantity": 100}'
              style={{ fontFamily: 'monospace' }}
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
              <Button onClick={() => navigate({ to: '/sampling' })}>取消</Button>
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

export default SamplingForm
