import React, { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

type SignUpProps = {
  onNavigate: (page: string) => void;
};

export const SignUp: React.FC<SignUpProps> = ({ onNavigate }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);

      const response = await axios.post(
        'http://127.0.0.1:5000/api/auth/signup',
        { username, password },
        { withCredentials: true }
      );

      toast.success(response.data.message || 'Account created successfully');

      // ✅ Verify user is authenticated (cookie was set)
      const authRes = await axios.get('http://127.0.0.1:5000/api/auth/check', {
        withCredentials: true,
      });

      if (authRes.data.isAuthenticated) {
        toast.success('Signed in successfully');
        onNavigate('courses');
      } else {
        toast.error('Signup succeeded but not authenticated. Please log in.');
        onNavigate('LogIn');
      }

    } catch (error: any) {
      console.error('Signup error:', error);
      const errorMsg = error.response?.data?.error || 'Signup failed. Try again.';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-6 border border-gray-300 rounded shadow">
      <h2 className="text-2xl font-bold mb-4 text-center">Sign Up</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1">Username</label>
          <input
            type="text"
            className="w-full border px-3 py-2 rounded"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block mb-1">Email</label>
          <input
            type="email"
            className="w-full border px-3 py-2 rounded"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block mb-1">Password</label>
          <input
            type="password"
            className="w-full border px-3 py-2 rounded"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600 transition"
        >
          {loading ? 'Creating...' : 'Create Account'}
        </button>
      </form>
    </div>
  );
};
