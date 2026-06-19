import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowLeft,
  Target,
  Eye,
  Stethoscope,
  GitBranch,
  PackageX,
  ClipboardCheck,
  Hand,
  Keyboard,
  Star,
  AlertTriangle,
  TrendingUp,
  ShieldAlert,
  Zap,
  Clock,
  CheckCircle2,
  XCircle,
  Minus,
  Trophy,
  Settings2,
  Activity,
  BookOpen,
  Car,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 80,
      damping: 16,
    },
  },
};

const headerVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
};

interface SectionCardProps {
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  title: string;
  subtitle?: string;
  borderAccent: string;
  children: React.ReactNode;
}

function SectionCard({
  icon: Icon,
  iconBg,
  iconColor,
  title,
  subtitle,
  borderAccent,
  children,
}: SectionCardProps) {
  return (
    <motion.div
      variants={itemVariants}
      className={`relative overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-800/50 backdrop-blur-xl transition-all hover:border-slate-600/60 hover:bg-slate-800/70`}
    >
      <div className={`absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b ${borderAccent}`} />

      <div className="flex items-start gap-4 p-5 sm:p-6">
        <div
          className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${iconBg} ring-1 ring-white/10`}
        >
          <Icon className={`h-6 w-6 ${iconColor}`} strokeWidth={2} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <h3 className="text-lg font-bold text-white">{title}</h3>
          </div>
          {subtitle && (
            <p className="mb-4 text-xs text-slate-400 sm:text-sm">{subtitle}</p>
          )}
          {children}
        </div>
      </div>
    </motion.div>
  );
}

interface FlowStepProps {
  icon: LucideIcon;
  step: number;
  title: string;
  description: string;
  color: string;
}

function FlowStep({ icon: Icon, step, title, description, color }: FlowStepProps) {
  return (
    <div className="relative flex gap-4">
      {step < 5 && (
        <div className="absolute left-5 top-14 h-[calc(100%-1rem)] w-px bg-gradient-to-b from-slate-600/40 to-transparent" />
      )}

      <div className="relative z-10">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${color} font-bold text-white shadow-lg`}
        >
          {step}
        </div>
      </div>

      <div className="flex-1 pb-6">
        <div className="mb-1.5 flex items-center gap-2">
          <Icon className={`h-4 w-4 text-orange-400`} />
          <h4 className="font-semibold text-white">{title}</h4>
        </div>
        <p className="text-sm leading-relaxed text-slate-400">{description}</p>
      </div>
    </div>
  );
}

interface ShortcutRowProps {
  keys: string[];
  action: string;
  description: string;
}

function ShortcutRow({ keys, action, description }: ShortcutRowProps) {
  return (
    <tr className="border-b border-slate-700/40 last:border-0">
      <td className="py-3 pr-4">
        <div className="flex flex-wrap gap-1.5">
          {keys.map((k, i) => (
            <span key={i}>
              {i > 0 && <span className="mx-0.5 text-xs text-slate-600">+</span>}
              <kbd className="inline-flex min-w-[28px] items-center justify-center rounded-md border border-slate-600/60 bg-slate-900/80 px-2 py-1 font-jetbrains text-[11px] font-medium text-slate-300 shadow-inner">
                {k}
              </kbd>
            </span>
          ))}
        </div>
      </td>
      <td className="py-3 pr-4 font-medium text-white">{action}</td>
      <td className="py-3 text-sm text-slate-400">{description}</td>
    </tr>
  );
}

interface PlanCompareRowProps {
  feature: string;
  planA: { value: string; type: 'good' | 'neutral' | 'bad' };
  planB: { value: string; type: 'good' | 'neutral' | 'bad' };
  planC: { value: string; type: 'good' | 'neutral' | 'bad' };
}

