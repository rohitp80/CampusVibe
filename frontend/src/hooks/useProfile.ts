import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useApp } from '../context/AppContext.jsx';

export const useProfile = () => {
  const { state } = useApp();
  
  return useQuery({
    queryKey: ['profile', state.currentUser?.id],
    queryFn: () => api.profiles.getCurrent(),
    enabled: !!state.currentUser && state.isAuthenticated,
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  const { state } = useApp();
  
  return useMutation({
    mutationFn: (updates: { display_name?: string; bio?: string; college?: string; course?: string; year?: number }) =>
      api.profiles.update(updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', state.currentUser?.id] });
    },
  });
};

export const useUserProfile = (userId: string) => {
  return useQuery({
    queryKey: ['profile', userId],
    queryFn: () => api.profiles.getById(userId),
    enabled: !!userId,
  });
};
