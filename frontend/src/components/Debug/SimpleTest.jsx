import React from 'react';
import { useApp } from '../../context/AppContext.jsx';

const SimpleTest = () => {
  const { state, actions } = useApp();

  const testFlow = () => {
    console.log('=== TESTING FRIEND REQUEST FLOW ===');
    
    // Clear everything first
    localStorage.removeItem('friendRequests');
    
    // Create a test request
    const testRequest = {
      id: 12345,
      from: 'testuser1',
      to: state.currentUser?.username,
      status: 'pending'
    };
    
    // Save directly to localStorage
    localStorage.setItem('friendRequests', JSON.stringify([testRequest]));
    
    console.log('Saved test request:', testRequest);
    console.log('localStorage now:', localStorage.getItem('friendRequests'));
    
    // Force refresh
    actions.refreshFriendData();
    
    setTimeout(() => {
      console.log('State after refresh:', state.friendRequests);
    }, 100);
  };

  const showCurrentState = () => {
    console.log('=== CURRENT STATE ===');
    console.log('Current user:', state.currentUser?.username);
    console.log('State friendRequests:', state.friendRequests);
    console.log('localStorage friendRequests:', localStorage.getItem('friendRequests'));
    console.log('Parsed localStorage:', JSON.parse(localStorage.getItem('friendRequests') || '[]'));
    
    const incoming = (state.friendRequests || []).filter(req => 
      req.to === state.currentUser?.username && req.status === 'pending'
    );
    console.log('Filtered incoming requests:', incoming);
  };

  return (
    <div className="bg-red-100 border border-red-300 rounded-xl p-4 mb-4">
      <h3 className="text-lg font-semibold mb-3 text-red-800">Debug Test</h3>
      <div className="space-y-2">
        <button
          onClick={testFlow}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 mr-2"
        >
          Create Test Request
        </button>
        <button
          onClick={showCurrentState}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Show Current State
        </button>
        <div className="mt-4 text-sm text-red-800">
          <p>Current User: {state.currentUser?.username}</p>
          <p>Total Requests: {state.friendRequests?.length || 0}</p>
          <p>Incoming: {(state.friendRequests || []).filter(req => req.to === state.currentUser?.username).length}</p>
        </div>
      </div>
    </div>
  );
};

export default SimpleTest;
