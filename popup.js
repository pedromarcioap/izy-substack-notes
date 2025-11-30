import { DEFAULT_PAYLOAD_CONFIG, SUBSTACK_LOGIN_URL, getApiUrl } from './constants.js';

// State
let state = {
  activeTab: 'note', // 'note' or 'post'
  text: '',
  title: '',
  subdomain: '',
  scheduledDate: '',
  isSchedulerVisible: false,
  isLoading: false
};

// DOM Elements
const elements = {
  subdomainInput: document.getElementById('subdomain-input'),
  tabNote: document.getElementById('tab-note'),
  tabPost: document.getElementById('tab-post'),
  contentText: document.getElementById('content-text'),
  postTitleContainer: document.getElementById('post-title-container'),
  postTitle: document.getElementById('post-title'),
  schedulerContainer: document.getElementById('scheduler-container'),
  toggleScheduler: document.getElementById('toggle-scheduler'),
  scheduledDate: document.getElementById('scheduled-date'),
  btnPublish: document.getElementById('btn-publish'),
  btnText: document.getElementById('btn-text'),
  statusMessage: document.getElementById('status-message'),
  loadingIndicator: document.getElementById('loading-indicator')
};

// --- Initialization ---

document.addEventListener('DOMContentLoaded', () => {
  loadSettings();
  setupEventListeners();
  updateUI();
});

function loadSettings() {
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(['subdomain'], (result) => {
      if (result.subdomain) {
        state.subdomain = result.subdomain;
        elements.subdomainInput.value = result.subdomain;
      }
    });
  }
}

// --- Event Listeners ---

function setupEventListeners() {
  // Subdomain
  elements.subdomainInput.addEventListener('input', (e) => {
    state.subdomain = e.target.value.trim();
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.set({ subdomain: state.subdomain });
    }
  });

  // Tabs
  elements.tabNote.addEventListener('click', () => switchTab('note'));
  elements.tabPost.addEventListener('click', () => switchTab('post'));

  // Inputs
  elements.contentText.addEventListener('input', (e) => {
    state.text = e.target.value;
    validateForm();
  });

  elements.postTitle.addEventListener('input', (e) => {
    state.title = e.target.value;
    validateForm();
  });

  // Scheduler
  elements.toggleScheduler.addEventListener('click', () => {
    state.isSchedulerVisible = !state.isSchedulerVisible;
    if (!state.isSchedulerVisible) state.scheduledDate = ''; // reset on hide
    updateUI();
  });

  elements.scheduledDate.addEventListener('change', (e) => {
    state.scheduledDate = e.target.value;
    validateForm();
    updateUI();
  });

  // Action
  elements.btnPublish.addEventListener('click', handlePublish);
}

// --- Logic ---

function switchTab(tab) {
  state.activeTab = tab;
  state.isSchedulerVisible = false;
  state.scheduledDate = '';
  hideMessage();
  updateUI();
  validateForm();
}

function updateUI() {
  // Tabs styling
  if (state.activeTab === 'note') {
    elements.tabNote.classList.add('active');
    elements.tabPost.classList.remove('active');
    
    elements.postTitleContainer.classList.add('hidden');
    elements.schedulerContainer.classList.remove('hidden');
    elements.contentText.placeholder = "O que está acontecendo?";
    
    const actionText = state.scheduledDate ? 'Agendar Note' : 'Publicar Note';
    elements.btnText.textContent = actionText;
  } else {
    elements.tabNote.classList.remove('active');
    elements.tabPost.classList.add('active');

    elements.postTitleContainer.classList.remove('hidden');
    elements.schedulerContainer.classList.add('hidden');
    elements.contentText.placeholder = "Escreva seu rascunho aqui...";
    
    elements.btnText.textContent = 'Salvar Rascunho';
  }

  // Scheduler Visibility
  if (state.isSchedulerVisible) {
    elements.scheduledDate.classList.remove('hidden');
    elements.toggleScheduler.classList.add('active');
    elements.toggleScheduler.querySelector('span').textContent = 'Agendado';
  } else {
    elements.scheduledDate.classList.add('hidden');
    elements.toggleScheduler.classList.remove('active');
    elements.toggleScheduler.querySelector('span').textContent = 'Agendar';
  }

  // Loading State
  if (state.isLoading) {
    elements.loadingIndicator.classList.remove('hidden');
    elements.btnPublish.disabled = true;
    elements.contentText.disabled = true;
  } else {
    elements.loadingIndicator.classList.add('hidden');
    elements.contentText.disabled = false;
    validateForm(); // Re-enable button if valid
  }
}

