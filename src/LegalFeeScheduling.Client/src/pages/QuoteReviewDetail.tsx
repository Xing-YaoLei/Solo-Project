import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Spin, message, Result, Button, Row, Col, Tag, Card } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import QuoteDetailTabs from '../components/quotes/QuoteDetailTabs'
import { quoteApi } from '../api/quotes'
import { useQuoteStore } from '../store/useQuoteStore'
import { QuoteStatus } from '../types'
import { statusLabels, statusColors } from '../components/quotes/QuoteList'

const closedStatuses = [QuoteStatus.Completed, QuoteStatus.Closed]

function QuoteReviewDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const currentQuote = useQuoteStore((s) => s.currentQuote)
  const setCurrentQuote = useQuoteStore((s) => s.setCurrentQuote)
  const clearCurrentQuote = useQuoteStore((s) => s.clearCurrentQuote)

  useEffect(() => {
    const loadData = async () => {
      if (!id) {
        setNotFound(true)
        setLoading(false)
        return
      }
      setLoading(true)
      try {
        const detail = await quoteApi.getQuote(id)
        setCurrentQuote(detail)
      } catch {
        message.error('加载报价单详情失败')
        setNotFound(true)
      } finally {
        setLoading(false)
      }
    }
    loadData()

    return () => {
      clearCurrentQuote()
    }
  }, [id])

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 100 }}>
        <Spin size="large" />
      </div>
    )
  }

  if (notFound || !id) {
    return (
      <Result
        status="404"
        title="报价单不存在"
        subTitle="请检查报价单ID是否正确"
        extra={
          <Button type="primary" onClick={() => navigate(-1)}>
            <ArrowLeftOutlined /> 返回
          </Button>
        }
      />
    )
  }

  const isClosed = currentQuote && closedStatuses.includes(currentQuote.status as QuoteStatus)

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col flex="auto">
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
              返回
            </Button>
          </Col>
          {currentQuote && (
            <Col>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 16, fontWeight: 600 }}>
                  报价单号：{currentQuote.quoteNo}
                </span>
                <Tag
                  color={statusColors[currentQuote.status as QuoteStatus] as any}
                  style={{ fontSize: 14, padding: '4px 12px' }}
                >
                  {isClosed && <span style={{ marginRight: 4 }}>📋</span>}
                  {statusLabels[currentQuote.status as QuoteStatus] as any}
                </Tag>
                {isClosed && (
                  <Tag color="default" style={{ fontSize: 12 }}>
                    只读模式
                  </Tag>
                )}
              </div>
            </Col>
          )}
        </Row>
      </Card>
      {id && <QuoteDetailTabs quoteId={id} readOnly={!!isClosed} />}
    </div>
  )
}

export default QuoteReviewDetail
