import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";

export function useAdminAuth() {
    const [token, setToken] = useState<string | null>(() => {
        return localStorage.getItem('token');
    });
    const [location, navigate] = useLocation();

    const { data: adminUser, isLoading: isAdminLoading } = useQuery({
        queryKey: ["/api/auth/admin"],
        queryFn: async () => {
            if (!token) return null;

            try {
                const response = await fetch('/api/auth/admin', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.status === 401 || response.status === 403) {
                    setToken(null);
                    navigate("/admin/auth");
                    return null;
                }

                if (!response.ok) {
                    throw new Error('Failed to fetch admin user');
                }
                const responseData = await response.json();

                if (!responseData.isActive) {
                    throw new Error("You don't have permission to access this page");
                }
                return responseData;
            } catch (error) {
                setToken(null);
                return null;
            }
        },
        enabled: !!token,
        retry: false,
    });

    return { adminUser, isAdminLoading };
}