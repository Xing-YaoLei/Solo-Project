import React, { useState, useEffect, useCallback } from 'react'
import {
  Row,
  Col,
  Card,
  Select,
  Button,
  Tag,
  Table,
  App as AntApp,
  Modal,
  Form,
  Input,
  DatePicker,
  Upload,
  Space,
  Tooltip,
  Progress,
  Alert,
  Image,
} from 'antd'
import {
  ReloadOutlined,
  PlusOutlined,
  PictureOutlined,
  UploadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  InfoCircleOutlined,
  CameraOutlined,
  StarOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { api } from '../api/index.js'

const PHOTO_ICONS = {
  display: '🖼️',
  pop: '📋',
  price: '🏷️',
  stock: '📦',
}
const PHOTO_NAMES = {
  display: '陈列全景',
  pop: 'POP物料',
  price: '价格标签',
  stock: '库存堆头',
}

export default function DisplayPhotos() {
  const { message, modal } = AntApp.useApp()
  const [loading, setLoading] = useState(false)
  const [inspections, setInspections] = useState([])
  const [promotions, setPromotions] = useState([])
  const [stores, setStores] = useState([])
  const [filters, setFilters] = useState({
    promotion_id: undefined,
    store_id: undefined,
    is_qualified: undefined,
  })
  const [createModal, setCreateModal] = useState({ open: false })
  const [photoPreview, setPhotoPreview] = useState({ open: false, data: null })
  const [detailModal, setDetailModal] = useState({ open: false, data: null })
  const [form] = Form.useForm()
  const [uploading, setUploading] = useState(false)
  const [uploadTarget, setUploadTarget] = useState(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [list, promos, storeList] = await Promise.all([
        api.getInspections(filters),
        api.getPromotions(),
        api.getStores(),
      ])
      setInspections(list)
      setPromotions(promos)
      setStores(storeList)
    } catch (e) {
      message.error('加载巡检记录失败')
    } finally {
      setLoading(false)
    }
  }, [filters, message])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const totalPhotos = inspections.reduce((s, i) => s + (i.photos?.length || 0), 0)
  const qualifiedCount = inspections.filter((i) => i.is_qualified).length

  const handleCreateInspection = async (values) => {
    try {
      const payload = {
        ...values,
        overall_score:
          (values.position_score || 0) +
          (values.pop_score || 0) +
          (values.price_score || 0) +
          (values.stock_score || 0),
        is_qualified:
          values.position_score + values.pop_score + values.price_score + values.stock_score >= 60,
        inspection_date: values.inspection_date.format('YYYY-MM-DD'),
      }
      await api.createInspection(payload)
      message.success('巡检记录已创建')
      setCreateModal({ open: false })
      form.resetFields()
      fetchData()
    } catch (e) {
      message.error('创建失败')
    }
  }

  const handlePhotoUpload = async (file) => {
    if (!uploadTarget) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('upload_by', '前端用户')
      fd.append('photo_type', 'display')
      await api.uploadInspectionPhoto(uploadTarget, fd)
      message.success('照片上传成功')
      fetchData()
    } catch (e) {
      message.error('上传失败')
    } finally {
      setUploading(false)
      setUploadTarget(null)
    }
  }

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 70,
    },
    {
      title: '促销活动',
      dataIndex: 'promotion_id',
      width: 220,
      render: (v) => {
        const p = promotions.find((x) => x.id === v)
        return p ? `${p.promo_code} - ${p.promo_name}` : `ID:${v}`
      },
    },
    {
      title: '门店',
      dataIndex: 'store_id',
      width: 200,
      render: (v) => {
        const s = stores.find((x) => x.id === v)
        return s ? s.store_name : `ID:${v}`
      },
    },
    {
      title: '巡检日期',
      dataIndex: 'inspection_date',
      width: 120,
    },
    {
      title: '是否合格',
      dataIndex: 'is_qualified',
      width: 100,
      filters: [
        { text: '合格', value: true },
        { text: '不合格', value: false },
      ],
      onFilter: (v, r) => r.is_qualified === v,
      render: (v) =>
        v ? (
          <Tag icon={<CheckCircleOutlined />} color="green">
            合格
          </Tag>
        ) : (
          <Tag icon={<CloseCircleOutlined />} color="red">
            不合格
          </Tag>
        ),
    },
    {
      title: '综合评分',
      dataIndex: 'overall_score',
      width: 160,
      sorter: (a, b) => a.overall_score - b.overall_score,
      render: (v, r) => (
        <Tooltip
          title={
            <div>
              <div>位置: {r.position_score}/30</div>
              <div>POP: {r.pop_score}/20</div>
              <div>价格: {r.price_score}/20</div>
              <div>库存: {r.stock_score}/30</div>
            </div>
          }
        >
          <Progress
            percent={v}
            size="small"
            status={v >= 60 ? v >= 80 ? 'success' : 'normal' : 'exception'}
          />
        </Tooltip>
      ),
    },
    {
      title: '照片数',
      dataIndex: 'photos',
      width: 90,
      render: (v) => (
        <Space>
          <CameraOutlined style={{ color: '#1677ff' }} />
          <b>{v?.length || 0}</b>
        </Space>
      ),
    },
    {
      title: '巡检人',
      dataIndex: 'inspector',
      width: 100,
      render: (v) => v || '-',
    },
    {
      title: '备注',
      dataIndex: 'remark',
      width: 180,
      ellipsis: true,
      render: (v) => <Tooltip title={v}>{v || '-'}</Tooltip>,
    },
    {
      title: '操作',
      width: 200,
      fixed: 'right',
      render: (_, r) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<PictureOutlined />}
            onClick={() => setDetailModal({ open: true, data: r })}
          >
            查看照片({r.photos?.length || 0})
          </Button>
          <Upload
            showUploadList={false}
            beforeUpload={(file) => {
              setUploadTarget(r.id)
              handlePhotoUpload(file)
              return false
            }}
          >
            <Button
              type="link"
              size="small"
              icon={<UploadOutlined />}
              loading={uploading && uploadTarget === r.id}
            >
              上传照片
            </Button>
          </Upload>
        </Space>
      ),
    },
  ]

  const renderPhotoGrid = (photos, inspectData) => (
    <div className="display-photo-grid">
      {photos?.length ? (
        photos.map((p) => (
          <div key={p.id} className="photo-card" onClick={() => setPhotoPreview({ open: true, data: p })}>
            <div className="photo-placeholder">
              {PHOTO_ICONS[p.photo_type] || '🖼️'}
            </div>
            <div className="photo-meta">
              <div style={{ fontWeight: 600, color: '#1f2937', marginBottom: 4 }}>
                {PHOTO_NAMES[p.photo_type] || p.photo_type}
              </div>
              <div style={{ fontSize: 11 }}>
                上传: {p.upload_by || '-'}
              </div>
              <div style={{ fontSize: 11, color: '#999' }}>
                {p.file_name}
              </div>
            </div>
          </div>
        ))
      ) : (
        <div
          style={{
            gridColumn: '1 / -1',
            padding: 40,
            textAlign: 'center',
            color: '#aaa',
            border: '2px dashed #eee',
            borderRadius: 8,
          }}
        >
          <CameraOutlined style={{ fontSize: 40, display: 'block', marginBottom: 8 }} />
          暂无照片，请上传陈列照片
        </div>
      )}
    </div>
  )

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={6}>
          <div className="stat-card info">
            <div className="stat-label">巡检总记录</div>
            <div className="stat-value">{inspections.length}</div>
            <StarOutlined className="stat-icon" />
          </div>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <div className="stat-card success">
            <div className="stat-label">合格数</div>
            <div className="stat-value">{qualifiedCount}</div>
            <CheckCircleOutlined className="stat-icon" />
          </div>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <div className="stat-card warning">
            <div className="stat-label">不合格数</div>
            <div className="stat-value">{inspections.length - qualifiedCount}</div>
            <CloseCircleOutlined className="stat-icon" />
          </div>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <div className="stat-card">
            <div className="stat-label">累计照片</div>
            <div className="stat-value">{totalPhotos}</div>
            <PictureOutlined className="stat-icon" />
          </div>
        </Col>
      </Row>

      <div className="card-section">
        <Row gutter={16} align="middle">
          <Col span={24}>
            <Space size="middle" wrap>
              <Select
                allowClear
                placeholder="选择促销活动"
                showSearch
                style={{ minWidth: 320 }}
                options={promotions.map((p) => ({
                  value: p.id,
                  label: `${p.promo_code} - ${p.promo_name}`,
                }))}
                value={filters.promotion_id}
                onChange={(v) => setFilters((f) => ({ ...f, promotion_id: v }))}
              />
              <Select
                allowClear
                placeholder="选择门店"
                showSearch
                style={{ minWidth: 240 }}
                options={stores.map((s) => ({
                  value: s.id,
                  label: `${s.store_code} - ${s.store_name}`,
                }))}
                value={filters.store_id}
                onChange={(v) => setFilters((f) => ({ ...f, store_id: v }))}
              />
              <Select
                allowClear
                placeholder="是否合格"
                style={{ width: 140 }}
                options={[
                  { value: true, label: '合格' },
                  { value: false, label: '不合格' },
                ]}
                value={filters.is_qualified}
                onChange={(v) => setFilters((f) => ({ ...f, is_qualified: v }))}
              />
              <Button icon={<ReloadOutlined />} onClick={fetchData}>
                查询
              </Button>
            </Space>
            <Space style={{ float: 'right' }}>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModal({ open: true })}>
                新建巡检记录
              </Button>
            </Space>
          </Col>
        </Row>
      </div>

      <div className="card-section">
        <div className="section-title">陈列巡检记录（含照片）</div>
        <Table
          columns={columns}
          dataSource={inspections}
          loading={loading}
          rowKey="id"
          scroll={{ x: 1400 }}
          rowClassName={(r) => (!r.is_qualified ? 'impact-highlight' : '')}
          pagination={{ pageSize: 12, showSizeChanger: true }}
          expandable={{
            expandedRowRender: (r) => (
              <div style={{ padding: '12px 0' }}>
                <div className="section-title" style={{ fontSize: 14 }}>
                  陈列照片
                </div>
                {renderPhotoGrid(r.photos, r)}
              </div>
            ),
            expandIcon: ({ expanded, onExpand, record }) =>
              record.photos?.length ? (
                <Button type="link" size="small" onClick={(e) => onExpand(record, e)}>
                  {expanded ? '收起照片' : `展开${record.photos.length}张照片`}
                </Button>
              ) : null,
          }}
        />
      </div>

      <Modal
        open={createModal.open}
        title="新建陈列巡检记录"
        width={640}
        onCancel={() => {
          setCreateModal({ open: false })
          form.resetFields()
        }}
        footer={null}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleCreateInspection}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="促销活动"
                name="promotion_id"
                rules={[{ required: true, message: '请选择' }]}
              >
                <Select
                  showSearch
                  options={promotions.map((p) => ({
                    value: p.id,
                    label: `${p.promo_code} - ${p.promo_name}`,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="门店" name="store_id" rules={[{ required: true, message: '请选择' }]}>
                <Select
                  showSearch
                  options={stores.map((s) => ({
                    value: s.id,
                    label: `${s.store_code} - ${s.store_name}`,
                  }))}
                />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            label="巡检日期"
            name="inspection_date"
            rules={[{ required: true }]}
            initialValue={dayjs()}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="位置(0-30)" name="position_score" initialValue={20}>
                <Input type="number" min={0} max={30} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="POP物料(0-20)" name="pop_score" initialValue={15}>
                <Input type="number" min={0} max={20} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="价格标签(0-20)" name="price_score" initialValue={15}>
                <Input type="number" min={0} max={20} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="库存展示(0-30)" name="stock_score" initialValue={20}>
                <Input type="number" min={0} max={30} />
              </Form.Item>
            </Col>
          </Row>
          <Alert
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
            message="综合得分 = 四项之和，≥60分为合格"
          />
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="巡检人" name="inspector">
                <Input placeholder="巡检人员姓名" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item label="备注" name="remark">
                <Input.TextArea rows={2} placeholder="巡检备注" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button
                onClick={() => {
                  setCreateModal({ open: false })
                  form.resetFields()
                }}
              >
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                保存
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        open={detailModal.open}
        title={`陈列照片 - ${detailModal.data?.inspection_date || ''}`}
        width={900}
        onCancel={() => setDetailModal({ open: false, data: null })}
        footer={[
          <Upload
            key="upload"
            showUploadList={false}
            beforeUpload={(file) => {
              setUploadTarget(detailModal.data?.id)
              handlePhotoUpload(file).then(() => {
                fetchData().then(() => {
                  const updated = inspections.find((i) => i.id === detailModal.data?.id)
                  if (updated) setDetailModal({ open: true, data: updated })
                })
              })
              return false
            }}
          >
            <Button icon={<UploadOutlined />} type="primary">
              继续上传照片
            </Button>
          </Upload>,
          <Button key="close" onClick={() => setDetailModal({ open: false, data: null })}>
            关闭
          </Button>,
        ]}
        destroyOnClose
      >
        {detailModal.data && (
          <div>
            <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
              <Col span={8}>
                <Card size="small">
                  合格情况：
                  {detailModal.data.is_qualified ? (
                    <Tag color="green">合格</Tag>
                  ) : (
                    <Tag color="red">不合格</Tag>
                  )}
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small">
                  综合得分：<b>{detailModal.data.overall_score}</b>/100
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small">照片数量：<b>{detailModal.data.photos?.length || 0}</b></Card>
              </Col>
            </Row>
            {renderPhotoGrid(detailModal.data.photos, detailModal.data)}
          </div>
        )}
      </Modal>

      <Modal
        open={photoPreview.open}
        title={`照片预览 - ${photoPreview.data?.file_name || ''}`}
        width={640}
        onCancel={() => setPhotoPreview({ open: false, data: null })}
        footer={null}
      >
        <div className="photo-placeholder" style={{ aspectRatio: '4 / 3', fontSize: 120 }}>
          {PHOTO_ICONS[photoPreview.data?.photo_type] || '🖼️'}
        </div>
        <div style={{ marginTop: 16, padding: 16, background: '#fafafa', borderRadius: 8 }}>
          <div style={{ lineHeight: 2 }}>
            <div>
              <b>文件名：</b>
              {photoPreview.data?.file_name}
            </div>
            <div>
              <b>类型：</b>
              {PHOTO_NAMES[photoPreview.data?.photo_type] || photoPreview.data?.photo_type}
            </div>
            <div>
              <b>上传人：</b>
              {photoPreview.data?.upload_by || '-'}
            </div>
            <div>
              <b>上传时间：</b>
              {photoPreview.data?.created_at || '-'}
            </div>
          </div>
          <Alert
            type="info"
            showIcon
            style={{ marginTop: 12 }}
            message="照片存储路径与真实文件关联，此处仅为mock预览。"
          />
        </div>
      </Modal>
    </div>
  )
}
