import { Form, Input, Select, DatePicker, InputNumber, Card, Row, Col, Tag } from 'antd'
import dayjs from 'dayjs'
import { useQuoteStore } from '../../store/useQuoteStore'
import { Channel, QuoteStatus } from '../../types'
import { statusLabels, statusColors } from './QuoteList'

interface QuoteBasicInfoProps {
  mode?: 'edit' | 'view'
}

const channelOptions = [
  { value: Channel.Online, label: '线上' },
  { value: Channel.Offline, label: '线下' },
  { value: Channel.Partner, label: '合作伙伴' },
  { value: Channel.Referral, label: '转介绍' },
]

function QuoteBasicInfo({ mode = 'edit' }: QuoteBasicInfoProps) {
  const currentQuote = useQuoteStore((s) => s.currentQuote)
  const updateQuoteBasic = useQuoteStore((s) => s.updateQuoteBasic)
  const isEditable = mode === 'edit'

  if (!currentQuote) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
          请先选择报价单
        </div>
      </Card>
    )
  }

  const itemsTotal = currentQuote.items.reduce(
    (sum, item) => sum + (item.subtotal || 0),
    0
  )

  return (
    <Card title="基本信息">
      <Form
        layout="vertical"
        initialValues={{
          ...currentQuote,
          createdAt: dayjs(currentQuote.createdAt),
          expectedPaymentDate: currentQuote.expectedPaymentDate
            ? dayjs(currentQuote.expectedPaymentDate)
            : undefined,
        }}
        onValuesChange={(_, allValues) => {
          if (!isEditable) return
          updateQuoteBasic({
            clientName: allValues.clientName,
            caseName: allValues.caseName,
            channel: allValues.channel,
            discountAmount: allValues.discountAmount,
            finalAmount: allValues.finalAmount,
            expectedPaymentDate: allValues.expectedPaymentDate
              ? dayjs(allValues.expectedPaymentDate).format('YYYY-MM-DD')
              : undefined,
            owner: allValues.owner,
            remarks: allValues.remarks,
          })
        }}
      >
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item label="报价单号">
              <Input value={currentQuote.quoteNo} disabled />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="状态">
              <Tag color={statusColors[currentQuote.status as QuoteStatus] as any}>
                {statusLabels[currentQuote.status as QuoteStatus] as any}
              </Tag>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="创建时间">
              <Input
                value={dayjs(currentQuote.createdAt).format('YYYY-MM-DD HH:mm')}
                disabled
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="客户名称"
              name="clientName"
              rules={[{ required: true, message: '请输入客户名称' }]}
            >
              <Input placeholder="请输入客户名称" disabled={!isEditable} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="案件名称"
              name="caseName"
              rules={[{ required: true, message: '请输入案件名称' }]}
            >
              <Input placeholder="请输入案件名称" disabled={!isEditable} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label="渠道"
              name="channel"
              rules={[{ required: true, message: '请选择渠道' }]}
            >
              <Select
                options={channelOptions}
                placeholder="请选择渠道"
                disabled={!isEditable}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="责任人" name="owner">
              <Input placeholder="请输入责任人" disabled={!isEditable} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="预计回款日期" name="expectedPaymentDate">
              <DatePicker style={{ width: '100%' }} disabled={!isEditable} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item label="报价单金额">
              <InputNumber<number>
                style={{ width: '100%' }}
                value={currentQuote.amount}
                formatter={(value) => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={(value) => Number(value?.replace(/[^\d.]/g, '')) || 0}
                disabled
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="折扣金额" name="discountAmount">
              <InputNumber<number>
                style={{ width: '100%' }}
                min={0}
                placeholder="请输入折扣金额"
                formatter={(value) => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={(value) => Number(value?.replace(/[^\d.]/g, '')) || 0}
                disabled={!isEditable}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="最终金额" name="finalAmount">
              <InputNumber<number>
                style={{ width: '100%' }}
                min={0}
                placeholder="请输入最终金额"
                formatter={(value) => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={(value) => Number(value?.replace(/[^\d.]/g, '')) || 0}
                disabled={!isEditable}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item label="明细合计">
              <Input
                value={`¥ ${itemsTotal.toLocaleString()}`}
                disabled
                style={{
                  color:
                    Math.abs(itemsTotal - (currentQuote.amount || 0)) > 0.01
                      ? '#cf1322'
                      : '#3f8600',
                }}
              />
            </Form.Item>
          </Col>
          <Col span={16}>
            <Form.Item label="创建人">
              <Input value={currentQuote.createdBy || '-'} disabled />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item label="备注" name="remarks">
          <Input.TextArea
            rows={3}
            placeholder="请输入备注"
            disabled={!isEditable}
          />
        </Form.Item>
      </Form>
    </Card>
  )
}

export default QuoteBasicInfo
