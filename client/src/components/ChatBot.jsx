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

  const [pendingBet, setPendingBet] = useState(null);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);

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
      speakText(data.reply);
      if (data.betData) {
        setPendingBet(data.betData);
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'bot', text: 'Sorry, I\'m having trouble right now. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  const confirmBet = async () => {
    if (!pendingBet) return;
    setLoading(true);
    setPendingBet(null);
    setMessages(prev => [...prev, { role: 'user', text: 'Yes, confirm the bet!' }]);

    try {
      const { data } = await api.post('/chat', { message: '__CONFIRM_BET__', betData: pendingBet });
      setMessages(prev => [...prev, { role: 'bot', text: data.reply }]);
      // Refresh user points
      const { data: userData } = await api.get('/auth/me');
      const stored = JSON.parse(localStorage.getItem('user'));
      localStorage.setItem('user', JSON.stringify({ ...stored, points: userData.points }));
    } catch (err) {
      setMessages(prev => [...prev, { role: 'bot', text: 'Failed to place the bet. Try again or do it manually from Matches.' }]);
    } finally {
      setLoading(false);
    }
  };

  const cancelBet = () => {
    setPendingBet(null);
    setMessages(prev => [...prev, { role: 'user', text: 'No, cancel it.' }, { role: 'bot', text: 'No worries, bet cancelled. Let me know if you want to try something else.' }]);
  };

  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const toggleListening = () => {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setMessages(prev => [...prev, { role: 'bot', text: 'Sorry, your browser does not support voice input.' }]);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput('');
      setMessages(prev => [...prev, { role: 'user', text: transcript }]);
      setLoading(true);
      api.post('/chat', { message: transcript }).then(({ data }) => {
        setMessages(prev => [...prev, { role: 'bot', text: data.reply }]);
        speakText(data.reply);
        if (data.betData) setPendingBet(data.betData);
      }).catch((err) => {
        console.error('Voice chat error:', err);
        setMessages(prev => [...prev, { role: 'bot', text: err.response?.data?.error || 'Sorry, I\'m having trouble right now. Please try again.' }]);
      }).finally(() => { setLoading(false); });
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  return (
    <>
      {/* Chat Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-5 right-5 w-20 h-20 rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition z-50"
        aria-label="Open AI assistant"
        title="AI Assistant"
      >
        {isOpen ? <span className="text-white text-2xl">✕</span> : <img src="/ai-bot-icon.png" alt="AI Assistant" className="w-18 h-18 brightness-0 invert" style={{width: '4.5rem', height: '4.5rem'}} />}
      </button>

      {/* Tooltip label */}
      {!isOpen && (
        <div className="fixed bottom-[6.5rem] right-2 bg-white text-entain-dark text-xs font-semibold px-3 py-1.5 rounded-lg shadow-lg z-[60] max-w-[180px] text-center leading-tight">
          Think you know the winner? Let's find out together
          <div className="absolute -bottom-1.5 right-8 w-3 h-3 bg-white rotate-45"></div>
        </div>
      )}

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
            {pendingBet && !loading && (
              <div className="flex justify-start">
                <div className="flex gap-2">
                  <button
                    onClick={confirmBet}
                    className="bg-entain-green text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-entain-green/90 transition"
                  >
                    Confirm Bet
                  </button>
                  <button
                    onClick={cancelBet}
                    className="bg-entain-red/80 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-entain-red transition"
                  >
                    Cancel
                  </button>
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
              type="button"
              onClick={toggleListening}
              className={`px-3 py-2 rounded-lg text-sm transition ${
                listening
                  ? 'bg-red-500 text-white animate-pulse'
                  : 'bg-entain-dark text-gray-300 border border-entain-blue/30 hover:text-white'
              }`}
              title={listening ? 'Stop listening' : 'Speak'}
            >
              🎤
            </button>
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
