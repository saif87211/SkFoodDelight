import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Package, ArrowLeft, Eye, ShoppingBag } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { type Order, type OrderItem, type Product } from "@shared/schema";

export default function Orders() {
  const { toast } = useToast();

  const { data: orders = [], isLoading, error } = useQuery<(Order & { orderItems: (OrderItem & { product: Product })[] })[]>({
    queryKey: ["/api/orders"],
    retry: false,
  });

  // Handle unauthorized errors at page level
  useEffect(() => {
    if (error && isUnauthorizedError(error as Error)) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [error, toast]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-secondary text-white";
      case "preparing":
        return "bg-accent text-dark";
      case "out_for_delivery":
        return "bg-primary text-white";
      case "delivered":
        return "bg-green-500 text-white";
      case "cancelled":
        return "bg-red-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const formatStatus = (status: string) => {
    switch (status) {
      case "out_for_delivery":
        return "Out for Delivery";
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-light">
        <Header onCartToggle={() => {}} />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center" data-testid="orders-loading">
            <p className="text-gray-500 text-lg">Loading your orders...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-light">
      <Header onCartToggle={() => {}} />

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-8">
          <Link href="/">
            <Button variant="ghost" data-testid="button-back">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-dark" data-testid="text-orders-title">
            My Orders
          </h1>
        </div>

        {error && !isUnauthorizedError(error as Error) ? (
          <div className="text-center py-12" data-testid="orders-error">
            <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-500 mb-2">Failed to Load Orders</h2>
            <p className="text-gray-400 mb-6">There was an error loading your orders. Please try again.</p>
            <Button 
              onClick={() => window.location.reload()} 
              className="primary-button"
              data-testid="button-retry"
            >
              Try Again
            </Button>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12" data-testid="empty-orders">
            <ShoppingBag className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-500 mb-2">No Orders Yet</h2>
            <p className="text-gray-400 mb-6">You haven't placed any orders yet. Start shopping to see your orders here!</p>
            <Link href="/">
              <Button className="primary-button" data-testid="button-start-shopping">
                Start Shopping
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <Card key={order.id} className="overflow-hidden" data-testid={`order-card-${order.id}`}>
                <CardHeader className="bg-gray-50 pb-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <CardTitle className="text-lg" data-testid={`order-id-${order.id}`}>
                        Order #{order.id.slice(-8).toUpperCase()}
                      </CardTitle>
                      <p className="text-gray-600 text-sm" data-testid={`order-date-${order.id}`}>
                        Placed on {formatDate(order.createdAt?.toString()!)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={getStatusColor(order.status)} data-testid={`order-status-${order.id}`}>
                        {formatStatus(order.status)}
                      </Badge>
                      <Link href={`/order-confirmation/${order.id}`}>
                        <Button variant="outline" size="sm" data-testid={`button-view-order-${order.id}`}>
                          <Eye className="mr-1 h-4 w-4" />
                          View
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-6">
                  {/* Order Items */}
                  <div className="space-y-3 mb-4">
                    {order.orderItems.slice(0, 3).map((item) => (
                      <div key={item.id} className="flex items-center space-x-4" data-testid={`order-item-${item.id}`}>
                        <img 
                          src={item.product.imageUrl || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-4.0.3&auto=format&fit=crop&w=60&h=60"} 
                          alt={item.productName} 
                          className="w-12 h-12 object-cover rounded-lg"
                          data-testid={`order-item-image-${item.id}`}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-dark truncate" data-testid={`order-item-name-${item.id}`}>
                            {item.productName}
                          </p>
                          <p className="text-gray-600 text-sm" data-testid={`order-item-details-${item.id}`}>
                            Qty: {item.quantity} × ₹{item.price}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-primary" data-testid={`order-item-total-${item.id}`}>
                            ₹{(parseFloat(item.price) * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                    
                    {order.orderItems.length > 3 && (
                      <p className="text-gray-500 text-sm" data-testid={`order-more-items-${order.id}`}>
                        +{order.orderItems.length - 3} more items
                      </p>
                    )}
                  </div>

                  <Separator className="my-4" />

                  {/* Order Summary */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="space-y-1">
                      <p className="text-gray-600 text-sm">Delivery Address:</p>
                      <p className="text-dark text-sm truncate max-w-xs" data-testid={`order-address-${order.id}`}>
                        {order.deliveryAddress}
                      </p>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-gray-600 text-sm">Total Amount</p>
                      <p className="text-2xl font-bold text-primary" data-testid={`order-total-${order.id}`}>
                        ₹{order.totalAmount}
                      </p>
                      <p className="text-gray-500 text-sm capitalize" data-testid={`order-payment-${order.id}`}>
                        Paid via {order.paymentMethod === "upi" ? "UPI" : order.paymentMethod}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
