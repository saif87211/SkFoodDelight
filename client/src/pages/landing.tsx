import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { UtensilsCrossed, ShoppingCart, Clock, Star } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-light">
      {/* Header */}
      <header className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="text-2xl font-bold text-primary">
                <UtensilsCrossed className="inline mr-2" />
                FoodieHub
              </div>
            </div>
            
            <nav className="hidden md:flex space-x-8">
              <a href="#features" className="text-dark hover:text-primary font-medium transition-colors">Features</a>
              <a href="#how-it-works" className="text-dark hover:text-primary font-medium transition-colors">How it Works</a>
              <a href="#about" className="text-dark hover:text-primary font-medium transition-colors">About</a>
            </nav>
            
            <Button
              onClick={() => window.location.href = "/api/login"}
              className="primary-button"
              data-testid="button-login"
            >
              Login / Sign Up
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative rounded-2xl overflow-hidden mx-4 sm:mx-6 lg:mx-8 mt-8 h-64 md:h-80">
        <div className="absolute inset-0 hero-gradient z-10"></div>
        <img 
          src="https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=400" 
          alt="Delicious food spread" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 flex items-center justify-center z-20">
          <div className="text-center text-white max-w-4xl px-4">
            <h1 className="text-4xl md:text-6xl font-bold mb-4" data-testid="text-hero-title">
              Delicious Food Delivered
            </h1>
            <p className="text-xl md:text-2xl mb-8" data-testid="text-hero-subtitle">
              Order from your favorite restaurants and get fresh food delivered to your doorstep
            </p>
            <Button
              size="lg"
              onClick={() => window.location.href = "/api/login"}
              className="primary-button text-lg px-8 py-4"
              data-testid="button-start-ordering"
            >
              Start Ordering Now
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-dark mb-4" data-testid="text-features-title">
            Why Choose FoodieHub?
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto" data-testid="text-features-subtitle">
            We make food ordering simple, fast, and delicious with our premium service
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="text-center food-card-hover" data-testid="card-feature-fast">
            <CardContent className="pt-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-dark mb-2">Fast Delivery</h3>
              <p className="text-gray-600">
                Get your favorite food delivered in 30-45 minutes or less
              </p>
            </CardContent>
          </Card>

          <Card className="text-center food-card-hover" data-testid="card-feature-quality">
            <CardContent className="pt-6">
              <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="h-8 w-8 text-secondary" />
              </div>
              <h3 className="text-xl font-semibold text-dark mb-2">Quality Food</h3>
              <p className="text-gray-600">
                Fresh ingredients and top-rated restaurants for the best taste
              </p>
            </CardContent>
          </Card>

          <Card className="text-center food-card-hover" data-testid="card-feature-easy">
            <CardContent className="pt-6">
              <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShoppingCart className="h-8 w-8 text-accent" />
              </div>
              <h3 className="text-xl font-semibold text-dark mb-2">Easy Ordering</h3>
              <p className="text-gray-600">
                Simple and intuitive interface to order your meals effortlessly
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-dark mb-4" data-testid="text-howto-title">
              How FoodieHub Works
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto" data-testid="text-howto-subtitle">
              Ordering your favorite food is just a few clicks away
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center" data-testid="step-browse">
              <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                1
              </div>
              <h3 className="text-lg font-semibold text-dark mb-2">Browse Menu</h3>
              <p className="text-gray-600">Explore our wide variety of delicious food options</p>
            </div>

            <div className="text-center" data-testid="step-add">
              <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                2
              </div>
              <h3 className="text-lg font-semibold text-dark mb-2">Add to Cart</h3>
              <p className="text-gray-600">Select your favorite items and add them to your cart</p>
            </div>

            <div className="text-center" data-testid="step-checkout">
              <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                3
              </div>
              <h3 className="text-lg font-semibold text-dark mb-2">Secure Checkout</h3>
              <p className="text-gray-600">Pay securely using UPI, card, or cash on delivery</p>
            </div>

            <div className="text-center" data-testid="step-enjoy">
              <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                4
              </div>
              <h3 className="text-lg font-semibold text-dark mb-2">Enjoy Food</h3>
              <p className="text-gray-600">Sit back and enjoy your freshly prepared meal</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white mb-4" data-testid="text-cta-title">
            Ready to Order?
          </h2>
          <p className="text-white/90 text-xl mb-8" data-testid="text-cta-subtitle">
            Join thousands of satisfied customers and get your favorite food delivered today!
          </p>
          <Button
            size="lg"
            onClick={() => window.location.href = "/api/login"}
            className="bg-white text-primary hover:bg-gray-100 text-lg px-8 py-4"
            data-testid="button-cta-order"
          >
            Start Your Order
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-dark text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="text-2xl font-bold text-primary mb-4">
                <UtensilsCrossed className="inline mr-2" />
                FoodieHub
              </div>
              <p className="text-gray-300 mb-4" data-testid="text-footer-description">
                Delicious food delivered to your doorstep
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-gray-300">
                <li><a href="#" className="hover:text-primary transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Restaurants</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Contact</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-300">
                <li><a href="#" className="hover:text-primary transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Privacy Policy</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Contact Info</h3>
              <div className="space-y-2 text-gray-300">
                <div data-testid="text-contact-phone">📞 +91 9876543210</div>
                <div data-testid="text-contact-email">📧 support@foodiehub.com</div>
                <div data-testid="text-contact-address">📍 Mumbai, India</div>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-300">
            <p data-testid="text-copyright">&copy; 2024 FoodieHub. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
