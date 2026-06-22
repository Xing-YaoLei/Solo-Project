// Entry point for JavaScript build
import "@hotwired/turbo-rails"
import "./controllers"
import "tom-select"
import "chartkick"
import "chart.js"
import "@rails/activestorage"
import "@rails/ujs"

document.addEventListener("turbo:load", () => {
  console.log("Compliance Audit Platform loaded")
})
