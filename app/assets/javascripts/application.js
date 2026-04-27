//
// For guidance on how to add JavaScript see:
// https://prototype-kit.service.gov.uk/docs/adding-css-javascript-and-images
//

window.GOVUKPrototypeKit.documentReady(() => {

  // Pattern Library: show/hide HTML code toggle
  document.querySelectorAll('[data-toggle]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var targetId = btn.getAttribute('data-toggle')
      var target = document.getElementById(targetId)
      if (!target) return
      var isHidden = target.hasAttribute('hidden')
      if (isHidden) {
        target.removeAttribute('hidden')
        btn.textContent = 'Hide HTML'
      } else {
        target.setAttribute('hidden', '')
        btn.textContent = 'Show HTML'
      }
    })
  })

  // Pattern Library: copy code to clipboard
  document.querySelectorAll('[data-copy-target]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var codeEl = document.getElementById(btn.getAttribute('data-copy-target'))
      if (!codeEl || !navigator.clipboard) return
      navigator.clipboard.writeText(codeEl.textContent).then(function () {
        var orig = btn.textContent
        btn.textContent = 'Code copied'
        setTimeout(function () { btn.textContent = orig }, 5000)
      })
    })
  })

})



new MOJFrontend.MultiFileUpload({
  container: document.querySelector(".moj-multi-file-upload"),
  uploadUrl: "/ajax-upload",
  deleteUrl: "/ajax-delete",
});