function validateForm() {
  let isValid = false;
  if (state.activeTab === 'note') {
    isValid = state.text.trim().length > 0;
  } else {
    isValid = state.text.trim().length > 0 && state.title.trim().length > 0;
  }
  elements.btnPublish.disabled = !isValid || state.isLoading;
}

function showMessage(type, text) {
  elements.statusMessage.className = type === 'error' ? 'msg-error' : 'msg-success';
  elements.statusMessage.textContent = text;
  
  if (type === 'error' && text.toLowerCase().includes('login')) {
    const link = document.createElement('a');
    link.href = SUBSTACK_LOGIN_URL;
    link.target = "_blank";
    link.textContent = " Fazer Login";
    link.style.fontWeight = "bold";
    link.style.textDecoration = "underline";
    elements.statusMessage.appendChild(document.createElement('br'));
    elements.statusMessage.appendChild(link);
  }

  elements.statusMessage.classList.remove('hidden');
}

function hideMessage() {
  elements.statusMessage.classList.add('hidden');
}

// --- Publishing Logic ---

async function handlePublish() {
  if (state.isLoading) return;

  state.isLoading = true;
  hideMessage();
  updateUI();

  // Construct dynamic URL
  const targetUrl = getApiUrl(state.subdomain, state.activeTab);
  
  const proseMirrorBody = createProseMirrorDoc(state.text);
  let messageType = '';
  let payload = {};

  if (state.activeTab === 'note') {
    messageType = 'PUBLISH_NOTE';
    payload = {
      bodyJson: proseMirrorBody,
      ...DEFAULT_PAYLOAD_CONFIG
    };
    if (state.scheduledDate) {
      payload.scheduled_at = new Date(state.scheduledDate).toISOString();
      payload.draft = true;
    }
  } else {
    messageType = 'PUBLISH_POST';
    payload = {
      title: state.title,
      body_json: proseMirrorBody,
      draft: true,
      audience: 'everyone'
    };
  }

  // Check if Chrome runtime is available
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
    chrome.runtime.sendMessage({ 
      type: messageType, 
      payload,
      url: targetUrl // Pass dynamic URL to background
    }, (response) => {
      state.isLoading = false;
      
      if (chrome.runtime.lastError) {
        showMessage('error', chrome.runtime.lastError.message);
        updateUI();
        return;
      }

      if (response && response.success) {
        showMessage('success', state.activeTab === 'note' ? 'Publicado com sucesso!' : 'Rascunho salvo!');
        resetForm();
      } else {
        const msg = response?.message || response?.error || "Erro desconhecido.";
        if (response?.status === 404) {
             showMessage('error', `Erro 404: Verifique se o subdomínio "${state.subdomain || 'www'}" está correto.`);
        } else if (response?.status === 401) {
             showMessage('error', "Não autorizado. Faça login no Substack.");
        } else {
            showMessage('error', msg);
        }
      }
      updateUI();
    });
  } else {
    // Dev fallback
    console.warn('Chrome runtime not found. Simulated request to:', targetUrl, payload);
    setTimeout(() => {
      state.isLoading = false;
      showMessage('success', 'Simulação: Sucesso!');
      resetForm();
      updateUI();
    }, 1000);
  }
}

function resetForm() {
  state.text = '';
  state.title = '';
  state.scheduledDate = '';
  state.isSchedulerVisible = false;
  
  elements.contentText.value = '';
  elements.postTitle.value = '';
  elements.scheduledDate.value = '';
}

function createProseMirrorDoc(content) {
  return {
    type: "doc",
    attrs: { schemaVersion: "v1" },
    content: [
      {
        type: "paragraph",
        content: [
          { type: "text", text: content }
        ]
      }
    ]
  };
}