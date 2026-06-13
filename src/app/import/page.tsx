'use client';

import { useState, useCallback, useEffect } from 'react';
import AppLayout from '@/components/Layout/AppLayout';
import { motion } from 'framer-motion';
import {
  Upload,
  FileText,
  Database,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { ImportBatch, BatchType } from '@/types';
import {
  formatDateTime,
  getBatchTypeText,
  getStatusColor,
  getStatusText,
} from '@/utils/format';
import { cn } from '@/utils/cn';

export default function ImportPage() {
  const [selectedType, setSelectedType] = useState<BatchType>('INVENTORY');
  const [batches, setBatches] = useState<ImportBatch[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const types: { key: BatchType; label: string; icon: any; description: string }[] = [
    { key: 'INVENTORY', label: '库存表', icon: Database, description: '导入产品库存数据' },
    { key: 'TRANSACTION', label: '收银流水', icon: FileText, description: '导入收银交易记录' },
    { key: 'REVIEW', label: '点评记录', icon: FileText, description: '导入客户点评信息' },
  ];

  useEffect(() => {
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    try {
      const res = await fetch('/api/import/batches');
      const data = await res.json();
      setBatches(data.batches);
    } catch (error) {
      console.error('Failed to fetch batches:', error);
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setIsUploading(true);
    setUploadSuccess(false);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', selectedType);

      const response = await fetch('/api/import/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        setUploadSuccess(true);
        fetchBatches();
        setTimeout(() => setUploadSuccess(false), 3000);
      }
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  }, [selectedType]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'] },
    maxFiles: 1,
    disabled: isUploading,
  });

  return (
    <AppLayout>
      <div className="animate-fade-in">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-dark-800 mb-2">
            数据导入
          </h1>
          <p className="text-dark-500">批量导入库存、收银流水与点评记录</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {types.map((type, index) => {
            const Icon = type.icon;
            return (
              <motion.button
                key={type.key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                onClick={() => setSelectedType(type.key)}
                className={cn(
                  'card p-6 text-left transition-all',
                  selectedType === type.key
                    ? 'ring-2 ring-primary-500 bg-primary-50'
                    : 'hover:bg-cream-50'
                )}
              >
                <div className={cn(
                  'w-12 h-12 rounded-xl flex items-center justify-center mb-4',
                  selectedType === type.key
                    ? 'bg-primary-500 text-white'
                    : 'bg-cream-100 text-primary-500'
                )}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-dark-800 mb-1">{type.label}</h3>
                <p className="text-sm text-dark-500">{type.description}</p>
              </motion.button>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="card p-8 mb-8"
        >
          <div
            {...getRootProps()}
            className={cn(
              'border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all',
              isDragActive
                ? 'border-primary-500 bg-primary-50'
                : 'border-cream-300 hover:border-primary-300 hover:bg-cream-50',
              isUploading && 'opacity-50 cursor-not-allowed'
            )}
          >
            <input {...getInputProps()} />
            {isUploading ? (
              <div className="flex flex-col items-center">
                <Loader2 className="w-12 h-12 text-primary-500 animate-spin mb-4" />
                <p className="font-medium text-dark-700">正在处理数据...</p>
                <p className="text-sm text-dark-500 mt-1">请稍候，系统正在处理 {getBatchTypeText(selectedType)}</p>
              </div>
            ) : uploadSuccess ? (
              <div className="flex flex-col items-center">
                <CheckCircle className="w-12 h-12 text-green-500 mb-4" />
                <p className="font-medium text-green-700">导入成功！</p>
                <p className="text-sm text-dark-500 mt-1">数据已成功入库</p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-100 to-accent-100 flex items-center justify-center mb-4">
                  <Upload className="w-8 h-8 text-primary-500" />
                </div>
                <p className="font-medium text-dark-700 mb-1">
                  拖拽 {getBatchTypeText(selectedType)} 文件到这里
                </p>
                <p className="text-sm text-dark-500 mb-3">或点击选择文件</p>
                <p className="text-xs text-dark-400">支持 CSV 格式文件</p>
              </div>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <h2 className="font-display text-xl font-semibold text-dark-800 mb-4">
            导入历史
          </h2>
          <div className="space-y-3">
            {batches.map((batch, index) => (
              <motion.div
                key={batch.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.5 + index * 0.05 }}
                className="card p-5 flex items-center gap-4"
              >
                <div className={cn(
                  'w-12 h-12 rounded-xl flex items-center justify-center',
                  batch.type === 'INVENTORY' && 'bg-blue-100 text-blue-600',
                  batch.type === 'TRANSACTION' && 'bg-green-100 text-green-600',
                  batch.type === 'REVIEW' && 'bg-accent-100 text-accent-600'
                )}>
                  {batch.type === 'INVENTORY' ? (
                    <Database className="w-6 h-6" />
                  ) : (
                    <FileText className="w-6 h-6" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h4 className="font-medium text-dark-800 truncate">
                      {batch.fileName}
                    </h4>
                    <span className={cn('status-badge', getStatusColor(batch.status))}>
                      {batch.status === 'COMPLETED' ? '已完成' : getStatusText(batch.status)}
                    </span>
                    <span className="text-xs bg-cream-100 text-dark-600 px-2 py-0.5 rounded">
                      {getBatchTypeText(batch.type)}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-dark-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {formatDateTime(batch.importedAt)}
                    </span>
                    <span>批次: {batch.batchNo}</span>
                    <span>{batch.recordCount} 条记录</span>
                  </div>
                </div>
                <div>
                  {batch.status === 'COMPLETED' ? (
                    <CheckCircle className="w-6 h-6 text-green-500" />
                  ) : batch.status === 'FAILED' ? (
                    <XCircle className="w-6 h-6 text-red-500" />
                  ) : (
                    <Loader2 className="w-6 h-6 text-primary-500 animate-spin" />
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
}
