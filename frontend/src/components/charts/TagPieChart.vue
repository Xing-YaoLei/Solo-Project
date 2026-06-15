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
  delayedBatches: {
    type: Array,
    default: () => []
  },
  width: {
    type: Number,
    default: 400
  },
  height: {
    type: Number,
    default: 300
  },
  labelKey: {
    type: String,
    default: 'tag'
  },
  valueKey: {
    type: String,
    default: 'count'
  }
})

const chartRef = ref(null)
let svg = null

const colorScale = d3.scaleOrdinal()
  .range(['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1',
          '#13c2c2', '#eb2f96', '#fa8c16', '#2f54eb', '#a0d911'])

const renderChart = () => {
  if (!chartRef.value || !props.data.length) return

  d3.select(chartRef.value).selectAll('*').remove()

  const containerWidth = chartRef.value.clientWidth || props.width
  const containerHeight = props.height
  const radius = Math.min(containerWidth, containerHeight) / 2 - 20
  const centerX = containerWidth / 2
  const centerY = containerHeight / 2

  svg = d3.select(chartRef.value)
    .append('svg')
    .attr('width', containerWidth)
    .attr('height', containerHeight)

  const g = svg.append('g')
    .attr('transform', `translate(${centerX}, ${centerY})`)

  const pie = d3.pie()
    .value(d => d[props.valueKey])
    .sort(null)
    .padAngle(0.02)

  const arc = d3.arc()
    .innerRadius(radius * 0.6)
    .outerRadius(radius)

  const arcs = g.selectAll('.arc')
    .data(pie(props.data))
    .enter()
    .append('g')
    .attr('class', 'arc')

  arcs.append('path')
    .attr('d', arc)
    .attr('fill', (d, i) => colorScale(i))
    .attr('opacity', 0.85)
    .style('cursor', 'pointer')
    .on('mouseenter', function() {
      d3.select(this)
        .transition()
        .duration(200)
        .attr('opacity', 1)
        .attr('transform', d => {
          const [x, y] = arc.centroid(d)
          return `translate(${x * 0.1}, ${y * 0.1})`
        })
    })
    .on('mouseleave', function() {
      d3.select(this)
        .transition()
        .duration(200)
        .attr('opacity', 0.85)
        .attr('transform', 'translate(0, 0)')
    })

  const total = d3.sum(props.data, d => d[props.valueKey])

  g.append('text')
    .attr('text-anchor', 'middle')
    .attr('dy', '-0.5em')
    .attr('font-size', '24px')
    .attr('font-weight', 'bold')
    .attr('fill', '#1a1a1a')
    .text(total)

  g.append('text')
    .attr('text-anchor', 'middle')
    .attr('dy', '1.5em')
    .attr('font-size', '12px')
    .attr('fill', '#8c8c8c')
    .text('总数')

  const legendWidth = 120
  const legendX = containerWidth - legendWidth - 10
  let legendY = 20

  const legend = svg.append('g')
    .attr('class', 'legend')

  props.data.forEach((item, i) => {
    const legendItem = legend.append('g')
      .attr('transform', `translate(${legendX}, ${legendY})`)
      .style('cursor', 'pointer')

    legendItem.append('rect')
      .attr('width', 12)
      .attr('height', 12)
      .attr('rx', 2)
      .attr('fill', colorScale(i))

    legendItem.append('text')
      .attr('x', 18)
      .attr('y', 10)
      .attr('font-size', '12px')
      .attr('fill', '#595959')
      .text(`${item[props.labelKey]} (${item[props.valueKey]})`)

    legendY += 22
  })

  if (props.delayedBatches && props.delayedBatches.length > 0) {
    const delayX = 10
    let delayY = containerHeight - 16 - props.delayedBatches.length * 22

    const delayGroup = svg.append('g')
      .attr('class', 'delay-markers')

    props.delayedBatches.forEach(batch => {
      const delayItem = delayGroup.append('g')
        .attr('transform', `translate(${delayX}, ${delayY})`)

      delayItem.append('rect')
        .attr('width', 12)
        .attr('height', 12)
        .attr('rx', 2)
        .attr('fill', '#faad14')
        .attr('opacity', 0.8)

      delayItem.append('text')
        .attr('x', 18)
        .attr('y', 10)
        .attr('font-size', '11px')
        .attr('fill', '#fa8c16')
        .attr('font-weight', '500')
        .text(`⚠ 延迟: ${batch.batchName} - 预期 ${batch.expectedSyncTime?.substring?.(5, 16) || '-'}`)

      delayY += 22
    })
  }
}

onMounted(() => {
  renderChart()
  window.addEventListener('resize', renderChart)
})

onUnmounted(() => {
  window.removeEventListener('resize', renderChart)
})

watch([() => props.data, () => props.delayedBatches], () => {
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
  min-height: 300px;
}
</style>
