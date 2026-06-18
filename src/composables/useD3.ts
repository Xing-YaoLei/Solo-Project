import { ref } from 'vue'
import type { Selection, ScaleLinear, ScaleBand } from 'd3'

export function useD3Chart() {
  const svgRef = ref<SVGSVGElement | null>(null)

  function getChartDimensions(
    container: HTMLElement,
    margin: { top: number; right: number; bottom: number; left: number }
  ) {
    const width = container.clientWidth - margin.left - margin.right
    const height = container.clientHeight - margin.top - margin.bottom
    return { width, height, margin }
  }

  function createSvg(
    selection: Selection<HTMLElement, unknown, null, undefined>,
    width: number,
    height: number,
    margin: { top: number; right: number; bottom: number; left: number }
  ) {
    selection.selectAll('*').remove()
    const svg = selection
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)
    return svg
  }

  function addGridLines(
    g: Selection<SVGGElement, unknown, null, undefined>,
    xScale: ScaleLinear<number, number> | ScaleBand<string>,
    yScale: ScaleLinear<number, number>,
    width: number,
    height: number,
    isXBand: boolean = false
  ) {
    const gridGroup = g.append('g').attr('class', 'grid')

    gridGroup
      .append('g')
      .attr('class', 'grid-y')
      .selectAll('line')
      .data(yScale.ticks(5))
      .join('line')
      .attr('x1', 0)
      .attr('x2', width)
      .attr('y1', (d) => yScale(d))
      .attr('y2', (d) => yScale(d))
      .attr('stroke', 'rgba(255,255,255,0.06)')
      .attr('stroke-dasharray', '3,3')

    if (!isXBand) {
      const linearX = xScale as ScaleLinear<number, number>
      gridGroup
        .append('g')
        .attr('class', 'grid-x')
        .selectAll('line')
        .data(linearX.ticks(6))
        .join('line')
        .attr('x1', (d) => linearX(d))
        .attr('x2', (d) => linearX(d))
        .attr('y1', 0)
        .attr('y2', height)
        .attr('stroke', 'rgba(255,255,255,0.06)')
        .attr('stroke-dasharray', '3,3')
    }
  }

  function addTooltip(
    g: Selection<SVGGElement, unknown, null, undefined>,
    container: HTMLElement
  ) {
    const tooltip = container.querySelector('.chart-tooltip') as HTMLElement
    if (!tooltip) return null

    return {
      show: (html: string, x: number, y: number) => {
        tooltip.innerHTML = html
        tooltip.style.opacity = '1'
        const rect = container.getBoundingClientRect()
        const tooltipRect = tooltip.getBoundingClientRect()
        let left = x + 12
        let top = y - 12
        if (left + tooltipRect.width > rect.width) left = x - tooltipRect.width - 12
        if (top < 0) top = y + 12
        tooltip.style.left = `${left}px`
        tooltip.style.top = `${top}px`
      },
      hide: () => {
        tooltip.style.opacity = '0'
      },
    }
  }

  return {
    svgRef,
    getChartDimensions,
    createSvg,
    addGridLines,
    addTooltip,
  }
}
