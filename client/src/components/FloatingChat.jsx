import { useState, useEffect, useRef } from 'react';
import api from '../services/api';

function FloatingChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [typingUsers, setTypingUsers] = useState([]);
  const messagesEndRef = useRef(null);
  const lastSeenCount = useRef(0);
  const typingTimeout = useRef(null);
  const currentUser = JSON.parse(localStorage.getItem('user'));

  // Poll for new messages even when chat is closed
  useEffect(() => {
    const checkNewMessages = async () => {
      try {
        const { data } = await api.get('/groupchat');
        if (!isOpen) {
          const newCount = data.length - lastSeenCount.current;
          if (newCount > 0) setUnreadCount(newCount);
        } else {
          setMessages(data);
          lastSeenCount.current = data.length;
          setUnreadCount(0);
        }
      } catch {}
    };

    checkNewMessages();
    const interval = setInterval(checkNewMessages, 5000);
    return () => clearInterval(interval);
  }, [isOpen]);

  // When chat opens, mark as read
  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
      lastSeenCount.current = messages.length;
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Poll typing indicators when chat is open
  useEffect(() => {
    if (!isOpen) return;
    const pollTyping = async () => {
      try {
        const { data } = await api.get('/groupchat/typing');
        setTypingUsers(data);
      } catch {}
    };
    pollTyping();
    const interval = setInterval(pollTyping, 2000);
    return () => clearInterval(interval);
  }, [isOpen]);

  const handleInputChange = (e) => {
    setInput(e.target.value);
    // Send typing indicator (throttled)
    if (!typingTimeout.current) {
      api.post('/groupchat/typing').catch(() => {});
      typingTimeout.current = setTimeout(() => { typingTimeout.current = null; }, 2000);
    }
  };

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
        className="fixed bottom-5 left-5 w-20 h-20 rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition z-50"
        aria-label="Open group chat"
        title="Group Chat"
      >
        {isOpen ? <span className="text-white text-2xl">✕</span> : <img src="/group-chat-icon.png" alt="Group Chat" className="w-18 h-18 brightness-0 invert" style={{width: '4.5rem', height: '4.5rem'}} />}
        {!isOpen && unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shadow-lg">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
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

          {/* Typing indicator */}
          {typingUsers.length > 0 && (
            <div className="px-4 py-1">
              <p className="text-gray-400 text-xs italic">
                {typingUsers.map(u => u.name).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
              </p>
            </div>
          )}

          {/* Input */}
          <form onSubmit={sendMessage} className="p-3 border-t border-entain-blue/20 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={handleInputChange}
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
