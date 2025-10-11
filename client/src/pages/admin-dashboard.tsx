import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Utensils, ShoppingCart, Clock, Star } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";

const loginSchema = z.object({
    email: z.string().email("Please enter a valid email"),
    password: z.string().min(6, "Password must be at least 6 characters"),
});

const registerSchema = z.object({
    email: z.string().email("Please enter a valid email"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;

export default function Dashboard() {
    const [_location, navigate] = useLocation();
    const { isAuthenticated, isLoading } = useAuth();

    useEffect(() => {
        // Redirect if already authenticate
        if (!isAuthenticated) {
            return navigate("/");
        }

        const dashboardData = async () => {
            try {
                const res = await apiRequest("GET", "/api/admin-dashboard");
                console.log(await res.json());
            } catch (error) {
                navigate("/");
                console.log("Error on big level", error);
            }
        };
        dashboardData();
    }, []);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            </div>
        );
    }

    const loginForm = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    const registerForm = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            email: "",
            password: "",
            firstName: "",
            lastName: "",
        },
    });

    const onLogin = async (data: LoginFormData) => {
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (response.ok) {
                const result = await response.json();
                localStorage.setItem('token', result.token);
                window.location.reload();
            } else {
                const error = await response.json();
                alert(error.message || 'Login failed');
            }
        } catch (error) {
            alert('Login failed');
        }
    };

    const onRegister = async (data: RegisterFormData) => {
        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (response.ok) {
                const result = await response.json();
                localStorage.setItem('token', result.token);
                window.location.reload();
            } else {
                const error = await response.json();
                alert(error.message || 'Registration failed');
            }
        } catch (error) {
            alert('Registration failed');
        }
    };

    // if (isLoading) {
    //     return (
    //         <div className="min-h-screen flex items-center justify-center">
    //             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
    //         </div>
    //     );
    // }
    return (
        <div className="min-h-screen flex">
            <div className="flex-1 flex items-center justify-center p-8 bg-white dark:bg-gray-900">
                <div className="w-full max-w-md space-y-8">
                    <div className="text-center">
                        <div className="flex items-center justify-center space-x-2 mb-4">
                            <Utensils className="h-8 w-8 text-orange-500" />
                            <h1 className="text-3xl font-bold">FoodieHub</h1>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400">
                            Welcome to your favorite food delivery app
                        </p>
                    </div>
                    <Card>
                        <CardHeader>
                            <CardTitle>Welcome Back</CardTitle>
                            <CardDescription>
                                Sign in to your account to continue ordering
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="login-email">Email</Label>
                                    <Input
                                        id="login-email"
                                        type="email"
                                        placeholder="your@email.com"
                                        data-testid="input-login-email"
                                        {...loginForm.register("email")}
                                    />
                                    {loginForm.formState.errors.email && (
                                        <p className="text-sm text-red-500">
                                            {/* {loginForm.formState.errors.email.message} */}
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="login-password">Password</Label>
                                    <Input
                                        id="login-password"
                                        type="password"
                                        placeholder="••••••••"
                                        data-testid="input-login-password"
                                        {...loginForm.register("password")}
                                    />
                                    {loginForm.formState.errors.password && (
                                        <p className="text-sm text-red-500">
                                            {/* {loginForm.formState.errors.password.message} */}
                                        </p>
                                    )}
                                </div>
                                <Button
                                    type="submit"
                                    className="w-full bg-orange-500 hover:bg-orange-600"
                                    data-testid="button-login-submit"
                                >
                                    Sign In
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Right side - Hero section */}
            <div className="hidden flex-1 bg-gradient-to-br from-orange-500 to-red-600 p-8 text-white sm:flex flex-col justify-center">
                <div className="max-w-lg">
                    <h2 className="text-4xl font-bold mb-6">
                        Delicious food delivered to your doorstep
                    </h2>
                    <div className="space-y-4 mb-8">
                        <div className="flex items-center space-x-3">
                            <ShoppingCart className="h-6 w-6 text-orange-200" />
                            <p className="text-lg">Easy online ordering</p>
                        </div>
                        <div className="flex items-center space-x-3">
                            <Clock className="h-6 w-6 text-orange-200" />
                            <p className="text-lg">Fast delivery in 30-45 minutes</p>
                        </div>
                        <div className="flex items-center space-x-3">
                            <Star className="h-6 w-6 text-orange-200" />
                            <p className="text-lg">Top-rated restaurants & cuisines</p>
                        </div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                        <p className="text-lg font-medium mb-2">Join thousands of happy customers</p>
                        <p className="text-orange-200">
                            Get started today and enjoy your favorite meals delivered fresh and fast!
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}