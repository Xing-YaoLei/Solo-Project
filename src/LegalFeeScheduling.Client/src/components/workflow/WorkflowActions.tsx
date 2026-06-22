import { useState } from 'react'
import { Button, Space, Modal, Input, message, Popconfirm, Card } from 'antd'
import {
  CheckOutlined,
  CloseOutlined,
  PlayCircleOutlined,
  FileDoneOutlined,
  AuditOutlined,
  StopOutlined,
  InfoCircleOutlined,
  ArrowUpOutlined,
  CheckCircleOutlined,
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
    { label: '取消', action: 'cancel', icon: <StopOutlined />, danger: true },
  ],
  [QuoteStatus.PendingReview]: [
    { label: '审核通过', action: 'approve', icon: <CheckOutlined />, type: 'primary' },
    {
      label: '要求补资料',
      action: 'requestMoreInfo',
      icon: <InfoCircleOutlined />,
      requireReason: true,
    },
    {
      label: '升级复核',
      action: 'escalate',
      icon: <ArrowUpOutlined />,
      requireReason: true,
    },
    { label: '驳回', action: 'reject', icon: <CloseOutlined />, danger: true, requireReason: true },
  ],
  [QuoteStatus.NeedMoreInfo]: [
    { label: '重新提交审核', action: 'submit', icon: <AuditOutlined />, type: 'primary' },
    { label: '取消', action: 'cancel', icon: <StopOutlined />, danger: true },
  ],
  [QuoteStatus.Escalated]: [
    { label: '审核通过', action: 'approve', icon: <CheckOutlined />, type: 'primary' },
    {
      label: '要求补资料',
      action: 'requestMoreInfo',
      icon: <InfoCircleOutlined />,
      requireReason: true,
    },
    { label: '驳回', action: 'reject', icon: <CloseOutlined />, danger: true, requireReason: true },
  ],
  [QuoteStatus.Approved]: [
    { label: '开始处理', action: 'startProcessing', icon: <PlayCircleOutlined />, type: 'primary' },
    { label: '取消', action: 'cancel', icon: <StopOutlined />, danger: true },
  ],
  [QuoteStatus.Processing]: [
    { label: '标记对账完成', action: 'markReconciled', icon: <FileDoneOutlined />, type: 'primary' },
    {
      label: '解决异常',
      action: 'resolveException',
      icon: <WarningOutlined />,
      requireReason: true,
    },
  ],
  [QuoteStatus.AmountException]: [
    {
      label: '解决异常',
      action: 'resolveException',
      icon: <WarningOutlined />,
      type: 'primary',
      requireReason: true,
    },
    { label: '标记对账完成', action: 'markReconciled', icon: <FileDoneOutlined /> },
  ],
  [QuoteStatus.Reconciled]: [
    { label: '标记复盘完成', action: 'markReviewed', icon: <AuditOutlined />, type: 'primary' },
  ],
  [QuoteStatus.Reviewed]: [
    { label: '标记完成', action: 'markCompleted', icon: <CheckCircleOutlined />, type: 'primary' },
  ],
  [QuoteStatus.Completed]: [
    { label: '关闭归档', action: 'closeArchive', icon: <FolderOutlined />, type: 'primary' },
  ],
  [QuoteStatus.Rejected]: [
    { label: '重新提交', action: 'submit', icon: <AuditOutlined />, type: 'primary' },
    { label: '取消', action: 'cancel', icon: <StopOutlined />, danger: true },
  ],
  [QuoteStatus.Cancelled]: [],
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
      const request = { quoteId: currentQuote.id, remark: actionRemark }

      switch (action.action) {
        case 'submit':
          result = await workflowApi.submitForReview(request)
          break
        case 'approve':
          result = await workflowApi.approve(request)
          break
        case 'reject':
          result = await workflowApi.reject(request)
          break
        case 'requestMoreInfo':
          result = await workflowApi.requestMoreInfo(request)
          break
        case 'escalate':
          result = await workflowApi.escalate(request)
          break
        case 'startProcessing':
          result = await workflowApi.startProcessing(request)
          break
        case 'markReconciled':
          result = await workflowApi.markReconciled(request)
          break
        case 'markReviewed':
          result = await workflowApi.markReviewed(request)
          break
        case 'markCompleted':
          result = await workflowApi.markCompleted(request)
          break
        case 'closeArchive':
          result = await workflowApi.closeArchive(request)
          break
        case 'resolveException':
          result = await workflowApi.resolveException(request)
          break
        case 'cancel':
          result = await workflowApi.cancel(request)
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
