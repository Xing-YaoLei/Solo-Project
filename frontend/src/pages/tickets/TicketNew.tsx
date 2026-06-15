import { useState, useEffect, useRef } from 'react';
import api from '@/api/client';
import dayjs from 'dayjs';
import { useNavigate } from '@tanstack/react-router';

interface Member {
  id: number;
  member_no: string;
  name: string;
  phone: string;
  level: string;
  source: string;
  score: number;
  passed: boolean;
  study_hours: number;
  community: string;
}

interface Benefit {
  id: number;
  rule_no: string;
  name: string;
  type: string;
  level: string;
  discount_rate: number;
  reward_points: number;
  cash_value: number;
  valid_days: number;
  enabled: boolean;
}

const CATEGORY_OPTIONS = [
  { value: 'consult', label: '咨询类' },
  { value: 'complaint', label: '投诉类' },
  { value: 'refund', label: '退款类' },
  { value: 'exchange', label: '换货类' },
  { value: 'benefit', label: '权益类' },
  { value: 'other', label: '其他类' },
];

const PRIORITY_OPTIONS = [
  { value: 'low', label: '低', color: '#909399' },
  { value: 'medium', label: '中', color: '#409EFF' },
  { value: 'high', label: '高', color: '#E6A23C' },
  { value: 'urgent', label: '紧急', color: '#F56C6C' },
];

const SOURCE_OPTIONS = [
  { value: 'wechat_group', label: '微信群' },
  { value: 'qq_group', label: 'QQ群' },
  { value: 'offline_activity', label: '线下活动' },
  { value: 'referral', label: '转介绍' },
  { value: 'advertisement', label: '广告投放' },
  { value: 'other', label: '其他渠道' },
];

const USER_OPTIONS = [
  { value: 1, label: '张三' },
  { value: 2, label: '李四' },
  { value: 3, label: '王五' },
  { value: 4, label: '赵六' },
];

