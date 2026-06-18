"use client";

import { useState } from "react";
import { QuoteVersion, QuoteItem } from "@/lib/types";
import {
  ChevronDown,
  ChevronUp,
  Clock,
  User,
  FileText,
  CheckCircle,
} from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { formatDate, formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface QuoteVersionListProps {
  versions: QuoteVersion[];
}

export function QuoteVersionList({ versions }: QuoteVersionListProps) {
  const [expandedVersion, setExpandedVersion] = useState<string | null>(
    versions.length > 0 ? versions[versions.length - 1].id : null
  );

  const toggleVersion = (versionId: string) => {
    setExpandedVersion(expandedVersion === versionId ? null : versionId);
  };

  if (versions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <FileText className="h-12 w-12 mx-auto mb-2" />
        <p className="text-sm">暂无报价版本</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {versions.map((version, index) => {
        const isExpanded = expandedVersion === version.id;
        const isLatest = index === versions.length - 1;

        return (
          <div
            key={version.id}
            className={cn(
              "border rounded-lg overflow-hidden transition-all",
              isLatest ? "border-primary-300 bg-primary-50/30" : "border-gray-200 bg-white"
            )}
          >
            <button
              onClick={() => toggleVersion(version.id)}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold",
                    isLatest
                      ? "bg-primary-600 text-white"
                      : "bg-gray-200 text-gray-600"
                  )}
                >
                  V{version.version}
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900">
                      {version.description}
                    </p>
                    {isLatest && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary-100 text-primary-700 text-xs font-medium">
                        <CheckCircle className="h-3 w-3" />
                        最新版
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {version.createdBy.name}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDate(version.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <p
                  className={cn(
                    "font-semibold",
                    isLatest ? "text-primary-600" : "text-gray-700"
                  )}
                >
                  {formatCurrency(version.amount)}
                </p>
                {isExpanded ? (
                  <ChevronUp className="h-5 w-5 text-gray-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-400" />
                )}
              </div>
            </button>

            {isExpanded && (
              <div className="border-t border-gray-200 px-4 py-3">
                <h4 className="text-sm font-medium text-gray-700 mb-3">
                  报价明细
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 px-2 font-medium text-gray-500">
                          项目名称
                        </th>
                        <th className="text-right py-2 px-2 font-medium text-gray-500">
                          单位
                        </th>
                        <th className="text-right py-2 px-2 font-medium text-gray-500">
                          数量
                        </th>
                        <th className="text-right py-2 px-2 font-medium text-gray-500">
                          单价
                        </th>
                        <th className="text-right py-2 px-2 font-medium text-gray-500">
                          小计
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {version.items.map((item) => (
                        <tr
                          key={item.id}
                          className="border-b border-gray-100 last:border-b-0"
                        >
                          <td className="py-2 px-2">
                            <p className="text-gray-900">{item.name}</p>
                            {item.description && (
                              <p className="text-xs text-gray-500">
                                {item.description}
                              </p>
                            )}
                          </td>
                          <td className="text-right py-2 px-2 text-gray-600">
                            {item.unit}
                          </td>
                          <td className="text-right py-2 px-2 text-gray-600">
                            {item.quantity}
                          </td>
                          <td className="text-right py-2 px-2 text-gray-600">
                            {formatCurrency(item.unitPrice)}
                          </td>
                          <td className="text-right py-2 px-2 font-medium text-gray-900">
                            {formatCurrency(item.totalPrice)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-gray-200">
                        <td colSpan={4} className="py-3 px-2 text-right font-medium text-gray-700">
                          合计
                        </td>
                        <td className="py-3 px-2 text-right font-bold text-primary-600">
                          {formatCurrency(version.amount)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
