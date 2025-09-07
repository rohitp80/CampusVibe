import { useState, useEffect } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const useUserProfile = (userId) => {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) {
      setProfileData(null);
      return;
    }

    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`${API_BASE_URL}/profiles/${userId}`);
        const result = await response.json();
        
        if (response.ok && result.success) {
          setProfileData(result.data);
        } else {
          // Handle API errors properly - convert object to string
          const errorMessage = result.error?.message || result.message || 'Failed to fetch profile';
          setError(errorMessage);
        }
      } catch (err) {
        console.error('Profile fetch error:', err);
        setError('Failed to fetch profile data');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId]);

  return { profileData, loading, error };
};
