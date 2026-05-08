import { useState } from 'react';
import api from '../services/api';

function ChangePassword() {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (form.newPassword !== form.confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    if (form.newPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.put('/auth/change-password', {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword
      });
      setMessage(data.message);
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to change password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-white mb-6">Change Password</h2>

      <form onSubmit={handleSubmit} className="bg-entain-navy rounded-xl p-6 border border-entain-blue/20">
        {message && (
          <div className="bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-2 rounded-lg mb-4 text-sm">
            {message}
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-2 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <div className="mb-4">
          <label htmlFor="currentPassword" className="block text-gray-300 text-sm mb-1">Current Password</label>
          <input
            id="currentPassword"
            type="password"
            value={form.currentPassword}
            onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
            className="w-full bg-entain-dark border border-entain-blue/30 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-entain-accent transition"
            required
          />
        </div>

        <div className="mb-4">
          <label htmlFor="newPassword" className="block text-gray-300 text-sm mb-1">New Password</label>
          <input
            id="newPassword"
            type="password"
            value={form.newPassword}
            onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
            className="w-full bg-entain-dark border border-entain-blue/30 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-entain-accent transition"
            required
          />
        </div>

        <div className="mb-6">
          <label htmlFor="confirmPassword" className="block text-gray-300 text-sm mb-1">Confirm New Password</label>
          <input
            id="confirmPassword"
            type="password"
            value={form.confirmPassword}
            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
            className="w-full bg-entain-dark border border-entain-blue/30 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-entain-accent transition"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-entain-accent text-entain-dark font-bold py-2.5 rounded-lg hover:bg-entain-accent/90 transition disabled:opacity-50"
        >
          {loading ? 'Updating...' : 'Change Password'}
        </button>
      </form>
    </div>
  );
}

export default ChangePassword;
