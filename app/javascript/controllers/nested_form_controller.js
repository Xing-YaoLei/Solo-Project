import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = [
    "materialsContainer", "materialTemplate", "materialsEmpty",
    "permissionsContainer", "permissionTemplate", "permissionsEmpty"
  ]

  connect() {
    this.updateEmptyState()
  }

  addMaterial() {
    const template = this.materialTemplateTarget.content.cloneNode(true)
    const newId = `material_${Date.now()}`
    template.innerHTML = template.innerHTML.replace(/NEW_MATERIAL_ID/g, newId)
    this.materialsContainerTarget.appendChild(template)
    this.updateEmptyState()
  }

  addPermission() {
    const template = this.permissionTemplateTarget.content.cloneNode(true)
    const newId = `permission_${Date.now()}`
    template.innerHTML = template.innerHTML.replace(/NEW_PERMISSION_ID/g, newId)
    this.permissionsContainerTarget.appendChild(template)
    this.updateEmptyState()
  }

  removeItem(event) {
    const btn = event.currentTarget
    const wrapper = btn.closest("[data-nested-form-item]")
    if (wrapper) {
      const destroyInput = wrapper.querySelector("input[name$='[_destroy]']")
      if (destroyInput) {
        destroyInput.value = "1"
        wrapper.classList.add("hidden")
      } else {
        wrapper.remove()
      }
      this.updateEmptyState()
    }
  }

  updateEmptyState() {
    if (this.hasMaterialsContainerTarget && this.hasMaterialsEmptyTarget) {
      const visible = this.materialsContainerTarget.querySelectorAll(
        ":scope > div:not(.hidden)"
      ).length === 0
      this.materialsEmptyTarget.classList.toggle("hidden", !visible)
    }
    if (this.hasPermissionsContainerTarget && this.hasPermissionsEmptyTarget) {
      const visible = this.permissionsContainerTarget.querySelectorAll(
        ":scope > div:not(.hidden)"
      ).length === 0
      this.permissionsEmptyTarget.classList.toggle("hidden", !visible)
    }
  }
}
