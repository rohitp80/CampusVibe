import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentUserId, setCurrentUserId] = useState(null);

  // Get current user
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setCurrentUserId(session.user.id);
      }
    };
    getCurrentUser();
  }, []);

  // Load notifications and setup subscriptions
  useEffect(() => {
    if (!currentUserId) return;
    
    loadNotifications();
    
    const cleanup = setupRealtimeSubscriptions();
    return cleanup;
  }, [currentUserId]); // Remove notifications dependency

  const loadNotifications = async () => {
    if (!currentUserId) return;

    try {
      // Load friend requests
      const { data: friendRequests } = await supabase
        .from('friend_requests')
        .select(`
          id,
          created_at,
          sender:sender_id (
            id,
            username,
            display_name,
            avatar_url
          )
        `)
        .eq('receiver_id', currentUserId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      // Load unread messages count
      const { data: unreadMessages } = await supabase
        .from('chat_messages')
        .select('sender_id, created_at')
        .eq('receiver_id', currentUserId)
        .eq('is_read', false)
        .order('created_at', { ascending: false });

      // Group by sender and count
      const messageCounts = {};
      unreadMessages?.forEach(msg => {
        messageCounts[msg.sender_id] = (messageCounts[msg.sender_id] || 0) + 1;
      });

      // Combine notifications
      const allNotifications = [];

      // Add friend request notifications
      friendRequests?.forEach(request => {
        allNotifications.push({
          id: `friend_request_${request.id}`,
          type: 'friend_request',
          title: 'New Friend Request',
          message: `${request.sender.display_name} sent you a friend request`,
          avatar: request.sender.avatar_url,
          timestamp: new Date(request.created_at),
          data: request
        });
      });

      // Add chat notifications
      if (Object.keys(messageCounts).length > 0) {
        for (const [senderId, count] of Object.entries(messageCounts)) {
          const { data: senderProfile } = await supabase
            .from('profiles')
            .select('id, username, display_name, avatar_url')
            .eq('id', senderId)
            .single();

          if (senderProfile) {
            allNotifications.push({
              id: `chat_${senderId}`,
              type: 'chat',
              title: 'New Message',
              message: `${count} new message${count > 1 ? 's' : ''} from ${senderProfile.display_name}`,
              avatar: senderProfile.avatar_url,
              timestamp: new Date(),
              data: { sender: senderProfile, count: count }
            });
          }
        }
      }

      // Sort by timestamp
      allNotifications.sort((a, b) => b.timestamp - a.timestamp);

      setNotifications(allNotifications);
      setUnreadCount(allNotifications.length);

    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const setupRealtimeSubscriptions = () => {
    // Subscribe to friend requests
    const friendRequestsChannel = supabase
      .channel('friend_requests_notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'friend_requests',
          filter: `receiver_id=eq.${currentUserId}`
        },
        (payload) => {
          // Add notification immediately
          const newNotification = {
            id: `friend_request_${payload.new.id}`,
            type: 'friend_request',
            title: 'New Friend Request',
            message: `Someone sent you a friend request`,
            avatar: null,
            timestamp: new Date(payload.new.created_at),
            data: payload.new
          };
          
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
      )
      .subscribe();

    // Subscribe to new chat messages
    const chatChannel = supabase
      .channel('chat_notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `receiver_id=eq.${currentUserId}`
        },
        async (payload) => {
          // Get sender profile
          const { data: senderProfile } = await supabase
            .from('profiles')
            .select('id, username, display_name, avatar_url')
            .eq('id', payload.new.sender_id)
            .single();

          if (senderProfile) {
            // Add new notification or update existing one
            setNotifications(prev => {
              const existingIndex = prev.findIndex(
                n => n.type === 'chat' && n.data.sender.id === payload.new.sender_id
              );

              if (existingIndex >= 0) {
                // Update existing notification count
                const updated = [...prev];
                updated[existingIndex].data.count += 1;
                updated[existingIndex].message = `${updated[existingIndex].data.count} new message${updated[existingIndex].data.count > 1 ? 's' : ''} from ${senderProfile.display_name}`;
                updated[existingIndex].timestamp = new Date(payload.new.created_at);
                return updated;
              } else {
                // Add new notification
                const newNotification = {
                  id: `chat_${payload.new.sender_id}`,
                  type: 'chat',
                  title: 'New Message',
                  message: `1 new message from ${senderProfile.display_name}`,
                  avatar: senderProfile.avatar_url,
                  timestamp: new Date(payload.new.created_at),
                  data: { sender: senderProfile, count: 1 }
                };
                
                setUnreadCount(prevCount => prevCount + 1);
                return [newNotification, ...prev];
              }
            });
          }
        }
      )
      .subscribe();

    return () => {
      friendRequestsChannel.unsubscribe();
      chatChannel.unsubscribe();
    };
  };

  const markAsRead = async (notificationId) => {
    setNotifications(prev => 
      prev.filter(n => n.id !== notificationId)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markChatAsRead = async (senderId) => {
    try {
      // Mark all messages from sender as read
      await supabase
        .from('chat_messages')
        .update({ is_read: true })
        .eq('receiver_id', currentUserId)
        .eq('sender_id', senderId);

      // Remove chat notification
      setNotifications(prev => 
        prev.filter(n => !(n.type === 'chat' && n.data.sender.id === senderId))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking chat as read:', error);
    }
  };

  const clearAll = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  return {
    notifications,
    unreadCount,
    loadNotifications,
    markAsRead,
    markChatAsRead,
    clearAll
  };
};
