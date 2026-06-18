<template>
  <div class="chart-card bg-primary-light/80 rounded-xl border border-white/5 p-5 relative">
    <div
      ref="tooltipRef"
      class="chart-tooltip absolute pointer-events-none z-50 rounded-lg bg-graphite/95 px-3 py-2 text-xs text-ivory shadow-lg border border-white/10 transition-opacity duration-150"
      style="opacity: 0"
    ></div>

    <header class="flex items-center gap-2 mb-4">
      <FileCheck class="w-5 h-5 text-accent" />
      <h2 class="font-serif text-lg text-ivory">检测报告构成</h2>
    </header>

    <div class="flex gap-4">
      <div class="flex flex-col items-center shrink-0" style="width: 200px">
        <div ref="donutContainer" style="width: 200px; height: 200px"></div>
        <div class="flex gap-4 mt-3 text-xs text-ivory/70">
          <span class="flex items-center gap-1">
            <span class="w-2 h-2 rounded-full bg-success"></span>
            通过 {{ summary.passed }}
          </span>
          <span class="flex items-center gap-1">
            <span class="w-2 h-2 rounded-full bg-danger"></span>
            未过 {{ summary.failed }}
          </span>
          <span class="flex items-center gap-1">
            <span class="w-2 h-2 rounded-full bg-warning"></span>
            待检 {{ summary.pending }}
          </span>
        </div>
      </div>
      <div ref="barContainer" class="flex-1" style="height: 200px"></div>
    </div>

    <div class="mt-5 space-y-2">
      <h3 class="text-sm text-ivory/60 font-sans mb-2">主要失败原因</h3>
      <div v-for="item in failureReasons" :key="item.reason" class="flex items-center gap-3">
        <span class="text-xs text-ivory/80 font-sans truncate w-28">{{ item.reason }}</span>
        <div class="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
          <div
            class="h-full rounded-full bg-danger/70"
            :style="{ width: `${item.percentage}%` }"
          ></div>
        </div>
        <span class="text-xs font-mono text-ivory/70 w-14 text-right">{{ item.count }} ({{ item.percentage }}%)</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import * as d3 from 'd3'
import { FileCheck } from 'lucide-vue-next'
import { useDashboardStore } from '@/stores/dashboard'

const store = useDashboardStore()
const donutContainer = ref<HTMLDivElement>()
const barContainer = ref<HTMLDivElement>()
const tooltipRef = ref<HTMLDivElement>()

const summary = computed(() => store.inspectionReport?.summary ?? { passed: 0, failed: 0, pending: 0 })
const trendByWeek = computed(() => store.inspectionReport?.trendByWeek ?? [])
const failureReasons = computed(() => (store.inspectionReport?.failureReasons ?? []).slice(0, 4))
const passRate = computed(() => store.overview?.summary.inspectionPassRate ?? 0)

const segments = computed(() => [
  { key: 'passed', label: '通过', value: summary.value.passed, color: '#27AE60' },
  { key: 'failed', label: '未过', value: summary.value.failed, color: '#E74C3C' },
  { key: 'pending', label: '待检', value: summary.value.pending, color: '#F39C12' },
])

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

