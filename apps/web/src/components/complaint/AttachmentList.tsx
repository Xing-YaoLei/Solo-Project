'use client';

import { useState } from 'react';
import { Upload, FileImage, FileVideo, FileText, Download, Trash2 } from 'lucide-react';
import type { Attachment } from '@scenic/shared';
import { formatFileSize } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { usePermission } from '@/hooks/usePermission';

interface AttachmentListProps {
  attachments: Attachment[];
  onUpload?: (files: File[]) => void;
  onDelete?: (id: string) => void;
}

const IconMap = {
  IMAGE: FileImage,
  VIDEO: FileVideo,
  DOCUMENT: FileText,
};

const ColorMap = {
  IMAGE: 'text-info bg-info/10',
  VIDEO: 'text-danger bg-danger/10',
  DOCUMENT: 'text-success bg-success/10',
};

export default function AttachmentList({
  attachments,
  onUpload,
  onDelete,
}: AttachmentListProps) {
  const [dragging, setDragging] = useState(false);
  const { canAssign } = usePermission();
  const canEdit = canAssign;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => {
    setDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length > 0 && onUpload) {
      onUpload(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0 && onUpload) {
      onUpload(Array.from(e.target.files));
    }
  };

  return (
    <div className="space-y-3">
      {attachments.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {attachments.map((att) => {
            const Icon = IconMap[att.fileType] || FileText;
            return (
              <div
                key={att.id}
                className="group relative flex items-center gap-3 p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
              >
                <div
                  className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center',
                    ColorMap[att.fileType] || ColorMap.DOCUMENT
                  )}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate">
                    {att.fileName}
                  </p>
                  <p className="text-xs text-slate-500">
                    {formatFileSize(att.fileSize)}
                  </p>
                </div>
                <div className="hidden group-hover:flex items-center gap-1">
                  <a
                    href={att.fileUrl}
                    download
                    className="p-1.5 rounded-md text-slate-500 hover:text-primary hover:bg-white transition-colors"
                    title="下载"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                  {canEdit && onDelete && (
                    <button
                      onClick={() => onDelete(att.id)}
                      className="p-1.5 rounded-md text-slate-500 hover:text-danger hover:bg-white transition-colors"
                      title="删除"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {canEdit && onUpload && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            'relative border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer',
            dragging
              ? 'border-primary bg-primary/5'
              : 'border-slate-200 hover:border-primary/50 hover:bg-slate-50'
          )}
        >
          <input
            type="file"
            multiple
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <Upload
            className={cn(
              'w-8 h-8 mx-auto mb-2 transition-colors',
              dragging ? 'text-primary' : 'text-slate-400'
            )}
          />
          <p
            className={cn(
              'text-sm',
              dragging ? 'text-primary' : 'text-slate-600'
            )}
          >
            拖拽文件到此处，或点击上传
          </p>
          <p className="text-xs text-slate-400 mt-1">
            支持图片、视频、文档
          </p>
        </div>
      )}
    </div>
  );
}
