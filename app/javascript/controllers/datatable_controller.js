import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["table", "header", "row", "pagination"]
  static values = {
    page: { type: Number, default: 1 },
    perPage: { type: Number, default: 10 },
    sortColumn: String,
    sortDirection: { type: String, default: 'asc' }
  }

  connect() {
    this.currentPage = this.pageValue
    this.perPage = this.perPageValue
    this.sortColumn = this.sortColumnValue
    this.sortDirection = this.sortDirectionValue

    this.render()
  }

  sort(event) {
    const column = event.currentTarget.dataset.column
    const header = event.currentTarget

    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc'
    } else {
      this.sortColumn = column
      this.sortDirection = 'asc'
    }

    this.updateSortIcons(header)
    this.sortData()
    this.render()

    this.dispatch('sort', {
      detail: { column: this.sortColumn, direction: this.sortDirection }
    })
  }

  updateSortIcons(activeHeader) {
    this.headerTargets.forEach(h => {
      const icon = h.querySelector('.sort-icon')
      if (h === activeHeader) {
        icon.innerHTML = this.sortDirection === 'asc'
          ? '<i data-lucide="chevron-up" class="w-4 h-4"></i>'
          : '<i data-lucide="chevron-down" class="w-4 h-4"></i>'
      } else {
        icon.innerHTML = '<i data-lucide="chevrons-up-down" class="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity"></i>'
      }
    })

    if (window.lucide) {
      window.lucide.createIcons({ root: this.element })
    }
  }

  sortData() {
    const rows = Array.from(this.rowTargets)
    rows.sort((a, b) => {
      const aVal = a.dataset[this.sortColumn] || ''
      const bVal = b.dataset[this.sortColumn] || ''

      let comparison = 0
      if (!isNaN(parseFloat(aVal)) && !isNaN(parseFloat(bVal))) {
        comparison = parseFloat(aVal) - parseFloat(bVal)
      } else {
        comparison = aVal.localeCompare(bVal, 'zh-CN')
      }

      return this.sortDirection === 'asc' ? comparison : -comparison
    })

    const tbody = this.tableTarget.querySelector('tbody')
    rows.forEach(row => tbody.appendChild(row))
  }

  goToPage(event) {
    const page = parseInt(event.currentTarget.dataset.page)
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page
      this.render()
      this.dispatch('pageChange', { detail: { page: this.currentPage } })
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++
      this.render()
      this.dispatch('pageChange', { detail: { page: this.currentPage } })
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--
      this.render()
      this.dispatch('pageChange', { detail: { page: this.currentPage } })
    }
  }

  render() {
    const start = (this.currentPage - 1) * this.perPage
    const end = start + this.perPage
    const totalRows = this.rowTargets.length
    this.totalPages = Math.ceil(totalRows / this.perPage)

    this.rowTargets.forEach((row, index) => {
      if (index >= start && index < end) {
        row.style.display = ''
        row.style.animation = `fadeInUp 0.3s ease forwards ${(index - start) * 50}ms`
        row.style.opacity = '0'
      } else {
        row.style.display = 'none'
      }
    })

    this.renderPagination()
  }

  renderPagination() {
    if (!this.hasPaginationTarget) return

    let html = `
      <div class="flex items-center justify-between px-4 py-3">
        <div class="text-sm text-gray-500">
          显示 ${(this.currentPage - 1) * this.perPage + 1} - ${Math.min(this.currentPage * this.perPage, this.rowTargets.length)} 条，
          共 ${this.rowTargets.length} 条
        </div>
        <div class="flex items-center gap-1">
    `

    if (this.currentPage > 1) {
      html += `
        <button data-action="click->datatable#prevPage"
                class="px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors">
          <i data-lucide="chevron-left" class="w-4 h-4"></i>
        </button>
      `
    }

    const visiblePages = this.getVisiblePages()
    visiblePages.forEach(page => {
      if (page === '...') {
        html += '<span class="px-3 py-2 text-gray-400">...</span>'
      } else if (page === this.currentPage) {
        html += `<span class="px-4 py-2 rounded-lg bg-[#1e3a5f] text-white font-medium">${page}</span>`
      } else {
        html += `
          <button data-action="click->datatable#goToPage" data-page="${page}"
                  class="px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors font-medium">
            ${page}
          </button>
        `
      }
    })

    if (this.currentPage < this.totalPages) {
      html += `
        <button data-action="click->datatable#nextPage"
                class="px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors">
          <i data-lucide="chevron-right" class="w-4 h-4"></i>
        </button>
      `
    }

    html += '</div></div>'
    this.paginationTarget.innerHTML = html

    if (window.lucide) {
      window.lucide.createIcons({ root: this.paginationTarget })
    }
  }

  getVisiblePages() {
    const total = this.totalPages
    const current = this.currentPage

    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1)
    }

    const pages = []
    pages.push(1)

    if (current > 4) {
      pages.push('...')
    }

    for (let i = Math.max(2, current - 2); i <= Math.min(total - 1, current + 2); i++) {
      pages.push(i)
    }

    if (current < total - 3) {
      pages.push('...')
    }

    pages.push(total)
    return pages
  }
}
