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
    default: 600
  },
  height: {
    type: Number,
    default: 300
  }
})

const chartRef = ref(null)

const renderChart = () => {
  if (!chartRef.value || !props.data.length) return

  d3.select(chartRef.value).selectAll('*').remove()

  const containerWidth = chartRef.value.clientWidth || props.width
  const containerHeight = props.height
  const margin = { top: 20, right: 40, bottom: 60, left: 50 }
  const chartWidth = containerWidth - margin.left - margin.right
  const chartHeight = containerHeight - margin.top - margin.bottom

  const svg = d3.select(chartRef.value)
    .append('svg')
    .attr('width', containerWidth)
    .attr('height', containerHeight)

  const g = svg.append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top})`)

  const sortedData = [...props.data].sort((a, b) =>
    new Date(a.createTime) - new Date(b.createTime)
  )

  const parseTime = d3.timeParse('%Y-%m-%dT%H:%M:%S')
  const xData = sortedData.map(d => {
    const date = new Date(d.createTime || d.updateTime)
    return date
  })

  const allDates = [...xData]
  if (props.delayedBatches) {
    props.delayedBatches.forEach(b => {
      if (b.expectedSyncTime) allDates.push(new Date(b.expectedSyncTime))
      if (b.actualSyncTime) allDates.push(new Date(b.actualSyncTime))
    })
  }

  const xScale = d3.scaleTime()
    .domain(d3.extent(allDates))
    .range([0, chartWidth])

  const versions = [...new Set(sortedData.map(d => d.version))]
  const yScale = d3.scaleLinear()
    .domain([0, versions.length + 1])
    .range([chartHeight, 0])

  const xAxis = d3.axisBottom(xScale)
    .ticks(5)
    .tickFormat(d3.timeFormat('%m-%d %H:%M'))

  g.append('g')
    .attr('transform', `translate(0, ${chartHeight})`)
    .attr('class', 'x-axis')
    .call(xAxis)
    .selectAll('text')
    .attr('font-size', '10px')
    .attr('fill', '#8c8c8c')
    .attr('transform', 'rotate(-30)')
    .style('text-anchor', 'end')

  g.selectAll('.x-axis path, .x-axis line')
    .attr('stroke', '#e8e8e8')

  const ruleTypes = [...new Set(sortedData.map(d => d.ruleType))]
  const colorScale = d3.scaleOrdinal()
    .domain(ruleTypes)
    .range(['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1'])

  sortedData.forEach((d, i) => {
    const x = xScale(new Date(d.createTime || d.updateTime))
    const y = yScale(ruleTypes.indexOf(d.ruleType) + 1)

    const gPoint = g.append('g')
      .attr('transform', `translate(${x}, ${y})`)
      .style('cursor', 'pointer')

    gPoint.append('circle')
      .attr('r', 0)
      .attr('fill', colorScale(d.ruleType))
      .attr('opacity', 0.8)
      .transition()
      .duration(500)
      .delay(i * 50)
      .attr('r', 8)

    gPoint.append('circle')
      .attr('r', 8)
      .attr('fill', 'none')
      .attr('stroke', colorScale(d.ruleType))
      .attr('stroke-width', 2)
      .attr('opacity', 0)
      .transition()
      .duration(500)
      .delay(i * 50 + 300)
      .attr('r', 12)
      .attr('opacity', 0.5)
      .transition()
      .duration(300)
      .attr('r', 10)
      .attr('opacity', 0.3)

    gPoint.on('mouseenter', function(event) {
      const tooltip = svg.append('g')
        .attr('class', 'tooltip')
        .attr('transform', `translate(${x + margin.left + 15}, ${y + margin.top - 40})`)

      const bg = tooltip.append('rect')
        .attr('rx', 4)
        .attr('fill', 'rgba(0,0,0,0.8)')

      const text1 = tooltip.append('text')
        .attr('y', 18)
        .attr('font-size', '12px')
        .attr('fill', 'white')
        .text(d.ruleName)

      const text2 = tooltip.append('text')
        .attr('y', 36)
        .attr('font-size', '11px')
        .attr('fill', '#d9d9d9')
        .text(`版本: ${d.version || '-'} | ${d.ruleType}`)

      const bbox = tooltip.node().getBBox()
      bg.attr('width', bbox.width + 16)
        .attr('height', bbox.height + 12)
        .attr('x', -8)
        .attr('y', -6)

      gPoint._tooltip = tooltip
    })
    .on('mouseleave', function() {
      if (gPoint._tooltip) {
        gPoint._tooltip.remove()
        gPoint._tooltip = null
      }
    })
  })

  const legend = g.append('g')
    .attr('class', 'legend')
    .attr('transform', `translate(10, -10)`)

  ruleTypes.forEach((type, i) => {
    const legendItem = legend.append('g')
      .attr('transform', `translate(${i * 100}, 0)`)

    legendItem.append('rect')
      .attr('width', 12)
      .attr('height', 12)
      .attr('rx', 6)
      .attr('fill', colorScale(type))

    legendItem.append('text')
      .attr('x', 18)
      .attr('y', 10)
      .attr('font-size', '11px')
      .attr('fill', '#595959')
      .text(type)
  })

  if (props.delayedBatches && props.delayedBatches.length > 0) {
    const delayY = chartHeight + 20

    props.delayedBatches.forEach((batch, i) => {
      const dates = []
      if (batch.expectedSyncTime) dates.push(new Date(batch.expectedSyncTime))
      if (batch.actualSyncTime) dates.push(new Date(batch.actualSyncTime))

      dates.forEach((date, j) => {
        const x = xScale(date)
        const label = j === 0 ? `预期:${batch.batchName}` : `实际:${batch.batchName}`
        const isActual = j > 0

        const delayG = g.append('g')
          .attr('transform', `translate(${x}, ${delayY + i * 24})`)

        delayG.append('line')
          .attr('x1', 0)
          .attr('x2', 0)
          .attr('y1', -chartHeight)
          .attr('y2', 0)
          .attr('stroke', isActual ? '#f5222d' : '#faad14')
          .attr('stroke-width', 1.5)
          .attr('stroke-dasharray', '4 3')
          .attr('opacity', 0.7)

        delayG.append('circle')
          .attr('r', 6)
          .attr('fill', isActual ? '#f5222d' : '#faad14')

        delayG.append('text')
          .attr('x', 8)
          .attr('y', 4)
          .attr('font-size', '10px')
          .attr('fill', isActual ? '#f5222d' : '#fa8c16')
          .attr('font-weight', '500')
          .text(`${label.substring(0, 14)}...`)
      })
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
