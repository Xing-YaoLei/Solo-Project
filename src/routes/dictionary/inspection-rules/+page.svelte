<script lang="ts">
  import { Camera, Plus, Edit2, Trash2, Loader2 } from 'lucide-svelte';

  let rules = [
    { id: '1', name: '常规保养质检', workOrderType: '保养', requiredPhotos: 5, isActive: true },
    { id: '2', name: '刹车系统维修质检', workOrderType: '刹车', requiredPhotos: 8, isActive: true },
    { id: '3', name: '发动机维修质检', workOrderType: '发动机', requiredPhotos: 10, isActive: true }
  ];
  let loading = false;
</script>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <h2 class="font-display text-xl font-semibold text-industrial-text flex items-center gap-2">
      <Camera class="w-6 h-6 text-primary-400" />
      质检照片规则
    </h2>
    <button class="btn btn-primary flex items-center gap-2">
      <Plus class="w-4 h-4" />
      新增规则
    </button>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
    {#each rules as rule, index}
      <div class="card p-5 card-hover animate-stagger" style="animation-delay: {index * 80}ms">
        <div class="flex items-start justify-between mb-4">
          <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/30 to-purple-500/30 flex items-center justify-center">
            <Camera class="w-6 h-6 text-blue-400" />
          </div>
          <div class="flex items-center gap-1">
            <button class="p-2 rounded-lg hover:bg-primary-500/20 text-industrial-text-muted hover:text-primary-400 transition-all">
              <Edit2 class="w-4 h-4" />
            </button>
            <button class="p-2 rounded-lg hover:bg-accent-red/20 text-industrial-text-muted hover:text-accent-red transition-all">
              <Trash2 class="w-4 h-4" />
            </button>
          </div>
        </div>
        <h3 class="font-semibold text-industrial-text">{rule.name}</h3>
        <div class="mt-4 space-y-2 text-sm">
          <div class="flex justify-between">
            <span class="text-industrial-text-muted">工单类型</span>
            <span class="text-industrial-text">{rule.workOrderType}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-industrial-text-muted">照片数量</span>
            <span class="font-mono text-primary-400 font-semibold">{rule.requiredPhotos} 张</span>
          </div>
          <div class="flex justify-between">
            <span class="text-industrial-text-muted">状态</span>
            <span class={rule.isActive ? 'text-accent-green' : 'text-industrial-text-muted'}>
              {rule.isActive ? '启用' : '停用'}
            </span>
          </div>
        </div>
      </div>
    {/each}
  </div>

  <div class="card p-6 border-2 border-dashed border-industrial-border text-center">
    <p class="text-industrial-text-muted">更多质检规则配置功能开发中...</p>
  </div>
</div>
