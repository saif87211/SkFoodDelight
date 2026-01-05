"use client";

import React, { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import {
  ShoppingCart,
  DollarSign,
  Package,
  Activity,
  Clock,
  TrendingUp,
  TrendingDown,
  Utensils,
  RefreshCw,
} from "lucide-react";

// --- TYPES ---
interface KPI {
  todayRevenue: string;
  todayCount: string;
  prevRevenue: string;
  prevCount: string;
}

interface ChartRow {
  date: string;
  revenue: string;
  count: string;
}

interface Breakdown {
  name: string;
  value: number;
}

interface PopularItem {
  name: string;
  units: number;
}

interface DashboardData {
  kpis: KPI[];
  chartData: ChartRow[];
  orderBreakdown: Breakdown[];
  topItems: PopularItem[];
}

// --- CONSTANTS ---
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const STATUS_COLORS = {
  delivered: "#06b6d4",
  pending: "#60a5fa",
  canceled: "#f97316",
};

// --- HELPERS ---
const calculateGrowth = (
  current: string | number,
  previous: string | number
) => {
  const currNum = typeof current === "string" ? parseFloat(current) : current;
  const prevNum =
    typeof previous === "string" ? parseFloat(previous) : previous;
  if (prevNum === 0) return currNum > 0 ? 100 : 0;
  return parseFloat((((currNum - prevNum) / prevNum) * 100).toFixed(1));
};

const formatCurrency = (val: string | number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(val));

// --- COMPONENTS ---

export default function AdminDashBoard() {
  const queryClient = useQueryClient();

  const { data, isLoading, isError, refetch, isFetching } =
    useQuery<DashboardData>({
      queryKey: ["/api/admin-dashboard"],
    });

  // Example Mutation for the Restaurant Switch
  const toggleStatus = useMutation({
    mutationFn: async (isOpen: boolean) => {
      // await fetch('/api/admin/toggle-status', { method: 'PATCH', body: JSON.stringify({ isOpen }) });
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["/api/admin-dashboard"] }),
  });

  // Memoize data transformations to prevent unnecessary recalculations
  const processedData = useMemo(() => {
    if (!data) return null;

    const kpi = data.kpis[0];
    const revenueGrowth = calculateGrowth(kpi.todayRevenue, kpi.prevRevenue);
    const ordersGrowth = calculateGrowth(kpi.todayCount, kpi.prevCount);

    const formattedChart = data.chartData.map((stat) => ({
      day: WEEKDAYS[new Date(stat.date).getDay()],
      revenue: parseFloat(stat.revenue),
      orders: parseInt(stat.count, 10),
    }));

    return { kpi, revenueGrowth, ordersGrowth, formattedChart };
  }, [data]);

  if (isLoading) return <DashboardSkeleton />;
  if (isError || !processedData) return <ErrorMessage />;

  const { kpi, revenueGrowth, ordersGrowth, formattedChart } = processedData;

  return (
    <div className="p-4 space-y-6 min-h-screen">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        {/* Left Side: Title */}
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-800">
            Admin Insights
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground sm:hidden">
            {new Date().toLocaleDateString()}
          </p>
        </div>

        {/* Right Side: Actions & Status */}
        <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
          {/* Refresh Button - Text hides on mobile to save space */}
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-2 px-3 py-2 md:px-4 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:shadow-sm transition-all active:scale-95 disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={`text-indigo-600 ${isFetching ? "animate-spin" : ""}`}
            />
            <span className="hidden md:inline-block">
              {isFetching ? "Syncing..." : "Refresh Data"}
            </span>
          </button>

          {/* Timestamp - Compact on mobile */}
          <div className="flex items-center gap-2 text-[10px] md:text-sm text-muted-foreground bg-slate-100/50 px-3 py-2 rounded-xl border border-slate-200/50">
            <Clock className="w-3 h-3 md:w-4 md:h-4 text-slate-400" />
            <span className="whitespace-nowrap">
              <span className="hidden md:inline">Last updated: </span>
              {new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        </div>
      </header>

      {/* KPI Cards Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatusToggleCard
          onToggle={(val) => toggleStatus.mutate(val)}
          isLoading={toggleStatus.isPending}
        />

        <KPICard
          title="Revenue (Today)"
          value={formatCurrency(kpi.todayRevenue)}
          growth={revenueGrowth}
          icon={<DollarSign className="w-5 h-5 text-emerald-600" />}
          colorClass="bg-emerald-50"
        />

        <KPICard
          title="Orders (Today)"
          value={kpi.todayCount}
          growth={ordersGrowth}
          icon={<Package className="w-5 h-5 text-violet-600" />}
          colorClass="bg-violet-50"
          suffix="(completed)"
        />

        <Card className="p-4 flex flex-col justify-center border border-slate-300 shadow-sm">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Average Order
          </div>
          <div className="text-2xl font-bold">
            {formatCurrency(
              Number(kpi.todayRevenue) / (Number(kpi.todayCount) || 1)
            )}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Performance Chart */}
        <Card className="md:col-span-7 shadow-sm border border-slate-300">
          <CardHeader>
            <CardTitle className="text-lg">Performance Trends</CardTitle>
            <CardDescription>Revenue vs Volume (Last 7 Days)</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={formattedChart}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#e2e8f0"
                />
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#64748b", fontSize: 12 }}
                />
                <YAxis
                  yAxisId="left"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#06b6d4", fontSize: 12 }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#60a5fa", fontSize: 12 }}
                />
                <RTooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "none",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  }}
                />
                <Legend verticalAlign="top" height={36} />
                <Line
                  yAxisId="left"
                  name="Revenue (₹)"
                  type="monotone"
                  dataKey="revenue"
                  stroke="#06b6d4"
                  strokeWidth={3}
                  dot={{ r: 4, fill: "#06b6d4" }}
                />
                <Line
                  yAxisId="right"
                  name="Orders"
                  type="monotone"
                  dataKey="orders"
                  stroke="#60a5fa"
                  strokeWidth={3}
                  dot={{ r: 4, fill: "#60a5fa" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Order Breakdown Pie */}
        <Card className="md:col-span-5 shadow-sm border border-slate-300">
          <CardHeader>
            <CardTitle className="text-lg">Order Status</CardTitle>
            <CardDescription>Distribution over last 24h</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data?.orderBreakdown}
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {data?.orderBreakdown.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          STATUS_COLORS[
                            entry.name as keyof typeof STATUS_COLORS
                          ] || "#cbd5e1"
                        }
                      />
                    ))}
                  </Pie>
                  <RTooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full grid grid-cols-3 gap-2 mt-4">
              {data?.orderBreakdown.map((item) => (
                <div key={item.name} className="text-center">
                  <div className="text-[10px] uppercase font-bold text-muted-foreground">
                    {item.name}
                  </div>
                  <div className="text-lg font-bold">{item.value}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Popular Items */}
      <Card className="shadow-sm border border-slate-300">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Popular Menu Items</CardTitle>
            <CardDescription>Based on units sold this week</CardDescription>
          </div>
          <div className="p-2 rounded-xl bg-orange-100 text-orange-600">
            <Utensils className="w-5 h-5" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {data?.topItems.map((item, i) => (
              <div
                key={i}
                className="p-4 rounded-xl bg-white border border-slate-100 flex flex-col items-center text-center shadow-sm"
              >
                <div className="w-8 h-8 rounded-full bg-cyan-50 text-cyan-600 flex items-center justify-center mb-2 font-bold text-sm">
                  #{i + 1}
                </div>
                <div className="text-sm font-semibold">{item.name}</div>
                <div className="text-xl font-bold text-cyan-600">
                  {item.units}
                </div>
                <div className="text-[10px] text-muted-foreground uppercase font-bold">
                  Units Sold
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// --- SUB-COMPONENTS ---

function KPICard({ title, value, growth, icon, colorClass, suffix }: any) {
  const isPositive = growth >= 0;
  return (
    <Card className="p-4 hover:shadow-md transition-all border border-slate-300 shadow-sm">
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {title}
          </p>
          <div className="text-2xl font-bold flex items-baseline gap-2">
            {value}
            {suffix && (
              <span className="text-xs font-normal text-muted-foreground">
                {suffix}
              </span>
            )}
          </div>
          <div
            className={`flex items-center text-xs font-bold ${
              isPositive ? "text-emerald-600" : "text-rose-600"
            }`}
          >
            {isPositive ? (
              <TrendingUp className="w-3 h-3 mr-1" />
            ) : (
              <TrendingDown className="w-3 h-3 mr-1" />
            )}
            {Math.abs(growth)}%
            <span className="text-muted-foreground font-normal ml-1 italic">
              vs yesterday
            </span>
          </div>
        </div>
        <div className={`p-2 rounded-xl ${colorClass}`}>{icon}</div>
      </div>
    </Card>
  );
}

function StatusToggleCard({
  onToggle,
  isLoading,
}: {
  onToggle: (v: boolean) => void;
  isLoading: boolean;
}) {
  return (
    <Card
      className={`p-4 transition-all border border-slate-300 shadow-sm ${
        isLoading ? "opacity-50" : ""
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-sky-100 text-sky-600">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-bold">Kitchen Status</div>
            <div className="text-[10px] text-emerald-600 font-bold uppercase">
              Online
            </div>
          </div>
        </div>
        <Switch
          onCheckedChange={onToggle}
          className="data-[state=unchecked]:bg-slate-400 opacity-100"
          defaultChecked
          disabled={isLoading}
        />
      </div>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className="p-8 text-center space-y-4">
      <div className="h-10 w-48 bg-gray-200 rounded animate-pulse mx-auto" />
      <div className="grid grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    </div>
  );
}

function ErrorMessage() {
  return (
    <div className="h-screen flex flex-col items-center justify-center gap-4">
      <div className="p-4 bg-rose-50 text-rose-600 rounded-full">
        <Clock size={40} />
      </div>
      <h2 className="text-xl font-bold">Data Fetching Failed</h2>
      <p className="text-muted-foreground">
        Please check your connection or database status.
      </p>
    </div>
  );
}
