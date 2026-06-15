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
    default: 500
  },
  height: {
    type: Number,
    default: 350
  },
  labelKey: {
    type: String,
    default: 'studentNo'
  },
  valueKey: {
    type: String,
    default: 'avgScore'
  },
  rankKey: {
    type: String,
    default: 'rank'
  },
  type: {
    type: String,
    default: 'desc'
  }
})

const chartRef = ref(null)

const getColor = (rank, type) => {
  if (type === 'desc') {
    if (rank <= 3) return '#f5222d'
    if (rank <= 10) return '#fa8c16'
    return '#52c41a'
  } else {
    if (rank <= 3) return '#f5222d'
    if (rank <= 10) return '#faad14'
    return '#fa8c16'
  }
}

const renderChart = () => {
  if (!chartRef.value || !props.data.length) return

  d3.select(chartRef.value).selectAll('*').remove()

  const containerWidth = chartRef.value.clientWidth || props.width
  const containerHeight = props.height
  const margin = { top: 20, right: 40, bottom: 30, left: 80 }
  const chartWidth = containerWidth - margin.left - margin.right
  const chartHeight = containerHeight - margin.top - margin.bottom

  const svg = d3.select(chartRef.value)
    .append('svg')
    .attr('width', containerWidth)
    .attr('height', containerHeight)

  const g = svg.append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top})`)

  const maxValue = d3.max(props.data, d => Number(d[props.valueKey])) || 100
  const xScale = d3.scaleLinear()
    .domain([0, maxValue * 1.1])
    .range([0, chartWidth])

  const yScale = d3.scaleBand()
    .domain(props.data.map((d, i) => i))
    .range([0, chartHeight])
    .padding(0.2)

  const xAxis = d3.axisBottom(xScale)
    .ticks(5)

  g.append('g')
    .attr('transform', `translate(0, ${chartHeight})`)
    .attr('class', 'x-axis')
    .call(xAxis)
    .selectAll('text')
    .attr('font-size', '11px')
    .attr('fill', '#8c8c8c')

  g.selectAll('.x-axis path, .x-axis line')
    .attr('stroke', '#e8e8e8')

  const bars = g.selectAll('.bar')
    .data(props.data)
    .enter()
    .append('g')
    .attr('class', 'bar')

  bars.append('rect')
    .attr('x', 0)
    .attr('y', (d, i) => yScale(i))
    .attr('height', yScale.bandwidth())
    .attr('width', 0)
    .attr('rx', 4)
    .attr('fill', (d) => getColor(d[props.rankKey], props.type))
    .style('cursor', 'pointer')
    .transition()
    .duration(800)
    .delay((d, i) => i * 30)
    .attr('width', d => xScale(Number(d[props.valueKey])))

  bars.on('mouseenter', function(event, d) {
    d3.select(this).select('rect')
      .transition()
      .duration(200)
      .attr('opacity', 0.8)
  })
  .on('mouseleave', function() {
    d3.select(this).select('rect')
      .transition()
      .duration(200)
      .attr('opacity', 1)
  })

  bars.append('text')
    .attr('x', -10)
    .attr('y', (d, i) => yScale(i) + yScale.bandwidth() / 2 + 4)
    .attr('text-anchor', 'end')
    .attr('font-size', '11px')
    .attr('fill', '#595959')
    .text(d => {
      const label = String(d[props.labelKey])
      return label.length > 8 ? label.substring(0, 8) + '...' : label
    })

  bars.append('text')
    .attr('x', d => xScale(Number(d[props.valueKey])) + 5)
    .attr('y', (d, i) => yScale(i) + yScale.bandwidth() / 2 + 4)
    .attr('font-size', '11px')
    .attr('fill', '#8c8c8c')
    .text(d => Number(d[props.valueKey]).toFixed(1))

  bars.each((d, i, nodes) => {
    if (d[props.rankKey] <= 3) {
      const rankBadge = g.append('g')
        .attr('transform', `translate(-30, ${yScale(i) + yScale.bandwidth() / 2 - 10})`)

      rankBadge.append('circle')
        .attr('r', 10)
        .attr('fill', d[props.rankKey] === 1 ? '#fadb14' :
                     d[props.rankKey] === 2 ? '#d9d9d9' : '#d46b08')

      rankBadge.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', 4)
        .attr('font-size', '11px')
        .attr('font-weight', 'bold')
        .attr('fill', 'white')
        .text(d[props.rankKey])
    }
  })

  if (props.delayedBatches && props.delayedBatches.length > 0) {
    const delayX = margin.left
    const delayY = containerHeight - 16 - props.delayedBatches.length * 22

    const delayGroup = svg.append('g')
      .attr('class', 'delay-markers')
      .attr('transform', `translate(${delayX}, ${delayY})`)

    props.delayedBatches.forEach((batch, i) => {
      const delayItem = delayGroup.append('g')
        .attr('transform', `translate(0, ${i * 22})`)

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
        .text(`⚠ ${batch.batchName} - 预期 ${batch.expectedSyncTime?.substring?.(5, 16) || '-'}`)
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
  min-height: 350px;
}
</style>
