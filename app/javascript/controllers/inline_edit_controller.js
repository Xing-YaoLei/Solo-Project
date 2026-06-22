import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = [
    "viewMode", "editMode",
    "inputName", "inputValue"
  ]
  static values = {
    saveUrl: String,
    fieldName: String,
    inlineError: String
  }

  edit() {
    if (this.hasViewModeTarget) this.viewModeTarget.classList.add("hidden")
    if (this.hasEditModeTarget) {
      this.editModeTarget.classList.remove("hidden")
      const input = this.editModeTarget.querySelector("input, select, textarea")
      input?.focus()
      input?.select?.()
    }
  }

  cancel() {
    if (this.hasViewModeTarget) this.viewModeTarget.classList.remove("hidden")
    if (this.hasEditModeTarget) this.editModeTarget.classList.add("hidden")
  }

  save() {
    const input = this.editModeTarget.querySelector("input, select, textarea")
    if (!input || !this.saveUrlValue) {
      this.cancel()
      return
    }

    const formData = new FormData()
    const fieldName = this.fieldNameValue || input.name
    formData.append(fieldName, input.value)

    fetch(this.saveUrlValue, {
      method: "PATCH",
      headers: {
        "X-CSRF-Token": document.querySelector("meta[name='csrf-token']")?.content,
        "Accept": "text/vnd.turbo-stream.html"
      },
      body: formData
    })
      .then(response => response.text())
      .then(text => {
        Turbo.renderStreamMessage(text)
      })
      .catch(error => {
        console.error("Save failed:", error)
        alert(this.inlineErrorValue || "保存失败")
      })
  }
}
