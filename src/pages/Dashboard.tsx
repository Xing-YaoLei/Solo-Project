import { PageHeader, Card, StatusBadge } from '@/components/UI';
import { usePrescriptionStore } from '@/stores/prescriptionStore';
import { dashboardStats, storeProgress } from '@/mock/data';
import { Clock, CheckCircle2, AlertTriangle, TrendingUp } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const PIE_COLORS: Record<string, string> = {
  pending: '#64748B',
  in_review: '#60A5FA',
  approved: '#2EC4B6',
  rejected: '#EF4444',
  exception: '#E36414',
};

const STATUS_LABELS: Record<string, string> = {
  pending: '待审核',
  in_review: '审核中',
  approved: '已通过',
  rejected: '已驳回',
  exception: '异常',
};

const STAT_CARDS = [
  {
    key: 'pending_count',
    label: '待审核处方',
    icon: Clock,
    color: 'bg-slate-100',
    iconColor: 'text-slate-500',
    subtitle: '需及时处理',
    get value() {
      return dashboardStats.pending_count;
    },
  },
  {
    key: 'approved_count',
    label: '已通过处方',
    icon: CheckCircle2,
    color: 'bg-mint-50',
    iconColor: 'text-mint-400',
    subtitle: '审核完成',
    get value() {
      return dashboardStats.approved_count;
    },
  },
  {
    key: 'exception_count',
    label: '异常处方',
    icon: AlertTriangle,
    color: 'bg-amber-50',
    iconColor: 'text-amber-400',
    subtitle: '需关注处理',
    get value() {
      return dashboardStats.exception_count;
    },
  },
  {
    key: 'approval_rate',
    label: '审核通过率',
    icon: TrendingUp,
    color: 'bg-brand-50',
    iconColor: 'text-brand-500',
    subtitle: '已完成审核',
    get value() {
      return `${(dashboardStats.approval_rate * 100).toFixed(1)}%`;
    },
  },
];

const pieData = [
  { name: '待审核', value: dashboardStats.pending_count, status: 'pending' },
  { name: '审核中', value: 3, status: 'in_review' },
  { name: '已通过', value: dashboardStats.approved_count, status: 'approved' },
  { name: '已驳回', value: dashboardStats.rejected_count, status: 'rejected' },
  { name: '异常', value: dashboardStats.exception_count, status: 'exception' },
];

export default function Dashboard() {
  const { exceptions } = usePrescriptionStore();
  const recentExceptions = [...exceptions]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  const barData = storeProgress.map((s) => ({
    name: s.store_name.replace('健康大药房', ''),
    待审核: s.pending,
    已通过: s.approved,
    已驳回: s.rejected,
    异常: s.exception,
  }));

  return (
    <div className="space-y-6">
      <PageHeader title="仪表盘" description="处方审核效率与异常分布概览" />

      <div className="grid grid-cols-4 gap-4">
        {STAT_CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.key}>
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-full ${card.color} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${card.iconColor}`} />
                </div>
                <div>
                  <p className="text-sm text-slate-500">{card.label}</p>
                  <p className="text-2xl font-bold text-slate-800 mt-0.5">{card.value}</p>
                  <p className="text-2xs text-slate-400 mt-0.5">{card.subtitle}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card title="门店审核进度">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 12, fill: '#64748B' }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #E2E8F0',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="待审核" stackId="a" fill="#64748B" radius={[0, 0, 0, 0]} />
                <Bar dataKey="已通过" stackId="a" fill="#2EC4B6" />
                <Bar dataKey="已驳回" stackId="a" fill="#EF4444" />
                <Bar dataKey="异常" stackId="a" fill="#E36414" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="处方状态分布">
          <div className="h-72 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, value }) => `${name} ${value}`}
                >
                  {pieData.map((entry) => (
                    <Cell key={entry.status} fill={PIE_COLORS[entry.status]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #E2E8F0',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-center gap-4 mt-2">
            {pieData.map((entry) => (
              <div key={entry.status} className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: PIE_COLORS[entry.status] }}
                />
                <span className="text-2xs text-slate-500">{entry.name}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card title="最近异常记录">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left py-2.5 px-3 text-slate-500 font-medium">异常编号</th>
                <th className="text-left py-2.5 px-3 text-slate-500 font-medium">处方编号</th>
                <th className="text-left py-2.5 px-3 text-slate-500 font-medium">原因</th>
                <th className="text-left py-2.5 px-3 text-slate-500 font-medium">状态</th>
                <th className="text-left py-2.5 px-3 text-slate-500 font-medium">处理人</th>
                <th className="text-left py-2.5 px-3 text-slate-500 font-medium">创建时间</th>
              </tr>
            </thead>
            <tbody>
              {recentExceptions.map((ex) => (
                <tr key={ex.id} className="border-b border-slate-50 hover:bg-slate-25">
                  <td className="py-3 px-3 font-medium text-brand-500">{ex.exception_no}</td>
                  <td className="py-3 px-3 text-slate-600">{ex.prescription_no}</td>
                  <td className="py-3 px-3 text-slate-600 max-w-xs truncate">{ex.reason}</td>
                  <td className="py-3 px-3">
                    <StatusBadge status={ex.status} />
                  </td>
                  <td className="py-3 px-3 text-slate-600">{ex.assignee_name}</td>
                  <td className="py-3 px-3 text-slate-400 text-xs">
                    {new Date(ex.created_at).toLocaleString('zh-CN', {
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
