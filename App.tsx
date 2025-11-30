
import React, { useState, useCallback } from 'react';
import { SUBSTACK_LOGIN_URL, DEFAULT_PAYLOAD_CONFIG } from './constants';
import { SubstackNotePayload, ProseMirrorDoc, RequestStatus, PublishNoteResponse } from './types';
import { Send, Calendar, AlertCircle, CheckCircle, ExternalLink } from 'lucide-react';

// Declare chrome for TS if not globally available
declare var chrome: any;

const App: React.FC = () => {
  const [noteText, setNoteText] = useState<string>('');
  const [status, setStatus] = useState<RequestStatus>(RequestStatus.IDLE);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [scheduledDate, setScheduledDate] = useState<string>('');
  const [showScheduler, setShowScheduler] = useState<boolean>(false);

  const constructPayload = (text: string, scheduleTime?: string): SubstackNotePayload => {
    // Constructing the strict ProseMirror JSON structure
    const bodyJson: ProseMirrorDoc = {
      type: "doc",
      attrs: { schemaVersion: "v1" },
      content: [
        {
          type: "paragraph",
          content: [
            { type: "text", text: text }
          ]
        }
      ]
    };

    const payload: SubstackNotePayload = {
      bodyJson,
      ...DEFAULT_PAYLOAD_CONFIG
    };

    if (scheduleTime) {
      payload.scheduled_at = new Date(scheduleTime).toISOString();
      payload.draft = true; // Usually scheduled posts are treated as drafts until trigger
    }

    return payload;
  };

  const handlePublish = useCallback(async () => {
    if (!noteText.trim()) return;

    setStatus(RequestStatus.LOADING);
    setErrorMessage('');

    const payload = constructPayload(noteText, scheduledDate);

    // Send message to Background Script to handle the fetch
    // This avoids CORS issues often encountered in the Popup
    chrome.runtime.sendMessage({ 
      type: 'PUBLISH_NOTE', 
      payload 
    }, (response: PublishNoteResponse) => {
      
      // Handle runtime errors (e.g., background script not running)
      if (chrome.runtime.lastError) {
        setStatus(RequestStatus.ERROR);
        setErrorMessage(chrome.runtime.lastError.message || "Erro de comunicação com a extensão.");
        return;
      }

      if (response && response.success) {
        setStatus(RequestStatus.SUCCESS);
        setNoteText('');
        setScheduledDate('');
        setShowScheduler(false);

        // Auto-reset status after 3 seconds
        setTimeout(() => setStatus(RequestStatus.IDLE), 3000);
      } else {
        setStatus(RequestStatus.ERROR);
        
        // Handle specific API errors based on status code passed from background
        if (response && response.status === 401) {
          setErrorMessage("Não autorizado. Por favor, faça login no Substack.");
        } else if (response && response.status === 403) {
          setErrorMessage("Acesso negado. Verifique se você tem permissão.");
        } else {
          setErrorMessage(response?.message || response?.error || "Ocorreu um erro desconhecido.");
        }
      }
    });
  }, [noteText, scheduledDate]);

  const openSubstackLogin = () => {
    window.open(SUBSTACK_LOGIN_URL, '_blank');
  };

  return (
    <div className="p-4 flex flex-col h-full bg-white relative">
      <header className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
        <h1 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <span className="w-6 h-6 bg-[#FF6719] rounded text-white flex items-center justify-center text-xs font-bold">S</span>
          Substack Note
        </h1>
        {status === RequestStatus.LOADING && (
          <span className="text-xs text-gray-400 animate-pulse">Enviando...</span>
        )}
      </header>

      <div className="flex-1 flex flex-col gap-3">
        {/* Status Messages */}
        {status === RequestStatus.ERROR && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-700 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} />
              <span className="font-medium">Erro ao publicar</span>
            </div>
            <p className="text-xs opacity-90">{errorMessage}</p>
            {errorMessage.toLowerCase().includes('login') || errorMessage.toLowerCase().includes('não autorizado') ? (
               <button 
                 onClick={openSubstackLogin}
                 className="mt-1 text-xs bg-red-100 hover:bg-red-200 text-red-800 py-1 px-2 rounded w-fit flex items-center gap-1 transition-colors"
               >
                 Fazer Login <ExternalLink size={10} />
               </button>
            ) : null}
          </div>
        )}

        {status === RequestStatus.SUCCESS && (
          <div className="bg-green-50 border border-green-200 rounded-md p-3 text-sm text-green-700 flex items-center gap-2 animate-fade-in">
            <CheckCircle size={16} />
            <span className="font-medium">Note publicado com sucesso!</span>
          </div>
        )}

        {/* Input Area */}
        <div className="relative flex-1">
          <textarea
            className="w-full h-40 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6719] focus:border-transparent outline-none resize-none text-gray-700 text-sm leading-relaxed transition-all placeholder:text-gray-400"
            placeholder="O que está acontecendo?"
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            disabled={status === RequestStatus.LOADING}
          />
        </div>

        {/* Scheduling Toggle */}
        <div className="flex flex-col gap-2">
          <button 
            onClick={() => setShowScheduler(!showScheduler)}
            className={`text-xs flex items-center gap-1.5 w-fit font-medium transition-colors ${showScheduler || scheduledDate ? 'text-[#FF6719]' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <Calendar size={14} />
            {scheduledDate ? 'Agendado' : 'Agendar publicação'}
          </button>
          
          {(showScheduler || scheduledDate) && (
            <input
              type="datetime-local"
              className="w-full text-xs p-2 border border-gray-200 rounded bg-gray-50 focus:border-[#FF6719] outline-none text-gray-600"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
            />
          )}
        </div>
      </div>

      <footer className="mt-4 pt-3 border-t border-gray-100">
        <button
          onClick={handlePublish}
          disabled={!noteText.trim() || status === RequestStatus.LOADING}
          className={`w-full py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 text-sm font-semibold text-white transition-all transform active:scale-95
            ${!noteText.trim() || status === RequestStatus.LOADING 
              ? 'bg-gray-300 cursor-not-allowed' 
              : 'bg-[#FF6719] hover:bg-[#E5560D] shadow-sm hover:shadow-md'
            }`}
        >
          {status === RequestStatus.LOADING ? (
            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <Send size={16} />
          )}
          {scheduledDate ? 'Agendar Note' : 'Publicar Note'}
        </button>
      </footer>
    </div>
  );
};

export default App;
