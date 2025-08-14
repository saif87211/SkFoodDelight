import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('token');
  });

  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
      if (!token) return null;
      
      try {
        const response = await fetch('/api/auth/user', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.status === 401 || response.status === 403) {
          setToken(null);
          return null;
        }
        
        if (!response.ok) {
          throw new Error('Failed to fetch user');
        }
        
        return await response.json();
      } catch (error) {
        setToken(null);
        return null;
      }
    },
    enabled: !!token,
    retry: false,
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!(token && user),
  };
}
