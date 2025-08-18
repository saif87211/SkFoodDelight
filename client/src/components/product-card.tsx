import { useState } from "react";
import { Link } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Star, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { type Product } from "@shared/schema";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const [isAdding, setIsAdding] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const addToCartMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/cart", {
        productId: product.id,
        quantity: 1,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({
        title: "Added to cart",
        description: `${product.name} has been added to your cart`,
      });
      setIsAdding(false);
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
      setIsAdding(false);
    },
  });

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsAdding(true);
    addToCartMutation.mutate();
  };

  return (
    <Link href={`/product/${product.id}`}>
      <Card className="food-card-hover cursor-pointer h-full" data-testid={`card-product-${product.id}`}>
        <div className="relative">
          <img 
            src={product.imageUrl || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300"} 
            alt={product.name} 
            className="w-full h-48 object-cover rounded-t-lg"
            data-testid={`img-product-${product.id}`}
          />
          {!product.isAvailable && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-t-lg">
              <Badge variant="destructive">Out of Stock</Badge>
            </div>
          )}
        </div>
        
        <CardContent className="p-4">
          <h3 className="font-semibold text-lg text-dark mb-2 line-clamp-1" data-testid={`text-product-name-${product.id}`}>
            {product.name}
          </h3>
          
          <p className="text-gray-600 text-sm mb-3 line-clamp-2" data-testid={`text-product-description-${product.id}`}>
            {product.description}
          </p>
          
          <div className="flex items-center justify-between mb-3">
            <span className="text-xl font-bold text-primary" data-testid={`text-product-price-${product.id}`}>
              ₹{product.price}
            </span>
            
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              {product.rating && parseFloat(product.rating) > 0 && (
                <div className="flex items-center space-x-1" data-testid={`rating-${product.id}`}>
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span>{product.rating}</span>
                </div>
              )}
              
              {product.preparationTime && (
                <div className="flex items-center space-x-1" data-testid={`prep-time-${product.id}`}>
                  <Clock className="h-4 w-4" />
                  <span>{product.preparationTime}m</span>
                </div>
              )}
            </div>
          </div>
          
          <Button
            onClick={handleAddToCart}
            disabled={!product.isAvailable || isAdding}
            className="w-full"
            data-testid={`button-add-to-cart-${product.id}`}
          >
            <Plus className="mr-1 h-4 w-4" />
            {isAdding ? "Adding..." : "Add to Cart"}
          </Button>
        </CardContent>
      </Card>
    </Link>
  );
}
