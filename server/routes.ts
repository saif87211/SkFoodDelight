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
  loginSchema,
  seedOrderSchema,
} from "@shared/schema";
import Razorpay from "razorpay";
import { z } from "zod";
import crypto from "crypto";
import {
  uploadFileOnCloudinary,
  deleteFileOnCloudinary,
} from "./utils/cloudinary";
import { upload } from "./utils/multer";
import { log } from "./vite";

function configRazorPay() {
  const key_id = process.env.RAZORPAY_KEY_ID!;

  const razorpay = new Razorpay({
    key_id,
    key_secret: process.env.RAZORPAY_SECRET!,
  });

  return { razorpay, key_id } as const;
}

export async function registerRoutes(
  app: Express,
  io: any,
  existingServer?: Server
): Promise<Server> {
  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
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

  app.post("/api/auth/login", async (req, res) => {
    try {
      const credentials = loginSchema.parse(req.body);
      const { user, token } = await JWTAuth.login(
        credentials.email,
        credentials.password
      );

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

  app.post("/api/auth/logout", JWTAuth.authenticateToken, async (req, res) => {
    res.removeHeader("authorization");
    res.removeHeader("set-cookie");
    return res.status(200).json({ message: "User logout successfully" });
  });

  app.get(
    "/api/auth/user",
    JWTAuth.authenticateToken,
    async (req: any, res) => {
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
    }
  );

  // Category routes
  // get only active categories
  app.get("/api/categories", JWTAuth.authenticateToken, async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  // Product routes
  app.get("/api/products", JWTAuth.authenticateToken, async (req, res) => {
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

  app.get("/api/products/:id", JWTAuth.authenticateToken, async (req, res) => {
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

  // Cart routes
  app.get("/api/cart", JWTAuth.authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.userId;
      const cartItems = await storage.getCartItems(userId);
      res.json(cartItems);
    } catch (error) {
      console.error("Error fetching cart:", error);
      res.status(500).json({ message: "Failed to fetch cart" });
    }
  });

  app.post("/api/cart", JWTAuth.authenticateToken, async (req: any, res) => {
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

  app.patch("/api/cart/:id", JWTAuth.authenticateToken, async (req, res) => {
    try {
      const { quantity } = z
        .object({ quantity: z.number().min(1) })
        .parse(req.body);
      const cartItem = await storage.updateCartItem(req.params.id, quantity);
      res.json(cartItem);
    } catch (error) {
      console.error("Error updating cart item:", error);
      res.status(400).json({ message: "Failed to update cart item" });
    }
  });

  app.delete("/api/cart/:id", JWTAuth.authenticateToken, async (req, res) => {
    try {
      await storage.removeFromCart(req.params.id);
      res.json({ message: "Item removed from cart" });
    } catch (error) {
      console.error("Error removing from cart:", error);
      res.status(500).json({ message: "Failed to remove from cart" });
    }
  });

  app.delete("/api/cart", JWTAuth.authenticateToken, async (req: any, res) => {
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
  // create orders
  app.post("/api/orders", JWTAuth.authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.userId;

      const razorpay_payment_id = z.string().parse(req.body.paymentId);

      const { razorpay } = configRazorPay();

      const paymentDetails = await razorpay.payments.fetch(razorpay_payment_id);

      const orderSchema = insertOrderSchema.extend({
        items: z.array(insertOrderItemSchema.omit({ orderId: true })),
      });
      const { items, ...orderData } = orderSchema.parse({
        ...req.body,
        userId,
        paymentMethod: paymentDetails.method,
        paymentStatus: paymentDetails.status,
        paymentId: paymentDetails.id,
        estimatedDeliveryTime: new Date(Date.now() + 45 * 60 * 1000), // 45 minutes from now
      });

      const order = await storage.createOrder(orderData, items);
      io.emit("orderin", order);
      res.json(order);
    } catch (error) {
      console.error("Error creating order:", error);
      res.status(400).json({ message: "Failed to create order" });
    }
  });

  app.get("/api/orders/:id", JWTAuth.authenticateToken, async (req, res) => {
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

  app.get("/api/orders", JWTAuth.authenticateToken, async (req: any, res) => {
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
  app.post("/api/payment", JWTAuth.authenticateToken, async (req: any, res) => {
    try {
      const amount = z.string().parse(req.body.totalAmount);

      const { razorpay, key_id } = configRazorPay();

      const order = await razorpay.orders.create({
        amount: Math.round(parseFloat(amount) * 100), // amount in the smallest currency unit
        currency: "INR",
      });
      return res.status(200).json({ success: true, order, token: key_id });
    } catch (error) {
      console.error("Error processing payment:", error);
      return res.status(500).json({ message: "Payment processing failed" });
    }
  });

  // payment verification endpoint (payment status update)
  app.post(
    "/api/payment/verify-payment",
    JWTAuth.authenticateToken,
    async (req, res) => {
      try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
          req.body;

        const body = razorpay_order_id + "|" + razorpay_payment_id;

        const expectedSignature = crypto
          .createHmac("sha256", process.env.RAZORPAY_APT_SECRET!)
          .update(body.toString())
          .digest("hex");
        if (expectedSignature === razorpay_signature) {
          const order = await storage.getOrderUsingRazorPayID(
            razorpay_order_id
          );
          io.emit("orderin", order);

          return res
            .status(200)
            .json({ success: true, message: "Payment verified successfully." });
        }

        return res
          .status(400)
          .json({ success: false, message: "Invalid signature." });
      } catch (error) {
        console.error("Error in verification of payment:", error);
        return res
          .status(400)
          .json({ success: false, message: "Invalid signature." });
      }
    }
  );

  // admin routes

  //register admin
  app.post("/api/admin/register", async (req, res) => {
    try {
      const adminData = registerSchema.parse(req.body);
      const { admin, token } = await JWTAuth.adminRegister(
        adminData.email,
        adminData.password,
        adminData.firstName!,
        adminData.lastName!
      );

      const adminResponse = {
        id: admin.id,
        email: admin.email,
        firstName: admin.firstName,
        lastName: admin.lastName,
      };

      return res.status(201).json({ admin: adminResponse, token });
    } catch (error: any) {
      return res
        .status(400)
        .json({ message: error.message || "Registration failed" });
    }
  });

  // login admin
  app.post("/api/admin/login", async (req, res) => {
    try {
      const credentials = loginSchema.parse(req.body);
      const { admin, token } = await JWTAuth.adminLogin(
        credentials.email,
        credentials.password
      );

      const adminResponse = {
        id: admin.id,
        email: admin.email,
        firstName: admin.firstName,
        lastName: admin.lastName,
      };

      return res.json({ admin: adminResponse, token });
    } catch (error: any) {
      return res.status(401).json({ message: error.message || "Login failed" });
    }
  });

  // logout admin
  app.post(
    "/api/admin/logout",
    JWTAuth.authenticateAdminToken,
    async (req, res) => {
      res.removeHeader("authorization");
      res.removeHeader("set-cookie");
      return res.status(200).json({ message: "Admin logout successfully" });
    }
  );

  // admin dashboard route
  app.get(
    "/api/admin-dashboard",
    JWTAuth.authenticateAdminToken,
    async (req: any, res) => {
      try {
        const dashboardData = await storage.getAdminDashboardData();
        res.json(dashboardData);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        res.status(500).json({ message: "Failed to fetch dashboard data" });
      }
    }
  );

  // get admin details
  app.get(
    "/api/auth/admin",
    JWTAuth.authenticateAdminToken,
    async (req: any, res) => {
      try {
        const adminResponse = {
          id: req.admin.id,
          email: req.admin.email,
          firstName: req.admin.firstName,
          lastName: req.admin.lastName,
          profileImageUrl: req.admin.profileImageUrl,
          isActive: req.admin.isActive,
        };

        res.json(adminResponse);
      } catch (error) {
        console.error("Error fetching user:", error);
        res.status(500).json({ message: "Failed to fetch user" });
      }
    }
  );

  // create new categories
  app.post(
    "/api/admin/categories",
    JWTAuth.authenticateAdminToken,
    async (req, res) => {
      try {
        const categoryData = insertCategorySchema.parse(req.body);
        const category = await storage.createCategory(categoryData);
        res.json(category);
      } catch (error) {
        console.error("Error creating category:", error);
        res.status(400).json({ message: "Failed to create category" });
      }
    }
  );

  // get category by id
  app.get(
    "/api/categories/:id",
    JWTAuth.authenticateAdminToken,
    async (req, res) => {
      try {
        const category = await storage.getCategory(req.params.id);
        if (!category) {
          return res.status(404).json({ message: "Category not found" });
        }
        res.json(category);
      } catch (error) {
        console.error("Error fetching category:", error);
        res.status(500).json({ message: "Failed to fetch category" });
      }
    }
  );

  // update category by id
  app.patch(
    "/api/admin/categories/:id",
    JWTAuth.authenticateAdminToken,
    async (req, res) => {
      try {
        const id = req.params.id;
        const categoryData = insertCategorySchema
          .partial()
          .parse({ id, ...req.body });
        const category = await storage.updateCategory(id, categoryData);
        res.json(category);
      } catch (error) {
        console.error("Error updating category:", error);
        res.status(400).json({ message: "Failed to update category" });
      }
    }
  );

  // get all categories
  app.get(
    "/api/admin/categories",
    JWTAuth.authenticateAdminToken,
    async (req, res) => {
      try {
        const categories = await storage.getAllCategories();
        res.json(categories);
      } catch (error) {
        console.error("Error fetching categories:", error);
        res.status(500).json({ message: "Failed to fetch categories" });
      }
    }
  );

  // delete category by id
  app.delete(
    "/api/admin/categories/:id",
    JWTAuth.authenticateAdminToken,
    async (req, res) => {
      try {
        const id = req.params.id;
        await storage.deleteCategory(id);
        res.json({ message: "Category deleted successfully" });
      } catch (error) {
        console.error("Error deleting category:", error);
        res.status(500).json({ message: "Failed to delete category" });
      }
    }
  );

  // create new product
  app.post(
    "/api/admin/products",
    upload.single("imageUrl"),
    JWTAuth.authenticateAdminToken,
    async (req, res) => {
      try {
        const imageUrl = req.file?.path || null;

        let cloudinaryResponse;
        if (imageUrl) {
          cloudinaryResponse = await uploadFileOnCloudinary(imageUrl);
        }
        const productData = insertProductSchema.parse({
          ...req.body,
          imageUrl: cloudinaryResponse?.secure_url || imageUrl,
        });
        const product = await storage.createProduct(productData);
        res.json(product);
      } catch (error) {
        console.error("Error creating product:", error);
        res.status(400).json({ message: "Failed to create product" });
      }
    }
  );

  // update product by id
  app.patch(
    "/api/admin/products/:id",
    upload.single("imageUrl"),
    JWTAuth.authenticateAdminToken,
    async (req, res) => {
      try {
        const id = req.params.id;
        const imageUrl = req.file?.path || null;

        let cloudinaryResponse;
        if (imageUrl) {
          cloudinaryResponse = await uploadFileOnCloudinary(imageUrl);
        }

        const productData = insertProductSchema.partial().parse({
          id,
          ...req.body,
          imageUrl: cloudinaryResponse?.secure_url || imageUrl,
        });
        const product = await storage.updateProduct(id, productData);
        res.json(product);
      } catch (error) {
        console.error("Error updating product:", error);
        res.status(400).json({ message: "Failed to update product" });
      }
    }
  );

  // get all products or by category
  app.get(
    "/api/admin/products",
    JWTAuth.authenticateAdminToken,
    async (req, res) => {
      try {
        const { category } = req.query;
        const products = category
          ? await storage.getAllProductsByCategory({
            categoryId: category as string,
          })
          : await storage.getAllProducts();
        res.json(products);
      } catch (error) {
        console.error("Error fetching products:", error);
        res.status(500).json({ message: "Failed to fetch products" });
      }
    }
  );

  app.delete(
    "/api/admin/products/:id",
    JWTAuth.authenticateAdminToken,
    async (req, res) => {
      try {
        const id = req.params.id;
        await storage.deleteProduct(id);
        res.json({ message: "Product deleted successfully" });
      } catch (error) {
        console.error("Error deleting product:", error);
        res.status(500).json({ message: "Failed to delete product" });
      }
    }
  );

  // update order status by id
  app.patch(
    "/api/admin/orders/:id",
    JWTAuth.authenticateAdminToken,
    async (req, res) => {
      try {
        const orderStatus = z.string().parse(req.body.status);
        const orderId = z.string().parse(req.params.id);

        const order = await storage.updateOrderStatus(orderId, orderStatus);
        return res.status(200).json(order);
      } catch (error) {
        console.error("Error on order status update:", error);
        return res
          .status(500)
          .json({ message: "Failed to udpate order status" });
      }
    }
  );

  // get order by id
  app.get(
    "/api/admin/orders/:id",
    JWTAuth.authenticateAdminToken,
    async (req, res) => {
      try {
        const orderId = z.string().parse(req.params.id);

        const order = await storage.getOrderWithUser(orderId);

        if (!order) {
          return res.status(404).json({ message: "Order not found" });
        }
        return res.json(order);
      } catch (error) {
        console.log("Error while getting order by id: ", error);
        return res
          .status(500)
          .json({ message: "Error while getting order data" });
      }
    }
  );

  // get orders by status
  app.get(
    "/api/admin/orders",
    JWTAuth.authenticateAdminToken,
    async (req, res) => {
      try {
        const orderStatus = z.string().parse(req.query.status);
        const orders = await storage.getOrdersWithStatus(orderStatus);
        return res.json(orders);
      } catch (error) {
        console.error("Error fetching orders:", error);
        return res.status(500).json({ message: "Failed to fetch orders" });
      }
    }
  );

  app.get(
    "/api/admin/orders-all",
    JWTAuth.authenticateAdminToken,
    async (req, res) => {
      try {
        const orders = await storage.getAllOrdersWithItemsAndUsers();
        return res.json(orders);
      } catch (error) {
        console.error("Error fetching orders:", error);
        return res.status(500).json({ message: "Failed to fetch orders" });
      }
    }
  );

  app.post("/api/admin/seed-order", async (req: any, res) => {
    try {
      const users = await storage.getAllUsers();
      const randomUser = users[Math.floor(Math.random() * users.length)];
      const userId = randomUser.id;

      const razorpay_payment_id = `pay_${crypto.randomBytes(8).toString("hex")}`;

      const orderSchema = seedOrderSchema.extend({
        items: z.array(insertOrderItemSchema.omit({ orderId: true })),
      });

      const { items, ...orderData } = orderSchema.parse({
        userId,
        ...req.body,
        createdAt: new Date(req.body.createdAt),
        totalAmount: req.body.totalAmount.toString(),
        paymentMethod: ["card", "netbanking", "upi"][Math.floor(Math.random() * 3)],
        tax: "0.0",
        paymentStatus: "paid",
        paymentId: razorpay_payment_id,
        estimatedDeliveryTime: new Date(Date.now() + 45 * 60 * 1000), // 45 minutes from now
      });
      console.log("Seed Order Data: ", { orderData});
      const order = await storage.createSeedOrder(orderData, items);

      return res.json(order);
    } catch (error) {
      console.error("Error creating order:", error);
      res.status(400).json({ message: "Failed to create order" });
    }
  });

  const httpServer = existingServer ?? createServer(app);
  return httpServer;
}
