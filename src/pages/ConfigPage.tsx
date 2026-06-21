import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useConfigStore, useRecordStore } from '@/stores';
import type { QuestionType } from '@/types/game';
import type { QuestionBankItem, AssetItem, OpenSchedule, TrainingMode, Badge } from '@/types/config';
import {
  Home as HomeIcon, Settings, Layers, Gift, Calendar, Sliders,
  Plus, Trash2, Edit3, Save, X, Check, Star, Eye, EyeOff, UploadCloud,
  Database, Zap, Award, ChevronRight, ToggleLeft, ToggleRight
} from 'lucide-react';
import { clsx } from 'clsx';

type TabType = 'questions' | 'materials' | 'rewards' | 'schedule' | 'modes';

const typeMap: Record<QuestionType, { n: string; c: string; i: string }> = {
  rule: { n: '规则识别', c: 'bg-indigo-500/15 text-indigo-300 border-indigo-400/30', i: '📜' },
  evidence: { n: '证据选择', c: 'bg-cyan-500/15 text-cyan-300 border-cyan-400/30', i: '🔍' },
  settlement: { n: '结算排序', c: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30', i: '📊' },
  compensation: { n: '赔付判定', c: 'bg-rose-500/15 text-rose-300 border-rose-400/30', i: '💥' },
};

const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

const EMPTY_QUESTION: Partial<QuestionBankItem> = {
  type: 'rule',
  title: '',
  difficulty: 1,
  score: 10,
  status: 'draft',
};

const EMPTY_SCHEDULE: Partial<OpenSchedule> = {
  name: '',
  startTime: '09:00',
  endTime: '18:00',
  daysOfWeek: [1, 2, 3, 4, 5],
  levelIds: [],
  active: true,
};

const EMPTY_MODE: Partial<TrainingMode> = {
  name: '',
  description: '',
  icon: '🎯',
  questionTypes: ['rule', 'evidence', 'settlement', 'compensation'],
  difficultyRange: [1, 5],
  timeMultiplier: 1.0,
  scoreMultiplier: 1.0,
};

const EMPTY_BADGE: Partial<Badge> = {
  name: '',
  description: '',
  icon: '🏅',
  condition: '',
  points: 10,
  unlocked: false,
};

const EMPTY_ASSET: Partial<AssetItem> = {
  type: 'image',
  name: '',
  url: '',
  tag: '',
  size: 0,
};

export default function ConfigPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabType>('questions');

  const {
    questionBank, assets, rewards, openSchedules, trainingModes, levels,
    loadAll, saveAll, saveQuestion, deleteQuestion,
    updateRewards, updateBadge, addBadge, removeBadge,
    saveSchedule, deleteSchedule, toggleScheduleActive,
    saveAsset, deleteAsset,
    saveTrainingMode, deleteTrainingMode,
    toggleLevelUnlock,
  } = useConfigStore();

  const { records } = useRecordStore();

  const [editingQuestion, setEditingQuestion] = useState<Partial<QuestionBankItem> | null>(null);
  const [editingSchedule, setEditingSchedule] = useState<Partial<OpenSchedule> | null>(null);
  const [editingMode, setEditingMode] = useState<Partial<TrainingMode> | null>(null);
  const [editingBadge, setEditingBadge] = useState<Partial<Badge> | null>(null);
  const [editingAsset, setEditingAsset] = useState<Partial<AssetItem> | null>(null);
  const [editingRewardField, setEditingRewardField] = useState<string | null>(null);
  const [rewardInput, setRewardInput] = useState<string>('');
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => { loadAll(); }, [loadAll]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  };

  const handleSaveQuestion = () => {
    if (!editingQuestion || !editingQuestion.title) return;
    saveQuestion(editingQuestion as QuestionBankItem);
    setEditingQuestion(null);
    showToast('题目已保存');
  };

  const handleSaveSchedule = () => {
    if (!editingSchedule || !editingSchedule.name) return;
    saveSchedule(editingSchedule as OpenSchedule);
    setEditingSchedule(null);
    showToast('时段已保存');
  };

  const handleSaveMode = () => {
    if (!editingMode || !editingMode.name) return;
    saveTrainingMode(editingMode as TrainingMode);
    setEditingMode(null);
    showToast('模式已保存');
  };

  const handleSaveBadge = () => {
    if (!editingBadge || !editingBadge.name) return;
    addBadge(editingBadge as Badge);
    setEditingBadge(null);
    showToast('徽章已添加');
  };

  const handleSaveAsset = () => {
    if (!editingAsset || !editingAsset.name) return;
    saveAsset(editingAsset as AssetItem);
    setEditingAsset(null);
    showToast('素材已保存');
  };

  const handleRewardEdit = (field: string, currentVal: number) => {
    setEditingRewardField(field);
    setRewardInput(String(currentVal));
  };

  const handleRewardSave = (field: string) => {
    const val = Number(rewardInput);
    if (isNaN(val)) return;
    const newRewards = { ...rewards, [field]: val };
    updateRewards(newRewards);
    setEditingRewardField(null);
    showToast('奖励配置已更新');
  };

  const tabs: { k: TabType; n: string; i: any; c: string }[] = [
    { k: 'questions', n: '题目题库', i: Database, c: 'from-indigo-500/20 to-indigo-500/5' },
    { k: 'materials', n: '素材管理', i: UploadCloud, c: 'from-cyan-500/20 to-cyan-500/5' },
    { k: 'rewards', n: '奖励徽章', i: Gift, c: 'from-amber-500/20 to-amber-500/5' },
    { k: 'schedule', n: '开放时间', i: Calendar, c: 'from-emerald-500/20 to-emerald-500/5' },
    { k: 'modes', n: '训练模式', i: Sliders, c: 'from-rose-500/20 to-rose-500/5' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-950 to-slate-950 text-slate-100">
      {toast && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-500/15 px-4 py-2.5 text-sm font-bold text-emerald-300 shadow-lg backdrop-blur animate-in slide-in-from-top-2">
          <Check className="h-4 w-4" />{toast}
        </div>
      )}

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
          <button onClick={() => { saveAll(); showToast('全局配置已保存'); }} className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-4 py-2.5 text-xs font-black text-white shadow-lg shadow-emerald-500/20">
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
                  <p className={clsx('text-sm font-black', active ? 'text-white' : 'text-slate-300')}>{t.n}</p>
                </button>
              );
            })}
          </aside>

          <main className="flex-1 min-w-0 space-y-4">
            {tab === 'questions' && (
              <>
                <Card title="题目题库" desc="维护四种题型的题目内容、难度与分值" onBtn={() => setEditingQuestion({ ...EMPTY_QUESTION })} btnLabel="新建题目" BtnIcon={Plus}>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="text-[10px] uppercase tracking-wider text-slate-400 bg-slate-800/40">
                        <tr>
                          <th className="px-4 py-3 text-left">#</th>
                          <th className="px-4 py-3 text-left">题型</th>
                          <th className="px-4 py-3 text-left">题目标题</th>
                          <th className="px-4 py-3 text-center">难度</th>
                          <th className="px-4 py-3 text-right">分值</th>
                          <th className="px-4 py-3 text-center">状态</th>
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
                              <td className="px-4 py-3 font-bold text-white">{q.title}<p className="text-[10px] text-slate-500 font-normal">引用 {q.usageCount} 次 · 正确率 {(q.correctRate * 100).toFixed(0)}%</p></td>
                              <td className="px-4 py-3 text-center text-amber-300">{'⭐'.repeat(q.difficulty)}</td>
                              <td className="px-4 py-3 text-right font-black text-white">{q.score}</td>
                              <td className="px-4 py-3 text-center">
                                <span className={clsx('rounded-full px-2 py-0.5 text-[10px] font-bold border',
                                  q.status === 'published' ? 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30' :
                                  q.status === 'draft' ? 'bg-amber-500/15 text-amber-300 border-amber-400/30' :
                                  'bg-slate-500/15 text-slate-300 border-slate-400/30'
                                )}>{q.status === 'published' ? '已发布' : q.status === 'draft' ? '草稿' : '已归档'}</span>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <div className="flex justify-end gap-1">
                                  <button onClick={() => setEditingQuestion({ ...q })} className="rounded-md border border-white/10 px-2 py-1 text-[11px] font-bold text-slate-300 hover:bg-white/5"><Edit3 className="h-3 w-3 inline mr-0.5" />编辑</button>
                                  <button onClick={() => { deleteQuestion(q.id); showToast('题目已删除'); }} className="rounded-md border border-rose-400/20 px-2 py-1 text-[11px] font-bold text-rose-300 hover:bg-rose-500/10"><Trash2 className="h-3 w-3 inline mr-0.5" />删除</button>
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
                    {levels.map((l: any) => (
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
                        <button onClick={() => { toggleLevelUnlock(l.id); showToast(l.unlocked ? '关卡已锁定' : '关卡已解锁'); }} className={clsx(
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
              <Card title="素材资源管理" desc="管理图片、视频、文档等训练素材" onBtn={() => setEditingAsset({ ...EMPTY_ASSET })} btnLabel="上传素材" BtnIcon={UploadCloud}>
                <table className="w-full text-sm">
                  <thead className="text-[10px] uppercase tracking-wider text-slate-400 bg-slate-800/40">
                    <tr>
                      <th className="px-4 py-3 text-left">素材名称</th>
                      <th className="px-4 py-3 text-left">类型/标签</th>
                      <th className="px-4 py-3 text-right">大小</th>
                      <th className="px-4 py-3 text-left">上传时间</th>
                      <th className="px-4 py-3 text-right">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {assets.map(m => (
                      <tr key={m.id} className="hover:bg-white/5">
                        <td className="px-4 py-3.5 flex items-center gap-3 font-bold text-white">
                          <span className="flex h-10 w-10 items-center justify-center rounded-xl text-xl border border-white/10 bg-gradient-to-br from-cyan-500/25 to-indigo-500/15">
                            {m.type === 'image' ? '🖼️' : m.type === 'audio' ? '🔊' : '📦'}
                          </span>{m.name}
                        </td>
                        <td className="px-4 py-3.5 space-y-1">
                          <div><span className="rounded-md bg-slate-700/60 px-2 py-0.5 text-[10px] font-bold text-slate-300 mr-1">{m.type}</span></div>
                          <div><span className="rounded-md bg-cyan-500/15 text-cyan-300 px-2 py-0.5 text-[10px] font-bold">{m.tag}</span></div>
                        </td>
                        <td className="px-4 py-3.5 text-right text-xs text-slate-300">{(m.size / 1024).toFixed(0)} KB</td>
                        <td className="px-4 py-3.5 text-xs text-slate-400">{new Date(m.uploadedAt).toLocaleDateString()}</td>
                        <td className="px-4 py-3.5 text-right">
                          <div className="flex justify-end gap-1">
                            <button onClick={() => setEditingAsset({ ...m })} className="rounded-md border border-white/10 px-2 py-1 text-[11px] font-bold text-slate-300 hover:bg-white/5"><Edit3 className="h-3 w-3 inline mr-0.5" />编辑</button>
                            <button onClick={() => { deleteAsset(m.id); showToast('素材已移除'); }} className="rounded-md border border-rose-400/20 px-2 py-1 text-[11px] font-bold text-rose-300 hover:bg-rose-500/10"><Trash2 className="h-3 w-3 inline mr-0.5" />移除</button>
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
                      {([
                        { key: 'pointsPerCorrectAnswer', label: '每道正确题目', unit: '分/题' },
                        { key: 'bonusForPerfectScore', label: '满分达成奖励', unit: '分' },
                        { key: 'bonusForFastCompletion', label: '快速完成奖励', unit: '分' },
                      ] as const).map(x => (
                        <div key={x.key} className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-800/40 px-4 py-3">
                          <span className="text-xs font-bold text-slate-200">{x.label}</span>
                          <div className="flex items-center gap-2">
                            {editingRewardField === x.key ? (
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  value={rewardInput}
                                  onChange={e => setRewardInput(e.target.value)}
                                  className="w-16 rounded-lg border border-white/10 bg-slate-900/60 px-2 py-1 text-xs text-white text-center focus:outline-none focus:border-indigo-400/50"
                                  autoFocus
                                  onKeyDown={e => e.key === 'Enter' && handleRewardSave(x.key)}
                                />
                                <button onClick={() => handleRewardSave(x.key)} className="rounded-md p-1 text-emerald-400 hover:bg-emerald-500/10"><Check className="h-3.5 w-3.5" /></button>
                                <button onClick={() => setEditingRewardField(null)} className="rounded-md p-1 text-slate-400 hover:bg-white/5"><X className="h-3.5 w-3.5" /></button>
                              </div>
                            ) : (
                              <>
                                <span className="text-sm font-black text-amber-300">{(rewards as any)[x.key]} {x.unit}</span>
                                <Edit3 className="h-3.5 w-3.5 text-slate-500 hover:text-white cursor-pointer" onClick={() => handleRewardEdit(x.key, (rewards as any)[x.key])} />
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                  <Card title="星级阈值设置" desc="控制三星评级的正确率门槛">
                    <div className="space-y-3">
                      {[
                        { n: '1星（及格）', v: rewards.starsThresholds[0], d: '达到及格线', c: 'from-amber-500/20', idx: 0 },
                        { n: '2星（良好）', v: rewards.starsThresholds[1], d: '掌握较好', c: 'from-amber-400/30', idx: 1 },
                        { n: '3星（优秀）', v: rewards.starsThresholds[2], d: '完全掌握', c: 'from-amber-300/40', idx: 2 },
                      ].map(s => (
                        <div key={s.idx} className={`rounded-xl border border-white/10 bg-gradient-to-r ${s.c} to-slate-800/40 p-4`}>
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-bold text-white">{s.n}<span className="ml-1 text-amber-400">{'★'.repeat(s.idx + 1)}</span></p>
                            <div className="flex items-center gap-2">
                              {editingRewardField === `stars_${s.idx}` ? (
                                <>
                                  <input type="number" value={rewardInput} onChange={e => setRewardInput(e.target.value)} className="w-14 rounded-lg border border-white/10 bg-slate-900/60 px-2 py-1 text-xs text-white text-center focus:outline-none focus:border-indigo-400/50" autoFocus onKeyDown={e => { if (e.key === 'Enter') { const val = Number(rewardInput); if (!isNaN(val)) { const newT = [...rewards.starsThresholds] as [number, number, number]; newT[s.idx] = val; updateRewards({ ...rewards, starsThresholds: newT }); setEditingRewardField(null); showToast('星级阈值已更新'); } } }} />
                                  <button onClick={() => setEditingRewardField(null)} className="rounded-md p-1 text-slate-400 hover:bg-white/5"><X className="h-3.5 w-3.5" /></button>
                                </>
                              ) : (
                                <>
                                  <p className="text-sm font-black text-amber-300">≥ {s.v}%</p>
                                  <Edit3 className="h-3.5 w-3.5 text-slate-500 hover:text-white cursor-pointer" onClick={() => { setEditingRewardField(`stars_${s.idx}`); setRewardInput(String(s.v)); }} />
                                </>
                              )}
                            </div>
                          </div>
                          <p className="text-[10px] text-slate-400">{s.d}</p>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
                <Card title="徽章成就系统" desc={`${rewards.badges.filter(b => b.unlocked).length}/${rewards.badges.length} 已解锁`} onBtn={() => setEditingBadge({ ...EMPTY_BADGE })} btnLabel="添加徽章" BtnIcon={Plus}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {rewards.badges.map(b => (
                      <div key={b.id} className={clsx(
                        'relative overflow-hidden rounded-2xl border p-4 transition',
                        b.unlocked ? 'border-amber-400/30 bg-gradient-to-br from-amber-500/15 to-slate-800/40' : 'border-white/10 bg-slate-800/30 opacity-60'
                      )}>
                        <div className="flex items-center gap-3">
                          <div className={clsx('flex h-12 w-12 items-center justify-center rounded-xl text-2xl border', b.unlocked ? 'border-amber-400/30 bg-gradient-to-br from-amber-500/30 to-amber-500/10' : 'border-white/5 bg-slate-900/60 grayscale')}>{b.icon}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-black text-white truncate">{b.name}</p>
                              {b.unlocked && <span className="rounded-full bg-emerald-500/15 text-emerald-300 px-2 py-0.5 text-[9px] font-black border border-emerald-400/20">已解锁</span>}
                            </div>
                            <p className="text-[10px] text-slate-400 mt-0.5">{b.description}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5">条件: {b.condition}</p>
                          </div>
                        </div>
                        <div className="mt-3 flex items-center justify-between pt-2 border-t border-white/5">
                          <span className="text-[10px] text-slate-500">奖励</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-amber-300">+{b.points} pt</span>
                            <button onClick={() => { removeBadge(b.id); showToast('徽章已删除'); }} className="rounded-md p-1 text-rose-400 hover:bg-rose-500/10"><Trash2 className="h-3 w-3" /></button>
                          </div>
                        </div>
                      </div>
                    ))}
                    <button onClick={() => setEditingBadge({ ...EMPTY_BADGE })} className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-white/10 bg-slate-800/20 p-4 text-slate-400 min-h-[140px] hover:bg-slate-800/40 hover:text-white hover:border-white/20">
                      <Plus className="h-6 w-6" /><p className="text-xs font-bold">添加新徽章</p>
                    </button>
                  </div>
                </Card>
              </>
            )}

            {tab === 'schedule' && (
              <Card title="训练开放时间配置" desc="配置学员可训练的时间段" onBtn={() => setEditingSchedule({ ...EMPTY_SCHEDULE })} btnLabel="新增时段" BtnIcon={Plus}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {openSchedules.map(s => (
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
                          <button onClick={() => setEditingSchedule({ ...s })} className="rounded-md p-1.5 border border-white/10 text-slate-400 hover:bg-white/5 hover:text-white"><Edit3 className="h-3.5 w-3.5" /></button>
                          <button onClick={() => { deleteSchedule(s.id); showToast('时段已删除'); }} className="rounded-md p-1.5 border border-rose-400/20 text-rose-300 hover:bg-rose-500/10"><Trash2 className="h-3.5 w-3.5" /></button>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 rounded-xl border border-white/10 bg-black/20 px-4 py-3 mb-3">
                        <Calendar className="h-5 w-5 text-cyan-400 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-[10px] uppercase tracking-wider text-slate-500">训练时间</p>
                          <p className="text-lg font-black text-white">{s.startTime} <span className="text-slate-500 mx-1.5">—</span> {s.endTime}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-2">适用星期</p>
                          <div className="flex gap-1.5 flex-wrap">
                            {weekDays.map((d, i) => {
                              const ok = s.daysOfWeek.includes(i);
                              return (
                                <span key={d} className={clsx(
                                  'flex h-8 w-8 items-center justify-center rounded-lg text-xs font-black',
                                  ok ? 'bg-gradient-to-br from-emerald-500/30 to-cyan-500/20 text-white border border-emerald-400/30' : 'bg-slate-800/60 text-slate-500 border border-white/5'
                                )}>{d}</span>
                              );
                            })}
                          </div>
                        </div>
                        <button onClick={() => { toggleScheduleActive(s.id); showToast(s.active ? '时段已停用' : '时段已启用'); }} className="rounded-lg p-2">
                          {s.active ? <ToggleRight className="h-7 w-7 text-emerald-400" /> : <ToggleLeft className="h-7 w-7 text-slate-500" />}
                        </button>
                      </div>
                    </div>
                  ))}
                  <button onClick={() => setEditingSchedule({ ...EMPTY_SCHEDULE })} className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-white/10 bg-slate-800/20 text-slate-400 p-8 min-h-[260px] hover:bg-slate-800/40 hover:text-white hover:border-white/20 transition">
                    <Plus className="h-8 w-8" /><p className="text-sm font-bold">添加新的开放时段</p>
                    <p className="text-xs text-slate-500 max-w-[180px] text-center">可按时间段、星期灵活配置训练可访问范围</p>
                  </button>
                </div>
              </Card>
            )}

            {tab === 'modes' && (
              <Card title="训练模式配置" desc="不同模式下的时间倍率、计分倍率设置" onBtn={() => setEditingMode({ ...EMPTY_MODE })} btnLabel="新增模式" BtnIcon={Plus}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {trainingModes.map(m => (
                    <div key={m.id} className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-800/60 to-slate-900/40 p-6 hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all">
                      <div className="text-5xl mb-3">{m.icon}</div>
                      <h3 className="text-xl font-black text-white mb-1">{m.name}</h3>
                      <p className="text-xs text-slate-400 mb-4 leading-relaxed">{m.description}</p>
                      <div className="space-y-2 rounded-xl border border-white/5 bg-black/20 p-3 mb-4">
                        {[
                          { l: '包含题型', v: m.questionTypes.length === 4 ? '全部四题型' : m.questionTypes.map(t => typeMap[t as QuestionType]?.n || t).join('、') },
                          { l: '难度范围', v: `${'⭐'.repeat(m.difficultyRange[0])}~${'⭐'.repeat(m.difficultyRange[1])}` },
                          { l: '时间倍率', v: `${m.timeMultiplier}x`, h: 'text-cyan-300' },
                          { l: '得分倍率', v: `${m.scoreMultiplier}x`, h: 'text-amber-300' },
                        ].map(x => (
                          <div key={x.l} className="flex items-center justify-between text-xs">
                            <span className="text-slate-500">{x.l}</span>
                            <span className={clsx('font-bold', x.h || 'text-slate-200')}>{x.v}</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setEditingMode({ ...m })} className="flex-1 rounded-xl bg-white/5 border border-white/10 py-2 text-xs font-bold text-slate-300 hover:bg-white/10 transition"><Edit3 className="h-3 w-3 inline mr-1" />编辑</button>
                        <button onClick={() => { deleteTrainingMode(m.id); showToast('模式已删除'); }} className="rounded-xl border border-rose-400/20 px-4 py-2 text-xs font-bold text-rose-300 hover:bg-rose-500/10"><Trash2 className="h-3 w-3" /></button>
                      </div>
                    </div>
                  ))}
                  <button onClick={() => setEditingMode({ ...EMPTY_MODE })} className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-white/10 bg-slate-800/20 p-6 text-slate-400 min-h-[280px] hover:bg-slate-800/40 hover:text-white hover:border-white/20 transition">
                    <Plus className="h-7 w-7" /><p className="text-sm font-bold">添加训练模式</p>
                    <p className="text-xs text-slate-500 text-center max-w-[160px]">自定义题型范围、难度与倍率</p>
                  </button>
                </div>
              </Card>
            )}
          </main>
        </div>
      </div>

      {editingQuestion && (
        <Modal title={editingQuestion.id ? '编辑题目' : '新建题目'} onClose={() => setEditingQuestion(null)} onSave={handleSaveQuestion}>
          <div className="space-y-4">
            <FieldRow label="题型">
              <select value={editingQuestion.type} onChange={e => setEditingQuestion({ ...editingQuestion, type: e.target.value as QuestionType })} className="w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-400/50">
                {Object.entries(typeMap).map(([k, v]) => <option key={k} value={k}>{v.i} {v.n}</option>)}
              </select>
            </FieldRow>
            <FieldRow label="题目标题">
              <input value={editingQuestion.title || ''} onChange={e => setEditingQuestion({ ...editingQuestion, title: e.target.value })} className="w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-400/50" placeholder="输入题目标题" />
            </FieldRow>
            <div className="grid grid-cols-3 gap-3">
              <FieldRow label="难度">
                <select value={editingQuestion.difficulty} onChange={e => setEditingQuestion({ ...editingQuestion, difficulty: Number(e.target.value) as 1|2|3|4|5 })} className="w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-400/50">
                  {[1,2,3,4,5].map(n => <option key={n} value={n}>{'⭐'.repeat(n)}</option>)}
                </select>
              </FieldRow>
              <FieldRow label="分值">
                <input type="number" value={editingQuestion.score || ''} onChange={e => setEditingQuestion({ ...editingQuestion, score: Number(e.target.value) })} className="w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-400/50" />
              </FieldRow>
              <FieldRow label="状态">
                <select value={editingQuestion.status} onChange={e => setEditingQuestion({ ...editingQuestion, status: e.target.value as any })} className="w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-400/50">
                  <option value="draft">草稿</option>
                  <option value="published">已发布</option>
                  <option value="archived">已归档</option>
                </select>
              </FieldRow>
            </div>
          </div>
        </Modal>
      )}

      {editingSchedule && (
        <Modal title={editingSchedule.id ? '编辑时段' : '新增时段'} onClose={() => setEditingSchedule(null)} onSave={handleSaveSchedule}>
          <div className="space-y-4">
            <FieldRow label="时段名称">
              <input value={editingSchedule.name || ''} onChange={e => setEditingSchedule({ ...editingSchedule, name: e.target.value })} className="w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-400/50" placeholder="例如：工作日训练" />
            </FieldRow>
            <div className="grid grid-cols-2 gap-3">
              <FieldRow label="开始时间">
                <input type="time" value={editingSchedule.startTime || '09:00'} onChange={e => setEditingSchedule({ ...editingSchedule, startTime: e.target.value })} className="w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-400/50" />
              </FieldRow>
              <FieldRow label="结束时间">
                <input type="time" value={editingSchedule.endTime || '18:00'} onChange={e => setEditingSchedule({ ...editingSchedule, endTime: e.target.value })} className="w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-400/50" />
              </FieldRow>
            </div>
            <FieldRow label="适用星期">
              <div className="flex gap-1.5 flex-wrap">
                {weekDays.map((d, i) => {
                  const selected = (editingSchedule.daysOfWeek || []).includes(i);
                  return (
                    <button key={d} type="button" onClick={() => {
                      const days = [...(editingSchedule.daysOfWeek || [])];
                      const idx = days.indexOf(i);
                      if (idx >= 0) days.splice(idx, 1); else days.push(i);
                      setEditingSchedule({ ...editingSchedule, daysOfWeek: days.sort() });
                    }} className={clsx(
                      'flex h-9 w-9 items-center justify-center rounded-lg text-xs font-bold border transition',
                      selected ? 'bg-gradient-to-br from-emerald-500/30 to-cyan-500/20 text-white border-emerald-400/30' : 'bg-slate-800/60 text-slate-500 border-white/5 hover:border-white/20'
                    )}>{d}</button>
                  );
                })}
              </div>
            </FieldRow>
          </div>
        </Modal>
      )}

      {editingMode && (
        <Modal title={editingMode.id ? '编辑模式' : '新增模式'} onClose={() => setEditingMode(null)} onSave={handleSaveMode}>
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-3">
              <FieldRow label="图标">
                <input value={editingMode.icon || ''} onChange={e => setEditingMode({ ...editingMode, icon: e.target.value })} className="w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white text-center focus:outline-none focus:border-indigo-400/50" />
              </FieldRow>
              <div className="col-span-3">
                <FieldRow label="模式名称">
                  <input value={editingMode.name || ''} onChange={e => setEditingMode({ ...editingMode, name: e.target.value })} className="w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-400/50" placeholder="输入模式名称" />
                </FieldRow>
              </div>
            </div>
            <FieldRow label="描述">
              <input value={editingMode.description || ''} onChange={e => setEditingMode({ ...editingMode, description: e.target.value })} className="w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-400/50" placeholder="模式描述" />
            </FieldRow>
            <FieldRow label="包含题型">
              <div className="flex gap-2 flex-wrap">
                {(['rule', 'evidence', 'settlement', 'compensation'] as QuestionType[]).map(t => {
                  const selected = (editingMode.questionTypes || []).includes(t);
                  const info = typeMap[t];
                  return (
                    <button key={t} type="button" onClick={() => {
                      const types = [...(editingMode.questionTypes || [])];
                      const idx = types.indexOf(t);
                      if (idx >= 0) types.splice(idx, 1); else types.push(t);
                      setEditingMode({ ...editingMode, questionTypes: types });
                    }} className={clsx('rounded-lg border px-3 py-1.5 text-xs font-bold transition', selected ? `${info.c} border-current` : 'border-white/10 bg-slate-800/60 text-slate-400 hover:border-white/20')}>
                      {info.i} {info.n}
                    </button>
                  );
                })}
              </div>
            </FieldRow>
            <div className="grid grid-cols-2 gap-3">
              <FieldRow label="难度下限">
                <select value={editingMode.difficultyRange?.[0] || 1} onChange={e => setEditingMode({ ...editingMode, difficultyRange: [Number(e.target.value), editingMode.difficultyRange?.[1] || 5] as [number, number] })} className="w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-400/50">
                  {[1,2,3,4,5].map(n => <option key={n} value={n}>{'⭐'.repeat(n)}</option>)}
                </select>
              </FieldRow>
              <FieldRow label="难度上限">
                <select value={editingMode.difficultyRange?.[1] || 5} onChange={e => setEditingMode({ ...editingMode, difficultyRange: [editingMode.difficultyRange?.[0] || 1, Number(e.target.value)] as [number, number] })} className="w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-400/50">
                  {[1,2,3,4,5].map(n => <option key={n} value={n}>{'⭐'.repeat(n)}</option>)}
                </select>
              </FieldRow>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FieldRow label="时间倍率">
                <input type="number" step="0.1" value={editingMode.timeMultiplier ?? 1.0} onChange={e => setEditingMode({ ...editingMode, timeMultiplier: Number(e.target.value) })} className="w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-400/50" />
              </FieldRow>
              <FieldRow label="得分倍率">
                <input type="number" step="0.1" value={editingMode.scoreMultiplier ?? 1.0} onChange={e => setEditingMode({ ...editingMode, scoreMultiplier: Number(e.target.value) })} className="w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-400/50" />
              </FieldRow>
            </div>
          </div>
        </Modal>
      )}

      {editingBadge && (
        <Modal title="添加徽章" onClose={() => setEditingBadge(null)} onSave={handleSaveBadge}>
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-3">
              <FieldRow label="图标">
                <input value={editingBadge.icon || ''} onChange={e => setEditingBadge({ ...editingBadge, icon: e.target.value })} className="w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white text-center focus:outline-none focus:border-indigo-400/50" />
              </FieldRow>
              <div className="col-span-3">
                <FieldRow label="徽章名称">
                  <input value={editingBadge.name || ''} onChange={e => setEditingBadge({ ...editingBadge, name: e.target.value })} className="w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-400/50" placeholder="输入徽章名称" />
                </FieldRow>
              </div>
            </div>
            <FieldRow label="描述">
              <input value={editingBadge.description || ''} onChange={e => setEditingBadge({ ...editingBadge, description: e.target.value })} className="w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-400/50" placeholder="徽章描述" />
            </FieldRow>
            <div className="grid grid-cols-2 gap-3">
              <FieldRow label="解锁条件">
                <input value={editingBadge.condition || ''} onChange={e => setEditingBadge({ ...editingBadge, condition: e.target.value })} className="w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-400/50" placeholder="例如：3星通关" />
              </FieldRow>
              <FieldRow label="奖励积分">
                <input type="number" value={editingBadge.points ?? 10} onChange={e => setEditingBadge({ ...editingBadge, points: Number(e.target.value) })} className="w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-400/50" />
              </FieldRow>
            </div>
          </div>
        </Modal>
      )}

      {editingAsset && (
        <Modal title={editingAsset.id ? '编辑素材' : '添加素材'} onClose={() => setEditingAsset(null)} onSave={handleSaveAsset}>
          <div className="space-y-4">
            <FieldRow label="素材名称">
              <input value={editingAsset.name || ''} onChange={e => setEditingAsset({ ...editingAsset, name: e.target.value })} className="w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-400/50" placeholder="输入素材名称" />
            </FieldRow>
            <div className="grid grid-cols-2 gap-3">
              <FieldRow label="类型">
                <select value={editingAsset.type || 'image'} onChange={e => setEditingAsset({ ...editingAsset, type: e.target.value as any })} className="w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-400/50">
                  <option value="image">🖼️ 图片</option>
                  <option value="audio">🔊 音频</option>
                  <option value="model">📦 模型</option>
                </select>
              </FieldRow>
              <FieldRow label="标签">
                <input value={editingAsset.tag || ''} onChange={e => setEditingAsset({ ...editingAsset, tag: e.target.value })} className="w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-400/50" placeholder="例如：demo" />
              </FieldRow>
            </div>
            <FieldRow label="URL">
              <input value={editingAsset.url || ''} onChange={e => setEditingAsset({ ...editingAsset, url: e.target.value })} className="w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-400/50" placeholder="/images/example.png" />
            </FieldRow>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Card({ title, desc, btn, onBtn, btnLabel, BtnIcon, children }: {
  title: string; desc?: string; btn?: { label: string; i: any }; onBtn?: () => void; btnLabel?: string; BtnIcon?: any; children: React.ReactNode;
}) {
  const Ic = BtnIcon || btn?.i;
  return (
    <section className="rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 flex-wrap gap-2">
        <div>
          <h3 className="text-sm font-black text-white">{title}</h3>
          {desc && <p className="text-[11px] text-slate-400 mt-0.5">{desc}</p>}
        </div>
        {onBtn && Ic && (
          <button onClick={onBtn} className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 px-3.5 py-2 text-xs font-black text-white shadow-lg shadow-indigo-500/20">
            <Ic className="h-3.5 w-3.5" />{btnLabel || btn?.label}
          </button>
        )}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function Modal({ title, onClose, onSave, children }: { title: string; onClose: () => void; onSave: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900 to-slate-800 p-6 shadow-2xl animate-in fade-in zoom-in-95" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-black text-white">{title}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white"><X className="h-5 w-5" /></button>
        </div>
        {children}
        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-xl border border-white/10 px-5 py-2.5 text-sm font-bold text-slate-300 hover:bg-slate-800">取消</button>
          <button onClick={onSave} className="rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40">
            <Save className="h-4 w-4 inline mr-1.5" />保存
          </button>
        </div>
      </div>
    </div>
  );
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">{label}</label>
      {children}
    </div>
  );
}
