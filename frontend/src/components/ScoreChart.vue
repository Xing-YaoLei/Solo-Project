<template>
  <div class="score-chart">
    <el-row :gutter="16" class="stat-cards">
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-label">平均分</div>
          <div class="stat-value">{{ stats.avgScore ?? '--' }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-label">最高分</div>
          <div class="stat-value max">{{ stats.maxScore ?? '--' }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-label">最低分</div>
          <div class="stat-value min">{{ stats.minScore ?? '--' }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-label">退费率</div>
          <div class="stat-value drop">{{ stats.dropRate != null ? stats.dropRate + '%' : '--' }}</div>
        </el-card>
      </el-col>
    </el-row>
    <div ref="chartRef" class="chart-container"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, onBeforeUnmount } from 'vue'
import * as d3 from 'd3'
import request from '../api/index.js'

const props = defineProps({
  enrollmentId: { type: Number, required: true },
})

const chartRef = ref(null)
const stats = ref({ avgScore: null, maxScore: null, minScore: null, dropRate: null })

const colorMap = {
  exam: '#409EFF',
  quiz: '#67C23A',
  homework: '#E6A23C',
  overall: '#F56C6C',
}

const labelMap = {
  exam: '考试',
  quiz: '测验',
  homework: '作业',
  overall: '综合',
}

let resizeObserver = null

async function fetchData() {
  const res = await request.get(`/score/${props.enrollmentId}`)
  return res
}

function renderChart(records) {
  if (!chartRef.value) return

  const container = chartRef.value
  d3.select(container).selectAll('*').remove()

  const margin = { top: 30, right: 30, bottom: 40, left: 50 }
  const width = container.clientWidth - margin.left - margin.right
  const height = 360 - margin.top - margin.bottom

  const svg = d3
    .select(container)
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`)

  const grouped = d3.group(records, (d) => d.scoreType)
  const types = Object.keys(colorMap).filter((t) => grouped.has(t))

  if (types.length === 0) return

  const allDates = records.map((d) => new Date(d.recordedAt))
  const xScale = d3
    .scaleTime()
    .domain(d3.extent(allDates))
    .range([0, width])

  const allScores = records.map((d) => d.score)
  const yScale = d3
    .scaleLinear()
    .domain([d3.min(allScores) * 0.9, d3.max(allScores) * 1.05])
    .range([height, 0])

  svg
    .append('g')
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(xScale).ticks(6).tickFormat(d3.timeFormat('%m-%d')))

  svg.append('g').call(d3.axisLeft(yScale).ticks(6))

  svg
    .append('text')
    .attr('x', width / 2)
    .attr('y', height + 35)
    .attr('text-anchor', 'middle')
    .attr('fill', '#999')
    .attr('font-size', 12)
    .text('记录时间')

  svg
    .append('text')
    .attr('transform', 'rotate(-90)')
    .attr('x', -height / 2)
    .attr('y', -40)
    .attr('text-anchor', 'middle')
    .attr('fill', '#999')
    .attr('font-size', 12)
    .text('分数')

  const line = d3
    .line()
    .x((d) => xScale(new Date(d.recordedAt)))
    .y((d) => yScale(d.score))
    .curve(d3.curveMonotoneX)

  types.forEach((type) => {
    const data = grouped.get(type).sort((a, b) => new Date(a.recordedAt) - new Date(b.recordedAt))

    svg
      .append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', colorMap[type])
      .attr('stroke-width', 2)
      .attr('d', line)

    svg
      .selectAll(`.dot-${type}`)
      .data(data)
      .enter()
      .append('circle')
      .attr('cx', (d) => xScale(new Date(d.recordedAt)))
      .attr('cy', (d) => yScale(d.score))
      .attr('r', 3.5)
      .attr('fill', colorMap[type])
  })

  const legend = svg
    .append('g')
    .attr('transform', `translate(${width - 160}, -20)`)

  types.forEach((type, i) => {
    const g = legend.append('g').attr('transform', `translate(${i * 70}, 0)`)
    g.append('rect').attr('width', 12).attr('height', 3).attr('y', -1.5).attr('fill', colorMap[type])
    g.append('text').attr('x', 16).attr('y', 4).attr('font-size', 11).attr('fill', '#666').text(labelMap[type])
  })
}

async function load() {
  try {
    const data = await fetchData()
    const records = data.dataPoints ?? data.records ?? data ?? []
    stats.value = {
      avgScore: data.avgScore ?? null,
      maxScore: data.maxScore ?? null,
      minScore: data.minScore ?? null,
      dropRate: data.dropRate ?? null,
    }
    renderChart(records)
  } catch (e) {
    console.error('ScoreChart fetch error', e)
  }
}

onMounted(() => {
  load()
  resizeObserver = new ResizeObserver(() => {
    load()
  })
  if (chartRef.value) resizeObserver.observe(chartRef.value)
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
})

watch(() => props.enrollmentId, load)
</script>

<style scoped>
.score-chart {
  padding: 16px;
}
.stat-cards {
  margin-bottom: 16px;
}
.stat-label {
  font-size: 13px;
  color: #909399;
  margin-bottom: 4px;
}
.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}
.stat-value.max {
  color: #67C23A;
}
.stat-value.min {
  color: #E6A23C;
}
.stat-value.drop {
  color: #F56C6C;
}
.chart-container {
  width: 100%;
  min-height: 360px;
}
</style>
