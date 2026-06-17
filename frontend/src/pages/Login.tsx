import { useState } from 'react'
import { useNavigate, Navigate } from '@tanstack/react-router'
import { useAuthStore } from '@/hooks/useAuthStore'
import { Building2, Loader2 } from 'lucide-react'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { login, isAuthenticated } = useAuthStore()
  const navigate = useNavigate()

  if (isAuthenticated) {
    return <Navigate to="/" />
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(username, password)
      navigate({ to: '/' })
    } catch (err: any) {
      setError(err.response?.data?.detail || '登录失败，请检查用户名和密码')
    } finally {
      setLoading(false)
    }
  }

  const quickLogin = (user: string, pwd: string) => {
    setUsername(user)
    setPassword(pwd)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-primary-100 rounded-full flex items-center justify-center">
            <Building2 className="h-8 w-8 text-primary-600" />
          </div>
          <h2 className="mt-6 text-2xl font-bold text-gray-900">
            物业园区报修工单跟进台
          </h2>
          <p className="mt-2 text-sm text-gray-600">请登录您的账号</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                用户名
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                placeholder="请输入用户名"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                密码
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                placeholder="请输入密码"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
            ) : null}
            {loading ? '登录中...' : '登 录'}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-100">
          <p className="text-xs text-gray-500 text-center mb-3">快速登录</p>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => quickLogin('admin', 'admin123')}
              className="text-xs py-2 px-2 bg-gray-100 hover:bg-gray-200 rounded text-gray-700 transition-colors"
            >
              管理员
            </button>
            <button
              onClick={() => quickLogin('manager', 'manager123')}
              className="text-xs py-2 px-2 bg-gray-100 hover:bg-gray-200 rounded text-gray-700 transition-colors"
            >
              经理
            </button>
            <button
              onClick={() => quickLogin('worker1', 'worker123')}
              className="text-xs py-2 px-2 bg-gray-100 hover:bg-gray-200 rounded text-gray-700 transition-colors"
            >
              工人
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
