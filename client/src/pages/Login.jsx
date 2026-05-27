import { useState, useEffect } from 'react';
import api from '../services/api';

function Login({ onLogin }) {
  const [loginType, setLoginType] = useState(null);
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', department: '', country: '', referralCode: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Auto-fill referral code from URL parameter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) {
      setForm(prev => ({ ...prev, referralCode: ref }));
      setIsRegister(true);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (isRegister) {
        if (form.password !== form.confirmPassword) {
          setError('Passwords do not match.');
          setLoading(false);
          return;
        }
        const { data } = await api.post('/auth/register', {
          name: form.name,
          email: form.email,
          password: form.password,
          department: form.department,
          country: form.country,
          referral_code: form.referralCode
        });
        // Switch to sign in view with success message
        setIsRegister(false);
        setSuccess(data.message);
        setForm({ name: '', email: '', password: '', confirmPassword: '', department: '', country: '', referralCode: '' });
      } else {
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

          {success && (
            <div className="bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-2 rounded-lg mb-4 text-sm">
              {success}
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

          {isRegister && (
            <div className="mb-4">
              <label htmlFor="name" className="block text-gray-300 text-sm mb-1">Full Name</label>
              <input
                id="name"
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-entain-dark border border-entain-blue/30 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-entain-accent transition"
                placeholder="Your full name"
                required
              />
            </div>
          )}

          <div className="mb-4">
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

          {isRegister && (
            <div className="mb-4">
              <label htmlFor="confirmPassword" className="block text-gray-300 text-sm mb-1">Confirm Password</label>
              <input
                id="confirmPassword"
                type="password"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                className="w-full bg-entain-dark border border-entain-blue/30 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-entain-accent transition"
                placeholder="••••••••"
                required
              />
            </div>
          )}

          {isRegister && (
            <div className="mb-6">
              <label htmlFor="department" className="block text-gray-300 text-sm mb-1">Department</label>
              <input
                id="department"
                type="text"
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                className="w-full bg-entain-dark border border-entain-blue/30 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-entain-accent transition"
                placeholder="e.g. Engineering, QA, Marketing"
                required
              />
            </div>
          )}

          {isRegister && (
            <div className="mb-6">
              <label htmlFor="country" className="block text-gray-300 text-sm mb-1">Country (Office Location)</label>
              <select
                id="country"
                value={form.country || ''}
                onChange={(e) => setForm({ ...form, country: e.target.value })}
                className="w-full bg-entain-dark border border-entain-blue/30 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-entain-accent transition"
                required
              >
                <option value="" disabled>Select your office country</option>
                <option value="United Kingdom">United Kingdom</option>
                <option value="India">India</option>
                <option value="Gibraltar">Gibraltar</option>
                <option value="Australia">Australia</option>
                <option value="Bulgaria">Bulgaria</option>
                <option value="Colombia">Colombia</option>
                <option value="Georgia">Georgia</option>
                <option value="Austria">Austria</option>
                <option value="Germany">Germany</option>
                <option value="Ireland">Ireland</option>
                <option value="Italy">Italy</option>
                <option value="Spain">Spain</option>
                <option value="Poland">Poland</option>
                <option value="Czech Republic">Czech Republic</option>
                <option value="Latvia">Latvia</option>
                <option value="Estonia">Estonia</option>
                <option value="Lithuania">Lithuania</option>
                <option value="Sweden">Sweden</option>
                <option value="Finland">Finland</option>
                <option value="Denmark">Denmark</option>
                <option value="Netherlands">Netherlands</option>
                <option value="Brazil">Brazil</option>
                <option value="USA">USA</option>
                <option value="Israel">Israel</option>
                <option value="Philippines">Philippines</option>
                <option value="New Zealand">New Zealand</option>
              </select>
            </div>
          )}

          {isRegister && (
            <div className="mb-6">
              <label htmlFor="referralCode" className="block text-gray-300 text-sm mb-1">Referral Code <span className="text-gray-500">(optional)</span></label>
              <input
                id="referralCode"
                type="text"
                value={form.referralCode}
                onChange={(e) => setForm({ ...form, referralCode: e.target.value })}
                className="w-full bg-entain-dark border border-entain-blue/30 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-entain-accent transition"
                placeholder="e.g. FIFA-KAR8X2M1"
              />
              <p className="text-gray-500 text-xs mt-1">Your referrer gets an Entain Tag upgrade when you're approved!</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-entain-accent text-entain-dark font-bold py-2.5 rounded-lg hover:bg-entain-accent/90 transition disabled:opacity-50"
          >
            {loading ? 'Loading...' : isRegister ? 'Create Account' : 'Sign In'}
          </button>

          {!isRegister && (
            <p className="text-gray-500 text-xs text-center mt-3">
              Forgot your password?{' '}
              <button
                type="button"
                onClick={() => setError('Please contact the admin (karan.desai@entaingroup.com) to reset your password.')}
                className="text-entain-accent hover:underline"
              >
                Reset Password
              </button>
            </p>
          )}

          {loginType === 'employee' && (
            <p className="text-gray-400 text-sm text-center mt-4">
              {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button
                type="button"
                onClick={() => { setIsRegister(!isRegister); setError(''); setSuccess(''); }}
                className="text-entain-accent hover:underline"
              >
                {isRegister ? 'Sign In' : 'Register'}
              </button>
            </p>
          )}

          <button
            type="button"
            onClick={() => { setLoginType(null); setError(''); setSuccess(''); setForm({ name: '', email: '', password: '', confirmPassword: '', department: '', country: '', referralCode: '' }); }}
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
