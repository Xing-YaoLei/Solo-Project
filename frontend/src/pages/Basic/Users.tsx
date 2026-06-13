import { useEffect, useState } from 'react'
import { authApi } from '@/api'
import { Modal } from '@/components/Modal'
import type { User } from '@/types'
import { useAuthStore } from '@/store/auth'
import { RoleEnum, ROLE_LABEL } from '@/types'

export function UsersPage() {
  const { user } = useAuthStore()
  const isAdmin = user?.role === RoleEnum.ADMIN
  const [list, setList] = useState<User[]>([])
  const [showModal, setShowModal] = useState(false)
  const [username, setUsername] = useState('')
  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<RoleEnum>(RoleEnum.WAREHOUSE)
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    if (!isAdmin) return
    try {
      const data = await authApi.listUsers()
      setList(data)
    } catch {}
  }

  async function handleSubmit() {
    setError('')
    if (!username || !fullName || !password) { setError('请填写完整信息'); return }
    try {
      await authApi.createUser({ username, full_name: fullName, password, role, phone: phone || undefined })
      setShowModal(false)
      resetForm()
      load()
    } catch (e: any) {
      setError(e?.response?.data?.detail || '创建失败')
    }
  }

  function resetForm() {
    setUsername(''); setFullName(''); setPassword(''); setRole(RoleEnum.WAREHOUSE); setPhone(''); setError('')
  }

  if (!isAdmin) {
    return (
      <div className="card p-8 text-center">
        <div className="text-slate-500">仅管理员可访问用户管理</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800">用户管理</h2>
        <button className="btn-primary" onClick={() => setShowModal(true)}>+ 新增用户</button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th className="table-th">用户名</th>
                <th className="table-th">姓名</th>
                <th className="table-th">角色</th>
                <th className="table-th">电话</th>
                <th className="table-th">状态</th>
                <th className="table-th">创建时间</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {list.map((u) => (
                <tr key={u.id}>
                  <td className="table-td font-medium">{u.username}</td>
                  <td className="table-td">{u.full_name}</td>
                  <td className="table-td">
                    <span className="badge bg-primary-100 text-primary-700">{ROLE_LABEL[u.role]}</span>
                  </td>
                  <td className="table-td">{u.phone || '-'}</td>
                  <td className="table-td">
                    {u.is_active
                      ? <span className="badge bg-green-100 text-green-800">启用</span>
                      : <span className="badge bg-gray-100 text-gray-600">停用</span>}
                  </td>
                  <td className="table-td text-slate-500 text-xs">{u.created_at.slice(0, 10)}</td>
                </tr>
              ))}
              {list.length === 0 && (
                <tr><td colSpan={6} className="table-td text-center text-slate-400 py-8">暂无数据</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={showModal}
        onClose={() => { setShowModal(false); resetForm() }}
        title="新增用户"
        footer={<>
          <button className="btn-secondary" onClick={() => setShowModal(false)}>取消</button>
          <button className="btn-primary" onClick={handleSubmit}>提交</button>
        </>}
      >
        <div className="space-y-3">
          {error && <div className="text-sm text-red-600 bg-red-50 rounded px-3 py-2">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">用户名 <span className="text-red-500">*</span></label>
            <input className="input" value={username} onChange={(e) => setUsername(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">姓名 <span className="text-red-500">*</span></label>
            <input className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">密码 <span className="text-red-500">*</span></label>
            <input type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">角色</label>
            <select className="select" value={role} onChange={(e) => setRole(e.target.value as RoleEnum)}>
              {Object.entries(ROLE_LABEL).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">电话</label>
            <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
        </div>
      </Modal>
    </div>
  )
}
