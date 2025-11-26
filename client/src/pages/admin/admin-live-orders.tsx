import OrdersList from "@/components/order-list";
import OrderDetails from "@/components/order-details";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useQuery } from "@tanstack/react-query";
import { Order } from "@shared/schema";
import { queryClient } from "@/lib/queryClient";

export default function AdminLiveOrders() {
  const [activeTab, setActiveTab] = useState("orderin");
  const [orderid, setOrderid] = useState<string | null>(null);
  const {
    data: orders,
    isLoading,
    isError,
    refetch,
  } = useQuery<Order[]>({
    queryKey: ["/api/admin", `orders?status=${activeTab}`],
  });

  const socketRef = useRef<any>(null);

  useEffect(() => {
    refetch();
    setOrderid(null);
  }, [activeTab, refetch]);

  useEffect(() => {
    const socket = io();
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
    });

    socket.on("orderin", (newOrder: Order) => {
      queryClient.invalidateQueries({
        queryKey: ["/api/admin", `orders?status=${activeTab}`],
      });
      // queryClient.setQueryData(
      //   ["/api/admin", `orders?status=${activeTab}`],
      //   (oldData: Order[] | undefined) => {
      //     if (oldData) return [newOrder, ...oldData];
      //     else return [newOrder];
      //   }
      // );
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected");
    });

    return () => {
      socketRef.current && socketRef.current.disconnect();
    };
  }, [queryClient]);

  return (
    <main className="max-w-full px-4 py-4">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Lists (left column on lg+, top on mobile) */}
        <div className="w-full lg:w-1/3">
          <Card className="min-w-full">
            <CardContent className="p-3">
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
              >
                {/* Tabs: on small screens allow horizontal scrolling */}
                <div className="mb-3 -mx-2">
                  <TabsList className="inline-flex gap-2 px-2 w-full overflow-x-auto whitespace-nowrap">
                    <TabsTrigger
                      value="orderin"
                      data-testid="tab-orderin"
                      className="shrink-0"
                    >
                      Order In
                    </TabsTrigger>
                    <TabsTrigger
                      value="prepared"
                      data-testid="tab-prepared"
                      className="shrink-0"
                    >
                      Prepared
                    </TabsTrigger>
                    <TabsTrigger
                      value="delivered"
                      data-testid="tab-delivered"
                      className="shrink-0"
                    >
                      Delivered
                    </TabsTrigger>
                  </TabsList>
                </div>

                <div className="h-[60vh] lg:h-[72vh] overflow-y-auto">
                  <TabsContent value="orderin" className="p-0">
                    <OrdersList
                      orders={orders!}
                      isError={isError}
                      isLoading={isLoading}
                      setOrderid={setOrderid}
                    />
                  </TabsContent>
                  <TabsContent value="prepared" className="p-0">
                    <OrdersList
                      orders={orders!}
                      isError={isError}
                      isLoading={isLoading}
                      setOrderid={setOrderid}
                    />
                  </TabsContent>
                  <TabsContent value="delivered" className="p-0">
                    <OrdersList
                      orders={orders!}
                      isError={isError}
                      isLoading={isLoading}
                      setOrderid={setOrderid}
                    />
                  </TabsContent>
                </div>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Details (right column on lg+, below on mobile) */}
        <div className="w-full lg:w-2/3">
          <Card className="min-w-full">
            <CardHeader className="pt-2 pb-3">
              <CardTitle className="pt-3">Order Details</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="min-h-[40vh] lg:min-h-[72vh]">
                <OrderDetails orderid={orderid} activeTab={activeTab} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
};