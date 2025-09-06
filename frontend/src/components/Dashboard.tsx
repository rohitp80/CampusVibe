import React from 'react';
import { useAuth } from '../context/AuthContext';

export const Dashboard: React.FC = () => {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">CampusConnect</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Welcome, {user?.email}</span>
              <button
                onClick={handleSignOut}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                🎉 Authentication Working!
              </h2>
              <p className="text-gray-600 mb-4">
                You are successfully logged in as: <strong>{user?.email}</strong>
              </p>
              <p className="text-gray-500">
                User ID: {user?.id}
              </p>
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
                <p className="text-green-800 font-medium">✅ Frontend-Backend Connection Complete!</p>
                <p className="text-green-600 text-sm mt-1">
                  Authentication is working through Supabase
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
