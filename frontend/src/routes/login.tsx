import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import api from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'
import { Wrench } from 'lucide-react'

function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { login } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.post('/auth/login', { username, password })
      login(res.data.access_token, res.data.user)
      navigate({ to: '/schedule' })
    } catch (err: any) {
      setError(err.response?.data?.detail || '登录失败，请检查用户名和密码')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
      <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-lg">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto rounded-full bg-primary-600 flex items-center justify-center mb-4">
            <Wrench size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">汽车维修工位排班跟进台</h1>
          <p className="text-slate-500 mt-2">请登录您的账号</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="label">用户名</label>
            <input
              type="text"
              className="input w-full"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="请输入用户名"
              required
            />
          </div>
          <div>
            <label className="label">密码</label>
            <input
              type="password"
              className="input w-full"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
              required
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" className="btn btn-primary w-full justify-center" disabled={loading}>
            {loading ? '登录中...' : '登录'}
          </button>
        </form>
        <div className="mt-6 text-center text-sm text-slate-500">
          <p>默认账号（请先在后端注册）</p>
        </div>
      </div>
    </div>
  )
}

export const Route = createFileRoute('/login')({
  component: Login,
})
