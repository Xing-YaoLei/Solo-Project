import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["rule", "input", "result"]

  connect() {
    this.debounceTimer = null
  }

  apply(event) {
    const filterId = event.currentTarget.dataset.filterId
    const button = event.currentTarget

    button.style.transform = 'scale(0.95)'
    setTimeout(() => {
      button.style.transform = 'scale(1)'
    }, 150)

    this.dispatch('apply', {
      detail: { filterId, timestamp: Date.now() }
    })

    this.showToast('筛选已应用')
  }

  toggleRule() {
    const enabledRules = this.ruleTargets
      .filter(r => r.checked)
      .map(r => r.value)

    this.dispatch('ruleChange', {
      detail: { enabledRules }
    })
  }

  search(event) {
    clearTimeout(this.debounceTimer)
    const query = event.target.value

    this.debounceTimer = setTimeout(() => {
      this.dispatch('search', {
        detail: { query }
      })
    }, 300)
  }

  reset() {
    this.ruleTargets.forEach(r => r.checked = false)
    this.inputTargets.forEach(i => i.value = '')

    this.dispatch('reset')
    this.showToast('筛选已重置')
  }

  showToast(message) {
    const toast = document.createElement('div')
    toast.className = 'fixed top-4 right-4 z-50 animate-slide-in'
    toast.innerHTML = `
      <div class="flex items-center gap-3 px-5 py-4 rounded-xl bg-[#10b981] text-white shadow-2xl">
        <i data-lucide="check-circle" class="w-6 h-6"></i>
        <p class="font-medium">${message}</p>
      </div>
    `
    document.body.appendChild(toast)

    if (window.lucide) {
      window.lucide.createIcons({ root: toast })
    }

    setTimeout(() => {
      toast.style.opacity = '0'
      toast.style.transform = 'translateX(100px)'
      toast.style.transition = 'all 0.3s ease'
      setTimeout(() => toast.remove(), 300)
    }, 2000)
  }
}
