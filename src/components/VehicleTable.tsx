"use client";

import { useState, Fragment } from "react";
import {
  ChevronDown,
  ChevronRight,
  Search,
  Car,
  Wrench,
  DollarSign,
  Calendar,
} from "lucide-react";
import { ChartCard } from "./ChartCard";
import { VehicleRecord, VehiclePart } from "@/types";
import { formatCurrency, formatNumber, formatDate } from "@/utils/format";
import clsx from "clsx";

interface VehicleTableProps {
  data: VehicleRecord[];
  lastUpdated: string;
  canViewParts: boolean;
  onRefresh?: () => void;
}

export function VehicleTable({
  data,
  lastUpdated,
  canViewParts,
  onRefresh,
}: VehicleTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const filteredData = data.filter(
    (vehicle) =>
      vehicle.plateNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.vehicleModel.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.ownerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <ChartCard
      title="车辆档案明细"
      subtitle="车辆维修历史与配件使用追溯"
      lastUpdated={lastUpdated}
      onRefresh={onRefresh}
      action={
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="搜索车辆..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-4 py-2 bg-slate-800/50 border border-white/10 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-industrial-500/50 w-48"
          />
        </div>
      }
    >
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              <th className="text-left py-3 px-4 text-xs font-medium text-slate-400 uppercase tracking-wider">
                车牌号
              </th>
              <th className="text-left py-3 px-4 text-xs font-medium text-slate-400 uppercase tracking-wider">
                车型
              </th>
              <th className="text-left py-3 px-4 text-xs font-medium text-slate-400 uppercase tracking-wider">
                车主
              </th>
              <th className="text-left py-3 px-4 text-xs font-medium text-slate-400 uppercase tracking-wider">
                上次维修
              </th>
              <th className="text-center py-3 px-4 text-xs font-medium text-slate-400 uppercase tracking-wider">
                维修次数
              </th>
              <th className="text-right py-3 px-4 text-xs font-medium text-slate-400 uppercase tracking-wider">
                累计金额
              </th>
              {canViewParts && (
                <th className="text-center py-3 px-4 text-xs font-medium text-slate-400 uppercase tracking-wider">
                  配件明细
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {filteredData.map((vehicle, index) => (
              <Fragment key={vehicle.id}>
                <tr
                  key={vehicle.id}
                  className={clsx(
                    "border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer",
                    index % 2 === 0 ? "bg-transparent" : "bg-white/[0.02]"
                  )}
                  onClick={() => canViewParts && toggleRow(vehicle.id)}
                >
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-industrial-500/10">
                        <Car className="w-4 h-4 text-industrial-400" />
                      </div>
                      <span className="font-medium text-slate-200">
                        {vehicle.plateNumber}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-slate-300">
                    {vehicle.vehicleModel}
                  </td>
                  <td className="py-4 px-4 text-slate-300">
                    {vehicle.ownerName}
                  </td>
                  <td className="py-4 px-4 text-slate-400 text-sm">
                    {vehicle.lastServiceDate}
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400">
                      <Wrench className="w-3 h-3 mr-1" />
                      {vehicle.serviceCount} 次
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right font-mono text-slate-200">
                    {formatCurrency(vehicle.totalAmount)}
                  </td>
                  {canViewParts && (
                    <td className="py-4 px-4 text-center">
                      <button className="text-slate-400 hover:text-industrial-400 transition-colors">
                        {expandedRows.has(vehicle.id) ? (
                          <ChevronDown className="w-5 h-5" />
                        ) : (
                          <ChevronRight className="w-5 h-5" />
                        )}
                      </button>
                    </td>
                  )}
                </tr>
                {canViewParts && expandedRows.has(vehicle.id) && vehicle.parts && (
                  <tr className="bg-slate-800/30">
                    <td colSpan={7} className="py-4 px-8">
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-slate-300 mb-3">
                          配件使用明细
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                          {vehicle.parts.map((part) => (
                            <div
                              key={part.partId}
                              className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30 border border-white/5"
                            >
                              <div>
                                <p className="text-sm text-slate-200">
                                  {part.partName}
                                </p>
                                <p className="text-xs text-slate-500 mt-0.5">
                                  {part.usedDate}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm text-slate-200">
                                  ×{part.quantity}
                                </p>
                                <p className="text-xs text-slate-400">
                                  {formatCurrency(part.unitPrice)}/件
                                </p>
                              </div>
                            </div>
                          ))}
                          {vehicle.parts.length === 0 && (
                            <p className="col-span-2 text-sm text-slate-500 text-center py-4">
                              暂无配件使用记录
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {filteredData.length === 0 && (
        <div className="text-center py-12">
          <Search className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">未找到匹配的车辆</p>
        </div>
      )}
    </ChartCard>
  );
}
