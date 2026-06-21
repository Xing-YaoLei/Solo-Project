'use client';

import { useState } from 'react';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/Table';
import { AttendanceBadge, ConflictBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { AlertTriangle, Info } from 'lucide-react';
import type { Hearing } from '@/types';
import { formatDate, formatDateTime } from '@/lib/utils';
import { mockCapacityRules } from '@/data/mockData';

interface HearingTableProps {
  hearings: Hearing[];
}

export function HearingTable({ hearings }: HearingTableProps) {
  const [selectedHearing, setSelectedHearing] = useState<Hearing | null>(null);

  return (
    <>
      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>案件信息</TableHead>
                <TableHead>开庭日期</TableHead>
                <TableHead>时间</TableHead>
                <TableHead>法庭</TableHead>
                <TableHead>法官</TableHead>
                <TableHead>到场状态</TableHead>
                <TableHead>利益冲突</TableHead>
                <TableHead>异常说明</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {hearings.map((hearing) => (
                <TableRow key={hearing.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-slate-900">
                        {hearing.case?.caseName}
                      </p>
                      <p className="text-xs text-slate-500">
                        {hearing.case?.caseNumber}
                      </p>
                      <p className="text-xs text-slate-400">
                        {hearing.case?.clientName}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>{formatDate(hearing.hearingDate)}</TableCell>
                  <TableCell>{hearing.hearingTime}</TableCell>
                  <TableCell className="max-w-[200px] truncate" title={hearing.court}>
                    {hearing.court}
                  </TableCell>
                  <TableCell>{hearing.judge || '-'}</TableCell>
                  <TableCell>
                    <AttendanceBadge status={hearing.attendanceStatus} />
                  </TableCell>
                  <TableCell>
                    {hearing.hasConflict ? (
                      <div className="flex items-center gap-1">
                        <ConflictBadge
                          status={hearing.conflict?.status || 'PENDING'}
                        />
                        <AlertTriangle className="h-3 w-3 text-red-500" />
                      </div>
                    ) : (
                      <span className="text-slate-400">无</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {hearing.anomalyExplanation ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedHearing(hearing)}
                        className="gap-1"
                      >
                        <Info className="h-3 w-3" />
                        查看
                      </Button>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {selectedHearing && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="max-w-lg rounded-xl bg-white p-6 shadow-xl">
          <h3 className="mb-4 font-display text-lg font-semibold text-slate-900">
            异常详情
          </h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-slate-600">案件</p>
              <p className="text-slate-900">
                {selectedHearing.case?.caseName}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">
                异常说明
              </p>
              <p className="text-slate-900">
                {selectedHearing.anomalyExplanation}
              </p>
            </div>
            {selectedHearing.capacityRule && (
              <div>
                <p className="text-sm font-medium text-slate-600">
                  容量规则
                </p>
                <p className="text-slate-900">
                  {
                    mockCapacityRules.find(
                      (r) => r.id === selectedHearing.capacityRule
                    )?.name || selectedHearing.capacityRule
                  }
                </p>
                <p className="text-sm text-slate-500">
                  {
                    mockCapacityRules.find(
                      (r) => r.id === selectedHearing.capacityRule
                    )?.description
                  }
                </p>
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-slate-600">
                数据版本
              </p>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <span className="text-slate-500">案件系统:</span>{' '}
                  <span className="font-mono">
                    {selectedHearing.caseSystemVersion}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">日历工具:</span>{' '}
                  <span className="font-mono">
                    {selectedHearing.calendarToolVersion}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">邮件附件:</span>{' '}
                  <span className="font-mono">
                    {selectedHearing.emailAttachmentVersion}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <Button onClick={() => setSelectedHearing(null)}>关闭</Button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
