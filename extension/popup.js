// Get API base URL from storage or use default
let API_BASE_URL = 'http://localhost:3000'

chrome.storage.sync.get(['apiBaseUrl'], (result) => {
  if (result.apiBaseUrl) {
    API_BASE_URL = result.apiBaseUrl
  }
})

// Get current tab info
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const tab = tabs[0]
  if (tab) {
    const contextInfo = document.getElementById('contextInfo')
    contextInfo.textContent = `From: ${tab.title || tab.url}`
    contextInfo.setAttribute('data-url', tab.url)
    contextInfo.setAttribute('data-title', tab.title || '')
  }
})

// Handle form submission
document.getElementById('captureForm').addEventListener('submit', async (e) => {
  e.preventDefault()
  
  const text = document.getElementById('text').value.trim()
  const contextInfo = document.getElementById('contextInfo')
  const captureButton = document.getElementById('captureButton')
  const status = document.getElementById('status')
  
  if (!text) {
    return
  }

  // Get context
  const url = contextInfo.getAttribute('data-url') || ''
  const title = contextInfo.getAttribute('data-title') || ''
  
  // Build capture message with context
  const captureMessage = `${text}\n\n[Captured from: ${title} - ${url}]`

  // Disable button and show loading
  captureButton.disabled = true
  status.style.display = 'block'
  status.className = 'status loading'
  status.textContent = 'Capturing...'

  try {
    // Get auth token from storage
    const authData = await chrome.storage.sync.get(['authToken'])
    
    if (!authData.authToken) {
      throw new Error('Not authenticated. Please sign in to Second Brain first.')
    }

    // Send capture request
    const response = await fetch(`${API_BASE_URL}/api/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authData.authToken}`,
      },
      credentials: 'include',
      body: JSON.stringify({ message: captureMessage }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to capture')
    }

    const result = await response.json()

    // Show success
    status.className = 'status success'
    status.textContent = `✅ Captured as ${result.category || 'item'}`
    
    // Clear form
    document.getElementById('text').value = ''
    
    // Close popup after 2 seconds
    setTimeout(() => {
      window.close()
    }, 2000)
  } catch (error) {
    status.className = 'status error'
    status.textContent = `❌ ${error.message || 'Failed to capture'}`
  } finally {
    captureButton.disabled = false
  }
})
