import "@hotwired/turbo-rails"
import "controllers"

function toggleItemForm() {
  const form = document.getElementById('item-form')
  if (form) {
    form.classList.toggle('hidden')
  }
}

function toggleProofForm() {
  const form = document.getElementById('proof-form')
  if (form) {
    form.classList.toggle('hidden')
  }
}

function toggleShortageForm() {
  const form = document.getElementById('shortage-form')
  if (form) {
    form.classList.toggle('hidden')
  }
}

window.toggleItemForm = toggleItemForm
window.toggleProofForm = toggleProofForm
window.toggleShortageForm = toggleShortageForm

document.addEventListener('turbo:load', function() {
  document.addEventListener('click', function(e) {
    const addFieldsLink = e.target.closest('a[data-fields]')
    if (addFieldsLink) {
      e.preventDefault()
      const time = new Date().getTime()
      const regexp = new RegExp(addFieldsLink.dataset.id, 'g')
      const fields = addFieldsLink.dataset.fields.replace(regexp, time)
      addFieldsLink.insertAdjacentHTML('beforebegin', fields)
    }

    const removeFieldsLink = e.target.closest('a.remove-fields')
    if (removeFieldsLink) {
      e.preventDefault()
      const fields = removeFieldsLink.closest('.pickup-item-fields')
      if (fields) {
        const destroyInput = fields.querySelector('input[name$="[_destroy]"]')
        if (destroyInput) {
          destroyInput.value = '1'
          fields.style.display = 'none'
        } else {
          fields.remove()
        }
      }
    }
  })
})
