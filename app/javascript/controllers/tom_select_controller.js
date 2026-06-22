import { Controller } from "@hotwired/stimulus"
import TomSelect from "tom-select"

export default class extends Controller {
  static values = {
    multiple: Boolean,
    options: Object
  }

  connect() {
    const config = {
      plugins: this.multipleValue ? ["remove_button", "checkbox_options"] : [],
      maxItems: this.multipleValue ? null : 1,
      sortField: {
        field: "text",
        direction: "asc"
      },
      ...this.optionsValue
    }

    this.tomSelect = new TomSelect(this.element, config)
  }

  disconnect() {
    if (this.tomSelect) {
      this.tomSelect.destroy()
    }
  }
}
