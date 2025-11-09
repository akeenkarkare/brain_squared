// Background service worker for Brain Squared
// Automatically syncs browsing history every 5 minutes

const BACKEND_URL = 'http://45.32.221.76:3001';
const SYNC_INTERVAL_MINUTES = 5; // 5 minutes for frequent updates
const BATCH_SIZE = 200; // Optimized for frequent small syncs

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

  console.log(`Auto-sync scheduled: every ${SYNC_INTERVAL_MINUTES} minutes`);

  // Trigger initial sync on install/update
  console.log('Triggering initial sync...');
  setTimeout(() => performSync(), 5000); // Wait 5 seconds after install
});

// Sync on browser startup
chrome.runtime.onStartup.addListener(async () => {
  console.log('Browser started - triggering sync...');
  await performSync();
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

    // Get last sync time with server fallback
    let { lastSyncTime } = await chrome.storage.local.get('lastSyncTime');

    // Verify with server as fallback (useful if local storage was cleared)
    if (!lastSyncTime || lastSyncTime === 0) {
      console.log('No local lastSyncTime found, checking server...');
      try {
        const serverSyncTime = await getServerLastSyncTime(authToken);
        if (serverSyncTime > 0) {
          lastSyncTime = serverSyncTime;
          await chrome.storage.local.set({ lastSyncTime: serverSyncTime });
          console.log(`Using server lastSyncTime: ${new Date(serverSyncTime).toISOString()}`);
        }
      } catch (error) {
        console.warn('Could not get server sync time, will sync all history:', error);
      }
    }

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

// Get last sync time from server
async function getServerLastSyncTime(authToken) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/history/last-sync-time`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }

    const data = await response.json();
    return data.lastSyncTime || 0;
  } catch (error) {
    console.error('Error getting server last sync time:', error);
    throw error;
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
