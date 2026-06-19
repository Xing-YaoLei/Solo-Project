<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { trpc } from '$lib/trpc/client';
  import {
    TrendingDown,
    TrendingUp,
    BarChart3,
    MapPin,
    User,
    AlertCircle,
    Calendar,
    Filter,
    Loader2,
    ArrowDownRight,
    ArrowUpRight
  } from 'lucide-svelte';
  import { Chart, registerables } from 'chart.js';

  Chart.register(...registerables);

  let loading = true;
  let analysisData: any = null;
  let regions: string[] = [];
  let users: any[] = [];
  let dateFrom = '';
  let dateTo = '';
  let selectedRegions: string[] = [];
  let selectedAssignees: string[] = [];
  let trendChart: Chart | null = null;
  let causeChart: Chart | null = null;
  let regionChart: Chart | null = null;
  let trendCanvas: HTMLCanvasElement | null = null;
  let causeCanvas: HTMLCanvasElement | null = null;
  let regionCanvas: HTMLCanvasElement | null = null;

  async function loadData() {
    loading = true;
    try {
      const input: any = {};
      if (dateFrom) input.dateFrom = new Date(dateFrom);
      if (dateTo) input.dateTo = new Date(dateTo + 'T23:59:59');
      if (selectedRegions.length > 0) input.regions = selectedRegions;
      if (selectedAssignees.length > 0) input.assignees = selectedAssignees;

      [analysisData, regions, users] = await Promise.all([
        trpc.analysis.getReworkAnalysis.query(input),
        trpc.analysis.getRegions.query(),
        trpc.analysis.getUsers.query()
      ]);

      updateCharts();
    } finally {
      loading = false;
    }
  }

  function updateCharts() {
    if (!analysisData) return;

    if (trendChart) trendChart.destroy();
    if (causeChart) causeChart.destroy();
    if (regionChart) regionChart.destroy();

    if (trendCanvas && analysisData.trend) {
      trendChart = new Chart(trendCanvas, {
        type: 'line',
        data: {
          labels: analysisData.trend.map((d: any) => d.date),
          datasets: [{
            label: '返修率 (%)',
            data: analysisData.trend.map((d: any) => d.reworkRate),
            borderColor: '#F53F3F',
            backgroundColor: 'rgba(245, 63, 63, 0.1)',
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#F53F3F',
            pointBorderColor: '#1D1D1F',
            pointBorderWidth: 2,
            pointRadius: 4
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { display: false }
          },
          scales: {
            x: {
              grid: { color: 'rgba(255,255,255,0.05)' },
              ticks: { color: '#A1A1AA', maxRotation: 45 }
            },
            y: {
              grid: { color: 'rgba(255,255,255,0.05)' },
              ticks: { color: '#A1A1AA', callback: (v) => v + '%' },
              min: 0
            }
          }
        }
      });
    }

    if (causeCanvas && analysisData.byCause) {
      causeChart = new Chart(causeCanvas, {
        type: 'bar',
        data: {
          labels: analysisData.byCause.map((c: any) => c.cause),
          datasets: [{
            label: '数量',
            data: analysisData.byCause.map((c: any) => c.count),
            backgroundColor: [
              'rgba(245, 63, 63, 0.7)',
              'rgba(255, 125, 0, 0.7)',
              'rgba(255, 170, 0, 0.7)',
              'rgba(0, 180, 42, 0.7)',
              'rgba(22, 93, 255, 0.7)'
            ],
            borderRadius: 4
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { display: false }
          },
          indexAxis: 'y',
          scales: {
            x: {
              grid: { color: 'rgba(255,255,255,0.05)' },
              ticks: { color: '#A1A1AA' }
            },
            y: {
              grid: { display: false },
              ticks: { color: '#A1A1AA' }
            }
          }
        }
      });
    }

    if (regionCanvas && analysisData.byRegion) {
      regionChart = new Chart(regionCanvas, {
        type: 'doughnut',
        data: {
          labels: analysisData.byRegion.map((r: any) => r.region),
          datasets: [{
            data: analysisData.byRegion.map((r: any) => r.reworkRate),
            backgroundColor: [
              'rgba(245, 63, 63, 0.8)',
              'rgba(255, 125, 0, 0.8)',
              'rgba(255, 170, 0, 0.8)',
              'rgba(0, 180, 42, 0.8)',
              'rgba(22, 93, 255, 0.8)'
            ],
            borderColor: '#2C2C2E',
            borderWidth: 3
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              position: 'right',
              labels: { color: '#A1A1AA', padding: 15 }
            }
          },
          cutout: '60%'
        }
      });
    }
  }

  function toggleRegion(region: string) {
    const idx = selectedRegions.indexOf(region);
    if (idx > -1) {
      selectedRegions.splice(idx, 1);
    } else {
      selectedRegions.push(region);
    }
    selectedRegions = [...selectedRegions];
  }

  function toggleAssignee(userId: string) {
    const idx = selectedAssignees.indexOf(userId);
    if (idx > -1) {
      selectedAssignees.splice(idx, 1);
    } else {
      selectedAssignees.push(userId);
    }
    selectedAssignees = [...selectedAssignees];
  }

  function clearFilters() {
    dateFrom = '';
    dateTo = '';
    selectedRegions = [];
    selectedAssignees = [];
    loadData();
  }

  function getTrendIndicator(current: number): { icon: any; class: string; text: string } {
    if (current > 5) {
      return { icon: ArrowUpRight, class: 'text-accent-red', text: '偏高' };
    } else if (current > 3) {
      return { icon: TrendingUp, class: 'text-accent-orange', text: '关注' };
    }
    return { icon: ArrowDownRight, class: 'text-accent-green', text: '良好' };
  }

  onMount(() => {
    loadData();
  });

  onDestroy(() => {
    if (trendChart) trendChart.destroy();
    if (causeChart) causeChart.destroy();
    if (regionChart) regionChart.destroy();
  });
</script>

<div class="space-y-6">
  <div class="flex flex-wrap items-center justify-between gap-4">
    <div class="flex items-center gap-4">
      <div class="flex items-center gap-2">
        <Calendar class="w-4 h-4 text-industrial-text-muted" />
        <input type="date" bind:value={dateFrom} class="input w-40 h-9 py-1 text-sm" />
        <span class="text-industrial-text-muted">至</span>
        <input type="date" bind:value={dateTo} class="input w-40 h-9 py-1 text-sm" />
      </div>
      <select
        bind:value={selectedRegions}
        class="input w-40 h-9 py-1 text-sm"
        multiple
      >
        <option value="">全部区域</option>
        {#each regions as region}
          <option value={region}>{region}</option>
        {/each}
      </select>
      <button on:click={loadData} disabled={loading} class="btn btn-primary text-sm py-1.5">
        {#if loading}
          <Loader2 class="w-4 h-4 animate-spin inline mr-1" />
        {/if}
        查询
      </button>
      <button on:click={clearFilters} class="btn btn-secondary text-sm py-1.5">重置</button>
    </div>
  </div>

  {#if loading}
    <div class="flex items-center justify-center py-20">
      <Loader2 class="w-10 h-10 text-primary-500 animate-spin" />
    </div>
  {:else if !analysisData}
    <div class="card p-12 text-center">
      <AlertCircle class="w-16 h-16 text-industrial-text-muted mx-auto mb-4 opacity-50" />
      <p class="text-industrial-text-muted">暂无分析数据</p>
    </div>
  {:else}
    <div class="grid grid-cols-1 md:grid-cols-4 gap-5">
      <div class="card p-6 animate-stagger">
        <div class="flex items-center justify-between mb-4">
          <span class="text-sm text-industrial-text-muted">统计周期</span>
          <Calendar class="w-5 h-5 text-primary-400" />
        </div>
        <p class="font-display text-2xl font-bold text-industrial-text">{analysisData.period}</p>
        <p class="text-sm text-industrial-text-muted mt-1">返修分析周期</p>
      </div>

      <div class="card p-6 animate-stagger" style="animation-delay: 50ms">
        <div class="flex items-center justify-between mb-4">
          <span class="text-sm text-industrial-text-muted">总工单量</span>
          <BarChart3 class="w-5 h-5 text-blue-400" />
        </div>
        <p class="font-display text-2xl font-bold text-industrial-text">{analysisData.totalWorkOrders}</p>
        <p class="text-sm text-industrial-text-muted mt-1">统计周期内工单</p>
      </div>

      <div class="card p-6 animate-stagger" style="animation-delay: 100ms">
        <div class="flex items-center justify-between mb-4">
          <span class="text-sm text-industrial-text-muted">返修数量</span>
          <AlertCircle class="w-5 h-5 text-accent-orange" />
        </div>
        <p class="font-display text-2xl font-bold text-accent-orange">{analysisData.reworkCount}</p>
        <p class="text-sm text-industrial-text-muted mt-1">需要返修的工单</p>
      </div>

      <div class="card p-6 animate-stagger border-2 {analysisData.reworkRate > 5 ? 'border-accent-red' : 'border-primary-500/50'}" style="animation-delay: 150ms">
        <div class="flex items-center justify-between mb-4">
          <span class="text-sm text-industrial-text-muted">返修率</span>
          {#if true}
            {@const trend = getTrendIndicator(analysisData.reworkRate)}
            <svelte:component this={trend.icon} class="w-5 h-5 {trend.class}" />
          {/if}
        </div>
        <p class="font-display text-3xl font-bold {analysisData.reworkRate > 5 ? 'text-accent-red' : analysisData.reworkRate > 3 ? 'text-accent-orange' : 'text-accent-green'}">
          {analysisData.reworkRate}%
        </p>
        {#if true}
          {@const trendText = getTrendIndicator(analysisData.reworkRate)}
          <p class="text-sm {trendText.class} mt-1">{trendText.text}</p>
        {/if}
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 card p-6 animate-stagger" style="animation-delay: 200ms">
        <h3 class="font-display text-lg font-semibold text-industrial-text mb-4 flex items-center gap-2">
          <TrendingDown class="w-5 h-5 text-primary-400" />
          返修率趋势
        </h3>
        <div class="h-72">
          <canvas bind:this={trendCanvas}></canvas>
        </div>
      </div>

      <div class="card p-6 animate-stagger" style="animation-delay: 250ms">
        <h3 class="font-display text-lg font-semibold text-industrial-text mb-4 flex items-center gap-2">
          <MapPin class="w-5 h-5 text-primary-400" />
          区域分布
        </h3>
        <div class="h-72 flex items-center justify-center">
          <canvas bind:this={regionCanvas}></canvas>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="card p-6 animate-stagger" style="animation-delay: 300ms">
        <h3 class="font-display text-lg font-semibold text-industrial-text mb-4 flex items-center gap-2">
          <AlertCircle class="w-5 h-5 text-primary-400" />
          返修原因分析
        </h3>
        <div class="h-72">
          <canvas bind:this={causeCanvas}></canvas>
        </div>
      </div>

      <div class="card p-6 animate-stagger" style="animation-delay: 350ms">
        <h3 class="font-display text-lg font-semibold text-industrial-text mb-4 flex items-center gap-2">
          <User class="w-5 h-5 text-primary-400" />
          技师返修率排行
        </h3>
        <div class="space-y-3 max-h-72 overflow-y-auto scrollbar-thin">
          {#each analysisData.byTechnician as tech, index}
            <div class="flex items-center gap-4 p-3 rounded-lg bg-industrial-bg border border-industrial-border animate-fade-in" style="animation-delay: {index * 50}ms">
              <div class="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm {
                index === 0 ? 'bg-accent-orange/20 text-accent-orange' :
                index === 1 ? 'bg-gray-400/20 text-gray-400' :
                index === 2 ? 'bg-yellow-600/20 text-yellow-500' :
                'bg-industrial-card text-industrial-text-muted'
              }">
                {index + 1}
              </div>
              <div class="flex-1">
                <div class="flex items-center justify-between mb-1">
                  <span class="font-medium text-industrial-text">{tech.technician}</span>
                  <span class="font-mono {tech.reworkRate > 5 ? 'text-accent-red' : tech.reworkRate > 3 ? 'text-accent-orange' : 'text-accent-green'}">
                    {tech.reworkRate}%
                  </span>
                </div>
                <div class="h-1.5 bg-industrial-border rounded-full overflow-hidden">
                  <div
                    class="h-full rounded-full transition-all duration-500 {tech.reworkRate > 5 ? 'bg-accent-red' : tech.reworkRate > 3 ? 'bg-accent-orange' : 'bg-accent-green'}"
                    style="width: {Math.min(tech.reworkRate * 5, 100)}%"
                  ></div>
                </div>
                <div class="flex justify-between mt-1 text-xs text-industrial-text-muted">
                  <span>返修 {tech.reworkCount} 单</span>
                  <span>总计 {tech.total} 单</span>
                </div>
              </div>
            </div>
          {:else}
            <div class="text-center py-8 text-industrial-text-muted">
              暂无技师数据
            </div>
          {/each}
        </div>
      </div>
    </div>

    <div class="card p-6 animate-stagger" style="animation-delay: 400ms">
      <h3 class="font-display text-lg font-semibold text-industrial-text mb-4">各区域返修详情</h3>
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-industrial-bg/50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-industrial-text-muted uppercase tracking-wider">区域</th>
              <th class="px-6 py-3 text-center text-xs font-medium text-industrial-text-muted uppercase tracking-wider">总工单</th>
              <th class="px-6 py-3 text-center text-xs font-medium text-industrial-text-muted uppercase tracking-wider">返修数</th>
              <th class="px-6 py-3 text-right text-xs font-medium text-industrial-text-muted uppercase tracking-wider">返修率</th>
              <th class="px-6 py-3 text-right text-xs font-medium text-industrial-text-muted uppercase tracking-wider">趋势</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-industrial-border">
            {#each analysisData.byRegion as region, index}
              <tr class="hover:bg-industrial-bg/30 transition-colors">
                <td class="px-6 py-4 font-medium text-industrial-text">{region.region}</td>
                <td class="px-6 py-4 text-center text-industrial-text">{region.total}</td>
                <td class="px-6 py-4 text-center text-accent-orange">{region.reworkCount}</td>
                <td class="px-6 py-4 text-right font-mono font-medium {region.reworkRate > 5 ? 'text-accent-red' : region.reworkRate > 3 ? 'text-accent-orange' : 'text-accent-green'}">
                  {region.reworkRate}%
                </td>
                <td class="px-6 py-4 text-right">
                  <div class="inline-flex items-center gap-1 px-2 py-1 rounded {
                    region.reworkRate > 5 ? 'bg-accent-red/20 text-accent-red' :
                    region.reworkRate > 3 ? 'bg-accent-orange/20 text-accent-orange' :
                    'bg-accent-green/20 text-accent-green'
                  }">
                    {#if region.reworkRate > 5}
                      <TrendingUp class="w-3 h-3" />
                      <span class="text-xs">需改善</span>
                    {:else if region.reworkRate > 3}
                      <AlertCircle class="w-3 h-3" />
                      <span class="text-xs">关注</span>
                    {:else}
                      <TrendingDown class="w-3 h-3" />
                      <span class="text-xs">良好</span>
                    {/if}
                  </div>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  {/if}
</div>
