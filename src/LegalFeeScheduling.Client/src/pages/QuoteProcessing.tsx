import { useState, useEffect } from 'react'
import { Tabs, Row, Col, message, Empty, Card } from 'antd'
import type { TabsProps } from 'antd'
import QuoteList from '../components/quotes/QuoteList'
import QuoteBasicInfo from '../components/quotes/QuoteBasicInfo'
import PaymentPanel from '../components/payments/PaymentPanel'
import ReconciliationPanel from '../components/reconciliation/ReconciliationPanel'
import AmountCheckPanel from '../components/validation/AmountCheckPanel'
import StatusTimeline from '../components/workflow/StatusTimeline'
import WorkflowActions from '../components/workflow/WorkflowActions'
import { quoteApi } from '../api/quotes'
import { useQuoteStore } from '../store/useQuoteStore'
import { Quote, QuoteStatus, QuoteListFilter } from '../types'

interface TabData {
  status: QuoteStatus
  label: string
  list: Quote[]
  loading: boolean
  pagination: { current: number; pageSize: number; total: number }
  filter: QuoteListFilter
}

function QuoteProcessing() {
  const [activeTab, setActiveTab] = useState(QuoteStatus.Processing)
  const currentQuote = useQuoteStore((s) => s.currentQuote)
  const setCurrentQuote = useQuoteStore((s) => s.setCurrentQuote)
  const clearCurrentQuote = useQuoteStore((s) => s.clearCurrentQuote)

  const [tabsData, setTabsData] = useState<Record<string, TabData>>({
    [QuoteStatus.Processing]: {
      status: QuoteStatus.Processing,
      label: '处理中',
      list: [],
      loading: false,
      pagination: { current: 1, pageSize: 10, total: 0 },
      filter: {
        status: QuoteStatus.Processing,
        pageIndex: 1,
        pageSize: 10,
      },
    },
    [QuoteStatus.AmountException]: {
      status: QuoteStatus.AmountException,
      label: '金额异常',
      list: [],
      loading: false,
      pagination: { current: 1, pageSize: 10, total: 0 },
      filter: {
        status: QuoteStatus.AmountException,
        pageIndex: 1,
        pageSize: 10,
      },
    },
    [QuoteStatus.Completed]: {
      status: QuoteStatus.Completed,
      label: '已完成',
      list: [],
      loading: false,
      pagination: { current: 1, pageSize: 10, total: 0 },
      filter: {
        status: QuoteStatus.Completed,
        pageIndex: 1,
        pageSize: 10,
      },
    },
  })

  const loadData = async (status: QuoteStatus) => {
    const tabData = tabsData[status]
    setTabsData((prev) => ({
      ...prev,
      [status]: { ...prev[status], loading: true },
    }))
    try {
      const result = await quoteApi.getList(tabData.filter)
      setTabsData((prev) => ({
        ...prev,
        [status]: {
          ...prev[status],
          list: result.items,
          loading: false,
          pagination: {
            current: result.pageIndex,
            pageSize: result.pageSize,
            total: result.totalCount,
          },
        },
      }))
    } catch {
      message.error(`加载${tabData.label}列表失败`)
      setTabsData((prev) => ({
        ...prev,
        [status]: { ...prev[status], loading: false },
      }))
    }
  }

  useEffect(() => {
    loadData(activeTab)
  }, [tabsData[activeTab].filter])

  const handleSelectQuote = async (quote: Quote) => {
    try {
      const detail = await quoteApi.getById(quote.id)
      setCurrentQuote(detail)
    } catch {
      message.error('加载报价单详情失败')
    }
  }

  const handleFilterChange = (status: QuoteStatus, newFilter: QuoteListFilter) => {
    setTabsData((prev) => ({
      ...prev,
      [status]: {
        ...prev[status],
        filter: { ...newFilter, status, pageIndex: 1 },
      },
    }))
  }

  const handlePaginationChange = (
    status: QuoteStatus,
    page: number,
    pageSize: number
  ) => {
    setTabsData((prev) => ({
      ...prev,
      [status]: {
        ...prev[status],
        filter: { ...prev[status].filter, pageIndex: page, pageSize },
      },
    }))
  }

  const handleWorkflowSuccess = () => {
    loadData(activeTab)
  }

  const renderTabContent = (status: QuoteStatus) => {
    const data = tabsData[status]
    return (
      <div>
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={currentQuote ? 10 : 24}>
            <Card title="报价单列表" style={{ height: 'calc(100vh - 300px)', overflow: 'auto' }}>
              <QuoteList
                data={data.list}
                loading={data.loading}
                onView={handleSelectQuote}
                showCreateButton={false}
                hideStatusFilter
                onFilterChange={(filter) => handleFilterChange(status, filter)}
                pagination={{
                  ...data.pagination,
                  onChange: (page, pageSize) =>
                    handlePaginationChange(status, page, pageSize),
                }}
              />
            </Card>
          </Col>
          {currentQuote && (
            <Col span={14}>
              <div style={{ height: 'calc(100vh - 300px)', overflow: 'auto' }}>
                <Card>
                  <div style={{ marginBottom: 16 }}>
                    <WorkflowActions onSuccess={handleWorkflowSuccess} />
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <StatusTimeline quoteId={currentQuote.id} />
                  </div>
                  <QuoteBasicInfo mode="edit" />
                </Card>
              </div>
            </Col>
          )}
        </Row>
        {currentQuote && (
          <Row gutter={16}>
            <Col span={8}>
              <AmountCheckPanel quoteId={currentQuote.id} />
            </Col>
            <Col span={8}>
              <PaymentPanel quoteId={currentQuote.id} />
            </Col>
            <Col span={8}>
              <ReconciliationPanel quoteId={currentQuote.id} />
            </Col>
          </Row>
        )}
        {!currentQuote && (
          <Card>
            <Empty description="请从左侧选择报价单进行处理" />
          </Card>
        )}
      </div>
    )
  }

  const tabItems: TabsProps['items'] = Object.values(tabsData).map((tab) => ({
    key: tab.status,
    label: `${tab.label} (${tab.pagination.total})`,
    children: renderTabContent(tab.status),
  }))

  return (
    <div>
      <Tabs
        activeKey={activeTab}
        onChange={(key) => {
          setActiveTab(key as QuoteStatus)
          clearCurrentQuote()
          loadData(key as QuoteStatus)
        }}
        items={tabItems}
        type="card"
      />
    </div>
  )
}

export default QuoteProcessing
