import { useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useAuthStore } from '../store/useAuthStore'

export default function Login() {
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('admin123')
  const login = useAuthStore((s) => s.login)
  const isLoading = useAuthStore((s) => s.isLoading)
  const user = useAuthStore((s) => s.user)
  const token = useAuthStore((s) => s.token)
  const navigate = useNavigate()

  useEffect(() => {
    if (token && user) {
      navigate({ to: '/dashboard' })
    }
  }, [token, user, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await login(username, password)
      navigate({ to: '/dashboard' })
    } catch (err: any) {
      alert(err?.response?.data?.detail || '登录失败，请检查用户名和密码')
    }
  }

  const quickAccounts = [
    { label: '管理员', username: 'admin', password: 'admin123' },
    { label: '业务经理', username: 'manager', password: 'manager123' },
    { label: '律师', username: 'lawyer', password: 'lawyer123' },
    { label: '助理', username: 'assistant', password: 'assistant123' },
    { label: '审核员', username: 'auditor', password: 'auditor123' },
  ]

  return (
    <div className="login-wrap">
      <div className="login-card">
        <h1 className="login-title">⚖️ 法律服务文书归档跟进台</h1>
        <p className="login-subtitle">专业、高效、可追溯的法律文书管理系统</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">用户名</label>
            <input
              type="text"
              className="form-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">密码</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={isLoading}
            style={{ padding: '12px', fontSize: '15px' }}
          >
            {isLoading ? '登录中...' : '登 录'}
          </button>
        </form>

        <div className="mt-4">
          <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
            快速登录体验：
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {quickAccounts.map((acc) => (
              <button
                key={acc.username}
                type="button"
                onClick={() => {
                  setUsername(acc.username)
                  setPassword(acc.password)
                }}
                className="btn btn-sm btn-secondary"
                style={{ fontSize: '11px' }}
              >
                {acc.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
