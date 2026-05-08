import { useState } from 'react';
import api from '../services/api';

function Login({ onLogin }) {
  const [loginType, setLoginType] = useState(null);
  const [isRegister, setIsRegister] = useState(false);
  const [step, setStep] = useState('form'); // 'form' or 'otp'
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      if (isRegister) {
        // Step 1: Send OTP or direct registration
        const { data } = await api.post('/auth/register', form);
        if (data.requiresOTP) {
          setMessage(data.message);
          setStep('otp');
        } else {
          // Account created directly (email service unavailable)
          localStorage.setItem('token', data.token);
          onLogin(data.user);
        }
      } else {
        // Login directly
        const { data } = await api.post('/auth/login', { email: form.email, password: form.password });
        localStorage.setItem('token', data.token);
        onLogin(data.user);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data } = await api.post('/auth/verify-otp', { email: form.email, otp });
      localStorage.setItem('token', data.token);
      onLogin(data.user);
    } catch (err) {
      setError(err.response?.data?.error || 'Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setError('');
    setMessage('');
    try {
      const { data } = await api.post('/auth/resend-otp', { email: form.email });
      setMessage(data.message);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to resend code.');
    }
  };

  // Role selection screen
  if (!loginType) {
    return (
      <div className="min-h-screen bg-entain-dark flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <img src="/entain-logo.svg" alt="Entain" className="w-16 h-16 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-white">FIFA 2026</h1>
            <p className="text-entain-accent font-semibold mt-1">ENTAIN PREDICTIONS</p>
            <p className="text-gray-400 text-sm mt-2">Predict & win Entain Points — no real money!</p>
          </div>

          <div className="bg-entain-navy rounded-xl p-6 shadow-xl border border-entain-blue/20">
            <h2 className="text-white text-xl font-semibold mb-6 text-center">Select Login Type</h2>
            <div className="flex flex-col gap-4">
              <button
                onClick={() => { setLoginType('admin'); setIsRegister(false); }}
                className="w-full bg-entain-blue/50 hover:bg-entain-blue border border-entain-blue/30 text-white font-semibold py-4 rounded-lg transition flex items-center justify-center gap-3"
              >
                <span className="text-2xl">🛡️</span>
                <div className="text-left">
                  <p className="font-bold">Admin</p>
                  <p className="text-gray-400 text-xs font-normal">Manage matches, settle results, view reports</p>
                </div>
              </button>
              <button
                onClick={() => setLoginType('employee')}
                className="w-full bg-entain-blue/50 hover:bg-entain-blue border border-entain-blue/30 text-white font-semibold py-4 rounded-lg transition flex items-center justify-center gap-3"
              >
                <span className="text-2xl">👤</span>
                <div className="text-left">
                  <p className="font-bold">Employee</p>
                  <p className="text-gray-400 text-xs font-normal">Place bets, view leaderboard, track your picks</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // OTP Verification screen
  if (step === 'otp') {
    return (
      <div className="min-h-screen bg-entain-dark flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <img src="/entain-logo.svg" alt="Entain" className="w-16 h-16 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-white">Verify Email</h1>
            <p className="text-gray-400 text-sm mt-2">Enter the 6-digit code sent to</p>
            <p className="text-entain-accent font-medium">{form.email}</p>
          </div>

          <form onSubmit={handleVerifyOTP} className="bg-entain-navy rounded-xl p-6 shadow-xl border border-entain-blue/20">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-2 rounded-lg mb-4 text-sm">
                {error}
              </div>
            )}
            {message && (
              <div className="bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-2 rounded-lg mb-4 text-sm">
                {message}
              </div>
            )}

            <div className="mb-6">
              <label htmlFor="otp" className="block text-gray-300 text-sm mb-2">Verification Code</label>
              <input
                id="otp"
                type="text"
                maxLength="6"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-entain-dark border border-entain-blue/30 rounded-lg px-4 py-3 text-white text-center text-2xl tracking-widest focus:outline-none focus:border-entain-accent transition"
                placeholder="000000"
                required
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full bg-entain-accent text-entain-dark font-bold py-2.5 rounded-lg hover:bg-entain-accent/90 transition disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify & Create Account'}
            </button>

            <div className="text-center mt-4">
              <button
                type="button"
                onClick={handleResendOTP}
                className="text-entain-accent text-sm hover:underline"
              >
                Resend code
              </button>
            </div>

            <button
              type="button"
              onClick={() => { setStep('form'); setOtp(''); setError(''); setMessage(''); }}
              className="w-full text-gray-500 hover:text-gray-300 text-sm mt-3 transition"
            >
              ← Back
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Login/Register form
  return (
    <div className="min-h-screen bg-entain-dark flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/entain-logo.svg" alt="Entain" className="w-16 h-16 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-white">FIFA 2026</h1>
          <p className="text-entain-accent font-semibold mt-1">ENTAIN PREDICTIONS</p>
          <div className="mt-3 inline-flex items-center gap-2 bg-entain-blue/30 px-3 py-1 rounded-full">
            <span>{loginType === 'admin' ? '🛡️' : '👤'}</span>
            <span className="text-gray-300 text-sm capitalize">{loginType} Login</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-entain-navy rounded-xl p-6 shadow-xl border border-entain-blue/20">
          <h2 className="text-white text-xl font-semibold mb-4">
            {isRegister ? 'Create Account' : 'Sign In'}
          </h2>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-2 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          {isRegister && (
            <div className="mb-4">
              <label htmlFor="name" className="block text-gray-300 text-sm mb-1">Name</label>
              <input
                id="name"
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-entain-dark border border-entain-blue/30 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-entain-accent transition"
                placeholder="Your name"
                required
              />
            </div>
          )}

          <div className="mb-4">
            <label htmlFor="email" className="block text-gray-300 text-sm mb-1">Email</label>
            <input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full bg-entain-dark border border-entain-blue/30 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-entain-accent transition"
              placeholder="firstname.lastname@entaingroup.com"
              required
            />
          </div>

          <div className="mb-6">
            <label htmlFor="password" className="block text-gray-300 text-sm mb-1">Password</label>
            <input
              id="password"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full bg-entain-dark border border-entain-blue/30 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-entain-accent transition"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-entain-accent text-entain-dark font-bold py-2.5 rounded-lg hover:bg-entain-accent/90 transition disabled:opacity-50"
          >
            {loading ? 'Loading...' : isRegister ? 'Create Account' : 'Sign In'}
          </button>

          {loginType === 'employee' && (
            <p className="text-gray-400 text-sm text-center mt-4">
              {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button
                type="button"
                onClick={() => { setIsRegister(!isRegister); setError(''); }}
                className="text-entain-accent hover:underline"
              >
                {isRegister ? 'Sign In' : 'Register'}
              </button>
            </p>
          )}

          <button
            type="button"
            onClick={() => { setLoginType(null); setError(''); setForm({ name: '', email: '', password: '' }); }}
            className="w-full text-gray-500 hover:text-gray-300 text-sm mt-4 transition"
          >
            ← Back to role selection
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
