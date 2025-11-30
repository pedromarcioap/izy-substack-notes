// background.js - Service Worker for Manifest V3

chrome.runtime.onInstalled.addListener(() => {
  console.log('Substack Notes Composer Extension installed successfully.');
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'PUBLISH_NOTE' || request.type === 'PUBLISH_POST') {
    // Use the URL provided in the request (constructed by popup.js based on subdomain)
    // Fallback logic handled in popup, but validating here is good practice.
    const url = request.url; 
    
    if (!url) {
      sendResponse({ success: false, error: "URL da API inválida." });
      return true;
    }

    handleRequest(url, request.payload)
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
      credentials: 'include', // Sends Substack cookies automatically
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