// Content script for capturing selected text

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getSelectedText') {
    const selectedText = window.getSelection().toString().trim()
    const pageContext = {
      url: window.location.href,
      title: document.title,
      selectedText: selectedText,
    }
    sendResponse(pageContext)
  }
  return true
})

// Create context menu item for selected text
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'captureSelectedText') {
    const selectedText = window.getSelection().toString().trim()
    if (selectedText) {
      captureText(selectedText)
    }
  }
  return true
})

function captureText(text) {
  const pageContext = {
    url: window.location.href,
    title: document.title,
    text: text,
  }

  // Send to background script
  chrome.runtime.sendMessage({
    action: 'captureWithContext',
    context: pageContext,
  })
}
