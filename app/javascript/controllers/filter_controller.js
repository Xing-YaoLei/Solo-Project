import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["filter", "item"]
  static values = { filterAttr: String }

  filter() {
    const value = this.filterTarget.value

    this.itemTargets.forEach(item => {
      if (!value || item.dataset[this.filterAttrValue] === value) {
        item.style.display = ""
      } else {
        item.style.display = "none"
      }
    })
  }
}
