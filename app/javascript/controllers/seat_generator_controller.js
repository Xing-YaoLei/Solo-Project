import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["seatInput", "preview"]

  connect() {
    this.updatePreview()
  }

  updatePreview() {
    if (!this.hasPreviewTarget) return

    const rows = parseInt(this.seatInputTargets.find(t => t.dataset.field === "rows")?.value) || 0
    const seatsPerRow = parseInt(this.seatInputTargets.find(t => t.dataset.field === "seats_per_row")?.value) || 0

    if (rows > 0 && seatsPerRow > 0) {
      this.previewTarget.innerHTML = `<p class="text-sm text-gray-500">将生成 ${rows} × ${seatsPerRow} = ${rows * seatsPerRow} 个座位</p>`
    }
  }
}
