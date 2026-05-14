import { useState, useEffect, useRef } from 'react';
import api from '../services/api';

function FloatingChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const currentUser = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    if (isOpen) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const { data } = await api.get('/groupchat');
      setMessages(data);
    } catch (err) {}
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || sending) return;
    setSending(true);
    try {
      await api.post('/groupchat', { message: input.trim() });
      setInput('');
      fetchMessages();
    } catch (err) {}
    finally { setSending(false); }
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-5 left-5 w-16 h-16 rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition z-50"
        aria-label="Open group chat"
        title="Group Chat"
      >
        {isOpen ? <span className="text-white text-2xl">✕</span> : <img src="/group-chat-icon.png" alt="Group Chat" className="w-14 h-14 brightness-0 invert border-2 border-white rounded-full p-1" />}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 left-5 w-80 sm:w-96 h-[500px] bg-entain-navy rounded-xl shadow-2xl border border-entain-blue/30 flex flex-col z-50 overflow-hidden">
          {/* Header */}
          <div className="bg-entain-dark px-4 py-3 border-b border-entain-blue/20 flex items-center gap-2">
            <span className="text-lg">💬</span>
            <div>
              <p className="text-white text-sm font-semibold">Group Chat</p>
              <p className="text-gray-400 text-xs">All employees & admins</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <p className="text-gray-500 text-center text-sm py-8">No messages yet. Start the conversation!</p>
            )}
            {messages.map((msg, i) => {
              const isMe = msg.user_id === currentUser?.id;
              const showName = i === 0 || messages[i - 1].user_id !== msg.user_id;

              return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%]`}>
                    {showName && !isMe && (
                      <p className="text-xs mb-0.5 ml-1">
                        <span className="text-entain-accent font-medium">{msg.user_name}</span>
                        {msg.user_role === 'admin' && <span className="text-yellow-400 ml-1 text-[10px]">ADMIN</span>}
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

          {/* Input */}
          <form onSubmit={sendMessage} className="p-3 border-t border-entain-blue/20 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
              maxLength={500}
              className="flex-1 bg-entain-dark border border-entain-blue/30 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-entain-accent transition"
              disabled={sending}
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className="bg-entain-accent text-entain-dark font-bold px-3 py-2 rounded-lg hover:bg-entain-accent/90 transition disabled:opacity-50 text-sm"
            >
              Send
            </button>
          </form>
        </div>
      )}
    </>
  );
}

export default FloatingChat;
