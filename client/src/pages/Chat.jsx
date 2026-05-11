import { useState, useEffect, useRef } from 'react';
import api from '../services/api';

function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const currentUser = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const { data } = await api.get('/groupchat');
      setMessages(data);
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || sending) return;

    setSending(true);
    try {
      await api.post('/groupchat', { message: input.trim() });
      setInput('');
      fetchMessages();
    } catch (err) {
      console.error('Failed to send message:', err);
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
        <h2 className="text-2xl font-bold text-white">💬 Group Chat</h2>
        <p className="text-gray-400 text-xs">All employees & admins</p>
      </div>

      {/* Messages */}
      <div className="flex-1 bg-entain-navy rounded-xl border border-entain-blue/20 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-gray-500 text-center text-sm py-8">No messages yet. Start the conversation!</p>
        )}

        {messages.map((msg, i) => {
          const isMe = msg.user_id === currentUser?.id;
          const showName = i === 0 || messages[i - 1].user_id !== msg.user_id;

          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'}`}>
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
      <form onSubmit={sendMessage} className="mt-3 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          maxLength={500}
          className="flex-1 bg-entain-navy border border-entain-blue/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-entain-accent transition"
          disabled={sending}
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          className="bg-entain-accent text-entain-dark font-bold px-5 py-3 rounded-lg hover:bg-entain-accent/90 transition disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}

export default Chat;
