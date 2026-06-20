"use client";

import { useState } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/DashboardLayout";
import {
  Theater,
  Calendar,
  MapPin,
  Users,
  AlertTriangle,
  ChevronRight,
  Search,
} from "lucide-react";
import { format, addDays } from "date-fns";

interface Performance {
  id: string;
  name: string;
  venue: string;
  startTime: string;
  endTime: string;
  totalSeats: number;
  soldSeats: number;
  status: string;
  hasCancel?: boolean;
}

export default function PerformancesPage() {
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const performances: Performance[] = [
    {
      id: "perf-1",
      name: "印象西湖",
      venue: "西湖水上剧场",
      startTime: new Date().toISOString(),
      endTime: addDays(new Date(), 1).toISOString(),
      totalSeats: 1500,
      soldSeats: 1200,
      status: "cancelled",
      hasCancel: true,
    },
    {
      id: "perf-2",
      name: "宋城千古情",
      venue: "宋城大剧院",
      startTime: addDays(new Date(), 1).toISOString(),
      endTime: addDays(new Date(), 1).toISOString(),
      totalSeats: 800,
      soldSeats: 650,
      status: "selling",
    },
    {
      id: "perf-3",
      name: "山海经奇幻秀",
      venue: "奇幻剧场",
      startTime: addDays(new Date(), 2).toISOString(),
      endTime: addDays(new Date(), 2).toISOString(),
      totalSeats: 600,
      soldSeats: 420,
      status: "selling",
    },
    {
      id: "perf-4",
      name: "山水实景演出",
      venue: "山水剧场",
      startTime: addDays(new Date(), 3).toISOString(),
      endTime: addDays(new Date(), 3).toISOString(),
      totalSeats: 2000,
      soldSeats: 1800,
      status: "almost_full",
    },
    {
      id: "perf-5",
      name: "民俗文化表演",
      venue: "民俗广场",
      startTime: addDays(new Date(), 4).toISOString(),
      endTime: addDays(new Date(), 4).toISOString(),
      totalSeats: 400,
      soldSeats: 150,
      status: "selling",
    },
  ];

  const filteredPerformances
    = statusFilter === "all"
      ? performances
      : performances.filter((p) => p.status === statusFilter);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "selling":
        return <span className="badge badge-success">售票中</span>;
      case "almost_full":
        return <span className="badge badge-warning">即将售罄</span>;
      case "sold_out":
        return <span className="badge badge-error">已售罄</span>;
      case "cancelled":
        return <span className="badge badge-error">已取消</span>;
      default:
        return <span className="badge badge-info">{status}</span>;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white mb-1">演出管理</h2>
            <p className="text-sm text-slate-400">
              查看演出场次、座位销售情况及取消事件
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
              />
              <input
                type="text"
                placeholder="搜索演出..."
                className="w-64 pl-9 pr-4 py-2 bg-dark-800/50 border border-white/10 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary-500/50"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {[
            { key: "all", label: "全部" },
            { key: "selling", label: "售票中" },
            { key: "almost_full", label: "即将售罄" },
            { key: "cancelled", label: "已取消" },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setStatusFilter(item.key)}
              className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                statusFilter === item.key
                  ? "bg-primary-500/20 text-primary-400 border border-primary-500/30"
                  : "bg-white/5 text-slate-400 hover:text-white hover:bg-white/10"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-4 gap-4">
          {filteredPerformances.map((perf, index) => {
            const occupancyRate = (perf.soldSeats / perf.totalSeats) * 100;

            return (
              <Link
                key={perf.id}
                href={`/performances/${perf.id}`}
                className="glass-card glass-card-hover p-5 cursor-pointer group"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/20 to-violet-600/10 flex items-center justify-center"
                  >
                    <Theater size={24} className="text-violet-400" />
                  </div>
                  {getStatusBadge(perf.status)}
                </div>

                <h3 className="font-semibold text-white mb-2 group-hover:text-primary-400 transition-colors">
                  {perf.name}
                </h3>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-slate-400">
                    <MapPin size={14} />
                    <span>{perf.venue}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <Calendar size={14} />
                    <span>
                      {format(new Date(perf.startTime), "MM-dd HH:mm")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <Users size={14} />
                    <span>
                      {perf.soldSeats.toLocaleString()}/
                      {perf.totalSeats.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-500">上座率</span>
                    <span className="font-mono text-slate-300">
                      {occupancyRate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-dark-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        perf.status === "cancelled"
                          ? "bg-red-500"
                          : occupancyRate > 90
                          ? "bg-gradient-to-r from-red-500 to-orange-500"
                          : "bg-gradient-to-r from-primary-500 to-cyan-500"
                      }`}
                      style={{ width: `${occupancyRate}%` }}
                    />
                  </div>
                </div>

                {perf.hasCancel && (
                  <div className="mt-4 p-2 bg-accent-500/10 border border-accent-500/20 rounded-lg flex items-center gap-2">
                    <AlertTriangle
                      size={14}
                      className="text-accent-500"
                    />
                    <span className="text-xs text-accent-400">
                      演出已取消
                    </span>
                    <ChevronRight
                      size={14}
                      className="ml-auto text-accent-500"
                    />
                  </div>
                )}

                <div className="mt-4 flex items-center justify-end">
                  <span className="text-sm text-primary-400 flex items-center gap-1 group-hover:gap-2 transition-all">
                    查看详情
                    <ChevronRight size={16} />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="glass-card p-5">
          <h3 className="section-title mb-4">
            <AlertTriangle size={18} className="text-accent-400" />
            近期取消演出
          </h3>
          <table className="data-table w-full">
            <thead>
              <tr>
                <th>演出名称</th>
                <th>场地</th>
                <th>原演出时间</th>
                <th>取消时间</th>
                <th>原因</th>
                <th>影响人数</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="font-medium text-white">印象西湖</td>
                <td>西湖水上剧场</td>
                <td>2024-06-18 19:30</td>
                <td>2024-06-17 14:20</td>
                <td>暴雨天气</td>
                <td className="font-mono text-accent-400">1,200 人</td>
                <td>
                  <Link
                    href="/performances/perf-1"
                    className="text-primary-400 hover:text-primary-300 text-sm"
                  >
                    查看详情
                  </Link>
                </td>
              </tr>
              <tr>
                <td className="font-medium text-white">宋城千古情</td>
                <td>宋城大剧院</td>
                <td>2024-06-15 20:00</td>
                <td>2024-06-15 10:00</td>
                <td>设备检修</td>
                <td className="font-mono text-accent-400">800 人</td>
                <td>
                  <Link
                    href="/performances/perf-2"
                    className="text-primary-400 hover:text-primary-300 text-sm"
                  >
                    查看详情
                  </Link>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
