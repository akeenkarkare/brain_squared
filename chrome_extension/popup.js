// DOM Elements
const timeRangeSelect = document.getElementById('timeRange');
const customRangeDiv = document.getElementById('customRange');
const startDateInput = document.getElementById('startDate');
const endDateInput = document.getElementById('endDate');
const formatSelect = document.getElementById('format');
const includeVisitCountCheckbox = document.getElementById('includeVisitCount');
const includeTypedCountCheckbox = document.getElementById('includeTypedCount');
const downloadBtn = document.getElementById('downloadBtn');
const syncBtn = document.getElementById('syncBtn');
const statusDiv = document.getElementById('status');
const progressDiv = document.getElementById('progress');
const progressBar = progressDiv.querySelector('.progress-bar');
const progressText = progressDiv.querySelector('.progress-text');
const lastSyncTimeSpan = document.getElementById('lastSyncTime');

// Auth elements
const authSection = document.getElementById('authSection');
const authStatusText = document.getElementById('authStatusText');
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');

// Backend API URL (change this to your deployed backend URL when ready)
const BACKEND_URL = 'http://localhost:3001';
const WEB_APP_URL = 'http://localhost:3000';

// Check authentication status on load
async function checkAuthStatus() {
  try {
    const { authToken, userEmail } = await chrome.storage.local.get(['authToken', 'userEmail']);

    if (authToken && userEmail) {
      // User is logged in
      authStatusText.textContent = `Logged in as: ${userEmail}`;
      authStatusText.className = 'auth-status-text success';
      loginBtn.classList.add('hidden');
      logoutBtn.classList.remove('hidden');

      // Enable sync button
      syncBtn.disabled = false;

      return true;
    } else {
      // User is not logged in
      authStatusText.textContent = 'Not logged in';
      authStatusText.className = 'auth-status-text error';
      loginBtn.classList.remove('hidden');
      logoutBtn.classList.add('hidden');

      // Disable sync button
      syncBtn.disabled = true;

      return false;
    }
  } catch (error) {
    console.error('Error checking auth status:', error);
    authStatusText.textContent = 'Auth check failed';
    authStatusText.className = 'auth-status-text error';
    loginBtn.classList.remove('hidden');
    logoutBtn.classList.add('hidden');
    syncBtn.disabled = true;

    return false;
  }
}

// Login button handler
loginBtn.addEventListener('click', () => {
  // Open the web app's extension auth page in a new tab
  const extensionId = chrome.runtime.id;
  chrome.tabs.create({
    url: `${WEB_APP_URL}/extension-auth?extensionId=${extensionId}`
  });

  // Show a message
  statusDiv.textContent = 'Opening login page... After logging in, return to this popup.';
  statusDiv.className = 'status';
});

// Logout button handler
logoutBtn.addEventListener('click', async () => {
  try {
    // Clear stored auth data
    await chrome.storage.local.remove(['authToken', 'userId', 'userEmail']);

    // Update UI
    await checkAuthStatus();

    statusDiv.textContent = 'Logged out successfully';
    statusDiv.className = 'status success';
  } catch (error) {
    console.error('Error logging out:', error);
    statusDiv.textContent = 'Error logging out';
    statusDiv.className = 'status error';
  }
});

// Listen for auth messages from the web app
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'setAuthToken') {
    // Store the auth token and user info
    chrome.storage.local.set({
      authToken: request.token,
      userId: request.userId,
      userEmail: request.userEmail
    }).then(() => {
      console.log('Auth token saved');
      checkAuthStatus();
      sendResponse({ success: true });
    });
    return true; // Keep channel open for async response
  }
});

// Check auth status when popup opens
checkAuthStatus();

