import { useState, useEffect } from 'react'
import { Tabs, Drawer, message } from 'antd'
import type { TabsProps } from 'antd'
import QuoteList from '../components/quotes/QuoteList'
import QuoteDetailTabs from '../components/quotes/QuoteDetailTabs'
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

function QuoteReview() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [activeTab, setActiveTab] = useState(QuoteStatus.PendingReview)
  const selectedQuote = useQuoteStore((s) => s.currentQuote)
  const setSelectedQuote = useQuoteStore((s) => s.setCurrentQuote)
  const clearSelectedQuote = useQuoteStore((s) => s.clearCurrentQuote)

  const [tabsData, setTabsData] = useState<Record<string, TabData>>({
    [QuoteStatus.PendingReview]: {
      status: QuoteStatus.PendingReview,
      label: '待审核',
      list: [],
      loading: false,
      pagination: { current: 1, pageSize: 10, total: 0 },
      filter: {
        status: QuoteStatus.PendingReview,
        pageIndex: 1,
        pageSize: 10,
      },
    },
    [QuoteStatus.NeedMoreInfo]: {
      status: QuoteStatus.NeedMoreInfo,
      label: '补资料',
      list: [],
      loading: false,
      pagination: { current: 1, pageSize: 10, total: 0 },
      filter: {
        status: QuoteStatus.NeedMoreInfo,
        pageIndex: 1,
        pageSize: 10,
      },
    },
    [QuoteStatus.Escalated]: {
      status: QuoteStatus.Escalated,
      label: '升级复核',
      list: [],
      loading: false,
      pagination: { current: 1, pageSize: 10, total: 0 },
      filter: {
        status: QuoteStatus.Escalated,
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
      setSelectedQuote(detail)
      setDrawerOpen(true)
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

  const renderTabContent = (status: QuoteStatus) => {
    const data = tabsData[status]
    return (
      <QuoteList
        data={data.list}
        loading={data.loading}
        onView={handleSelectQuote}
        showCreateButton={false}
        hideStatusFilter
        onFilterChange={(filter) => handleFilterChange(status, filter)}
        pagination={{
          ...data.pagination,
          onChange: (page, pageSize) => handlePaginationChange(status, page, pageSize),
        }}
      />
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
          loadData(key as QuoteStatus)
        }}
        items={tabItems}
        type="card"
      />
      <Drawer
        title={selectedQuote ? `审核详情 - ${selectedQuote.quoteNo}` : '审核详情'}
        width={960}
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false)
          clearSelectedQuote()
          loadData(activeTab)
        }}
        destroyOnClose
      >
        {selectedQuote && <QuoteDetailTabs quoteId={selectedQuote.id} />}
      </Drawer>
    </div>
  )
}

export default QuoteReview
