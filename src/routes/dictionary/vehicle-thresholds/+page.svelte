<script lang="ts">
  import { Car, Plus, Edit2, Trash2, AlertCircle } from 'lucide-svelte';

  let thresholds = [
    { id: '1', plateNumber: '京A12345', brand: '大众', model: '帕萨特', mileageThreshold: 10000, daysThreshold: 180, currentMileage: 8500, lastService: '2024-01-15' },
    { id: '2', plateNumber: '沪B67890', brand: '丰田', model: '凯美瑞', mileageThreshold: 8000, daysThreshold: 180, currentMileage: 7800, lastService: '2024-02-01' },
    { id: '3', plateNumber: '粤C11111', brand: '本田', model: '雅阁', mileageThreshold: 10000, daysThreshold: 365, currentMileage: 12000, lastService: '2023-06-01' }
  ];

  function getMileageStatus(current: number, threshold: number): { class: string; text: string } {
    const ratio = current / threshold;
    if (ratio >= 1) return { class: 'text-accent-red bg-accent-red/20 border-accent-red/30', text: '已超期' };
    if (ratio >= 0.8) return { class: 'text-accent-orange bg-accent-orange/20 border-accent-orange/30', text: '即将到期' };
    return { class: 'text-accent-green bg-accent-green/20 border-accent-green/30', text: '正常' };
  }
</script>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <h2 class="font-display text-xl font-semibold text-industrial-text flex items-center gap-2">
      <Car class="w-6 h-6 text-primary-400" />
      车辆档案阈值
    </h2>
    <button class="btn btn-primary flex items-center gap-2">
      <Plus class="w-4 h-4" />
      配置阈值
    </button>
  </div>

  <div class="card overflow-hidden">
    <div class="overflow-x-auto">
      <table class="w-full">
        <thead class="bg-industrial-bg/50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-industrial-text-muted uppercase tracking-wider">车辆信息</th>
            <th class="px-6 py-3 text-center text-xs font-medium text-industrial-text-muted uppercase tracking-wider">里程阈值</th>
            <th class="px-6 py-3 text-center text-xs font-medium text-industrial-text-muted uppercase tracking-wider">当前里程</th>
            <th class="px-6 py-3 text-center text-xs font-medium text-industrial-text-muted uppercase tracking-wider">天数阈值</th>
            <th class="px-6 py-3 text-center text-xs font-medium text-industrial-text-muted uppercase tracking-wider">上次保养</th>
            <th class="px-6 py-3 text-center text-xs font-medium text-industrial-text-muted uppercase tracking-wider">状态</th>
            <th class="px-6 py-3 text-right text-xs font-medium text-industrial-text-muted uppercase tracking-wider">操作</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-industrial-border">
          {#each thresholds as item, index (item.id)}
            {@const status = getMileageStatus(item.currentMileage, item.mileageThreshold)}
            <tr class="hover:bg-industrial-bg/30 transition-colors animate-fade-in" style="animation-delay: {index * 50}ms">
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center">
                    <Car class="w-5 h-5 text-primary-400" />
                  </div>
                  <div>
                    <p class="font-mono font-medium text-industrial-text">{item.plateNumber}</p>
                    <p class="text-sm text-industrial-text-muted">{item.brand} {item.model}</p>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 text-center font-mono text-industrial-text">{item.mileageThreshold.toLocaleString()} km</td>
              <td class="px-6 py-4 text-center font-mono text-industrial-text">{item.currentMileage.toLocaleString()} km</td>
              <td class="px-6 py-4 text-center font-mono text-industrial-text">{item.daysThreshold} 天</td>
              <td class="px-6 py-4 text-center text-industrial-text">{item.lastService}</td>
              <td class="px-6 py-4 text-center">
                <span class="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-full border {status.class}">
                  {#if status.text === '已超期'}
                    <AlertCircle class="w-3 h-3" />
                  {/if}
                  {status.text}
                </span>
              </td>
              <td class="px-6 py-4 text-right">
                <button class="p-2 rounded-lg hover:bg-primary-500/20 text-industrial-text-muted hover:text-primary-400 transition-all inline-block">
                  <Edit2 class="w-4 h-4" />
                </button>
                <button class="p-2 rounded-lg hover:bg-accent-red/20 text-industrial-text-muted hover:text-accent-red transition-all inline-block ml-1">
                  <Trash2 class="w-4 h-4" />
                </button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>
</div>
