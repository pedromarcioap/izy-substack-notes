
// background.ts - Service Worker for Manifest V3
import { SUBSTACK_API_URL } from './constants';
import { SubstackNotePayload, PublishNoteMessage } from './types';

declare var chrome: any;

chrome.runtime.onInstalled.addListener(() => {
  console.log('Substack Notes Composer Extension installed successfully.');
});

chrome.runtime.onMessage.addListener((request: PublishNoteMessage, sender: any, sendResponse: any) => {
  if (request.type === 'PUBLISH_NOTE') {
    handlePublishNote(request.payload)
      .then(response => sendResponse(response))
      .catch(error => sendResponse({ success: false, error: error.message }));
    
    // Return true to indicate we wish to send a response asynchronously
    return true; 
  }
});

async function handlePublishNote(payload: SubstackNotePayload) {
  try {
    // The Service Worker context handles CORS and Cookies more reliably with host_permissions
    const response = await fetch(SUBSTACK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // 'Origin': 'https://substack.com' // Browsers often block setting this manually, but host_permissions helps.
      },
      credentials: 'include', // Crucial: Sends the user's Substack cookies
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
        // Try to parse error message from JSON, fallback to status text
        const errorData = await response.json().catch(() => ({}));
        
        return { 
            success: false, 
            status: response.status,
            message: errorData.message || response.statusText || `Erro ${response.status}`
        };
    }

    const data = await response.json().catch(() => ({ status: 'ok' }));
    return { success: true, data };

  } catch (error: any) {
    console.error('Background fetch error:', error);
    return { 
      success: false, 
      error: error.message || 'Falha na conexão com o Substack.' 
    };
  }
}

export {};
