import React, { useState } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import { SignUp } from './SignUp';

type LogInProps = {
  onNavigate: (page: string) => void;
  setAuthenticated: (value: boolean) => void;
};

export const LogIn: React.FC<LogInProps> = ({ onNavigate, setAuthenticated }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showSignUp, setShowSignUp] = useState(false); // ← Track SignUp view

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error('Username and password required');
      return;
    }

    try {
      const response = await axios.post(
        'https://ailearning-2.onrender.com/api/auth/login',
        { username, password },
        { withCredentials: true }
      );
      setAuthenticated(true);
      onNavigate('home')
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Login failed.');
    }
  };

  if (showSignUp) {
    return <SignUp setAuthenticated={setAuthenticated} onNavigate={onNavigate} />;
  }

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
        <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded">
          Log In
        </button>
      </form>

      <div className="mt-4 text-center">
        <p>Don't have an account?</p>
        <button
          onClick={() => setShowSignUp(true)}
          className="mt-2 w-full bg-gray-200 py-2 rounded"
        >
          Sign Up
        </button>
      </div>
    </div>
  );
};
