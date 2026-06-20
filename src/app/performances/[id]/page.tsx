"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import SeatChart from "@/components/SeatChart";
import {
  ArrowLeft,
  Theater,
  MapPin,
  Calendar,
  Users,
  AlertTriangle,
  Info,
  Ticket,
} from "lucide-react";
import { format } from "date-fns";

interface SeatData {
  id: string;
  row: string;
  number: string;
  status: string;
  price: number;
  orderId?: string;
}

export default function PerformanceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params;

  const [activeTab, setActiveTab] = useState<"seats" | "info">("seats");

  const performance = {
    id,
    name: "印象西湖",
    venue: "西湖水上剧场",
    startTime: new Date().toISOString(),
    endTime: new Date().toISOString(),
    totalSeats: 1500,
    soldSeats: 1200,
    status: "cancelled",
    cancelInfo: {
      id: "cancel-1",
      cancelTime: new Date().toISOString(),
      reason: "受台风天气影响，为确保观众安全，演出取消",
      affectedCount: 1200,
    },
  };

  const seats: SeatData[] = [];
  const rows = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];
  const seatsPerRow = 20;

  rows.forEach((row) => {
    for (let i = 1; i <= seatsPerRow; i++) {
      const random = Math.random();
      let status = "available";
      if (random < 0.6) status = "sold";
      else if (random < 0.75) status = "reserved";

      seats.push({
        id: `seat-${row}-${i}`,
        row,
        number: String(i),
        status,
        price: row <= "C" ? 388 : row <= "F" ? 288 : 188,
        orderId:
          status === "sold"
            ? `ORD-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
            : undefined,
      });
    }
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-xl font-semibold text-white mb-1">
              {performance.name}
            </h2>
            <p className="text-sm text-slate-400">演出详情与座位分布</p>
          </div>
        </div>

        {performance.cancelInfo && (
          <div className="p-4 bg-accent-500/10 border border-accent-500/30 rounded-xl flex items-start gap-3">
            <AlertTriangle size={20} className="text-accent-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-accent-400 mb-1">演出已取消</h4>
              <p className="text-sm text-slate-300">
                {performance.cancelInfo.reason}
              </p>
              <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                <span>
                  取消时间:{" "}
                  {format(
                    new Date(performance.cancelInfo.cancelTime),
                    "yyyy-MM-dd HH:mm"
                  )}
                </span>
                <span>
                  影响观众:{" "}
                  <span className="text-accent-400 font-mono">
                    {performance.cancelInfo.affectedCount.toLocaleString()} 人
                  </span>
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-4 gap-4">
          <div className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center">
                <Theater size={20} className="text-primary-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500">演出名称</p>
                <p className="text-sm font-medium text-white">
                  {performance.name}
                </p>
              </div>
            </div>
          </div>

          <div className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <MapPin size={20} className="text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500">演出场地</p>
                <p className="text-sm font-medium text-white">
                  {performance.venue}
                </p>
              </div>
            </div>
          </div>

          <div className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
                <Calendar size={20} className="text-violet-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500">演出时间</p>
                <p className="text-sm font-medium text-white">
                  {format(new Date(performance.startTime), "MM-dd HH:mm")}
                </p>
              </div>
            </div>
          </div>

          <div className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent-500/20 flex items-center justify-center">
                <Users size={20} className="text-accent-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500">上座率</p>
                <p className="text-sm font-mono font-semibold text-white">
                  {(
                    (performance.soldSeats / performance.totalSeats) *
                    100
                  ).toFixed(1)}
                  %
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 border-b border-white/5 pb-1">
          {[
            { key: "seats", label: "座位分布", icon: <Ticket size={16} /> },
            { key: "info", label: "演出信息", icon: <Info size={16} /> },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm transition-colors border-b-2 -mb-px ${
                activeTab === tab.key
                  ? "text-primary-400 border-primary-500"
                  : "text-slate-400 border-transparent hover:text-white"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "seats" && (
          <div className="glass-card p-6">
            <SeatChart seats={seats} performanceName={performance.name} />
          </div>
        )}

        {activeTab === "info" && (
          <div className="grid grid-cols-2 gap-6">
            <div className="glass-card p-5">
              <h3 className="section-title mb-4">
                <Info size={18} className="text-primary-400" />
                演出介绍
              </h3>
              <div className="space-y-3 text-sm text-slate-300 leading-relaxed">
                <p>
                  《印象西湖》是一部大型山水实景演出，以西湖为舞台，融合了灯光、音乐、舞蹈等多种艺术形式。
                </p>
                <p>
                  演出时长约70分钟，观众将沉浸在美轮美奂的视觉盛宴中，感受江南水乡的独特魅力。
                </p>
                <p>
                  演出由著名导演张艺谋担任艺术总监，主创团队均为国内外顶尖艺术家。
                </p>
              </div>
            </div>

            <div className="glass-card p-5">
              <h3 className="section-title mb-4">
                <Ticket size={18} className="text-accent-400" />
                票价信息
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-dark-800/50 rounded-lg">
                  <span className="text-sm text-slate-300">VIP 区 (A-C排)</span>
                  <span className="font-mono text-lg text-accent-400 font-semibold">
                    ¥388
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-dark-800/50 rounded-lg">
                  <span className="text-sm text-slate-300">
                    贵宾区 (D-F排)
                  </span>
                  <span className="font-mono text-lg text-primary-400 font-semibold">
                    ¥288
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-dark-800/50 rounded-lg">
                  <span className="text-sm text-slate-300">
                    普通区 (G-J排)
                  </span>
                  <span className="font-mono text-lg text-emerald-400 font-semibold">
                    ¥188
                  </span>
                </div>
              </div>
            </div>

            <div className="glass-card p-5 col-span-2">
              <h3 className="section-title mb-4">
                <AlertTriangle size={18} className="text-accent-400" />
                取消与退款说明
              </h3>
              <div className="space-y-2 text-sm text-slate-300">
                <p>
                  • 如因不可抗力因素（如恶劣天气、设备故障等）导致演出取消，我们将为您办理全额退款。
                </p>
                <p>
                  • 退款将在7个工作日内原路返还至您的支付账户。
                </p>
                <p>
                  • 如需了解更多详情，请联系客服热线：400-888-8888
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
