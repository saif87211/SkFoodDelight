import {
  Search,
  Printer,
  User,
  Clock,
  Package,
  ChevronDown,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// NOTE: for the table view we use a two-row expand pattern (summary row + details row)
// to preserve table semantics and avoid nesting non-<tr> elements inside <tbody>.

// --- Custom Types for Order Data ---
interface Product {
  name: string;
  price: string;
}

interface OrderItem {
  id: string;
  orderId: string;
  quantity: number;
  price: string;
  productName: string;
  product: Product;
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface OrderWithDetails {
  id: string;
  userId: string;
  status: "orderin" | "processing" | "shipped" | "delivered" | "cancelled";
  totalAmount: string;
  deliveryFee: string;
  tax: string;
  paymentMethod: string;
  deliveryAddress: string;
  customerName: string;
  customerPhone: string;
  createdAt: string;
  updatedAt: string;
  acknowledgedAt: string | null;
  orderItems: OrderItem[];
  user: User;
}

// --- Status to Color Mapping ---
const STATUS_MAP: any = {
  orderin: {
    text: "ORDERIN",
    color: "bg-blue-100 text-blue-800 border-blue-300",
  },
  prepared: {
    text: "PREPARED",
    color: "bg-yellow-100 text-yellow-800 border-yellow-300",
  },
  shipped: {
    text: "SHIPPED",
    color: "bg-indigo-100 text-indigo-800 border-indigo-300",
  },
  delivered: {
    text: "DELIVERED",
    color: "bg-green-100 text-green-800 border-green-300",
  },
  cancelled: {
    text: "CANCELLED",
    color: "bg-red-100 text-red-800 border-red-300",
  },
};

export default function AdminOrderList() {
  const { data: orders = [], isLoading } = useQuery<OrderWithDetails[]>({
    queryKey: ["/api/admin/orders-all"],
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [, navigate] = useLocation();

  const PAGE_SIZE = 10;
  const [page, setPage] = useState(1);
  const { toast } = useToast();

  // Expanded rows state (keeps table semantics intact)
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  useEffect(() => {
    setPage(1);
  }, [searchQuery]);

  // Combined Search Filter
  const filteredOrders = useMemo(
    () =>
      orders.filter((order) => {
        const query = searchQuery.toLowerCase();
        return (
          order.id.includes(query) ||
          order.customerName.toLowerCase().includes(query) ||
          order.customerPhone.includes(query) ||
          order.user.email.toLowerCase().includes(query) ||
          order.status.toLowerCase().includes(query)
        );
      }),
    [orders, searchQuery]
  );

  const total = filteredOrders.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  // Pagination Logic
  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredOrders.slice(start, start + PAGE_SIZE);
  }, [filteredOrders, page]);

  // Pagination Button Utility
  const visiblePageNumbers = useMemo(() => {
    const maxButtons = 5;
    if (totalPages <= maxButtons)
      return Array.from({ length: totalPages }, (_, i) => i + 1);

    const pages = new Set<number>();
    pages.add(1);
    pages.add(totalPages);
    pages.add(page);
    pages.add(Math.max(2, page - 1));
    pages.add(Math.min(totalPages - 1, page + 1));

    const sorted = Array.from(pages).sort((a, b) => a - b);
    const result: (number | "ellipsis")[] = [];
    for (let i = 0; i < sorted.length; i++) {
      if (i > 0 && sorted[i] - sorted[i - 1] > 1) result.push("ellipsis");
      result.push(sorted[i]);
    }
    return result;
  }, [totalPages, page]);

  // Function to handle the Invoice button click
  const handleInvoice = (orderId: string) => {
    // Logic to generate invoice (e.g., navigate or open a print modal)
    navigate(`/admin/invoice/${orderId}`);
    toast({
      title: "Redirecting to Invoice",
      description: `Generating invoice for Order ID: ${orderId}...`,
      className: "bg-indigo-400 text-white",
    });
  };

  if (isLoading) {
    return (
      <main className="mx-auto p-5 text-center">
        <p>Loading orders...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto p-5">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Orders List ({total} Total)</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search Bar */}
          <div className="mb-8" data-testid="section-search">
            <div className="relative max-w-md">
              <Input
                type="text"
                placeholder="Search by ID, Customer Name, or Email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 border border-slate-300 focus:border-indigo-500"
                data-testid="input-search"
              />
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            </div>
          </div>

          {/* Mobile friendly list (visible on small screens) */}
          <div className="space-y-3 sm:hidden">
            {paginated.length > 0 ? (
              paginated.map((order) => {
                const status = STATUS_MAP[order.status] || STATUS_MAP.orderin;
                const isNew = !order.acknowledgedAt;

                return (
                  <div
                    key={order.id}
                    className="bg-white border border-slate-200 rounded-lg"
                  >
                    <Accordion type="single" collapsible>
                      <AccordionItem value={order.id} className="border-b-0">
                        <AccordionTrigger className="w-full text-sm font-medium hover:no-underline px-4 py-3">
                          <div className="flex items-center justify-between w-full">
                            <div className="flex flex-col items-start min-w-0 pr-2">
                              <div className="text-base font-semibold text-gray-800 truncate">
                                {order.customerName}
                                {isNew && (
                                  <span className="ml-2 px-2 py-0.5 text-xs font-bold text-red-800 bg-red-100 rounded-full">
                                    NEW
                                  </span>
                                )}
                              </div>
                              <div className="text-sm font-bold text-gray-900 mt-1">
                                ₹{parseFloat(order.totalAmount).toFixed(2)}
                              </div>
                            </div>
                            <div className="text-right flex items-center">
                              <span
                                className={`px-2 py-0.5 rounded-full text-xs font-medium border ${status.color}`}
                              >
                                {status.text}
                              </span>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="p-4 border-t border-slate-200 bg-gray-50">
                          <OrderDetails
                            order={order}
                            handleInvoice={handleInvoice}
                          />
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </div>
                );
              })
            ) : (
              <div className="text-center text-sm text-gray-500 py-6">
                No orders found.
              </div>
            )}
          </div>

          {/* Table view for larger screens */}
          <div className="hidden sm:block overflow-x-auto">
            <Table className="mb-0 min-w-full bg-white shadow-sm rounded-lg border border-slate-200">
              <TableHeader className="bg-gray-50">
                <TableRow className="">
                  <TableHead className="w-16">#</TableHead>
                  <TableHead>Order ID</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-24 text-center">Details</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody className="font-normal">
                {paginated.length > 0 ? (
                  paginated.map((order, index) => {
                    const status =
                      STATUS_MAP[order.status] || STATUS_MAP.orderin;
                    const isNew = !order.acknowledgedAt;
                    const isExpanded = expanded.has(order.id);

                    return (
                      <>
                        <TableRow
                          key={order.id + "-main" + index}
                          className="odd:bg-white even:bg-slate-50 hover:bg-gray-50"
                        >
                          <TableCell className="py-3 px-4 align-middle text-sm">
                            {(page - 1) * PAGE_SIZE + index + 1}.
                          </TableCell>

                          <TableCell className="py-3 px-4 align-middle text-sm font-mono text-gray-700">
                            {order.id.substring(0, 8)}...
                            {isNew && (
                              <span className="ml-2 px-2 py-0.5 text-xs font-bold text-red-800 bg-red-100 rounded-full w-fit">
                                NEW
                              </span>
                            )}
                          </TableCell>

                          <TableCell className="py-3 px-4 align-middle text-sm">
                            <div className="font-medium">
                              {order.user.firstName} {order.user.lastName}
                            </div>
                            <div className="text-xs text-gray-500">
                              {order.user.email}
                            </div>
                          </TableCell>

                          <TableCell className="py-3 px-4 align-middle text-sm font-bold text-gray-900">
                            ₹{parseFloat(order.totalAmount).toFixed(2)}
                          </TableCell>

                          <TableCell className="py-3 px-4 align-middle text-sm">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium border ${status.color}`}
                            >
                              {status.text}
                            </span>
                          </TableCell>

                          <TableCell className="py-0 px-4 align-middle text-center text-sm">
                            <div className="flex items-center justify-center gap-2">
                              {order.status === "delivered" ? (
                                <Button
                                  variant="default"
                                  size="icon"
                                  className="rounded-full bg-indigo-500 hover:bg-indigo-600"
                                  aria-label={`View Invoice for ${order.id}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleInvoice(order.id);
                                  }}
                                >
                                  <Printer className="w-5 h-5 text-white" />
                                </Button>
                              ) : (
                                <div className="text-xs text-gray-500">
                                  Actions when delivered
                                </div>
                              )}

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleExpand(order.id);
                                }}
                                aria-expanded={isExpanded}
                                className="p-2 rounded hover:bg-slate-100"
                                title={isExpanded ? "Collapse" : "Expand"}
                              >
                                <ChevronDown
                                  className={`w-4 h-4 transition-transform ${
                                    isExpanded ? "rotate-180" : ""
                                  }`}
                                />
                              </button>
                            </div>
                          </TableCell>
                        </TableRow>

                        {isExpanded && (
                          <TableRow
                            key={order.id + "-detail"}
                            className="bg-gray-50"
                          >
                            <TableCell colSpan={6} className="p-4">
                              <OrderDetails
                                order={order}
                                handleInvoice={handleInvoice}
                              />
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      No orders found matching your search criteria.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>

              <TableFooter>
                <TableRow>
                  <TableCell colSpan={6} className="py-4">
                    {/* Pagination Nav */}
                    <nav
                      aria-label="Pagination"
                      className="flex items-center justify-end gap-2"
                    >
                      <Button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        size="sm"
                      >
                        Prev
                      </Button>

                      {visiblePageNumbers.map((p, i) =>
                        p === "ellipsis" ? (
                          <span key={`e-${i}`} className="px-2">
                            …
                          </span>
                        ) : (
                          <Button
                            key={p}
                            onClick={() => setPage(p)}
                            variant={p === page ? "default" : "ghost"}
                            size="sm"
                            aria-current={p === page ? "page" : undefined}
                          >
                            {p}
                          </Button>
                        )
                      )}

                      <Button
                        onClick={() =>
                          setPage((p) => Math.min(totalPages, p + 1))
                        }
                        disabled={page === totalPages}
                        size="sm"
                      >
                        Next
                      </Button>
                    </nav>
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

// --- Separate Component for Expanded Details ---
interface OrderDetailsProps {
  order: OrderWithDetails;
  handleInvoice: (id: string) => void;
}

const OrderDetails: React.FC<OrderDetailsProps> = ({
  order,
  handleInvoice,
}) => {
  // Calculate total quantity of items
  const totalQuantity = order.orderItems.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
      {/* Column 1: Customer and Delivery */}
      <div className="space-y-3 p-4 bg-white rounded-lg border border-gray-200">
        <h3 className="flex items-center font-semibold text-lg text-indigo-700 border-b pb-2 mb-3">
          <User className="w-5 h-5 mr-2" /> Customer Details
        </h3>
        <p>
          <span className="font-medium">Name:</span> {order.customerName}
        </p>
        <p>
          <span className="font-medium">Phone:</span> {order.customerPhone}
        </p>
        <p>
          <span className="font-medium">User Email:</span> {order.user.email}
        </p>
        <p className="font-medium mt-3">
          Delivery Address:
          <span className="block text-gray-700 font-normal mt-1">
            {order.deliveryAddress}
          </span>
        </p>
      </div>

      {/* Column 2: Order Items Summary */}
      <div className="md:col-span-1 p-4 bg-white rounded-lg border border-gray-200 overflow-x-auto">
        <h3 className="flex items-center font-semibold text-lg text-indigo-700 border-b pb-2 mb-3">
          <Package className="w-5 h-5 mr-2" /> Order Items ({totalQuantity}{" "}
          Total)
        </h3>
        <Table className="text-sm">
          <TableHeader>
            <TableRow className="text-xs text-gray-600">
              <TableHead className="p-1">Item</TableHead>
              <TableHead className="p-1 text-center">Qty</TableHead>
              <TableHead className="p-1 text-right">Price</TableHead>
              <TableHead className="p-1 text-right">Subtotal</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {order.orderItems.map((item) => (
              <TableRow key={item.id} className="hover:bg-gray-50">
                <TableCell className="p-1 font-medium">
                  {item.productName}
                </TableCell>
                <TableCell className="p-1 text-center">
                  {item.quantity}
                </TableCell>
                <TableCell className="p-1 text-right">
                  ₹{parseFloat(item.price).toFixed(2)}
                </TableCell>
                <TableCell className="p-1 text-right font-semibold">
                  ₹{(parseFloat(item.price) * item.quantity).toFixed(2)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Column 3: Totals and Actions */}
      <div className="space-y-3 p-4 bg-white rounded-lg border border-gray-200">
        <h3 className="flex items-center font-semibold text-lg text-indigo-700 border-b pb-2 mb-3">
          <Clock className="w-5 h-5 mr-2" /> Summary
        </h3>

        <div className="space-y-1">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span className="font-medium">
              ₹
              {(
                parseFloat(order.totalAmount) -
                parseFloat(order.deliveryFee) -
                parseFloat(order.tax)
              ).toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Delivery Fee:</span>
            <span className="font-medium">
              ₹{parseFloat(order.deliveryFee).toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Tax:</span>
            <span className="font-medium">
              ₹{parseFloat(order.tax).toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between text-lg font-bold border-t pt-2 mt-2">
            <span>TOTAL:</span>
            <span className="text-green-700">
              ₹{parseFloat(order.totalAmount).toFixed(2)}
            </span>
          </div>
        </div>

        {/* <div className="pt-4 flex justify-center">
          <Button
            variant="default"
            size="lg"
            className="bg-indigo-600 hover:bg-indigo-700 text-white w-full flex items-center"
            onClick={() => handleInvoice(order.id)}
          >
            <Printer className="w-5 h-5 mr-2" /> Generate Invoice
          </Button>
        </div> */}
      </div>
    </div>
  );
};
