import React, { Children, ReactNode } from "react";
import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { useAdminAuth } from "@/hooks/useAdminAuth"; // Import the admin auth hook
import AuthPage from "@/pages/admin/auth-page";
import AdminAuth from "@/pages/admin/admin-auth";
import AdminDashboard from "@/pages/admin/admin-dashboard";
import AdminCategory from "@/pages/admin/admin-category";
import AdminProduct from "@/pages/admin/admin-product";
import Home from "@/pages/home";
import ProductDetail from "@/pages/product-detail";
import Cart from "@/pages/cart";
import Checkout from "@/pages/checkout";
import OrderConfirmation from "@/pages/order-confirmation";
import Orders from "@/pages/orders";
import NotFound from "@/pages/not-found"; // Import NotFound page
import AdminLayout from "./pages/admin/admin-layout";

const script = document.createElement("script");
script.src = "https://checkout.razorpay.com/v1/checkout.js";
document.body.appendChild(script);

// Protected route component for users
function ProtectedRoute({
  children,
  path,
}: {
  children: React.ReactNode;
  path: string;
}) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Redirect to="/" />;
  }

  return <Route path={path}>{children}</Route>;
}

// Protected route component for admins
function ProtectedAdminRoute({
  children,
  path,
}: {
  children: React.ReactNode;
  path: string;
}) {
  const { adminUser, isAdminLoading } = useAdminAuth();

  if (isAdminLoading) {
    return <div>Loading...</div>;
  }

  if (!adminUser) {
    return <Redirect to="/admin/auth" />;
  }

  return (
    <Route path={path}>
      <AdminLayout>{children}</AdminLayout>
    </Route>
  );
}

function AdminRouter() {
  return (
    <Switch>
      <Route path="/admin/auth" component={AdminAuth} />
      <ProtectedAdminRoute path="/admin/dashboard">
        <AdminDashboard />
      </ProtectedAdminRoute>
      <ProtectedAdminRoute path="/admin/category">
        <AdminCategory />
      </ProtectedAdminRoute>
      <ProtectedAdminRoute path="/admin/product">
        <AdminProduct />
      </ProtectedAdminRoute>
      <Route path="*">
        <NotFound />
      </Route>
    </Switch>
  );
}

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/" component={AuthPage} />

      {/* Admin routes */}
      <Route path="/admin/*" component={AdminRouter} />

      {/* User routes */}
      <ProtectedRoute path="/home">
        <Home />
      </ProtectedRoute>
      <ProtectedRoute path="/product/:id">
        <ProductDetail />
      </ProtectedRoute>
      <ProtectedRoute path="/cart">
        <Cart />
      </ProtectedRoute>
      <ProtectedRoute path="/checkout">
        <Checkout />
      </ProtectedRoute>
      <ProtectedRoute path="/order-confirmation/:id">
        <OrderConfirmation />
      </ProtectedRoute>
      <ProtectedRoute path="/orders">
        <Orders />
      </ProtectedRoute>

      {/* Not found route */}
      <Route path="*">
        <NotFound />
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
