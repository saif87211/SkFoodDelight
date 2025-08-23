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
import Razorpay from "razorpay";
import { z } from "zod";
import crypto from "crypto";

function configRazorPay() {
  const key_id = process.env.RAZORPAY_KEY_ID!;

  const razorpay = new Razorpay({
    key_id,
    key_secret: process.env.RAZORPAY_SECRET!,
  })

  return { razorpay, key_id } as const;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post('/api/auth/register', async (req, res) => {
    try {
      const userData = registerSchema.parse(req.body);
      const { user, token } = await JWTAuth.register(
        userData.email,
        userData.password,
        userData.firstName!,
        userData.lastName!
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

  app.post('/api/auth/logout', JWTAuth.authenticateToken, async (req, res) => {
    res.removeHeader("authorization")
    res.removeHeader("set-cookie");
    return res.status(200).json({ message: "User logout successfully" });
  })

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

      const razorpay_payment_id = z.string().parse(req.body.paymentId);

      const { razorpay } = configRazorPay();

      const paymentDetails = await razorpay.payments.fetch(razorpay_payment_id);

      console.log("Payment details:", paymentDetails);

      const orderSchema = insertOrderSchema.extend({
        items: z.array(insertOrderItemSchema.omit({ orderId: true }))

      });
      const { items, ...orderData } = orderSchema.parse({
        ...req.body,
        userId,
        paymentMethod: paymentDetails.method,
        paymentStatus: paymentDetails.status,
        paymentId: paymentDetails.id,
        estimatedDeliveryTime: new Date(Date.now() + 45 * 60 * 1000) // 45 minutes from now
      });

      const order = await storage.createOrder(orderData, items);
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


  // Payment endpoint
  app.post('/api/payment', JWTAuth.authenticateToken, async (req: any, res) => {
    try {
      const amount = z.string().parse(req.body.totalAmount);
      const { razorpay, key_id } = configRazorPay();

      const order = await razorpay.orders.create({
        amount: parseFloat(amount) * 100,
        currency: "INR",
      });

      return res.status(200).json({ success: true, order, token: key_id });

    } catch (error) {
      console.error("Error processing payment:", error);
      return res.status(500).json({ message: "Payment processing failed" });
    }
  });

  app.post("/api/payment/verify-payment", JWTAuth.authenticateToken, async (req, res) => {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

      const body = razorpay_order_id + "|" + razorpay_payment_id;

      const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_APT_SECRET!)
        .update(body.toString())
        .digest("hex");

      if (expectedSignature === razorpay_signature) {
        return res.status(200).json({ success: true, message: 'Payment verified successfully.' });
      }

      return res.status(400).json({ success: false, message: 'Invalid signature.' });
    } catch (error) {
      console.error("Error in verification of payment:", error);
      return res.status(400).json({ success: false, message: 'Invalid signature.' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
