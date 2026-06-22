import React, { useState } from 'react'
import {
  Table,
  Button,
  Space,
  Popconfirm,
  App as AntdApp,
  Modal,
  Form,
  Input,
  Drawer,
  Upload,
  Empty,
  Card,
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  UploadOutlined,
  DownloadOutlined,
  CheckOutlined,
  CloseOutlined,
} from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { vendorApi } from '@/api/vendor'
import StatusTag from '@/components/StatusTag'
import { Vendor, SupplierMaterial } from '@/types'
import { MaterialStatus } from '@/types/enums'
import type { UploadProps } from 'antd'
import dayjs from 'dayjs'

const VendorList: React.FC = () => {
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 })
  const [searchParams, setSearchParams] = useState<Record<string, any>>({})
  const { message } = AntdApp.useApp()
  const queryClient = useQueryClient()
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form] = Form.useForm<Partial<Vendor>>()
  const [materialDrawerOpen, setMaterialDrawerOpen] = useState(false)
  const [currentVendor, setCurrentVendor] = useState<Vendor | null>(null)
  const [uploadForm] = Form.useForm()
  const [uploading, setUploading] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['vendors', pagination, searchParams],
    queryFn: () =>
      vendorApi.list({
        skip: (pagination.current - 1) * pagination.pageSize,
        limit: pagination.pageSize,
        keyword: searchParams.keyword,
      }),
  })

  const { data: materialsData, refetch: refetchMaterials } = useQuery({
    queryKey: ['vendor-materials', currentVendor?.id],
    queryFn: () => (currentVendor ? vendorApi.listMaterials(currentVendor.id, { skip: 0, limit: 100 }) : Promise.resolve(null)),
    enabled: !!currentVendor && materialDrawerOpen,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => vendorApi.remove(id),
    onSuccess: () => {
      message.success('删除成功')
      queryClient.invalidateQueries({ queryKey: ['vendors'] })
    },
    onError: () => message.error('删除失败'),
  })

  const createMutation = useMutation({
    mutationFn: (data: Partial<Vendor>) => vendorApi.create(data),
    onSuccess: () => {
      message.success('创建成功')
      queryClient.invalidateQueries({ queryKey: ['vendors'] })
      setFormOpen(false)
      setEditingId(null)
      form.resetFields()
    },
    onError: () => message.error('创建失败'),
  })

  const updateMutation = useMutation({
    mutationFn: (params: { id: number; data: Partial<Vendor> }) =>
      vendorApi.update(params.id, params.data),
    onSuccess: () => {
      message.success('更新成功')
      queryClient.invalidateQueries({ queryKey: ['vendors'] })
      setFormOpen(false)
      setEditingId(null)
      form.resetFields()
    },
    onError: () => message.error('更新失败'),
  })

  const reviewMaterialMutation = useMutation({
    mutationFn: (params: { vendorId: number; materialId: number; status: MaterialStatus }) =>
      vendorApi.reviewMaterial(params.vendorId, params.materialId, params.status),
    onSuccess: () => {
      message.success('审核完成')
      queryClient.invalidateQueries({ queryKey: ['vendor-materials', currentVendor?.id] })
      refetchMaterials()
    },
    onError: () => message.error('审核失败'),
  })

  const handleFormSubmit = async () => {
    try {
      const values = await form.validateFields()
      if (editingId) {
        updateMutation.mutate({ id: editingId, data: values })
      } else {
        createMutation.mutate(values)
      }
    } catch {
    }
  }

  const handleEdit = (record: Vendor) => {
    setEditingId(record.id)
    form.setFieldsValue({
      name: record.name,
      contact: record.contact,
      email: record.email,
      phone: record.phone,
      address: record.address,
    })
    setFormOpen(true)
  }

  const handleAdd = () => {
    setEditingId(null)
    form.resetFields()
    setFormOpen(true)
  }

  const handleViewMaterials = (record: Vendor) => {
    setCurrentVendor(record)
    setMaterialDrawerOpen(true)
  }

  const handleDownloadMaterial = (materialId: number) => {
    if (!currentVendor) return
    vendorApi
      .downloadMaterial(currentVendor.id, materialId)
      .then((blob) => {
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `material_${materialId}_${dayjs().format('YYYYMMDD')}`
        a.click()
        window.URL.revokeObjectURL(url)
        message.success('下载成功')
      })
      .catch(() => message.error('下载失败'))
  }

  const uploadProps: UploadProps = {
    multiple: false,
    showUploadList: false,
    beforeUpload: async (file) => {
      if (!currentVendor) return false
      try {
        const values = await uploadForm.validateFields()
        setUploading(true)
        await vendorApi.uploadMaterial(currentVendor.id, {
          materialType: values.materialType,
          materialName: values.materialName,
          file: file as File,
        })
        message.success('上传成功')
        uploadForm.resetFields()
        queryClient.invalidateQueries({ queryKey: ['vendor-materials', currentVendor.id] })
        refetchMaterials()
      } catch {
        message.error('上传失败，请填写材料类型和名称')
      } finally {
        setUploading(false)
      }
      return false
    },
  }

  const columns = [
    {
      title: '名称',
      dataIndex: 'name',
    },
    {
      title: '联系人',
      dataIndex: 'contact',
      width: 100,
      render: (val?: string) => val || '-',
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      width: 180,
      render: (val?: string) => val || '-',
    },
    {
      title: '电话',
      dataIndex: 'phone',
      width: 140,
      render: (val?: string) => val || '-',
    },
    {
      title: '地址',
      dataIndex: 'address',
      ellipsis: true,
      render: (val?: string) => val || '-',
    },
    {
      title: '操作',
      key: 'actions',
      width: 260,
      fixed: 'right' as const,
      render: (_: unknown, record: Vendor) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewMaterials(record)}
          >
            查看材料
          </Button>
          <Popconfirm title="确定删除该供应商？" onConfirm={() => deleteMutation.mutate(record.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const materialColumns = [
    {
      title: '材料类型',
      dataIndex: 'materialType',
      width: 120,
    },
    {
      title: '材料名称',
      dataIndex: 'materialName',
    },
    {
      title: '上传日期',
      dataIndex: 'uploadDate',
      width: 120,
      render: (val: string) => dayjs(val).format('YYYY-MM-DD'),
    },
    {
      title: '上传人',
      dataIndex: 'uploadedBy',
      width: 100,
      render: (val?: string) => val || '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (val: MaterialStatus) => <StatusTag status={val} />,
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      render: (_: unknown, record: SupplierMaterial) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<DownloadOutlined />}
            onClick={() => handleDownloadMaterial(record.id)}
          >
            下载
          </Button>
          {record.status === MaterialStatus.PENDING && currentVendor && (
            <>
              <Button
                type="link"
                size="small"
                icon={<CheckOutlined />}
                onClick={() =>
                  reviewMaterialMutation.mutate({
                    vendorId: currentVendor.id,
                    materialId: record.id,
                    status: MaterialStatus.APPROVED,
                  })
                }
              >
                通过
              </Button>
              <Button
                type="link"
                size="small"
                danger
                icon={<CloseOutlined />}
                onClick={() =>
                  reviewMaterialMutation.mutate({
                    vendorId: currentVendor.id,
                    materialId: record.id,
                    status: MaterialStatus.REJECTED,
                  })
                }
              >
                驳回
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ]

  const items = data?.items || []
  const total = data?.total || 0

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>供应商管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新增供应商
        </Button>
      </div>

      <div style={{ marginBottom: 16 }}>
        <Input.Search
          placeholder="搜索供应商名称"
          allowClear
          style={{ width: 300 }}
          onSearch={(value) => {
            setSearchParams({ keyword: value || undefined })
            setPagination({ ...pagination, current: 1 })
          }}
        />
      </div>

      <Table
        rowKey="id"
        loading={isLoading}
        columns={columns}
        dataSource={items}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (t) => `共 ${t} 条`,
          onChange: (page, pageSize) => setPagination({ current: page, pageSize }),
        }}
        scroll={{ x: 1000 }}
      />

      <Modal
        title={editingId ? '编辑供应商' : '新增供应商'}
        open={formOpen}
        onCancel={() => {
          setFormOpen(false)
          setEditingId(null)
          form.resetFields()
        }}
        onOk={handleFormSubmit}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
        width={600}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="供应商名称"
            name="name"
            rules={[{ required: true, message: '请输入供应商名称' }]}
          >
            <Input placeholder="请输入供应商名称" />
          </Form.Item>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item label="联系人" name="contact">
              <Input placeholder="请输入联系人姓名" />
            </Form.Item>
            <Form.Item label="电话" name="phone">
              <Input placeholder="请输入联系电话" />
            </Form.Item>
          </div>
          <Form.Item label="邮箱" name="email">
            <Input placeholder="请输入邮箱地址" />
          </Form.Item>
          <Form.Item label="地址" name="address">
            <Input.TextArea rows={3} placeholder="请输入地址" />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title={`供应商材料 - ${currentVendor?.name || ''}`}
        width={800}
        open={materialDrawerOpen}
        onClose={() => {
          setMaterialDrawerOpen(false)
          setCurrentVendor(null)
          uploadForm.resetFields()
        }}
      >
        <Card title="上传材料" style={{ marginBottom: 16 }} size="small">
          <Form form={uploadForm} layout="inline">
            <Form.Item
              name="materialType"
              label="材料类型"
              rules={[{ required: true, message: '请输入材料类型' }]}
            >
              <Input placeholder="如：营业执照" style={{ width: 160 }} />
            </Form.Item>
            <Form.Item
              name="materialName"
              label="材料名称"
              rules={[{ required: true, message: '请输入材料名称' }]}
            >
              <Input placeholder="如：营业执照2025" style={{ width: 200 }} />
            </Form.Item>
            <Form.Item>
              <Upload {...uploadProps}>
                <Button icon={<UploadOutlined />} loading={uploading}>
                  选择文件上传
                </Button>
              </Upload>
            </Form.Item>
          </Form>
        </Card>

        {materialsData?.items?.length ? (
          <Table
            rowKey="id"
            columns={materialColumns}
            dataSource={materialsData.items}
            pagination={false}
            size="small"
          />
        ) : (
          <Empty description="暂无上传的材料" />
        )}
      </Drawer>
    </div>
  )
}

export default VendorList
