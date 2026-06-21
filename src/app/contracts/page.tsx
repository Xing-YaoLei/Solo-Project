"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import {
  FileText,
  Calendar,
  Building2,
  ChevronDown,
  ChevronRight,
  Info,
  BookOpen,
  Calculator,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";

interface Contract {
  id: string;
  merchantId: string;
  merchantName: string;
  title: string;
  content: string;
  startDate: string;
  endDate: string;
  caliberNote: string;
}

interface CaliberDefinition {
  key: string;
  name: string;
  description: string;
  formula?: string;
  relatedContracts: string[];
}

export default function ContractsPage() {
  const [activeTab, setActiveTab] = useState<"calibers" | "contracts">("calibers");
  const [expandedContract, setExpandedContract] = useState<string | null>(null);
  const [expandedCaliber, setExpandedCaliber] = useState<string | null>(null);
  const [calibers, setCalibers] = useState<CaliberDefinition[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/contracts");
        const data = await res.json();
        if (data.calibers) setCalibers(data.calibers);
        if (data.contracts?.list) setContracts(data.contracts.list);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white mb-1">
              合同口径说明
            </h2>
            <p className="text-sm text-slate-400">
              查看数据统计口径定义及相关合同条款，统一数据标准
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 border-b border-white/5 pb-1">
          {[
            {
              key: "calibers",
              label: "统计口径",
              icon: <Calculator size={16} />,
            },
            {
              key: "contracts",
              label: "合同列表",
              icon: <FileText size={16} />,
            },
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

        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={32} className="animate-spin text-primary-400" />
            <span className="ml-3 text-slate-400">加载中...</span>
          </div>
        )}

        {!loading && activeTab === "calibers" && (
          <div className="grid grid-cols-2 gap-4">
            {calibers.map((caliber, index) => (
              <div
                key={caliber.key}
                className="glass-card glass-card-hover overflow-hidden"
              >
                <div
                  className="p-4 cursor-pointer"
                  onClick={() =>
                    setExpandedCaliber(
                      expandedCaliber === caliber.key ? null : caliber.key
                    )
                  }
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-500/20 to-primary-600/10 flex items-center justify-center">
                        <Info size={20} className="text-primary-400" />
                      </div>
                      <div>
                        <h4 className="font-medium text-white">
                          {caliber.name}
                        </h4>
                        <p className="text-xs text-slate-500">{caliber.key}</p>
                      </div>
                    </div>
                    {expandedCaliber === caliber.key ? (
                      <ChevronDown size={20} className="text-slate-500" />
                    ) : (
                      <ChevronRight size={20} className="text-slate-500" />
                    )}
                  </div>

                  <p className="text-sm text-slate-400 mt-3 line-clamp-2">
                    {caliber.description}
                  </p>
                </div>

                {expandedCaliber === caliber.key && (
                  <div className="px-4 pb-4 border-t border-white/5 pt-4 mt-0">
                    <div className="mb-4">
                      <p className="text-xs text-slate-500 mb-2 flex items-center gap-2">
                        <Calculator size={14} />
                        计算公式
                      </p>
                      <div className="p-3 bg-dark-800/50 rounded-lg font-mono text-sm text-primary-400">
                        {caliber.formula}
                      </div>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500 mb-2 flex items-center gap-2">
                        <BookOpen size={14} />
                        相关合同条款
                      </p>
                      <div className="space-y-2">
                        {caliber.relatedContracts.map((contract, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-2 p-2 bg-dark-800/30 rounded-lg hover:bg-dark-800/50 cursor-pointer transition-colors"
                          >
                            <FileText
                              size={14}
                              className="text-accent-400 shrink-0"
                            />
                            <span className="text-sm text-slate-300">
                              {contract}
                            </span>
                            <ChevronRight
                              size={14}
                              className="ml-auto text-slate-500"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {!loading && activeTab === "contracts" && (
          <div className="space-y-3">
            {contracts.map((contract) => (
              <div
                key={contract.id}
                className="glass-card overflow-hidden"
              >
                <div
                  className="p-4 cursor-pointer hover:bg-white/5 transition-colors"
                  onClick={() =>
                    setExpandedContract(
                      expandedContract === contract.id ? null : contract.id
                    )
                  }
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/20 to-violet-600/10 flex items-center justify-center">
                        <FileText size={24} className="text-violet-400" />
                      </div>
                      <div>
                        <h4 className="font-medium text-white">
                          {contract.title}
                        </h4>
                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Building2 size={12} />
                            {contract.merchantName}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar size={12} />
                            {format(
                              new Date(contract.startDate),
                              "yyyy-MM-dd"
                            )}{" "}
                            ~{" "}
                            {format(
                              new Date(contract.endDate),
                              "yyyy-MM-dd"
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    {expandedContract === contract.id ? (
                      <ChevronDown size={20} className="text-slate-500" />
                    ) : (
                      <ChevronRight size={20} className="text-slate-500" />
                    )}
                  </div>
                </div>

                {expandedContract === contract.id && (
                  <div className="px-4 pb-4 border-t border-white/5 pt-4">
                    <div className="mb-4">
                      <p className="text-xs text-slate-500 mb-2">合同内容</p>
                      <p className="text-sm text-slate-300 leading-relaxed">
                        {contract.content}
                      </p>
                    </div>

                    <div className="p-4 bg-primary-500/10 border border-primary-500/20 rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <Info size={16} className="text-primary-400" />
                        <span className="text-sm font-medium text-primary-400">
                          数据统计口径说明
                        </span>
                      </div>
                      <p className="text-sm text-slate-300 leading-relaxed">
                        {contract.caliberNote}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
