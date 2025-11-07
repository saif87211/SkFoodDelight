import ProductCard from "@/components/product-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Category, Product } from "@shared/schema";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Clock, Pencil, Plus, Search, Star, Trash } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useToast } from "@/hooks/use-toast";

export default function AdminProductList() {
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [, navigate] = useLocation();
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/admin/categories"],
  });
  const { data: products = [] } = useQuery<Product[]>({
    queryKey:
      selectedCategory === "all"
        ? ["/api/admin/products"]
        : ["/api/admin/products", `?category=${selectedCategory}`],
  });
  const [searchQuery, setSearchQuery] = useState("");

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const deleteProductMutation = useMutation({
    mutationFn: async (productId: string) => {
      return await apiRequest("DELETE", `/api/admin/product/${productId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });

      toast({
        title: "Product deleted",
      });
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
        description: "Failed to delete product",
        variant: "destructive",
      });
    },
  });

  const deleteProduct = (productId: string) => {
    deleteProductMutation.mutate(productId);
  };

  return (
    <main className="mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h2
        className="text-2xl font-bold text-dark mb-3"
        data-testid="text-popular-items"
      >
        Our delicious menu {`(${filteredProducts.length} items)`}
      </h2>
      {/* Search Bar */}
      <section className="mb-5" data-testid="section-search">
        <div className="relative max-w-md">
          <Input
            type="text"
            placeholder="Search for food..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 border border-slate-300"
            data-testid="input-search"
          />
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
        </div>
      </section>
      {/* Category Filter */}
      <section className="mb-2" data-testid="section-categories">
        <div className="flex overflow-x-auto space-x-4 pb-4">
          <Button
            variant={selectedCategory === "all" ? "default" : "outline"}
            className={`flex-shrink-0 category-pill`}
            onClick={() => setSelectedCategory("all")}
            data-testid="button-category-all"
          >
            All
          </Button>
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? "default" : "outline"}
              className={`flex-shrink-0 category-pill`}
              onClick={() => setSelectedCategory(category.id)}
              data-testid={`button-category-${category.slug}`}
            >
              {category.name}
            </Button>
          ))}
        </div>
      </section>

      <section id="menu" className="mb-12" data-testid="section-products">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12" data-testid="empty-products">
            <p className="text-gray-500 text-lg">
              {searchQuery
                ? `No items found for "${searchQuery}"`
                : "No items available"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <Card
                key={product.id}
                className="food-card-hover cursor-pointer h-full"
                data-testid={`card-product-${product.id}`}
              >
                <div className="relative">
                  <img
                    src={
                      product.imageUrl ||
                      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300"
                    }
                    alt={product.name}
                    className="w-full h-48 object-cover rounded-t-lg"
                    data-testid={`img-product-${product.id}`}
                  />
                </div>

                <CardContent className="p-4">
                  <h3
                    className="font-semibold text-lg text-dark mb-2"
                    data-testid={`text-product-name-${product.id}`}
                  >
                    {product.name}
                  </h3>
                  <div className="flex justify-between items-center mb-2"></div>

                  <p
                    className="text-gray-600 text-sm mb-3 line-clamp-2"
                    data-testid={`text-product-description-${product.id}`}
                  >
                    {product.description}
                  </p>

                  <div className="flex items-center justify-between mb-3">
                    <span
                      className="text-xl font-bold text-primary"
                      data-testid={`text-product-price-${product.id}`}
                    >
                      ₹{product.price}
                    </span>

                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      {product.rating && parseFloat(product.rating) > 0 && (
                        <div
                          className="flex items-center space-x-1"
                          data-testid={`rating-${product.id}`}
                        >
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span>{product.rating}</span>
                        </div>
                      )}

                      {product.preparationTime && (
                        <div
                          className="flex items-center space-x-1"
                          data-testid={`prep-time-${product.id}`}
                        >
                          <Clock className="h-4 w-4" />
                          <span>{product.preparationTime}m</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <Badge
                      className={`"text-xs block" ${
                        product.isAvailable ? "bg-green-500" : "bg-red-500"
                      }`}
                      data-testid={`badge-product-status-${product.id}`}
                    >
                      {product.isAvailable ? "Available" : "Not Available"}
                    </Badge>
                    <Badge
                      className="text-xs block line-clamp-1"
                      data-testid={`badge-product-status-${product.id}`}
                    >
                      {categories.find((cat) => cat.id === product.categoryId)
                        ? categories.find(
                            (cat) => cat.id === product.categoryId
                          )!.name
                        : "Uncategorized"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-around mb-2">
                    <Badge
                      variant="outline"
                      className="text-xs block"
                      data-testid={`badge-product-category-${product.id}`}
                    >
                      Updated at{" "}
                      {new Date(product.updatedAt!).toLocaleDateString(
                        "en-US",
                        {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        }
                      )}
                    </Badge>
                  </div>
                  <div className="flex items-center">
                    <Button
                      onClick={() =>
                        navigate(`/admin/product-action/${product.id}`)
                      }
                      className="mr-2 flex-1"
                      data-testid={`button-edit-product-${product.id}`}
                    >
                      <Pencil className="mr-1 h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      onClick={() => deleteProduct(product.id)}
                      variant="destructive"
                      className="flex-1"
                      data-testid={`button-delete-product-${product.id}`}
                    >
                      <Trash className="mr-1 h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}