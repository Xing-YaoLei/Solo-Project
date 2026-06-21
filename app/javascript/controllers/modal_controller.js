import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["container", "backdrop", "panel"]
  static values = { open: Boolean }

  connect() {
    if (this.openValue) {
      this.open()
    }
    this.escapeHandler = (e) => {
      if (e.key === "Escape") this.close()
    }
  }

  open() {
    this.containerTarget.classList.remove("hidden")
    document.body.style.overflow = "hidden"
    document.addEventListener("keydown", this.escapeHandler)

    requestAnimationFrame(() => {
      this.backdropTarget.style.opacity = "1"
      this.panelTarget.style.transform = "scale(1)"
      this.panelTarget.style.opacity = "1"
    })

    this.dispatch("open")
  }

  close() {
    this.backdropTarget.style.opacity = "0"
    this.panelTarget.style.transform = "scale(0.95)"
    this.panelTarget.style.opacity = "0"

    setTimeout(() => {
      this.containerTarget.classList.add("hidden")
      document.body.style.overflow = ""
      document.removeEventListener("keydown", this.escapeHandler)
    }, 300)

    this.dispatch("close")
  }

  toggle() {
    if (this.containerTarget.classList.contains("hidden")) {
      this.open()
    } else {
      this.close()
    }
  }
}
