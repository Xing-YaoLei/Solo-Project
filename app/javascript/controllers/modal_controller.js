import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  connect() {
    this.escapeHandler = (e) => {
      if (e.key === "Escape") this.closeAll()
    }
    document.addEventListener("keydown", this.escapeHandler)

    this.element.querySelectorAll("[data-modal-backdrop]").forEach((el) => {
      el.addEventListener("click", (e) => {
        if (e.target === el) {
          const modal = el.closest("[data-modal]")
          if (modal) this.hideModal(modal)
        }
      })
    })

    this.element.querySelectorAll("[data-modal-close]").forEach((el) => {
      el.addEventListener("click", () => {
        const modal = el.closest("[data-modal]")
        if (modal) this.hideModal(modal)
      })
    })
  }

  disconnect() {
    document.removeEventListener("keydown", this.escapeHandler)
  }

  openBy(event) {
    const trigger = event.currentTarget
    const modalId = trigger.dataset.modalId
    if (modalId) {
      const modal = document.getElementById(modalId)
      if (modal) this.showModal(modal)
    }
  }

  closeBy(event) {
    const trigger = event.currentTarget
    const modalId = trigger.dataset.modalId
    const modal = modalId ? document.getElementById(modalId) : trigger.closest("[data-modal]")
    if (modal) this.hideModal(modal)
  }

  showModal(modal) {
    modal.classList.remove("hidden")
    document.body.style.overflow = "hidden"
    modal.dispatchEvent(new CustomEvent("modal:opened", { bubbles: true, detail: { modal } }))
  }

  hideModal(modal) {
    modal.classList.add("hidden")
    document.body.style.overflow = ""
    modal.dispatchEvent(new CustomEvent("modal:closed", { bubbles: true, detail: { modal } }))
  }

  closeAll() {
    document.querySelectorAll("[data-modal]:not(.hidden)").forEach((modal) => {
      this.hideModal(modal)
    })
  }
}
