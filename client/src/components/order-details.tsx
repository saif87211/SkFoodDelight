import { formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Contact, MapPin } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Order, OrderItem, Product } from "@shared/schema";
import { Button } from "./ui/button";

export default function OrderDetails({
  orderid: id,
}: {
  orderid: string | null;
}) {
  const {
    data: order,
    isLoading,
    isError,
  } = useQuery<Order & { orderItems: (OrderItem & { product: Product })[] }>({
    queryKey: ["/api/orders", id],
    retry: false,
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="animate-pulse">
          <div className="flex items-center sm:flex-row flex-col justify-between border-b flex-wrap py-4">
            <div className="h-16 w-56 bg-gray-200 rounded-sm dark:bg-gray-800"></div>
            <div className="h-16 w-56 bg-gray-200 rounded-sm dark:bg-gray-800"></div>
          </div>
          <div className="flex items-center md:flex-row flex-col justify-between border-b flex-wrap py-4">
            <div className="h-28 w-56 bg-gray-200 rounded-sm dark:bg-gray-800"></div>
            <div className="h-28 w-56 bg-gray-200 rounded-sm dark:bg-gray-800"></div>
          </div>
          <div className="flex flex-col gap-y-3 border-b py-2 mb-2">
            <div className="h-14 w-full bg-gray-200 rounded-sm dark:bg-gray-800"></div>
            <div className="h-14 w-full bg-gray-200 rounded-sm dark:bg-gray-800"></div>
            <div className="h-14 w-full bg-gray-200 rounded-sm dark:bg-gray-800"></div>
          </div>
          <div className="h-10 w-full bg-gray-200 rounded-sm dark:bg-gray-800 mb-2"></div>
        </CardContent>
      </Card>
    );
  }
  if (isError || !order) {
    return (
      <Card>
        <CardContent>
          <div className="flex flex-col items-center justify-center my-20">
            <h4 className="text-slate-600">No order selected.</h4>
          </div>
        </CardContent>
      </Card>
    );
  }
  return (
    <Card className="h-auto">
      <CardContent className="p-7">
        {/* user & order details */}
        <div className="flex items-center justify-between border-b flex-wrap">
          <div className="mb-4">
            <h4 className="text-xl font-bold mb-0">
              Order #{order?.id.slice(-8).toUpperCase()}
            </h4>
            <span className="text-xs text-slate-500">
              {formatDate(order?.createdAt)}
            </span>
          </div>
          <div className="flex mb-4">
            <img
              src="https://fooddesk-vite.vercel.app/assets/pic-1-CSKj1ibQ.jpg"
              className="size-12 object-cover rounded-lg mr-2"
              alt="User"
            ></img>
            <div>
              <h6 className="text-sm font-bold">Ruby Roben</h6>
              <span className="text-slate-500">User</span>
            </div>
          </div>
        </div>
        {/* delivery and cutomer details */}
        <div className="flex flex-wrap pb-2 border-b">
          {/* col-4 */}
          <div className="flew-grow-0 flex-shrink-0 basis-auto md:w-[33.333333%]">
            <div className="mt-3">
              <div className="mb-2 flex items-center gap-1">
                <Contact className="text-primary size-6" />
                <h2 className="text-md text-slate-500">Customer Details</h2>
              </div>
              <h4 className="mb-0 font-bold">{order?.customerName}</h4>
              <h4 className="mb-0 text-xs">{order?.customerPhone}</h4>
            </div>
          </div>
          {/* col-2 */}
          <div className="flew-grow-0 flex-shrink-0 basis-auto md:w-[16.66666667%]"></div>
          {/* col-6 */}
          <div className="flew-grow-0 flex-shrink-0 basis-auto md:w-[50%]">
            <div className="mt-3">
              <div className="mb-2 flex items-center gap-1">
                <MapPin className="text-primary size-6" />
                <h2 className="text-md text-slate-500">Delivery Address</h2>
              </div>
              <h4 className="mb-0 text-sm font-bold">
                {order?.deliveryAddress}
              </h4>
            </div>
          </div>
        </div>
        {/* order menu */}
        <div className="mt-3">
          <h4 className="mt-0 mb-2 font-bold">Order Menu</h4>
          {/* orders items */}
          {order?.orderItems &&
            order.orderItems.map((orderitem, index) => (
              <div key={orderitem.productName} className="flex item-center mb-4">
                <img
                  src={orderitem.product.imageUrl || ""}
                  className="size-10 object-contain border border-primary rounded-sm mr-3"
                  alt={orderitem.productName}
                ></img>
                <div>
                  <h4 className="text-sm font-semibold">
                    {orderitem.productName}
                  </h4>
                  <p className="mb-0 text-xs">X{orderitem.quantity}</p>
                </div>
                <h4 className="text-primary text-xl mb-0 ml-auto">
                  ₹
                  {(parseFloat(orderitem.price) * orderitem.quantity).toFixed(
                    2
                  )}
                </h4>
              </div>
            ))}
        </div>
        <hr className="border-slate-300" />
        {/* total */}
        <div className="flex items-center justify-between">
          <h4 className="mb-0 font-medium">Total</h4>
          <h4 className="font-semibold text-lg text-primary">
            ₹{order?.totalAmount}
          </h4>
        </div>
        <div className="flex justify-end gap-4 mt-3">
          {order.status === "orderin" && <Button size={"lg"}>Prepared</Button>}
          {order.status === "prepared" && (
            <Button size={"lg"}>Delivered</Button>
          )}
          {order.status !== "delivered" && (
            <Button size={"lg"} variant={"destructive"}>
              Reject
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