// Load and display last sync time on popup open
async function updateLastSyncTime() {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'getLastSyncTime' });
    const lastSyncTime = response.lastSyncTime;

    if (lastSyncTime && lastSyncTime > 0) {
      const date = new Date(lastSyncTime);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      let timeAgo;
      if (diffMins < 1) {
        timeAgo = 'Just now';
      } else if (diffMins < 60) {
        timeAgo = `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
      } else if (diffHours < 24) {
        timeAgo = `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
      } else {
        timeAgo = `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
      }

      lastSyncTimeSpan.textContent = `Last synced: ${timeAgo}`;
    } else {
      lastSyncTimeSpan.textContent = 'Never synced - Click "Sync" below';
    }
  } catch (error) {
    lastSyncTimeSpan.textContent = 'Auto-sync enabled';
  }
}

// Update last sync time when popup opens
updateLastSyncTime();

// Show/hide custom date range
timeRangeSelect.addEventListener('change', () => {
  if (timeRangeSelect.value === 'custom') {
    customRangeDiv.classList.remove('hidden');
  } else {
    customRangeDiv.classList.add('hidden');
  }
});

// Download button click handler
downloadBtn.addEventListener('click', async () => {
  try {
    downloadBtn.disabled = true;
    statusDiv.textContent = 'Fetching history...';
    statusDiv.className = 'status';
    progressDiv.classList.remove('hidden');

    // Get time range
    const { startTime, endTime } = getTimeRange();

    // Fetch history
    const historyItems = await fetchHistory(startTime, endTime);

    if (historyItems.length === 0) {
      statusDiv.textContent = 'No history found for the selected time range.';
      statusDiv.className = 'status warning';
      progressDiv.classList.add('hidden');
      downloadBtn.disabled = false;
      return;
    }

    statusDiv.textContent = `Found ${historyItems.length} items. Preparing download...`;

    // Generate file content
    const format = formatSelect.value;
    const fileContent = generateFileContent(historyItems, format);
    const fileName = `chrome_history_${new Date().toISOString().split('T')[0]}.${format}`;

    // Download file
    downloadFile(fileContent, fileName, format);

    statusDiv.textContent = `Successfully downloaded ${historyItems.length} history items!`;
    statusDiv.className = 'status success';

  } catch (error) {
    console.error('Error downloading history:', error);
    statusDiv.textContent = `Error: ${error.message}`;
    statusDiv.className = 'status error';
  } finally {
    downloadBtn.disabled = false;
    setTimeout(() => {
      progressDiv.classList.add('hidden');
    }, 2000);
  }
});

// Get time range based on selection
function getTimeRange() {
  const timeRange = timeRangeSelect.value;
  const now = Date.now();
  let startTime = 0;
  let endTime = now;

  if (timeRange === 'custom') {
    startTime = startDateInput.value ? new Date(startDateInput.value).getTime() : 0;
    endTime = endDateInput.value ? new Date(endDateInput.value).getTime() : now;
  } else if (timeRange !== 'all') {
    const hours = parseInt(timeRange);
    startTime = now - (hours * 60 * 60 * 1000);
  }

  return { startTime, endTime };
}

// Fetch history from Chrome API
async function fetchHistory(startTime, endTime) {
  return new Promise((resolve, reject) => {
    const query = {
      text: '',
      startTime: startTime,
      endTime: endTime,
      maxResults: 0 // 0 means no limit
    };

    chrome.history.search(query, (results) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        progressText.textContent = `${results.length} items`;
        progressBar.style.width = '100%';
        resolve(results);
      }
    });
  });
}

// Generate file content based on format
function generateFileContent(historyItems, format) {
  const includeVisitCount = includeVisitCountCheckbox.checked;
  const includeTypedCount = includeTypedCountCheckbox.checked;

  switch (format) {
    case 'json':
      return generateJSON(historyItems, includeVisitCount, includeTypedCount);
    case 'csv':
      return generateCSV(historyItems, includeVisitCount, includeTypedCount);
    case 'txt':
      return generateTXT(historyItems, includeVisitCount, includeTypedCount);
    case 'html':
      return generateHTML(historyItems, includeVisitCount, includeTypedCount);
    default:
      return generateJSON(historyItems, includeVisitCount, includeTypedCount);
  }
}

// Generate JSON format
function generateJSON(items, includeVisitCount, includeTypedCount) {
  const data = items.map(item => {
    const obj = {
      url: item.url,
      title: item.title,
      lastVisitTime: new Date(item.lastVisitTime).toISOString()
    };
    if (includeVisitCount) obj.visitCount = item.visitCount;
    if (includeTypedCount) obj.typedCount = item.typedCount;
    return obj;
  });

  return JSON.stringify(data, null, 2);
}

// Generate CSV format
function generateCSV(items, includeVisitCount, includeTypedCount) {
  let csv = 'URL,Title,Last Visit Time';
  if (includeVisitCount) csv += ',Visit Count';
  if (includeTypedCount) csv += ',Typed Count';
  csv += '\n';

  items.forEach(item => {
    const row = [
      `"${item.url.replace(/"/g, '""')}"`,
      `"${(item.title || '').replace(/"/g, '""')}"`,
      `"${new Date(item.lastVisitTime).toISOString()}"`
    ];
    if (includeVisitCount) row.push(item.visitCount);
    if (includeTypedCount) row.push(item.typedCount);
    csv += row.join(',') + '\n';
  });

  return csv;
}

// Generate TXT format
function generateTXT(items, includeVisitCount, includeTypedCount) {
  let txt = 'Chrome Browsing History\n';
  txt += '======================\n\n';

  items.forEach((item, index) => {
    txt += `${index + 1}. ${item.title || 'Untitled'}\n`;
    txt += `   URL: ${item.url}\n`;
    txt += `   Last Visit: ${new Date(item.lastVisitTime).toLocaleString()}\n`;
    if (includeVisitCount) txt += `   Visit Count: ${item.visitCount}\n`;
    if (includeTypedCount) txt += `   Typed Count: ${item.typedCount}\n`;
    txt += '\n';
  });

  return txt;
}

