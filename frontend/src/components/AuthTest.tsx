import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export const AuthTest: React.FC = () => {
  const { user, signIn, signUp, signOut, loading } = useAuth();
  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSignUp = async () => {
    try {
      setError('');
      setSuccess('');
      await signUp(email, password, 'Test User');
      setSuccess('Sign up successful! Check your email for verification.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign up failed');
    }
  };

  const handleSignIn = async () => {
    try {
      setError('');
      setSuccess('');
      await signIn(email, password);
      setSuccess('Sign in successful!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed');
    }
  };

  const handleSignOut = async () => {
    try {
      setError('');
      setSuccess('');
      await signOut();
      setSuccess('Signed out successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign out failed');
    }
  };

  if (loading) {
    return <div className="text-center">Loading authentication...</div>;
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Authentication Test</h2>
      
      {user ? (
        <div className="space-y-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded">
            <h3 className="text-green-800 font-medium">✅ Authenticated!</h3>
            <p className="text-green-600 text-sm">Email: {user.email}</p>
            <p className="text-green-600 text-sm">ID: {user.id}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Sign Out
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handleSignUp}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Sign Up
            </button>
            <button
              onClick={handleSignIn}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Sign In
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
          <p className="text-green-600 text-sm">{success}</p>
        </div>
      )}
    </div>
  );
};
