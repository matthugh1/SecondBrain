// Options page script

// Load saved settings
chrome.storage.sync.get(['apiBaseUrl', 'authToken', 'defaultCategory'], (result) => {
  if (result.apiBaseUrl) {
    document.getElementById('apiBaseUrl').value = result.apiBaseUrl
  }
  if (result.authToken) {
    document.getElementById('authToken').value = result.authToken
  }
  if (result.defaultCategory) {
    document.getElementById('defaultCategory').value = result.defaultCategory
  }
})

// Handle form submission
document.getElementById('settingsForm').addEventListener('submit', (e) => {
  e.preventDefault()
  
  const apiBaseUrl = document.getElementById('apiBaseUrl').value.trim()
  const authToken = document.getElementById('authToken').value.trim()
  const defaultCategory = document.getElementById('defaultCategory').value
  
  const status = document.getElementById('status')
  
  // Save settings
  chrome.storage.sync.set({
    apiBaseUrl: apiBaseUrl || 'http://localhost:3000',
    authToken: authToken,
    defaultCategory: defaultCategory || '',
  }, () => {
    status.style.display = 'block'
    status.className = 'status success'
    status.textContent = 'Settings saved successfully!'
    
    setTimeout(() => {
      status.style.display = 'none'
    }, 3000)
  })
})
