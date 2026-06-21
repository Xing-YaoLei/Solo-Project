'use client';

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell, ReferenceArea } from 'recharts';
import type { Conflict } from '@/types';
import { formatDate } from '@/lib/utils';
interface ConflictGapTimelineProps {
 conflicts: Conflict[];
}
export function ConflictGapTimeline({ conflicts }: ConflictGapTimelineProps) {
 const gapData = conflicts
 .filter((c) => c.dataGapStart && c.dataGapEnd)
 .map((conflict) => {
 const start = new Date(conflict.dataGapStart!);
 const end = new Date(conflict.dataGapEnd!);
 const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
 return {
 name: conflict.case?.caseName || conflict.id,
 start: formatDate(start),
 end: formatDate(end),
 days,
 conflict,
 };
 });
 const statusColors: Record<string, string> = {
 PENDING: '#f59e0b',
 RESOLVED: '#10b981',
 ESCALATED: '#ef4444',
 };
 return (
 <div className="h-[300px] w-full">
 <ResponsiveContainer width="100%" height="100%">
 <BarChart
 data={gapData}
 layout="vertical"
 margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
 >
 <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
 <XAxis type="number" domain={[0, 'auto']} />
 <YAxis
 dataKey="name"
 type="category"
 width={150}
 tick={{ fontSize: 11 }}
 />
 <Tooltip
 content={({ active, payload }) => {
 if (active && payload && payload.length) {
 const item = payload[0].payload;
 return (
 <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-lg">
 <p className="font-medium text-slate-900">
 {item.conflict.conflictType}
 </p>
 <p className="text-sm text-slate-600">
 缺口: {item.start} 至 {item.end}
 </p>
 <p className="text-sm text-slate-600">
 持续天数: {item.days} 天
 </p>
 <p className="text-sm text-slate-500">
 {item.conflict.description}
 </p>
 </div>
 );
 }
 return null;
 }}
 />
 <Bar dataKey="days" radius={[0, 4, 4, 0]}>
 {gapData.map((entry, index) => (
 <Cell
 key={`cell-${index}`}
 fill={statusColors[entry.conflict.status]}
 />
 ))}
 </Bar>
 </BarChart>
 </ResponsiveContainer>
 </div>
 );
}
