import { type Order } from "@shared/schema";
import { Button } from "./ui/button";
// @ts-ignore TS7016: Could not find a declaration file for module 'lucide-react'.
import { ChevronRight, ListTodo } from "lucide-react";
import { Badge } from "./ui/badge";
import { queryClient } from "@/lib/queryClient";

const OrdersList = ({
  orders,
  isLoading,
  isError,
  setOrderid,
}: {
  orders: Order[];
  isLoading: Boolean;
  isError: Boolean;
  setOrderid: (orderid: string) => void;
}) => {
  if (isLoading) {
    return [...Array(8)].map((_, index) => (
      <div
        key={index}
        className="flex justify-between items-center border border-slate-300 rounded-lg py-5 px-6 mb-3 mr-3"
      >
        <div className="animate-pulse">
          <div className="h-7 w-56 bg-gray-200 rounded-sm dark:bg-gray-800 mb-2"></div>
          <div className="h-3 w-48 bg-gray-200 rounded-sm dark:bg-gray-800 mb-1"></div>
          <div className="h-3 w-48 bg-gray-200 rounded-sm dark:bg-gray-800 mb-1"></div>
        </div>
      </div>
    ));
  }
  if (isError) {
    return <div>Error....</div>;
  }

  return (
    <div className="flex flex-col mt-2 gap-y-4 break-words pr-3">
      {orders?.length !== 0 &&
        orders?.map((order) => (
          <div
            key={order.id}
            className="relative flex justify-between items-center border border-slate-300 hover:border-primary hover:bg-[#f8b6021a] rounded-lg py-5 px-6"
          >
            {!order.acknowledgedAt && order.status === "orderin" && (
              <span className="flex absolute top-4 end-4 size-3 -mt-1.5 -me-1.5">
                <span className="animate-ping absolute inline-flex size-full rounded-full bg-red-400 opacity-75 dark:bg-red-600"></span>
                <span className="relative inline-flex rounded-full size-3 bg-orange-500"></span>
              </span>
            )}
            <div>
              <h4 className="text-xs md:text-sm xl:text-base font-bold text-slate-800">
                Order #{order?.id.slice(-8).toUpperCase()}
              </h4>
              <span className="block text-xs text-slate-600">
                {new Date(order.createdAt!!).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </span>
              <span className="block text-xs text-slate-600">
                {new Date(order.createdAt!!).toLocaleTimeString()}
              </span>
            </div>
            <div className="flex items-center">
              <h4 className="text-primary text-md mb-0">
                ₹{order.totalAmount}
              </h4>
              <Button
                variant="default"
                className="ml-1"
                onClick={() => {
                  setOrderid(order.id);
                }}
              >
                <ChevronRight />
              </Button>
            </div>
          </div>
        ))}
      {orders?.length === 0 && (
        <div className="flex flex-col items-center justify-center my-20">
          <ListTodo className="w-12 h-12 text-primary" />
          <h4 className="text-slate-600">No orders.</h4>
        </div>
      )}
    </div>
  );
};

export default OrdersList;