function PlanBadge({ value, type }: { value: string; type: 'good' | 'neutral' | 'bad' }) {
  const styles = {
    good: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
    neutral: 'border-sky-500/30 bg-sky-500/10 text-sky-400',
    bad: 'border-rose-500/30 bg-rose-500/10 text-rose-400',
  };
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-1 text-xs font-medium ${styles[type]}`}
    >
      {value}
    </span>
  );
}

function PlanCompareRow({ feature, planA, planB, planC }: PlanCompareRowProps) {
  return (
    <tr className="border-b border-slate-700/40 last:border-0">
      <td className="py-3 pr-4 font-medium text-slate-300">{feature}</td>
      <td className="py-3 pr-4">
        <PlanBadge value={planA.value} type={planA.type} />
      </td>
      <td className="py-3 pr-4">
        <PlanBadge value={planB.value} type={planB.type} />
      </td>
      <td className="py-3">
        <PlanBadge value={planC.value} type={planC.type} />
      </td>
    </tr>
  );
}

export default function Guide() {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#0F172A]">
      <div className="absolute inset-0 grid-bg opacity-[0.5]" />

      <div className="pointer-events-none absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-sky-500/15 blur-[160px]" />
      <div className="pointer-events-none absolute -bottom-40 -left-40 h-[520px] w-[520px] rounded-full bg-orange-500/12 blur-[160px]" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0F172A]/95" />

      <div className="relative z-10 mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        <motion.div
          variants={headerVariants}
          initial="hidden"
          animate="visible"
          className="mb-6 flex items-center justify-between sm:mb-8"
        >
          <button
            onClick={() => navigate('/')}
            className="group flex items-center gap-2 rounded-xl border border-slate-700/60 bg-slate-800/60 px-4 py-2.5 text-sm font-semibold text-slate-300 backdrop-blur-xl transition-all hover:border-orange-500/40 hover:bg-slate-800/80 hover:text-orange-300"
          >
            <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-0.5" />
            <span>返回主菜单</span>
          </button>

          <div className="flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1.5 backdrop-blur">
            <BookOpen className="h-4 w-4 text-violet-400" />
            <span className="text-sm font-semibold text-violet-300">操作手册 v1.0</span>
          </div>
        </motion.div>

        <motion.div
          variants={headerVariants}
          initial="hidden"
          animate="visible"
          className="mb-6 sm:mb-8"
        >
          <div className="mb-2 flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 blur-xl opacity-40" />
              <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-500 shadow-lg shadow-violet-500/30 ring-1 ring-violet-300/30">
                <BookOpen className="h-6 w-6 text-white" strokeWidth={2.2} />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
                操作说明
              </h1>
              <p className="text-xs text-slate-400 sm:text-sm">
                新手调度官必读 · 掌握核心玩法与评分规则
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-4 sm:space-y-5"
        >
          <SectionCard
            icon={Target}
            iconBg="bg-orange-500/20"
            iconColor="text-orange-400"
            title="游戏目标"
            subtitle="在有限时间内，通过精准调度实现效益最大化"
            borderAccent="from-orange-500 to-amber-500"
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                {
                  icon: Car,
                  label: '完成维修',
                  desc: '尽可能多地完成车辆维修工单',
                  color: 'text-sky-400',
                  bg: 'bg-sky-500/15',
                },
                {
                  icon: ShieldAlert,
                  label: '控制返修',
                  desc: '降低返修率，保证维修质量',
                  color: 'text-emerald-400',
                  bg: 'bg-emerald-500/15',
                },
                {
                  icon: Zap,
                  label: '高效利用',
                  desc: '合理分配工位，最大化时间利用率',
                  color: 'text-amber-400',
                  bg: 'bg-amber-500/15',
                },
              ].map((item, i) => {
                const ItemIcon = item.icon;
                return (
                  <div
                    key={i}
                    className={`rounded-xl border border-slate-700/40 ${item.bg} p-4`}
                  >
                    <ItemIcon className={`mb-2 h-5 w-5 ${item.color}`} />
                    <div className="mb-1 font-bold text-white">{item.label}</div>
                    <div className="text-xs leading-relaxed text-slate-400">
                      {item.desc}
                    </div>
                  </div>
                );
              })}
            </div>
          </SectionCard>

          <SectionCard
            icon={GitBranch}
            iconBg="bg-sky-500/20"
            iconColor="text-sky-400"
            title="操作流程"
            subtitle="五步标准工作流，形成肌肉记忆"
            borderAccent="from-sky-500 to-cyan-500"
          >
            <div className="space-y-1">
              <FlowStep
                icon={Eye}
                step={1}
                title="观察"
                description="查看待修车辆队列，了解车型、故障类型和预估工时。关注紧急车辆（红色标识）的优先级。"
                color="from-sky-500 to-sky-600"
              />
              <FlowStep
                icon={Stethoscope}
                step={2}
                title="诊断"
                description="点击车辆查看详细诊断报告，确认所需工序、配件清单和预计工时，制定维修策略。"
                color="from-violet-500 to-purple-600"
              />
              <FlowStep
                icon={Settings2}
                step={3}
                title="分配"
                description="根据工位类型与当前负载，将车辆分配到最合适的工位。匹配度影响维修速度与质量。"
                color="from-emerald-500 to-teal-600"
              />
              <FlowStep
                icon={PackageX}
                step={4}
                title="处理缺货"
                description="遇到配件缺货时，选择紧急调货（快但贵）、替代配件（有返修风险）或等待（慢但稳）。"
                color="from-amber-500 to-orange-600"
              />
              <FlowStep
                icon={ClipboardCheck}
                step={5}
                title="复盘"
                description="关卡结束后查看评分、返修率和时间利用率，总结经验改进下一局调度策略。"
                color="from-rose-500 to-pink-600"
              />
            </div>
          </SectionCard>

          <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-2">
            <SectionCard
              icon={Hand}
              iconBg="bg-emerald-500/20"
              iconColor="text-emerald-400"
              title="触屏操作"
              subtitle="支持平板和触屏设备的手势交互"
              borderAccent="from-emerald-500 to-teal-500"
            >
              <div className="space-y-3">
                {[
                  {
                    gesture: '单击',
                    desc: '选择车辆 / 工位，打开详情面板',
                  },
                  {
                    gesture: '长按',
                    desc: '在车辆上长按后拖拽到目标工位完成分配',
                  },
                  {
                    gesture: '双指缩放',
                    desc: '放大/缩小3D车间场景视图',
                  },
                  {
                    gesture: '双指旋转',
                    desc: '旋转3D场景视角，全方位观察工位',
                  },
                  {
                    gesture: '滑动',
                    desc: '左右滑动切换侧边面板标签页',
                  },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 rounded-lg border border-slate-700/40 bg-slate-900/30 p-3"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 font-jetbrains text-xs font-bold text-emerald-400">
                      {i + 1}
                    </div>
                    <div>
                      <div className="mb-0.5 font-semibold text-white">
                        {item.gesture}
                      </div>
                      <div className="text-xs text-slate-400">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard
              icon={Keyboard}
              iconBg="bg-violet-500/20"
              iconColor="text-violet-400"
              title="键盘快捷键"
              subtitle="桌面端高效操作必备"
              borderAccent="from-violet-500 to-purple-500"
            >
              <div className="overflow-hidden rounded-xl border border-slate-700/40">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-700/50 bg-slate-900/50">
                      <th className="px-3 py-2.5 font-semibold text-slate-400">
                        按键
                      </th>
                      <th className="px-3 py-2.5 font-semibold text-slate-400">
                        功能
                      </th>
                      <th className="px-3 py-2.5 font-semibold text-slate-400">
                        说明
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/30">
                    <ShortcutRow
                      keys={['Esc']}
                      action="暂停/继续"
                      description="打开暂停菜单或返回游戏"
                    />
                    <ShortcutRow
                      keys={['Space']}
                      action="暂停游戏"
                      description="快速暂停游戏进行思考"
                    />
                    <ShortcutRow
                      keys={['1', '2', '3']}
                      action="切换面板"
                      description="1=诊断 2=分配 3=库存"
                    />
                    <ShortcutRow
                      keys={['Tab']}
                      action="聚焦下一辆"
                      description="循环选择待修队列车辆"
                    />
                    <ShortcutRow
                      keys={['Enter']}
                      action="确认分配"
                      description="将选中车辆分配到高亮工位"
                    />
                    <ShortcutRow
                      keys={['R']}
                      action="重新开始"
                      description="（暂停后）重玩当前关卡"
                    />
                    <ShortcutRow
                      keys={['W', 'A', 'S', 'D']}
                      action="移动视角"
                      description="平移3D场景摄像机"
                    />
                    <ShortcutRow
                      keys={['Q', 'E']}
                      action="旋转视角"
                      description="左右旋转3D场景视角"
                    />
                    <ShortcutRow
                      keys={['Ctrl', 'Z']}
                      action="撤销分配"
                      description="撤回上一次工位分配操作"
                    />
                  </tbody>
                </table>
              </div>
            </SectionCard>
          </div>

          <SectionCard
            icon={Trophy}
            iconBg="bg-amber-500/20"
            iconColor="text-amber-400"
            title="评分规则"
            subtitle="得分 = 基础分 + 效率加成 - 质量惩罚"
            borderAccent="from-amber-500 to-yellow-500"
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-400" />
                  <span className="font-bold text-emerald-400">加分项</span>
                </div>
                {[
                  { label: '完成维修工单', value: '+100~300 / 单', note: '依难度等级浮动' },
                  { label: '零返修完美交付', value: '+150 / 辆', note: '无任何工序返修' },
                  { label: '工位匹配度高', value: '+20% 工时', note: '专业工位加成' },
                  { label: '提前完成订单', value: '+80 / 单', note: '在预估时间前完成' },
                  { label: '紧急车辆优先', value: '+50 / 辆', note: '红色紧急车辆' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start justify-between gap-3 text-sm">
                    <span className="text-slate-300">{item.label}</span>
                    <div className="text-right">
                      <div className="font-jetbrains font-bold text-emerald-400">
                        {item.value}
                      </div>
                      <div className="text-[10px] text-slate-500">{item.note}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-2 rounded-xl border border-rose-500/20 bg-rose-500/5 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-rose-400" />
                  <span className="font-bold text-rose-400">减分项</span>
                </div>
                {[
                  { label: '工序返修', value: '-80 / 次', note: '每次返修扣分' },
                  { label: '返修率超标 (>15%)', value: '-200 总分', note: '关卡级惩罚' },
                  { label: '工位错误分配', value: '-30% 效率', note: '严重拖慢进度' },
                  { label: '配件紧急调货', value: '-50~150', note: '依调货次数' },
                  { label: '超时未交付', value: '-100 / 辆', note: '关卡结束仍在修' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start justify-between gap-3 text-sm">
                    <span className="text-slate-300">{item.label}</span>
                    <div className="text-right">
                      <div className="font-jetbrains font-bold text-rose-400">
                        {item.value}
                      </div>
                      <div className="text-[10px] text-slate-500">{item.note}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-amber-500/20 bg-gradient-to-r from-amber-500/10 via-transparent to-orange-500/10 p-4">
              <div className="mb-3 flex items-center gap-2">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                <span className="font-bold text-amber-400">星级评定标准</span>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {[
                  {
                    stars: 1,
                    label: '通过',
                    desc: '完成率 ≥ 40%',
                    color: 'from-sky-500 to-cyan-500',
                    text: 'text-sky-400',
                  },
                  {
                    stars: 2,
                    label: '优秀',
                    desc: '完成率 ≥ 70% 且返修率 ≤ 20%',
                    color: 'from-violet-500 to-purple-500',
                    text: 'text-violet-400',
                  },
                  {
                    stars: 3,
                    label: '大师',
                    desc: '完成率 ≥ 90% 且返修率 ≤ 8%',
                    color: 'from-amber-500 to-orange-500',
                    text: 'text-amber-400',
                  },
                ].map((item) => (
                  <div
                    key={item.stars}
                    className={`rounded-lg border border-slate-700/40 bg-slate-900/40 p-3`}
                  >
                    <div className="mb-1 flex items-center gap-0.5">
                      {Array.from({ length: 3 }, (_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < item.stars
                              ? `fill-${item.color.includes('sky') ? 'sky' : item.color.includes('violet') ? 'violet' : 'amber'}-400 text-${item.color.includes('sky') ? 'sky' : item.color.includes('violet') ? 'violet' : 'amber'}-400`
                              : 'fill-slate-700/50 text-slate-600'
                          }`}
                        />
                      ))}
                    </div>
                    <div className={`mb-0.5 text-sm font-bold ${item.text}`}>
                      {item.label}
                    </div>
                    <div className="text-[11px] text-slate-400">{item.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </SectionCard>

          <SectionCard
            icon={PackageX}
            iconBg="bg-rose-500/20"
            iconColor="text-rose-400"
            title="配件缺货方案对比"
            subtitle="三种策略，权衡速度、成本与质量"
            borderAccent="from-rose-500 to-pink-500"
          >
            <div className="overflow-hidden rounded-xl border border-slate-700/40">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-700/50 bg-slate-900/50">
                    <th className="px-3 py-2.5 font-semibold text-slate-400">对比维度</th>
                    <th className="px-3 py-2.5 font-semibold text-sky-300">
                      <div className="flex items-center gap-1.5">
                        <Zap className="h-3.5 w-3.5" /> 紧急调货
                      </div>
                    </th>
                    <th className="px-3 py-2.5 font-semibold text-amber-300">
                      <div className="flex items-center gap-1.5">
                        <Settings2 className="h-3.5 w-3.5" /> 替代配件
                      </div>
                    </th>
                    <th className="px-3 py-2.5 font-semibold text-emerald-300">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" /> 耐心等待
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <PlanCompareRow
                    feature="等待时间"
                    planA={{ value: '极短', type: 'good' }}
                    planB={{ value: '无等待', type: 'good' }}
                    planC={{ value: '较长', type: 'bad' }}
                  />
                  <PlanCompareRow
                    feature="额外成本"
                    planA={{ value: '高 (-150分)', type: 'bad' }}
                    planB={{ value: '中 (-50分)', type: 'neutral' }}
                    planC={{ value: '无', type: 'good' }}
                  />
                  <PlanCompareRow
                    feature="返修风险"
                    planA={{ value: '低 (~2%)', type: 'good' }}
                    planB={{ value: '高 (~25%)', type: 'bad' }}
                    planC={{ value: '无', type: 'good' }}
                  />
                  <PlanCompareRow
                    feature="质量保障"
                    planA={{ value: '原厂件', type: 'good' }}
                    planB={{ value: '兼容件', type: 'neutral' }}
                    planC={{ value: '原厂件', type: 'good' }}
                  />
                  <PlanCompareRow
                    feature="适用场景"
                    planA={{ value: '紧急车辆', type: 'neutral' }}
                    planB={{ value: '低价值工序', type: 'neutral' }}
                    planC={{ value: '时间充裕时', type: 'neutral' }}
                  />
                </tbody>
              </table>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-sky-500/20 bg-sky-500/5 p-3">
                <div className="mb-1 flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-sky-400" />
                  <span className="text-xs font-bold text-sky-400">推荐策略</span>
                </div>
                <p className="text-xs leading-relaxed text-slate-400">
                  紧急车辆或高价值工单使用，保证交付时间优先
                </p>
              </div>
              <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
                <div className="mb-1 flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                  <span className="text-xs font-bold text-amber-400">慎用策略</span>
                </div>
                <p className="text-xs leading-relaxed text-slate-400">
                  仅在非关键工序且时间紧迫时使用，避免核心维修使用
                </p>
              </div>
              <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
                <div className="mb-1 flex items-center gap-1.5">
                  <ShieldAlert className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-xs font-bold text-emerald-400">稳妥策略</span>
                </div>
                <p className="text-xs leading-relaxed text-slate-400">
                  追求零返修率时首选，配合充足工位缓冲使用
                </p>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            icon={Activity}
            iconBg="bg-teal-500/20"
            iconColor="text-teal-400"
            title="返修率影响因素"
            subtitle="了解这些因素，有效降低返修率冲击三星"
            borderAccent="from-teal-500 to-emerald-500"
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {[
                {
                  icon: XCircle,
                  title: '工位类型不匹配',
                  level: '高风险',
                  desc: '将需要专用设备的工序分配到通用工位，返修率飙升 30%~50%',
                  color: 'rose',
                },
                {
                  icon: PackageX,
                  title: '使用替代配件',
                  level: '高风险',
                  desc: '兼容件与原厂规格存在差异，返修率增加约 20%~25%',
                  color: 'orange',
                },
                {
                  icon: Clock,
                  title: '工位负载超饱和',
                  level: '中风险',
                  desc: '连续分配导致工序重叠，返修率增加约 10%~15%',
                  color: 'amber',
                },
                {
                  icon: Target,
                  title: '工序顺序错误',
                  level: '中风险',
                  desc: '未按诊断建议顺序执行，返修率增加约 8%~12%',
                  color: 'violet',
                },
                {
                  icon: Minus,
                  title: '高里程老旧车辆',
                  level: '低风险',
                  desc: '车辆本身状况差，基础返修率 +3%~5%，属正常范围',
                  color: 'sky',
                },
                {
                  icon: CheckCircle2,
                  title: '专业工位+原厂件',
                  level: '保障',
                  desc: '最佳组合，返修率可稳定控制在 0%~3% 区间',
                  color: 'emerald',
                },
              ].map((item, i) => {
                const ItemIcon = item.icon;
                const isPositive = item.level === '保障';
                return (
                  <div
                    key={i}
                    className={`rounded-xl border p-4 transition-all hover:border-opacity-80 ${
                      isPositive
                        ? 'border-emerald-500/30 bg-emerald-500/5'
                        : item.color === 'rose'
                          ? 'border-rose-500/25 bg-rose-500/5'
                          : item.color === 'orange'
                            ? 'border-orange-500/25 bg-orange-500/5'
                            : item.color === 'amber'
                              ? 'border-amber-500/25 bg-amber-500/5'
                              : item.color === 'violet'
                                ? 'border-violet-500/25 bg-violet-500/5'
                                : 'border-sky-500/25 bg-sky-500/5'
                    }`}
                  >
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                            isPositive
                              ? 'bg-emerald-500/20'
                              : item.color === 'rose'
                                ? 'bg-rose-500/20'
                                : item.color === 'orange'
                                  ? 'bg-orange-500/20'
                                  : item.color === 'amber'
                                    ? 'bg-amber-500/20'
                                    : item.color === 'violet'
                                      ? 'bg-violet-500/20'
                                      : 'bg-sky-500/20'
                          }`}
                        >
                          <ItemIcon
                            className={`h-4 w-4 ${
                              isPositive
                                ? 'text-emerald-400'
                                : item.color === 'rose'
                                  ? 'text-rose-400'
                                  : item.color === 'orange'
                                    ? 'text-orange-400'
                                    : item.color === 'amber'
                                      ? 'text-amber-400'
                                      : item.color === 'violet'
                                        ? 'text-violet-400'
                                        : 'text-sky-400'
                            }`}
                          />
                        </div>
                        <span className="font-semibold text-white">{item.title}</span>
                      </div>
                      <span
                        className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold ${
                          isPositive
                            ? 'bg-emerald-500/15 text-emerald-400'
                            : item.color === 'rose'
                              ? 'bg-rose-500/15 text-rose-400'
                              : item.color === 'orange'
                                ? 'bg-orange-500/15 text-orange-400'
                                : item.color === 'amber'
                                  ? 'bg-amber-500/15 text-amber-400'
                                  : item.color === 'violet'
                                    ? 'bg-violet-500/15 text-violet-400'
                                    : 'bg-sky-500/15 text-sky-400'
                        }`}
                      >
                        {item.level}
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed text-slate-400">{item.desc}</p>
                  </div>
                );
              })}
            </div>
          </SectionCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.6 }}
          className="mt-8 flex justify-center text-xs text-slate-600"
        >
          提示：先完成 L1 入门关卡熟悉操作，再挑战更高难度
        </motion.div>
      </div>
    </div>
  );
}
