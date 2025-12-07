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
import AdminLiveOrders from "@/pages/admin/admin-live-orders";
import Home from "@/pages/home";
import ProductDetail from "@/pages/product-detail";
import Cart from "@/pages/cart";
import Checkout from "@/pages/checkout";
import OrderConfirmation from "@/pages/order-confirmation";
import Orders from "@/pages/orders";
import NotFound from "@/pages/not-found"; // Import NotFound page
import AdminLayout from "./components/layout/admin-layout";
import AdminCategoryList from "./pages/admin/admin-category-list";
import AdminProductAction from "./pages/admin/admin-product-action";
import AdminCategoryAction from "./pages/admin/admin-category-action";
import AdminProductList from "./pages/admin/admin-product-list";
import AdminOrderList from "./pages/admin/admin-order-list";
import Invoice from "./pages/admin/invocie";
import AdminDashBoard from "./pages/admin/admin-dashboard";

type RouteObject = {
  path: string;
  component: React.JSX.Element;
};

const script = document.createElement("script");
script.src = "https://checkout.razorpay.com/v1/checkout.js";
document.body.appendChild(script);

const secureAdminRoutes: RouteObject[] = [
  {
    path: "/admin/live-orders",
    component: <AdminLiveOrders />,
  },
  {
    path: "/admin/dashboard",
    component: <AdminDashBoard />,
  },
  {
    path: "/admin/categories",
    component: <AdminCategoryList />,
  },
  {
    path: "/admin/category-action",
    component: <AdminCategoryAction />,
  },
  {
    path: "/admin/category-action/:id",
    component: <AdminCategoryAction />,
  },
  {
    path: "/admin/products",
    component: <AdminProductList />,
  },
  {
    path: "/admin/product-action",
    component: <AdminProductAction />,
  },
  {
    path: "/admin/product-action/:id",
    component: <AdminProductAction />,
  },
  {
    path: "/admin/orders-list",
    component: <AdminOrderList />,
  },
  {
    path: "/admin/invoice/:id",
    component: <Invoice />,
  },
];

const userRoutes: RouteObject[] = [
  {
    path: "/home",
    component: <Home />,
  },
  {
    path: "/product/:id",
    component: <ProductDetail />,
  },
  {
    path: "/cart",
    component: <Cart />,
  },
  {
    path: "/checkout",
    component: <Checkout />,
  },
  {
    path: "/order-confirmation/:id",
    component: <OrderConfirmation />,
  },
  {
    path: "/orders",
    component: <Orders />,
  },
];

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
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
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
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
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
      {secureAdminRoutes.map(({ path, component }) => (
        <ProtectedAdminRoute key={path} path={path} children={component} />
      ))}
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
      {userRoutes.map(({ path, component }) => (
        <ProtectedRoute key={path} path={path} children={component} />
      ))}

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
