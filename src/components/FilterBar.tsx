"use client";

import React from "react";
import { CALIBER_VERSION } from "@/lib/constants";

export interface FilterState {
  siteId: string;
  materialCategory: string;
  dateFrom: string;
  dateTo: string;
  caliberVersion: string;
}

interface FilterBarProps {
  sites: { id: string; name: string; projectNo: string }[];
  categories: string[];
  filters: FilterState;
  onChange: (f: Partial<FilterState>) => void;
  onExport: () => void;
  onRefresh: () => void;
  exporting: boolean;
}

export function FilterBar({ sites, categories, filters, onChange, onExport, onRefresh, exporting }: FilterBarProps) {
  return (
    <div className="card p-4 mb-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500 w-16">工地</span>
          <select
            className="input min-w-[200px]"
            value={filters.siteId}
            onChange={(e) => onChange({ siteId: e.target.value })}
          >
            <option value="">全部工地</option>
            {sites.map((s) => (
              <option key={s.id} value={s.id}>[{s.projectNo}] {s.name}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500 w-16">品类</span>
          <select
            className="input min-w-[160px]"
            value={filters.materialCategory}
            onChange={(e) => onChange({ materialCategory: e.target.value })}
          >
            <option value="">全部品类</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500 w-16">开始</span>
          <input
            type="date"
            className="input"
            value={filters.dateFrom}
            onChange={(e) => onChange({ dateFrom: e.target.value })}
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500 w-16">结束</span>
          <input
            type="date"
            className="input"
            value={filters.dateTo}
            onChange={(e) => onChange({ dateTo: e.target.value })}
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">口径</span>
          <select
            className="input"
            value={filters.caliberVersion}
            onChange={(e) => onChange({ caliberVersion: e.target.value })}
          >
            <option value={CALIBER_VERSION}>{CALIBER_VERSION}（最新）</option>
          </select>
        </div>

        <div className="flex-1" />

        <button className="btn btn-secondary" onClick={onRefresh}>
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
          </svg>
          刷新
        </button>

        <button className="btn btn-primary" onClick={onExport} disabled={exporting}>
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
          </svg>
          {exporting ? "导出中..." : "导出周转分析"}
        </button>
      </div>
    </div>
  );
}
