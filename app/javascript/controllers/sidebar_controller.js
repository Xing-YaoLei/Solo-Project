import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["menu", "backdrop"]
  static values = {
    open: Boolean
  }

  connect() {
    this.updateClasses()
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.openValue) {
        this.close()
      }
    })
  }

  toggle() {
    this.openValue = !this.openValue
    this.updateClasses()
  }

  open() {
    this.openValue = true
    this.updateClasses()
  }

  close() {
    this.openValue = false
    this.updateClasses()
  }

  updateClasses() {
    if (this.hasMenuTarget) {
      if (this.openValue) {
        this.menuTarget.classList.remove("-translate-x-full")
        this.menuTarget.classList.add("translate-x-0")
      } else {
        this.menuTarget.classList.add("-translate-x-full")
        this.menuTarget.classList.remove("translate-x-0")
      }
    }
    if (this.hasBackdropTarget) {
      this.backdropTarget.classList.toggle("hidden", !this.openValue)
    }
    document.body.classList.toggle("overflow-hidden", this.openValue)
  }
}
