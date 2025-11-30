import React, { useState, useCallback } from 'react';
import { SUBSTACK_LOGIN_URL, DEFAULT_PAYLOAD_CONFIG } from './constants';
import { SubstackNotePayload, SubstackPostPayload, ProseMirrorDoc, RequestStatus, PublishResponse } from './types';
import { Send, Calendar, AlertCircle, CheckCircle, ExternalLink, FileText, MessageSquare } from 'lucide-react';

// Declare chrome for TS if not globally available
declare var chrome: any;

type TabType = 'note' | 'post';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('note');
  const [text, setText] = useState<string>('');
  const [title, setTitle] = useState<string>(''); // For Posts
  const [status, setStatus] = useState<RequestStatus>(RequestStatus.IDLE);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [scheduledDate, setScheduledDate] = useState<string>('');
  const [showScheduler, setShowScheduler] = useState<boolean>(false);

  // Helper to create ProseMirror Doc
  const createProseMirrorDoc = (content: string): ProseMirrorDoc => ({
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
  });

  const handlePublish = useCallback(async () => {
    if (!text.trim()) return;
    if (activeTab === 'post' && !title.trim()) {
      setErrorMessage("O título é obrigatório para Posts.");
      setStatus(RequestStatus.ERROR);
      return;
    }

    setStatus(RequestStatus.LOADING);
    setErrorMessage('');

    const isExtensionEnv = typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage;
    const proseMirrorBody = createProseMirrorDoc(text);

    let messageType = '';
    let payload: any = {};

    if (activeTab === 'note') {
      messageType = 'PUBLISH_NOTE';
      const notePayload: SubstackNotePayload = {
        bodyJson: proseMirrorBody,
        ...DEFAULT_PAYLOAD_CONFIG
      };
      if (scheduledDate) {
        notePayload.scheduled_at = new Date(scheduledDate).toISOString();
        notePayload.draft = true;
      }
      payload = notePayload;
    } else {
      messageType = 'PUBLISH_POST';
      const postPayload: SubstackPostPayload = {
        title: title,
        body_json: proseMirrorBody, // API uses snake_case for posts
        draft: true, // Always save as draft first for safety/workflow
        audience: 'everyone'
      };
      payload = postPayload;
    }

    if (isExtensionEnv) {
      chrome.runtime.sendMessage({ 
        type: messageType, 
        payload 
      }, (response: PublishResponse) => {
        
        if (chrome.runtime.lastError) {
          setStatus(RequestStatus.ERROR);
          setErrorMessage(chrome.runtime.lastError.message || "Erro de comunicação.");
          return;
        }

        if (response && response.success) {
          setStatus(RequestStatus.SUCCESS);
          setText('');
          setTitle('');
          setScheduledDate('');
          setShowScheduler(false);
          setTimeout(() => setStatus(RequestStatus.IDLE), 3000);
        } else {
          setStatus(RequestStatus.ERROR);
          if (response && response.status === 401) {
            setErrorMessage("Não autorizado. Faça login no Substack.");
          } else {
            setErrorMessage(response?.message || response?.error || "Erro desconhecido.");
          }
        }
      });
    } else {
      // Simulation for Dev
      console.warn("Simulated Env: ", messageType, payload);
      setTimeout(() => {
        setStatus(RequestStatus.SUCCESS);
        setText('');
        setTitle('');
        setTimeout(() => setStatus(RequestStatus.IDLE), 3000);
      }, 1500);
    }
  }, [text, title, scheduledDate, activeTab]);

  return (
    <div className="flex flex-col h-full bg-white relative font-sans">
      {/* Header */}
      <header className="px-4 py-3 border-b border-gray-100 bg-white z-10">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-base font-bold text-gray-800 flex items-center gap-2">
            <span className="w-5 h-5 bg-[#FF6719] rounded text-white flex items-center justify-center text-[10px] font-bold">S</span>
            Substack Composer
          </h1>
          {status === RequestStatus.LOADING && (
            <span className="text-xs text-gray-400 animate-pulse">Processando...</span>
          )}
        </div>

        {/* Tabs */}
        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => { setActiveTab('note'); setStatus(RequestStatus.IDLE); }}
            className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-medium rounded-md transition-all ${
              activeTab === 'note' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <MessageSquare size={14} /> Note
          </button>
          <button
            onClick={() => { setActiveTab('post'); setStatus(RequestStatus.IDLE); }}
            className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-medium rounded-md transition-all ${
              activeTab === 'post' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <FileText size={14} /> Post (Draft)
          </button>
        </div>
      </header>

      <div className="flex-1 flex flex-col px-4 py-3 gap-3 overflow-y-auto">
        {/* Messages */}
        {status === RequestStatus.ERROR && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 text-xs text-red-700">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle size={14} />
              <span className="font-bold">Erro</span>
            </div>
            <p>{errorMessage}</p>
            {errorMessage.toLowerCase().includes('login') && (
               <button onClick={() => window.open(SUBSTACK_LOGIN_URL, '_blank')} className="mt-2 text-[10px] uppercase font-bold tracking-wide text-red-800 underline">
                 Fazer Login
               </button>
            )}
          </div>
        )}

        {status === RequestStatus.SUCCESS && (
          <div className="bg-green-50 border border-green-200 rounded-md p-3 text-xs text-green-700 flex items-center gap-2 animate-fade-in">
            <CheckCircle size={14} />
            <span className="font-medium">
              {activeTab === 'note' ? 'Note publicado!' : 'Rascunho salvo com sucesso!'}
            </span>
          </div>
        )}

        {/* Title Input (Post Only) */}
        {activeTab === 'post' && (
          <input
            type="text"
            className="w-full p-2 text-sm font-semibold border-b border-gray-200 focus:border-[#FF6719] outline-none placeholder:font-normal"
            placeholder="Título do Post"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={status === RequestStatus.LOADING}
          />
        )}

        {/* Main Text Area */}
        <textarea
          className="flex-1 w-full min-h-[140px] p-0 border-0 outline-none resize-none text-gray-700 text-sm leading-relaxed placeholder:text-gray-300"
          placeholder={activeTab === 'note' ? "O que está acontecendo?" : "Escreva seu rascunho aqui..."}
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={status === RequestStatus.LOADING}
        />

        {/* Scheduling (Note Only) */}
        {activeTab === 'note' && (
          <div className="flex flex-col gap-2 pt-2 border-t border-gray-50">
            <button 
              onClick={() => setShowScheduler(!showScheduler)}
              className={`text-xs flex items-center gap-1.5 w-fit font-medium transition-colors ${showScheduler || scheduledDate ? 'text-[#FF6719]' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <Calendar size={14} />
              {scheduledDate ? 'Agendado' : 'Agendar'}
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
        )}
      </div>

      <footer className="p-4 border-t border-gray-100">
        <button
          onClick={handlePublish}
          disabled={!text.trim() || (activeTab === 'post' && !title.trim()) || status === RequestStatus.LOADING}
          className={`w-full py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 text-sm font-semibold text-white transition-all transform active:scale-[0.98]
            ${(!text.trim() || (activeTab === 'post' && !title.trim()) || status === RequestStatus.LOADING)
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none' 
              : 'bg-[#FF6719] hover:bg-[#E5560D] shadow-md hover:shadow-lg'
            }`}
        >
          {status === RequestStatus.LOADING ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Send size={16} />
          )}
          {activeTab === 'note' 
            ? (scheduledDate ? 'Agendar Note' : 'Publicar Note') 
            : 'Salvar Rascunho'
          }
        </button>
      </footer>
    </div>
  );
};

export default App;