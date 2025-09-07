import React from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { useFriends } from '../../hooks/useFriends.js';
import { UserPlus, Check, X } from 'lucide-react';

const FriendRequests = ({ showHeader = true }) => {
  const { state } = useApp();
  const { friendRequests, acceptFriendRequest, rejectFriendRequest, loading } = useFriends();

  const handleAccept = async (requestId) => {
    const result = await acceptFriendRequest(requestId);
    if (result.success) {
      console.log('Friend request accepted!');
    } else {
      console.error('Failed to accept friend request:', result.error);
    }
  };

  const handleReject = async (requestId) => {
    const result = await rejectFriendRequest(requestId);
    if (result.success) {
      console.log('Friend request rejected');
    } else {
      console.error('Failed to reject friend request:', result.error);
    }
  };

  if (!friendRequests || friendRequests.length === 0) {
    return (
      <div className={showHeader ? "bg-card rounded-xl border border-border shadow-card p-6" : ""}>
        {showHeader && (
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Friend Requests
          </h3>
        )}
        <p className="text-muted-foreground text-center py-4">No pending friend requests</p>
      </div>
    );
  }

  return (
    <div className={showHeader ? "bg-card rounded-xl border border-border shadow-card p-6" : ""}>
      {showHeader && (
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <UserPlus className="w-5 h-5" />
          Friend Requests ({friendRequests.length})
        </h3>
      )}
      
      <div className="space-y-4">
        {friendRequests.map((request) => (
          <div key={request.id} className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg border border-border/50">
            <div className="flex items-center gap-3">
              <img
                src={request.sender?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${request.sender?.username}`}
                alt={request.sender?.display_name || request.sender?.username}
                className="w-12 h-12 rounded-full object-cover"
              />
              <div>
                <p className="font-medium text-foreground">
                  {request.sender?.display_name || request.sender?.username}
                </p>
                <p className="text-sm text-muted-foreground">@{request.sender?.username}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(request.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => handleAccept(request.id)}
                disabled={loading}
                className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-1 disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                Accept
              </button>
              <button
                onClick={() => handleReject(request.id)}
                disabled={loading}
                className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-1 disabled:opacity-50"
              >
                <X className="w-4 h-4" />
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FriendRequests;
