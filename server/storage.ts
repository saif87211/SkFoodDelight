import {
  users,
  categories,
  products,
  cartItems,
  orders,
  orderItems,
  type User,
  type InsertUser,
  type Category,
  type InsertCategory,
  type Product,
  type InsertProduct,
  type CartItem,
  type InsertCartItem,
  type Order,
  type InsertOrder,
  type OrderItem,
  type InsertOrderItem,
  type Admin,
  admins,
  InsertAdmin,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, getTableColumns } from "drizzle-orm";

type UserWithoutPassword = Omit<User, "password">;
type CategoryWithProducts = Category & { products: Product[] };
type OrdersStatus =
  | "pending"
  | "confirmed"
  | "prepared"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

export interface IStorage {
  // User operations for JWT Auth
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  //admin operations
  getAdminByEmail(email: string): Promise<Admin | undefined>;
  getAdmin(id: string): Promise<Admin | undefined>;
  createAdmin(admin: InsertUser): Promise<Admin>;
  //getOrdersWithItemsAndUsers(): Promise<(Order & { orderItems: (OrderItem & { product: Product } & { users: (User) })[] })[]>;

  // Category operations
  getCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;

  // Product operations
  getProducts(): Promise<Product[]>;
  getProductsByCategory(categoryId: string): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product>;

  // Cart operations
  getCartItems(userId: string): Promise<(CartItem & { product: Product })[]>;
  addToCart(cartItem: InsertCartItem): Promise<CartItem>;
  updateCartItem(id: string, quantity: number): Promise<CartItem>;
  removeFromCart(id: string): Promise<void>;
  clearCart(userId: string): Promise<void>;

  // Order operations
  createOrder(
    order: InsertOrder,
    items: Omit<InsertOrderItem, "orderId">[]
  ): Promise<Order>;
  getOrder(
    id: string
  ): Promise<
    (Order & { orderItems: (OrderItem & { product: Product })[] }) | undefined
  >;
  getUserOrders(
    userId: string
  ): Promise<(Order & { orderItems: (OrderItem & { product: Product })[] })[]>;
  updateOrderStatus(id: string, status: string): Promise<Order>;
}

export class DatabaseStorage implements IStorage {
  // User operations for JWT Auth
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  async getAllUsers(): Promise<UserWithoutPassword[]> {
    const { password, ...rest } = getTableColumns(users);
    return await db.select({ ...rest }).from(users);
  }

  // Admin operations
  async createAdmin(adminData: InsertAdmin): Promise<Admin> {
    const [admin] = await db.insert(admins).values(adminData).returning();
    return admin;
  }

  async getAdminByEmail(email: string): Promise<Admin | undefined> {
    const [admin] = await db
      .select()
      .from(admins)
      .where(eq(admins.email, email));
    return admin;
  }

  async getAdmin(id: string): Promise<Admin | undefined> {
    const [admin] = await db.select().from(admins).where(eq(admins.id, id));
    return admin;
  }

  // Category operations
  async getCategories(): Promise<Category[]> {
    return await db
      .select()
      .from(categories)
      .where(eq(categories.isActive, true));
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db
      .insert(categories)
      .values(category)
      .returning();
    return newCategory;
  }

  async getAllCategoriesWithProducts() {
    return await db.select().from(categories);
  }

  // Product operations
  async getProducts(): Promise<Product[]> {
    return await db
      .select()
      .from(products)
      .where(eq(products.isAvailable, true));
  }

  async getProductsByCategory(categoryId: string): Promise<Product[]> {
    return await db
      .select()
      .from(products)
      .where(
        and(eq(products.categoryId, categoryId), eq(products.isAvailable, true))
      );
  }

