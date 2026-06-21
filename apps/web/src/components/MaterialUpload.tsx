'use client';

import { useState, useRef, useCallback } from 'react';
import { MaterialType } from '@legal/shared';
import type { MaterialUploadDTO } from '@legal/shared';

const materialTypeLabels: Record<MaterialType, string> = {
  [MaterialType.ID_CARD]: '身份证件',
  [MaterialType.POWER_OF_ATTORNEY]: '授权委托书',
  [MaterialType.EVIDENCE_DOC]: '证据材料',
  [MaterialType.CONTRACT]: '合同',
  [MaterialType.COURT_DOCUMENT]: '法院文书',
  [MaterialType.FINANCIAL_RECORD]: '财务记录',
  [MaterialType.CORRESPONDENCE]: '往来函件',
  [MaterialType.PHOTO]: '照片',
  [MaterialType.VIDEO]: '视频',
  [MaterialType.AUDIO]: '音频',
  [MaterialType.OTHER]: '其他',
};

interface MaterialUploadProps {
  materials: MaterialUploadDTO[];
  onChange: (materials: MaterialUploadDTO[]) => void;
}

export default function MaterialUpload({ materials, onChange }: MaterialUploadProps) {
  const [dragOver, setDragOver] = useState(false);
  const [newMaterial, setNewMaterial] = useState<{
    name: string;
    type: MaterialType;
    pageTotal: string;
  }>({
    name: '',
    type: MaterialType.ID_CARD,
    pageTotal: '',
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const files = Array.from(e.dataTransfer.files);
      files.forEach((file) => {
        const material: MaterialUploadDTO = {
          name: file.name,
          type: newMaterial.type,
          fileUrl: URL.createObjectURL(file),
          fileSize: file.size,
          mimeType: file.type,
          pageTotal: newMaterial.pageTotal ? parseInt(newMaterial.pageTotal) : undefined,
        };
        onChange([...materials, material]);
      });
    },
    [materials, newMaterial, onChange],
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      files.forEach((file) => {
        const material: MaterialUploadDTO = {
          name: file.name,
          type: newMaterial.type,
          fileUrl: URL.createObjectURL(file),
          fileSize: file.size,
          mimeType: file.type,
          pageTotal: newMaterial.pageTotal ? parseInt(newMaterial.pageTotal) : undefined,
        };
        onChange([...materials, material]);
      });
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    [materials, newMaterial, onChange],
  );

  const handleRemove = useCallback(
    (index: number) => {
      onChange(materials.filter((_, i) => i !== index));
    },
    [materials, onChange],
  );

  return (
    <div className="space-y-4">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragOver
            ? 'border-blue-400 bg-blue-50'
            : 'border-slate-300 bg-slate-50 hover:border-slate-400'
        }`}
      >
        <svg className="mx-auto w-10 h-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
        </svg>
        <p className="mt-2 text-sm text-slate-600">拖拽文件到此处，或</p>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          点击选择文件
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">材料类型</label>
          <select
            value={newMaterial.type}
            onChange={(e) => setNewMaterial({ ...newMaterial, type: e.target.value as MaterialType })}
            className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {Object.entries(materialTypeLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">页数</label>
          <input
            type="number"
            value={newMaterial.pageTotal}
            onChange={(e) => setNewMaterial({ ...newMaterial, pageTotal: e.target.value })}
            placeholder="选填"
            className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">备注</label>
          <input
            type="text"
            placeholder="选填"
            className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {materials.length > 0 && (
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">文件名</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">类型</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">大小</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">页数</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-500">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {materials.map((material, index) => (
                <tr key={index} className="hover:bg-slate-50">
                  <td className="px-4 py-2.5 text-slate-700">{material.name}</td>
                  <td className="px-4 py-2.5 text-slate-600">
                    {materialTypeLabels[material.type] || material.type}
                  </td>
                  <td className="px-4 py-2.5 text-slate-600">
                    {material.fileSize > 1024 * 1024
                      ? `${(material.fileSize / 1024 / 1024).toFixed(1)}MB`
                      : `${(material.fileSize / 1024).toFixed(0)}KB`}
                  </td>
                  <td className="px-4 py-2.5 text-slate-600">
                    {material.pageTotal || '-'}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <button
                      type="button"
                      onClick={() => handleRemove(index)}
                      className="text-red-500 hover:text-red-700 text-xs font-medium"
                    >
                      删除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
