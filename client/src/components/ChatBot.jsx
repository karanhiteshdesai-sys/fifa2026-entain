import { useState, useRef, useEffect } from 'react';
import api from '../services/api';

function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'bot', text: "Hi! I'm your FIFA 2026 assistant. Ask me about matches, teams, odds, or how the platform works!" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const { data } = await api.post('/chat', { message: userMsg });
      setMessages(prev => [...prev, { role: 'bot', text: data.reply }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'bot', text: 'Sorry, I\'m having trouble right now. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Chat Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-5 right-5 w-16 h-16 rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition z-50"
        aria-label="Open AI assistant"
        title="AI Assistant"
      >
        {isOpen ? <span className="text-white text-2xl">✕</span> : <img src="/ai-bot-icon.png" alt="AI Assistant" className="w-14 h-14 brightness-0 invert" />}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-5 w-80 sm:w-96 h-[500px] bg-entain-navy rounded-xl shadow-2xl border border-entain-blue/30 flex flex-col z-50 overflow-hidden">
          {/* Header */}
          <div className="bg-entain-dark px-4 py-3 border-b border-entain-blue/20 flex items-center gap-2">
            <span className="text-lg">🤖</span>
            <div>
              <p className="text-white text-sm font-semibold">FIFA 2026 Assistant</p>
              <p className="text-entain-accent text-xs">Powered by AI</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] px-3 py-2 rounded-lg text-sm ${
                  msg.role === 'user'
                    ? 'bg-entain-accent text-entain-dark'
                    : 'bg-entain-dark text-gray-200 border border-entain-blue/20'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-entain-dark text-gray-400 px-3 py-2 rounded-lg text-sm border border-entain-blue/20">
                  Thinking...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={sendMessage} className="p-3 border-t border-entain-blue/20 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about FIFA 2026..."
              className="flex-1 bg-entain-dark border border-entain-blue/30 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-entain-accent transition"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
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

export default ChatBot;
