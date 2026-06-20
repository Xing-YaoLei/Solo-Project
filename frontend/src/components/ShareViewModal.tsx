import { useState } from 'react'
import { Modal, Form, Select, InputNumber, Button, message, Input, Space, Typography, Tag } from 'antd'
import { ShareAltOutlined } from '@ant-design/icons'
import { shareApi, CreateShareResponse } from '../api'
import { useAuthStore } from '../store/auth'

const { Paragraph, Text } = Typography

interface Props {
  open: boolean
  onClose: () => void
}

const ROLE_OPTIONS = [
  { label: '管理员 (admin)', value: 'admin' },
  { label: '运营经理 (operation_manager)', value: 'operation_manager' },
  { label: '分析师 (analyst)', value: 'analyst' },
  { label: '查看者 (viewer)', value: 'viewer' },
]

const ShareViewModal = ({ open, onClose }: Props) => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<CreateShareResponse | null>(null)
  const user = useAuthStore((state) => state.user)

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      setLoading(true)
      const res = await shareApi.createShare({
        view_name: values.view_name,
        allowed_role: values.allowed_role,
        expires_in_hours: values.expires_in_hours,
        filters: {},
      })
      setResult(res)
      message.success('分享链接已生成')
    } catch (e) {
      message.error('生成分享链接失败')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    if (result) {
      navigator.clipboard.writeText(result.share_url)
      message.success('链接已复制')
    }
  }

  return (
    <Modal
      title={<Space><ShareAltOutlined />生成分享视图</Space>}
      open={open}
      onCancel={() => { setResult(null); onClose() }}
      footer={result ? [
        <Button key="close" onClick={() => { setResult(null); onClose() }}>关闭</Button>,
        <Button key="copy" type="primary" onClick={handleCopy}>复制链接</Button>,
      ] : [
        <Button key="cancel" onClick={() => onClose()}>取消</Button>,
        <Button key="submit" type="primary" loading={loading} onClick={handleSubmit}>生成</Button>,
      ]}
      destroyOnClose
    >
      {!result ? (
        <Form form={form} layout="vertical" initialValues={{ allowed_role: 'viewer', expires_in_hours: 24 }}>
          <Form.Item label="视图名称" name="view_name" rules={[{ required: true, message: '请输入视图名称' }]}>
            <Input placeholder="如：6月演出核销异常总览" />
          </Form.Item>
          <Form.Item
            label="允许访问角色"
            name="allowed_role"
            rules={[{ required: true, message: '请选择允许访问的角色' }]}
            extra="分享链接不能绕过角色权限，仅该角色及以上级别可访问"
          >
            <Select options={ROLE_OPTIONS} />
          </Form.Item>
          <Form.Item label="有效期（小时）" name="expires_in_hours" rules={[{ required: true }]}>
            <InputNumber min={1} max={24 * 30} style={{ width: '100%' }} />
          </Form.Item>
          <Paragraph type="secondary" style={{ fontSize: 12, marginBottom: 0 }}>
            当前用户：<Text strong>{user?.full_name}</Text>（{user?.role}）
          </Paragraph>
        </Form>
      ) : (
        <div>
          <p style={{ marginBottom: 8, color: '#52c41a' }}>分享链接已生成：</p>
          <Input.TextArea
            value={result.share_url}
            readOnly
            rows={2}
            style={{ fontFamily: 'monospace', marginBottom: 12 }}
          />
          <Paragraph style={{ fontSize: 12, color: '#666', margin: 0 }}>
            <div>视图：<Text strong>{result.view_name}</Text></div>
            <div>允许角色：<Tag color="blue">{result.allowed_role}</Tag></div>
            <div>过期时间：{new Date(result.expires_at).toLocaleString('zh-CN')}</div>
          </Paragraph>
        </div>
      )}
    </Modal>
  )
}

export default ShareViewModal
