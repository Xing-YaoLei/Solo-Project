import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["toggle", "menu"]
  static values = { open: Boolean }

  connect() {
    document.addEventListener("click", (e) => this.handleOutsideClick(e))
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.openValue) this.close()
    })
  }

  disconnect() {
    document.removeEventListener("click", (e) => this.handleOutsideClick(e))
  }

  toggle(e) {
    e?.stopPropagation()
    this.openValue = !this.openValue
    this.updateMenu()
  }

  open() {
    this.openValue = true
    this.updateMenu()
  }

  close() {
    this.openValue = false
    this.updateMenu()
  }

  updateMenu() {
    if (!this.hasMenuTarget) return

    if (this.openValue) {
      this.menuTarget.classList.remove("hidden", "opacity-0", "scale-95")
      this.menuTarget.classList.add("opacity-100", "scale-100")
    } else {
      this.menuTarget.classList.add("hidden", "opacity-0", "scale-95")
      this.menuTarget.classList.remove("opacity-100", "scale-100")
    }
  }

  handleOutsideClick(e) {
    if (!this.openValue) return
    if (this.element.contains(e.target)) return
    if (this.hasToggleTarget && this.toggleTarget.contains(e.target)) return
    this.close()
  }
}
