import { useState } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const useSearch = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const searchUsers = async (query) => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/search/users?q=${encodeURIComponent(query)}`);
      const result = await response.json();
      
      if (result.success) {
        setResults(result.data);
      }
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return { results, loading, searchUsers, setResults };
};
