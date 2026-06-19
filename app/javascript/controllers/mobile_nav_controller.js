import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["menu", "iconOpen", "iconClose", "button"]

  connect() {
    this.isOpen = false
  }

  toggle() {
    this.isOpen = !this.isOpen

    if (this.isOpen) {
      this.menuTarget.classList.remove("hidden")
      this.iconOpenTarget.classList.add("hidden")
      this.iconCloseTarget.classList.remove("hidden")
      this.buttonTarget.setAttribute("aria-expanded", "true")
    } else {
      this.menuTarget.classList.add("hidden")
      this.iconOpenTarget.classList.remove("hidden")
      this.iconCloseTarget.classList.add("hidden")
      this.buttonTarget.setAttribute("aria-expanded", "false")
    }
  }
}
