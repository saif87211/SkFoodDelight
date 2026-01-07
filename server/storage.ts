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
  InsertSeedOrder,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, getTableColumns, sql, gte, asc, or, inArray } from "drizzle-orm";

type UserWithoutPassword = Omit<User, "password">;
type CategoryWithProducts = Category & { products: Product[] };

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

  async createSeedOrder(
    order: InsertSeedOrder,
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

  async updateOrderPaymentStatus(id: string, status: string): Promise<Order> {
    const [updatedOrder] = await db
      .update(orders)
      .set({ paymentStatus: status, updatedAt: new Date() })
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
  async getOrdersWithStatus(status: string): Promise<Order[]> {
    return await db
      .select()
      .from(orders)
      .where(eq(orders.status, status))
      .orderBy(desc(orders.createdAt));
  }

  async getAllCategories(): Promise<Category[]> {
    return await db
      .select()
      .from(categories)
      .orderBy(desc(categories.createdAt));
  }

  async getOrderUsingRazorPayID(
    razorpay_order_id: string
  ): Promise<Order | undefined> {
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.paymentId, razorpay_order_id));
    return order;
  }

  async getCategory(id: string): Promise<Category | undefined> {
    const [category] = await db
      .select()
      .from(categories)
      .where(eq(categories.id, id));
    return category;
  }
  async updateCategory(
    id: string,
    category: Partial<InsertCategory>
  ): Promise<Category> {
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

  async getOrderWithUser(id: string): Promise<
    | (Order & {
      orderItems: (OrderItem & { product: Product })[];
      user?: Pick<
        User,
        "id" | "firstName" | "lastName" | "email" | "profileImageUrl"
      >;
    })
    | undefined
  > {
    const [order, items] = await Promise.all([
      db.query.orders.findFirst({ where: eq(orders.id, id) }),
      db
        .select({
          id: orderItems.id,
          orderId: orderItems.orderId,
          productId: orderItems.productId,
          quantity: orderItems.quantity,
          price: orderItems.price,
          productName: orderItems.productName,
          product: products, // Selects all columns from the products table
        })
        .from(orderItems)
        .innerJoin(products, eq(orderItems.productId, products.id))
        .where(eq(orderItems.orderId, id)),
    ]);

    if (!order) return undefined;

    const [fetchedUser] = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        profileImageUrl: users.profileImageUrl,
      })
      .from(users)
      .where(eq(users.id, order.userId));

    let finalOrder = order;

    if (!order.acknowledgedAt) {
      const [updatedOrder] = await db
        .update(orders)
        .set({ acknowledgedAt: new Date(), updatedAt: new Date() })
        .where(eq(orders.id, id))
        .returning();

      if (updatedOrder) {
        finalOrder = updatedOrder;
      }
    }

    return { ...finalOrder, orderItems: items, user: fetchedUser };
  }

  async getAllOrdersWithItemsAndUsers() {
    // Select orders and their user in one query, then fetch order items for
    // each order (joined with product) to compose the full payload.
    const rows = await db
      .select({
        order: {
          id: orders.id,
          userid: orders.userId,
          status: orders.status,
          paymentStatus: orders.paymentStatus,
          paymentMethod: orders.paymentMethod,
          acknowledgedAt: orders.acknowledgedAt,
          createdAt: orders.createdAt,
          customerName: orders.customerName,
          customerPhone: orders.customerPhone,
          deliveryAddress: orders.deliveryAddress,
          isDeliveredAt: orders.isDeliveredAt,
          totalAmount: orders.totalAmount,
          tax: orders.tax,
          deliveryFee: orders.deliveryFee,
        },
        user: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          phone: users.phone,
        },
      })
      .from(orders)
      .leftJoin(users, eq(orders.userId, users.id))
      .orderBy(desc(orders.createdAt));

    // rows will be objects like { order: Order, user: User | null }
    const ordersList = rows.map((r: any) => r.order as Order);

    const ordersWithItems = await Promise.all(
      ordersList.map(async (order) => {
        const items = await db
          .select({
            id: orderItems.id,
            orderId: orderItems.orderId,
            productId: orderItems.productId,
            quantity: orderItems.quantity,
            price: orderItems.price,
            productName: orderItems.productName,
          })
          .from(orderItems)
          .where(eq(orderItems.orderId, order.id));

        return { ...order, orderItems: items };
      })
    );

    // Attach users to the corresponding orders from the earlier join
    const userMap = new Map<string, User | undefined>();
    for (const r of rows as any[]) {
      const o = r.order as Order;
      userMap.set(o.id, r.user || undefined);
    }

    return ordersWithItems.map((o) => ({ ...o, user: userMap.get(o.id) }));
  }

  async getAdminDashboardData() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const kpiPromise = db
      .select({
        todayRevenue: sql<number>`SUM(CASE WHEN ${orders.createdAt} >= ${today} THEN ${orders.totalAmount} ELSE 0 END)`,
        todayCount: sql<number>`COUNT(CASE WHEN ${orders.createdAt} >= ${today} THEN 1 END)`,
        prevRevenue: sql<number>`SUM(CASE WHEN ${orders.createdAt} >= ${yesterday} AND ${orders.createdAt} < ${today} THEN ${orders.totalAmount} ELSE 0 END)`,
        prevCount: sql<number>`COUNT(CASE WHEN ${orders.createdAt} >= ${yesterday} AND ${orders.createdAt} < ${today} THEN 1 END)`,
      })
      .from(orders)
      .where(eq(orders.status, "delivered"));

    const orderBreakdownPromise = db
      .select({
        name: sql<string>`CASE 
      WHEN ${orders.status} IN ('orderin', 'prepared') THEN 'pending' 
      ELSE ${orders.status} 
    END`.as('status_group'),
        value: sql<number>`count(*)`,
      })
      .from(orders)
      .where(
        and(
          gte(orders.createdAt, sql`now() - interval '24 hours'`),
          // Simplified status filter using 'inArray'
          inArray(orders.status, ['delivered', 'orderin', 'prepared', 'canceled'])
        )
      )
      .groupBy(sql`status_group`);

    // 1. Change the alias here from "date" to "chart_date"
    const dateSeries = sql`
    SELECT generate_series(
      CURRENT_DATE - INTERVAL '6 days',
      CURRENT_DATE,
      INTERVAL '1 day'
    )::date AS chart_date`;

    const chartPromise = db
      .select({
        date: sql`all_days.chart_date`,
        revenue: sql<number>`COALESCE(SUM(${orders.totalAmount}), 0)`,
        count: sql<number>`COALESCE(COUNT(${orders.id}), 0)`,
      })
      .from(sql`(${dateSeries}) AS all_days`)
      .leftJoin(
        orders,
        and(
          sql`DATE(${orders.createdAt}) = all_days.chart_date`,
          eq(orders.status, "delivered")
        )
      )
      .groupBy(sql`all_days.chart_date`)
      .orderBy(asc(sql`all_days.chart_date`));

    const totalItemsPromise = db
      .select({
        name: orderItems.productName,
        units: sql<number>`SUM(${orderItems.quantity})`,
      })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(eq(orders.status, "delivered"))
      .groupBy(orderItems.productName)
      .orderBy(desc(sql`SUM(${orderItems.quantity})`))
      .limit(5);

    const [kpis, chartData, topItems, orderBreakdowncount] = await Promise.all([
      kpiPromise,
      chartPromise,
      totalItemsPromise,
      orderBreakdownPromise,
    ]);

    const defaultBreakdown = [
      { name: "delivered", value: 0 },
      { name: "pending", value: 0 },
      { name: "canceled", value: 0 },
    ];

    const orderBreakdown = defaultBreakdown.map((item) => {
      const dbMatch = orderBreakdowncount.find((res) => res.name === item.name);

      return {
        name: item.name,
        value: dbMatch ? Number(dbMatch.value) : 0,
      };
    });

    return { kpis, chartData, topItems, orderBreakdown };
  }
}

export const storage = new DatabaseStorage();
