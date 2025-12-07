import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeftToLine,
  Download,
  Printer,
  UtensilsCrossed,
  // @ts-ignore TS7016: Could not find a declaration file for module 'lucide-react'.
} from "lucide-react";
import { useRef, forwardRef } from "react";
import { Button } from "@/components/ui/button";
import { useReactToPrint } from "react-to-print";
import { useParams } from "wouter";

/**
 * Formats a date string (ISO) into a standard invoice date format (e.g., 14/11/2025).
 */
const formatDate = (isoString: any) => {
  if (!isoString) return "N/A";
  // Use Intl.DateTimeFormat for robustness
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(isoString));
};

/**
 * Formats a numeric string into a currency string (e.g., 35.98 -> ₹35.98).
 */
const formatCurrency = (value: any) => {
  const num = parseFloat(value || "0");
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR", // Assuming INR for Indian currency
  }).format(num);
};

// --- Main Components ---

export default function Invoice() {
  const { id }: { id: string | undefined } = useParams();
  const {
    data: order,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["/api/admin/orders", id],
    retry: false,
    enabled: !!id,
  });

  const contentRef = useRef(null);
  const reactToPrintFn = useReactToPrint({ contentRef });

  // NOTE: PDF download requires a specialized library (like html2pdf or react-pdf/renderer)
  const handleDownload = () => window.print(); // Using print as a placeholder download action

  if (isLoading)
    return <div className="text-center py-8">Loading Invoice...</div>;
  if (isError || !order)
    return (
      <div className="text-center py-8 text-red-500">
        Error loading invoice or order not found.
      </div>
    );

  return (
    <div className="max-w-3xl mx-auto py-2 px-4">
      {/* Actions */}
      <div className="pb-2 p-0 flex justify-center gap-3 bg-gray-50">
        <Button
          onClick={() => window.history.back()}
          className="inline-flex items-center gap-2 rounded-md px-4 py-2 bg-primary text-white hover:opacity-95"
          aria-label="Back to order list"
        >
          <ArrowLeftToLine /> Back
        </Button>
        <Button
          onClick={reactToPrintFn}
          className="inline-flex items-center gap-2 rounded-md px-4 py-2 bg-primary text-white hover:opacity-95"
          aria-label="Print invoice"
        >
          <Printer /> Print
        </Button>
        <Button
          onClick={handleDownload}
          variant={"outline"}
          className="inline-flex items-center gap-2 rounded-md px-4 py-2 border"
          aria-label="Download invoice"
        >
          <Download /> Download
        </Button>
      </div>
      <InvoiceToPrint ref={contentRef} order={order} />
    </div>
  );
}

