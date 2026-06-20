"use client";

import { motion } from "framer-motion";
import {
  Store,
  Smartphone,
  Camera,
  ArrowRight,
  Database,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";

interface SyncStatus {
  sourceType: string;
  sourceName: string;
  icon: React.ReactNode;
  status: "success" | "running" | "failed";
  lastSync: string;
  recordCount: number;
  color: string;
  syncing?: boolean;
}

interface SyncPipelineProps {
  statuses: SyncStatus[];
  onSyncClick?: (sourceType: string) => void;
}

const sourceConfig = {
  merchant: {
    name: "商户流水",
    icon: <Store size={24} />,
    color: "from-cyan-500 to-blue-500",
  },
  miniapp: {
    name: "小程序订单",
    icon: <Smartphone size={24} />,
    color: "from-emerald-500 to-teal-500",
  },
  camera: {
    name: "摄像头统计",
    icon: <Camera size={24} />,
    color: "from-violet-500 to-purple-500",
  },
};

export default function SyncPipeline({
  statuses,
  onSyncClick,
}: SyncPipelineProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle size={16} className="text-emerald-400" />;
      case "running":
        return <Loader2 size={16} className="text-primary-400 animate-spin" />;
      case "failed":
        return <AlertCircle size={16} className="text-red-400" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "success":
        return "同步成功";
      case "running":
        return "同步中";
      case "failed":
        return "同步失败";
      default:
        return status;
    }
  };

  return (
    <div className="space-y-4">
      {statuses.map((status, index) => {
        const config =
          sourceConfig[status.sourceType as keyof typeof sourceConfig] ||
          sourceConfig.merchant;

        return (
          <motion.div
            key={status.sourceType}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="glass-card p-4"
          >
            <div className="flex items-center gap-4">
              <div
                className={`w-12 h-12 rounded-xl bg-gradient-to-br ${config.color} flex items-center justify-center text-white shadow-lg`}
              >
                {config.icon}
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-white">{config.name}</h4>
                  {getStatusIcon(status.status)}
                  <span
                    className={`text-xs ${
                      status.status === "success"
                        ? "text-emerald-400"
                        : status.status === "running"
                        ? "text-primary-400"
                        : "text-red-400"
                    }`}
                  >
                    {getStatusText(status.status)}
                  </span>
                </div>
                <div className="flex items-center gap-4 mt-1 text-xs text-slate-500">
                  <span>最近同步: {status.lastSync}</span>
                  <span>
                    记录数:{" "}
                    <span className="font-mono text-slate-300">
                      {status.recordCount.toLocaleString()}
                    </span>
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <ArrowRight className="text-slate-600" size={20} />
                <div className="w-10 h-10 rounded-lg bg-dark-800 border border-white/5 flex items-center justify-center">
                  <Database size={18} className="text-primary-400" />
                </div>
              </div>

              <button
                onClick={() => onSyncClick?.(status.sourceType)}
                disabled={status.syncing}
                className="ml-4 px-3 py-1.5 text-xs bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg transition-colors border border-white/10 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                {status.syncing ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : null}
                立即同步
              </button>
            </div>

            {status.status === "running" && (
              <div className="mt-3 h-1 bg-dark-700 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-primary-500 to-cyan-500"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
