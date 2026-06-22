import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["form"]

  tabChange(event) {
    const target = event.currentTarget
    const tabId = target.dataset.tabTarget
    const container = target.closest("[data-tabs-container]")

    container.querySelectorAll("[data-tab-target]").forEach(el => {
      el.classList.remove("bg-blue-50", "text-blue-700", "border-blue-500")
      el.classList.add("text-gray-600", "border-transparent", "hover:text-gray-900")
    })
    target.classList.add("bg-blue-50", "text-blue-700", "border-blue-500")
    target.classList.remove("text-gray-600", "border-transparent")

    container.querySelectorAll("[data-tab-panel]").forEach(panel => {
      if (panel.dataset.tabPanel === tabId) {
        panel.classList.remove("hidden")
      } else {
        panel.classList.add("hidden")
      }
    })
  }
}
