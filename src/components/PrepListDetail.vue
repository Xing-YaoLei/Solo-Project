<template>
  <div class="bg-primary-light/80 rounded-xl border border-white/5 p-5 relative">
    <div
      ref="tooltipRef"
      class="chart-tooltip absolute pointer-events-none z-50 rounded-lg bg-graphite/95 px-3 py-2 text-xs text-ivory shadow-lg border border-white/10 transition-opacity duration-150"
      style="opacity: 0"
    ></div>

    <header class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-2.5">
        <Wrench class="w-5 h-5 text-accent" />
        <h2 class="font-serif text-lg text-ivory">整备清单明细</h2>
      </div>
      <div class="flex items-center gap-4 text-sm">
        <div class="flex flex-col items-end">
          <span class="text-ivory/40 font-sans text-xs">平均整备天数</span>
          <span class="font-mono text-ivory">{{ avgPrepDays }}天</span>
        </div>
        <div class="flex flex-col items-end">
          <span class="text-ivory/40 font-sans text-xs">超期</span>
          <span class="font-mono text-danger">{{ overdueCount }}辆</span>
        </div>
      </div>
    </header>

    <div class="flex gap-5">
      <div ref="chartContainer" style="width: 40%; min-width: 220px"></div>

      <div class="flex-1 overflow-y-auto" style="max-height: 320px">
        <table class="w-full text-sm">
          <thead class="sticky top-0 bg-primary-light/95 z-10">
            <tr class="text-ivory/40 font-sans text-xs border-b border-white/5">
              <th class="text-left py-2 px-3 font-normal">车辆ID</th>
              <th class="text-left py-2 px-3 font-normal">品牌</th>
              <th class="text-left py-2 px-3 font-normal">车型</th>
              <th class="text-right py-2 px-3 font-normal">整备天数</th>
              <th class="text-right py-2 px-3 font-normal">预期天数</th>
              <th class="text-center py-2 px-3 font-normal">状态</th>
              <th class="text-center py-2 px-3 font-normal">金融审批</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="item in overdueItems"
              :key="item.vehicleId"
              class="border-b border-white/5 hover:bg-white/[0.03] transition-colors"
              :class="{ 'border-l-2 border-l-danger': item.status === 'overdue' }"
            >
              <td class="py-2.5 px-3 font-mono text-ivory/80 text-xs">{{ item.vehicleId }}</td>
              <td class="py-2.5 px-3 font-sans text-ivory/80">{{ item.brand }}</td>
              <td class="py-2.5 px-3 font-sans text-ivory/80">{{ item.model }}</td>
              <td class="py-2.5 px-3 font-mono text-right text-xs" :class="item.prepDays > item.expectedDays ? 'text-danger' : 'text-ivory/80'">{{ item.prepDays }}</td>
              <td class="py-2.5 px-3 font-mono text-right text-ivory/50 text-xs">{{ item.expectedDays }}</td>
              <td class="py-2.5 px-3 text-center">
                <span
                  class="inline-block px-2 py-0.5 rounded-md text-xs font-sans"
                  :class="statusClass(item.status)"
                >{{ statusLabel(item.status) }}</span>
              </td>
              <td class="py-2.5 px-3 text-center font-sans text-xs text-ivory/60">{{ item.financeApproval }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, onUnmounted } from 'vue'
import * as d3 from 'd3'
import { Wrench } from 'lucide-vue-next'
import { useDashboardStore } from '@/stores/dashboard'
import type { PrepOverdueItem } from '@/types'

const store = useDashboardStore()
const chartContainer = ref<HTMLElement | null>(null)
const tooltipRef = ref<HTMLDivElement>()
let resizeObserver: ResizeObserver | null = null

const avgPrepDays = computed(() => store.prepList?.avgPrepDays?.toFixed(1) ?? '0.0')
const overdueCount = computed(() => store.prepList?.statusDistribution.overdue ?? 0)
const overdueItems = computed(() => store.prepList?.overdueItems ?? [])

const bars = computed(() => [
  { key: 'notStarted', label: '未开始', value: store.prepList?.statusDistribution.notStarted ?? 0, color: '#F39C12' },
  { key: 'inProgress', label: '整备中', value: store.prepList?.statusDistribution.inProgress ?? 0, color: '#D4A843' },
  { key: 'completed', label: '已完成', value: store.prepList?.statusDistribution.completed ?? 0, color: '#27AE60' },
  { key: 'overdue', label: '超期', value: store.prepList?.statusDistribution.overdue ?? 0, color: '#E74C3C' },
])

