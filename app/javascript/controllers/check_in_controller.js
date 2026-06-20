import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  submitOnEnter(event) {
    if (event.key === "Enter") {
      event.preventDefault()
      this.element.closest("form").requestSubmit()
    }
  }
}
