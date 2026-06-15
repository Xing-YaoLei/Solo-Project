import { useState, useEffect } from 'react'
import { useNavigate, Link } from '@tanstack/react-router'
import api from '@/api/client'
import { PLAGIARISM_SEVERITY, TICKET_SOURCE } from '@/utils/enums'
import type { MemberProfile, CommunityTicket } from '@/types'
import dayjs from 'dayjs'

export default function PlagiarismNew() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [members, setMembers] = useState<MemberProfile[]>([])
  const [tickets, setTickets] = useState<CommunityTicket[]>([])
  const [memberKeyword, setMemberKeyword] = useState('')
  const [showMemberDropdown, setShowMemberDropdown] = useState(false)
  const [ticketKeyword, setTicketKeyword] = useState('')
  const [showTicketDropdown, setShowTicketDropdown] = useState(false)

  const [form, setForm] = useState({
    member_id: null as number | null,
    ticket_id: null as number | null,
    assignment_name: '',
    course_name: '',
    similarity_score: '' as string | number,
    original_author: '',
    description: '',
    severity: 'moderate' as string,
    evidence_urls: '',
  })

  const [selectedMember, setSelectedMember] = useState<MemberProfile | null>(null)
  const [selectedTicket, setSelectedTicket] = useState<CommunityTicket | null>(null)

  useEffect(() => {
    if (memberKeyword.trim()) {
      searchMembers(memberKeyword)
    }
  }, [memberKeyword])

  useEffect(() => {
    if (ticketKeyword.trim()) {
      searchTickets(ticketKeyword)
    }
  }, [ticketKeyword])

  const searchMembers = async (keyword: string) => {
    try {
      const res = await api.get('/members/', { params: { name: keyword, page_size: 10 } })
      setMembers(res.items || [])
    } catch (e) {
      setMembers(getMockMembers())
    }
  }

  const searchTickets = async (keyword: string) => {
    try {
      const res = await api.get('/tickets/', { params: { keyword, page_size: 10 } })
      setTickets(res.items || [])
    } catch (e) {
      setTickets(getMockTickets())
    }
  }

  const getMockMembers = (): MemberProfile[] => [
    { id: 1, member_no: 'M20260001', name: '张三', phone: '13800138001', level: 'gold', source_channel: 'wechat_group', exam_score: 85, exam_pass_status: true },
    { id: 2, member_no: 'M20260002', name: '李四', phone: '13800138002', level: 'silver', source_channel: 'referral', exam_score: 72, exam_pass_status: true },
    { id: 3, member_no: 'M20260003', name: '王五', phone: '13800138003', level: 'basic', source_channel: 'qq_group', exam_score: 58, exam_pass_status: false },
  ]

  const getMockTickets = (): CommunityTicket[] => [
    { id: 101, ticket_no: 'TK20260615001', title: 'Python数据分析课程作业问题', member_id: 1 },
    { id: 102, ticket_no: 'TK20260616002', title: 'UI设计实战班社群跟进', member_id: 2 },
    { id: 103, ticket_no: 'TK20260616003', title: 'Java高级架构师答疑', member_id: 3 },
  ]

  const handleSelectMember = (m: MemberProfile) => {
    setSelectedMember(m)
    setForm(prev => ({ ...prev, member_id: m.id! }))
    setMemberKeyword(m.name!)
    setShowMemberDropdown(false)
  }

  const handleSelectTicket = (t: CommunityTicket) => {
    setSelectedTicket(t)
    setForm(prev => ({ ...prev, ticket_id: t.id! }))
    setTicketKeyword(t.ticket_no + ' - ' + t.title)
    setShowTicketDropdown(false)
  }

  const handleSubmit = async (saveDraft = false) => {
    if (!form.assignment_name.trim()) {
      alert('请输入作业名称')
      return
    }
    if (!form.member_id) {
      alert('请选择涉及的学员')
      return
    }
    setLoading(true)
    try {
      const payload: any = {
        ...form,
        similarity_score: form.similarity_score ? Number(form.similarity_score) : null,
        evidence_urls: form.evidence_urls.split('\n').filter((s: string) => s.trim()),
      }
      await api.post('/plagiarism/', payload)
      alert('保存成功！')
      navigate({ to: '/plagiarism' })
    } catch (e: any) {
      console.error(e)
      alert('保存失败：' + (e.message || '未知错误'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="flex-between mb-4">
        <div>
          <div className="mb-2" style={{ fontSize: 13, color: '#6b7280' }}>
            <Link to="/plagiarism" style={{ color: '#3b82f6', textDecoration: 'none' }}>抄袭案例</Link>
            <span style={{ margin: '0 8px' }}>/</span>
            <span>新建案例</span>
          </div>
          <h1 className="page-title" style={{ margin: 0 }}>📝 新建作业抄袭异常案例</h1>
        </div>
        <button className="btn btn-secondary" onClick={() => navigate({ to: '/plagiarism' })}>
          ← 返回列表
        </button>
      </div>

      <div className="card mb-6">
        <div className="card-title">⚠️ 异常案例基本信息</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div>
            <label className="form-label">作业名称 <span style={{ color: '#ef4444' }}>*</span></label>
            <input
              className="form-input"
              value={form.assignment_name}
              onChange={e => setForm(prev => ({ ...prev, assignment_name: e.target.value }))}
              placeholder="例如：Python数据分析第3章实战作业"
            />
          </div>
          <div>
            <label className="form-label">所属课程</label>
            <input
              className="form-input"
              value={form.course_name}
              onChange={e => setForm(prev => ({ ...prev, course_name: e.target.value }))}
              placeholder="例如：Python数据分析实战班（2026春季）"
            />
          </div>
          <div>
            <label className="form-label">相似度分数 (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              className="form-input"
              value={form.similarity_score}
              onChange={e => setForm(prev => ({ ...prev, similarity_score: e.target.value }))}
              placeholder="例如：85"
              style={{ color: Number(form.similarity_score) > 60 ? '#ef4444' : undefined }}
            />
            {Number(form.similarity_score) > 60 && (
              <div style={{ fontSize: 12, color: '#ef4444', marginTop: 4 }}>⚠️ 相似度较高，请重点关注</div>
            )}
          </div>
          <div>
            <label className="form-label">原作者（被抄袭方）</label>
            <input
              className="form-input"
              value={form.original_author}
              onChange={e => setForm(prev => ({ ...prev, original_author: e.target.value }))}
              placeholder="例如：学号A001-李四"
            />
          </div>
          <div>
            <label className="form-label">严重程度</label>
            <select
              className="form-input"
              value={form.severity}
              onChange={e => setForm(prev => ({ ...prev, severity: e.target.value }))}
            >
              {Object.entries(PLAGIARISM_SEVERITY).map(([key, val]) => (
                <option key={key} value={key}>{val.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">举报时间</label>
            <input className="form-input" defaultValue={dayjs().format('YYYY-MM-DD HH:mm')} disabled />
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        <div className="card">
          <div className="card-title">👤 涉及学员</div>
          <div className="mb-4">
            <label className="form-label">搜索学员 <span style={{ color: '#ef4444' }}>*</span></label>
            <div style={{ position: 'relative' }}>
              <input
                className="form-input"
                value={memberKeyword}
                onChange={e => {
                  setMemberKeyword(e.target.value)
                  setShowMemberDropdown(true)
                }}
                onFocus={() => setShowMemberDropdown(true)}
                placeholder="输入学员姓名搜索..."
              />
              {showMemberDropdown && members.length > 0 && (
                <div style={dropdownStyle}>
                  {members.map(m => (
                    <div
                      key={m.id}
                      style={dropdownItem}
                      onClick={() => handleSelectMember(m)}
                    >
                      <div style={{ fontWeight: 500 }}>{m.name}</div>
                      <div style={{ fontSize: 12, color: '#6b7280' }}>{m.member_no} · {m.phone} · {TICKET_SOURCE[m.source_channel as keyof typeof TICKET_SOURCE]?.label}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          {selectedMember && (
            <div style={selectedBoxStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontWeight: 600 }}>{selectedMember.name}</span>
                <span className={`tag`} style={{ background: '#e0f2fe', color: '#0369a1' }}>
                  {selectedMember.member_no}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 13 }}>
                <div>📱 {selectedMember.phone || '-'}</div>
                <div>🎓 {selectedMember.level === 'gold' ? '金牌' : selectedMember.level === 'silver' ? '银牌' : '基础'}</div>
                <div>📝 {selectedMember.exam_score ?? '-'} 分</div>
                <div>{selectedMember.exam_pass_status ? '✅ 已通过' : selectedMember.exam_pass_status === false ? '❌ 未通过' : '- 未考试'}</div>
              </div>
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-title">📋 关联单据（选填）</div>
          <div className="mb-4">
            <label className="form-label">搜索社群单据</label>
            <div style={{ position: 'relative' }}>
              <input
                className="form-input"
                value={ticketKeyword}
                onChange={e => {
                  setTicketKeyword(e.target.value)
                  setShowTicketDropdown(true)
                }}
                onFocus={() => setShowTicketDropdown(true)}
                placeholder="输入单据号或标题关键词..."
              />
              {showTicketDropdown && tickets.length > 0 && (
                <div style={dropdownStyle}>
                  {tickets.map(t => (
                    <div
                      key={t.id}
                      style={dropdownItem}
                      onClick={() => handleSelectTicket(t)}
                    >
                      <div style={{ fontWeight: 500, fontSize: 13 }}>{t.ticket_no}</div>
                      <div style={{ fontSize: 12, color: '#6b7280' }}>{t.title}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          {selectedTicket && (
            <div style={selectedBoxStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontWeight: 600, fontSize: 14 }}>{selectedTicket.ticket_no}</span>
              </div>
              <div style={{ fontSize: 13, color: '#374151', marginBottom: 8 }}>{selectedTicket.title}</div>
              <div style={{ fontSize: 12, color: '#6b7280' }}>
                创建于 {selectedTicket.created_at ? dayjs(selectedTicket.created_at).format('YYYY-MM-DD HH:mm') : '-'}
              </div>
            </div>
          )}
          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 8 }}>
            💡 如该异常与现有社群单据相关，请关联以便追溯
          </div>
        </div>
      </div>

      <div className="card mb-6">
        <div className="card-title">📄 详细描述</div>
        <label className="form-label">异常情况描述</label>
        <textarea
          className="form-input"
          rows={5}
          value={form.description}
          onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
          placeholder="请详细描述抄袭情况，包括：发现时间、抄袭范围、证据要点等..."
        />
      </div>

      <div className="card mb-6">
        <div className="card-title">🔗 证据链接</div>
        <label className="form-label">证据URL列表（每行一个）</label>
        <textarea
          className="form-input"
          rows={4}
          value={form.evidence_urls}
          onChange={e => setForm(prev => ({ ...prev, evidence_urls: e.target.value }))}
          placeholder={'https://example.com/evidence1.pdf\nhttps://example.com/screenshot1.png'}
        />
        {form.evidence_urls.split('\n').filter(s => s.trim()).length > 0 && (
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 8 }}>
              已添加 {form.evidence_urls.split('\n').filter(s => s.trim()).length} 条证据链接：
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {form.evidence_urls.split('\n').filter(s => s.trim()).map((url: string, i: number) => (
                <a
                  key={i}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    padding: '4px 10px',
                    background: '#eff6ff',
                    color: '#2563eb',
                    borderRadius: 6,
                    fontSize: 12,
                    textDecoration: 'none',
                    maxWidth: 300,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  📎 证据{i + 1}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={actionBarStyle}>
        <div>
          {loading && <span style={{ color: '#6b7280', marginRight: 16 }}>保存中...</span>}
        </div>
        <div className="gap-2" style={{ display: 'flex' }}>
          <button className="btn btn-secondary" onClick={() => navigate({ to: '/plagiarism' })} disabled={loading}>
            取消
          </button>
          <button className="btn btn-warning" onClick={() => handleSubmit(true)} disabled={loading}>
            💾 保存为草稿
          </button>
          <button className="btn btn-primary" onClick={() => handleSubmit(false)} disabled={loading}>
            🚀 提交举报
          </button>
        </div>
      </div>

      <style>{`
        .form-label { display: block; font-size: 13px; font-weight: 500; color: #374151; margin-bottom: 6px; }
        .form-input { width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; box-sizing: border-box; }
        .form-input:focus { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); }
      `}</style>
    </div>
  )
}

const dropdownStyle: React.CSSProperties = {
  position: 'absolute',
  top: '100%',
  left: 0,
  right: 0,
  background: 'white',
  border: '1px solid #e5e7eb',
  borderRadius: 6,
  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  maxHeight: 240,
  overflow: 'auto',
  zIndex: 1000,
}

const dropdownItem: React.CSSProperties = {
  padding: '10px 12px',
  cursor: 'pointer',
  borderBottom: '1px solid #f3f4f6',
}

const selectedBoxStyle: React.CSSProperties = {
  padding: 16,
  background: '#f0fdf4',
  border: '1px solid #bbf7d0',
  borderRadius: 8,
}

const actionBarStyle: React.CSSProperties = {
  position: 'sticky',
  bottom: 0,
  background: 'white',
  padding: '16px 24px',
  margin: '0 -24px -24px -24px',
  borderTop: '1px solid #e5e7eb',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
}
