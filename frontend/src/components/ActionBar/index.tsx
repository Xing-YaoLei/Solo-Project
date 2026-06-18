import { Button, Space, Modal, message } from 'antd';
import {
  CheckCircleOutlined,
  WarningOutlined,
  FileTextOutlined,
  ArrowUpOutlined,
  SmileOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { useState } from 'react';
import type { AppointmentStatus } from '@/types';
import { STATUS_LABELS } from '@/types';

const { confirm } = Modal;

interface ActionBarProps {
  currentStatus: AppointmentStatus | null;
  onStatusChange?: (status: AppointmentStatus, remark?: string) => void;
  loading?: boolean;
}

interface ActionButton {
  status: AppointmentStatus;
  label: string;
  icon: React.ReactNode;
  type: 'primary' | 'default' | 'danger' | 'warning';
  confirmTitle?: string;
  confirmContent?: string;
  needRemark?: boolean;
}

const actionConfigs: Record<AppointmentStatus, ActionButton[]> = {
  Pending: [
    {
      status: 'InService',
      label: '确认进厂',
      icon: <CheckCircleOutlined />,
      type: 'primary',
      confirmTitle: '确认进厂',
      confirmContent: '确认将此预约单标记为已进厂维修？',
    },
    {
      status: 'Closed',
      label: '关闭单据',
      icon: <CloseCircleOutlined />,
      type: 'default',
      confirmTitle: '关闭单据',
      confirmContent: '确定要关闭此预约单吗？关闭后无法恢复。',
      needRemark: true,
    },
  ],
  InService: [
    {
      status: 'PartsShortage',
      label: '配件缺货登记',
      icon: <WarningOutlined />,
      type: 'warning',
      confirmTitle: '配件缺货',
      confirmContent: '标记为配件缺货状态？请及时登记缺货配件。',
    },
    {
      status: 'DataIncomplete',
      label: '资料补录',
      icon: <FileTextOutlined />,
      type: 'default',
      confirmTitle: '资料待补',
      confirmContent: '标记为资料待补状态？请通知客户补充资料。',
    },
    {
      status: 'ReviewRequired',
      label: '申请复核',
      icon: <ArrowUpOutlined />,
      type: 'primary',
      confirmTitle: '申请复核',
      confirmContent: '提交复核申请？请确保相关资料已准备齐全。',
      needRemark: true,
    },
    {
      status: 'Completed',
      label: '完成维修',
      icon: <SmileOutlined />,
      type: 'primary',
      confirmTitle: '完成维修',
      confirmContent: '确认维修已完成？请检查所有项目是否已完成。',
    },
  ],
  PartsShortage: [
    {
      status: 'InService',
      label: '配件到货，继续维修',
      icon: <CheckCircleOutlined />,
      type: 'primary',
      confirmTitle: '继续维修',
      confirmContent: '确认配件已到货，继续维修工作？',
    },
  ],
  DataIncomplete: [
    {
      status: 'InService',
      label: '资料已补充',
      icon: <CheckCircleOutlined />,
      type: 'primary',
      confirmTitle: '资料已补充',
      confirmContent: '确认资料已补充完整，继续维修？',
    },
  ],
  ReviewRequired: [
    {
      status: 'InService',
      label: '复核通过',
      icon: <CheckCircleOutlined />,
      type: 'primary',
      confirmTitle: '复核通过',
      confirmContent: '确认复核通过，继续后续工作？',
    },
    {
      status: 'Completed',
      label: '复核通过并完成',
      icon: <SmileOutlined />,
      type: 'primary',
      confirmTitle: '复核通过并完成',
      confirmContent: '确认复核通过并完成此单？',
    },
  ],
  Completed: [
    {
      status: 'Closed',
      label: '关闭单据',
      icon: <CloseCircleOutlined />,
      type: 'default',
      confirmTitle: '关闭单据',
      confirmContent: '确认关闭此单据？',
    },
    {
      status: 'InService',
      label: '返修',
      icon: <ExclamationCircleOutlined />,
      type: 'danger',
      confirmTitle: '返修',
      confirmContent: '确认此单需要返修？',
      needRemark: true,
    },
  ],
  Closed: [
    {
      status: 'Pending',
      label: '重新开启',
      icon: <ArrowUpOutlined />,
      type: 'default',
      confirmTitle: '重新开启',
      confirmContent: '确定要重新开启此单据吗？',
    },
  ],
};

export default function ActionBar({ currentStatus, onStatusChange, loading }: ActionBarProps) {
  const [remarkInput, setRemarkInput] = useState('');

  const handleClick = (action: ActionButton) => {
    if (!onStatusChange) return;

    if (action.confirmTitle || action.confirmContent) {
      confirm({
        title: action.confirmTitle || '确认操作',
        content: action.needRemark ? (
          <div>
            <p>{action.confirmContent}</p>
            <div style={{ marginTop: 16 }}>
              <label style={{ display: 'block', marginBottom: 8 }}>备注说明：</label>
              <textarea
                style={{
                  width: '100%',
                  height: 80,
                  padding: 8,
                  border: '1px solid #d9d9d9',
                  borderRadius: 4,
                  resize: 'none',
                }}
                placeholder="请输入备注说明..."
                value={remarkInput}
                onChange={(e) => setRemarkInput(e.target.value)}
              />
            </div>
          </div>
        ) : action.confirmContent,
        okText: '确认',
        cancelText: '取消',
        okButtonProps: { danger: action.type === 'danger' },
        onOk: () => {
          onStatusChange(action.status, action.needRemark ? remarkInput : undefined);
          setRemarkInput('');
        },
      });
    } else {
      onStatusChange(action.status);
    }
  };

  if (!currentStatus) {
    return null;
  }

  const actions = actionConfigs[currentStatus] || [];

  return (
    <div 
      style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        padding: '12px 16px',
        background: 'white',
        borderRadius: 8,
        border: '1px solid #f0f0f0',
        marginBottom: 12,
      }}
    >
      <div>
        <span style={{ color: '#666', fontSize: 14 }}>当前状态：</span>
        <span style={{ 
          fontWeight: 'bold', 
          fontSize: 16,
          color: '#1677ff',
        }}>
          {STATUS_LABELS[currentStatus]}
        </span>
      </div>
      <Space size="middle">
        {actions.map((action) => (
          <Button
            key={action.status}
            type={action.type as any}
            icon={action.icon}
            onClick={() => handleClick(action)}
            loading={loading}
            size="middle"
          >
            {action.label}
          </Button>
        ))}
      </Space>
    </div>
  );
}
