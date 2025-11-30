// background.js - Service Worker for Manifest V3
import { SUBSTACK_API_URL, SUBSTACK_POSTS_URL } from './constants.js';

chrome.runtime.onInstalled.addListener(() => {
  console.log('Substack Notes Composer Extension installed successfully.');
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'PUBLISH_NOTE') {
    handleRequest(SUBSTACK_API_URL, request.payload)
      .then(response => sendResponse(response))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Async response
  }
  
  if (request.type === 'PUBLISH_POST') {
    handleRequest(SUBSTACK_POSTS_URL, request.payload)
      .then(response => sendResponse(response))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Async response
  }
});

async function handleRequest(url, payload) {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Sends Substack cookies
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return { 
            success: false, 
            status: response.status,
            message: errorData.message || response.statusText || `Erro ${response.status}`
        };
    }

    const data = await response.json().catch(() => ({ status: 'ok' }));
    return { success: true, data };

  } catch (error) {
    console.error('Background fetch error:', error);
    return { 
      success: false, 
      error: error.message || 'Falha na conexão com o Substack.' 
    };
  }
}