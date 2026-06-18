<template>
  <div class="chart-card bg-primary-light/80 rounded-xl border border-white/5 p-5 relative">
    <div
      ref="tooltipRef"
      class="chart-tooltip absolute pointer-events-none z-50"
      style="opacity: 0"
    ></div>
    <header class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-2.5">
        <TrendingUp class="w-5 h-5 text-accent" />
        <h3 class="font-serif text-ivory text-lg">车辆档案趋势</h3>
      </div>
      <div class="flex items-center gap-4 text-sm">
        <div class="flex flex-col items-end">
          <span class="text-ivory/40 font-sans text-xs">在架总数</span>
          <span class="font-mono text-ivory">{{ totalListed }}</span>
        </div>
        <div class="flex flex-col items-end">
          <span class="text-ivory/40 font-sans text-xs">周同比</span>
          <span class="font-mono" :class="wowClass">{{ wowText }}</span>
        </div>
        <div class="flex flex-col items-end">
          <span class="text-ivory/40 font-sans text-xs">月环比</span>
          <span class="font-mono" :class="momClass">{{ momText }}</span>
        </div>
      </div>
    </header>
    <div ref="chartContainer" class="w-full" style="height: 280px"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, onUnmounted } from 'vue'
import * as d3 from 'd3'
import { TrendingUp } from 'lucide-vue-next'
import { useDashboardStore } from '@/stores/dashboard'
import type { VehicleArchiveTrend } from '@/types'

const store = useDashboardStore()
const chartContainer = ref<HTMLElement | null>(null)
const tooltipRef = ref<HTMLDivElement>()
let resizeObserver: ResizeObserver | null = null

const totalListed = computed(() => store.overview?.summary.totalListed ?? 0)
const wowValue = computed(() => store.overview?.summary.weekOverWeek ?? 0)
const momValue = computed(() => store.overview?.summary.monthOverMonth ?? 0)
const wowText = computed(() => (wowValue.value >= 0 ? `+${wowValue.value}%` : `${wowValue.value}%`))
const momText = computed(() => (momValue.value >= 0 ? `+${momValue.value}%` : `${momValue.value}%`))
const wowClass = computed(() => (wowValue.value >= 0 ? 'text-success' : 'text-danger'))
const momClass = computed(() => (momValue.value >= 0 ? 'text-success' : 'text-danger'))

