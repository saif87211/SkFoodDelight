import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
// @ts-ignore TS7016: Could not find a declaration file for module 'lucide-react'.
import { Download, Printer, UtensilsCrossed } from "lucide-react";
import { useRef, forwardRef } from "react";
import { useReactToPrint } from "react-to-print";
import { useParams } from "wouter";

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
  const handleDownload = () => window.print(); // placeholder — implement PDF export if needed

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      {/* Actions */}
      <div className="pb-2 p-0 flex justify-center gap-3 bg-gray-50">
        <button
          onClick={reactToPrintFn}
          className="inline-flex items-center gap-2 rounded-md px-4 py-2 bg-primary text-white hover:opacity-95"
          aria-label="Print invoice"
        >
          <Printer /> Print
        </button>
        <button
          onClick={handleDownload}
          className="inline-flex items-center gap-2 rounded-md px-4 py-2 border"
          aria-label="Download invoice"
        >
          <Download /> Download
        </button>
      </div>
      <InvoiceToPrint ref={contentRef} order={order} />
    </div>
  );
}

const InvoiceToPrint = forwardRef<HTMLDivElement, { order?: any }>(
  (props, ref) => {
    const order: any = (props as { order?: any }).order;
    return (
      <div ref={ref} className="bg-white shadow rounded-lg overflow-hidden">
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
                Payment Method: UPI
              </b>
            </div>
            <div className="relative z-10 flex text-primary">
              <p className="mr-5 m-0">
                Invoice No: <b className="font-bold">#LL93784</b>
              </p>
              <p className="m-0">
                Date: <b className="font-bold">01.07.2022</b>
              </p>
            </div>
            <div className="mr-0 rounded-none skew-x-[35deg] absolute h-full w-[70.5%] -right-36 z-10 bg-orange-400/20 border-none min-h-4"></div>
          </div>
          {/* Addresses */}
          <div className="flex flex-col md:flex-row md:justify-between gap-6 mb-6">
            <div>
              <div className="text-sm text-muted-foreground mb-1">
                Invoice To:
              </div>
              <div className="font-medium">Lowell H. Dominguez</div>
              <div className="text-sm">84 Spilman Street</div>
              <div className="text-sm">London, United Kingdom</div>
              <div className="text-sm">lowell@gmail.com</div>
            </div>

            <div className="text-right">
              <div className="text-sm text-muted-foreground mb-1">Pay To:</div>
              <div className="font-medium">Laralink Ltd</div>
              <div className="text-sm">86-90 Paul Street</div>
              <div className="text-sm">London, England EC2A 4NE</div>
              <div className="text-sm">demo@gmail.com</div>
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
                <TableRow>
                  <TableCell>1</TableCell>
                  <TableCell>Burger</TableCell>
                  <TableCell>₹12</TableCell>
                  <TableCell>12</TableCell>
                  <TableCell className="text-right">₹12.00</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          {/* Payment summary */}
          <div className="flex flex-col md:flex-row md:justify-end gap-6 items-start md:items-center">
            <div className="w-full md:w-1/2 text-sm">
              <div className="mb-1 font-semibold">Payment Info</div>
              <div className="text-sm">UPI no.</div>
              <div className="text-sm">Amount: 568,658</div>
            </div>

            <div className="w-full md:w-1/2">
              <table className="w-full text-sm">
                <tbody>
                  <tr>
                    <td className="py-2">Subtotal:</td>
                    <td className="py-2 text-right font-medium">₹142.00</td>
                  </tr>
                  <tr>
                    <td className="py-2">Tax (2%):</td>
                    <td className="py-2 text-right">₹3.00</td>
                  </tr>
                  <tr className="border-t pt-2">
                    <td className="py-3 font-semibold text-lg">Grand Total:</td>
                    <td className="py-3 text-right font-semibold text-lg">
                      ₹142.00
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
