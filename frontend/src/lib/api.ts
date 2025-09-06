import { supabase } from './supabase';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const getAuthHeaders = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return {
    'Content-Type': 'application/json',
    ...(session?.access_token && { Authorization: `Bearer ${session.access_token}` })
  };
};

export const api = {
  posts: {
    getAll: async (page = 1, limit = 20) => {
      try {
        const response = await fetch(`${API_BASE_URL}/posts?page=${page}&limit=${limit}`, {
          headers: await getAuthHeaders()
        });
        if (!response.ok) {
          throw new Error(`API Error: ${response.status}`);
        }
        return response.json();
      } catch (error) {
        console.error('API posts.getAll failed:', error);
        throw error;
      }
    },
    
    create: async (post: { title: string; content: string; type?: string; is_anonymous?: boolean; tags?: string[] }) => {
      try {
        const response = await fetch(`${API_BASE_URL}/posts`, {
          method: 'POST',
          headers: await getAuthHeaders(),
          body: JSON.stringify(post)
        });
        if (!response.ok) {
          throw new Error(`API Error: ${response.status}`);
        }
        return response.json();
      } catch (error) {
        console.error('API posts.create failed:', error);
        throw error;
      }
    },
    
    like: async (postId: string) => {
      try {
        const response = await fetch(`${API_BASE_URL}/posts/${postId}/like`, {
          method: 'POST',
          headers: await getAuthHeaders()
        });
        if (!response.ok) {
          throw new Error(`API Error: ${response.status}`);
        }
        return response.json();
      } catch (error) {
        console.error('API posts.like failed:', error);
        throw error;
      }
    }
  }
};