// Generate HTML format
function generateHTML(items, includeVisitCount, includeTypedCount) {
  let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Chrome History Export</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    h1 {
      color: #333;
      border-bottom: 2px solid #4285f4;
      padding-bottom: 10px;
    }
    .stats {
      background: white;
      padding: 15px;
      border-radius: 5px;
      margin-bottom: 20px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    table {
      width: 100%;
      border-collapse: collapse;
      background: white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    th {
      background-color: #4285f4;
      color: white;
      padding: 12px;
      text-align: left;
    }
    td {
      padding: 10px;
      border-bottom: 1px solid #ddd;
    }
    tr:hover {
      background-color: #f5f5f5;
    }
    a {
      color: #4285f4;
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <h1>Chrome Browsing History</h1>
  <div class="stats">
    <p><strong>Export Date:</strong> ${new Date().toLocaleString()}</p>
    <p><strong>Total Items:</strong> ${items.length}</p>
  </div>
  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Title</th>
        <th>URL</th>
        <th>Last Visit</th>`;

  if (includeVisitCount) html += '<th>Visits</th>';
  if (includeTypedCount) html += '<th>Typed</th>';

  html += `
      </tr>
    </thead>
    <tbody>`;

  items.forEach((item, index) => {
    html += `
      <tr>
        <td>${index + 1}</td>
        <td>${escapeHtml(item.title || 'Untitled')}</td>
        <td><a href="${escapeHtml(item.url)}" target="_blank">${escapeHtml(item.url)}</a></td>
        <td>${new Date(item.lastVisitTime).toLocaleString()}</td>`;

    if (includeVisitCount) html += `<td>${item.visitCount}</td>`;
    if (includeTypedCount) html += `<td>${item.typedCount}</td>`;

    html += '</tr>';
  });

  html += `
    </tbody>
  </table>
</body>
</html>`;

  return html;
}

// Escape HTML special characters
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Download file
function downloadFile(content, fileName, format) {
  const mimeTypes = {
    json: 'application/json',
    csv: 'text/csv',
    txt: 'text/plain',
    html: 'text/html'
  };

  const blob = new Blob([content], { type: mimeTypes[format] });
  const url = URL.createObjectURL(blob);

  chrome.downloads.download({
    url: url,
    filename: fileName,
    saveAs: true
  }, (downloadId) => {
    if (chrome.runtime.lastError) {
      console.error('Download error:', chrome.runtime.lastError);
    } else {
      console.log('Download started:', downloadId);
      // Clean up the blob URL after a delay
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  });
}

// Sync button click handler
syncBtn.addEventListener('click', async () => {
  try {
    syncBtn.disabled = true;
    downloadBtn.disabled = true;
    statusDiv.textContent = 'Fetching history...';
    statusDiv.className = 'status';
    progressDiv.classList.remove('hidden');

    // Get time range
    const { startTime, endTime } = getTimeRange();

    // Fetch history
    const historyItems = await fetchHistory(startTime, endTime);

    if (historyItems.length === 0) {
      statusDiv.textContent = 'No history found for the selected time range.';
      statusDiv.className = 'status warning';
      progressDiv.classList.add('hidden');
      syncBtn.disabled = false;
      downloadBtn.disabled = false;
      return;
    }

    statusDiv.textContent = `Found ${historyItems.length} items. Syncing to Brain Squared...`;

    // Sync to backend
    await syncToBackend(historyItems);

    statusDiv.textContent = `Successfully synced ${historyItems.length} items to Brain Squared!`;
    statusDiv.className = 'status success';

  } catch (error) {
    console.error('Error syncing history:', error);
    statusDiv.textContent = `Error: ${error.message}`;
    statusDiv.className = 'status error';
  } finally {
    syncBtn.disabled = false;
    downloadBtn.disabled = false;
    setTimeout(() => {
      progressDiv.classList.add('hidden');
    }, 2000);
  }
});

// Sync history to backend
async function syncToBackend(historyItems) {
  // Get auth token
  const { authToken } = await chrome.storage.local.get('authToken');

  if (!authToken) {
    throw new Error('Not authenticated. Please login first.');
  }

  const BATCH_SIZE = 500; // Send 500 items at a time
  const totalBatches = Math.ceil(historyItems.length / BATCH_SIZE);

  for (let i = 0; i < totalBatches; i++) {
    const start = i * BATCH_SIZE;
    const end = Math.min(start + BATCH_SIZE, historyItems.length);
    const batch = historyItems.slice(start, end);

    statusDiv.textContent = `Syncing batch ${i + 1}/${totalBatches}...`;
    progressBar.style.width = `${((i + 1) / totalBatches) * 100}%`;
    progressText.textContent = `${end}/${historyItems.length} items`;

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

    // Small delay between batches to avoid overwhelming the server
    if (i < totalBatches - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  progressBar.style.width = '100%';
}
