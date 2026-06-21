import { Controller } from "@hotwired/stimulus"
import * as echarts from 'echarts'

export default class extends Controller {
  static values = {
    type: String,
    data: Object,
    options: Object
  }

  connect() {
    this.chart = echarts.init(this.element)
    this.render()

    window.addEventListener('resize', this.handleResize)
  }

  disconnect() {
    window.removeEventListener('resize', this.handleResize)
    if (this.chart) {
      this.chart.dispose()
    }
  }

  handleResize = () => {
    if (this.chart) {
      this.chart.resize()
    }
  }

  render() {
    const option = this.getOption()
    this.chart.setOption(option)

    this.chart.on('click', (params) => {
      this.dispatch('click', { detail: params })
    })
  }

  getOption() {
    const baseOption = {
      color: ['#1e3a5f', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899'],
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        textStyle: {
          color: '#1f2937',
          fontSize: 12
        },
        padding: [12, 16],
        extraCssText: 'border-radius: 8px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);'
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '10%',
        containLabel: true
      }
    }

    switch (this.typeValue) {
      case 'line':
        return this.getLineOption(baseOption)
      case 'bar':
        return this.getBarOption(baseOption)
      case 'pie':
        return this.getPieOption(baseOption)
      case 'area':
        return this.getAreaOption(baseOption)
      default:
        return this.getLineOption(baseOption)
    }
  }

  getLineOption(baseOption) {
    return {
      ...baseOption,
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: this.dataValue.labels,
        axisLine: {
          lineStyle: { color: '#e5e7eb' }
        },
        axisLabel: {
          color: '#6b7280',
          fontSize: 11
        }
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        splitLine: {
          lineStyle: { color: '#f3f4f6', type: 'dashed' }
        },
        axisLabel: {
          color: '#6b7280',
          fontSize: 11,
          formatter: (value) => '¥' + (value / 10000).toFixed(0) + 'w'
        }
      },
      series: this.dataValue.series.map((s) => ({
        type: 'line',
        name: s.name,
        data: s.data,
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: {
          width: 3
        },
        itemStyle: {
          borderWidth: 2,
          borderColor: '#fff'
        }
      }))
    }
  }

  getBarOption(baseOption) {
    return {
      ...baseOption,
      xAxis: {
        type: 'category',
        data: this.dataValue.labels,
        axisLine: {
          lineStyle: { color: '#e5e7eb' }
        },
        axisLabel: {
          color: '#6b7280',
          fontSize: 11,
          rotate: this.dataValue.labels.length > 6 ? 30 : 0
        }
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        splitLine: {
          lineStyle: { color: '#f3f4f6', type: 'dashed' }
        },
        axisLabel: {
          color: '#6b7280',
          fontSize: 11
        }
      },
      series: this.dataValue.series.map((s) => ({
        type: 'bar',
        name: s.name,
        data: s.data,
        barWidth: '40%',
        borderRadius: [6, 6, 0, 0]
      }))
    }
  }

  getPieOption(baseOption) {
    return {
      ...baseOption,
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} ({d}%)',
        ...baseOption.tooltip
      },
      legend: {
        orient: 'vertical',
        right: '5%',
        top: 'center',
        itemGap: 12,
        textStyle: {
          color: '#6b7280',
          fontSize: 12
        }
      },
      series: [{
        type: 'pie',
        radius: ['45%', '70%'],
        center: ['35%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 8,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold',
            color: '#1e3a5f'
          },
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.2)'
          }
        },
        data: this.dataValue.data
      }]
    }
  }

  getAreaOption(baseOption) {
    const option = this.getLineOption(baseOption)
    option.series = option.series.map((s) => ({
      ...s,
      areaStyle: {
        opacity: 0.1
      }
    }))
    return option
  }

  update(data) {
    this.dataValue = data
    this.render()
  }
}
