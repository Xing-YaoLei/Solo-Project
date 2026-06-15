<template>
  <div class="chart-wrapper">
    <div ref="chartRef" class="chart-container"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, onUnmounted } from 'vue'
import * as d3 from 'd3'

const props = defineProps({
  data: {
    type: Array,
    default: () => []
  },
  width: {
    type: Number,
    default: 500
  },
  height: {
    type: Number,
    default: 350
  }
})

const chartRef = ref(null)

const colors = ['#1890ff', '#52c41a', '#faad14', '#fa8c16', '#f5222d']

const renderChart = () => {
  if (!chartRef.value || !props.data.length) return

  d3.select(chartRef.value).selectAll('*').remove()

  const containerWidth = chartRef.value.clientWidth || props.width
  const containerHeight = props.height
  const margin = { top: 20, right: 120, bottom: 20, left: 20 }
  const chartWidth = containerWidth - margin.left - margin.right
  const chartHeight = containerHeight - margin.top - margin.bottom

  const svg = d3.select(chartRef.value)
    .append('svg')
    .attr('width', containerWidth)
    .attr('height', containerHeight)

  const g = svg.append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top})`)

  const maxValue = d3.max(props.data, d => d.value)
  const barHeight = chartHeight / props.data.length * 0.7
  const gap = chartHeight / props.data.length * 0.3

  props.data.forEach((d, i) => {
    const barWidth = (d.value / maxValue) * chartWidth * 0.8
    const y = i * (barHeight + gap) + gap / 2

    const barGroup = g.append('g')
      .attr('transform', `translate(0, ${y})`)

    const gradient = svg.append('defs')
      .append('linearGradient')
      .attr('id', `funnel-gradient-${i}`)
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '100%')
      .attr('y2', '0%')

    gradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', colors[i % colors.length])
      .attr('stop-opacity', 0.9)

    gradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', colors[i % colors.length])
      .attr('stop-opacity', 0.6)

    barGroup.append('rect')
      .attr('x', (chartWidth * 0.8 - barWidth) / 2)
      .attr('y', 0)
      .attr('width', 0)
      .attr('height', barHeight)
      .attr('rx', 4)
      .attr('fill', `url(#funnel-gradient-${i})`)
      .transition()
      .duration(800)
      .delay(i * 100)
      .attr('width', barWidth)
      .attr('x', (chartWidth * 0.8 - barWidth) / 2)

    barGroup.append('text')
      .attr('x', chartWidth * 0.4)
      .attr('y', barHeight / 2 - 6)
      .attr('text-anchor', 'middle')
      .attr('font-size', '13px')
      .attr('font-weight', '500')
      .attr('fill', 'white')
      .text(d.stage)

    barGroup.append('text')
      .attr('x', chartWidth * 0.4)
      .attr('y', barHeight / 2 + 10)
      .attr('text-anchor', 'middle')
      .attr('font-size', '12px')
      .attr('fill', 'rgba(255,255,255,0.9)')
      .text(`${d.value}人 (${d.percent?.toFixed?.(1) || 0}%)`)

    barGroup.append('text')
      .attr('x', chartWidth * 0.8 + 10)
      .attr('y', barHeight / 2 + 4)
      .attr('font-size', '12px')
      .attr('fill', '#8c8c8c')
      .text(i > 0 ? `转化率: ${(d.value / props.data[i-1].value * 100).toFixed(1)}%` : '')
  })
}

onMounted(() => {
  renderChart()
  window.addEventListener('resize', renderChart)
})

onUnmounted(() => {
  window.removeEventListener('resize', renderChart)
})

watch(() => props.data, () => {
  renderChart()
}, { deep: true })
</script>

<style lang="scss" scoped>
.chart-wrapper {
  width: 100%;
  height: 100%;
}

.chart-container {
  width: 100%;
  min-height: 350px;
}
</style>
