import { Table, Tag, Switch } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { ReminderRule } from '../../types';

interface ReminderRulesChartProps {
  rules: ReminderRule[];
  onToggle?: (id: number, active: boolean) => void;
}

const typeColors: Record<string, string> = {
  distribute: 'blue',
  receive: 'green',
  homework: 'orange',
};

const typeNames: Record<string, string> = {
  distribute: '发放提醒',
  receive: '签收提醒',
  homework: '作业提醒',
};

const channelNames: Record<string, string> = {
  sms: '短信',
  email: '邮件',
  app: 'APP推送',
};

const ReminderRulesChart = ({ rules, onToggle }: ReminderRulesChartProps) => {
  const columns: ColumnsType<ReminderRule> = [
    {
      title: '规则名称',
      dataIndex: 'name',
      key: 'name',
      width: 160,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: string) => (
        <Tag color={typeColors[type] || 'default'}>{typeNames[type] || type}</Tag>
      ),
    },
    {
      title: '触发天数',
      dataIndex: 'trigger_days',
      key: 'trigger_days',
      width: 100,
      render: (days: number) => `${days}天前触发`,
    },
    {
      title: '提醒渠道',
      dataIndex: 'channel',
      key: 'channel',
      width: 100,
      render: (channel: string) => channelNames[channel] || channel,
    },
    {
      title: '模板内容',
      dataIndex: 'template',
      key: 'template',
      ellipsis: true,
    },
    {
      title: '状态',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 80,
      render: (active: boolean, record) => (
        <Switch
          size="small"
          checked={active}
          onChange={(checked) => onToggle?.(record.id, checked)}
        />
      ),
    },
  ];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Table
      columns={columns}
      dataSource={rules}
      rowKey="id"
      size="small"
      pagination={false}
      scroll={{ y: 'calc(100% - 50px)' }}
    />
    </div>
  );
};

export default ReminderRulesChart;
