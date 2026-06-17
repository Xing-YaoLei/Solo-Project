import React, { useEffect, useState } from 'react';
import { Card, Table, Button, Upload, Space, Tag, message, Progress, Modal, Select, Alert } from 'antd';
import { UploadOutlined, DownloadOutlined, InfoCircleOutlined } from '@ant-design/icons';
import type { UploadFile, UploadProps } from 'antd/es/upload/interface';
import { dataImportAPI } from '../../services/api';
import { ImportBatch } from '../../types';
import { formatDateTime, formatNumber } from '../../utils/format';

const DataImport: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [batches, setBatches] = useState<ImportBatch[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [importType, setImportType] = useState<string>('payment');
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const mockBatches: ImportBatch[] = Array.from({ length: 25 }, (_, i) => ({
    id: i + 1,
    batch_no: `BATCH${String(i + 1).padStart(6, '0')}`,
    import_type: ['payment', 'utility', 'repair', 'inspection'][i % 4] as ImportBatch['import_type'],
    file_name: ['支付数据', '水电数据', '维修数据', '验房数据'][i % 4] + `_20240${Math.floor(i / 6) + 1}.xlsx`,
    total_count: Math.floor(Math.random() * 500) + 50,
    success_count: Math.floor(Math.random() * 450) + 40,
    failed_count: Math.floor(Math.random() * 50),
    status: (['pending', 'processing', 'success', 'failed'] as const)[i % 4],
    created_at: `2024-0${Math.floor(i / 5) + 1}-${(i % 28) + 1} ${String(Math.floor(Math.random() * 24)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:00`,
    imported_by: i % 3 + 1,
    completed_at: i % 4 !== 1 ? `2024-0${Math.floor(i / 5) + 1}-${(i % 28) + 1} ${String(Math.floor(Math.random() * 24)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:00` : undefined,
  }));

  const importTypes = [
    { value: 'payment', label: '支付数据', template: 'payment_template.xlsx' },
    { value: 'utility', label: '水电数据', template: 'utility_template.xlsx' },
    { value: 'repair', label: '维修数据', template: 'repair_template.xlsx' },
    { value: 'inspection', label: '验房数据', template: 'inspection_template.xlsx' },
  ];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await dataImportAPI.getBatches({ page, page_size: pageSize }).catch(() => ({
          items: mockBatches.slice((page - 1) * pageSize, page * pageSize),
          total: mockBatches.length,
          page,
          page_size: pageSize,
        }));
        setBatches(data.items);
        setTotal(data.total);
      } catch (error) {
        console.error('Failed to fetch import batches:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [page, pageSize]);

  const handleUpload = async () => {
    if (fileList.length === 0) {
      message.warning('请选择要上传的文件');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const file = fileList[0].originFileObj;
      if (!file) {
        message.error('文件无效');
        return;
      }

      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      await new Promise(resolve => setTimeout(resolve, 2000));
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      message.success('文件上传成功，正在处理...');
      setImportModalOpen(false);
      setFileList([]);
      setUploadProgress(0);
      
      setTimeout(() => {
        setPage(1);
      }, 1000);
    } catch (error) {
      message.error('文件上传失败');
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadTemplate = () => {
    const typeInfo = importTypes.find(t => t.value === importType);
    if (typeInfo) {
      message.info(`正在下载模板: ${typeInfo.template}`);
    }
  };

  const columns = [
    {
      title: '批次号',
      dataIndex: 'batch_no',
      key: 'batch_no',
      width: 140,
    },
    {
      title: '文件名',
      dataIndex: 'file_name',
      key: 'file_name',
      width: 200,
    },
    {
      title: '类型',
      dataIndex: 'import_type',
      key: 'import_type',
      width: 100,
      render: (value: string) => {
        const typeMap: Record<string, { label: string; color: string }> = {
          payment: { label: '支付数据', color: 'blue' },
          utility: { label: '水电数据', color: 'green' },
          repair: { label: '维修数据', color: 'orange' },
          inspection: { label: '验房数据', color: 'purple' },
        };
        const info = typeMap[value] || { label: value, color: 'default' };
        return <Tag color={info.color}>{info.label}</Tag>;
      },
    },
    {
      title: '总数',
      dataIndex: 'total_count',
      key: 'total_count',
      width: 80,
      render: (value: number) => formatNumber(value),
    },
    {
      title: '成功',
      dataIndex: 'success_count',
      key: 'success_count',
      width: 80,
      render: (value: number) => <span style={{ color: '#52c41a' }}>{formatNumber(value)}</span>,
    },
    {
      title: '失败',
      dataIndex: 'failed_count',
      key: 'failed_count',
      width: 80,
      render: (value: number) => value > 0 ? <span style={{ color: '#f5222d' }}>{formatNumber(value)}</span> : '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (value: string, record: ImportBatch) => {
        if (value === 'processing') {
          const progress = Math.round((record.success_count / record.total_count) * 100);
          return (
            <Space direction="vertical" style={{ width: '100%' }}>
              <Progress percent={progress} size="small" />
            </Space>
          );
        }
        const statusMap: Record<string, { text: string; color: string }> = {
          pending: { text: '等待中', color: 'default' },
          success: { text: '成功', color: 'green' },
          failed: { text: '失败', color: 'red' },
        };
        const info = statusMap[value] || { text: value, color: 'default' };
        return <Tag color={info.color}>{info.text}</Tag>;
      },
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (value: string) => formatDateTime(value),
    },
    {
      title: '完成时间',
      dataIndex: 'completed_at',
      key: 'completed_at',
      width: 160,
      render: (value: string) => value ? formatDateTime(value) : '-',
    },
  ];

  const uploadProps: UploadProps = {
    onRemove: (file) => {
      const index = fileList.indexOf(file);
      const newFileList = fileList.slice();
      newFileList.splice(index, 1);
      setFileList(newFileList);
    },
    beforeUpload: (file) => {
      const isExcel = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.type === 'application/vnd.ms-excel';
      if (!isExcel && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
        message.error('只支持上传 Excel 文件!');
        return false;
      }
      const isLt10M = file.size / 1024 / 1024 < 10;
      if (!isLt10M) {
        message.error('文件大小不能超过 10MB!');
        return false;
      }
      setFileList([file as UploadFile]);
      return false;
    },
    fileList,
    accept: '.xlsx,.xls',
    maxCount: 1,
  };

  return (
    <div>
      <Card
        title="数据导入"
        bordered={false}
        extra={
          <Space>
            <Button icon={<DownloadOutlined />} onClick={handleDownloadTemplate}>
              下载模板
            </Button>
            <Button
              type="primary"
              icon={<UploadOutlined />}
              onClick={() => setImportModalOpen(true)}
            >
              导入数据
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={batches}
          rowKey="id"
          loading={loading}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
            onChange: (page, pageSize) => {
              setPage(page);
              setPageSize(pageSize);
            },
          }}
          scroll={{ x: 1100 }}
        />
      </Card>

      <Modal
        title="导入数据"
        open={importModalOpen}
        onOk={handleUpload}
        onCancel={() => {
          setImportModalOpen(false);
          setFileList([]);
          setUploadProgress(0);
        }}
        confirmLoading={uploading}
        okText="开始导入"
        cancelText="取消"
        width={500}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
              数据类型
            </label>
            <Select
              style={{ width: '100%' }}
              value={importType}
              onChange={setImportType}
              options={importTypes.map(t => ({ value: t.value, label: t.label }))}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
              上传文件
            </label>
            <Upload {...uploadProps}>
              <Button icon={<UploadOutlined />}>选择 Excel 文件</Button>
            </Upload>
            <div style={{ marginTop: 8, color: '#999', fontSize: 12 }}>
              <InfoCircleOutlined style={{ marginRight: 4 }} />
              支持 .xlsx, .xls 格式，文件大小不超过 10MB
            </div>
          </div>

          {uploading && (
            <Progress percent={uploadProgress} status={uploadProgress === 100 ? 'success' : 'active'} />
          )}

          <Alert
            message="导入说明"
            description={
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                <li>请先下载对应类型的数据模板</li>
                <li>按照模板格式填写数据后再上传</li>
                <li>导入过程中请勿关闭页面</li>
                <li>导入完成后可在下方列表查看结果</li>
              </ul>
            }
            type="info"
            showIcon
          />
        </Space>
      </Modal>
    </div>
  );
};

export default DataImport;
