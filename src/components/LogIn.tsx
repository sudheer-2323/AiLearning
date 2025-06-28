import React, { useState } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';

type LogInProps = {
  onNavigate: (page: string) => void;
  setAuthenticated: (value: boolean) => void;
};

export const LogIn: React.FC<LogInProps> = ({ onNavigate, setAuthenticated }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error('Username and password required');
      return;
    }

    try {
      console.log('Sending login request:', { username });
      const response = await axios.post(
        'http://127.0.0.1:5000/api/auth/login',
        { username, password },
        { withCredentials: true }
      );
      console.log('Login response:', response.data, 'Cookies:', document.cookie);
      setAuthenticated(true);
      onNavigate('home');
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.response?.data?.error || 'Login failed. Please check your credentials.');
    }
  };

  const handleSignUp = () => {
    onNavigate('SignUp');
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-6 border border-gray-300 rounded shadow">
      <Toaster />
      <h2 className="text-2xl font-bold mb-4 text-center">Login</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1">Username</label>
          <input
            type="text"
            className="w-full border px-3 py-2 rounded"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block mb-1">Password</label>
          <input
            type="password"
            className="w-full border px-3 py-2 rounded"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition"
        >
          Log In
        </button>
      </form>

      <div className="mt-4 text-center">
        <p>Don't have an account?</p>
        <button
          onClick={handleSignUp}
          className="mt-2 w-full bg-gray-200 text-gray-800 py-2 rounded hover:bg-gray-300 transition"
        >
          Sign Up
        </button>
      </div>
    </div>
  );
};