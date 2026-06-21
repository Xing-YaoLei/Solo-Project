'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Camera,
  Tags,
  MapPin,
  BadgeCheck,
  Route,
  Wallet,
  CheckCircle2,
  Circle,
  AlertTriangle,
  User,
  Phone,
  Edit3,
  Send,
  Plus,
  X,
  Image as ImageIcon,
  Map,
  Loader2,
  Star,
  ThumbsUp,
  ThumbsDown,
  TrendingUp,
} from 'lucide-react';
import { taskApi, damageApi, Task } from '@/lib/api';
import {
  TASK_STATUS_MAP,
  RISK_LEVEL_MAP,
  DAMAGE_STATUS_MAP,
  VERIFICATION_STEP_MAP,
  RIDER_STATUS_MAP,
  formatDate,
  formatMoney,
  cn,
} from '@/lib/utils';
import { useAuthStore } from '@/store/auth';
import AuthGuard from '@/components/AuthGuard';

const EVALUATION_TAGS_OPTIONS = [
  '包装完好',
  '配送及时',
  '态度良好',
  '路线合理',
  '主动联系',
  '物品整洁',
  '包装破损',
  '延迟送达',
  '态度恶劣',
  '绕路严重',
];

function TaskDetailContent() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const taskId = params.id as string;

  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'photos' | 'tags' | 'tracking' | 'subsidy'>('photos');
  const [showDamageModal, setShowDamageModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [photoUrls, setPhotoUrls] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [addressMatched, setAddressMatched] = useState<boolean | null>(null);
  const [addressNote, setAddressNote] = useState('');
  const [subsidyForm, setSubsidyForm] = useState({ type: '里程补贴', amount: 0, rule: { rate: 3, perKm: true }, remark: '' });
  const [damageForm, setDamageForm] = useState({
    riskLevel: 'MEDIUM',
    damageType: '',
    description: '',
    estimatedLoss: 0,
  });
  const [commText, setCommText] = useState('');

  const loadTask = async () => {
    try {
      setLoading(true);
      const data = await taskApi.detail(taskId);
      setTask(data);
      if (data.evaluationTags) setSelectedTags(data.evaluationTags);
      if (data.addressMatched !== undefined) setAddressMatched(data.addressMatched);
      if (data.addressNote) setAddressNote(data.addressNote);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTask();
  }, [taskId]);

  if (loading || !task) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="animate-spin w-10 h-10 text-primary-500" />
      </div>
    );
  }

  const STEPS = [
    { key: 'PHOTO_UPLOADED', label: '核验照片', icon: Camera, tab: 'photos' as const, done: task.currentStep && ['PHOTO_UPLOADED', 'TAG_REVIEWED', 'ADDRESS_CHECKED', 'TRACKING_CONFIRMED', 'SUBSIDY_APPLIED'].includes(task.currentStep) || task.status === 'COMPLETED' || task.photos?.length > 0 },
    { key: 'TAG_REVIEWED', label: '评价标签 & 地址核对', icon: BadgeCheck, tab: 'tags' as const, done: task.currentStep && ['TAG_REVIEWED', 'ADDRESS_CHECKED', 'TRACKING_CONFIRMED', 'SUBSIDY_APPLIED'].includes(task.currentStep) || task.status === 'COMPLETED' },
    { key: 'TRACKING_CONFIRMED', label: '轨迹追踪', icon: Route, tab: 'tracking' as const, done: task.currentStep && ['TRACKING_CONFIRMED', 'SUBSIDY_APPLIED'].includes(task.currentStep) || task.status === 'COMPLETED' },
    { key: 'SUBSIDY_APPLIED', label: '补贴规则', icon: Wallet, tab: 'subsidy' as const, done: task.currentStep === 'SUBSIDY_APPLIED' || task.status === 'COMPLETED' },
  ];

  const handleSavePhotos = async () => {
    if (!photoUrls.trim()) return;
    try {
      setSaving(true);
      const photos = photoUrls.split('\n').filter(Boolean).map((url, idx) => ({ url: url.trim(), type: idx === 0 ? 'pickup' : idx === 1 ? 'item' : 'delivery' }));
      await taskApi.update(taskId, { photos, currentStep: 'PHOTO_UPLOADED', status: 'IN_PROGRESS' });
      setPhotoUrls('');
      await loadTask();
    } finally {
      setSaving(false);
    }
  };

  const handleSaveTagsAndAddress = async () => {
    try {
      setSaving(true);
      const newStep = selectedTags.length > 0 && addressMatched !== null ? 'ADDRESS_CHECKED' : (selectedTags.length > 0 || addressMatched !== null ? 'TAG_REVIEWED' : undefined);
      await taskApi.update(taskId, {
        evaluationTags: selectedTags,
        addressMatched,
        addressNote,
        ...(newStep ? { currentStep: newStep } : {}),
      });
      await loadTask();
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmTracking = async () => {
    try {
      setSaving(true);
      if (!task.tracks || task.tracks.length === 0) {
        await taskApi.addTrack(taskId, {
          latitude: (task as any).rider?.currentLat || 39.9042,
          longitude: (task as any).rider?.currentLng || 116.4074,
        });
      }
      await taskApi.update(taskId, { currentStep: 'TRACKING_CONFIRMED' });
      await loadTask();
    } finally {
      setSaving(false);
    }
  };

  const handleApplySubsidy = async () => {
    if (subsidyForm.amount <= 0) return;
    try {
      setSaving(true);
      await taskApi.applySubsidy(taskId, subsidyForm);
      await taskApi.update(taskId, { currentStep: 'SUBSIDY_APPLIED', status: 'COMPLETED' });
      await loadTask();
    } finally {
      setSaving(false);
    }
  };

  const handleCreateDamage = async () => {
    try {
      setSaving(true);
      await damageApi.create({
        taskId,
        ...damageForm,
        photos: task.photos?.slice(0, 3) || [],
      });
      setShowDamageModal(false);
      await loadTask();
    } finally {
      setSaving(false);
    }
  };

  const handleAddComm = async () => {
    if (!commText.trim() || !task.damageReport?.id) return;
    try {
      setSaving(true);
      await damageApi.addCommunication(task.damageReport.id, { content: commText.trim() });
      setCommText('');
      await loadTask();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 flex-wrap">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-bold text-gray-900 font-mono">{task.taskNo}</h1>
            <span className={TASK_STATUS_MAP[task.status].color}>
              {TASK_STATUS_MAP[task.status].label}
            </span>
            <span className="text-gray-400">·</span>
            <span className="text-sm text-gray-500">订单号：{task.orderNo}</span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            创建于 {formatDate(task.createdAt)} {task.assignedTo ? ` · 核验员：${task.assignedTo.name}` : ''}
          </p>
        </div>
        {!task.damageReport && (
          <button
            onClick={() => setShowDamageModal(true)}
            className="btn-danger"
          >
            <AlertTriangle size={16} />
            上报损坏
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <div className="card">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">核验处理流程</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {STEPS.map((step, idx) => {
                const Icon = step.icon;
                const isActive = activeTab === step.tab;
                return (
                  <button
                    key={step.key}
                    onClick={() => setActiveTab(step.tab)}
                    className={cn(
                      'relative p-4 rounded-xl border-2 text-left transition-all',
                      isActive
                        ? 'border-primary-500 bg-primary-50/50 shadow-sm'
                        : step.done
                        ? 'border-success-200 bg-success-50/30 hover:bg-success-50/50'
                        : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50',
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          'w-9 h-9 rounded-lg flex items-center justify-center shrink-0',
                          isActive
                            ? 'bg-primary-100 text-primary-700'
                            : step.done
                            ? 'bg-success-100 text-success-600'
                            : 'bg-gray-100 text-gray-500',
                        )}
                      >
                        {step.done ? <CheckCircle2 size={18} /> : <Icon size={18} />}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-mono text-gray-400 mb-0.5">0{idx + 1}</div>
                        <div className={cn('text-sm font-semibold', isActive ? 'text-primary-700' : step.done ? 'text-success-700' : 'text-gray-700')}>
                          {step.label}
                        </div>
                        <div className="text-xs mt-1.5 h-4">
                          {step.done ? (
                            <span className="text-success-600">已完成</span>
                          ) : isActive ? (
                            <span className="text-primary-600">处理中</span>
                          ) : (
                            <span className="text-gray-400">待处理</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {activeTab === 'photos' && (
            <div className="card animate-fade-in">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-5">
                <Camera className="text-primary-600" size={20} />
                核验照片
              </h3>

              {task.photos?.length > 0 && (
                <div className="mb-6">
                  <div className="text-sm font-medium text-gray-700 mb-3">已上传照片 ({task.photos.length})</div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {task.photos.map((photo, idx) => (
                      <div key={idx} className="group relative rounded-xl overflow-hidden border border-gray-200 aspect-square">
                        <img
                          src={photo.url}
                          alt=""
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = `https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400`;
                          }}
                        />
                        <div className="absolute top-2 left-2 px-2 py-0.5 rounded text-xs bg-black/60 text-white">
                          {photo.type === 'pickup' ? '取件' : photo.type === 'item' ? '物品' : '送达'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="label">批量添加照片（每行一个图片URL）</label>
                <textarea
                  value={photoUrls}
                  onChange={(e) => setPhotoUrls(e.target.value)}
                  rows={4}
                  className="input resize-none"
                  placeholder="https://example.com/photo1.jpg&#10;https://example.com/photo2.jpg&#10;https://example.com/photo3.jpg"
                />
                <div className="flex items-center justify-between mt-3">
                  <div className="text-xs text-gray-400">建议添加：取件照、物品细节照、送达照 至少各一张</div>
                  <button
                    onClick={handleSavePhotos}
                    disabled={saving || !photoUrls.trim()}
                    className="btn-primary disabled:opacity-60"
                  >
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    上传照片并进入下一步
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'tags' && (
            <div className="card animate-fade-in space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
                  <Tags className="text-primary-600" size={20} />
                  评价标签
                </h3>
                <div className="flex flex-wrap gap-2">
                  {EVALUATION_TAGS_OPTIONS.map((tag) => {
                    const isSelected = selectedTags.includes(tag);
                    const isPositive = !['包装破损', '延迟送达', '态度恶劣', '绕路严重'].includes(tag);
                    return (
                      <button
                        key={tag}
                        onClick={() => {
                          setSelectedTags(
                            isSelected
                              ? selectedTags.filter((t) => t !== tag)
                              : [...selectedTags, tag],
                          );
                        }}
                        className={cn(
                          'px-3 py-1.5 rounded-lg border text-sm font-medium transition-all inline-flex items-center gap-1.5',
                          isSelected
                            ? isPositive
                              ? 'bg-success-50 border-success-300 text-success-700'
                              : 'bg-danger-50 border-danger-300 text-danger-700'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50',
                        )}
                      >
                        {isPositive ? <ThumbsUp size={13} /> : <ThumbsDown size={13} />}
                        {tag}
                      </button>
                    );
                  })}
                </div>
                {selectedTags.length > 0 && (
                  <div className="mt-3 text-xs text-gray-500">
                    已选择 {selectedTags.length} 个标签：{selectedTags.join('、')}
                  </div>
                )}
              </div>

              <div className="border-t border-gray-100 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
                  <BadgeCheck className="text-primary-600" size={20} />
                  订单地址核对
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                  <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                    <div className="text-xs font-medium text-gray-500 mb-1.5 flex items-center gap-1">
                      <MapPin size={12} className="text-primary-500" />
                      取件地址
                    </div>
                    <div className="text-sm text-gray-800 font-medium leading-relaxed">
                      {task.pickupAddress}
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                    <div className="text-xs font-medium text-gray-500 mb-1.5 flex items-center gap-1">
                      <MapPin size={12} className="text-success-500" />
                      送达地址
                    </div>
                    <div className="text-sm text-gray-800 font-medium leading-relaxed">
                      {task.deliveryAddress}
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="label mb-2">地址是否与订单信息一致？</label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setAddressMatched(true)}
                      className={cn(
                        'px-5 py-2.5 rounded-xl border-2 transition-all flex items-center gap-2 font-medium',
                        addressMatched === true
                          ? 'border-success-500 bg-success-50 text-success-700'
                          : 'border-gray-200 hover:border-success-300 text-gray-600 hover:bg-success-50/30',
                      )}
                    >
                      <CheckCircle2 size={16} />
                      地址一致
                    </button>
                    <button
                      onClick={() => setAddressMatched(false)}
                      className={cn(
                        'px-5 py-2.5 rounded-xl border-2 transition-all flex items-center gap-2 font-medium',
                        addressMatched === false
                          ? 'border-danger-500 bg-danger-50 text-danger-700'
                          : 'border-gray-200 hover:border-danger-300 text-gray-600 hover:bg-danger-50/30',
                      )}
                    >
                      <X size={16} />
                      地址异常
                    </button>
                  </div>
                </div>

                <div className="mb-5">
                  <label className="label">备注说明</label>
                  <textarea
                    value={addressNote}
                    onChange={(e) => setAddressNote(e.target.value)}
                    rows={3}
                    className="input resize-none"
                    placeholder="如地址不一致，请说明具体差异位置、门牌号、联系人等细节..."
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleSaveTagsAndAddress}
                    disabled={saving}
                    className="btn-primary disabled:opacity-60"
                  >
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                    保存标签与地址核对结果
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'tracking' && (
            <div className="card animate-fade-in space-y-5">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Route className="text-primary-600" size={20} />
                骑手轨迹追踪
              </h3>

              <div className="rounded-xl bg-gradient-to-br from-blue-50 to-emerald-50 border border-blue-100 p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-primary-100/50 to-transparent rounded-full -mr-20 -mt-20" />
                <div className="relative">
                  <div className="flex items-start justify-between flex-wrap gap-4 mb-5">
                    <div>
                      <div className="text-sm text-gray-600 mb-1">当前位置</div>
                      <div className="text-lg font-semibold text-gray-900">
                        {task.tracks && task.tracks.length > 0
                          ? `${task.tracks[task.tracks.length - 1].latitude?.toFixed(4)}, ${task.tracks[task.tracks.length - 1].longitude?.toFixed(4)}`
                          : '轨迹待补录'}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {(task as any).rider?.vehicleType} · {(task as any).rider?.vehiclePlate || '无车牌'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600 mb-1">轨迹点数</div>
                      <div className="text-2xl font-bold text-primary-600">{task.tracks?.length || 0}</div>
                    </div>
                  </div>

                  <div className="h-48 rounded-xl bg-white/70 backdrop-blur border border-white/50 flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 opacity-20">
                      <div className="absolute inset-0" style={{
                        backgroundImage: 'linear-gradient(rgba(59,130,246,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.15) 1px, transparent 1px)',
                        backgroundSize: '30px 30px',
                      }} />
                    </div>
                    <div className="relative text-center">
                      <Map size={36} className="mx-auto text-primary-400 mb-2" />
                      <div className="text-sm text-gray-500">轨迹地图可视化区域</div>
                      <div className="text-xs text-gray-400 mt-1">接入地图SDK后可展示完整轨迹回放</div>
                    </div>

                    {task.tracks && task.tracks.length >= 2 && (
                      <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2 text-xs">
                        <div className="w-2 h-2 rounded-full bg-success-500" />
                        <span className="text-gray-600">起点</span>
                        <div className="flex-1 h-0.5 bg-gradient-to-r from-success-400 via-primary-400 to-danger-400 rounded-full mx-2" />
                        <span className="text-gray-600">终点</span>
                        <div className="w-2 h-2 rounded-full bg-danger-500" />
                      </div>
                    )}
                  </div>

                  {task.tracks && task.tracks.length > 0 && (
                    <div className="mt-4 max-h-32 overflow-y-auto space-y-1.5 pr-2">
                      {task.tracks.slice().reverse().slice(0, 5).map((t, i) => (
                        <div key={i} className="flex items-center gap-3 text-xs p-2 rounded-lg bg-white/50">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary-500 shrink-0" />
                          <div className="font-mono text-gray-600 shrink-0 w-36">{formatDate(t.recordedAt)}</div>
                          <div className="text-gray-700">{t.latitude?.toFixed(4)}, {t.longitude?.toFixed(4)}</div>
                          {t.speed !== null && t.speed !== undefined && (
                            <div className="text-primary-600 ml-auto shrink-0">{t.speed.toFixed(1)} m/s</div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-gray-50">
                <div className="text-sm text-gray-600">
                  {task.tracks && task.tracks.length > 0
                    ? '已获取轨迹数据，确认无误后进入下一步'
                    : '暂无轨迹数据，可手动补录后确认'}
                </div>
                <button
                  onClick={handleConfirmTracking}
                  disabled={saving}
                  className="btn-primary disabled:opacity-60"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                  确认轨迹并进入下一步
                </button>
              </div>
            </div>
          )}

          {activeTab === 'subsidy' && (
            <div className="card animate-fade-in space-y-5">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Wallet className="text-primary-600" size={20} />
                骑手补贴核算
              </h3>

              {task.subsidy ? (
                <div className="rounded-xl border border-success-200 bg-success-50/50 p-6">
                  <div className="flex items-center gap-2 text-success-700 font-semibold mb-4">
                    <CheckCircle2 size={18} />
                    补贴已核算并发放
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <div className="text-xs text-gray-500">补贴类型</div>
                      <div className="text-base font-semibold text-gray-900 mt-1">{task.subsidy.subsidyType}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">补贴金额</div>
                      <div className="text-base font-semibold text-success-600 mt-1">{formatMoney(task.subsidy.amount)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">核算规则</div>
                      <div className="text-xs text-gray-700 mt-1 font-mono">
                        {JSON.stringify(task.subsidy.ruleDetail)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">核算时间</div>
                      <div className="text-sm text-gray-800 mt-1">{formatDate(task.subsidy.appliedAt)}</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">订单核算基础</div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <div className="text-xs text-gray-500">物品价值</div>
                        <div className="text-base font-semibold text-gray-900 mt-1">{formatMoney(task.itemValue)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">预估运费</div>
                        <div className="text-base font-semibold text-gray-900 mt-1">{formatMoney(task.estimatedAmount)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">物品数量</div>
                        <div className="text-base font-semibold text-gray-900 mt-1">{task.itemQuantity} 件</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">骑手评分</div>
                        <div className="text-base font-semibold text-warning-600 mt-1 flex items-center gap-1">
                          <Star size={14} className="fill-warning-500" />
                          {(task as any).rider?.rating?.toFixed(1) || '5.0'}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="label">补贴类型</label>
                      <select
                        value={subsidyForm.type}
                        onChange={(e) => setSubsidyForm({ ...subsidyForm, type: e.target.value })}
                        className="input"
                      >
                        <option value="里程补贴">里程补贴</option>
                        <option value="重量补贴">重量补贴</option>
                        <option value="天气补贴">恶劣天气补贴</option>
                        <option value="夜间补贴">夜间配送补贴</option>
                        <option value="特殊补贴">特殊物品补贴</option>
                      </select>
                    </div>
                    <div>
                      <label className="label">补贴金额（元）</label>
                      <input
                        type="number"
                        step="0.01"
                        value={subsidyForm.amount}
                        onChange={(e) => setSubsidyForm({ ...subsidyForm, amount: parseFloat(e.target.value) || 0 })}
                        className="input"
                        placeholder="请输入补贴金额"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="label">补贴规则详情（JSON）</label>
                    <textarea
                      rows={2}
                      value={JSON.stringify(subsidyForm.rule, null, 2)}
                      onChange={(e) => {
                        try {
                          setSubsidyForm({ ...subsidyForm, rule: JSON.parse(e.target.value) });
                        } catch {}
                      }}
                      className="input font-mono text-xs resize-none"
                    />
                  </div>

                  <div>
                    <label className="label">备注</label>
                    <input
                      value={subsidyForm.remark}
                      onChange={(e) => setSubsidyForm({ ...subsidyForm, remark: e.target.value })}
                      className="input"
                      placeholder="特殊说明..."
                    />
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="text-sm">
                      <span className="text-gray-500">核算后将发放给骑手：</span>
                      <span className="ml-2 text-xl font-bold text-success-600">{formatMoney(subsidyForm.amount)}</span>
                    </div>
                    <button
                      onClick={handleApplySubsidy}
                      disabled={saving || subsidyForm.amount <= 0}
                      className="btn-success disabled:opacity-60"
                    >
                      {saving ? <Loader2 size={16} className="animate-spin" /> : <Wallet size={16} />}
                      确认发放补贴并完成核验
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {task.damageReport && (
            <div className={cn('card border-2', RISK_LEVEL_MAP[task.damageReport.riskLevel].bg)}>
              <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <AlertTriangle className={RISK_LEVEL_MAP[task.damageReport.riskLevel].color} size={20} />
                    物品损坏报告
                    <span className={cn(
                      'text-xs font-bold px-2.5 py-0.5 rounded-full',
                      RISK_LEVEL_MAP[task.damageReport.riskLevel].color,
                      RISK_LEVEL_MAP[task.damageReport.riskLevel].bg,
                      'border',
                    )}>
                      {RISK_LEVEL_MAP[task.damageReport.riskLevel].label}
                    </span>
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    报告编号：{task.damageReport.reportNo} · {DAMAGE_STATUS_MAP[task.damageReport.status].label}
                  </p>
                </div>
                <Link href={`/damages/${task.damageReport.id}`} className="btn-outline text-sm">
                  <Edit3 size={14} />
                  进入处理页
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="p-3 rounded-lg bg-white/70 border border-white">
                  <div className="text-xs text-gray-500 mb-1">损坏类型</div>
                  <div className="font-medium text-gray-900">{task.damageReport.damageType}</div>
                </div>
                <div className="p-3 rounded-lg bg-white/70 border border-white">
                  <div className="text-xs text-gray-500 mb-1">预估损失 / 实际损失</div>
                  <div className="font-medium text-gray-900">
                    {formatMoney(task.damageReport.estimatedLoss)} / {formatMoney(task.damageReport.actualLoss)}
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-white/70 border border-white mb-4">
                <div className="text-xs text-gray-500 mb-1.5">问题描述</div>
                <div className="text-sm text-gray-800 leading-relaxed">{task.damageReport.description}</div>
              </div>

              {task.damageReport.communications?.length > 0 && (
                <div className="mb-4">
                  <div className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <TrendingUp size={14} />
                    最新沟通记录
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {task.damageReport.communications.slice(-5).map((comm: any) => (
                      <div key={comm.id} className="p-3 rounded-lg bg-white/70 border border-white">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-gray-700">{comm.sender?.name}</span>
                          <span className="text-xs text-gray-400">{formatDate(comm.createdAt)}</span>
                        </div>
                        <div className="text-sm text-gray-800">{comm.content}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <input
                  value={commText}
                  onChange={(e) => setCommText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).value && handleAddComm()}
                  className="input flex-1"
                  placeholder="添加沟通记录..."
                />
                <button
                  onClick={handleAddComm}
                  disabled={saving || !commText.trim()}
                  className="btn-primary disabled:opacity-60"
                >
                  <Send size={16} />
                  发送
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div className="card">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">骑手信息</h3>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-xl font-bold">
                {(task as any).rider?.user?.name?.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-gray-900">{(task as any).rider?.user?.name}</div>
                <div className="text-xs text-gray-500 font-mono">{(task as any).rider?.riderCode}</div>
                <div className="text-xs text-warning-600 mt-0.5 flex items-center gap-1">
                  <Star size={11} className="fill-warning-500" />
                  {(task as any).rider?.rating?.toFixed(1) || '5.0'}
                </div>
              </div>
            </div>
            <div className="space-y-2.5 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Phone size={14} className="text-gray-400 shrink-0" />
                <span className="truncate">{(task as any).rider?.user?.phone || '-'}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <User size={14} className="text-gray-400 shrink-0" />
                <span className={RIDER_STATUS_MAP[(task as any).rider?.status || 'OFFLINE'].color}>
                  {RIDER_STATUS_MAP[(task as any).rider?.status || 'OFFLINE'].label}
                </span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Route size={14} className="text-gray-400 shrink-0" />
                <span>{(task as any).rider?.totalOrders || 0} 单累计</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Map size={14} className="text-gray-400 shrink-0" />
                <span>{(task as any).rider?.vehicleType} · {(task as any).rider?.vehiclePlate || '-'}</span>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">任务摘要</h3>
            <div className="space-y-3 text-sm">
              <div>
                <div className="text-xs text-gray-500 mb-1">物品信息</div>
                <div className="font-medium text-gray-900">{task.itemName} × {task.itemQuantity}</div>
                <div className="text-xs text-gray-500 mt-0.5">估值 {formatMoney(task.itemValue)}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">取件地址</div>
                <div className="text-gray-700 leading-relaxed">{task.pickupAddress}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">送达地址</div>
                <div className="text-gray-700 leading-relaxed">{task.deliveryAddress}</div>
              </div>
              <div className="pt-2 border-t border-gray-100 space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-500">创建人</span>
                  <span className="text-gray-800">{task.createdBy?.name || '-'}</span>
                </div>
                {task.dispatchedBy && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">调度人</span>
                    <span className="text-gray-800">{task.dispatchedBy.name}</span>
                  </div>
                )}
                {task.assignedTo && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">核验人</span>
                    <span className="text-gray-800">{task.assignedTo.name}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {task.stepLogs && task.stepLogs.length > 0 && (
            <div className="card">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">步骤日志</h3>
              <div className="space-y-3">
                {task.stepLogs.map((log: any, idx: number) => (
                  <div key={log.id} className="relative pl-5">
                    {idx < task.stepLogs!.length - 1 && (
                      <div className="absolute left-[5px] top-4 bottom-[-12px] w-px bg-gray-200" />
                    )}
                    <div className="absolute left-0 top-1.5 w-2.5 h-2.5 rounded-full bg-primary-500 border-2 border-white shadow-sm" />
                    <div className="text-sm font-medium text-gray-900">
                      {VERIFICATION_STEP_MAP[log.step]?.label || log.step}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {log.operator?.name || '-'} · {formatDate(log.createdAt, 'HH:mm')}
                    </div>
                    {log.remark && (
                      <div className="text-xs text-gray-600 mt-1">{log.remark}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {showDamageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-slide-up">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <AlertTriangle className="text-danger-600" size={20} />
                上报物品损坏
              </h3>
              <button
                onClick={() => setShowDamageModal(false)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="label">风险等级 *</label>
                <div className="grid grid-cols-4 gap-2">
                  {Object.entries(RISK_LEVEL_MAP).map(([key, val]) => (
                    <button
                      key={key}
                      onClick={() => setDamageForm({ ...damageForm, riskLevel: key })}
                      className={cn(
                        'p-3 rounded-xl border-2 text-center transition-all',
                        damageForm.riskLevel === key
                          ? `${val.bg} border-current ${val.color}`
                          : 'border-gray-100 hover:border-gray-200 text-gray-600',
                      )}
                    >
                      <div className="text-sm font-bold">{val.label.replace('风险', '')}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">损坏类型 *</label>
                <select
                  value={damageForm.damageType}
                  onChange={(e) => setDamageForm({ ...damageForm, damageType: e.target.value })}
                  className="input"
                >
                  <option value="">请选择</option>
                  <option value="外包装破损">外包装破损</option>
                  <option value="内部物品损坏">内部物品损坏</option>
                  <option value="遗失">物品遗失</option>
                  <option value="错发漏发">错发/漏发</option>
                  <option value="其他">其他问题</option>
                </select>
              </div>

              <div>
                <label className="label">预估损失金额（元）</label>
                <input
                  type="number"
                  step="0.01"
                  value={damageForm.estimatedLoss}
                  onChange={(e) => setDamageForm({ ...damageForm, estimatedLoss: parseFloat(e.target.value) || 0 })}
                  className="input"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="label">问题描述 *</label>
                <textarea
                  rows={4}
                  value={damageForm.description}
                  onChange={(e) => setDamageForm({ ...damageForm, description: e.target.value })}
                  className="input resize-none"
                  placeholder="请详细描述物品损坏情况，包括发生环节、现场照片、客户反馈等..."
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-100">
              <button
                onClick={() => setShowDamageModal(false)}
                className="btn-secondary"
              >
                取消
              </button>
              <button
                onClick={handleCreateDamage}
                disabled={saving || !damageForm.damageType || !damageForm.description}
                className="btn-danger disabled:opacity-60"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                确认上报
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TaskDetailPage() {
  return (
    <AuthGuard>
      <TaskDetailContent />
    </AuthGuard>
  );
}
