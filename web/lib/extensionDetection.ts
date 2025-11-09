/**
 * Extension Detection Library
 * Detects if Brain Squared Chrome extension is installed
 */

export async function checkExtensionInstalled(): Promise<boolean> {
  return new Promise((resolve) => {
    console.log('[Extension Detection] Starting extension check...');

    let resolved = false;
    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        console.log('[Extension Detection] Timeout - extension not detected');
        resolve(false);
      }
    }, 2000);

    try {
      // Send a message from the webpage, the content script will forward it
      console.log('[Extension Detection] Sending extension check via postMessage...');

      const requestId = Math.random().toString(36).substr(2, 9);

      // Listen for the response
      const messageHandler = (event: MessageEvent) => {
        // Only accept messages from the content script (marked with _source)
        if (event.data.type === 'BRAIN_SQUARED_RESPONSE' &&
            event.data.requestId === requestId &&
            event.data._source === 'brain-squared-extension') {
          console.log('[Extension Detection] Received response:', event.data.payload);
          clearTimeout(timeout);
          window.removeEventListener('message', messageHandler);

          if (!resolved) {
            resolved = true;
            resolve(true); // If we got a response, the extension is installed
          }
        }
      };

      window.addEventListener('message', messageHandler);

      // Send the message
      window.postMessage({
        type: 'BRAIN_SQUARED_EXTENSION_CHECK',
        requestId: requestId,
        payload: { action: 'EXTENSION_CHECK' }
      }, '*');

    } catch (error) {
      console.log('[Extension Detection] Exception:', error);
      clearTimeout(timeout);
      if (!resolved) {
        resolved = true;
        resolve(false);
      }
    }
  });
}

export function getExtensionInstallUrl(): string {
  // Link to install from Chrome Web Store
  // For development, this would be a local installation guide
  return 'https://chrome.google.com/webstore'; // Placeholder
}
