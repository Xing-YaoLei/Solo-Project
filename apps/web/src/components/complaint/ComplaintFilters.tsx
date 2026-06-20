'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getDepartments } from '@/lib/api/departments';
import { getTags } from '@/lib/api/tags';
import { useComplaintStore } from '@/store/useComplaintStore';
import { ChevronRight, ChevronDown, X, Filter, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ComplaintStatus, Priority } from '@scenic/shared';
import { STATUS_LABELS, PRIORITY_LABELS } from '@scenic/shared';
import type { Department, Tag } from '@scenic/shared';

interface TreeNode extends Department {
  children?: TreeNode[];
}

function DepartmentTreeItem({
  node,
  selectedId,
  onSelect,
  level = 0,
}: {
  node: TreeNode;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  level?: number;
}) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div>
      <button
        onClick={() => onSelect(selectedId === node.id ? null : node.id)}
        className={cn(
          'w-full flex items-center gap-1.5 px-2 py-1.5 rounded text-sm transition-colors text-left',
          selectedId === node.id
            ? 'bg-primary/10 text-primary font-medium'
            : 'text-slate-600 hover:bg-slate-100'
        )}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
      >
        {hasChildren ? (
          <span
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
            className="p-0.5 -ml-0.5 hover:bg-slate-200 rounded"
          >
            {expanded ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronRight className="w-3 h-3" />
            )}
          </span>
        ) : (
          <span className="w-4" />
        )}
        <span className="truncate">{node.name}</span>
      </button>
      {hasChildren && expanded && (
        <div>
          {node.children!.map((child) => (
            <DepartmentTreeItem
              key={child.id}
              node={child}
              selectedId={selectedId}
              onSelect={onSelect}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ComplaintFilters() {
  const { filters, setFilters, resetFilters, quickFilters, activeQuickFilter, setActiveQuickFilter } =
    useComplaintStore();

  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: getDepartments,
  });

  const { data: tags = [] } = useQuery({
    queryKey: ['tags'],
    queryFn: getTags,
  });

  const buildTree = (items: Department[]): TreeNode[] => {
    const map = new Map<string, TreeNode>();
    const roots: TreeNode[] = [];
    items.forEach((item) => map.set(item.id, { ...item }));
    map.forEach((node) => {
      if (node.parentId && map.has(node.parentId)) {
        const parent = map.get(node.parentId)!;
        parent.children = [...(parent.children || []), node];
      } else {
        roots.push(node);
      }
    });
    return roots;
  };

  const departmentTree = buildTree(departments);

  const hasActiveFilters =
    filters.status ||
    filters.priority ||
    filters.ownerId ||
    filters.departmentId ||
    filters.tagId ||
    filters.keyword ||
    filters.dateFrom ||
    filters.dateTo;

  return (
    <aside className="w-72 h-full bg-white border-r border-slate-200 flex flex-col">
      <div className="p-4 border-b border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <Filter className="w-4 h-4" />
            筛选条件
          </div>
          {hasActiveFilters && (
            <button
              onClick={() => {
                resetFilters();
                setActiveQuickFilter(null);
              }}
              className="text-xs text-slate-500 hover:text-primary inline-flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              重置
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {quickFilters.map((qf) => (
            <button
              key={qf.key}
              onClick={() => {
                setActiveQuickFilter(activeQuickFilter === qf.key ? null : qf.key);
                if (qf.key !== 'all' && activeQuickFilter !== qf.key) {
                  setFilters({
                    status: (qf.key.toUpperCase() as ComplaintStatus) || null,
                  });
                } else {
                  setFilters({ status: null });
                }
              }}
              className={cn(
                'px-2.5 py-1 rounded-md text-xs border transition-all',
                activeQuickFilter === qf.key
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-primary/50 hover:text-primary'
              )}
            >
              {qf.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        <div>
          <h4 className="text-xs font-medium text-slate-500 uppercase mb-2">
            责任归属
          </h4>
          <div className="bg-slate-50 rounded-lg p-2 max-h-64 overflow-y-auto">
            {departmentTree.length === 0 ? (
              <p className="text-xs text-slate-400 py-2 text-center">暂无数据</p>
            ) : (
              departmentTree.map((node) => (
                <DepartmentTreeItem
                  key={node.id}
                  node={node}
                  selectedId={filters.departmentId}
                  onSelect={(id) => setFilters({ departmentId: id })}
                />
              ))
            )}
          </div>
          {filters.departmentId && (
            <button
              onClick={() => setFilters({ departmentId: null })}
              className="mt-1.5 text-xs text-slate-500 hover:text-primary inline-flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              清除部门筛选
            </button>
          )}
        </div>

        <div>
          <h4 className="text-xs font-medium text-slate-500 uppercase mb-2">
            问题标签
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {tags.length === 0 ? (
              <p className="text-xs text-slate-400">暂无标签</p>
            ) : (
              tags.map((tag: Tag) => (
                <button
                  key={tag.id}
                  onClick={() =>
                    setFilters({
                      tagId: filters.tagId === tag.id ? null : tag.id,
                    })
                  }
                  className={cn(
                    'px-2 py-1 rounded text-xs border transition-all',
                    filters.tagId === tag.id
                      ? 'text-white border-transparent'
                      : 'border-transparent hover:opacity-80'
                  )}
                  style={{
                    backgroundColor:
                      filters.tagId === tag.id ? tag.color : `${tag.color}15`,
                    color: filters.tagId === tag.id ? 'white' : tag.color,
                    borderColor: filters.tagId === tag.id ? tag.color : 'transparent',
                  }}
                >
                  {tag.name}
                </button>
              ))
            )}
          </div>
        </div>

        <div>
          <h4 className="text-xs font-medium text-slate-500 uppercase mb-2">
            处理状态
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(STATUS_LABELS).map(([key, label]) => (
              <button
                key={key}
                onClick={() =>
                  setFilters({
                    status:
                      filters.status === key
                        ? null
                        : (key as ComplaintStatus),
                  })
                }
                className={cn(
                  'px-2 py-1 rounded text-xs border transition-all',
                  filters.status === key
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-primary/50'
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-xs font-medium text-slate-500 uppercase mb-2">
            优先级
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(PRIORITY_LABELS).map(([key, label]) => (
              <button
                key={key}
                onClick={() =>
                  setFilters({
                    priority:
                      filters.priority === key
                        ? null
                        : (key as Priority),
                  })
                }
                className={cn(
                  'px-2 py-1 rounded text-xs border transition-all',
                  filters.priority === key
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-primary/50'
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
