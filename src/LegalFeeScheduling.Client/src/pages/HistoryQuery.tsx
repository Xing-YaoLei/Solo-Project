import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Drawer, message, Checkbox, Space } from 'antd'
import QuoteList from '../components/quotes/QuoteList'
import QuoteDetailTabs from '../components/quotes/QuoteDetailTabs'
import { quoteApi } from '../api/quotes'
import { useQuoteStore } from '../store/useQuoteStore'
import { Quote, QuoteStatus, QuoteFilter } from '../types'

function HistoryQuery() {
  const navigate = useNavigate()
  const [list, setList] = useState<Quote[]>([])
  const [loading, setLoading] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [onlyClosed, setOnlyClosed] = useState(false)
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  })
  const [filter, setFilter] = useState<QuoteFilter>({
    page: 1,
    pageSize: 10,
  })
  const currentQuote = useQuoteStore((s) => s.currentQuote)
  const setCurrentQuote = useQuoteStore((s) => s.setCurrentQuote)
  const clearCurrentQuote = useQuoteStore((s) => s.clearCurrentQuote)

  const loadData = async () => {
    setLoading(true)
    try {
      const appliedFilter = { ...filter }
      if (onlyClosed) {
        appliedFilter.status = QuoteStatus.Closed
      }
      const result = await quoteApi.getQuotes(appliedFilter)
      setList(result.items)
      setPagination({
        current: result.page,
        pageSize: result.pageSize,
        total: result.totalCount,
      })
    } catch {
      message.error('加载历史数据失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [filter, onlyClosed])

  const handleView = async (quote: Quote) => {
    try {
      const detail = await quoteApi.getQuote(quote.id)
      setCurrentQuote(detail)
      setDrawerOpen(true)
    } catch {
      message.error('加载报价单详情失败')
    }
  }

  const handleFilterChange = (newFilter: QuoteFilter) => {
    setFilter({ ...newFilter, page: 1 })
  }

  const handlePaginationChange = (page: number, pageSize: number) => {
    setFilter((prev: QuoteFilter) => ({ ...prev, page, pageSize }))
  }

  const handleGotoDetail = () => {
    if (currentQuote) {
      setDrawerOpen(false)
      navigate(`/review-detail/${currentQuote.id}`)
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Space>
          <Checkbox checked={onlyClosed} onChange={(e) => setOnlyClosed(e.target.checked)}>
            仅显示已关闭/已完成记录
          </Checkbox>
        </Space>
      </div>
      <QuoteList
        data={list}
        loading={loading}
        onView={handleView}
        showCreateButton={false}
        onFilterChange={handleFilterChange}
        pagination={{
          ...pagination,
          onChange: handlePaginationChange,
        }}
      />
      <Drawer
        title={currentQuote ? `历史详情 - ${currentQuote.quoteNo}` : '历史详情'}
        width={960}
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false)
          clearCurrentQuote()
        }}
        destroyOnClose
        extra={
          currentQuote && (
            <a onClick={handleGotoDetail} style={{ cursor: 'pointer' }}>
              打开完整复盘详情 →
            </a>
          )
        }
      >
        {currentQuote && <QuoteDetailTabs quoteId={currentQuote.id} readOnly />}
      </Drawer>
    </div>
  )
}

export default HistoryQuery
