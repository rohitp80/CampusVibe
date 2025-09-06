import React from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { UserPlus, Check, X } from 'lucide-react';

const FriendRequests = () => {
  const { state, actions } = useApp();
  
  if (!state.currentUser) return null;
  
  const incomingRequests = (state.friendRequests || []).filter(req => 
    req.to === state.currentUser.username && req.status === 'pending'
  );

  console.log('FriendRequests - Current user:', state.currentUser.username);
  console.log('FriendRequests - All requests:', state.friendRequests);
  console.log('FriendRequests - Incoming requests:', incomingRequests);

  if (incomingRequests.length === 0) return null;

  return (
    <div className="bg-card border border-border rounded-xl p-4 mb-4">
      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
        <UserPlus className="w-5 h-5" />
        Friend Requests ({incomingRequests.length})
      </h3>
      
      <div className="space-y-3">
        {incomingRequests.map(request => (
          <div key={request.id} className="flex items-center justify-between bg-secondary/30 rounded-lg p-3">
            <div className="flex items-center gap-3">
              <img
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${request.from}`}
                alt={request.from}
                className="w-10 h-10 rounded-full"
              />
              <div>
                <p className="font-medium">{request.from}</p>
                <p className="text-sm text-muted-foreground">wants to connect</p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => actions.acceptFriendRequest(request.id)}
                className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-1"
              >
                <Check className="w-4 h-4" />
                Accept
              </button>
              <button
                onClick={() => actions.rejectFriendRequest(request.id)}
                className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-1"
              >
                <X className="w-4 h-4" />
                Decline
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FriendRequests;
