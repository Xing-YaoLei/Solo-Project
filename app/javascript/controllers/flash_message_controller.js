import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["container"]
  static values = {
    autoDismiss: { type: Number, default: 5000 }
  }

  connect() {
    if (this.autoDismissValue > 0) {
      setTimeout(() => this.dismiss(), this.autoDismissValue)
    }
  }

  dismiss() {
    this.element.style.transition = "opacity 0.3s ease-out, transform 0.3s ease-out"
    this.element.style.opacity = "0"
    this.element.style.transform = "translateX(100%)"

    setTimeout(() => {
      this.element.remove()
    }, 300)
  }
}
