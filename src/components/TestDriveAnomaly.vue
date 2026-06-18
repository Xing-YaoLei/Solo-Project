<template>
  <div class="chart-card p-5 relative">
    <div
      ref="tooltipRef"
      class="chart-tooltip absolute pointer-events-none z-50"
      style="opacity: 0"
    ></div>

    <header class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-2.5">
        <AlertTriangle class="w-5 h-5 text-accent" />
        <h3 class="font-serif text-ivory text-lg">试驾记录异常标注</h3>
      </div>
      <div class="flex items-center gap-4 text-sm">
        <div class="flex flex-col items-end">
          <span class="text-ivory/40 font-sans text-xs">总试驾</span>
          <span class="font-mono text-ivory">{{ data.totalDrives }}</span>
        </div>
        <div class="flex flex-col items-end">
          <span class="text-ivory/40 font-sans text-xs">异常</span>
          <span class="font-mono text-danger">{{ data.abnormalCount }}</span>
        </div>
      </div>
    </header>

    <div ref="heatmapContainer" class="w-full mb-4"></div>

    <div class="space-y-2 max-h-52 overflow-y-auto pr-1">
      <div
        v-for="item in data.anomalies"
        :key="`${item.vehicleId}-${item.date}-${item.type}`"
        class="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/5"
        :class="{ 'pulse-anomaly': item.severity === 'high' }"
      >
        <component :is="typeIcon(item.type)" class="w-4 h-4 shrink-0" :class="typeIconClass(item.type)" />
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <span class="font-mono text-xs text-ivory">{{ item.vehicleId }}</span>
            <span class="text-ivory/30 text-xs">|</span>
            <span class="font-mono text-xs text-ivory/50">{{ item.date }}</span>
          </div>
          <span class="text-xs text-ivory/70 font-sans">{{ typeLabel(item.type) }}</span>
        </div>
        <span
          class="shrink-0 text-[10px] font-mono px-1.5 py-0.5 rounded"
          :class="severityClass(item.severity)"
        >{{ severityLabel(item.severity) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import * as d3 from 'd3'
import { AlertTriangle, Car, Gauge, Route, Clock } from 'lucide-vue-next'
import { useDashboardStore } from '@/stores/dashboard'
import type { TestDriveAnomalyItem } from '@/types'

const store = useDashboardStore()
const heatmapContainer = ref<HTMLDivElement>()
const tooltipRef = ref<HTMLDivElement>()
let resizeObserver: ResizeObserver | null = null

const data = computed(() => store.testDriveAnomaly ?? {
  totalDrives: 0,
  abnormalCount: 0,
  dailyDistribution: [] as { date: string; normalCount: number; abnormalCount: number }[],
  anomalies: [] as TestDriveAnomalyItem[],
})

const typeIcon = (type: TestDriveAnomalyItem['type']) => {
  const map = { accident_test: Car, overspeed: Gauge, unauthorized_route: Route, long_duration: Clock }
  return map[type]
}

const typeIconClass = (type: TestDriveAnomalyItem['type']) => {
  const map = { accident_test: 'text-danger', overspeed: 'text-warning', unauthorized_route: 'text-accent', long_duration: 'text-ivory/50' }
  return map[type]
}

const typeLabel = (type: TestDriveAnomalyItem['type']) => {
  const map = { accident_test: '事故车试驾', overspeed: '超速试驾', unauthorized_route: '偏离路线', long_duration: '时长异常' }
  return map[type]
}

const severityClass = (severity: TestDriveAnomalyItem['severity']) => {
  const map = { low: 'bg-warning/15 text-warning', medium: 'bg-accent/15 text-accent', high: 'bg-danger/15 text-danger' }
  return map[severity]
}

const severityLabel = (severity: TestDriveAnomalyItem['severity']) => {
  const map = { low: '低', medium: '中', high: '高' }
  return map[severity]
}

function renderHeatmap() {
  const container = heatmapContainer.value
  if (!container) return
  const distribution = data.value.dailyDistribution
  if (!distribution.length) return

  d3.select(container).selectAll('*').remove()

  const cellSize = 16
  const cellPad = 2
  const cellStep = cellSize + cellPad
  const weekDays = ['一', '二', '三', '四', '五', '六', '日']
  const cols = 7

  const parsed = distribution.map((d) => {
    const dt = new Date(d.date)
    let dow = dt.getDay()
    dow = dow === 0 ? 6 : dow - 1
    return { ...d, dateObj: dt, dayOfWeek: dow, total: d.normalCount + d.abnormalCount }
  })

  const maxTotal = d3.max(parsed, (d) => d.total) ?? 1
  const colorScale = d3
    .scaleLinear<string>()
    .domain([0, maxTotal])
    .range(['rgba(212,168,67,0.08)', '#D4A843'])
    .interpolate(d3.interpolateRgb)

  const parseDate = d3.timeParse('%Y-%m-%d')
  const startDate = parseDate(distribution[0].date)!
  const endDate = parseDate(distribution[distribution.length - 1].date)!
  let startDow = startDate.getDay()
  startDow = startDow === 0 ? 6 : startDow - 1

  const weekCount = Math.ceil((parsed.length + startDow) / cols)
  const labelW = 24
  const topPad = 20
  const svgW = labelW + cols * cellStep + 4
  const svgH = topPad + weekCount * cellStep + 4

  const svg = d3
    .select(container)
    .append('svg')
    .attr('width', svgW)
    .attr('height', svgH)

  const monthFormat = d3.timeFormat('%Y年%m月')
  svg
    .append('text')
    .attr('x', labelW)
    .attr('y', 12)
    .attr('fill', 'rgba(248,249,250,0.45)')
    .attr('font-family', 'Noto Sans SC, sans-serif')
    .attr('font-size', '11px')
    .text(monthFormat(startDate))

  const g = svg.append('g').attr('transform', `translate(${labelW},${topPad})`)

  weekDays.forEach((label, i) => {
    g.append('text')
      .attr('x', -4)
      .attr('y', i * cellStep + cellSize / 2)
      .attr('text-anchor', 'end')
      .attr('dominant-baseline', 'central')
      .attr('fill', 'rgba(248,249,250,0.3)')
      .attr('font-family', 'Noto Sans SC, sans-serif')
      .attr('font-size', '9px')
      .text(i % 2 === 0 ? label : '')
  })

  const cellData = parsed.map((d) => {
    const dayIndex = d3.timeDay.count(startDate, d.dateObj)
    const pos = dayIndex + startDow
    const col = Math.floor(pos / cols)
    const row = pos % cols
    return { ...d, col, row }
  })

  const tooltip = tooltipRef.value

  g.selectAll('rect.cell')
    .data(cellData)
    .enter()
    .append('rect')
    .attr('class', 'cell')
    .attr('x', (d) => d.col * cellStep)
    .attr('y', (d) => d.row * cellStep)
    .attr('width', cellSize)
    .attr('height', cellSize)
    .attr('rx', 3)
    .attr('fill', (d) => colorScale(d.total))
    .style('cursor', 'pointer')
    .on('mouseenter', function (event, d) {
      d3.select(this).attr('stroke', 'rgba(248,249,250,0.4)').attr('stroke-width', 1)
      if (!tooltip) return
      const rect = container.getBoundingClientRect()
      tooltip.innerHTML = `
        <div style="font-family:JetBrains Mono,monospace">
          <div class="text-ivory/60 mb-1">${d.date}</div>
          <div class="flex justify-between gap-4">
            <span class="text-ivory/70">正常</span>
            <span class="text-ivory">${d.normalCount}</span>
          </div>
          <div class="flex justify-between gap-4">
            <span class="text-danger">异常</span>
            <span class="text-ivory">${d.abnormalCount}</span>
          </div>
        </div>
      `
      tooltip.style.left = `${event.clientX - rect.left + 12}px`
      tooltip.style.top = `${event.clientY - rect.top - 8}px`
      tooltip.style.opacity = '1'
    })
    .on('mousemove', function (event) {
      if (!tooltip) return
      const rect = container.getBoundingClientRect()
      tooltip.style.left = `${event.clientX - rect.left + 12}px`
      tooltip.style.top = `${event.clientY - rect.top - 8}px`
    })
    .on('mouseleave', function () {
      d3.select(this).attr('stroke', 'none')
      if (tooltip) tooltip.style.opacity = '0'
    })

  g.selectAll('circle.anomaly-dot')
    .data(cellData.filter((d) => d.abnormalCount > 0))
    .enter()
    .append('circle')
    .attr('cx', (d) => d.col * cellStep + cellSize - 3)
    .attr('cy', (d) => d.row * cellStep + 3)
    .attr('r', 2.5)
    .attr('fill', '#E74C3C')
    .style('pointer-events', 'none')
}

onMounted(() => {
  renderHeatmap()
  if (heatmapContainer.value) {
    resizeObserver = new ResizeObserver(() => renderHeatmap())
    resizeObserver.observe(heatmapContainer.value)
  }
})

onUnmounted(() => {
  resizeObserver?.disconnect()
})

watch(() => store.testDriveAnomaly, renderHeatmap, { deep: true })
</script>
