'use client';

import { useState, Fragment } from 'react';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ChevronDown, ChevronRight, AlertCircle } from 'lucide-react';
import type { Discrepancy, Hearing } from '@/types';
import { formatDate, getDataSourceLabel, cn } from '@/lib/utils';

interface DataCompareTableProps {
  caseSystemData: Hearing[];
  calendarToolData: Hearing[];
  emailAttachmentData: Hearing[];
  discrepancies: Discrepancy[];
}

export function DataCompareTable({
  caseSystemData,
  calendarToolData,
  emailAttachmentData,
  discrepancies,
}: DataCompareTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (hearingId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(hearingId)) {
      newExpanded.delete(hearingId);
    } else {
      newExpanded.add(hearingId);
    }
    setExpandedRows(newExpanded);
  };

  const fieldLabels: Record<string, string> = {
    hearingDate: '开庭日期',
    hearingTime: '开庭时间',
    court: '法庭',
    judge: '法官',
    attendanceStatus: '到场状态',
  };

  const getDiscrepanciesForHearing = (hearingId: string) => {
    return discrepancies.filter((d) => d.hearingId === hearingId);
  };

  const formatValue = (field: string, value: unknown): string => {
    if (field === 'hearingDate' && value instanceof Date) {
      return formatDate(value);
    }
    if (field === 'attendanceStatus') {
      const labels: Record<string, string> = {
        ATTENDED: '已到场',
        ABSENT: '未到场',
        POSTPONED: '已延期',
        CANCELLED: '已取消',
      };
      return labels[value as string] || String(value);
    }
    return String(value || '-');
  };

  const allHearingIds = new Set([
    ...caseSystemData.map((h) => h.id),
    ...calendarToolData.map((h) => h.id),
    ...emailAttachmentData.map((h) => h.id),
  ]);

  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10"></TableHead>
              <TableHead>案件信息</TableHead>
              <TableHead>
                <div className="flex items-center gap-2">
                  <span className="text-primary-600">案件系统</span>
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center gap-2">
                  <span className="text-teal-600">日历工具</span>
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center gap-2">
                  <span className="text-amber-600">邮件附件</span>
                </div>
              </TableHead>
              <TableHead>差异状态</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from(allHearingIds).map((hearingId) => {
              const caseHearing = caseSystemData.find((h) => h.id === hearingId);
              const calendarHearing = calendarToolData.find((h) => h.id === hearingId);
              const emailHearing = emailAttachmentData.find((h) => h.id === hearingId);
              const hearingDiscrepancies = getDiscrepanciesForHearing(hearingId);
              const hasDiscrepancies = hearingDiscrepancies.length > 0;
              const isExpanded = expandedRows.has(hearingId);
              const hearing = caseHearing || calendarHearing || emailHearing;

              if (!hearing) return null;

              return (
                <Fragment key={hearingId}>
                  <TableRow
                    className={cn(
                      hasDiscrepancies && 'bg-red-50',
                    )}
                  >
                  <TableCell>
                    {hasDiscrepancies && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => toggleRow(hearingId)}
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-slate-900">
                        {hearing.case?.caseName}
                      </p>
                      <p className="text-xs text-slate-500">
                        {hearing.case?.caseNumber}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {caseHearing ? (
                      <div className="text-sm">
                        <p>{formatDate(caseHearing.hearingDate)}</p>
                        <p className="text-slate-500">{caseHearing.hearingTime}</p>
                      </div>
                    ) : (
                      <span className="text-slate-400">无数据</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {calendarHearing ? (
                      <div className="text-sm">
                        <p>{formatDate(calendarHearing.hearingDate)}</p>
                        <p className="text-slate-500">{calendarHearing.hearingTime}</p>
                      </div>
                    ) : (
                      <span className="text-slate-400">无数据</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {emailHearing ? (
                      <div className="text-sm">
                        <p>{formatDate(emailHearing.hearingDate)}</p>
                        <p className="text-slate-500">{emailHearing.hearingTime}</p>
                    </div>
                    ) : (
                      <span className="text-slate-400">无数据</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {hasDiscrepancies ? (
                      <Badge variant="danger" className="gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {hearingDiscrepancies.length} 处差异
                      </Badge>
                    ) : (
                      <Badge variant="success">数据一致</Badge>
                    )}
                  </TableCell>
                </TableRow>
                {isExpanded && hasDiscrepancies && (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <div className="ml-8 space-y-2 border-l-2 border-red-200 pl-4 py-3">
                        <p className="text-sm font-medium text-slate-700">
                          详细差异对比
                        </p>
                        <div className="grid gap-2">
                          {hearingDiscrepancies.map((discrepancy, idx) => (
                            <div
                              key={idx}
                              className="grid grid-cols-4 gap-4 rounded-lg bg-white p-3 text-sm">
                              <div className="font-medium text-slate-600">
                                {fieldLabels[discrepancy.field] ||
                                  discrepancy.field}
                              </div>
                              <div className="text-primary-700">
                                <span className="text-xs text-slate-500">
                                  案件系统:
                                </span>{' '}
                                {formatValue(
                                  discrepancy.field,
                                  discrepancy.caseSystemValue
                                )}
                              </div>
                              <div className="text-teal-700">
                                <span className="text-xs text-slate-500">
                                  日历工具:
                                </span>{' '}
                                {formatValue(
                                  discrepancy.field,
                                  discrepancy.calendarToolValue
                                )}
                              </div>
                              <div className="text-amber-700">
                                <span className="text-xs text-slate-500">
                                  邮件附件:
                                </span>{' '}
                                {formatValue(
                                  discrepancy.field,
                                  discrepancy.emailAttachmentValue
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </Fragment>
            );
          })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
