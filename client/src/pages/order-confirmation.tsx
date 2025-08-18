import { useParams } from "wouter";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, Clock, Package, MapPin, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { type Order, type OrderItem, type Product } from "@shared/schema";

export default function OrderConfirmation() {
  const { id } = useParams();
  const { toast } = useToast();

  const { data: order, isLoading, error } = useQuery<Order & { orderItems: (OrderItem & { product: Product })[] }>({
    queryKey: ["/api/orders", id],
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-light">
        <Header onCartToggle={() => {}} />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center" data-testid="order-loading">
            <p className="text-gray-500 text-lg">Loading order details...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-light">
        <Header onCartToggle={() => {}} />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center" data-testid="order-error">
            <h1 className="text-2xl font-bold text-dark mb-4">Order Not Found</h1>
            <p className="text-gray-500 mb-6">The order you're looking for doesn't exist or you don't have permission to view it.</p>
            <Link href="/orders">
              <Button data-testid="button-view-orders">View All Orders</Button>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
      case "paid":
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

  const estimatedDelivery = order.estimatedDeliveryTime 
    ? new Date(order.estimatedDeliveryTime).toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      })
    : "30-45 mins";

  return (
    <div className="min-h-screen bg-light">
      <Header onCartToggle={() => {}} />

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-dark mb-2" data-testid="text-order-confirmed">
            Order Confirmed!
          </h1>
          <p className="text-gray-600 text-lg" data-testid="text-order-success">
            Your order has been placed successfully
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Order Details */}
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-bold text-dark mb-4" data-testid="text-order-details">
                  Order Details
                </h2>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Order ID:</span>
                    <span className="font-medium" data-testid="text-order-id">
                      #{order.id.slice(-8).toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Status:</span>
                    <Badge className={getStatusColor(order.status)} data-testid="badge-order-status">
                      {formatStatus(order.status)}
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Payment Method:</span>
                    <span className="font-medium capitalize" data-testid="text-payment-method">
                      {order.paymentMethod === "upi" ? "UPI" : order.paymentMethod}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Payment Status:</span>
                    <Badge 
                      className={order.paymentStatus === "paid" ? "bg-green-500 text-white" : "bg-yellow-500 text-white"}
                      data-testid="badge-payment-status"
                    >
                      {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Paid:</span>
                    <span className="font-bold text-primary text-lg" data-testid="text-total-paid">
                      ₹{order.totalAmount}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-bold text-dark mb-4" data-testid="text-delivery-info">
                  Delivery Information
                </h2>
                
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-medium text-dark" data-testid="text-customer-name">
                        {order.customerName}
                      </p>
                      <p className="text-gray-600" data-testid="text-customer-phone">
                        {order.customerPhone}
                      </p>
                      <p className="text-gray-600" data-testid="text-delivery-address">
                        {order.deliveryAddress}
                      </p>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center space-x-3">
                    <Clock className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-dark">Estimated Delivery</p>
                      <p className="text-gray-600" data-testid="text-estimated-delivery">
                        {estimatedDelivery}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Items */}
          <div>
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-bold text-dark mb-4" data-testid="text-order-items">
                  Order Items
                </h2>
                
                <div className="space-y-4">
                  {order.orderItems.map((item) => (
                    <div key={item.id} className="flex items-center space-x-4" data-testid={`order-item-${item.id}`}>
                      <img 
                        src={item.product.imageUrl || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100"} 
                        alt={item.productName} 
                        className="w-16 h-16 object-cover rounded-lg"
                        data-testid={`order-item-image-${item.id}`}
                      />
                      <div className="flex-1">
                        <h3 className="font-medium text-dark" data-testid={`order-item-name-${item.id}`}>
                          {item.productName}
                        </h3>
                        <p className="text-gray-600" data-testid={`order-item-quantity-${item.id}`}>
                          Quantity: {item.quantity}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-primary" data-testid={`order-item-price-${item.id}`}>
                          ₹{item.price}
                        </p>
                        <p className="text-sm text-gray-500">
                          ₹{(parseFloat(item.price) * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <Separator className="my-4" />

                {/* Price Breakdown */}
                <div className="space-y-2">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>₹{(parseFloat(order.totalAmount) - parseFloat(order.deliveryFee!) - parseFloat(order.tax || "0")).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Delivery Fee</span>
                    <span>₹{order.deliveryFee}</span>
                  </div>
                  {order.tax && parseFloat(order.tax) > 0 && (
                    <div className="flex justify-between text-gray-600">
                      <span>Tax</span>
                      <span>₹{order.tax}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-primary">₹{order.totalAmount}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
          <Link href="/orders">
            <Button variant="outline" className="w-full sm:w-auto" data-testid="button-view-all-orders">
              <Package className="mr-2 h-4 w-4" />
              View All Orders
            </Button>
          </Link>
          
          <Link href="/">
            <Button className="primary-button w-full sm:w-auto" data-testid="button-continue-shopping">
              Continue Shopping
            </Button>
          </Link>
        </div>

        {/* Back Button */}
        <div className="mt-6">
          <Link href="/">
            <Button variant="ghost" data-testid="button-back-home">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
