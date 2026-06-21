import { Card, Form, Input, Button, Descriptions, Tag, message } from 'antd'
import { useState } from 'react'
import { useAuthStore } from '../store/auth'
import { authApi } from '../api'
import { getUserRoleLabel, formatDateTime } from '../utils/format'

function ProfilePage() {
  const { user } = useAuthStore()
  const [pwdForm] = Form.useForm()
  const [pwdLoading, setPwdLoading] = useState(false)

  const handleChangePwd = async () => {
    try {
      const values = await pwdForm.validateFields()
      setPwdLoading(true)
      await authApi.changePassword(values)
      message.success('密码修改成功')
      pwdForm.resetFields()
    } catch (error: any) {
      message.error(error?.response?.data?.detail || '修改失败')
    } finally {
      setPwdLoading(false)
    }
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h2 className="page-title">个人信息</h2>
      </div>

      <div style={{ maxWidth: 720 }}>
        <Card title="基本信息" style={{ marginBottom: 16, borderRadius: 8 }}>
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="用户名">{user?.username}</Descriptions.Item>
            <Descriptions.Item label="姓名">{user?.full_name}</Descriptions.Item>
            <Descriptions.Item label="邮箱">{user?.email}</Descriptions.Item>
            <Descriptions.Item label="电话">{user?.phone || '-'}</Descriptions.Item>
            <Descriptions.Item label="角色">
              <Tag color="blue">{user ? getUserRoleLabel(user.role) : '-'}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="部门">{user?.department || '-'}</Descriptions.Item>
            <Descriptions.Item label="账号状态">
              <Tag color="success">正常</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="创建时间">
              {user ? formatDateTime(user.created_at) : '-'}
            </Descriptions.Item>
          </Descriptions>
        </Card>

        <Card title="修改密码" style={{ borderRadius: 8 }}>
          <Form form={pwdForm} layout="vertical" style={{ maxWidth: 400 }}>
            <Form.Item
              label="原密码"
              name="old_password"
              rules={[{ required: true, message: '请输入原密码' }]}
            >
              <Input.Password />
            </Form.Item>
            <Form.Item
              label="新密码"
              name="new_password"
              rules={[{ required: true, min: 6, message: '密码至少6位' }]}
            >
              <Input.Password />
            </Form.Item>
            <Form.Item
              label="确认新密码"
              name="confirm_password"
              dependencies={['new_password']}
              rules={[
                { required: true, message: '请确认新密码' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('new_password') === value) {
                      return Promise.resolve()
                    }
                    return Promise.reject(new Error('两次输入的密码不一致'))
                  },
                }),
              ]}
            >
              <Input.Password />
            </Form.Item>
            <Form.Item>
              <Button type="primary" loading={pwdLoading} onClick={handleChangePwd}>
                保存修改
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </div>
    </div>
  )
}

export default ProfilePage
