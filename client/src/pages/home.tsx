import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import ProductCard from "@/components/product-card";
import CartSidebar from "@/components/cart-sidebar";
import { type Product, type Category } from "@shared/schema";

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCartOpen, setIsCartOpen] = useState(false);

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });
  const { data: products = [] } = useQuery<Product[]>({
    queryKey: selectedCategory === "all" ? ["/api/products"] : ["/api/products", `?category=${selectedCategory}`],
  });

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-light">
      <Header onCartToggle={() => setIsCartOpen(!isCartOpen)} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <section className="relative rounded-2xl overflow-hidden mb-12 h-64 md:h-80">
          <div className="absolute inset-0 hero-gradient z-10"></div>
          <img 
            src="https://media.istockphoto.com/id/1324465031/photo/high-angle-view-close-up-asian-woman-using-meal-delivery-service-ordering-food-online-with.jpg?s=612x612&w=0&k=20&c=fvBRmqFb-nYK46nrfC9091HH72a4anMzWoojG7WyDMk=" 
            alt="Delicious food spread" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 flex items-center justify-center z-20">
            <div className="text-center text-white">
              <h1 className="text-4xl md:text-6xl font-bold mb-4" data-testid="text-hero-title">
                Delicious Food Delivered
              </h1>
              <p className="text-xl md:text-2xl mb-8" data-testid="text-hero-subtitle">
                Order from your favorite restaurants
              </p>
              <Button 
                className="primary-button px-8 py-4 text-lg font-semibold"
                onClick={() => document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' })}
                data-testid="button-start-ordering"
              >
                Start Ordering
              </Button>
            </div>
          </div>
        </section>

        {/* Category Filter */}
        <section className="mb-8" data-testid="section-categories">
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

        {/* Search Bar */}
        <section className="mb-8" data-testid="section-search">
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

        {/* Product Grid */}
        <section id="menu" className="mb-12" data-testid="section-products">
          <h2 className="text-2xl font-bold text-dark mb-6" data-testid="text-popular-items">
            Popular Items
          </h2>
          
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12" data-testid="empty-products">
              <p className="text-gray-500 text-lg">
                {searchQuery ? `No items found for "${searchQuery}"` : "No items available"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer />
      <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>
  );
}