const InvoiceToPrint = forwardRef<HTMLDivElement, { order?: any }>(
  (props, ref) => {
    const order = props.order;

    // Calculate Subtotal (Total - Tax - Delivery Fee)
    const total = parseFloat(order?.totalAmount || "0");
    const tax = parseFloat(order?.tax || "0");
    const deliveryFee = parseFloat(order?.deliveryFee || "0");
    const subtotal = total - tax - deliveryFee;

    return (
      <div
        ref={ref}
        className="bg-white shadow rounded-lg overflow-hidden print:shadow-none"
      >
        <div className="p-6">
          {/* Header */}
          <div className="h-24 relative flex justify-between items-center mb-5">
            <div className="text-lg md:text-2xl font-bold text-primary flex flex-row items-center z-10">
              <UtensilsCrossed className="inline mr-2" />
              <span className="hidden sm:inline">SkFoodDelight</span>
            </div>
            <div className="relative z-10 shrink-0 basis-0 grow-0 w-3/5 text-right">
              <h1 className="leading-tight uppercase text-4xl text-primary">
                Invoice
              </h1>
            </div>
            <div className="absolute h-full w-[70%] skew-x-[35deg] top-0 -right-[100px] z-10 bg-orange-500/20 overflow-hidden"></div>
          </div>

          {/* Payment & Date */}
          <div className="relative px-0 py-1 flex items-center justify-between mb-6">
            <div className="relative z-10">
              <b className="text-black text-base font-bold">
                Payment Method: {order?.paymentMethod?.toUpperCase() || "N/A"}
              </b>
            </div>
            <div className="relative z-10 flex text-primary">
              <p className="mr-5 m-0">
                Order ID:
                <b className="font-bold">
                  #{order?.id?.substring(0, 8).toUpperCase() || "N/A"}
                </b>
              </p>
              <p className="m-0">
                Date:
                <b className="font-bold">{formatDate(order?.createdAt)}</b>
              </p>
            </div>
            <div className="mr-0 rounded-none skew-x-[35deg] absolute h-full w-[70.5%] -right-36 z-10 bg-orange-400/20 border-none min-h-4"></div>
          </div>

          {/* Addresses */}
          <div className="flex flex-col md:flex-row md:justify-between gap-6 mb-6">
            <div>
              <div className="text-sm text-muted-foreground mb-1">
                Invoice To (Customer):
              </div>
              <div className="font-medium">
                {order?.customerName ||
                  `${order?.user?.firstName} ${order?.user?.lastName}` ||
                  "N/A"}
              </div>
              <div className="text-sm">
                {order?.deliveryAddress || "Address N/A"}
              </div>
              <div className="text-sm">
                Phone: {order?.customerPhone || "N/A"}
              </div>
              <div className="text-sm">
                Email: {order?.user?.email || "N/A"}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground mb-1">Pay To:</div>
              <div className="font-medium">SkFoodDelight</div>
              <div className="text-sm">86-90 Paul Street (Placeholder)</div>
              <div className="text-sm">
                London, England EC2A 4NE (Placeholder)
              </div>
              <div className="text-sm">
                demo@skfooddelight.com (Placeholder)
              </div>
            </div>
          </div>

          {/* Items table */}
          <div className="overflow-x-auto mb-6">
            <Table>
              <TableHeader>
                <TableRow className="bg-orange-50">
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Item Name</TableHead>
                  <TableHead className="w-24">Price</TableHead>
                  <TableHead className="w-20">Qty</TableHead>
                  <TableHead className="w-28 text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order?.orderItems &&
                  order.orderItems.map((item: any, index: any) => (
                    <TableRow key={item.id}>
                      
                      {/* Use item.id as the unique key! */}
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{item.productName}</TableCell>
                      <TableCell>{formatCurrency(item.price)}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(parseFloat(item.price) * item.quantity)}
                      </TableCell>
                    </TableRow>
                  ))}
                {(!order?.orderItems || order.orderItems.length === 0) && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center text-muted-foreground"
                    >
                      No items in this order.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Payment summary */}
          <div className="flex flex-col md:flex-row md:justify-end gap-6 items-start md:items-center">
            <div className="w-full md:w-1/2 text-sm">
              <div className="mb-1 font-semibold">Payment Status</div>
              <div className="text-sm">
                Method: {order?.paymentMethod?.toUpperCase()}
              </div>
              <div className="text-sm">
                Status: {order?.paymentStatus?.toUpperCase()}
              </div>
              <div className="text-sm">
                Transaction ID: {order?.paymentId || "N/A"}
              </div>
            </div>
            <div className="w-full md:w-1/2">
              <table className="w-full text-sm">
                <tbody>
                  <tr>
                    <td className="py-2">Subtotal:</td>
                    <td className="py-2 text-right font-medium">
                      {formatCurrency(subtotal)}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2">Delivery Fee:</td>
                    <td className="py-2 text-right font-medium">
                      {formatCurrency(deliveryFee)}
                    </td>
                  </tr>
                  {tax > 0 && (
                    <tr>
                      <td className="py-2">Tax:</td>
                      <td className="py-2 text-right">{formatCurrency(tax)}</td>
                    </tr>
                  )}

                  <tr className="border-t pt-2">
                    <td className="py-3 font-semibold text-lg">Grand Total:</td>
                    <td className="py-3 text-right font-semibold text-lg">
                      {formatCurrency(total)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Signature */}
          <div className="mt-6 flex justify-end">
            <div className="text-center">
              <img
                src="https://invoma-react.vercel.app/images/sign.svg"
                className="mx-auto h-10 mb-1"
                alt="sign"
              />
              <div className="text-sm text-muted-foreground">Sohel Kothiya</div>
              <div className="font-medium">CEO</div>
            </div>
          </div>
          <hr className="my-6" />
          <p className="text-center text-sm text-muted-foreground">
            Thank you for choosing to dine with us. See you soon 🙂
          </p>
        </div>
      </div>
    );
  }
);
