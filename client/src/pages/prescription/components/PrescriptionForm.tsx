import { useState } from 'react'
import { Form, Input, InputNumber, Select, DatePicker, Button, Table, Space, message, Modal } from 'antd'
import { PlusOutlined, DeleteOutlined, UploadOutlined } from '@ant-design/icons'
import { createPrescription } from '@/api/prescription'
import { uploadAttachment } from '@/api/prescription'
import { AttachmentType, PrescriptionItemCreate } from '@/types'
import type { Store } from '@/types'
import dayjs from 'dayjs'

const { Option } = Select
const { TextArea } = Input

interface PrescriptionFormProps {
  stores: Store[]
  defaultStoreId?: number
  onSuccess: () => void
  onCancel: () => void
}

interface DrugItem extends PrescriptionItemCreate {
  key: string
}

const PrescriptionForm = ({ stores, defaultStoreId, onSuccess, onCancel }: PrescriptionFormProps) => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [drugList, setDrugList] = useState<DrugItem[]>([
    { key: '1', drugName: '', specification: '', dosage: '', frequency: '', quantity: 1, unit: '盒', price: 0 },
  ])
  const [attachments, setAttachments] = useState<File[]>([])

  const handleAddDrug = () => {
    const newKey = Date.now().toString()
    setDrugList([
      ...drugList,
      { key: newKey, drugName: '', specification: '', dosage: '', frequency: '', quantity: 1, unit: '盒', price: 0 },
    ])
  }

  const handleRemoveDrug = (key: string) => {
    if (drugList.length === 1) {
      message.warning('至少需要一个药品')
      return
    }
    setDrugList(drugList.filter((item) => item.key !== key))
  }

  const handleDrugChange = (key: string, field: keyof DrugItem, value: any) => {
    setDrugList(
      drugList.map((item) => (item.key === key ? { ...item, [field]: value } : item))
    )
  }

  const handleFileChange = (info: any) => {
    if (info.fileList) {
      setAttachments(info.fileList.map((f: any) => f.originFileObj || f))
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()

      const validDrugs = drugList.filter((d) => d.drugName.trim())
      if (validDrugs.length === 0) {
        message.error('请至少添加一个药品')
        return
      }

      setLoading(true)

      const items: PrescriptionItemCreate[] = validDrugs.map((d) => ({
        drugName: d.drugName,
        specification: d.specification,
        dosage: d.dosage,
        frequency: d.frequency,
        quantity: d.quantity,
        unit: d.unit,
        price: d.price,
      }))

      const result = await createPrescription({
        patientName: values.patientName,
        patientPhone: values.patientPhone,
        patientIdCard: values.patientIdCard,
        age: values.age,
        gender: values.gender,
        diagnosis: values.diagnosis,
        doctorName: values.doctorName,
        hospital: values.hospital,
        prescriptionDate: values.prescriptionDate.format('YYYY-MM-DD'),
        storeId: values.storeId,
        remark: values.remark,
        items,
      })

      if (attachments.length > 0) {
        for (const file of attachments) {
          try {
            await uploadAttachment(result.id, AttachmentType.PrescriptionPhoto, file)
          } catch (e) {
            console.error('Upload attachment error:', e)
          }
        }
      }

      onSuccess()
    } catch (error) {
      console.error('Create prescription error:', error)
    } finally {
      setLoading(false)
    }
  }

  const drugColumns = [
    {
      title: '药品名称',
      dataIndex: 'drugName',
      width: 180,
      render: (_: any, record: DrugItem) => (
        <Input
          value={record.drugName}
          onChange={(e) => handleDrugChange(record.key, 'drugName', e.target.value)}
          placeholder="请输入药品名称"
        />
      ),
    },
    {
      title: '规格',
      dataIndex: 'specification',
      width: 140,
      render: (_: any, record: DrugItem) => (
        <Input
          value={record.specification}
          onChange={(e) => handleDrugChange(record.key, 'specification', e.target.value)}
          placeholder="规格"
        />
      ),
    },
    {
      title: '用法',
      dataIndex: 'dosage',
      width: 120,
      render: (_: any, record: DrugItem) => (
        <Input
          value={record.dosage}
          onChange={(e) => handleDrugChange(record.key, 'dosage', e.target.value)}
          placeholder="每次用量"
        />
      ),
    },
    {
      title: '频次',
      dataIndex: 'frequency',
      width: 120,
      render: (_: any, record: DrugItem) => (
        <Select
          value={record.frequency}
          onChange={(value) => handleDrugChange(record.key, 'frequency', value)}
          placeholder="请选择"
          style={{ width: '100%' }}
        >
          <Option value="每日1次">每日1次</Option>
          <Option value="每日2次">每日2次</Option>
          <Option value="每日3次">每日3次</Option>
          <Option value="隔日1次">隔日1次</Option>
          <Option value="按需服用">按需服用</Option>
          <Option value="睡前服用">睡前服用</Option>
        </Select>
      ),
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      width: 100,
      render: (_: any, record: DrugItem) => (
        <InputNumber
          min={1}
          value={record.quantity}
          onChange={(value) => handleDrugChange(record.key, 'quantity', value || 1)}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: '单位',
      dataIndex: 'unit',
      width: 80,
      render: (_: any, record: DrugItem) => (
        <Select
          value={record.unit}
          onChange={(value) => handleDrugChange(record.key, 'unit', value)}
          style={{ width: '100%' }}
        >
          <Option value="盒">盒</Option>
          <Option value="瓶">瓶</Option>
          <Option value="片">片</Option>
          <Option value="支">支</Option>
          <Option value="袋">袋</Option>
        </Select>
      ),
    },
    {
      title: '单价(元)',
      dataIndex: 'price',
      width: 100,
      render: (_: any, record: DrugItem) => (
        <InputNumber
          min={0}
          step={0.01}
          value={record.price}
          onChange={(value) => handleDrugChange(record.key, 'price', value || 0)}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: '操作',
      dataIndex: 'action',
      width: 60,
      render: (_: any, record: DrugItem) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => handleRemoveDrug(record.key)}
        />
      ),
    },
  ]

  return (
    <div>
      <Form form={form} layout="vertical" initialValues={{
        storeId: defaultStoreId,
        prescriptionDate: dayjs(),
        gender: '男',
      }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <h4 style={{ marginBottom: 16, color: '#1f1f1f' }}>患者信息</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px 24px' }}>
              <Form.Item
                name="patientName"
                label="患者姓名"
                rules={[{ required: true, message: '请输入患者姓名' }]}
              >
                <Input placeholder="请输入患者姓名" />
              </Form.Item>
              <Form.Item
                name="patientPhone"
                label="联系电话"
                rules={[{ required: true, message: '请输入联系电话' }]}
              >
                <Input placeholder="请输入联系电话" />
              </Form.Item>
              <Form.Item
                name="patientIdCard"
                label="身份证号"
              >
                <Input placeholder="请输入身份证号" />
              </Form.Item>
              <Form.Item
                name="gender"
                label="性别"
                rules={[{ required: true, message: '请选择性别' }]}
              >
                <Select placeholder="请选择性别">
                  <Option value="男">男</Option>
                  <Option value="女">女</Option>
                </Select>
              </Form.Item>
              <Form.Item
                name="age"
                label="年龄"
                rules={[{ required: true, message: '请输入年龄' }]}
              >
                <InputNumber min={0} max={150} style={{ width: '100%' }} placeholder="请输入年龄" />
              </Form.Item>
              <Form.Item
                name="storeId"
                label="门店"
                rules={[{ required: true, message: '请选择门店' }]}
              >
                <Select placeholder="请选择门店">
                  {stores.map((store) => (
                    <Option key={store.id} value={store.id}>
                      {store.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </div>
          </div>

          <div>
            <h4 style={{ marginBottom: 16, color: '#1f1f1f' }}>处方信息</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px 24px' }}>
              <Form.Item
                name="diagnosis"
                label="诊断"
                rules={[{ required: true, message: '请输入诊断' }]}
              >
                <Input placeholder="请输入诊断" />
              </Form.Item>
              <Form.Item
                name="doctorName"
                label="医生"
                rules={[{ required: true, message: '请输入医生姓名' }]}
              >
                <Input placeholder="请输入医生姓名" />
              </Form.Item>
              <Form.Item
                name="hospital"
                label="医院"
                rules={[{ required: true, message: '请输入医院' }]}
              >
                <Input placeholder="请输入医院名称" />
              </Form.Item>
              <Form.Item
                name="prescriptionDate"
                label="处方日期"
                rules={[{ required: true, message: '请选择处方日期' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h4 style={{ margin: 0, color: '#1f1f1f' }}>药品明细</h4>
              <Button type="dashed" icon={<PlusOutlined />} onClick={handleAddDrug}>
                添加药品
              </Button>
            </div>
            <Table
              rowKey="key"
              columns={drugColumns}
              dataSource={drugList}
              pagination={false}
              size="small"
              bordered
            />
          </div>

          <div>
            <h4 style={{ marginBottom: 16, color: '#1f1f1f' }}>处方照片</h4>
            <div
              style={{
                border: '1px dashed #d9d9d9',
                borderRadius: 6,
                padding: 20,
                textAlign: 'center',
              }}
            >
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files) {
                    setAttachments(Array.from(e.target.files))
                  }
                }}
                style={{ marginBottom: 8 }}
              />
              {attachments.length > 0 && (
                <div style={{ marginTop: 8, fontSize: 12, color: '#52c41a' }}>
                  已选择 {attachments.length} 个文件
                </div>
              )}
              <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 4 }}>
                支持 JPG、PNG 格式，可多选
              </div>
            </div>
          </div>

          <Form.Item name="remark" label="备注">
            <TextArea rows={3} placeholder="请输入备注（选填）" />
          </Form.Item>
        </Space>

        <div style={{ textAlign: 'right', marginTop: 24, paddingTop: 16, borderTop: '1px solid #f0f0f0' }}>
          <Space>
            <Button onClick={onCancel}>取消</Button>
            <Button type="primary" loading={loading} onClick={handleSubmit}>
              保存并提交
            </Button>
          </Space>
        </div>
      </Form>
    </div>
  )
}

export default PrescriptionForm
