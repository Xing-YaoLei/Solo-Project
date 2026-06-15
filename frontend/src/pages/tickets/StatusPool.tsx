import TicketList from './TicketList';

type PoolType = 'supplement' | 'escalated' | 'completed';

interface PoolConfig {
  filterStatus: Array<'supplement_needed' | 'escalated_review' | 'completed'>;
  title: string;
  tip: string;
}

const POOL_CONFIGS: Record<PoolType, PoolConfig> = {
  supplement: {
    filterStatus: ['supplement_needed'],
    title: '补资料待处理池',
    tip: '以下单据等待补充资料，请及时处理',
  },
  escalated: {
    filterStatus: ['escalated_review'],
    title: '升级复核池',
    tip: '以下单据已升级，需要高级复核',
  },
  completed: {
    filterStatus: ['completed'],
    title: '已完成单据池',
    tip: '以下单据已处理完成，可关闭或查证',
  },
};

interface StatusPoolProps {
  poolType: PoolType;
}

export default function StatusPool({ poolType }: StatusPoolProps) {
  const config = POOL_CONFIGS[poolType] || POOL_CONFIGS.supplement;

  return (
    <TicketList
      initialStatus={config.filterStatus}
      poolTitle={config.title}
      poolTip={config.tip}
    />
  );
}
