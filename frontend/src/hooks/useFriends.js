import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const useFriends = () => {
  const [friendRequests, setFriendRequests] = useState([]);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastFetch, setLastFetch] = useState(0);
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

  // Send friend request
  const sendFriendRequest = async (username) => {
    try {
      console.log('Sending friend request to:', username);
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.error('No session found');
        throw new Error('Not authenticated');
      }

      console.log('Session found, making API call...');
      const response = await fetch('http://localhost:3000/api/friends/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ receiverUsername: username })
      });

      const result = await response.json();
      console.log('API response:', result);
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to send friend request');
      }

      return { success: true, data: result.data };
    } catch (error) {
      console.error('Send friend request error:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Get incoming friend requests
  const getIncomingRequests = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        return { success: false, error: 'Not authenticated' };
      }

      const response = await fetch('http://localhost:3000/api/friends/requests/incoming', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to get friend requests');
      }

      setFriendRequests(result.data || []);
      return { success: true, data: result.data };
    } catch (error) {
      console.error('Get incoming requests error:', error);
      return { success: false, error: error.message };
    }
  };

  // Accept friend request
  const acceptFriendRequest = async (requestId) => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`http://localhost:3000/api/friends/request/${requestId}/accept`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to accept friend request');
      }

      // Refresh friend requests and friends list
      await getIncomingRequests();
      await getFriends();

      return { success: true, data: result.data };
    } catch (error) {
      console.error('Accept friend request error:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Reject friend request
  const rejectFriendRequest = async (requestId) => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`http://localhost:3000/api/friends/request/${requestId}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to reject friend request');
      }

      // Refresh friend requests
      await getIncomingRequests();

      return { success: true, data: result.data };
    } catch (error) {
      console.error('Reject friend request error:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Get friends list
  const getFriends = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        return { success: false, error: 'Not authenticated' };
      }

      const response = await fetch('http://localhost:3000/api/friends/list', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to get friends');
      }

      setFriends(result.data || []);
      return { success: true, data: result.data };
    } catch (error) {
      console.error('Get friends error:', error);
      return { success: false, error: error.message };
    }
  };

  // Check friendship status
  const getFriendshipStatus = async (username) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        return { success: false, error: 'Not authenticated' };
      }

      const response = await fetch(`http://localhost:3000/api/friends/status/${username}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to check friendship status');
      }

      return { success: true, status: result.status };
    } catch (error) {
      console.error('Get friendship status error:', error);
      return { success: false, error: error.message };
    }
  };

  // Auto-refresh friend requests and friends list
  useEffect(() => {
    const refreshData = async () => {
      const now = Date.now();
      // Only fetch if cache is expired
      if (now - lastFetch < CACHE_DURATION) return;
      
      await getIncomingRequests();
      await getFriends();
      setLastFetch(now);
    };

    // Initial load
    refreshData();

    // Refresh every 30 seconds
    const interval = setInterval(refreshData, 30000);

    return () => clearInterval(interval);
  }, [lastFetch]);

  return {
    friendRequests,
    friends,
    loading,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    getFriendshipStatus,
    refreshData: async () => {
      await getIncomingRequests();
      await getFriends();
    }
  };
};
