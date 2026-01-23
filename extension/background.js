// Background service worker for extension

// Set up context menu on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'captureToSecondBrain',
    title: 'Capture to Second Brain',
    contexts: ['selection'],
  })
})

// Handle context menu click
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'captureToSecondBrain' && info.selectionText) {
    captureSelectedText(info.selectionText, tab)
  }
})

// Handle messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'captureWithContext') {
    captureWithContext(request.context)
    sendResponse({ success: true })
  }
  return true
})

async function captureSelectedText(selectedText, tab) {
  const pageContext = {
    url: tab.url,
    title: tab.title,
    selectedText: selectedText,
  }

  await captureWithContext(pageContext)
}

async function captureWithContext(context) {
  try {
    // Get API base URL and auth token
    const storage = await chrome.storage.sync.get(['apiBaseUrl', 'authToken'])
    const API_BASE_URL = storage.apiBaseUrl || 'http://localhost:3000'
    
    if (!storage.authToken) {
      // Open options page for authentication
      chrome.runtime.openOptionsPage()
      return
    }

    // Build capture message
    const captureMessage = context.selectedText || context.text
      ? `${context.selectedText || context.text}\n\n[Captured from: ${context.title} - ${context.url}]`
      : `[Captured from: ${context.title} - ${context.url}]`

    // Send capture request
    const response = await fetch(`${API_BASE_URL}/api/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${storage.authToken}`,
      },
      credentials: 'include',
      body: JSON.stringify({ message: captureMessage }),
    })

    if (!response.ok) {
      throw new Error('Failed to capture')
    }

    // Show notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'Second Brain',
      message: 'Successfully captured!',
    })
  } catch (error) {
    console.error('Error capturing:', error)
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'Second Brain',
      message: 'Failed to capture. Please check your connection.',
    })
  }
}
