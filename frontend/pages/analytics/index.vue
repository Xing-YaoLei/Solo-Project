<template>
  <div class="page-container">
    <h1 class="page-title">汇总看板</h1>
    <NSpin :show="loading">
      <NGrid :cols="2" :x-gap="16" :y-gap="16" responsive="screen" item-responsive>
        <NGridItem span="0:2 1280:1">
          <NCard title="库存周转分析">
            <div style="text-align: center; margin-bottom: 16px;">
              <NStatistic label="平均周转天数" :value="analytics.turnover_avg_days">
                <template #suffix>天</template>
              </NStatistic>
            </div>
            <ClientOnly>
              <VChart :option="turnoverOption" style="height: 280px;" autoresize />
            </ClientOnly>
          </NCard>
        </NGridItem>
        <NGridItem span="0:2 1280:1">
          <NCard title="来源渠道统计">
            <ClientOnly>
              <VChart :option="channelOption" style="height: 340px;" autoresize />
            </ClientOnly>
          </NCard>
        </NGridItem>
        <NGridItem span="0:2 1280:1">
          <NCard title="责任人绩效">
            <NDataTable :columns="assigneeColumns" :data="analytics.assignee_stats" :bordered="false" size="small" />
          </NCard>
        </NGridItem>
        <NGridItem span="0:2 1280:1">
          <NCard title="复盘标签云">
            <NSpace wrap>
              <NTag
                v-for="item in analytics.tag_cloud"
                :key="item.tag"
                :size="tagSize(item.count)"
                round
                type="info"
                style="margin: 4px;"
              >
                {{ item.tag }} ({{ item.count }})
              </NTag>
            </NSpace>
            <NEmpty v-if="analytics.tag_cloud.length === 0" description="暂无标签" />
          </NCard>
        </NGridItem>
      </NGrid>
    </NSpin>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, h } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, BarChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import VChart from 'vue-echarts'
import { NTag } from 'naive-ui'
import type { AnalyticsOverview } from '~/types'

use([CanvasRenderer, LineChart, BarChart, GridComponent, TooltipComponent, LegendComponent])

const { message } = useNaiveDiscrete()
const api = useApi()
const loading = ref(false)

const analytics = reactive<AnalyticsOverview>({
  turnover_avg_days: 0,
  turnover_trend: [],
  channel_stats: [],
  assignee_stats: [],
  tag_cloud: [],
})

function tagSize(count: number) {
  if (count >= 10) return 'large' as const
  if (count >= 5) return 'medium' as const
  return 'small' as const
}

const assigneeColumns = [
  { title: '负责人', key: 'assignee.username', width: 100, render: (row: any) => row.assignee?.username || '-' },
  { title: '处理量', key: 'count', width: 80 },
  { title: '平均时长(h)', key: 'avg_hours', width: 110, render: (row: any) => h('span', { class: 'mono' }, row.avg_hours) },
  { title: '异常率', key: 'exception_rate', width: 80, render: (row: any) => h(NTag, { type: row.exception_rate > 0.3 ? 'error' : row.exception_rate > 0.1 ? 'warning' : 'success', size: 'small' }, { default: () => `${(row.exception_rate * 100).toFixed(0)}%` }) },
]

const turnoverOption = computed(() => ({
  tooltip: { trigger: 'axis' as const },
  grid: { left: 50, right: 20, bottom: 30, top: 20 },
  xAxis: { type: 'category' as const, data: analytics.turnover_trend.map(t => t.month) },
  yAxis: { type: 'value' as const, name: '天数' },
  series: [{
    data: analytics.turnover_trend.map(t => t.avg_days),
    type: 'line' as const,
    smooth: true,
    areaStyle: { opacity: 0.15 },
    lineStyle: { color: '#F59E0B' },
    itemStyle: { color: '#F59E0B' },
  }],
}))

const channelOption = computed(() => ({
  tooltip: { trigger: 'axis' as const },
  legend: {},
  grid: { left: 50, right: 20, bottom: 30, top: 40 },
  xAxis: { type: 'category' as const, data: analytics.channel_stats.map(c => c.channel) },
  yAxis: { type: 'value' as const },
  series: [
    { name: '过户量', data: analytics.channel_stats.map(c => c.count), type: 'bar' as const, itemStyle: { color: '#F59E0B' } },
    { name: '平均天数', data: analytics.channel_stats.map(c => c.avg_days), type: 'bar' as const, itemStyle: { color: '#1E293B' } },
  ],
}))

async function loadAnalytics() {
  loading.value = true
  try {
    const data = await api.getAnalytics()
    Object.assign(analytics, data)
  } catch (e: any) {
    message.error(e?.message || '加载看板数据失败')
  } finally {
    loading.value = false
  }
}

onMounted(loadAnalytics)
</script>
