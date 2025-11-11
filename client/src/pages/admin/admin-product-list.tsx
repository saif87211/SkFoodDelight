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
  const { data: products = [], isLoading: isLoadingProducts } = useQuery<
    Product[]
  >({
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
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <h2
        className="text-base md:text-2xl font-bold text-dark mb-3"
        data-testid="text-popular-items"
      >
        Our delicious menu {`(${filteredProducts.length} items)`}
      </h2>

      {/* Search Bar */}
      <section className="mb-4" data-testid="section-search">
        <div className="relative w-full max-w-full">
          <Input
            type="text"
            placeholder="Search for food..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 pr-4 w-full min-w-0 border border-slate-300"
            data-testid="input-search"
          />
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
        </div>
      </section>

      {/* Category Filter */}
      <section className="mb-5" data-testid="section-categories">
        <div className="flex gap-3 items-center">
          <div className="flex-1">
            {/* allow horizontal scroll on very small screens, otherwise wrap */}
            <div className="flex flex-wrap sm:flex-nowrap gap-2 overflow-x-auto pb-2 -mx-1">
              <div className="px-1 flex-shrink-0 sm:mt-2">
                <Button
                  variant={selectedCategory === "all" ? "default" : "outline"}
                  className="category-pill whitespace-nowrap mx-1 border-slate-300"
                  onClick={() => setSelectedCategory("all")}
                  data-testid="button-category-all"
                >
                  All
                </Button>
                {categories.map((category) => (
                  <Button
                    key={category.id}
                    variant={
                      selectedCategory === category.id ? "default" : "outline"
                    }
                    className="category-pill whitespace-nowrap mx-1 border-slate-300"
                    onClick={() => setSelectedCategory(category.id)}
                    data-testid={`button-category-${category.slug}`}
                  >
                    {category.name}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="menu" className="mb-12" data-testid="section-products">
        {isLoadingProducts ? (
          <div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            role="list"
            aria-busy="true"
            data-testid="skeleton-products"
          >
            {Array.from({ length: 8 }).map((_, idx) => (
              <Card
                key={idx}
                className="h-full min-w-0 flex flex-col"
                data-testid={`skeleton-product-${idx}`}
              >
                <div className="relative w-full overflow-hidden rounded-t-lg bg-slate-200 animate-pulse">
                  <div className="w-full h-44 sm:h-40 md:h-44" />
                </div>

                <CardContent className="p-4 flex-1 flex flex-col min-w-0">
                  <div className="h-5 bg-slate-200 rounded w-3/4 mb-3 animate-pulse" />

                  <div className="space-y-2 mb-3">
                    <div className="h-3 bg-slate-200 rounded w-full animate-pulse" />
                    <div className="h-3 bg-slate-200 rounded w-5/6 animate-pulse" />
                    <div className="h-3 bg-slate-200 rounded w-2/3 animate-pulse" />
                  </div>

                  <div className="flex items-center justify-between mb-3 gap-2">
                    <div className="h-6 w-20 bg-slate-200 rounded animate-pulse" />
                    <div className="flex items-center gap-2">
                      <div className="h-5 w-12 bg-slate-200 rounded animate-pulse" />
                      <div className="h-5 w-12 bg-slate-200 rounded animate-pulse" />
                    </div>
                  </div>

                  <div className="mt-auto flex flex-col md:flex-row items-stretch gap-2">
                    <div className="h-10 bg-slate-200 rounded w-full md:flex-1 animate-pulse" />
                    <div className="h-10 bg-slate-200 rounded w-full md:flex-1 animate-pulse" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <>
            {filteredProducts.length === 0 ? (
              <div className="text-center py-12" data-testid="empty-products">
                <p className="text-gray-500 text-lg">
                  {searchQuery
                    ? `No items found for "${searchQuery}"`
                    : "No items available"}
                </p>
              </div>
            ) : (
              <div
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                role="list"
              >
                {filteredProducts.map((product) => (
                  <Card
                    key={product.id}
                    className="food-card-hover cursor-pointer h-full min-w-0 flex flex-col"
                    data-testid={`card-product-${product.id}`}
                  >
                    <div className="relative w-full overflow-hidden rounded-t-lg">
                      <img
                        src={
                          product.imageUrl ||
                          "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300"
                        }
                        alt={product.name}
                        className="w-full h-44 sm:h-40 md:h-44 object-cover"
                        data-testid={`img-product-${product.id}`}
                      />
                    </div>

                    <CardContent className="p-4 flex-1 flex flex-col min-w-0">
                      <h3
                        className="font-semibold text-lg text-dark mb-2 truncate"
                        data-testid={`text-product-name-${product.id}`}
                      >
                        {product.name}
                      </h3>

                      <p
                        className="text-gray-600 text-sm mb-3 line-clamp-3 break-words min-w-0"
                        data-testid={`text-product-description-${product.id}`}
                      >
                        {product.description}
                      </p>

                      <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
                        <span
                          className="text-xl font-bold text-primary"
                          data-testid={`text-product-price-${product.id}`}
                        >
                          ₹{product.price}
                        </span>

                        <div className="flex items-center space-x-3 text-sm text-gray-500">
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

                      <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
                        <div className="flex gap-2 items-center justify-between min-w-0">
                          <Badge
                            className={`text-xs block px-2 py-1 rounded ${
                              product.isAvailable
                                ? "bg-green-500"
                                : "bg-red-500"
                            } text-white`}
                            data-testid={`badge-product-status-${product.id}`}
                          >
                            {product.isAvailable
                              ? "Available"
                              : "Not Available"}
                          </Badge>

                          <Badge
                            className="text-xs block line-clamp-1 py-1 min-w-0 max-w-[8rem] truncate"
                            data-testid={`badge-product-status-${product.id}`}
                          >
                            {categories.find(
                              (cat) => cat.id === product.categoryId
                            )
                              ? categories.find(
                                  (cat) => cat.id === product.categoryId
                                )!.name
                              : "Uncategorized"}
                          </Badge>
                        </div>

                        {/* <Badge
                      variant="outline"
                      className="text-xs block"
                      data-testid={`badge-product-category-${product.id}`}
                    >
                      Updated at{" "}
                      {product.updatedAt
                        ? new Date(product.updatedAt).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            }
                          )
                        : "—"}
                    </Badge> */}
                      </div>

                      <div className="mt-auto flex flex-col md:flex-row items-stretch gap-2">
                        <Button
                          onClick={() =>
                            navigate(`/admin/product-action/${product.id}`)
                          }
                          className="w-full md:flex-1"
                          data-testid={`button-edit-product-${product.id}`}
                        >
                          <Pencil className="mr-1 h-4 w-4" />
                          Edit
                        </Button>
                        <Button
                          onClick={() => deleteProduct(product.id)}
                          variant="destructive"
                          className="w-full md:flex-1"
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
          </>
        )}
      </section>
    </main>
  );
}
