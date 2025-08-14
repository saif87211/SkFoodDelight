import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { JWTAuth } from "./auth/jwt-auth";
import { 
  insertProductSchema, 
  insertCategorySchema, 
  insertCartItemSchema,
  insertOrderSchema,
  insertOrderItemSchema,
  registerSchema,
  loginSchema
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post('/api/auth/register', async (req, res) => {
    try {
      const userData = registerSchema.parse(req.body);
      const { user, token } = await JWTAuth.register(
        userData.email,
        userData.password,
        userData.firstName,
        userData.lastName
      );
      
      const userResponse = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl,
      };
      
      res.status(201).json({ user: userResponse, token });
    } catch (error: any) {
      console.error("Registration error:", error);
      res.status(400).json({ message: error.message || "Registration failed" });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const credentials = loginSchema.parse(req.body);
      const { user, token } = await JWTAuth.login(credentials.email, credentials.password);
      
      const userResponse = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl,
      };
      
      res.json({ user: userResponse, token });
    } catch (error: any) {
      console.error("Login error:", error);
      res.status(401).json({ message: error.message || "Login failed" });
    }
  });

  app.get('/api/auth/user', JWTAuth.authenticateToken, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const userResponse = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl,
      };
      
      res.json(userResponse);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Category routes
  app.get('/api/categories', async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.post('/api/categories', JWTAuth.authenticateToken, async (req, res) => {
    try {
      const categoryData = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(categoryData);
      res.json(category);
    } catch (error) {
      console.error("Error creating category:", error);
      res.status(400).json({ message: "Failed to create category" });
    }
  });

  // Product routes
  app.get('/api/products', async (req, res) => {
    try {
      const { category } = req.query;
      const products = category 
        ? await storage.getProductsByCategory(category as string)
        : await storage.getProducts();
      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.get('/api/products/:id', async (req, res) => {
    try {
      const product = await storage.getProduct(req.params.id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      console.error("Error fetching product:", error);
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  app.post('/api/products', JWTAuth.authenticateToken, async (req, res) => {
    try {
      const productData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(productData);
      res.json(product);
    } catch (error) {
      console.error("Error creating product:", error);
      res.status(400).json({ message: "Failed to create product" });
    }
  });

  // Cart routes
  app.get('/api/cart', JWTAuth.authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.userId;
      const cartItems = await storage.getCartItems(userId);
      res.json(cartItems);
    } catch (error) {
      console.error("Error fetching cart:", error);
      res.status(500).json({ message: "Failed to fetch cart" });
    }
  });

  app.post('/api/cart', JWTAuth.authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.userId;
      const cartItemData = insertCartItemSchema.parse({ ...req.body, userId });
      const cartItem = await storage.addToCart(cartItemData);
      res.json(cartItem);
    } catch (error) {
      console.error("Error adding to cart:", error);
      res.status(400).json({ message: "Failed to add to cart" });
    }
  });

  app.patch('/api/cart/:id', JWTAuth.authenticateToken, async (req, res) => {
    try {
      const { quantity } = z.object({ quantity: z.number().min(1) }).parse(req.body);
      const cartItem = await storage.updateCartItem(req.params.id, quantity);
      res.json(cartItem);
    } catch (error) {
      console.error("Error updating cart item:", error);
      res.status(400).json({ message: "Failed to update cart item" });
    }
  });

  app.delete('/api/cart/:id', JWTAuth.authenticateToken, async (req, res) => {
    try {
      await storage.removeFromCart(req.params.id);
      res.json({ message: "Item removed from cart" });
    } catch (error) {
      console.error("Error removing from cart:", error);
      res.status(500).json({ message: "Failed to remove from cart" });
    }
  });

  app.delete('/api/cart', JWTAuth.authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.userId;
      await storage.clearCart(userId);
      res.json({ message: "Cart cleared" });
    } catch (error) {
      console.error("Error clearing cart:", error);
      res.status(500).json({ message: "Failed to clear cart" });
    }
  });

  // Order routes
  app.post('/api/orders', JWTAuth.authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.userId;
      const orderSchema = insertOrderSchema.extend({
        items: z.array(insertOrderItemSchema.omit({ orderId: true }))
      });
      
      const { items, ...orderData } = orderSchema.parse({ ...req.body, userId });
      
      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // For MVP, assume payment is successful
      const finalOrderData = {
        ...orderData,
        paymentStatus: 'paid',
        estimatedDeliveryTime: new Date(Date.now() + 45 * 60 * 1000) // 45 minutes from now
      };
      
      const order = await storage.createOrder(finalOrderData, items);
      res.json(order);
    } catch (error) {
      console.error("Error creating order:", error);
      res.status(400).json({ message: "Failed to create order" });
    }
  });

  app.get('/api/orders/:id', JWTAuth.authenticateToken, async (req, res) => {
    try {
      const order = await storage.getOrder(req.params.id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      res.json(order);
    } catch (error) {
      console.error("Error fetching order:", error);
      res.status(500).json({ message: "Failed to fetch order" });
    }
  });

  app.get('/api/orders', JWTAuth.authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.userId;
      const orders = await storage.getUserOrders(userId);
      res.json(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  // Payment simulation endpoint
  app.post('/api/payment/simulate', JWTAuth.authenticateToken, async (req, res) => {
    try {
      const { amount, paymentMethod } = z.object({
        amount: z.string(),
        paymentMethod: z.string()
      }).parse(req.body);
      
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Random success/failure for demo (90% success rate)
      const isSuccess = Math.random() > 0.1;
      
      if (isSuccess) {
        res.json({ 
          success: true, 
          transactionId: `TXN${Date.now()}`,
          message: "Payment successful"
        });
      } else {
        res.status(400).json({ 
          success: false, 
          message: "Payment failed. Please try again."
        });
      }
    } catch (error) {
      console.error("Error processing payment:", error);
      res.status(500).json({ message: "Payment processing failed" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
