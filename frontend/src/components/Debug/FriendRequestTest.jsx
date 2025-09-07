import React from 'react';
import { useApp } from '../../context/AppContext.jsx';

const FriendRequestTest = () => {
  const { state, actions } = useApp();

  const testSendRequest = () => {
    const testUser = { username: 'testuser' };
    console.log('=== TESTING FRIEND REQUEST ===');
    console.log('Current user:', state.currentUser?.username);
    console.log('Sending request to:', testUser.username);
    console.log('Current requests before:', state.friendRequests);
    
    actions.sendFriendRequest(testUser);
    
    setTimeout(() => {
      console.log('Current requests after:', state.friendRequests);
      console.log('localStorage requests:', JSON.parse(localStorage.getItem('campusVibe_globalFriendRequests') || '[]'));
    }, 100);
  };

  const clearRequests = () => {
    localStorage.removeItem('friendRequests');
    actions.refreshFriendData();
    console.log('Cleared all friend data');
  };

  const showStorage = () => {
    console.log('=== STORAGE DEBUG ===');
    console.log('localStorage friendRequests:', localStorage.getItem('friendRequests'));
    console.log('Parsed:', JSON.parse(localStorage.getItem('friendRequests') || '[]'));
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4 mb-4">
      <h3 className="text-lg font-semibold mb-3">Friend Request Debug</h3>
      <div className="space-y-2">
        <button
          onClick={testSendRequest}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Test Send Request
        </button>
        <button
          onClick={clearRequests}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 ml-2"
        >
          Clear All Requests
        </button>
        <button
          onClick={showStorage}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 ml-2"
        >
          Show Storage
        </button>
        <div className="mt-4 text-sm">
          <p>Current User: {state.currentUser?.username}</p>
          <p>Total Requests: {state.friendRequests?.length || 0}</p>
          <p>Incoming Requests: {state.friendRequests?.filter(req => req.to === state.currentUser?.username).length || 0}</p>
        </div>
      </div>
    </div>
  );
};

export default FriendRequestTest;
