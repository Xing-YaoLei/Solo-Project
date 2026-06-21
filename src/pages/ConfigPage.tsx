import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useConfigStore, useRecordStore } from '@/stores';
import type { QuestionType } from '@/types/game';
import { QUESTIONS, LEVELS } from '@/mock/levels';
import {
  Home as HomeIcon, Settings, Layers, Gift, Calendar, Sliders,
  Plus, Trash2, Edit3, Save, X, Check, Star, Eye, EyeOff, UploadCloud,
  Database, Zap, Award, ChevronRight
} from 'lucide-react';
import { clsx } from 'clsx';

type TabType = 'questions' | 'materials' | 'rewards' | 'schedule' | 'modes';

export default function ConfigPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabType>('questions');
  const { levels, toggleLevelUnlock, saveAll } = useConfigStore();
  const { records } = useRecordStore();

  const typeMap: Record<QuestionType, { n: string; c: string; i: string }> = {
    rule: { n: '规则识别', c: 'bg-indigo-500/15 text-indigo-300 border-indigo-400/30', i: '📜' },
    evidence: { n: '证据选择', c: 'bg-cyan-500/15 text-cyan-300 border-cyan-400/30', i: '🔍' },
    settlement: { n: '结算排序', c: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30', i: '📊' },
    compensation: { n: '赔付判定', c: 'bg-rose-500/15 text-rose-300 border-rose-400/30', i: '💥' },
  };

  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

  const questionBank = QUESTIONS.map(q => ({
    id: q.id, type: q.type, title: q.title, difficulty: q.difficulty, score: q.score,
    correctRate: 0.4 + Math.random() * 0.55, usageCount: Math.floor(Math.random() * 200) + 10,
  }));

  const materials = [
    { id: 'm1', name: '骑手暴力配送录像-01.mp4', type: '视频', size: '38MB', tag: '赔付案例', uploader: '张经理', date: '2024-01-10' },
    { id: 'm2', name: '订单路线轨迹示例图.png', type: '图片', size: '1.2MB', tag: '申诉证据', uploader: '李运营', date: '2024-01-08' },
    { id: 'm3', name: '补贴规则对照表V3.xlsx', type: '文档', size: '48KB', tag: '规则文档', uploader: '系统', date: '2024-01-05' },
    { id: 'm4', name: '客户签收确认图.png', type: '图片', size: '780KB', tag: '申诉证据', uploader: '王主管', date: '2024-01-03' },
    { id: 'm5', name: '包装不当损坏图集.zip', type: '压缩包', size: '12MB', tag: '赔付案例', uploader: '赵经理', date: '2023-12-28' },
  ];

  const schedules = [
    { id: 's1', name: '工作日训练时段', start: '09:00', end: '18:00', days: [1, 2, 3, 4, 5], active: true },
    { id: 's2', name: '周末专项训练', start: '10:00', end: '20:00', days: [0, 6], active: false },
  ];

  const modes = [
    { id: 'm-classic', name: '经典闯关', icon: '🎯', desc: '标准题序与计时', types: '全部四题型', diff: '⭐~⭐⭐⭐⭐⭐', tm: '1.0x', sm: '1.0x' },
    { id: 'm-speed', name: '极速挑战', icon: '⚡', desc: '时间减半积分加倍', types: '全部四题型', diff: '⭐⭐~⭐⭐⭐⭐⭐', tm: '0.5x', sm: '1.5x' },
    { id: 'm-master', name: '大师考核', icon: '👑', desc: '高难度严格评分', types: '全部四题型', diff: '⭐⭐⭐⭐~⭐⭐⭐⭐⭐', tm: '0.8x', sm: '2.0x' },
  ];

  const badges = [
    { id: 'b1', name: '初出茅庐', icon: '🌱', desc: '完成首次关卡训练', cond: '完成1个关卡', pts: 10, ok: (records?.length || 0) >= 1 },
    { id: 'b2', name: '三星达人', icon: '✨', desc: '任意关卡获得3星', cond: '任意关卡得3星', pts: 50, ok: levels?.some((l: any) => l.stars >= 3) },
    { id: 'b3', name: '闪电侠', icon: '⚡', desc: '预估时间50%内完成', cond: '快速完成训练', pts: 80, ok: false },
    { id: 'b4', name: '规则大师', icon: '📜', desc: '规则识别题100%正确', cond: '规则题全对', pts: 60, ok: false },
    { id: 'b5', name: '全能调度师', icon: '🏆', desc: '所有关卡均通关', cond: '通关全部关卡', pts: 200, ok: levels?.every((l: any) => l.completed) },
  ];

  const tabs: { k: TabType; n: string; i: any; c: string }[] = [
    { k: 'questions', n: '题目题库', i: Database, c: 'from-indigo-500/20 to-indigo-500/5' },
    { k: 'materials', n: '素材管理', i: UploadCloud, c: 'from-cyan-500/20 to-cyan-500/5' },
    { k: 'rewards', n: '奖励徽章', i: Gift, c: 'from-amber-500/20 to-amber-500/5' },
    { k: 'schedule', n: '开放时间', i: Calendar, c: 'from-emerald-500/20 to-emerald-500/5' },
    { k: 'modes', n: '训练模式', i: Sliders, c: 'from-rose-500/20 to-rose-500/5' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-950 to-slate-950 text-slate-100">
      <div className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between gap-4 mb-7 flex-wrap">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/')} className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-slate-900/60 text-slate-300 hover:bg-slate-800 hover:text-white transition">
              <HomeIcon className="h-4 w-4" />
            </button>
            <div>
              <h1 className="text-2xl font-black text-white flex items-center gap-2"><Settings className="h-6 w-6 text-rose-400" />配置管理中心</h1>
              <p className="text-xs text-slate-400 mt-0.5">Admin Configuration · 城市经理后台管理</p>
            </div>
          </div>
          <button onClick={() => { saveAll(); alert('配置已保存'); }} className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-4 py-2.5 text-xs font-black text-white shadow-lg shadow-emerald-500/20">
            <Save className="h-3.5 w-3.5" /> 保存全局配置
          </button>
        </header>

        <div className="flex flex-col lg:flex-row gap-5">
          <aside className="flex lg:flex-col gap-2 overflow-x-auto lg:w-56 flex-shrink-0">
            {tabs.map(t => {
              const Ic = t.i; const active = tab === t.k;
              return (
                <button key={t.k} onClick={() => setTab(t.k)} className={clsx(
                  'flex items-center gap-2.5 rounded-2xl border px-4 py-3 text-left transition-all flex-shrink-0',
                  active ? `border-white/15 bg-gradient-to-r ${t.c} shadow-lg` : 'border-white/10 bg-slate-900/40 hover:bg-slate-800/60'
                )}>
                  <div className={clsx('flex h-9 w-9 items-center justify-center rounded-xl', active ? 'bg-white/15' : 'bg-slate-800/60')}>
                    <Ic className={clsx('h-4 w-4', active ? 'text-white' : 'text-slate-400')} />
                  </div>
                  <div>
                    <p className={clsx('text-sm font-black', active ? 'text-white' : 'text-slate-300')}>{t.n}</p>
                  </div>
                </button>
              );
            })}
          </aside>

          <main className="flex-1 min-w-0 space-y-4">
            {tab === 'questions' && (
              <>
                <Card title="题目题库" desc="维护四种题型的题目内容、难度与分值" btn={{ label: '新建题目', i: Plus }}>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="text-[10px] uppercase tracking-wider text-slate-400 bg-slate-800/40">
                        <tr>
                          <th className="px-4 py-3 text-left">#</th>
                          <th className="px-4 py-3 text-left">题型</th>
                          <th className="px-4 py-3 text-left">题目标题</th>
                          <th className="px-4 py-3 text-center">难度</th>
                          <th className="px-4 py-3 text-right">分值</th>
                          <th className="px-4 py-3 text-center">正确率</th>
                          <th className="px-4 py-3 text-right">操作</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {questionBank.map((q, idx) => {
                          const info = typeMap[q.type];
                          return (
                            <tr key={q.id} className="hover:bg-white/5 transition-colors">
                              <td className="px-4 py-3 text-xs text-slate-500 font-mono">{String(idx + 1).padStart(2, '0')}</td>
                              <td className="px-4 py-3">
                                <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${info.c}`}>
                                  <span>{info.i}</span>{info.n}
                                </span>
                              </td>
                              <td className="px-4 py-3 font-bold text-white">{q.title}<p className="text-[10px] text-slate-500 font-normal">引用 {q.usageCount} 次</p></td>
                              <td className="px-4 py-3 text-center text-amber-300">{'⭐'.repeat(q.difficulty)}</td>
                              <td className="px-4 py-3 text-right font-black text-white">{q.score}</td>
                              <td className="px-4 py-3 text-center"><span className={clsx('font-bold text-xs', q.correctRate >= 0.7 ? 'text-emerald-300' : q.correctRate >= 0.5 ? 'text-amber-300' : 'text-rose-300')}>{(q.correctRate * 100).toFixed(0)}%</span></td>
                              <td className="px-4 py-3 text-right">
                                <div className="flex justify-end gap-1">
                                  <button className="rounded-md border border-white/10 px-2 py-1 text-[11px] font-bold text-slate-300 hover:bg-white/5"><Edit3 className="h-3 w-3 inline mr-0.5" />编辑</button>
                                  <button className="rounded-md border border-rose-400/20 px-2 py-1 text-[11px] font-bold text-rose-300 hover:bg-rose-500/10"><Trash2 className="h-3 w-3 inline mr-0.5" />删除</button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </Card>

                <Card title="关卡解锁管理" desc="控制学员可访问的关卡范围">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {levels?.map((l: any) => (
                      <div key={l.id} className="rounded-xl border border-white/10 bg-slate-800/40 p-4">
                        <div className="flex items-center gap-3 mb-2.5">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl text-xl border border-white/10" style={{ background: `linear-gradient(135deg, ${l.color}40, ${l.color}15)` }}>{l.icon}</div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-white truncate">{l.name}</p>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              {[1, 2, 3].map(n => (<Star key={n} className={clsx('inline h-3 w-3', n <= l.stars ? 'text-amber-400 fill-amber-400' : 'text-slate-700')} />))}
                              <span className="ml-2">最佳 {l.bestScore}/{l.totalScore}</span>
                            </div>
                          </div>
                        </div>
                        <button onClick={() => toggleLevelUnlock(l.id)} className={clsx(
                          'w-full flex items-center justify-center gap-1.5 rounded-lg border px-3 py-1.5 text-[11px] font-bold transition',
                          l.unlocked ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20' : 'border-slate-500/30 bg-slate-800/40 text-slate-400 hover:bg-slate-700/40'
                        )}>
                          {l.unlocked ? <><Eye className="h-3 w-3" />已解锁</> : <><EyeOff className="h-3 w-3" />已锁定</>}
                        </button>
                      </div>
                    ))}
                  </div>
                </Card>
              </>
            )}

            {tab === 'materials' && (
              <Card title="素材资源管理" desc="管理图片、视频、文档等训练素材" btn={{ label: '上传素材', i: UploadCloud }}>
                <table className="w-full text-sm">
                  <thead className="text-[10px] uppercase tracking-wider text-slate-400 bg-slate-800/40">
                    <tr>
                      <th className="px-4 py-3 text-left">素材名称</th>
                      <th className="px-4 py-3 text-left">类型/标签</th>
                      <th className="px-4 py-3 text-right">大小</th>
                      <th className="px-4 py-3 text-left">上传者/日期</th>
                      <th className="px-4 py-3 text-right">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {materials.map(m => (
                      <tr key={m.id} className="hover:bg-white/5">
                        <td className="px-4 py-3.5 flex items-center gap-3 font-bold text-white">
                          <span className="flex h-10 w-10 items-center justify-center rounded-xl text-xl border border-white/10 bg-gradient-to-br from-cyan-500/25 to-indigo-500/15">
                            {m.type === '图片' ? '🖼️' : m.type === '视频' ? '🎬' : m.type === '文档' ? '📄' : '🗜️'}
                          </span>{m.name}
                        </td>
                        <td className="px-4 py-3.5 space-y-1">
                          <div><span className="rounded-md bg-slate-700/60 px-2 py-0.5 text-[10px] font-bold text-slate-300 mr-1">{m.type}</span></div>
                          <div><span className="rounded-md bg-cyan-500/15 text-cyan-300 px-2 py-0.5 text-[10px] font-bold">{m.tag}</span></div>
                        </td>
                        <td className="px-4 py-3.5 text-right text-xs text-slate-300">{m.size}</td>
                        <td className="px-4 py-3.5"><p className="text-xs font-bold text-white">{m.uploader}</p><p className="text-[10px] text-slate-500">{m.date}</p></td>
                        <td className="px-4 py-3.5 text-right">
                          <div className="flex justify-end gap-1">
                            <button className="rounded-md border border-white/10 px-2 py-1 text-[11px] font-bold text-slate-300 hover:bg-white/5">预览</button>
                            <button className="rounded-md border border-rose-400/20 px-2 py-1 text-[11px] font-bold text-rose-300 hover:bg-rose-500/10"><Trash2 className="h-3 w-3 inline mr-0.5" />移除</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            )}

            {tab === 'rewards' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card title="积分奖励规则" desc="设置各项行为的积分奖励">
                    <div className="space-y-3">
                      {[
                        { l: '每道正确题目', v: '5 分/题' }, { l: '满分达成奖励', v: '50 分' },
                        { l: '快速完成奖励', v: '30 分' }, { l: '3星通关加成', v: '100% 额外' },
                      ].map(x => (
                        <div key={x.l} className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-800/40 px-4 py-3">
                          <span className="text-xs font-bold text-slate-200">{x.l}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-black text-amber-300">{x.v}</span>
                            <Edit3 className="h-3.5 w-3.5 text-slate-500 hover:text-white cursor-pointer" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                  <Card title="星级阈值设置" desc="控制三星评级的正确率门槛">
                    <div className="space-y-3">
                      {[
                        { n: '1星（及格）', v: '60%', d: '达到及格线', c: 'from-amber-500/20' },
                        { n: '2星（良好）', v: '80%', d: '掌握较好', c: 'from-amber-400/30' },
                        { n: '3星（优秀）', v: '95%', d: '完全掌握', c: 'from-amber-300/40' },
                      ].map(s => (
                        <div key={s.n} className={`rounded-xl border border-white/10 bg-gradient-to-r ${s.c} to-slate-800/40 p-4`}>
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-bold text-white">{s.n}<span className="ml-1 text-amber-400">{'★'.repeat(parseInt(s.n.charAt(0)))}</span></p>
                            <p className="text-sm font-black text-amber-300">≥ {s.v}</p>
                          </div>
                          <p className="text-[10px] text-slate-400">{s.d}</p>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
                <Card title="徽章成就系统" desc={`${badges.filter(b => b.ok).length}/${badges.length} 已解锁`}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {badges.map(b => (
                      <div key={b.id} className={clsx(
                        'relative overflow-hidden rounded-2xl border p-4 transition',
                        b.ok ? 'border-amber-400/30 bg-gradient-to-br from-amber-500/15 to-slate-800/40' : 'border-white/10 bg-slate-800/30 opacity-60'
                      )}>
                        <div className="flex items-center gap-3">
                          <div className={clsx('flex h-12 w-12 items-center justify-center rounded-xl text-2xl border', b.ok ? 'border-amber-400/30 bg-gradient-to-br from-amber-500/30 to-amber-500/10' : 'border-white/5 bg-slate-900/60 grayscale')}>{b.icon}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-black text-white truncate">{b.name}</p>
                              {b.ok && <span className="rounded-full bg-emerald-500/15 text-emerald-300 px-2 py-0.5 text-[9px] font-black border border-emerald-400/20">已解锁</span>}
                            </div>
                            <p className="text-[10px] text-slate-400 mt-0.5">{b.desc}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5">条件: {b.cond}</p>
                          </div>
                        </div>
                        <div className="mt-3 flex items-center justify-between pt-2 border-t border-white/5">
                          <span className="text-[10px] text-slate-500">奖励</span>
                          <span className="text-xs font-black text-amber-300">+{b.pts} pt</span>
                        </div>
                      </div>
                    ))}
                    <button className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-white/10 bg-slate-800/20 p-4 text-slate-400 min-h-[140px] hover:bg-slate-800/40 hover:text-white hover:border-white/20">
                      <Plus className="h-6 w-6" /><p className="text-xs font-bold">添加新徽章</p>
                    </button>
                  </div>
                </Card>
              </>
            )}

            {tab === 'schedule' && (
              <Card title="训练开放时间配置" desc="配置学员可训练的时间段" btn={{ label: '新增时段', i: Plus }}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {schedules.map(s => (
                    <div key={s.id} className={clsx(
                      'rounded-2xl border p-5',
                      s.active ? 'border-emerald-400/20 bg-slate-900/60' : 'border-white/10 bg-slate-800/40 opacity-70'
                    )}>
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-base font-black text-white">{s.name}</p>
                            <span className={clsx('rounded-full px-2 py-0.5 text-[10px] font-black border', s.active ? 'bg-emerald-500/15 text-emerald-300 border-emerald-400/20' : 'bg-slate-700/60 text-slate-400 border-white/5')}>{s.active ? '已启用' : '已停用'}</span>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <button className="rounded-md p-1.5 border border-white/10 text-slate-400 hover:bg-white/5 hover:text-white"><Edit3 className="h-3.5 w-3.5" /></button>
                          <button className="rounded-md p-1.5 border border-rose-400/20 text-rose-300 hover:bg-rose-500/10"><Trash2 className="h-3.5 w-3.5" /></button>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 rounded-xl border border-white/10 bg-black/20 px-4 py-3 mb-3">
                        <Calendar className="h-5 w-5 text-cyan-400 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-[10px] uppercase tracking-wider text-slate-500">训练时间</p>
                          <p className="text-lg font-black text-white">{s.start} <span className="text-slate-500 mx-1.5">—</span> {s.end}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-2">适用星期</p>
                        <div className="flex gap-1.5 flex-wrap">
                          {weekDays.map((d, i) => {
                            const ok = s.days.includes(i);
                            return (
                              <span key={d} className={clsx(
                                'flex h-8 w-8 items-center justify-center rounded-lg text-xs font-black',
                                ok ? 'bg-gradient-to-br from-emerald-500/30 to-cyan-500/20 text-white border border-emerald-400/30' : 'bg-slate-800/60 text-slate-500 border border-white/5'
                              )}>{d}</span>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                  <button className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-white/10 bg-slate-800/20 text-slate-400 p-8 min-h-[260px] hover:bg-slate-800/40 hover:text-white hover:border-white/20 transition">
                    <Plus className="h-8 w-8" /><p className="text-sm font-bold">添加新的开放时段</p>
                    <p className="text-xs text-slate-500 max-w-[180px] text-center">可按时间段、星期灵活配置训练可访问范围</p>
                  </button>
                </div>
              </Card>
            )}

            {tab === 'modes' && (
              <Card title="训练模式配置" desc="不同模式下的时间倍率、计分倍率设置" btn={{ label: '新增模式', i: Plus }}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {modes.map(m => (
                    <div key={m.id} className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-800/60 to-slate-900/40 p-6 hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all">
                      <div className="text-5xl mb-3">{m.icon}</div>
                      <h3 className="text-xl font-black text-white mb-1">{m.name}</h3>
                      <p className="text-xs text-slate-400 mb-4 leading-relaxed">{m.desc}</p>
                      <div className="space-y-2 rounded-xl border border-white/5 bg-black/20 p-3 mb-4">
                        {[
                          { l: '包含题型', v: m.types }, { l: '难度范围', v: m.diff },
                          { l: '时间倍率', v: m.tm, h: 'text-cyan-300' }, { l: '得分倍率', v: m.sm, h: 'text-amber-300' },
                        ].map(x => (
                          <div key={x.l} className="flex items-center justify-between text-xs">
                            <span className="text-slate-500">{x.l}</span>
                            <span className={clsx('font-bold', x.h || 'text-slate-200')}>{x.v}</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <button className="flex-1 rounded-xl bg-white/5 border border-white/10 py-2 text-xs font-bold text-slate-300 hover:bg-white/10 transition"><Edit3 className="h-3 w-3 inline mr-1" />编辑</button>
                        <button className="rounded-xl bg-gradient-to-r from-indigo-500/30 to-cyan-500/30 border border-cyan-400/20 px-4 py-2 text-xs font-black text-cyan-200 hover:from-indigo-500/50 hover:to-cyan-500/50 transition"><ChevronRight className="h-3 w-3" /></button>
                      </div>
                    </div>
                  ))}
                  <button className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-white/10 bg-slate-800/20 p-6 text-slate-400 min-h-[280px] hover:bg-slate-800/40 hover:text-white hover:border-white/20 transition">
                    <Plus className="h-7 w-7" /><p className="text-sm font-bold">添加训练模式</p>
                    <p className="text-xs text-slate-500 text-center max-w-[160px]">自定义题型范围、难度与倍率</p>
                  </button>
                </div>
              </Card>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

function Card({ title, desc, btn, children }: { title: string; desc?: string; btn?: { label: string; i: any }; children: any }) {
  const BtnI = btn?.i;
  return (
    <section className="rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 flex-wrap gap-2">
        <div>
          <h3 className="text-sm font-black text-white">{title}</h3>
          {desc && <p className="text-[11px] text-slate-400 mt-0.5">{desc}</p>}
        </div>
        {btn && BtnI && (
          <button className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 px-3.5 py-2 text-xs font-black text-white shadow-lg shadow-indigo-500/20">
            <BtnI className="h-3.5 w-3.5" />{btn.label}
          </button>
        )}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}
