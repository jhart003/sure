import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["periodType", "startMonth", "varianceContent"]
  static values = {
    budgetPath: String
  }

  connect() {
    this.updateVariance()
  }

  updateVariance() {
    const periodType = this.periodTypeTarget.value
    const startMonth = this.startMonthTarget.value
    
    // Build URL with query parameters
    const url = new URL(window.location.href)
    url.searchParams.set("variance_period", periodType)
    url.searchParams.set("variance_start", startMonth)
    
    // Fetch updated variance data
    fetch(url, {
      headers: {
        "Accept": "text/vnd.turbo-stream.html",
        "X-Requested-With": "XMLHttpRequest"
      }
    })
    .catch(error => {
      console.error("Error updating variance:", error)
    })
  }
}
