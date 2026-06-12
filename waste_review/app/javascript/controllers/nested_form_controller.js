import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["container", "template", "destroy"]

  add(event) {
    event.preventDefault()
    const content = this.templateTarget.innerHTML.replace(/NEW_RECORD/g, new Date().getTime())
    this.containerTarget.insertAdjacentHTML("beforeend", content)
  }

  remove(event) {
    event.preventDefault()
    const item = event.target.closest("[data-new-record]")
    if (item.dataset.newRecord === "true") {
      item.remove()
    } else {
      item.style.display = "none"
      const destroyInput = item.querySelector("[data-nested-form-target='destroy']")
      if (destroyInput) destroyInput.value = "1"
    }
  }
}
