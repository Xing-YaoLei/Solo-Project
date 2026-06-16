import { useState, useEffect } from 'react'
import { useRouter } from '@tanstack/react-router'
import { authApi } from '../api/auth'
import { useAuthStore } from '../stores/auth'

export default function Login() {
  const router = useRouter()
  const { login, isAuthenticated } = useAuthStore()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isAuthenticated) {
      router.navigate({ to: '/dashboard' })
    }
  }, [isAuthenticated, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username || !password) {
      setError('请输入用户名和密码')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await authApi.login(username, password)
      const { access_token } = res.data
      const userRes = await authApi.getMe()
      login(access_token, userRes.data)
      router.navigate({ to: '/dashboard' })
    } catch (err: any) {
      setError(err.response?.data?.detail || '登录失败，请检查用户名和密码')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>养老护理系统</h1>
        <p>康复活动跟进平台</p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">用户名</label>
            <input
              type="text"
              className="form-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="请输入用户名"
            />
          </div>
          <div className="form-group">
            <label className="form-label">密码</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
            />
          </div>
          {error && (
            <div style={{ color: '#ef4444', marginBottom: '16px', fontSize: '13px' }}>
              {error}
            </div>
          )}
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? '登录中...' : '登 录'}
          </button>
        </form>
      </div>
    </div>
  )
}
