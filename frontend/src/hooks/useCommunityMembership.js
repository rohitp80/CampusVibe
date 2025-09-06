import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const useCommunityMembership = (communityId) => {
  const [membership, setMembership] = useState({
    isMember: false,
    isAdmin: false,
    loading: true,
    error: null
  });

  const fetchMembership = async () => {
    try {
      console.log('Fetching membership for community:', communityId);
      setMembership(prev => ({ ...prev, loading: true, error: null }));
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.log('No session found');
        setMembership({ isMember: false, isAdmin: false, loading: false, error: null });
        return;
      }

      const response = await fetch(`http://localhost:3000/api/community/${communityId}/membership`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      console.log('Membership response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('Membership result:', result.data);
        setMembership({
          isMember: result.data.isMember,
          isAdmin: result.data.isAdmin,
          joinedAt: result.data.joinedAt,
          loading: false,
          error: null
        });
      } else {
        console.error('Failed to fetch membership, status:', response.status);
        throw new Error('Failed to fetch membership');
      }
    } catch (error) {
      console.error('Membership fetch error:', error);
      setMembership(prev => ({ 
        ...prev, 
        loading: false, 
        error: error.message 
      }));
    }
  };

  const joinCommunity = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(`http://localhost:3000/api/community/${communityId}/join`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (response.ok) {
        // Optimistic update
        setMembership(prev => ({ 
          ...prev, 
          isMember: true, 
          isAdmin: false 
        }));
        return { success: true };
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to join community');
      }
    } catch (error) {
      console.error('Join error:', error);
      return { success: false, error: error.message };
    }
  };

  const leaveCommunity = async () => {
    try {
      console.log('Attempting to leave community:', communityId);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(`http://localhost:3000/api/community/${communityId}/leave`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      console.log('Leave response status:', response.status);
      
      if (response.ok) {
        console.log('Successfully left community');
        // Immediately update state
        setMembership(prev => ({ 
          ...prev, 
          isMember: false, 
          isAdmin: false,
          joinedAt: null
        }));
        return { success: true };
      } else {
        const errorData = await response.json();
        console.error('Leave failed:', errorData);
        throw new Error(errorData.error || 'Failed to leave community');
      }
    } catch (error) {
      console.error('Leave error:', error);
      // Refetch to get accurate state
      setTimeout(() => fetchMembership(), 1000);
      return { success: false, error: error.message };
    }
  };

  const kickMember = async (userId) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(`http://localhost:3000/api/community/${communityId}/kick/${userId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (response.ok) {
        return { success: true };
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to kick member');
      }
    } catch (error) {
      console.error('Kick error:', error);
      return { success: false, error: error.message };
    }
  };

  const transferOwnership = async (userId) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(`http://localhost:3000/api/community/${communityId}/transfer/${userId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (response.ok) {
        // Update local state
        setMembership(prev => ({ 
          ...prev, 
          isAdmin: false 
        }));
        return { success: true };
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to transfer ownership');
      }
    } catch (error) {
      console.error('Transfer error:', error);
      return { success: false, error: error.message };
    }
  };

  const deleteCommunity = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(`http://localhost:3000/api/community/${communityId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (response.ok) {
        // Remove from UI state immediately
        window.dispatchEvent(new CustomEvent('communityDeleted', { detail: communityId }));
        return { success: true };
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete community');
      }
    } catch (error) {
      console.error('Delete error:', error);
      return { success: false, error: error.message };
    }
  };

  useEffect(() => {
    if (communityId) {
      // Reset state when switching communities
      setMembership({
        isMember: false,
        isAdmin: false,
        loading: true,
        error: null
      });
      fetchMembership();
    }
  }, [communityId]);

  return {
    ...membership,
    refetch: fetchMembership,
    joinCommunity,
    leaveCommunity,
    kickMember,
    transferOwnership,
    deleteCommunity
  };
};
