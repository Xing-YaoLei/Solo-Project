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
  App as AntdApp,
} from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { checklistApi } from '@/api/checklist'
import { AuditChecklistFormData } from '@/types'

interface ChecklistFormProps {
  id?: number
}

const ChecklistForm: React.FC<ChecklistFormProps> = ({ id }) => {
  const [form] = Form.useForm<AuditChecklistFormData>()
  const { message } = AntdApp.useApp()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isEdit = !!id

  const { data: categoriesData } = useQuery({
    queryKey: ['checklist-categories'],
    queryFn: checklistApi.getCategories,
  })

  const { data: record, isLoading } = useQuery({
    queryKey: ['checklist', id],
    queryFn: () => (id ? checklistApi.get(id) : Promise.resolve(null)),
    enabled: isEdit,
  })

  useEffect(() => {
    if (record) {
      form.setFieldsValue({
        title: record.title,
        category: record.category,
        description: record.description,
        criteria: record.criteria,
      })
    }
  }, [record, form])

  const createMutation = useMutation({
    mutationFn: (data: AuditChecklistFormData) => checklistApi.create(data),
    onSuccess: () => {
      message.success('创建成功')
      queryClient.invalidateQueries({ queryKey: ['checklists'] })
      navigate({ to: '/checklist' })
    },
    onError: () => message.error('创建失败'),
  })

  const updateMutation = useMutation({
    mutationFn: (data: Partial<AuditChecklistFormData>) => checklistApi.update(id!, data),
    onSuccess: () => {
      message.success('更新成功')
      queryClient.invalidateQueries({ queryKey: ['checklists'] })
      navigate({ to: '/checklist' })
    },
    onError: () => message.error('更新失败'),
  })

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      if (isEdit) {
        updateMutation.mutate(values)
      } else {
        createMutation.mutate(values)
      }
    } catch {
    }
  }

  const categoryOptions = (categoriesData?.categories || []).map((cat) => ({
    label: cat,
    value: cat,
  }))

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center' }}>
        <Button
          icon={<ArrowLeftOutlined />}
          style={{ marginRight: 16 }}
          onClick={() => navigate({ to: '/checklist' })}
        >
          返回
        </Button>
        <h2 style={{ margin: 0 }}>{isEdit ? '编辑检查清单' : '新增检查清单'}</h2>
      </div>

      <Card loading={isEdit && isLoading}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="标题"
                name="title"
                rules={[{ required: true, message: '请输入标题' }]}
              >
                <Input placeholder="请输入检查清单标题" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="分类"
                name="category"
                rules={[{ required: true, message: '请选择或输入分类' }]}
              >
                <Select
                  placeholder="请选择或输入分类"
                  options={categoryOptions}
                  mode={undefined}
                  allowClear
                  showSearch
                  optionFilterProp="label"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="描述" name="description">
            <Input.TextArea rows={3} placeholder="请输入检查清单描述（可选）" />
          </Form.Item>

          <Form.Item
            label="检查标准"
            name="criteria"
            rules={[{ required: true, message: '请输入检查标准' }]}
          >
            <Input.TextArea rows={6} placeholder="请输入详细的检查标准内容" />
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
              <Button onClick={() => navigate({ to: '/checklist' })}>取消</Button>
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

export default ChecklistForm
