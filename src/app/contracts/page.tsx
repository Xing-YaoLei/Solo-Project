"use client";

import { useState } from "react";
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
} from "lucide-react";
import { format, addYears } from "date-fns";

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

  const calibers: CaliberDefinition[] = [
    {
      key: "visitor_count",
      name: "客流数",
      description:
        "通过摄像头统计的区域内人次数量，同一人多次经过计为多次。客流数是衡量景区人气和区域热度的核心指标。",
      formula: "各摄像头统计人次累加",
      relatedContracts: [
        "商户合作协议-客流统计条款",
        "数据统计规范协议",
      ],
    },
    {
      key: "secondary_consumption",
      name: "二消金额",
      description:
        "景区内商户产生的非门票消费金额总和，包含餐饮、购物、娱乐、体验项目等。二消金额是衡量景区商业价值的重要指标。",
      formula: "商户POS流水 + 小程序订单金额 + 线下现金收入",
      relatedContracts: [
        "商户联营分成协议",
        "小程序运营合作协议",
        "商业管理服务协议",
      ],
    },
    {
      key: "conversion_rate",
      name: "二消转化率",
      description:
        "产生二次消费的游客占总客流的比例。转化率越高说明景区商业吸引力越强。",
      formula: "二消用户数 / 总客流数 × 100%",
      relatedContracts: ["运营数据统计规范协议", "商户KPI考核协议"],
    },
    {
      key: "avg_price",
      name: "客单价",
      description:
        "每笔二消订单的平均消费金额。客单价反映了游客的消费能力和消费水平。",
      formula: "二消总金额 / 二消订单数",
      relatedContracts: ["商户联营分成协议", "定价管理规定"],
    },
    {
      key: "route_popularity",
      name: "路线热度",
      description:
        "导览路线的受欢迎程度，综合考虑小程序订单、客流分布、用户评价等因素计算得出。",
      formula: "路线订单数 × 0.6 + 路线覆盖区域客流 × 0.4",
      relatedContracts: ["导览服务合作协议", "内容运营考核协议"],
    },
    {
      key: "seat_occupancy",
      name: "上座率",
      description:
        "演出已售座位占总座位数的比例。上座率是衡量演出受欢迎程度和票房表现的核心指标。",
      formula: "已售座位数 / 总座位数 × 100%",
      relatedContracts: ["演出合作协议", "票务分成协议"],
    },
  ];

  const contracts: Contract[] = [
    {
      id: "contract-1",
      merchantId: "merchant-1",
      merchantName: "西湖餐饮管理有限公司",
      title: "商户联营合作协议",
      content:
        "甲乙双方本着互惠互利、共同发展的原则，经友好协商，就乙方在甲方景区内经营餐饮业务事宜达成如下协议...",
      startDate: new Date().toISOString(),
      endDate: addYears(new Date(), 1).toISOString(),
      caliberNote:
        "本合同项下二消金额统计口径为：乙方在景区内所有门店通过POS系统、小程序、线下现金等渠道产生的全部营业收入，不含税费。",
    },
    {
      id: "contract-2",
      merchantId: "merchant-2",
      merchantName: "印象文化传播有限公司",
      title: "演出合作协议",
      content:
        "甲方提供演出场地及配套服务，乙方负责演出内容制作及运营，双方按约定比例分演出票房收入...",
      startDate: new Date().toISOString(),
      endDate: addYears(new Date(), 2).toISOString(),
      caliberNote:
        "上座率统计口径：已售座位数含正常销售票、赠票、兑换票等所有占用座位的票种，不含因不可抗力取消的场次。",
    },
    {
      id: "contract-3",
      merchantId: "merchant-3",
      merchantName: "智游科技有限公司",
      title: "小程序运营合作协议",
      content:
        "甲方委托乙方开发运营景区官方小程序，提供导览、购票、商城等服务，双方按约定方式结算服务费用...",
      startDate: new Date().toISOString(),
      endDate: addYears(new Date(), 1).toISOString(),
      caliberNote:
        "小程序订单统计口径：用户在小程序内完成支付的所有订单，包括门票、导览、餐饮、商品等，退款订单不计入。",
    },
    {
      id: "contract-4",
      merchantId: "merchant-4",
      merchantName: "安防科技有限公司",
      title: "客流统计系统服务协议",
      content:
        "乙方为甲方提供客流统计系统及相关服务，通过摄像头AI识别技术统计各区域客流数据...",
      startDate: new Date().toISOString(),
      endDate: addYears(new Date(), 1).toISOString(),
      caliberNote:
        "客流统计口径：采用摄像头人脸识别技术统计区域内人次，同一人多次经过同一摄像头计为多次，数据准确率不低于95%。",
    },
  ];

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

        {activeTab === "calibers" && (
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

        {activeTab === "contracts" && (
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
