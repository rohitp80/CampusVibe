import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const getAuthHeaders = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return {
    'Content-Type': 'application/json',
    ...(session?.access_token && { Authorization: `Bearer ${session.access_token}` })
  };
};

export const useChat = () => {
  const [chatRooms, setChatRooms] = useState([]);
  const [messages, setMessages] = useState({});
  const [loading, setLoading] = useState(false);

  const fetchChatRooms = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/chat/rooms`, {
        headers: await getAuthHeaders()
      });
      const result = await response.json();
      if (result.success) {
        setChatRooms(result.data);
      }
    } catch (error) {
      console.error('Fetch chat rooms error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (chatId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/chat/rooms/${chatId}/messages`, {
        headers: await getAuthHeaders()
      });
      const result = await response.json();
      if (result.success) {
        setMessages(prev => ({ ...prev, [chatId]: result.data }));
      }
    } catch (error) {
      console.error('Fetch messages error:', error);
    }
  };

  const sendMessage = async (chatId, content) => {
    try {
      const response = await fetch(`${API_BASE_URL}/chat/rooms/${chatId}/messages`, {
        method: 'POST',
        headers: await getAuthHeaders(),
        body: JSON.stringify({ content })
      });
      const result = await response.json();
      if (result.success) {
        setMessages(prev => ({
          ...prev,
          [chatId]: [...(prev[chatId] || []), result.data]
        }));
        return result.data;
      }
    } catch (error) {
      console.error('Send message error:', error);
    }
  };

  const createChatRoom = async (name, participantId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/chat/rooms`, {
        method: 'POST',
        headers: await getAuthHeaders(),
        body: JSON.stringify({ 
          name, 
          type: 'direct',
          participant_id: participantId 
        })
      });
      const result = await response.json();
      if (result.success) {
        setChatRooms(prev => [result.data, ...prev]);
        return result.data;
      }
    } catch (error) {
      console.error('Create chat room error:', error);
    }
  };

  const subscribeToMessages = (chatId) => {
    const channel = supabase
      .channel(`chat:${chatId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `chat_id=eq.${chatId}`
      }, (payload) => {
        setMessages(prev => ({
          ...prev,
          [chatId]: [...(prev[chatId] || []), payload.new]
        }));
      })
      .subscribe();

    return () => channel.unsubscribe();
  };

  useEffect(() => {
    fetchChatRooms();
  }, []);

  return {
    chatRooms,
    messages,
    loading,
    fetchMessages,
    sendMessage,
    createChatRoom,
    subscribeToMessages,
    refetchChatRooms: fetchChatRooms
  };
};
