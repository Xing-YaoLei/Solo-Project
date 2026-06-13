import { useEffect, useState } from 'react'
import { basicApi } from '@/api'
import { Modal } from '@/components/Modal'
import type { Store } from '@/types'
import { useAuthStore } from '@/store/auth'
import { RoleEnum } from '@/types'

export function StoresPage() {
  const { user } = useAuthStore()
  const canCreate = user?.role && [RoleEnum.ADMIN, RoleEnum.WAREHOUSE, RoleEnum.PURCHASER].includes(user.role)
  const [list, setList] = useState<Store[]>([])
  const [showModal, setShowModal] = useState(false)
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    const data = await basicApi.listStores(false)
    setList(data)
  }

  async function handleSubmit() {
    setError('')
    if (!code || !name) { setError('请填写门店编码和名称'); return }
    try {
      await basicApi.createStore({ code, name, address: address || undefined, phone: phone || undefined })
      setShowModal(false)
      resetForm()
      load()
    } catch (e: any) {
      setError(e?.response?.data?.detail || '创建失败')
    }
  }

  function resetForm() {
    setCode(''); setName(''); setAddress(''); setPhone(''); setError('')
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800">门店管理</h2>
        {canCreate && <button className="btn-primary" onClick={() => setShowModal(true)}>+ 新增门店</button>}
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th className="table-th">编码</th>
                <th className="table-th">名称</th>
                <th className="table-th">地址</th>
                <th className="table-th">电话</th>
                <th className="table-th">状态</th>
                <th className="table-th">创建时间</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {list.map((s) => (
                <tr key={s.id}>
                  <td className="table-td font-mono font-medium">{s.code}</td>
                  <td className="table-td">{s.name}</td>
                  <td className="table-td text-slate-500">{s.address || '-'}</td>
                  <td className="table-td">{s.phone || '-'}</td>
                  <td className="table-td">
                    {s.is_active
                      ? <span className="badge bg-green-100 text-green-800">启用</span>
                      : <span className="badge bg-gray-100 text-gray-600">停用</span>}
                  </td>
                  <td className="table-td text-slate-500 text-xs">{s.created_at.slice(0, 10)}</td>
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
        title="新增门店"
        footer={<>
          <button className="btn-secondary" onClick={() => setShowModal(false)}>取消</button>
          <button className="btn-primary" onClick={handleSubmit}>提交</button>
        </>}
      >
        <div className="space-y-3">
          {error && <div className="text-sm text-red-600 bg-red-50 rounded px-3 py-2">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">门店编码 <span className="text-red-500">*</span></label>
            <input className="input" value={code} onChange={(e) => setCode(e.target.value)} placeholder="如 ST001" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">门店名称 <span className="text-red-500">*</span></label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="如 生鲜冷链-朝阳店" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">地址</label>
            <input className="input" value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">联系电话</label>
            <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
        </div>
      </Modal>
    </div>
  )
}
