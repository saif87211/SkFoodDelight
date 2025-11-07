import OrdersList from "@/components/order-list";
import OrderDetails from "@/components/order-details";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import React, { useState } from "react";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("orderin");
  const [orderid, setOrderid] = useState<string | null>(null);

  return (
    <main className="max-w-full px-4 space-x-[auto]">
      <div className="xl:flex xl:flex-wrap">
        {/* Lists */}
        <div className="xl:flex-grow-0 xl:flex-shrink-0 xl:basis-auto xl:w-1/3 max-w-full">
          <Card className="min-w-full">
            <CardContent className="p-4">
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="orderin" data-testid="tab-orderin">
                    Order In
                  </TabsTrigger>
                  <TabsTrigger value="prepared" data-testid="tab-prepared">
                    Prepared
                  </TabsTrigger>
                  <TabsTrigger value="delivered" data-testid="tab-delivered">
                    Delivered
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="orderin">
                  <OrdersList listtype={activeTab} setOrderid={setOrderid} />
                </TabsContent>
                <TabsContent value="prepared">
                  <OrdersList listtype={activeTab} setOrderid={setOrderid} />
                </TabsContent>
                <TabsContent value="delivered">
                  <OrdersList listtype={activeTab} setOrderid={setOrderid} />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
        {/* Details */}
        <div className="xl:flex-grow-0 xl:flex-shrink-0 xl:basis-auto xl:w-2/3 max-w-full">
          <Card className="border-none bg-inerit shadow-none">
            <CardHeader className="pt-0 pb-3 mt-5 sm:mt-5">
              <CardTitle>Order Details</CardTitle>
            </CardHeader>
            <CardContent className="">
              <OrderDetails orderid={orderid} />
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
};

export default AdminDashboard;
