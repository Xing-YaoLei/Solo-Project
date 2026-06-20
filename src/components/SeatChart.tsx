"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Ticket, X } from "lucide-react";

interface SeatData {
  id: string;
  row: string;
  number: string;
  status: string;
  price: number;
  orderId?: string;
}

interface SeatChartProps {
  seats: SeatData[];
  performanceName: string;
  onSeatClick?: (seat: SeatData) => void;
}

export default function SeatChart({
  seats,
  performanceName,
  onSeatClick,
}: SeatChartProps) {
  const [selectedSeat, setSelectedSeat] = useState<SeatData | null>(null);

  const rows = [...new Set(seats.map((s) => s.row))].sort();

  const getSeatColor = (status: string) => {
    switch (status) {
      case "sold":
        return "bg-emerald-500 hover:bg-emerald-400";
      case "reserved":
        return "bg-amber-500 hover:bg-amber-400";
      case "available":
        return "bg-dark-700 hover:bg-dark-600 border border-white/10";
      default:
        return "bg-dark-800";
    }
  };

  const handleSeatClick = (seat: SeatData) => {
    setSelectedSeat(seat);
    onSeatClick?.(seat);
  };

  const soldCount = seats.filter((s) => s.status === "sold").length;
  const occupancyRate = seats.length > 0 ? (soldCount / seats.length) * 100 : 0;

  return (
    <div className="w-full">
      <div className="text-center mb-8">
        <div className="inline-block px-8 py-2 bg-gradient-to-r from-primary-600/20 via-primary-500/30 to-primary-600/20 rounded-lg border border-primary-500/30">
          <span className="font-mono text-sm text-primary-300">
            {performanceName} · 舞台
          </span>
        </div>
        <div className="h-1 w-48 mx-auto mt-2 bg-gradient-to-r from-transparent via-primary-500/50 to-transparent rounded-full" />
      </div>

      <div className="flex flex-col items-center gap-1.5 px-4 overflow-x-auto">
        {rows.map((row, rowIndex) => {
          const rowSeats = seats
            .filter((s) => s.row === row)
            .sort((a, b) => parseInt(a.number) - parseInt(b.number));

          return (
            <motion.div
              key={row}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: rowIndex * 0.05 }}
              className="flex items-center gap-1.5"
            >
              <span className="w-6 text-xs text-slate-500 text-right font-mono">
                {row}
              </span>
              <div className="flex gap-1">
                {rowSeats.map((seat) => (
                  <motion.button
                    key={seat.id}
                    whileHover={{ scale: 1.2, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleSeatClick(seat)}
                    className={`w-5 h-5 rounded-sm ${getSeatColor(
                      seat.status
                    )} transition-all duration-150 cursor-pointer`}
                    title={`${seat.row}排${seat.number}座 - ¥${seat.price}`}
                  />
                ))}
              </div>
              <span className="w-6 text-xs text-slate-500 font-mono">
                {row}
              </span>
            </motion.div>
          );
        })}
      </div>

      <div className="flex justify-center gap-6 mt-8">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-sm bg-emerald-500" />
          <span className="text-xs text-slate-400">已售</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-sm bg-amber-500" />
          <span className="text-xs text-slate-400">预留</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-sm bg-dark-700 border border-white/10" />
          <span className="text-xs text-slate-400">可选</span>
        </div>
      </div>

      <div className="mt-6 text-center">
        <p className="text-sm text-slate-400">
          上座率:{" "}
          <span className="font-mono text-lg text-emerald-400 font-semibold">
            {occupancyRate.toFixed(1)}%
          </span>
          <span className="text-slate-500 ml-2">
            ({soldCount}/{seats.length})
          </span>
        </p>
      </div>

      {selectedSeat && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setSelectedSeat(null)}
        >
          <div
            className="glass-card p-6 w-80"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-mono font-semibold text-white flex items-center gap-2">
                <Ticket size={18} className="text-primary-400" />
                座位详情
              </h3>
              <button
                onClick={() => setSelectedSeat(null)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-slate-400">座位号</span>
                <span className="text-sm font-mono text-white">
                  {selectedSeat.row}排{selectedSeat.number}座
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-400">状态</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    selectedSeat.status === "sold"
                      ? "bg-emerald-500/20 text-emerald-400"
                      : selectedSeat.status === "reserved"
                      ? "bg-amber-500/20 text-amber-400"
                      : "bg-dark-700 text-slate-400"
                  }`}
                >
                  {selectedSeat.status === "sold"
                    ? "已售出"
                    : selectedSeat.status === "reserved"
                    ? "已预留"
                    : "可选购"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-400">票价</span>
                <span className="text-sm font-mono text-accent-400">
                  ¥{selectedSeat.price}
                </span>
              </div>
              {selectedSeat.orderId && (
                <div className="flex justify-between">
                  <span className="text-sm text-slate-400">订单号</span>
                  <span className="text-xs font-mono text-slate-300">
                    {selectedSeat.orderId}
                  </span>
                </div>
              )}
            </div>

            {selectedSeat.status !== "available" && (
              <button className="w-full mt-4 btn-primary text-sm">
                查看订单明细
              </button>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
