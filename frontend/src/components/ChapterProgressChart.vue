<template>
  <div class="chapter-progress-chart">
    <div class="chart-controls">
      <el-select v-model="selectedCourse" placeholder="选择课程" clearable @change="renderChart">
        <el-option v-for="c in courses" :key="c" :label="c" :value="c" />
      </el-select>
    </div>
    <div ref="chartRef" class="chart-container"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import * as d3 from 'd3'
import request from '../api/index.js'

const chartRef = ref(null)
const selectedCourse = ref('')
const courses = ref([])
const allData = ref([])

const stageColorMap = {
  in_course: '#409EFF',
  near_expire: '#E6A23C',
  reminded: '#F56C6C',
  negotiating: '#909399',
  renewed: '#67C23A',
  lost: '#C0C4CC',
}

const stageLabelMap = {
  in_course: '在读',
  near_expire: '临近到期',
  reminded: '已提醒',
  negotiating: '协商中',
  renewed: '已续费',
  lost: '已流失',
}

let resizeObserver = null

async function fetchData() {
  try {
    const res = await request.get('/chapter')
    const data = res.chapters ?? res ?? []
    allData.value = data
    const courseSet = [...new Set(data.map((d) => d.courseName).filter(Boolean))]
    courses.value = courseSet
    if (courseSet.length && !selectedCourse.value) {
      selectedCourse.value = courseSet[0]
    }
    renderChart()
  } catch (e) {
    console.error('ChapterProgressChart fetch error', e)
  }
}

function renderChart() {
  if (!chartRef.value) return

  const container = chartRef.value
  d3.select(container).selectAll('*').remove()

  let data = []
  if (selectedCourse.value) {
    const courseObj = allData.value.find((d) => d.courseName === selectedCourse.value)
    data = courseObj?.students ?? []
  } else {
    data = allData.value.flatMap((c) => c.students ?? [])
  }

  if (data.length === 0) {
    d3.select(container)
      .append('div')
      .style('text-align', 'center')
      .style('color', '#909399')
      .style('padding', '40px')
      .text('暂无数据')
    return
  }

  data.sort((a, b) => {
    const ratioA = (a.completionRate ?? 0) / 100
    const ratioB = (b.completionRate ?? 0) / 100
    return ratioA - ratioB
  })

  const margin = { top: 10, right: 140, bottom: 30, left: 120 }
  const barHeight = 26
  const barGap = 8
  const height = data.length * (barHeight + barGap) + margin.top + margin.bottom
  const width = container.clientWidth - margin.left - margin.right

  const svg = d3
    .select(container)
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', Math.max(height, 120))
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`)

  const xScale = d3.scaleLinear().domain([0, 1]).range([0, width])

  svg
    .append('g')
    .attr('transform', `translate(0,${data.length * (barHeight + barGap)})`)
    .call(d3.axisBottom(xScale).ticks(5).tickFormat(d3.format('.0%')))

  const yScale = d3
    .scaleBand()
    .domain(data.map((d) => d.studentName))
    .range([0, data.length * (barHeight + barGap)])
    .padding(0.1)

  svg
    .append('g')
    .call(d3.axisLeft(yScale).tickSize(0).tickPadding(8))
    .call((g) => g.select('.domain').remove())

  const groups = svg
    .selectAll('.bar-group')
    .data(data)
    .enter()
    .append('g')
    .attr('class', 'bar-group')
    .attr('transform', (d) => `translate(0,${yScale(d.studentName)})`)

  groups
    .append('rect')
    .attr('width', width)
    .attr('height', barHeight)
    .attr('rx', 4)
    .attr('fill', '#f5f7fa')

  groups
    .append('rect')
    .attr('width', (d) => xScale((d.completionRate ?? 0) / 100))
    .attr('height', barHeight)
    .attr('rx', 4)
    .attr('fill', (d) => stageColorMap[d.stage] || '#409EFF')

  groups
    .append('text')
    .attr('x', (d) => xScale((d.completionRate ?? 0) / 100) + 6)
    .attr('y', barHeight / 2)
    .attr('dy', '0.35em')
    .attr('font-size', 11)
    .attr('fill', '#606266')
    .text((d) => `${d.currentChapter ?? 0}章 (${(d.completionRate ?? 0)}%)`)

  groups
    .append('text')
    .attr('x', width + 8)
    .attr('y', barHeight / 2)
    .attr('dy', '0.35em')
    .attr('font-size', 11)
    .attr('fill', '#909399')
    .text((d) => stageLabelMap[d.stage] || d.stage)

  const legendData = Object.entries(stageLabelMap)
  const legend = svg
    .append('g')
    .attr('transform', `translate(${width - 260}, -5)`)

  legendData.forEach(([key, label], i) => {
    const g = legend.append('g').attr('transform', `translate(${i * 90}, 0)`)
    g.append('rect').attr('width', 10).attr('height', 10).attr('rx', 2).attr('fill', stageColorMap[key])
    g.append('text').attr('x', 14).attr('y', 9).attr('font-size', 11).attr('fill', '#666').text(label)
  })
}

onMounted(() => {
  fetchData()
  resizeObserver = new ResizeObserver(() => {
    renderChart()
  })
  if (chartRef.value) resizeObserver.observe(chartRef.value)
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
})
</script>

<style scoped>
.chapter-progress-chart {
  padding: 16px;
}
.chart-controls {
  margin-bottom: 16px;
}
.chart-container {
  width: 100%;
  min-height: 120px;
}
</style>
