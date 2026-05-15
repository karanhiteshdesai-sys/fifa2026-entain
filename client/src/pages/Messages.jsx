import { useState, useEffect, useRef } from 'react';
import api from '../services/api';

function Messages() {
  const [inbox, setInbox] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const currentUser = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    fetchInbox();
    const interval = setInterval(fetchInbox, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (activeConversation) {
      fetchConversation(activeConversation.partner_id);
      const interval = setInterval(() => fetchConversation(activeConversation.partner_id), 4000);
      return () => clearInterval(interval);
    }
  }, [activeConversation?.partner_id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchInbox = async () => {
    try {
      const { data } = await api.get('/dm/inbox');
      setInbox(data);
    } catch (err) {
      console.error('Failed to fetch inbox:', err);
    }
  };

  const fetchConversation = async (partnerId) => {
    try {
      const { data } = await api.get(`/dm/conversation/${partnerId}`);
      setMessages(data);
    } catch (err) {
      console.error('Failed to fetch conversation:', err);
    }
  };

  const openConversation = (conv) => {
    setActiveConversation(conv);
    fetchConversation(conv.partner_id);
  };

  const sendReply = async (e) => {
    e.preventDefault();
    if (!input.trim() || sending || !activeConversation) return;

    setSending(true);
    try {
      await api.post('/dm/reply', {
        to_user_id: activeConversation.partner_id,
        message: input.trim()
      });
      setInput('');
      fetchConversation(activeConversation.partner_id);
    } catch (err) {
      console.error('Failed to send reply:', err);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    if (isToday) {
      return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-white">✉️ Messages</h2>
        <p className="text-gray-400 text-xs">Direct messages from admin</p>
      </div>

      <div className="flex flex-1 gap-4 min-h-0">
        {/* Inbox List */}
        <div className="w-full sm:w-72 bg-entain-navy rounded-xl border border-entain-blue/20 overflow-y-auto flex-shrink-0">
          <div className="px-4 py-3 border-b border-entain-blue/20">
            <h3 className="text-white font-semibold text-sm">Inbox</h3>
          </div>
          {inbox.length === 0 && (
            <p className="text-gray-500 text-center text-sm py-8">No messages yet.</p>
          )}
          {inbox.map((conv) => (
            <button
              key={conv.partner_id}
              onClick={() => openConversation(conv)}
              className={`w-full text-left px-4 py-3 border-b border-entain-blue/10 hover:bg-entain-dark/50 transition ${
                activeConversation?.partner_id === conv.partner_id ? 'bg-entain-dark/70' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="text-white font-medium text-sm truncate">
                  {conv.partner_name}
                  {conv.partner_role === 'admin' && (
                    <span className="text-yellow-400 ml-1 text-[10px]">ADMIN</span>
                  )}
                </p>
                {conv.unread > 0 && (
                  <span className="bg-entain-accent text-entain-dark text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {conv.unread}
                  </span>
                )}
              </div>
              <p className="text-gray-400 text-xs truncate mt-0.5">{conv.last_message}</p>
              <p className="text-gray-600 text-[10px] mt-0.5">{formatTime(conv.last_message_at)}</p>
            </button>
          ))}
        </div>

        {/* Conversation */}
        <div className="flex-1 flex flex-col bg-entain-navy rounded-xl border border-entain-blue/20 min-h-0 hidden sm:flex">
          {!activeConversation ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-gray-500 text-sm">Select a conversation to view messages</p>
            </div>
          ) : (
            <>
              {/* Conversation Header */}
              <div className="px-4 py-3 border-b border-entain-blue/20 flex items-center justify-between">
                <div>
                  <p className="text-white font-semibold text-sm">
                    {activeConversation.partner_name}
                    {activeConversation.partner_role === 'admin' && (
                      <span className="text-yellow-400 ml-1 text-[10px]">ADMIN</span>
                    )}
                  </p>
                </div>
                <button
                  onClick={() => setActiveConversation(null)}
                  className="text-gray-400 hover:text-white text-sm sm:hidden"
                >
                  ← Back
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 && (
                  <p className="text-gray-500 text-center text-sm py-8">No messages in this conversation.</p>
                )}
                {messages.map((msg) => {
                  const isMe = msg.from_user_id === currentUser?.id;
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%]`}>
                        {!isMe && (
                          <p className="text-xs mb-0.5 ml-1">
                            <span className="text-entain-accent font-medium">{msg.from_name}</span>
                            {msg.from_role === 'admin' && <span className="text-yellow-400 ml-1 text-[10px]">ADMIN</span>}
                          </p>
                        )}
                        <div className={`px-3 py-2 rounded-lg text-sm ${
                          isMe
                            ? 'bg-entain-accent text-entain-dark rounded-br-none'
                            : 'bg-entain-dark text-gray-200 border border-entain-blue/20 rounded-bl-none'
                        }`}>
                          <p>{msg.message}</p>
                          <p className={`text-[10px] mt-1 ${isMe ? 'text-entain-dark/60' : 'text-gray-500'}`}>
                            {formatTime(msg.created_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Reply Input */}
              <form onSubmit={sendReply} className="px-4 py-3 border-t border-entain-blue/20 flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type a reply..."
                  maxLength={1000}
                  className="flex-1 bg-entain-dark border border-entain-blue/30 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-entain-accent placeholder-gray-500"
                  disabled={sending}
                />
                <button
                  type="submit"
                  disabled={sending || !input.trim()}
                  className="bg-entain-accent text-entain-dark font-bold px-4 py-2.5 rounded-lg hover:bg-entain-accent/90 transition disabled:opacity-50 text-sm"
                >
                  {sending ? '...' : 'Reply'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Messages;
