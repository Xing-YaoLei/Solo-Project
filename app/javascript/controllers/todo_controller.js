import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static values = { id: Number }

  toggle() {
    const checkbox = this.element.querySelector('button')
    const title = this.element.querySelector('h4')

    if (checkbox.classList.contains('border-gray-300')) {
      checkbox.classList.remove('border-gray-300', 'hover:border-[#1e3a5f]')
      checkbox.classList.add('bg-[#10b981]', 'border-[#10b981]')
      checkbox.innerHTML = '<i data-lucide="check" class="w-4 h-4 text-white"></i>'
      title.classList.add('line-through', 'text-gray-400')

      if (window.lucide) {
        window.lucide.createIcons({ root: checkbox })
      }

      this.dispatch('complete', { detail: { id: this.idValue, completed: true } })
    } else {
      checkbox.classList.remove('bg-[#10b981]', 'border-[#10b981]')
      checkbox.classList.add('border-gray-300', 'hover:border-[#1e3a5f]')
      checkbox.innerHTML = ''
      title.classList.remove('line-through', 'text-gray-400')

      this.dispatch('complete', { detail: { id: this.idValue, completed: false } })
    }

    this.element.style.transition = 'all 0.3s ease'
    this.element.style.transform = 'scale(0.98)'
    setTimeout(() => {
      this.element.style.transform = 'scale(1)'
    }, 150)
  }
}
