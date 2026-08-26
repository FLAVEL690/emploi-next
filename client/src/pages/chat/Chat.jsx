import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiSend, FiPaperclip, FiX, FiMessageSquare, FiFileText, FiArrowLeft } from 'react-icons/fi';
import { supabase } from '../../services/supabase';
import {
  getConversationsForUser,
  getConversationById,
  getMessages,
  sendMessage,
  markConversationRead,
  uploadChatDocument
} from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import './Chat.css';

const MAX_FILE_SIZE = 2 * 1024 * 1024;

const formatFileSize = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} Mo`;
};

const formatTime = (iso) => {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
};

export default function Chat() {
  const { user, authUser } = useAuth();
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [files, setFiles] = useState([]);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  const role = user?.role;
  const isCandidateView = role === 'candidate';
  const chatBase = isCandidateView ? '/candidate/chat' : '/recruiter/chat';

  const refreshConversations = useCallback(async () => {
    if (!authUser) return;
    try {
      const list = await getConversationsForUser(authUser.id);
      setConversations(list);
    } catch (error) {
      console.error('Erreur chargement conversations:', error);
    }
  }, [authUser]);

  useEffect(() => {
    refreshConversations().finally(() => setLoading(false));
  }, [refreshConversations]);

  const loadMessages = useCallback(async (convId) => {
    try {
      const msgs = await getMessages(convId);
      setMessages(msgs);
    } catch (error) {
      console.error('Erreur chargement messages:', error);
    }
  }, []);

  useEffect(() => {
    if (!authUser) return;
    if (!conversationId) {
      setSelected(null);
      setMessages([]);
      return;
    }
    const id = parseInt(conversationId, 10);
    const conv = conversations.find(c => c.id === id);
    if (conv) {
      setSelected(conv);
      loadMessages(id);
      markConversationRead(id, authUser.id);
    } else {
      getConversationById(id)
        .then(c => {
          setSelected(c);
          loadMessages(id);
          markConversationRead(id, authUser.id);
        })
        .catch(() => navigate(chatBase));
    }
  }, [conversationId, conversations, authUser, chatBase, navigate, loadMessages]);

  useEffect(() => {
    if (!selected || !authUser) return;
    const channel = supabase
      .channel(`messages:${selected.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${selected.id}`
      }, (payload) => {
        const msg = payload.new;
        setMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg]);
        refreshConversations();
        if (msg.sender_id !== authUser.id) {
          markConversationRead(selected.id, authUser.id);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selected, authUser, refreshConversations]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, selected]);

  const handleFiles = (e) => {
    const picked = Array.from(e.target.files || []);
    const valid = [];
    for (const f of picked) {
      if (f.size > MAX_FILE_SIZE) {
        alert(`Le fichier "${f.name}" dépasse la taille maximale de 2 Mo`);
        continue;
      }
      valid.push(f);
    }
    setFiles(prev => [...prev, ...valid].slice(0, 10));
    e.target.value = '';
  };

  const handleSend = async () => {
    if (sending || !selected) return;
    if (!text.trim() && files.length === 0) return;

    setSending(true);
    try {
      const attachments = [];
      for (const f of files) {
        const { url } = await uploadChatDocument(f);
        attachments.push({ name: f.name, size: f.size, type: f.type || 'document', url });
      }
      const msg = await sendMessage(selected.id, authUser.id, text.trim(), attachments);
      setMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg]);
      setText('');
      setFiles([]);
      refreshConversations();
    } catch (error) {
      alert(error.message || 'Erreur lors de l\'envoi du message');
    } finally {
      setSending(false);
    }
  };

  if (loading && conversations.length === 0) {
    return <div className="loading-spinner"><div className="spinner"></div></div>;
  }

  const otherName = (conv) => isCandidateView
    ? (conv.recruiter?.company || `${conv.recruiter?.first_name || ''} ${conv.recruiter?.last_name || ''}`.trim() || 'Entreprise')
    : `${conv.candidate?.first_name || ''} ${conv.candidate?.last_name || ''}`.trim() || 'Candidat';

  const threadTitle = selected
    ? isCandidateView
      ? (selected.recruiter?.company || selected.recruiter?.first_name || 'Entreprise')
      : `${selected.candidate?.first_name || ''} ${selected.candidate?.last_name || ''}`.trim() || 'Candidat'
    : '';

  const hasRequiredDocs = selected?.job && (
    selected.job.require_cv || selected.job.require_cover_letter || selected.job.other_documents
  );

  return (
    <div className="chat-page">
      <div className="page-header">
        <h1>Messagerie</h1>
        <p>{isCandidateView ? 'Échangez avec les recruteurs et envoyez vos documents' : 'Discutez avec les candidats et recevez leurs documents'}</p>
      </div>

      <div className="chat-layout">
        <aside className={`chat-list ${selected ? 'chat-list-hidden-mobile' : ''}`}>
          {conversations.length === 0 ? (
            <div className="chat-empty">
              <FiMessageSquare size={36} />
              <h3>Aucune conversation</h3>
              <p>
                {isCandidateView
                  ? 'Postulez à une offre pour démarrer une discussion avec le recruteur.'
                  : 'Les discussions des candidats ayant postulé à vos offres apparaîtront ici.'}
              </p>
            </div>
          ) : (
            conversations.map(conv => (
              <button
                key={conv.id}
                className={`chat-list-item ${selected?.id === conv.id ? 'active' : ''}`}
                onClick={() => navigate(`${chatBase}/${conv.id}`)}
              >
                <div className="chat-avatar">
                  {conv.candidate_id === authUser?.id ? (
                    conv.recruiter?.avatar ? <img src={conv.recruiter.avatar} alt="" /> : (conv.recruiter?.company?.[0] || conv.recruiter?.first_name?.[0] || 'E')
                  ) : (
                    conv.candidate?.avatar ? <img src={conv.candidate.avatar} alt="" /> : (`${conv.candidate?.first_name?.[0] || ''}${conv.candidate?.last_name?.[0] || ''}` || 'C')
                  )}
                </div>
                <div className="chat-list-info">
                  <div className="chat-list-top">
                    <strong>{otherName(conv)}</strong>
                    {conv.lastMessage && <span className="chat-time">{formatTime(conv.lastMessage.created_at)}</span>}
                  </div>
                  <div className="chat-list-bottom">
                    <span className="chat-last">{conv.job?.title}</span>
                    {conv.unreadCount > 0 && <span className="chat-unread">{conv.unreadCount}</span>}
                  </div>
                </div>
              </button>
            ))
          )}
        </aside>

        <section className="chat-thread">
          {!selected ? (
            <div className="chat-thread-empty">
              <FiMessageSquare size={48} />
              <h3>Sélectionnez une conversation</h3>
              <p>Choisissez une conversation dans la liste pour afficher les échanges.</p>
            </div>
          ) : (
            <>
              <div className="chat-thread-header">
                <button className="chat-back" onClick={() => navigate(chatBase)} aria-label="Retour"><FiArrowLeft /></button>
                <div className="chat-thread-title">
                  <strong>{threadTitle}</strong>
                  <span className="chat-thread-sub">{selected.job?.title}{selected.job?.company ? ` · ${selected.job.company}` : ''}</span>
                </div>
              </div>

              {hasRequiredDocs && (
                <div className="chat-docs-banner">
                  <strong><FiFileText /> Documents demandés par le recruteur</strong>
                  <ul>
                    {selected.job.require_cv && <li>CV (Curriculum Vitae)</li>}
                    {selected.job.require_cover_letter && <li>Lettre de motivation</li>}
                    {selected.job.other_documents && <li>{selected.job.other_documents}</li>}
                  </ul>
                  <p>Joignez vos documents ci-dessous (max 2 Mo par document).</p>
                </div>
              )}

              <div className="chat-messages">
                {messages.length === 0 ? (
                  <div className="chat-messages-empty">
                    <p>Aucun message pour l'instant. Envoyez votre candidature avec les documents demandés.</p>
                  </div>
                ) : (
                  messages.map(m => {
                    const mine = m.sender_id === authUser?.id;
                    return (
                      <div key={m.id} className={`chat-message ${mine ? 'mine' : 'theirs'}`}>
                        {m.content && <p className="chat-message-text">{m.content}</p>}
                        {m.attachments?.length > 0 && (
                          <div className="chat-attachments">
                            {m.attachments.map((a, i) => (
                              <a key={i} href={a.url} target="_blank" rel="noopener noreferrer" className="chat-attachment">
                                <FiFileText />
                                <div>
                                  <span className="chat-attachment-name">{a.name}</span>
                                  <span className="chat-attachment-size">{formatFileSize(a.size)}</span>
                                </div>
                              </a>
                            ))}
                          </div>
                        )}
                        <span className="chat-message-time">{formatTime(m.created_at)}</span>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {files.length > 0 && (
                <div className="chat-file-preview">
                  {files.map((f, i) => (
                    <span key={i} className="chat-file-chip">
                      <FiFileText />
                      <span className="chat-file-chip-name">{f.name} ({formatFileSize(f.size)})</span>
                      <button type="button" onClick={() => setFiles(files.filter((_, idx) => idx !== i))} aria-label="Retirer"><FiX /></button>
                    </span>
                  ))}
                </div>
              )}

              <div className="chat-composer">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFiles}
                  style={{ display: 'none' }}
                />
                <button
                  className="chat-attach-btn"
                  onClick={() => fileInputRef.current?.click()}
                  title="Joindre un document (max 2 Mo)"
                >
                  <FiPaperclip />
                </button>
                <textarea
                  className="chat-input"
                  rows={1}
                  placeholder="Écrivez votre message..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                />
                <button
                  className="chat-send-btn"
                  onClick={handleSend}
                  disabled={sending || (!text.trim() && files.length === 0)}
                >
                  <FiSend />
                </button>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