  async getProduct(id: string): Promise<Product | undefined> {
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, id));
    return product;
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [newProduct] = await db.insert(products).values(product).returning();
    return newProduct;
  }

  async updateProduct(
    id: string,
    product: Partial<InsertProduct>
  ): Promise<Product> {
    const [updatedProduct] = await db
      .update(products)
      .set({ ...product, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();
    return updatedProduct;
  }

  // Cart operations
  async getCartItems(
    userId: string
  ): Promise<(CartItem & { product: Product })[]> {
    return await db
      .select({
        id: cartItems.id,
        userId: cartItems.userId,
        productId: cartItems.productId,
        quantity: cartItems.quantity,
        createdAt: cartItems.createdAt,
        updatedAt: cartItems.updatedAt,
        product: products,
      })
      .from(cartItems)
      .innerJoin(products, eq(cartItems.productId, products.id))
      .where(eq(cartItems.userId, userId));
  }

  async addToCart(cartItem: InsertCartItem): Promise<CartItem> {
    // Check if item already exists in cart
    const [existingItem] = await db
      .select()
      .from(cartItems)
      .where(
        and(
          eq(cartItems.userId, cartItem.userId),
          eq(cartItems.productId, cartItem.productId)
        )
      );

    if (existingItem) {
      // Update quantity
      const [updatedItem] = await db
        .update(cartItems)
        .set({
          quantity: existingItem.quantity + cartItem.quantity!,
          updatedAt: new Date(),
        })
        .where(eq(cartItems.id, existingItem.id))
        .returning();
      return updatedItem;
    } else {
      // Insert new item
      const [newItem] = await db.insert(cartItems).values(cartItem).returning();
      return newItem;
    }
  }

  async updateCartItem(id: string, quantity: number): Promise<CartItem> {
    const [updatedItem] = await db
      .update(cartItems)
      .set({ quantity, updatedAt: new Date() })
      .where(eq(cartItems.id, id))
      .returning();
    return updatedItem;
  }

  async removeFromCart(id: string): Promise<void> {
    await db.delete(cartItems).where(eq(cartItems.id, id));
  }

  async clearCart(userId: string): Promise<void> {
    await db.delete(cartItems).where(eq(cartItems.userId, userId));
  }

  // Order operations
  async createOrder(
    order: InsertOrder,
    items: Omit<InsertOrderItem, "orderId">[]
  ): Promise<Order> {
    return await db.transaction(async (tx) => {
      const [newOrder] = await tx.insert(orders).values(order).returning();

      await tx
        .insert(orderItems)
        .values(items.map((item) => ({ ...item, orderId: newOrder.id })));

      // Clear cart after order
      await tx.delete(cartItems).where(eq(cartItems.userId, order.userId));

      return newOrder;
    });
  }

  async getOrder(
    id: string
  ): Promise<
    (Order & { orderItems: (OrderItem & { product: Product })[] }) | undefined
  > {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    if (!order) return undefined;

    const items = await db
      .select({
        id: orderItems.id,
        orderId: orderItems.orderId,
        productId: orderItems.productId,
        quantity: orderItems.quantity,
        price: orderItems.price,
        productName: orderItems.productName,
        product: products,
      })
      .from(orderItems)
      .innerJoin(products, eq(orderItems.productId, products.id))
      .where(eq(orderItems.orderId, id));

    return { ...order, orderItems: items };
  }

  async getUserOrders(
    userId: string
  ): Promise<(Order & { orderItems: (OrderItem & { product: Product })[] })[]> {
    const userOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.createdAt));

    const ordersWithItems = await Promise.all(
      userOrders.map(async (order) => {
        const items = await db
          .select({
            id: orderItems.id,
            orderId: orderItems.orderId,
            productId: orderItems.productId,
            quantity: orderItems.quantity,
            price: orderItems.price,
            productName: orderItems.productName,
            product: products,
          })
          .from(orderItems)
          .innerJoin(products, eq(orderItems.productId, products.id))
          .where(eq(orderItems.orderId, order.id));

        return { ...order, orderItems: items };
      })
    );

    return ordersWithItems;
  }

  async updateOrderStatus(id: string, status: string): Promise<Order> {
    const [updatedOrder] = await db
      .update(orders)
      .set({ status, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();
    return updatedOrder;
  }

  async getAllorders(): Promise<Order[]> {
    return await db.select().from(orders).orderBy(desc(orders.createdAt));
  }

  async getOrdersWithItemsAndUsers() {
    return await db
      .select()
      .from(orders)
      // .innerJoin(orderItems, eq(orders.id, orderItems.orderId))
      .leftJoin(users, eq(orders.userId, users.id))
      .orderBy(desc(orders.createdAt));
  }
  async getOrdersWithStatus(status: OrdersStatus): Promise<Order[]> {
    return await db
      .select()
      .from(orders)
      .where(eq(orders.status, status))
      .orderBy(desc(orders.createdAt));
  }

  async getAllCategories(): Promise<Category[]> {
    return await db.select().from(categories).orderBy(desc(categories.createdAt));
  }

  async getCategory(id: string): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category;
  }
  async updateCategory(id: string, category: Partial<InsertCategory>): Promise<Category> {
    const [updatedCategory] = await db
      .update(categories)
      .set({ ...category, updatedAt: new Date() })
      .where(eq(categories.id, id))
      .returning();
    return updatedCategory;
  }

  async deleteProduct(id: string) {
    return await db.delete(products).where(eq(products.id, id)).returning();
    // return await db.update(products).set({ isAvailable: false, updatedAt: new Date() }).where(eq(products.id, id)).returning();
  }

  async getAllProductsByCategory(params: { categoryId: string }) {
    return await db
      .select()
      .from(products)
      .where(and(eq(products.categoryId, params.categoryId)));
  }

  async getAllProducts(): Promise<Product[]> {
    return await db.select().from(products);
  }

  async deleteCategory(id: string) {
    return await db.delete(categories).where(eq(categories.id, id)).returning();
  }
}

export const storage = new DatabaseStorage();
