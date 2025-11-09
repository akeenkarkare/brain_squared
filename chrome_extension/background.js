// Background service worker for Brain Squared
// Automatically syncs browsing history every 2 hours

const BACKEND_URL = 'http://localhost:3001';
const SYNC_INTERVAL_MINUTES = 120; // 2 hours
const BATCH_SIZE = 500;

// Initialize alarms when extension is installed/updated
chrome.runtime.onInstalled.addListener(async () => {
  console.log('Brain Squared installed/updated');

  // Create periodic sync alarm (every 2 hours)
  chrome.alarms.create('autoSync', {
    periodInMinutes: SYNC_INTERVAL_MINUTES
  });

  // Set initial last sync time
  const { lastSyncTime } = await chrome.storage.local.get('lastSyncTime');
  if (!lastSyncTime) {
    await chrome.storage.local.set({ lastSyncTime: 0 });
  }

  console.log('Auto-sync scheduled: every 2 hours');
});

// Listen for alarm
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'autoSync') {
    console.log('Auto-sync triggered');
    await performSync();
  }
});

// Perform the sync
async function performSync() {
  try {
    console.log('Starting automatic sync...');

    // Check if user is authenticated
    const { authToken } = await chrome.storage.local.get('authToken');
    if (!authToken) {
      console.log('Not authenticated - skipping auto-sync');
      return;
    }

    // Get last sync time
    const { lastSyncTime } = await chrome.storage.local.get('lastSyncTime');
    const startTime = lastSyncTime || 0;
    const endTime = Date.now();

    // Fetch history since last sync
    const historyItems = await fetchHistory(startTime, endTime);

    if (historyItems.length === 0) {
      console.log('No new history to sync');
      return;
    }

    console.log(`Found ${historyItems.length} new items to sync`);

    // Sync to backend
    await syncToBackend(historyItems);

    // Update last sync time
    await chrome.storage.local.set({ lastSyncTime: endTime });

    console.log(`Auto-sync completed: ${historyItems.length} items synced`);

    // Show notification (optional)
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icon48.png',
      title: 'Brain Squared',
      message: `Synced ${historyItems.length} new items to your second brain`,
      priority: 0
    });

  } catch (error) {
    console.error('Auto-sync failed:', error);

    // Show error notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icon48.png',
      title: 'Brain Squared - Sync Failed',
      message: error.message || 'Failed to sync history. Please check your login.',
      priority: 1
    });
  }
}

// Fetch history from Chrome
async function fetchHistory(startTime, endTime) {
  return new Promise((resolve, reject) => {
    const query = {
      text: '',
      startTime: startTime,
      endTime: endTime,
      maxResults: 0 // No limit
    };

    chrome.history.search(query, (results) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(results);
      }
    });
  });
}

// Sync history to backend
async function syncToBackend(historyItems) {
  // Get auth token
  const { authToken } = await chrome.storage.local.get('authToken');

  if (!authToken) {
    throw new Error('Not authenticated. Please login first.');
  }

  const totalBatches = Math.ceil(historyItems.length / BATCH_SIZE);

  for (let i = 0; i < totalBatches; i++) {
    const start = i * BATCH_SIZE;
    const end = Math.min(start + BATCH_SIZE, historyItems.length);
    const batch = historyItems.slice(start, end);

    console.log(`Syncing batch ${i + 1}/${totalBatches}...`);

    // Prepare data for backend
    const payload = batch.map(item => ({
      url: item.url,
      title: item.title || 'Untitled',
      lastVisitTime: item.lastVisitTime,
      visitCount: item.visitCount || 0,
      typedCount: item.typedCount || 0
    }));

    // Send to backend with auth token
    const response = await fetch(`${BACKEND_URL}/api/history/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({ items: payload })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to sync to backend');
    }

    const result = await response.json();
    console.log(`Batch ${i + 1} synced:`, result);

    // Small delay between batches
    if (i < totalBatches - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'manualSync') {
    performSync().then(() => {
      sendResponse({ success: true });
    }).catch((error) => {
      sendResponse({ success: false, error: error.message });
    });
    return true; // Keep channel open for async response
  }

  if (request.action === 'getLastSyncTime') {
    chrome.storage.local.get('lastSyncTime').then((data) => {
      sendResponse({ lastSyncTime: data.lastSyncTime || 0 });
    });
    return true;
  }

  if (request.action === 'getAuthStatus') {
    chrome.storage.local.get(['authToken', 'userId', 'userEmail']).then((data) => {
      sendResponse({
        isAuthenticated: !!data.authToken,
        userId: data.userId,
        userEmail: data.userEmail
      });
    });
    return true;
  }

  if (request.action === 'setAuthToken') {
    // Store the auth token and user info from web app
    chrome.storage.local.set({
      authToken: request.token,
      userId: request.userId,
      userEmail: request.userEmail
    }).then(() => {
      console.log('Auth token saved from web app');
      sendResponse({ success: true });
    }).catch((error) => {
      console.error('Failed to save auth token:', error);
      sendResponse({ success: false, error: error.message });
    });
    return true; // Keep channel open for async response
  }

  if (request.action === 'logout') {
    chrome.storage.local.remove(['authToken', 'userId', 'userEmail']).then(() => {
      console.log('User logged out');
      sendResponse({ success: true });
    });
    return true;
  }
});

// Listen for messages from external web app (cross-origin)
chrome.runtime.onMessageExternal.addListener((request, sender, sendResponse) => {
  console.log('External message received:', request.action, 'from:', sender.url);

  if (request.action === 'setAuthToken') {
    // Store the auth token and user info from web app
    chrome.storage.local.set({
      authToken: request.token,
      userId: request.userId,
      userEmail: request.userEmail
    }).then(() => {
      console.log('Auth token saved from external web app:', request.userEmail);
      sendResponse({ success: true });

      // Show success notification
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icon48.png',
        title: 'Brain Squared - Login Successful',
        message: `Logged in as ${request.userEmail}`,
        priority: 1
      });
    }).catch((error) => {
      console.error('Failed to save auth token:', error);
      sendResponse({ success: false, error: error.message });
    });
    return true; // Keep channel open for async response
  }
});

// Also listen for new page visits in real-time (optional - more aggressive syncing)
// Uncomment this if you want to sync every new page visit immediately
/*
chrome.history.onVisited.addListener(async (historyItem) => {
  try {
    const payload = [{
      url: historyItem.url,
      title: historyItem.title || 'Untitled',
      lastVisitTime: historyItem.lastVisitTime,
      visitCount: historyItem.visitCount || 1,
      typedCount: historyItem.typedCount || 0
    }];

    await fetch(`${BACKEND_URL}/api/history/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: payload })
    });

    console.log('Real-time sync:', historyItem.url);
  } catch (error) {
    console.error('Real-time sync failed:', error);
  }
});
*/

console.log('Brain Squared background worker loaded');
