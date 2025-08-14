import { UtensilsCrossed } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-dark text-white py-12 mt-16">
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
              <li><a href="#" className="hover:text-primary transition-colors">Career</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Contact</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">Support</h3>
            <ul className="space-y-2 text-gray-300">
              <li><a href="#" className="hover:text-primary transition-colors">Help Center</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Refund Policy</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">Contact Info</h3>
            <div className="space-y-2 text-gray-300">
              <div className="flex items-center space-x-2" data-testid="text-contact-phone">
                <span>📞</span>
                <span>+91 9876543210</span>
              </div>
              <div className="flex items-center space-x-2" data-testid="text-contact-email">
                <span>📧</span>
                <span>support@foodiehub.com</span>
              </div>
              <div className="flex items-center space-x-2" data-testid="text-contact-address">
                <span>📍</span>
                <span>Mumbai, India</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-300">
          <p data-testid="text-copyright">&copy; 2024 FoodieHub. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
