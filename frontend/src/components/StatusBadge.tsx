import { Tag } from 'antd'
import {
  GroupBatchStatusMap,
  ArrivalListStatusMap,
  PickupCodeStatusMap,
  AfterSaleVoucherStatusMap,
  ExceptionOrderStatusMap,
  StatusColorMap,
} from '../types'

interface StatusBadgeProps {
  status: string
  type?: 'group' | 'arrival' | 'pickup' | 'afterSale' | 'exception'
}

export default function StatusBadge({ status, type = 'group' }: StatusBadgeProps) {
  const statusMap = {
    group: GroupBatchStatusMap,
    arrival: ArrivalListStatusMap,
    pickup: PickupCodeStatusMap,
    afterSale: AfterSaleVoucherStatusMap,
    exception: ExceptionOrderStatusMap,
  }

  const color = (StatusColorMap[status] as any) || 'default'
  const text = statusMap[type]?.[status] || status

  return <Tag color={color}>{text}</Tag>
}
