'use client';

import { useState, useMemo } from 'react';
import {
  Users,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  FileText,
  X,
} from 'lucide-react';
import StatusPill from '@/components/ui/StatusPill';
import StudentDetailDrawer from '@/components/ui/StudentDetailDrawer';
import { getStudentList, getColleges, getCourses } from '@/lib/mockData';
import type { StudentInfo } from '@/types';
import clsx from 'clsx';

const statusOptions = [
  { value: 'pending', label: '待审核', color: 'blue' },
  { value: 'approved', label: '已通过', color: 'green' },
  { value: 'rejected', label: '已拒绝', color: 'red' },
  { value: 'materials_missing', label: '材料缺失', color: 'amber' },
];

export default function StudentListPage() {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCollege, setSelectedCollege] = useState<string>('all');
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedMaterialStatuses, setSelectedMaterialStatuses] = useState<string[]>([]);
  const [scoreRange, setScoreRange] = useState<[number, number]>([0, 100]);
  const [selectedStudent, setSelectedStudent] = useState<StudentInfo | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const colleges = getColleges();
  const courses = getCourses();

  const filters = useMemo(() => {
    const result: any = {};
    if (selectedCollege !== 'all') result.college = selectedCollege;
    if (selectedStatuses.length > 0) result.status = selectedStatuses;
    if (selectedMaterialStatuses.length > 0) result.materialStatus = selectedMaterialStatuses;
    result.scoreRange = scoreRange;
    return result;
  }, [selectedCollege, selectedStatuses, selectedMaterialStatuses, scoreRange]);

  const { data: allStudents, total } = getStudentList(1, 1000, filters);

  const filteredStudents = useMemo(() => {
    return allStudents.filter(student => {
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return (
          student.name.toLowerCase().includes(term) ||
          student.studentNo.toLowerCase().includes(term) ||
          student.major.toLowerCase().includes(term)
        );
      }
      return true;
    });
  }, [allStudents, searchTerm]);

  const paginatedStudents = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredStudents.slice(start, start + pageSize);
  }, [filteredStudents, page, pageSize]);

  const totalPages = Math.ceil(filteredStudents.length / pageSize);

  const toggleStatus = (status: string) => {
    setSelectedStatuses(prev =>
      prev.includes(status)
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
    setPage(1);
  };

  const toggleMaterialStatus = (status: string) => {
    setSelectedMaterialStatuses(prev =>
      prev.includes(status)
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
    setPage(1);
  };

  const handleStudentClick = (student: StudentInfo) => {
    setSelectedStudent(student);
    setIsDrawerOpen(true);
  };

  const clearFilters = () => {
    setSelectedCollege('all');
    setSelectedStatuses([]);
    setSelectedMaterialStatuses([]);
    setScoreRange([0, 100]);
    setSearchTerm('');
    setPage(1);
  };

  const activeFiltersCount = [
    selectedCollege !== 'all' ? 1 : 0,
    selectedStatuses.length,
    selectedMaterialStatuses.length,
    scoreRange[0] > 0 || scoreRange[1] < 100 ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  const getMaterialStatusSummary = (materials: any[]) => {
    const missing = materials.filter(m => m.status === 'missing').length;
    const submitted = materials.filter(m => m.status === 'submitted').length;
    const verified = materials.filter(m => m.status === 'verified').length;
    return { missing, submitted, verified, total: materials.length };
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-serif text-gray-900 mb-2">
          学生名单总览
        </h1>
        <p className="text-gray-500">
          学生申请全链路追踪，支持成绩单与申请材料联动筛选
        </p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="card-gradient p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-primary-600" />
            <span className="text-sm text-gray-500">总学生数</span>
          </div>
          <div className="text-2xl font-bold font-mono text-gray-900">{total}</div>
        </div>
        <div className="card-gradient p-4">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-5 h-5 text-emerald-500" />
            <span className="text-sm text-gray-500">已通过</span>
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-600">
            {allStudents.filter(s => s.applicationStatus === 'approved').length}
          </div>
        </div>
        <div className="card-gradient p-4">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-5 h-5 text-amber-500" />
            <span className="text-sm text-gray-500">材料缺失</span>
          </div>
          <div className="text-2xl font-bold font-mono text-amber-600">
            {allStudents.filter(s => s.applicationStatus === 'materials_missing').length}
          </div>
        </div>
        <div className="card-gradient p-4">
          <div className="flex items-center gap-2 mb-2">
            <Filter className="w-5 h-5 text-purple-500" />
            <span className="text-sm text-gray-500">筛选结果</span>
          </div>
          <div className="text-2xl font-bold font-mono text-purple-600">
            {filteredStudents.length}
          </div>
        </div>
      </div>

      <div className="card-gradient p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <span className="font-medium text-gray-800">联动筛选</span>
            {activeFiltersCount > 0 && (
              <span className="px-2 py-0.5 bg-primary-100 text-primary-700 rounded-full text-xs font-medium">
                {activeFiltersCount} 个筛选条件
              </span>
            )}
          </div>
          {activeFiltersCount > 0 && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              <X className="w-4 h-4" />
              清除筛选
            </button>
          )}
        </div>

        <div className="grid grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2">搜索学生</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="姓名、学号、专业..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2">学院</label>
            <select
              value={selectedCollege}
              onChange={(e) => {
                setSelectedCollege(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all bg-white"
            >
              <option value="all">全部学院</option>
              {colleges.map(college => (
                <option key={college} value={college}>{college}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2">
              成绩单成绩范围
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="100"
                value={scoreRange[0]}
                onChange={(e) => {
                  setScoreRange([Math.min(Number(e.target.value), scoreRange[1]), scoreRange[1]]);
                  setPage(1);
                }}
                className="w-20 px-3 py-2 border border-gray-200 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all font-mono"
              />
              <span className="text-gray-400">~</span>
              <input
                type="number"
                min="0"
                max="100"
                value={scoreRange[1]}
                onChange={(e) => {
                  setScoreRange([scoreRange[0], Math.max(Number(e.target.value), scoreRange[0])]);
                  setPage(1);
                }}
                className="w-20 px-3 py-2 border border-gray-200 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2">申请状态</label>
            <div className="flex flex-wrap gap-2">
              {statusOptions.map(status => (
                <button
                  key={status.value}
                  onClick={() => toggleStatus(status.value)}
                  className={clsx(
                    'px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-all',
                    selectedStatuses.includes(status.value)
                      ? 'bg-primary-600 text-white border-primary-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300'
                  )}
                >
                  {status.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-100">
          <label className="block text-xs font-medium text-gray-500 mb-3">材料状态联动筛选</label>
          <div className="grid grid-cols-3 gap-4">
            <button
              onClick={() => toggleMaterialStatus('verified')}
              className={clsx(
                'flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left',
                selectedMaterialStatuses.includes('verified')
                  ? 'border-emerald-500 bg-emerald-50'
                  : 'border-gray-200 bg-white hover:border-emerald-200'
              )}
            >
              <div className="w-4 h-4 rounded-full bg-emerald-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-800">已核验</div>
                <div className="text-xs font-mono text-gray-500 mt-0.5">
                  {allStudents.filter(s => s.materials.some(m => m.status === 'verified')).length}人 · 占比
                  {allStudents.length > 0
                    ? Math.round(allStudents.filter(s => s.materials.some(m => m.status === 'verified')).length / allStudents.length * 100)
                    : 0}%
                </div>
              </div>
              {selectedMaterialStatuses.includes('verified') && (
                <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs">✓</div>
              )}
            </button>
            <button
              onClick={() => toggleMaterialStatus('submitted')}
              className={clsx(
                'flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left',
                selectedMaterialStatuses.includes('submitted')
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-blue-200'
              )}
            >
              <div className="w-4 h-4 rounded-full bg-blue-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-800">已提交</div>
                <div className="text-xs font-mono text-gray-500 mt-0.5">
                  {allStudents.filter(s => s.materials.some(m => m.status === 'submitted')).length}人 · 占比
                  {allStudents.length > 0
                    ? Math.round(allStudents.filter(s => s.materials.some(m => m.status === 'submitted')).length / allStudents.length * 100)
                    : 0}%
                </div>
              </div>
              {selectedMaterialStatuses.includes('submitted') && (
                <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs">✓</div>
              )}
            </button>
            <button
              onClick={() => toggleMaterialStatus('missing')}
              className={clsx(
                'flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left',
                selectedMaterialStatuses.includes('missing')
                  ? 'border-red-500 bg-red-50'
                  : 'border-gray-200 bg-white hover:border-red-200'
              )}
            >
              <div className="w-4 h-4 rounded-full bg-red-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-800">材料缺失</div>
                <div className="text-xs font-mono text-gray-500 mt-0.5">
                  {allStudents.filter(s => s.materials.some(m => m.status === 'missing')).length}人 · 占比
                  {allStudents.length > 0
                    ? Math.round(allStudents.filter(s => s.materials.some(m => m.status === 'missing')).length / allStudents.length * 100)
                    : 0}%
                </div>
              </div>
              {selectedMaterialStatuses.includes('missing') && (
                <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center text-white text-xs">✓</div>
              )}
            </button>
          </div>
          {selectedMaterialStatuses.length > 0 && (
            <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
              <span>当前筛选逻辑：满足任一选中状态的学生</span>
              <span className="px-2 py-0.5 bg-gray-100 rounded text-gray-600">
                {selectedMaterialStatuses.map(s => s === 'verified' ? '已核验' : s === 'submitted' ? '已提交' : '缺失').join(' 或 ')}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="card-gradient overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="table-header">学生信息</th>
                <th className="table-header">学院/专业</th>
                <th className="table-header text-center">成绩单</th>
                <th className="table-header text-center">申请成绩</th>
                <th className="table-header text-center">课程</th>
                <th className="table-header text-center">申请状态</th>
                <th className="table-header text-center">材料状态</th>
                <th className="table-header text-center">申请日期</th>
                <th className="table-header text-center">操作</th>
              </tr>
            </thead>
            <tbody>
              {paginatedStudents.map((student, idx) => {
                const materialSummary = getMaterialStatusSummary(student.materials);
                return (
                  <tr
                    key={student.id}
                    className={clsx(
                      'table-row cursor-pointer',
                      idx % 2 === 1 && 'table-row-alt'
                    )}
                    onClick={() => handleStudentClick(student)}
                  >
                    <td className="table-cell">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-primary-100 rounded-lg flex items-center justify-center text-primary-700 font-bold">
                          {student.name[0]}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{student.name}</div>
                          <div className="text-xs text-gray-500 font-mono">{student.studentNo}</div>
                        </div>
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="text-sm text-gray-800">{student.college}</div>
                      <div className="text-xs text-gray-500">{student.major} · {student.grade}级</div>
                    </td>
                    <td className="table-cell text-center">
                      <span className={clsx(
                        'font-mono font-bold',
                        student.transcriptScore >= 85 ? 'text-emerald-600' :
                        student.transcriptScore >= 60 ? 'text-primary-600' : 'text-red-600'
                      )}>
                        {student.transcriptScore}
                      </span>
                    </td>
                    <td className="table-cell text-center">
                      <span className="font-mono font-medium text-amber-600">
                        {student.applicationScore}
                      </span>
                    </td>
                    <td className="table-cell text-center">
                      <span className="font-mono text-xs px-2 py-1 bg-gray-100 rounded text-gray-700">
                        {student.courseCode}
                      </span>
                    </td>
                    <td className="table-cell text-center">
                      <StatusPill status={student.applicationStatus} />
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center justify-center gap-1">
                        {student.materials.map((material, midx) => (
                          <div
                            key={midx}
                            className={clsx(
                              'w-2 h-2 rounded-full',
                              material.status === 'verified' ? 'bg-emerald-500' :
                              material.status === 'submitted' ? 'bg-blue-500' : 'bg-red-500'
                            )}
                            title={`${material.name}: ${
                              material.status === 'verified' ? '已核验' :
                              material.status === 'submitted' ? '已提交' : '缺失'
                            }`}
                          />
                        ))}
                        {materialSummary.missing > 0 && (
                          <span className="ml-1 text-xs text-red-500 font-medium">
                            缺{materialSummary.missing}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="table-cell text-center text-sm text-gray-600">
                      {student.applyDate}
                    </td>
                    <td className="table-cell text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStudentClick(student);
                        }}
                        className="px-3 py-1 text-xs text-primary-600 hover:bg-primary-50 rounded transition-colors"
                      >
                        查看详情
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {paginatedStudents.length === 0 && (
          <div className="text-center py-16 text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>没有找到符合条件的学生</p>
            <button
              onClick={clearFilters}
              className="mt-2 text-sm text-primary-600 hover:text-primary-700"
            >
              清除筛选条件
            </button>
          </div>
        )}

        {paginatedStudents.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
            <div className="text-sm text-gray-500">
              显示 {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, filteredStudents.length)} 条，
              共 {filteredStudents.length} 条记录
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum = i + 1;
                if (totalPages > 5 && page > 3) {
                  pageNum = page - 2 + i;
                }
                if (pageNum > totalPages) return null;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={clsx(
                      'w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors',
                      page === pageNum
                        ? 'bg-primary-600 text-white'
                        : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                    )}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <StudentDetailDrawer
        student={selectedStudent}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />
    </div>
  );
}
