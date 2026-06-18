<template>
  <div ref="containerRef" class="funnel-chart-container">
    <svg ref="svgRef" class="funnel-svg"></svg>
    <div ref="tooltipRef" class="funnel-tooltip" v-show="tooltip.visible">
      <div class="tooltip-title">{{ tooltip.data?.name }}</div>
      <div class="tooltip-row">
        <span>数量:</span>
        <span class="value">{{ tooltip.data?.count }}</span>
      </div>
      <div class="tooltip-row">
        <span>阶段转化率:</span>
        <span class="value">{{ tooltip.data?.conversionRate }}%</span>
      </div>
      <div v-if="tooltip.data?.avgDays !== undefined" class="tooltip-row">
        <span>平均停留天数:</span>
        <span class="value">{{ tooltip.data?.avgDays }} 天</span>
      </div>
      <div v-if="tooltip.data?.missingDetectorCount" class="tooltip-row warning">
        <el-icon><Warning /></el-icon>
        <span>检测仪缺失: {{ tooltip.data?.missingDetectorCount }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import * as d3 from 'd3'

const props = defineProps({
  stages: {
    type: Array,
    default: () => []
  },
  anomalies: {
    type: Array,
    default: () => []
  },
  selectedStage: {
    type: Number,
    default: null
  },
  width: {
    type: Number,
    default: 800
  },
  height: {
    type: Number,
    default: 500
  }
})

const emit = defineEmits(['stage-click', 'anomaly-click'])

const containerRef = ref(null)
const svgRef = ref(null)
const tooltipRef = ref(null)

const tooltip = ref({
  visible: false,
  data: null,
  x: 0,
  y: 0
})

const COLORS = ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de']
const ANOMALY_COLOR = 'rgba(245, 108, 108, 0.18)'
const ANOMALY_BORDER = '#f56c6c'

let svg = null
let resizeObserver = null

function initChart() {
  if (!svgRef.value || props.stages.length === 0) return

  const containerWidth = containerRef.value?.clientWidth || props.width
  const chartWidth = Math.min(containerWidth - 40, props.width)
  const chartHeight = props.height

  d3.select(svgRef.value).selectAll('*').remove()

  svg = d3.select(svgRef.value)
    .attr('width', chartWidth)
    .attr('height', chartHeight)
    .attr('viewBox', `0 0 ${chartWidth} ${chartHeight}`)

  const margin = { top: 40, right: 120, bottom: 40, left: 120 }
  const width = chartWidth - margin.left - margin.right
  const height = chartHeight - margin.top - margin.bottom

  const g = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`)

  const stageCount = props.stages.length
  const stageHeight = height / stageCount
  const maxCount = d3.max(props.stages, d => d.count) || 1

  const anomalyRanges = props.anomalies.map(a => ({
    ...a,
    minStage: Math.min(...a.stageRange),
    maxStage: Math.max(...a.stageRange)
  }))

  const funnelWidths = props.stages.map(d => {
    const ratio = d.count / maxCount
    return width * (0.35 + 0.65 * ratio)
  })

  anomalyRanges.forEach(anomaly => {
    const yMin = anomaly.minStage * stageHeight - 4
    const yMax = (anomaly.maxStage + 1) * stageHeight + 4
    const rectWidth = Math.max(...funnelWidths.slice(anomaly.minStage, anomaly.maxStage + 1)) + 20
    const xStart = (width - rectWidth) / 2 - 10

    g.append('rect')
      .attr('class', 'anomaly-rect')
      .attr('x', xStart)
      .attr('y', yMin)
      .attr('width', rectWidth + 20)
      .attr('height', yMax - yMin)
      .attr('fill', ANOMALY_COLOR)
      .attr('stroke', ANOMALY_BORDER)
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '6,4')
      .attr('rx', 6)
      .style('cursor', 'pointer')
      .on('click', (event) => {
        event.stopPropagation()
        emit('anomaly-click', anomaly)
      })
  })

  props.stages.forEach((stage, i) => {
    const currentWidth = funnelWidths[i]
    const nextWidth = i < stageCount - 1 ? funnelWidths[i + 1] : currentWidth * 0.6
    const y = i * stageHeight
    const centerX = width / 2

    const topLeft = centerX - currentWidth / 2
    const topRight = centerX + currentWidth / 2
    const bottomLeft = centerX - nextWidth / 2
    const bottomRight = centerX + nextWidth / 2

    const pathData = [
      `M ${topLeft} ${y}`,
      `L ${topRight} ${y}`,
      `L ${bottomRight} ${y + stageHeight}`,
      `L ${bottomLeft} ${y + stageHeight}`,
      'Z'
    ].join(' ')

    const stageG = g.append('g')
      .attr('class', `stage-group stage-${i}`)
      .style('cursor', 'pointer')

    stageG.append('path')
      .attr('d', pathData)
      .attr('fill', COLORS[i % COLORS.length])
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .attr('opacity', props.selectedStage === null || props.selectedStage === i ? 1 : 0.4)
      .on('mouseenter', (event) => showTooltip(event, stage))
      .on('mousemove', moveTooltip)
      .on('mouseleave', hideTooltip)
      .on('click', () => {
        emit('stage-click', i, stage)
      })

    if (props.selectedStage === i) {
      stageG.append('path')
        .attr('d', pathData)
        .attr('fill', 'none')
        .attr('stroke', '#303133')
        .attr('stroke-width', 3)
        .attr('filter', 'drop-shadow(0 0 6px rgba(64,158,255,0.6))')
    }

    const textY = y + stageHeight / 2
    stageG.append('text')
      .attr('x', centerX)
      .attr('y', textY - 10)
      .attr('text-anchor', 'middle')
      .attr('fill', '#fff')
      .attr('font-size', '16px')
      .attr('font-weight', '600')
      .style('pointer-events', 'none')
      .text(stage.name)

    stageG.append('text')
      .attr('x', centerX)
      .attr('y', textY + 14)
      .attr('text-anchor', 'middle')
      .attr('fill', '#fff')
      .attr('font-size', '13px')
      .style('pointer-events', 'none')
      .text(`${stage.count} 辆 · ${stage.conversionRate}%`)

    g.append('text')
      .attr('x', topLeft - 16)
      .attr('y', textY)
      .attr('text-anchor', 'end')
      .attr('dominant-baseline', 'middle')
      .attr('fill', '#606266')
      .attr('font-size', '12px')
      .text(`${i + 1}`)

    if (i < stageCount - 1) {
      const dropRate = ((props.stages[i + 1].count / (stage.count || 1)) * 100).toFixed(1)
      g.append('text')
        .attr('x', width + 40)
        .attr('y', y + stageHeight + 2)
        .attr('text-anchor', 'middle')
        .attr('fill', '#909399')
        .attr('font-size', '11px')
        .text(`↓ 流失 ${(100 - dropRate).toFixed(1)}%`)
    }
  })

  const legendY = height + 25
  const legend = g.append('g')
    .attr('transform', `translate(0, ${legendY})`)

  anomalyRanges.forEach((anomaly, idx) => {
    const config = anomaly.config || {}
    const lg = legend.append('g')
      .attr('transform', `translate(${idx * 200}, 0)`)
      .style('cursor', 'pointer')
      .on('click', () => emit('anomaly-click', anomaly))

    lg.append('rect')
      .attr('width', 14)
      .attr('height', 14)
      .attr('x', 0)
      .attr('y', -10)
      .attr('fill', ANOMALY_COLOR)
      .attr('stroke', ANOMALY_BORDER)
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '4,2')
      .attr('rx', 2)

    lg.append('text')
      .attr('x', 22)
      .attr('y', 1)
      .attr('fill', config.color || ANOMALY_BORDER)
      .attr('font-size', '12px')
      .attr('font-weight', '500')
      .text(config.label || anomaly.type)
  })
}

function showTooltip(event, data) {
  tooltip.value = {
    visible: true,
    data,
    x: event.pageX,
    y: event.pageY
  }
  nextTick(() => updateTooltipPosition(event))
}

function moveTooltip(event) {
  updateTooltipPosition(event)
}

function updateTooltipPosition(event) {
  if (!tooltipRef.value) return
  const rect = tooltipRef.value.getBoundingClientRect()
  const scrollX = window.pageXOffset || document.documentElement.scrollLeft
  const scrollY = window.pageYOffset || document.documentElement.scrollTop

  let x = event.clientX + scrollX + 15
  let y = event.clientY + scrollY + 15

  if (x + rect.width > window.innerWidth + scrollX - 10) {
    x = event.clientX + scrollX - rect.width - 15
  }
  if (y + rect.height > window.innerHeight + scrollY - 10) {
    y = event.clientY + scrollY - rect.height - 15
  }

  if (tooltipRef.value) {
    tooltipRef.value.style.left = x + 'px'
    tooltipRef.value.style.top = y + 'px'
  }
}

function hideTooltip() {
  tooltip.value.visible = false
}

function handleResize() {
  initChart()
}

onMounted(() => {
  initChart()
  if (containerRef.value && 'ResizeObserver' in window) {
    resizeObserver = new ResizeObserver(handleResize)
    resizeObserver.observe(containerRef.value)
  }
})

onBeforeUnmount(() => {
  if (resizeObserver && containerRef.value) {
    resizeObserver.unobserve(containerRef.value)
  }
})

watch(
  () => [props.stages, props.anomalies, props.selectedStage],
  () => {
    nextTick(initChart)
  },
  { deep: true }
)
</script>

<style lang="scss" scoped>
.funnel-chart-container {
  position: relative;
  width: 100%;
  min-height: 400px;

  .funnel-svg {
    display: block;
    margin: 0 auto;
  }

  .funnel-tooltip {
    position: absolute;
    background: rgba(50, 50, 50, 0.95);
    color: #fff;
    padding: 12px 16px;
    border-radius: 8px;
    font-size: 13px;
    pointer-events: none;
    z-index: 9999;
    min-width: 180px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);

    .tooltip-title {
      font-size: 15px;
      font-weight: 600;
      margin-bottom: 8px;
      padding-bottom: 6px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.2);
    }

    .tooltip-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      margin-top: 4px;

      .value {
        font-weight: 500;
        color: #409eff;
      }

      &.warning {
        color: #e6a23c;
        margin-top: 8px;
        justify-content: flex-start;
        gap: 4px;
      }
    }
  }
}
</style>