function statusLabel(status: PrepOverdueItem['status']) {
  const map: Record<PrepOverdueItem['status'], string> = {
    not_started: '未开始',
    in_progress: '整备中',
    completed: '已完成',
    overdue: '超期',
  }
  return map[status]
}

function statusClass(status: PrepOverdueItem['status']) {
  const map: Record<PrepOverdueItem['status'], string> = {
    not_started: 'bg-warning/15 text-warning',
    in_progress: 'bg-accent/15 text-accent',
    completed: 'bg-success/15 text-success',
    overdue: 'bg-danger/15 text-danger',
  }
  return map[status]
}

function showTooltip(html: string, x: number, y: number) {
  const el = tooltipRef.value
  if (!el) return
  el.innerHTML = html
  el.style.opacity = '1'
  el.style.left = `${x + 12}px`
  el.style.top = `${y - 8}px`
}

function hideTooltip() {
  const el = tooltipRef.value
  if (!el) return
  el.style.opacity = '0'
}

function renderChart() {
  const container = chartContainer.value
  if (!container) return

  const data = bars.value
  if (!data.length) return

  const barHeight = 32
  const gap = 16
  const labelWidth = 60
  const margin = { top: 8, right: 40, bottom: 8, left: labelWidth }
  const width = container.clientWidth
  const totalBars = data.length
  const height = totalBars * (barHeight + gap) - gap + margin.top + margin.bottom

  d3.select(container).selectAll('*').remove()

  const svg = d3
    .select(container)
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`)

  const innerWidth = width - margin.left - margin.right
  const maxVal = d3.max(data, (d) => d.value) ?? 1

  const x = d3.scaleLinear().domain([0, maxVal]).range([0, innerWidth])

  const barGroups = svg
    .selectAll('.bar-group')
    .data(data)
    .enter()
    .append('g')
    .attr('class', 'bar-group')
    .attr('transform', (_d, i) => `translate(0,${i * (barHeight + gap)})`)

  barGroups
    .append('text')
    .attr('x', -10)
    .attr('y', barHeight / 2)
    .attr('text-anchor', 'end')
    .attr('dominant-baseline', 'central')
    .attr('fill', 'rgba(248,249,250,0.6)')
    .attr('font-family', 'Noto Sans SC, sans-serif')
    .attr('font-size', '13px')
    .text((d) => d.label)

  barGroups
    .append('rect')
    .attr('x', 0)
    .attr('y', 0)
    .attr('height', barHeight)
    .attr('width', 0)
    .attr('rx', barHeight / 2)
    .attr('ry', barHeight / 2)
    .attr('fill', (d) => d.color)
    .style('cursor', 'pointer')
    .on('mouseenter', function (event, d) {
      d3.select(this).attr('opacity', 0.85)
      const rect = container.getBoundingClientRect()
      showTooltip(
        `<div class="font-sans"><span style="color:${d.color}">●</span> ${d.label}: <span class="font-mono">${d.value}</span></div>`,
        event.clientX - rect.left,
        event.clientY - rect.top,
      )
    })
    .on('mousemove', function (event) {
      const rect = container.getBoundingClientRect()
      const el = tooltipRef.value
      if (!el) return
      el.style.left = `${event.clientX - rect.left + 12}px`
      el.style.top = `${event.clientY - rect.top - 8}px`
    })
    .on('mouseleave', function () {
      d3.select(this).attr('opacity', 1)
      hideTooltip()
    })
    .transition()
    .duration(800)
    .ease(d3.easeCubicOut)
    .attr('width', (d) => Math.max(x(d.value), barHeight))

  barGroups
    .append('text')
    .attr('x', (d) => Math.max(x(d.value), barHeight) + 8)
    .attr('y', barHeight / 2)
    .attr('dominant-baseline', 'central')
    .attr('fill', 'rgba(248,249,250,0.8)')
    .attr('font-family', 'JetBrains Mono, monospace')
    .attr('font-size', '13px')
    .attr('opacity', 0)
    .text((d) => d.value)
    .transition()
    .delay(600)
    .duration(400)
    .attr('opacity', 1)
}

onMounted(() => {
  renderChart()
  if (chartContainer.value) {
    resizeObserver = new ResizeObserver(() => {
      renderChart()
    })
    resizeObserver.observe(chartContainer.value)
  }
})

onUnmounted(() => {
  resizeObserver?.disconnect()
})

watch(() => store.prepList, renderChart, { deep: true })
</script>