function renderDonut() {
  const container = donutContainer.value
  if (!container) return
  d3.select(container).selectAll('*').remove()

  const width = 200
  const height = 200
  const radius = Math.min(width, height) / 2

  const svg = d3
    .select(container)
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .append('g')
    .attr('transform', `translate(${width / 2},${height / 2})`)

  const pie = d3
    .pie<{ key: string; label: string; value: number; color: string }>()
    .value((d) => d.value)
    .sort(null)
    .padAngle(0.03)

  const arc = d3.arc<d3.PieArcDatum<typeof segments.value[number]>>().innerRadius(radius * 0.6).outerRadius(radius * 0.85)

  const arcHover = d3.arc<d3.PieArcDatum<typeof segments.value[number]>>().innerRadius(radius * 0.6).outerRadius(radius * 0.85 * 1.05)

  svg
    .selectAll('path')
    .data(pie(segments.value))
    .enter()
    .append('path')
    .attr('d', arc)
    .attr('fill', (d) => d.data.color)
    .attr('stroke', 'none')
    .style('cursor', 'pointer')
    .style('transition', 'transform 0.2s ease')
    .on('mouseenter', function (event, d) {
      d3.select(this).attr('d', arcHover as any)
      const rect = container.getBoundingClientRect()
      showTooltip(
        `<div class="font-sans"><span style="color:${d.data.color}">●</span> ${d.data.label}: <span class="font-mono">${d.data.value}</span></div>`,
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
      d3.select(this).attr('d', arc as any)
      hideTooltip()
    })

  svg
    .append('text')
    .attr('text-anchor', 'middle')
    .attr('dy', '-0.1em')
    .attr('fill', '#D4A843')
    .attr('font-family', 'JetBrains Mono, monospace')
    .attr('font-size', '24px')
    .attr('font-weight', '700')
    .text(`${passRate.value.toFixed(1)}%`)

  svg
    .append('text')
    .attr('text-anchor', 'middle')
    .attr('dy', '1.4em')
    .attr('fill', 'rgba(248,249,250,0.5)')
    .attr('font-family', 'Noto Sans SC, sans-serif')
    .attr('font-size', '11px')
    .text('通过率')
}

function renderBar() {
  const container = barContainer.value
  if (!container || trendByWeek.value.length === 0) return
  d3.select(container).selectAll('*').remove()

  const width = container.clientWidth
  const height = 200
  const margin = { top: 10, right: 10, bottom: 28, left: 32 }
  const innerW = width - margin.left - margin.right
  const innerH = height - margin.top - margin.bottom

  const svg = d3
    .select(container)
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`)

  const keys = ['passed', 'failed', 'pending'] as const
  const colors: Record<string, string> = { passed: '#27AE60', failed: '#E74C3C', pending: '#F39C12' }

  const stack = d3.stack<typeof trendByWeek.value[number]>().keys(keys)
  const stacked = stack(trendByWeek.value)

  const x = d3
    .scaleBand()
    .domain(trendByWeek.value.map((d) => d.week))
    .range([0, innerW])
    .padding(0.35)

  const maxVal = d3.max(stacked, (s) => d3.max(s, (d) => d[1])) ?? 0
  const y = d3.scaleLinear().domain([0, maxVal]).nice().range([innerH, 0])

  svg
    .append('g')
    .attr('class', 'grid')
    .selectAll('line')
    .data(y.ticks(4))
    .enter()
    .append('line')
    .attr('x1', 0)
    .attr('x2', innerW)
    .attr('y1', (d) => y(d))
    .attr('y2', (d) => y(d))
    .attr('stroke', 'rgba(255,255,255,0.06)')

  svg
    .append('g')
    .attr('transform', `translate(0,${innerH})`)
    .call(d3.axisBottom(x).tickSize(0))
    .call((g) => g.select('.domain').remove())
    .selectAll('text')
    .attr('fill', 'rgba(248,249,250,0.4)')
    .attr('font-size', '10px')
    .attr('font-family', 'JetBrains Mono, monospace')

  svg
    .append('g')
    .call(d3.axisLeft(y).ticks(4).tickSize(0).tickFormat(d3.format('d')))
    .call((g) => g.select('.domain').remove())
    .selectAll('text')
    .attr('fill', 'rgba(248,249,250,0.4)')
    .attr('font-size', '10px')
    .attr('font-family', 'JetBrains Mono, monospace')

  const layerGroups = svg
    .selectAll('.layer')
    .data(stacked)
    .enter()
    .append('g')
    .attr('class', 'layer')
    .attr('fill', (d) => colors[d.key])

  layerGroups
    .selectAll('rect')
    .data((d) => d)
    .enter()
    .append('rect')
    .attr('x', (d) => {
      const idx = d.data.week
      return x(idx) ?? 0
    })
    .attr('y', (d) => y(d[1]))
    .attr('height', (d) => Math.max(0, y(d[0]) - y(d[1])))
    .attr('width', x.bandwidth())
    .attr('rx', 3)
    .attr('ry', 3)
    .style('cursor', 'pointer')
    .on('mouseenter', function (event, d) {
      const rect = container.getBoundingClientRect()
      const data = d.data
      showTooltip(
        `<div class="font-sans space-y-0.5">
          <div class="font-mono text-ivory/80">${data.week}</div>
          <div><span style="color:#27AE60">●</span> 通过: <span class="font-mono">${data.passed}</span></div>
          <div><span style="color:#E74C3C">●</span> 未过: <span class="font-mono">${data.failed}</span></div>
          <div><span style="color:#F39C12">●</span> 待检: <span class="font-mono">${data.pending}</span></div>
        </div>`,
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
      hideTooltip()
    })
}

function renderAll() {
  renderDonut()
  renderBar()
}

onMounted(() => {
  renderAll()
})

watch(
  () => store.inspectionReport,
  () => {
    renderAll()
  },
  { deep: true },
)

watch(
  () => store.overview?.summary.inspectionPassRate,
  () => {
    renderDonut()
  },
)
</script>
