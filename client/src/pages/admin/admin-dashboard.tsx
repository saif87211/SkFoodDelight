"use client";
import React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Legend,
  Bar,
} from "recharts";
// @ts-ignore TS7016: Could not find a declaration file for module 'lucide-react'.
import { ShoppingCart, DollarSign, Package, Activity } from "lucide-react";

const revenueData = [
  { day: "Mon", revenue: 120, orders: 8 },
  { day: "Tue", revenue: 220, orders: 14 },
  { day: "Wed", revenue: 150, orders: 10 },
  { day: "Thu", revenue: 260, orders: 18 },
  { day: "Fri", revenue: 200, orders: 12 },
  { day: "Sat", revenue: 320, orders: 22 },
  { day: "Sun", revenue: 280, orders: 20 },
];

const pieData = [
  { name: "Delivered", value: 60 },
  { name: "Pending", value: 25 },
  { name: "Canceled", value: 15 },
];

const COLORS = ["#06b6d4", "#60a5fa", "#f97316"];

const totalValue = pieData.reduce((sum, entry) => sum + entry.value, 0);

const topItems = [
  { name: "Margherita Pizza", units: 124 },
  { name: "Veggie Burger", units: 98 },
  { name: "Chocolate Donut", units: 76 },
  { name: "Caesar Salad", units: 58 },
  { name: "Lemonade", units: 500 },
];

const renderCustomBarLabel = ({ x, y, width, value }: any) => {
  const BAR_THRESHOLD = 100;
  let xPos, yPos, fill, textAnchor;
  if (width < BAR_THRESHOLD) {
    xPos = x + width + 5;
    yPos = y + 10;
    fill = "#6b7280";
    textAnchor = "start";
  } else {
    xPos = x + width - 5;
    yPos = y + 10;
    fill = "#ffffff";
    textAnchor = "end";
  }

  return (
    <text x={xPos} y={yPos} fill={fill} dy={15} textAnchor={textAnchor}>
      {value}
    </text>
  );
};

// Render labels inside pie slices. Uses payload.name and percent to place text.
const renderPieLabelInside = (props: any) => {
  const {
    cx,
    cy,
    innerRadius,
    outerRadius,
    percent,
    midAngle,
    index,
    payload,
  } = props;
  const RAD = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) / 2;
  const x = cx + radius * Math.cos(-midAngle * RAD);
  const y = cy + radius * Math.sin(-midAngle * RAD);

  // show white text for larger slices for contrast, dark for small slices
  const percentText = `${Math.round(percent * 100)}%`;

  return (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      dominantBaseline="central"
      fill="white"
      style={{ pointerEvents: "none", fontSize: 15 }}
    >
      <tspan x={x} y={y}>
        {percentText}
      </tspan>
    </text>
  );
};

export default function AdminDashBoard() {
  return (
    <div className="space-y-4">
      {/* Top stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="flex items-center justify-between p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-sky-50 text-sky-600">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-medium">Restaurant Online</div>
              <div className="text-xs text-muted-foreground">
                Accepting orders
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch className="border border-slate-200" defaultChecked />
          </div>
        </Card>

        <Card className="p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Live / Pending orders</div>
              <div className="text-2xl font-bold">5</div>
            </div>
            <div className="p-2 rounded-md bg-rose-50 text-rose-600">
              <ShoppingCart className="w-6 h-6" />
            </div>
          </div>
        </Card>

        <Card className="p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Total Revenue (Today)</div>
              <div className="text-2xl font-bold">
                $1,240 <span className="text-sm text-success">(↑ 5.4%)</span>
              </div>
            </div>
            <div className="p-2 rounded-md bg-emerald-50 text-emerald-600">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
        </Card>

        <Card className="p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Total Orders (Today)</div>
              <div className="text-2xl font-bold">
                2
                <span className="text-xs text-muted-foreground">
                  (completed)
                </span>
              </div>
            </div>
            <div className="p-2 rounded-md bg-violet-50 text-violet-600">
              <Package className="w-6 h-6" />
            </div>
          </div>
        </Card>
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-8">
          <Card className="h-full hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle>Revenue vs. Order Count</CardTitle>
              <CardDescription>Last 7 days performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={revenueData}
                    margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <RTooltip />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#06b6d4"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="orders"
                      stroke="#60a5fa"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-4">
          <Card className="h-full hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle>Orders Breakdown (24h)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center">
                <div className="w-full relative">
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={50}
                        outerRadius={100}
                        paddingAngle={2}
                        label={renderPieLabelInside}
                        labelLine={false}
                      >
                        {pieData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <RTooltip />
                    </PieChart>
                  </ResponsiveContainer>

                  {/* Legend / color indicator */}
                  <div className="flex items-center justify-center gap-4">
                    {pieData.map((p, i) => (
                      <div
                        key={`legend-${i}`}
                        className="flex items-center gap-2 text-sm"
                      >
                        <span
                          className="inline-block w-3 h-3 rounded-full"
                          style={{ backgroundColor: COLORS[i % COLORS.length] }}
                        />
                        <span className="text-muted-foreground">{p.name}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-1 text-center text-sm">
                    Total Orders: {totalValue}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Lower row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle>Top 5 Most Popular Items</CardTitle>
            <CardDescription>
              Item name and units sold in the last 7 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80 flex items-center justify-center">
              <ResponsiveContainer width="100%" height={320}>
                <BarChart
                  // Width and height might need adjustment based on new orientation
                  width={600}
                  height={400}
                  data={topItems}
                  layout="vertical"
                  barGap={500}
                  // margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />

                  {/* 1. X-Axis is now the VALUE AXIS (Units Sold) */}
                  <XAxis
                    type="number" // Must be 'number' for the value axis
                    stroke="#6b7280"
                    fontSize={12}
                  />
                  {/* 2. Y-Axis is now the CATEGORY AXIS (Product Name) */}
                  <YAxis
                    className="text-wrap"
                    dataKey="name"
                    type="category"
                    stroke="#6b7280"
                    fontSize={15}
                    width={90}
                  />

                  <RTooltip
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "6px",
                      padding: "8px 12px",
                    }}
                    formatter={(value) => [`${value} units`, "Sales"]}
                    labelFormatter={(label) => `${label}`}
                  />

                  <Legend
                    wrapperStyle={{ paddingTop: "20px" }}
                    formatter={() => "Units Sold"}
                  />

                  <Bar
                    dataKey="units"
                    fill="#06b6d4"
                    radius={[0, 4, 4, 0]}
                    // Bar size might need adjustment for vertical layout
                    label={renderCustomBarLabel}
                    // barSize={50}
                    isAnimationActive={true}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="min-h-[220px] flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            No idea what to show here — add widgets as needed
          </div>
        </Card>
      </div>
    </div>
  );
}