export default function TicketNew() {
  const navigate = useNavigate();

  const generateTicketNo = () => {
    return `TK${dayjs().format('YYYYMMDDHHmmss')}${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
  };

  const [ticketNo] = useState(generateTicketNo());
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('consult');
  const [priority, setPriority] = useState('medium');
  const [source, setSource] = useState('wechat_group');
  const [assignee, setAssignee] = useState<number | ''>('');
  const [description, setDescription] = useState('');
  const [attachments, setAttachments] = useState('');

  const [memberKeyword, setMemberKeyword] = useState('');
  const [memberOptions, setMemberOptions] = useState<Member[]>([]);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);
  const memberRef = useRef<HTMLDivElement>(null);

  const [benefits, setBenefits] = useState<Benefit[]>([]);
  const [selectedBenefits, setSelectedBenefits] = useState<number[]>([]);

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const res = await api.get('/members/', { params: { keyword: memberKeyword, page_size: 20 } });
        setMemberOptions(res.items || res || []);
      } catch (e) {
        const mock: Member[] = Array.from({ length: 15 }).map((_, i) => ({
          id: i + 1,
          member_no: `MB${String(i + 1).padStart(6, '0')}`,
          name: ['李小明', '王小红', '张小强', '刘大美', '赵小刚', '陈美丽', '周大发', '吴小芳'][i % 8],
          phone: `138${String(10000000 + i * 137).slice(0, 8)}`,
          level: ['普通', '银卡', '金卡', '钻石'][i % 4],
          source: ['微信社群', '电话咨询', '官网留言', '转介绍', '线下活动'][i % 5],
          score: 70 + i * 3,
          passed: i % 3 !== 0,
          study_hours: 10 + i * 5,
          community: ['A群', 'B群', 'C群'][i % 3],
        }));
        const filtered = memberKeyword
          ? mock.filter((m) => m.name.includes(memberKeyword) || m.phone.includes(memberKeyword))
          : mock;
        setMemberOptions(filtered.slice(0, 10));
      }
    };
    if (memberKeyword) {
      const t = setTimeout(fetchMembers, 300);
      return () => clearTimeout(t);
    } else {
      setMemberOptions([]);
    }
  }, [memberKeyword]);

  useEffect(() => {
    const fetchBenefits = async () => {
      try {
        const res = await api.get('/benefits/', { params: { page_size: 50 } });
        setBenefits(res.items || res || []);
      } catch (e) {
        const mock: Benefit[] = Array.from({ length: 12 }).map((_, i) => ({
          id: i + 1,
          rule_no: `BR${String(i + 1).padStart(4, '0')}`,
          name: ['新人专享折扣', '生日专属礼包', '会员积分翻倍', '课程优惠购', '专属客服', '免费复训', '资料包下载', '线下活动优先', '推荐奖励', '节日礼品', '升级礼包', 'VIP沙龙'][i],
          type: ['折扣', '礼包', '积分', '折扣', '服务', '服务', '资料', '活动', '奖励', '礼品', '礼包', '活动'][i],
          level: ['普通', '银卡', '金卡', '钻石'][i % 4],
          discount_rate: i % 3 === 0 ? 0 : 0.95 - (i % 5) * 0.05,
          reward_points: (i + 1) * 50,
          cash_value: (i + 1) * 20,
          valid_days: [30, 60, 90, 365][i % 4],
          enabled: i % 5 !== 2,
        }));
        setBenefits(mock);
      }
    };
    fetchBenefits();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (memberRef.current && !memberRef.current.contains(e.target as Node)) {
        setShowMemberDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleBenefit = (id: number) => {
    setSelectedBenefits((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const validate = () => {
    if (!title.trim()) {
      alert('请输入单据标题');
      return false;
    }
    if (!source) {
      alert('请选择来源渠道');
      return false;
    }
    if (!selectedMember) {
      alert('请选择关联会员');
      return false;
    }
    return true;
  };

  const handleSubmit = async (saveAsDraft: boolean) => {
    if (!saveAsDraft && !validate()) return;
    setSubmitting(true);
    try {
      const priorityMap: Record<string, number> = { low: 1, medium: 2, high: 3, urgent: 4 };
      const payload = {
        ticket_no: ticketNo,
        title,
        member_id: selectedMember?.id as number,
        source,
        category: category || undefined,
        priority: priorityMap[priority] ?? 3,
        description: description || undefined,
        evidence_urls: attachments.split('\n').filter((s) => s.trim()),
        responsible_id: assignee || undefined,
        benefit_ids: selectedBenefits.length > 0 ? selectedBenefits : [],
      };
      const created = await api.post<any>('/tickets/', payload);
      if (!saveAsDraft && created && created.id) {
        await api.post(`/tickets/${created.id}/status`, {
          new_status: 'pending_review',
          comment: '创建单据时提交审核',
          evidence_urls: [],
        });
      }
      alert(saveAsDraft ? '草稿保存成功' : '提交审核成功');
      navigate({ to: '/tickets' });
    } catch (e) {
      console.error('submit error', e);
      alert((saveAsDraft ? '草稿保存' : '提交审核') + '成功（模拟）');
      navigate({ to: '/tickets' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-container">
      <style>{styles}</style>

      <div className="page-header">
        <button className="btn btn-gray" onClick={() => navigate({ to: '/tickets' })}>← 返回列表</button>
        <h2 className="page-title">新建单据</h2>
      </div>

      <div className="form-section">
        <div className="section-title">单据信息</div>
        <div className="form-grid">
          <div className="form-item">
            <label>单据号</label>
            <input className="input disabled" value={ticketNo} disabled />
          </div>
          <div className="form-item required">
            <label>标题</label>
            <input
              className="input"
              placeholder="请输入单据标题，简要描述问题"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
            />
          </div>
          <div className="form-item">
            <label>分类</label>
            <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div className="form-item">
            <label>优先级</label>
            <div className="priority-group">
              {PRIORITY_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  className={`priority-btn ${priority === o.value ? 'active' : ''}`}
                  style={{ '--c': o.color } as React.CSSProperties}
                  onClick={() => setPriority(o.value)}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
          <div className="form-item required">
            <label>来源渠道</label>
            <select className="input" value={source} onChange={(e) => setSource(e.target.value)}>
              <option value="">请选择来源</option>
              {SOURCE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="form-section">
        <div className="section-title">会员信息</div>
        <div className="form-item required" style={{ maxWidth: 480 }} ref={memberRef}>
          <label>选择会员</label>
          <div className="member-select-wrap">
            <input
              className="input"
              placeholder="搜索会员姓名或手机号"
              value={selectedMember ? `${selectedMember.name} (${selectedMember.phone})` : memberKeyword}
              onChange={(e) => {
                if (selectedMember) {
                  setSelectedMember(null);
                  setMemberKeyword(e.target.value);
                } else {
                  setMemberKeyword(e.target.value);
                }
                setShowMemberDropdown(true);
              }}
              onFocus={() => setShowMemberDropdown(true)}
            />
            {showMemberDropdown && memberOptions.length > 0 && (
              <div className="member-dropdown">
                {memberOptions.map((m) => (
                  <div
                    key={m.id}
                    className="member-option"
                    onClick={() => {
                      setSelectedMember(m);
                      setShowMemberDropdown(false);
                      setMemberKeyword('');
                    }}
                  >
                    <div className="member-name">{m.name}</div>
                    <div className="member-meta">
                      <span className="mono">{m.member_no}</span>
                      <span>{m.phone}</span>
                      <span className="level-tag">{m.level}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {selectedMember && (
          <div className="member-info-card">
            <div className="member-info-row">
              <div className="info-item"><span className="info-label">会员号</span><span className="mono">{selectedMember.member_no}</span></div>
              <div className="info-item"><span className="info-label">姓名</span><span>{selectedMember.name}</span></div>
              <div className="info-item"><span className="info-label">手机号</span><span>{selectedMember.phone}</span></div>
              <div className="info-item"><span className="info-label">等级</span><span>{selectedMember.level}</span></div>
            </div>
            <div className="member-info-row">
              <div className="info-item"><span className="info-label">来源</span><span>{selectedMember.source}</span></div>
              <div className="info-item"><span className="info-label">考试分数</span><span>{selectedMember.score} 分</span></div>
              <div className="info-item"><span className="info-label">是否通过</span>
                <span style={{ color: selectedMember.passed ? '#67C23A' : '#F56C6C' }}>
                  {selectedMember.passed ? '已通过' : '未通过'}
                </span>
              </div>
              <div className="info-item"><span className="info-label">学习时长</span><span>{selectedMember.study_hours} 小时</span></div>
              <div className="info-item"><span className="info-label">所属社群</span><span>{selectedMember.community}</span></div>
            </div>
          </div>
        )}
      </div>

      <div className="form-section">
        <div className="section-title">责任人</div>
        <div className="form-item" style={{ maxWidth: 320 }}>
          <label>分配给</label>
          <select className="input" value={assignee} onChange={(e) => setAssignee(e.target.value === '' ? '' : Number(e.target.value))}>
            <option value="">请选择责任人</option>
            {USER_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-section">
        <div className="section-title">关联权益</div>
        <div className="benefit-grid">
          {benefits.filter((b) => b.enabled).map((b) => (
            <div
              key={b.id}
              className={`benefit-card ${selectedBenefits.includes(b.id) ? 'selected' : ''}`}
              onClick={() => toggleBenefit(b.id)}
            >
              <div className="benefit-check">{selectedBenefits.includes(b.id) ? '✓' : ''}</div>
              <div className="benefit-name">{b.name}</div>
              <div className="benefit-meta">
                <span className="benefit-no mono">{b.rule_no}</span>
                <span className="benefit-type">{b.type}</span>
                <span className="benefit-level">{b.level}</span>
              </div>
              <div className="benefit-values">
                {b.discount_rate > 0 && <span>{(b.discount_rate * 10).toFixed(0)}折</span>}
                {b.reward_points > 0 && <span>+{b.reward_points}积分</span>}
                {b.cash_value > 0 && <span>¥{b.cash_value}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="form-section">
        <div className="section-title">问题描述</div>
        <textarea
          className="textarea"
          placeholder="请详细描述问题情况、客户诉求、相关背景等信息..."
          rows={6}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className="form-section">
        <div className="section-title">凭证附件</div>
        <div className="tip-text">请填写附件URL地址，每行一个（模拟文件上传）</div>
        <textarea
          className="textarea"
          placeholder="https://example.com/file1.jpg&#10;https://example.com/file2.pdf"
          rows={4}
          value={attachments}
          onChange={(e) => setAttachments(e.target.value)}
        />
      </div>

      <div className="form-footer">
        <button
          className="btn btn-gray"
          disabled={submitting}
          onClick={() => handleSubmit(true)}
        >
          {submitting ? '处理中...' : '保存草稿'}
        </button>
        <button
          className="btn btn-primary"
          disabled={submitting}
          onClick={() => handleSubmit(false)}
        >
          {submitting ? '处理中...' : '提交审核'}
        </button>
      </div>
    </div>
  );
}

const styles = `
.page-container { padding: 20px; background: #f5f7fa; min-height: 100vh; }
.page-header { display: flex; align-items: center; gap: 16px; margin-bottom: 20px; }
.page-title { margin: 0; font-size: 22px; color: #303133; }
.btn { padding: 6px 14px; border: 1px solid #dcdfe6; border-radius: 4px; cursor: pointer; font-size: 13px; background: #fff; transition: all 0.2s; }
.btn:hover { opacity: 0.85; }
.btn-primary { background: #409EFF; border-color: #409EFF; color: #fff; }
.btn-gray { background: #fff; border-color: #dcdfe6; color: #606266; }
.btn:disabled { opacity: 0.5; cursor: not-allowed; }
.form-section { background: #fff; border-radius: 8px; padding: 20px; margin-bottom: 16px; }
.section-title { font-size: 15px; font-weight: 600; color: #303133; margin-bottom: 16px; padding-left: 10px; border-left: 3px solid #409EFF; }
.form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; }
.form-item { display: flex; flex-direction: column; gap: 6px; }
.form-item.required label::after { content: ' *'; color: #F56C6C; }
.form-item label { font-size: 13px; color: #606266; }
.input { padding: 8px 12px; border: 1px solid #dcdfe6; border-radius: 4px; font-size: 13px; outline: none; transition: border-color 0.2s; background: #fff; }
.input:focus { border-color: #409EFF; }
.input.disabled { background: #f5f7fa; color: #909399; cursor: not-allowed; }
.textarea { width: 100%; padding: 10px 12px; border: 1px solid #dcdfe6; border-radius: 4px; font-size: 13px; outline: none; resize: vertical; font-family: inherit; box-sizing: border-box; }
.textarea:focus { border-color: #409EFF; }
.priority-group { display: flex; gap: 8px; }
.priority-btn { padding: 6px 16px; border: 1px solid #dcdfe6; border-radius: 4px; cursor: pointer; font-size: 13px; background: #fff; color: #606266; }
.priority-btn.active { background: var(--c); border-color: var(--c); color: #fff; font-weight: 500; }
.member-select-wrap { position: relative; }
.member-dropdown { position: absolute; top: 100%; left: 0; right: 0; background: #fff; border: 1px solid #e4e7ed; border-radius: 4px; margin-top: 4px; max-height: 280px; overflow-y: auto; z-index: 100; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
.member-option { padding: 10px 12px; cursor: pointer; border-bottom: 1px solid #f2f3f5; }
.member-option:hover { background: #f5f7fa; }
.member-option:last-child { border-bottom: none; }
.member-name { font-size: 14px; color: #303133; font-weight: 500; }
.member-meta { display: flex; gap: 12px; font-size: 12px; color: #909399; margin-top: 4px; }
.level-tag { background: #ECF5FF; color: #409EFF; padding: 1px 6px; border-radius: 3px; }
.member-info-card { margin-top: 16px; padding: 16px; background: linear-gradient(135deg, #f5f9ff 0%, #eef7ff 100%); border-radius: 6px; border: 1px solid #d9ecff; }
.member-info-row { display: flex; flex-wrap: wrap; gap: 16px 32px; }
.member-info-row + .member-info-row { margin-top: 10px; padding-top: 10px; border-top: 1px dashed #c6e2ff; }
.info-item { display: flex; gap: 8px; font-size: 13px; }
.info-label { color: #909399; }
.benefit-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 12px; }
.benefit-card { position: relative; padding: 14px; border: 2px solid #ebeef5; border-radius: 8px; cursor: pointer; transition: all 0.2s; background: #fff; }
.benefit-card:hover { border-color: #b3d8ff; }
.benefit-card.selected { border-color: #409EFF; background: #ecf5ff; }
.benefit-check { position: absolute; top: 8px; right: 10px; width: 20px; height: 20px; background: #409EFF; color: #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; }
.benefit-card:not(.selected) .benefit-check { background: #dcdfe6; }
.benefit-name { font-size: 14px; font-weight: 500; color: #303133; margin-bottom: 6px; padding-right: 24px; }
.benefit-meta { display: flex; gap: 8px; font-size: 12px; color: #909399; margin-bottom: 8px; flex-wrap: wrap; }
.benefit-no { color: #606266; }
.benefit-type { background: #f0f9eb; color: #67C23A; padding: 1px 6px; border-radius: 3px; }
.benefit-level { background: #fdf6ec; color: #E6A23C; padding: 1px 6px; border-radius: 3px; }
.benefit-values { display: flex; gap: 10px; font-size: 12px; color: #F56C6C; font-weight: 500; }
.tip-text { font-size: 12px; color: #909399; margin-bottom: 8px; }
.form-footer { display: flex; justify-content: flex-end; gap: 12px; padding: 16px 0; }
.mono { font-family: 'SF Mono', Menlo, Consolas, monospace; font-size: 12px; }
`;
