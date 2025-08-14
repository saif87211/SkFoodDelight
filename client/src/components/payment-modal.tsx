import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Smartphone, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface PaymentModalProps {
  amount: number;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function PaymentModal({ amount, onSuccess, onCancel }: PaymentModalProps) {
  const [upiId, setUpiId] = useState("");
  const { toast } = useToast();

  const paymentMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/payment/simulate", {
        amount: amount.toString(),
        paymentMethod: "upi",
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Payment Successful!",
          description: `Transaction ID: ${data.transactionId}`,
        });
        onSuccess();
      } else {
        toast({
          title: "Payment Failed",
          description: data.message || "Payment failed. Please try again.",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Payment Error",
        description: "Payment processing failed. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handlePayment = () => {
    if (!upiId.trim()) {
      toast({
        title: "UPI ID Required",
        description: "Please enter your UPI ID to proceed with payment.",
        variant: "destructive",
      });
      return;
    }

    // Basic UPI ID validation
    if (!upiId.includes("@")) {
      toast({
        title: "Invalid UPI ID",
        description: "Please enter a valid UPI ID (e.g., user@paytm)",
        variant: "destructive",
      });
      return;
    }

    paymentMutation.mutate();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" data-testid="payment-modal">
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-dark" data-testid="text-payment-title">UPI Payment</h2>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onCancel}
              disabled={paymentMutation.isPending}
              data-testid="button-close-payment"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
              <Smartphone className="h-8 w-8 text-white" />
            </div>
            <p className="text-gray-600 mb-4" data-testid="text-payment-description">
              Complete your payment using UPI
            </p>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="text-sm text-gray-600 mb-2">Amount to Pay</div>
              <div className="text-2xl font-bold text-primary" data-testid="text-payment-amount">
                ₹{amount.toFixed(2)}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="upi-id" className="block text-sm font-medium text-dark mb-2">
                UPI ID
              </label>
              <Input
                id="upi-id"
                type="text"
                placeholder="Enter UPI ID (e.g., user@paytm)"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                disabled={paymentMutation.isPending}
                data-testid="input-upi-id"
              />
            </div>

            <Button
              onClick={handlePayment}
              disabled={paymentMutation.isPending || !upiId.trim()}
              className="w-full primary-button"
              data-testid="button-pay-now"
            >
              {paymentMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing Payment...
                </>
              ) : (
                "Pay Now"
              )}
            </Button>

            <Button
              variant="outline"
              onClick={onCancel}
              disabled={paymentMutation.isPending}
              className="w-full"
              data-testid="button-cancel-payment"
            >
              Cancel Payment
            </Button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500" data-testid="text-payment-note">
              This is a simulated payment for demonstration purposes.
              In production, this would integrate with a real payment gateway.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