function renderChart() {
  const container = chartContainer.value
  if (!container) return

  const data = store.vehicleTrend
  if (!data.length) return

  const margin = { top: 16, right: 16, bottom: 32, left: 44 }
  const width = container.clientWidth - margin.left - margin.right
  const height = container.clientHeight - margin.top - margin.bottom

  if (width <= 0 || height <= 0) return

  d3.select(container).selectAll('*').remove()

  const svg = d3
    .select(container)
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`)

  const defs = svg.append('defs')

  const gradient = defs
    .append('linearGradient')
    .attr('id', 'area-gradient')
    .attr('x1', '0%')
    .attr('y1', '0%')
    .attr('x2', '0%')
    .attr('y2', '100%')
  gradient.append('stop').attr('offset', '0%').attr('stop-color', '#D4A843').attr('stop-opacity', 0.3)
  gradient.append('stop').attr('offset', '100%').attr('stop-color', '#D4A843').attr('stop-opacity', 0)

  const x = d3
    .scalePoint<string>()
    .domain(data.map((d) => d.period))
    .range([0, width])

  const maxVal = d3.max(data, (d) => Math.max(d.listed, d.delisted)) ?? 0
  const y = d3
    .scaleLinear()
    .domain([0, maxVal * 1.15])
    .nice()
    .range([height, 0])

  svg
    .append('g')
    .attr('class', 'grid-y')
    .selectAll('line')
    .data(y.ticks(5))
    .join('line')
    .attr('x1', 0)
    .attr('x2', width)
    .attr('y1', (d) => y(d))
    .attr('y2', (d) => y(d))
    .attr('stroke', 'rgba(255,255,255,0.06)')
    .attr('stroke-dasharray', '3,3')

  svg
    .append('g')
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(x).tickValues(data.filter((_, i) => i % Math.ceil(data.length / 7) === 0).map((d) => d.period)))
    .call((g) => g.select('.domain').attr('stroke', 'rgba(255,255,255,0.1)'))
    .call((g) =>
      g
        .selectAll('.tick line')
        .attr('stroke', 'rgba(255,255,255,0.1)')
        .attr('y2', 6)
    )
    .call((g) =>
      g
        .selectAll('.tick text')
        .attr('fill', 'rgba(255,255,255,0.4)')
        .style('font-family', 'JetBrains Mono, monospace')
        .style('font-size', '10px')
    )

  svg
    .append('g')
    .call(d3.axisLeft(y).ticks(5).tickSize(0))
    .call((g) => g.select('.domain').remove())
    .call((g) =>
      g
        .selectAll('.tick text')
        .attr('fill', 'rgba(255,255,255,0.4)')
        .style('font-family', 'JetBrains Mono, monospace')
        .style('font-size', '10px')
    )

  const area = d3
    .area<VehicleArchiveTrend>()
    .x((d) => x(d.period)!)
    .y0(height)
    .y1((d) => y(d.listed))
    .curve(d3.curveMonotoneX)

  svg
    .append('path')
    .datum(data)
    .attr('fill', 'url(#area-gradient)')
    .attr('d', area)

  const line = d3
    .line<VehicleArchiveTrend>()
    .x((d) => x(d.period)!)
    .y((d) => y(d.listed))
    .curve(d3.curveMonotoneX)

  const listedPath = svg
    .append('path')
    .datum(data)
    .attr('fill', 'none')
    .attr('stroke', '#D4A843')
    .attr('stroke-width', 2)
    .attr('d', line)

  const listedLength = (listedPath.node() as SVGPathElement)?.getTotalLength() ?? 0
  listedPath
    .attr('stroke-dasharray', `${listedLength}`)
    .attr('stroke-dashoffset', `${listedLength}`)
    .transition()
    .duration(1500)
    .ease(d3.easeQuadOut)
    .attr('stroke-dashoffset', '0')

  const delistedLine = d3
    .line<VehicleArchiveTrend>()
    .x((d) => x(d.period)!)
    .y((d) => y(d.delisted))
    .curve(d3.curveMonotoneX)

  const delistedPath = svg
    .append('path')
    .datum(data)
    .attr('fill', 'none')
    .attr('stroke', '#E74C3C')
    .attr('stroke-width', 1.5)
    .attr('stroke-dasharray', '6,4')
    .attr('d', delistedLine)

  const delistedLength = (delistedPath.node() as SVGPathElement)?.getTotalLength() ?? 0
  delistedPath
    .attr('stroke-dasharray', `${delistedLength}`)
    .attr('stroke-dashoffset', `${delistedLength}`)
    .transition()
    .duration(1500)
    .ease(d3.easeQuadOut)
    .attr('stroke-dashoffset', '0')
    .on('end', function () {
      d3.select(this).attr('stroke-dasharray', '6,4')
    })

  const tooltip = tooltipRef.value

  svg
    .append('rect')
    .attr('class', 'overlay')
    .attr('width', width)
    .attr('height', height)
    .attr('fill', 'none')
    .attr('pointer-events', 'all')
    .on('mousemove', (event: MouseEvent) => {
      if (!tooltip || !container) return
      const [mx] = d3.pointer(event)
      const domain = x.domain()
      let closestIdx = 0
      let closestDist = Infinity
      domain.forEach((d, i) => {
        const dist = Math.abs((x(d) ?? 0) - mx)
        if (dist < closestDist) {
          closestDist = dist
          closestIdx = i
        }
      })
      const d = data[closestIdx]
      if (!d) return
      const sign = d.netChange >= 0 ? '+' : ''
      tooltip.innerHTML = `
        <div style="font-family:JetBrains Mono,monospace">
          <div class="text-ivory/60 mb-1">${d.period}</div>
          <div class="flex justify-between gap-4">
            <span class="text-accent">上架</span>
            <span class="text-ivory">${d.listed}</span>
          </div>
          <div class="flex justify-between gap-4">
            <span class="text-danger">下架</span>
            <span class="text-ivory">${d.delisted}</span>
          </div>
          <div class="flex justify-between gap-4 border-t border-white/10 mt-1 pt-1">
            <span class="text-ivory/60">净增</span>
            <span class="${d.netChange >= 0 ? 'text-success' : 'text-danger'}">${sign}${d.netChange}</span>
          </div>
        </div>
      `
      const rect = container.getBoundingClientRect()
      const tooltipRect = tooltip.getBoundingClientRect()
      let left = mx + margin.left + 12
      let top = event.clientY - rect.top - 12
      if (left + tooltipRect.width > rect.width) left = mx + margin.left - tooltipRect.width - 12
      if (top < 0) top = event.clientY - rect.top + 12
      tooltip.style.left = `${left}px`
      tooltip.style.top = `${top}px`
      tooltip.style.opacity = '1'
    })
    .on('mouseleave', () => {
      if (tooltip) tooltip.style.opacity = '0'
    })
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

watch(() => store.vehicleTrend, renderChart, { deep: true })
</script>
