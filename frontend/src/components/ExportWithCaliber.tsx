import { Button, Modal, Form, Select, Input, message, Alert } from 'antd'
import { ExportOutlined } from '@ant-design/icons'
import { useState } from 'react'
import { exportApi } from '@/api'
import { saveAs } from 'file-saver'
import dayjs from 'dayjs'

interface ExportWithCaliberProps {
  defaultType?: string
  filterConditions?: Record<string, any>
  buttonText?: string
  buttonType?: 'primary' | 'default' | 'dashed' | 'text' | 'link'
  onSuccess?: () => void
}

const exportTypeOptions = [
  { value: 'contracts', label: '合同数据' },
  { value: 'bills', label: '单据数据' },
  { value: 'reconciliation', label: '对账差异数据' },
  { value: 'exceptions', label: '异常单数据' },
]

const caliberTemplates: Record<string, string> = {
  contracts: `【数据口径说明】
1. 统计范围：所有合同，包含草稿、待审批、已审批、已完成、已作废等全部状态
2. 合同金额：签约金额，包含主合同及补充协议金额
3. 回款周期：从签约日期到最后一笔回款日期的天数
4. 统计时间：${dayjs().format('YYYY-MM-DD HH:mm:ss')}
5. 数据来源：家装工地量房报价跟进台
6. 注意事项：金额单位为人民币元，保留2位小数`,
  bills: `【数据口径说明】
1. 统计范围：所有单据，包含量房单、报价单、材料单、人工费单等
2. 单据金额：单据明细实际金额合计，已扣除折扣
3. 已付金额：截至导出时间已实际到账金额
4. 未付金额：单据总金额减去已付金额
5. 统计时间：${dayjs().format('YYYY-MM-DD HH:mm:ss')}
6. 数据来源：家装工地量房报价跟进台
7. 注意事项：金额单位为人民币元，保留2位小数`,
  reconciliation: `【数据口径说明】
1. 统计范围：所有对账差异记录
2. 差异金额：预期金额与实际金额的差额
3. 状态说明：待处理、处理中、已解决、已驳回
4. 处理时效：从创建时间到处理完成时间的小时数
5. 统计时间：${dayjs().format('YYYY-MM-DD HH:mm:ss')}
6. 数据来源：家装工地量房报价跟进台
7. 注意事项：金额单位为人民币元，保留2位小数`,
  exceptions: `【数据口径说明】
1. 统计范围：所有异常单，包含金额不一致、审批超时、资料缺失等类型
2. 优先级：高/中/低，影响金额超过1万元自动标记为高优先级
3. 处理时效：从创建时间到关闭时间的小时数
4. 统计时间：${dayjs().format('YYYY-MM-DD HH:mm:ss')}
5. 数据来源：家装工地量房报价跟进台
6. 注意事项：金额单位为人民币元，保留2位小数`,
}

export default function ExportWithCaliber({
  defaultType,
  filterConditions,
  buttonText = '导出数据',
  buttonType = 'primary',
  onSuccess,
}: ExportWithCaliberProps) {
  const [visible, setVisible] = useState(false)
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)

  const handleTypeChange = (type: string) => {
    form.setFieldsValue({
      data_caliber: caliberTemplates[type] || caliberTemplates.contracts,
    })
  }

  const handleExport = async (values: any) => {
    setLoading(true)
    try {
      const blob = await exportApi.exportData({
        ...values,
        filter_conditions: filterConditions,
        include_caliber: true,
      })
      const fileName = `${values.export_name}_${dayjs().format('YYYYMMDDHHmmss')}.xlsx`
      saveAs(blob, fileName)
      message.success('导出成功')
      setVisible(false)
      onSuccess?.()
    } catch (error) {
      console.error('Export failed:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button
        type={buttonType}
        icon={<ExportOutlined />}
        onClick={() => setVisible(true)}
      >
        {buttonText}
      </Button>
      <Modal
        title="导出数据（含口径说明）"
        open={visible}
        onCancel={() => setVisible(false)}
        footer={null}
        width={600}
        destroyOnClose
      >
        <Alert
          message="口径说明"
          description="导出的Excel文件将包含专门的'数据口径'工作表，用于向团队说明数据统计范围和计算规则。"
          type="info"
          showIcon
          className="mb-4"
        />
        <Form
          form={form}
          layout="vertical"
          onFinish={handleExport}
          initialValues={{
            export_type: defaultType || 'contracts',
            export_name: defaultType ? `${exportTypeOptions.find(o => o.value === defaultType)?.label}导出` : '数据导出',
            data_caliber: caliberTemplates[defaultType || 'contracts'],
            include_caliber: true,
          }}
        >
          <Form.Item
            name="export_type"
            label="导出类型"
            rules={[{ required: true, message: '请选择导出类型' }]}
          >
            <Select options={exportTypeOptions} onChange={handleTypeChange} />
          </Form.Item>
          <Form.Item
            name="export_name"
            label="导出名称"
            rules={[{ required: true, message: '请输入导出名称' }]}
          >
            <Input placeholder="请输入导出文件名称" />
          </Form.Item>
          <Form.Item
            name="data_caliber"
            label="数据口径说明"
            rules={[{ required: true, message: '请填写数据口径说明' }]}
            tooltip="用于向团队解释数据统计范围和计算规则"
          >
            <Input.TextArea
              rows={6}
              placeholder="请填写数据口径说明，包含统计范围、计算规则、注意事项等"
            />
          </Form.Item>
          <Form.Item className="mb-0 flex justify-end gap-2">
            <Button onClick={() => setVisible(false)}>取消</Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              开始导出
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}
