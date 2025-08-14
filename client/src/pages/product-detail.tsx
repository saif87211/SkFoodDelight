import { useParams } from "wouter";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Star, Clock, Plus, Minus, ShoppingCart } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import CartSidebar from "@/components/cart-sidebar";
import { type Product } from "@shared/schema";

export default function ProductDetail() {
  const { id } = useParams();
  const [quantity, setQuantity] = useState(1);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: product, isLoading, error } = useQuery<Product>({
    queryKey: ["/api/products", id],
  });

  const addToCartMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/cart", {
        productId: id,
        quantity,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({
        title: "Added to cart",
        description: `${quantity} ${product?.name}${quantity > 1 ? 's' : ''} added to your cart`,
      });
      setQuantity(1);
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
        description: "Failed to add item to cart",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-light">
        <Header onCartToggle={() => setIsCartOpen(!isCartOpen)} />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center" data-testid="product-loading">
            <p className="text-gray-500">Loading product...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-light">
        <Header onCartToggle={() => setIsCartOpen(!isCartOpen)} />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center" data-testid="product-error">
            <h1 className="text-2xl font-bold text-dark mb-4">Product Not Found</h1>
            <p className="text-gray-500 mb-6">The product you're looking for doesn't exist.</p>
            <Link href="/">
              <Button data-testid="button-back-home">Go Back Home</Button>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const totalPrice = parseFloat(product.price) * quantity;

  return (
    <div className="min-h-screen bg-light">
      <Header onCartToggle={() => setIsCartOpen(!isCartOpen)} />

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Back Button */}
        <Link href="/">
          <Button variant="ghost" className="mb-6" data-testid="button-back">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Menu
          </Button>
        </Link>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Product Image */}
          <div className="space-y-4">
            <div className="relative">
              <img 
                src={product.imageUrl || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400"} 
                alt={product.name} 
                className="w-full h-96 object-cover rounded-2xl"
                data-testid="img-product-detail"
              />
              {!product.isAvailable && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-2xl">
                  <Badge variant="destructive" className="text-lg px-4 py-2">
                    Out of Stock
                  </Badge>
                </div>
              )}
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-dark mb-2" data-testid="text-product-name">
                {product.name}
              </h1>
              
              <div className="flex items-center space-x-4 mb-4">
                {product.rating && parseFloat(product.rating) > 0 && (
                  <div className="flex items-center space-x-1" data-testid="product-rating">
                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{product.rating}</span>
                    {product.totalRatings && product.totalRatings > 0 && (
                      <span className="text-gray-500">({product.totalRatings} reviews)</span>
                    )}
                  </div>
                )}
                
                {product.preparationTime && (
                  <div className="flex items-center space-x-1" data-testid="product-prep-time">
                    <Clock className="h-5 w-5 text-gray-500" />
                    <span className="text-gray-500">{product.preparationTime} mins</span>
                  </div>
                )}
              </div>

              <p className="text-gray-600 text-lg leading-relaxed" data-testid="text-product-description">
                {product.description}
              </p>
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="text-3xl font-bold text-primary" data-testid="text-product-price">
                ₹{product.price}
              </div>

              {/* Quantity Selector */}
              <div className="flex items-center space-x-4">
                <span className="font-medium text-dark">Quantity:</span>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    data-testid="button-decrease-quantity"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="font-bold text-lg min-w-[3rem] text-center" data-testid="text-quantity">
                    {quantity}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(quantity + 1)}
                    data-testid="button-increase-quantity"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Total Price */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-medium text-dark">Total:</span>
                    <span className="text-2xl font-bold text-primary" data-testid="text-total-price">
                      ₹{totalPrice.toFixed(2)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Add to Cart Button */}
              <Button
                onClick={() => addToCartMutation.mutate()}
                disabled={!product.isAvailable || addToCartMutation.isPending}
                className="w-full primary-button text-lg py-6"
                data-testid="button-add-to-cart"
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                {addToCartMutation.isPending ? "Adding to Cart..." : "Add to Cart"}
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
      <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>
  );
}
