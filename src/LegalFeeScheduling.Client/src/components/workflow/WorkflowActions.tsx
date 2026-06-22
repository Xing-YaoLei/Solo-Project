import { useState } from 'react'
import { Button, Space, Modal, Input, message, Popconfirm, Card } from 'antd'
import {
  CheckOutlined,
  PlayCircleOutlined,
  FileDoneOutlined,
  AuditOutlined,
  InfoCircleOutlined,
  ArrowUpOutlined,
  FolderOutlined,
  WarningOutlined,
} from '@ant-design/icons'
import { useQuoteStore } from '../../store/useQuoteStore'
import { workflowApi } from '../../api/workflow'
import { QuoteStatus } from '../../types'

interface WorkflowAction {
  label: string
  action: string
  icon: any
  type?: 'primary' | 'default' | 'dashed'
  danger?: boolean
  requireReason?: boolean
}

const actionConfig: Record<QuoteStatus, WorkflowAction[]> = {
  [QuoteStatus.Draft]: [
    { label: '提交审核', action: 'submit', icon: <AuditOutlined />, type: 'primary' },
  ],
  [QuoteStatus.PendingReview]: [
    { label: '审核通过', action: 'approve', icon: <CheckOutlined />, type: 'primary' },
    {
      label: '要求补资料',
      action: 'needMoreInfo',
      icon: <InfoCircleOutlined />,
      requireReason: true,
    },
    {
      label: '升级复核',
      action: 'escalate',
      icon: <ArrowUpOutlined />,
      requireReason: true,
    },
  ],
  [QuoteStatus.NeedMoreInfo]: [
    { label: '重新提交审核', action: 'submit', icon: <AuditOutlined />, type: 'primary' },
  ],
  [QuoteStatus.Escalated]: [
    { label: '审核通过', action: 'approve', icon: <CheckOutlined />, type: 'primary' },
    {
      label: '要求补资料',
      action: 'needMoreInfo',
      icon: <InfoCircleOutlined />,
      requireReason: true,
    },
  ],
  [QuoteStatus.Approved]: [
    { label: '开始处理', action: 'startProcessing', icon: <PlayCircleOutlined />, type: 'primary' },
  ],
  [QuoteStatus.Processing]: [
    { label: '完成处理', action: 'complete', icon: <FileDoneOutlined />, type: 'primary' },
    {
      label: '处理异常',
      action: 'handleException',
      icon: <WarningOutlined />,
      requireReason: true,
    },
  ],
  [QuoteStatus.AmountException]: [
    {
      label: '处理异常',
      action: 'handleException',
      icon: <WarningOutlined />,
      type: 'primary',
      requireReason: true,
    },
    { label: '完成处理', action: 'complete', icon: <FileDoneOutlined /> },
  ],
  [QuoteStatus.Completed]: [
    { label: '关闭归档', action: 'close', icon: <FolderOutlined />, type: 'primary' },
  ],
  [QuoteStatus.Closed]: [],
}

interface WorkflowActionsProps {
  onSuccess?: () => void
}

function WorkflowActions({ onSuccess }: WorkflowActionsProps) {
  const currentQuote = useQuoteStore((s) => s.currentQuote)
  const setCurrentQuote = useQuoteStore((s) => s.setCurrentQuote)
  const [modalOpen, setModalOpen] = useState(false)
  const [currentAction, setCurrentAction] = useState<WorkflowAction | null>(null)
  const [remark, setRemark] = useState('')
  const [executing, setExecuting] = useState(false)

  if (!currentQuote) {
    return null
  }

  const actions = actionConfig[currentQuote.status as QuoteStatus] || []

  if (actions.length === 0) {
    return (
      <Card title="工作流操作">
        <div style={{ color: '#999', textAlign: 'center', padding: '16px 0' }}>
          当前状态无可用操作
        </div>
      </Card>
    )
  }

  const openActionModal = (action: WorkflowAction) => {
    if (action.requireReason || action.danger) {
      setCurrentAction(action)
      setModalOpen(true)
      setRemark('')
    } else {
      handleExecute(action, '')
    }
  }

  const handleExecute = async (action: WorkflowAction, actionRemark: string) => {
    if (!currentQuote) return

    setExecuting(true)
    try {
      let result
      const quoteId = currentQuote.id

      switch (action.action) {
        case 'submit':
          result = await workflowApi.submitForReview(quoteId)
          break
        case 'approve':
          result = await workflowApi.approve(quoteId)
          break
        case 'needMoreInfo':
          result = await workflowApi.needMoreInfo(quoteId, actionRemark)
          break
        case 'escalate':
          result = await workflowApi.escalate(quoteId, actionRemark)
          break
        case 'startProcessing':
          result = await workflowApi.startProcessing(quoteId)
          break
        case 'complete':
          result = await workflowApi.complete(quoteId)
          break
        case 'close':
          result = await workflowApi.close(quoteId)
          break
        case 'handleException':
          result = await workflowApi.handleException(quoteId, actionRemark)
          break
        default:
          return
      }

      message.success(`${action.label}成功`)
      setCurrentQuote(result)
      setModalOpen(false)
      setCurrentAction(null)
      setRemark('')
      onSuccess?.()
    } catch {
      message.error(`${action.label}失败`)
    } finally {
      setExecuting(false)
    }
  }

  const handleModalOk = async () => {
    if (!currentAction) return
    if (currentAction.requireReason && !remark.trim()) {
      message.warning('请输入原因')
      return
    }
    await handleExecute(currentAction, remark)
  }

  return (
    <Card title="工作流操作">
      <Space wrap>
        {actions.map((action) =>
          action.danger ? (
            <Popconfirm
              key={action.action}
              title={`确定执行「${action.label}」操作？`}
              description={action.requireReason ? '请在弹窗中填写原因' : undefined}
              onConfirm={() => openActionModal(action)}
              okText="确认"
              cancelText="取消"
            >
              <Button danger icon={action.icon} loading={executing}>
                {action.label}
              </Button>
            </Popconfirm>
          ) : (
            <Button
              key={action.action}
              type={action.type || 'default'}
              icon={action.icon}
              onClick={() => openActionModal(action)}
              loading={executing}
            >
              {action.label}
            </Button>
          )
        )}
      </Space>
      <Modal
        title={currentAction?.label || '操作确认'}
        open={modalOpen}
        onOk={handleModalOk}
        onCancel={() => {
          setModalOpen(false)
          setCurrentAction(null)
          setRemark('')
        }}
        confirmLoading={executing}
        okText="确认执行"
        cancelText="取消"
      >
        {currentQuote && (
          <p style={{ marginBottom: 16 }}>
            对报价单「<strong>{currentQuote.quoteNo}</strong>」执行「
            <strong>{currentAction?.label}</strong>」操作
          </p>
        )}
        <Input.TextArea
          rows={4}
          value={remark}
          onChange={(e) => setRemark(e.target.value)}
          placeholder={
            currentAction?.requireReason
              ? '请输入操作原因（必填）'
              : '请输入操作备注（可选）'
          }
        />
      </Modal>
    </Card>
  )
}

export default WorkflowActions
