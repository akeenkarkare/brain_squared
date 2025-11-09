// Content script for Brain Squared
// This runs on the web app page and helps facilitate communication

console.log('Brain Squared content script loaded');

// Listen for auth messages from the page
window.addEventListener('message', (event) => {
  // Only accept messages from our own window
  if (event.source !== window) return;

  // Check if this is our auth message
  if (event.data.type === 'BRAIN_SQUARED_AUTH' && event.data.token) {
    console.log('Auth message received in content script');

    // Forward to background script
    chrome.runtime.sendMessage({
      action: 'setAuthToken',
      token: event.data.token,
      userId: event.data.userId,
      userEmail: event.data.userEmail
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Failed to send to background:', chrome.runtime.lastError);
      } else {
        console.log('Token sent to background script successfully');
      }
    });
  }
});

// Also listen for custom events
window.addEventListener('brain-squared-auth', (event) => {
  console.log('Custom event received in content script');
  const data = event.detail;

  if (data && data.token) {
    chrome.runtime.sendMessage({
      action: 'setAuthToken',
      token: data.token,
      userId: data.userId,
      userEmail: data.userEmail
    });
  }
});

// Poll sessionStorage for auth data (fallback method)
function checkForAuthToken() {
  try {
    const authData = sessionStorage.getItem('brain_squared_auth');
    if (authData) {
      const parsed = JSON.parse(authData);
      console.log('Found auth token in sessionStorage');

      // Send to background
      chrome.runtime.sendMessage({
        action: 'setAuthToken',
        token: parsed.token,
        userId: parsed.userId,
        userEmail: parsed.userEmail
      }, (response) => {
        if (response && response.success) {
          // Clear the token so we don't send it again
          sessionStorage.removeItem('brain_squared_auth');
        }
      });
    }
  } catch (error) {
    // SessionStorage might not be accessible
  }
}

// Check immediately and then every second for 10 seconds
checkForAuthToken();
let checks = 0;
const interval = setInterval(() => {
  checks++;
  checkForAuthToken();
  if (checks >= 10) {
    clearInterval(interval);
  }
}, 1000);
