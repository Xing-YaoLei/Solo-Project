import { Tabs } from 'antd'
import type { TabsProps } from 'antd'
import QuoteBasicInfo from './QuoteBasicInfo'
import QuoteItemsPanel from './QuoteItemsPanel'
import PaymentPanel from '../payments/PaymentPanel'
import ReconciliationPanel from '../reconciliation/ReconciliationPanel'
import AmountCheckPanel from '../validation/AmountCheckPanel'
import StatusTimeline from '../workflow/StatusTimeline'
import WorkflowActions from '../workflow/WorkflowActions'
import { useQuoteStore } from '../../store/useQuoteStore'

interface QuoteDetailTabsProps {
  quoteId: string
  readOnly?: boolean
  defaultTab?: string
}

function QuoteDetailTabs({ quoteId, readOnly = false, defaultTab = 'basic' }: QuoteDetailTabsProps) {
  const currentQuote = useQuoteStore((s) => s.currentQuote)

  const items: TabsProps['items'] = [
    {
      key: 'basic',
      label: '基本信息',
      children: <QuoteBasicInfo mode={readOnly ? 'view' : 'edit'} />,
    },
    {
      key: 'items',
      label: '报价明细',
      children: <QuoteItemsPanel mode={readOnly ? 'view' : 'edit'} />,
    },
    {
      key: 'payments',
      label: '支付流水',
      children: <PaymentPanel quoteId={quoteId} readOnly={readOnly} />,
    },
    {
      key: 'reconciliation',
      label: '对账记录',
      children: <ReconciliationPanel quoteId={quoteId} readOnly={readOnly} />,
    },
    {
      key: 'validation',
      label: '金额校验',
      children: <AmountCheckPanel quoteId={quoteId} readOnly={readOnly} />,
    },
    {
      key: 'workflow',
      label: '状态流转',
      children: (
        <div>
          {!readOnly && currentQuote && (
            <div style={{ marginBottom: 16 }}>
              <WorkflowActions />
            </div>
          )}
          <StatusTimeline quoteId={quoteId} />
        </div>
      ),
    },
  ]

  return <Tabs defaultActiveKey={defaultTab} items={items} />
}

export default QuoteDetailTabs
