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
      const response = await fetch(`${API_BASE_URL}/posts?page=${page}&limit=${limit}`, {
        headers: await getAuthHeaders()
      });
      return response.json();
    },
    
    create: async (post: { title: string; content: string; type?: string; is_anonymous?: boolean; tags?: string[] }) => {
      const response = await fetch(`${API_BASE_URL}/posts`, {
        method: 'POST',
        headers: await getAuthHeaders(),
        body: JSON.stringify(post)
      });
      return response.json();
    },
    
    like: async (postId: string) => {
      const response = await fetch(`${API_BASE_URL}/posts/${postId}/like`, {
        method: 'POST',
        headers: await getAuthHeaders()
      });
      return response.json();
    }
  }
};
