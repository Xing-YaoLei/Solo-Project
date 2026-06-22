import React, { useEffect } from 'react'
import {
  Card,
  Form,
  Input,
  Select,
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
import { exceptionApi } from '@/api/exception'
import { samplingApi } from '@/api/sampling'
import { ExceptionOrderFormData } from '@/types'
import { ExceptionType, ExceptionStatus } from '@/types/enums'

interface ExceptionFormProps {
  id?: number
}

const ExceptionForm: React.FC<ExceptionFormProps> = ({ id }) => {
  const [form] = Form.useForm<ExceptionOrderFormData>()
  const { message } = AntdApp.useApp()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isEdit = !!id

  const { data: samplingsData } = useQuery({
    queryKey: ['samplings-select-exception'],
    queryFn: () => samplingApi.list({ skip: 0, limit: 200 }),
  })

  const { data: record, isLoading } = useQuery({
    queryKey: ['exception', id],
    queryFn: () => (id ? exceptionApi.get(id) : Promise.resolve(null)),
    enabled: isEdit,
  })

  useEffect(() => {
    if (record) {
      form.setFieldsValue({
        samplingId: record.samplingId,
        exceptionType: record.exceptionType,
        impactScope: record.impactScope,
        responsiblePerson: record.responsiblePerson,
        rootCause: record.rootCause,
        handlingResult: record.handlingResult,
        status: record.status,
      })
    } else {
      form.setFieldsValue({
        exceptionType: ExceptionType.OTHER,
        status: ExceptionStatus.OPEN,
      })
    }
  }, [record, form, isEdit])

  const createMutation = useMutation({
    mutationFn: (data: ExceptionOrderFormData) => exceptionApi.create(data),
    onSuccess: () => {
      message.success('创建成功')
      queryClient.invalidateQueries({ queryKey: ['exceptions'] })
      navigate({ to: '/exceptions' })
    },
    onError: () => message.error('创建失败'),
  })

  const updateMutation = useMutation({
    mutationFn: (data: Partial<ExceptionOrderFormData>) => exceptionApi.update(id!, data),
    onSuccess: () => {
      message.success('更新成功')
      queryClient.invalidateQueries({ queryKey: ['exceptions'] })
      navigate({ to: '/exceptions' })
    },
    onError: () => message.error('更新失败'),
  })

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      const data: ExceptionOrderFormData = {
        samplingId: values.samplingId,
        exceptionType: values.exceptionType,
        impactScope: values.impactScope,
        responsiblePerson: values.responsiblePerson,
        rootCause: values.rootCause,
        handlingResult: values.handlingResult,
        status: values.status,
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

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center' }}>
        <Button
          icon={<ArrowLeftOutlined />}
          style={{ marginRight: 16 }}
          onClick={() => navigate({ to: '/exceptions' })}
        >
          返回
        </Button>
        <h2 style={{ margin: 0 }}>{isEdit ? '处理异常单' : '新增异常单'}</h2>
      </div>

      <Card loading={isEdit && isLoading}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="关联抽样"
                name="samplingId"
                rules={[{ required: true, message: '请选择关联抽样' }]}
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
                label="异常类型"
                name="exceptionType"
                rules={[{ required: true, message: '请选择异常类型' }]}
              >
                <Radio.Group>
                  <Radio value={ExceptionType.EVIDENCE_MISSING}>证据缺失</Radio>
                  <Radio value={ExceptionType.NON_COMPLIANCE}>不合规</Radio>
                  <Radio value={ExceptionType.OTHER}>其他</Radio>
                </Radio.Group>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="影响范围" name="impactScope">
            <Input.TextArea rows={3} placeholder="请描述异常的影响范围（可选）" />
          </Form.Item>

          <Form.Item label="责任人" name="responsiblePerson">
            <Input placeholder="请输入责任人姓名（可选）" />
          </Form.Item>

          <Form.Item label="根本原因" name="rootCause">
            <Input.TextArea rows={4} placeholder="请分析并描述根本原因（可选）" />
          </Form.Item>

          <Form.Item label="处理结果" name="handlingResult">
            <Input.TextArea rows={4} placeholder="请描述处理措施和结果（可选）" />
          </Form.Item>

          <Form.Item
            label="状态"
            name="status"
            rules={[{ required: true, message: '请选择状态' }]}
          >
            <Select
              placeholder="请选择状态"
              options={[
                { label: '待处理', value: ExceptionStatus.OPEN },
                { label: '处理中', value: ExceptionStatus.PROCESSING },
                { label: '已关闭', value: ExceptionStatus.CLOSED },
              ]}
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
              <Button onClick={() => navigate({ to: '/exceptions' })}>取消</Button>
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

export default ExceptionForm
