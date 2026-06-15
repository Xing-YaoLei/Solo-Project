'use client';

import { X, User, BookOpen, FileText, Users, CheckCircle, XCircle, Clock } from 'lucide-react';
import StatusPill from './StatusPill';
import type { StudentInfo } from '@/types';
import clsx from 'clsx';

interface StudentDetailDrawerProps {
  student: StudentInfo | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function StudentDetailDrawer({ student, isOpen, onClose }: StudentDetailDrawerProps) {
  if (!isOpen || !student) return null;

  const getStatusText = (status: string) => {
    const map: Record<string, string> = {
      pending: '待审核',
      approved: '已通过',
      rejected: '已拒绝',
      materials_missing: '材料缺失',
    };
    return map[status] || status;
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 animate-fade-in"
        onClick={onClose}
      />
      <div className="fixed right-0 top-0 h-full w-[480px] bg-white shadow-2xl z-50 animate-slide-in-right overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-lg font-semibold text-gray-900">学生详情</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-gradient-to-br from-primary-50 to-white p-6 rounded-xl border border-primary-100">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold">
                {student.name[0]}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900">{student.name}</h3>
                <p className="text-sm text-gray-500 font-mono">{student.studentNo}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-sm text-gray-600">
                    {student.college} · {student.major} · {student.grade}级
                  </span>
                </div>
                <div className="mt-3">
                  <StatusPill status={student.applicationStatus} />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-xs text-gray-500 mb-1">成绩单成绩</div>
              <div className="text-2xl font-bold font-mono text-primary-700">
                {student.transcriptScore}
              </div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-xs text-gray-500 mb-1">申请复核成绩</div>
              <div className="text-2xl font-bold font-mono text-amber-600">
                {student.applicationScore}
              </div>
            </div>
          </div>

          {student.reviewResult && (
            <div className={clsx(
              'p-4 rounded-xl border-2',
              student.reviewResult === 'passed'
                ? 'bg-emerald-50 border-emerald-200'
                : 'bg-red-50 border-red-200'
            )}>
              <div className="flex items-center gap-3">
                {student.reviewResult === 'passed' ? (
                  <CheckCircle className="w-8 h-8 text-emerald-600" />
                ) : (
                  <XCircle className="w-8 h-8 text-red-600" />
                )}
                <div>
                  <div className={clsx(
                    'font-semibold',
                    student.reviewResult === 'passed' ? 'text-emerald-700' : 'text-red-700'
                  )}>
                    复核{student.reviewResult === 'passed' ? '通过' : '未通过'}
                  </div>
                  {student.reviewComments && (
                    <div className="text-sm text-gray-600 mt-1">
                      {student.reviewComments}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-gray-400" />
              <h4 className="font-semibold text-gray-800">申请材料</h4>
            </div>
            <div className="space-y-2">
              {student.materials.map((material, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className={clsx(
                      'w-8 h-8 rounded-lg flex items-center justify-center',
                      material.status === 'verified'
                        ? 'bg-emerald-100 text-emerald-600'
                        : material.status === 'submitted'
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-red-100 text-red-600'
                    )}>
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-800">{material.name}</div>
                      {material.uploadTime && (
                        <div className="text-xs text-gray-500">
                          提交于 {material.uploadTime}
                        </div>
                      )}
                    </div>
                  </div>
                  <StatusPill status={material.status} size="sm" />
                </div>
              ))}
            </div>
          </div>

          {student.supervisorName && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-gray-400" />
                <h4 className="font-semibold text-gray-800">导师信息</h4>
              </div>
              <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center text-white font-bold">
                    {student.supervisorName[0]}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-800">{student.supervisorName}</div>
                    <div className="text-xs text-gray-500">复核导师</div>
                  </div>
                </div>
                {student.supervisorQuota && (
                  <div className="grid grid-cols-3 gap-3 pt-3 border-t border-purple-200">
                    <div className="text-center">
                      <div className="text-lg font-bold font-mono text-purple-700">
                        {student.supervisorQuota.total}
                      </div>
                      <div className="text-xs text-gray-500">总名额</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold font-mono text-amber-600">
                        {student.supervisorQuota.used}
                      </div>
                      <div className="text-xs text-gray-500">已使用</div>
                    </div>
                    <div className="text-center">
                      <div className={clsx(
                        'text-lg font-bold font-mono',
                        student.supervisorQuota.available > 0 ? 'text-emerald-600' : 'text-red-600'
                      )}>
                        {student.supervisorQuota.available}
                      </div>
                      <div className="text-xs text-gray-500">剩余</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-gray-400" />
              <h4 className="font-semibold text-gray-800">申请信息</h4>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">申请课程</span>
                <span className="font-medium text-gray-800 font-mono">{student.courseCode}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">申请日期</span>
                <span className="font-medium text-gray-800">{student.applyDate}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">申请状态</span>
                <span className="font-medium text-gray-800">{getStatusText(student.applicationStatus)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
