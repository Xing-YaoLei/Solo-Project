<template>
  <div ref="chartRef" style="width: 100%; height: 350px;"></div>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue'
import * as echarts from 'echarts'

const props = defineProps({
  data: { type: Array, default: () => [] }
})

const chartRef = ref(null)
let chartInstance = null

function renderChart() {
  if (!chartRef.value) return
  if (!chartInstance) {
    chartInstance = echarts.init(chartRef.value)
  }

  const categories = props.data.map(d => d.category)
  const totals = props.data.map(d => d.total)
  const converted = props.data.map(d => d.converted)
  const rates = props.data.map(d => Number(d.rate).toFixed(1))

  chartInstance.setOption({
    tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } },
    legend: { data: ['总线索数', '转化数', '转化率(%)'] },
    grid: { left: 60, right: 60, bottom: 40, top: 50 },
    xAxis: { type: 'category', data: categories },
    yAxis: [
      { type: 'value', name: '线索数', minInterval: 1 },
      { type: 'value', name: '转化率(%)', min: 0, max: 100 }
    ],
    series: [
      {
        name: '总线索数', type: 'bar', data: totals,
        itemStyle: { color: '#409eff' }
      },
      {
        name: '转化数', type: 'bar', data: converted,
        itemStyle: { color: '#67c23a' }
      },
      {
        name: '转化率(%)', type: 'line', yAxisIndex: 1, data: rates,
        itemStyle: { color: '#e6a23c' }, lineStyle: { width: 2 },
        symbol: 'circle', symbolSize: 8
      }
    ]
  })
}

onMounted(() => {
  renderChart()
})

watch(() => props.data, () => {
  renderChart()
}, { deep: true })
</script>
