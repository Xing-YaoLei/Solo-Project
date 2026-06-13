import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useAuthStore } from '@/store/auth'

export function LoginPage() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('admin123')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await useAuthStore.getState().login(username, password)
      navigate({ to: '/dashboard' })
    } catch (err: any) {
      setError(err?.response?.data?.detail || '登录失败，请检查用户名和密码')
    } finally {
      setLoading(false)
    }
  }

  const quickLogin = (u: string, p: string) => {
    setUsername(u)
    setPassword(p)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cold-50 via-white to-primary-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">❄️</div>
          <h1 className="text-2xl font-bold text-slate-800">生鲜冷链门店补货跟进台</h1>
          <p className="text-slate-500 mt-2 text-sm">整合批次码、装车单、质检、温控异常全流程</p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">用户名</label>
              <input
                type="text"
                className="input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="请输入用户名"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">密码</label>
              <input
                type="password"
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="请输入密码"
              />
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
              {loading ? '登录中...' : '登 录'}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="text-xs text-slate-500 mb-2">快捷登录：</div>
            <div className="flex flex-wrap gap-2">
              {[
                { label: '管理员', u: 'admin', p: 'admin123' },
                { label: '仓管', u: 'warehouse01', p: '123456' },
                { label: '司机', u: 'driver01', p: '123456' },
                { label: '品控', u: 'qc01', p: '123456' },
                { label: '采购', u: 'purchaser01', p: '123456' },
              ].map((x) => (
                <button
                  key={x.u}
                  type="button"
                  onClick={() => quickLogin(x.u, x.p)}
                  className="px-3 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors"
                >
                  {x.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
