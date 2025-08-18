import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, CreditCard, Smartphone, Banknote } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import PaymentModal from "@/components/payment-modal";
import { type CartItem, type Product } from "@shared/schema";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const checkoutSchema = z.object({
  customerName: z.string().min(2, "Name must be at least 2 characters"),
  customerPhone: z.string().min(10, "Phone number must be at least 10 digits"),
  deliveryAddress: z.string().min(10, "Address must be at least 10 characters"),
  paymentMethod: z.enum(["upi", "card", "cod"]),
});

type CheckoutForm = z.infer<typeof checkoutSchema>;

export default function Checkout() {
  const [, setLocation] = useLocation();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [orderData, setOrderData] = useState<any>(null);
  const { toast } = useToast();

  const { data: cartItems = [], isLoading } = useQuery<(CartItem & { product: Product })[]>({
    queryKey: ["/api/cart"],
  });

  const form = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      customerName: "",
      customerPhone: "",
      deliveryAddress: "",
      paymentMethod: "upi",
    },
  });

  const createOrderMutation = useMutation({
    mutationFn: async (data: CheckoutForm) => {
      const orderItems = cartItems.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        price: item.product.price,
        productName: item.product.name,
      }));

      const total = cartItems.reduce((sum, item) => sum + (parseFloat(item.product.price) * item.quantity), 0);
      // const deliveryFee = 49;
      // const tax = Math.round(subtotal * 0.08); // 8% tax
      // const totalAmount = subtotal + deliveryFee + tax;

      const orderData = {
        ...data,
        totalAmount: total.toString(),
        deliveryFee:"0", //deliveryFee.toString(),
        tax: "0",//tax.toString(),
        items: orderItems,
      };

      const response = await apiRequest("POST", "/api/orders", orderData);
      return response.json();
    },
    onSuccess: (order) => {
      toast({
        title: "Order placed successfully!",
        description: `Your order #${order.id.slice(-8)} has been confirmed`,
      });
      setLocation(`/order-confirmation/${order.id}`);
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Error",
        description: "Failed to place order. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Redirect if cart is empty
  useEffect(() => {
    if (!isLoading && cartItems.length === 0) {
      setLocation("/");
    }
  }, [cartItems, isLoading, setLocation]);

  const total = cartItems.reduce((sum, item) => sum + (parseFloat(item.product.price) * item.quantity), 0);
  // const deliveryFee = 49;
  // const tax = Math.round(subtotal * 0.08); // 8% tax
  // const total = subtotal + deliveryFee + tax;

  const onSubmit = (data: CheckoutForm) => {
    if (data.paymentMethod === "upi") {
      setOrderData(data);
      setShowPaymentModal(true);
    } else {
      createOrderMutation.mutate(data);
    }
  };

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
    if (orderData) {
      createOrderMutation.mutate(orderData);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-light">
        <Header onCartToggle={() => {}} />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center" data-testid="checkout-loading">
            <p className="text-gray-500">Loading checkout...</p>
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
          <Link href="/cart">
            <Button variant="ghost" data-testid="button-back">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Cart
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-dark" data-testid="text-checkout-title">
            Checkout
          </h1>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Checkout Form */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle data-testid="text-delivery-info">Delivery Information</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="customerName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input className="border border-slate-200" placeholder="Enter your full name" data-testid="input-name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="customerPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input className="border border-slate-200" placeholder="Enter your phone number" data-testid="input-phone" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="deliveryAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Delivery Address</FormLabel>
                          <FormControl>
                            <Textarea className="border border-slate-200"
                              placeholder="Enter your complete delivery address" 
                              rows={3}
                              data-testid="input-address"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="paymentMethod"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Payment Method</FormLabel>
                          <FormControl>
                            <RadioGroup 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                              data-testid="radio-payment-method"
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="upi" id="upi" data-testid="radio-upi" />
                                <Label htmlFor="upi" className="flex items-center space-x-2 cursor-pointer">
                                  <Smartphone className="h-4 w-4" />
                                  <span>UPI Payment</span>
                                </Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="card" id="card" data-testid="radio-card" />
                                <Label htmlFor="card" className="flex items-center space-x-2 cursor-pointer">
                                  <CreditCard className="h-4 w-4" />
                                  <span>Credit/Debit Card</span>
                                </Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="cod" id="cod" data-testid="radio-cod" />
                                <Label htmlFor="cod" className="flex items-center space-x-2 cursor-pointer">
                                  <Banknote className="h-4 w-4" />
                                  <span>Cash on Delivery</span>
                                </Label>
                              </div>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={createOrderMutation.isPending}
                      data-testid="button-place-order"
                    >
                      {createOrderMutation.isPending ? "Placing Order..." : "Place Order"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div>
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle data-testid="text-order-summary">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Order Items */}
                <div className="space-y-3">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex justify-between items-center" data-testid={`order-item-${item.id}`}>
                      <div className="flex-1">
                        <span className="text-gray-600">{item.product.name} × {item.quantity}</span>
                      </div>
                      <span className="font-medium">₹{(parseFloat(item.product.price) * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Price Breakdown */}
                <div className="space-y-2">
                  {/* <div className="flex justify-between" data-testid="order-subtotal">
                    <span>Subtotal</span>
                    <span>₹{total.toFixed(2)}</span>
                  </div> */}
                  {/* <div className="flex justify-between" data-testid="order-delivery-fee">
                    <span>Delivery Fee</span>
                    <span>₹{deliveryFee}</span>
                  </div> */}
                  {/* <div className="flex justify-between" data-testid="order-tax">
                    <span>Tax (8%)</span>
                    <span>₹{tax}</span>
                  </div> */}
                  {/* <Separator /> */}
                  <div className="flex justify-between text-lg font-bold" data-testid="order-total">
                    <span>Total</span>
                    <span className="text-primary">₹{total.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />

      {showPaymentModal && (
        <PaymentModal
          amount={total}
          onSuccess={handlePaymentSuccess}
          onCancel={() => setShowPaymentModal(false)}
        />
      )}
    </div>
  );
}
