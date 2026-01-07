import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function AdminSeeder() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/admin/products"],
  });
  // local state to track selections and customer info
  const [selected, setSelected] = useState<
    Record<string, { quantity: number; selected?: boolean }>
  >({});
  const [date, setDate] = useState<string>("");
  const [customerName, setCustomerName] = useState<string>("");
  const [customerPhone, setCustomerPhone] = useState<string>("");
  const [customerAddress, setCustomerAddress] = useState<string>("");
  const [showPreview, setShowPreview] = useState(false);

  // initialize selected map when products arrive
  useEffect(() => {
    if (data && Object.keys(selected).length === 0) {
      const initial: Record<string, { quantity: number; selected?: boolean }> =
        {};
      (data as any[]).forEach(
        (p) => (initial[p.id] = { quantity: 1, selected: false })
      );
      setSelected(initial);
    }
  }, [data]);

  const totalFor = (product: any) => {
    const qty = selected[product.id]?.quantity ?? 0;
    return Number(product.price || 0) * qty || 0;
  };

  const overallTotal = () => {
    return (data as any[])
      .filter(
        (p) =>
          selected[p.id] &&
          selected[p.id].quantity > 0 &&
          (selected[p.id].selected ?? false)
      )
      .reduce((acc, p) => acc + totalFor(p), 0);
  };

  const toggleSelect = (id: string) => {
    setSelected((s) => ({
      ...s,
      [id]: { quantity: s[id]?.quantity ?? 1, selected: !s[id]?.selected },
    }));
  };

  const setQuantity = (id: string, qty: number) => {
    setSelected((s) => ({
      ...s,
      [id]: {
        ...(s[id] ?? { quantity: 1 }),
        quantity: Math.max(1, qty),
        selected: !!s[id]?.selected,
      },
    }));
  };

  const randomCustomer = () => {
    const names = [
      "John Doe",
      "Jane Smith",
      "Alice Cooper",
      "Bob Marley",
      "Charlie Day",
    ];
    const phones = [
      "9876543210",
      "9123456789",
      "9988776655",
      "9012345678",
      "8899776655",
    ];
    const addresses = [
      "123 Main St",
      "456 Oak Avenue",
      "789 Pine Rd",
      "Apartment 5B",
      "No 22, Baker St",
    ];
    setCustomerName(names[Math.floor(Math.random() * names.length)]);
    setCustomerPhone(phones[Math.floor(Math.random() * phones.length)]);
    setCustomerAddress(addresses[Math.floor(Math.random() * addresses.length)]);
  };

  const randomizeProducts = () => {
    const items = data as any[];
    if (!items || items.length === 0) return;
    const pickCount = Math.max(
      1,
      Math.floor(Math.random() * Math.min(5, items.length))
    );
    const picked: Record<string, { quantity: number; selected?: boolean }> = {
      ...selected,
    };
    // reset previous selections
    Object.keys(picked).forEach((k) => (picked[k].selected = false));
    for (let i = 0; i < pickCount; i++) {
      const p = items[Math.floor(Math.random() * items.length)];
      picked[p.id] = {
        quantity: Math.max(1, Math.floor(Math.random() * 5) + 1),
        selected: true,
      };
    }
    setSelected(picked);
  };

  const randomizeAll = () => {
    randomCustomer();
    randomizeProducts();
    setDate(new Date().toISOString().slice(0, 10));
  };

  const selectedItems = (data as any[])
    ?.filter((p) => selected[p.id] && selected[p.id].selected)
    .map((p) => ({
      productId: p.id,
      quantity: selected[p.id].quantity,
    }));

  const seedMutation = useMutation({
    mutationFn: async (payload: any) => {
      return await apiRequest("POST", "/api/admin/seed-order", payload);
    },
    onSuccess: (res: any) => {
      // queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      alert(res?.message || "Orders seeded successfully");
      resetForm();
    },
    onError: (e: any) => {
      alert("Failed to seed orders");
      console.error(e);
    },
  });

  const handleSubmit = () => {
    const selectedItems = (data as any[])
      .filter((p) => selected[p.id] && selected[p.id].selected)
      .map((p) => ({
        price: p.price,
        productId: p.id,
        quantity: selected[p.id].quantity,
        productName: p.name,
      }));

    if (selectedItems.length === 0) {
      alert("Select at least one product");
      return;
    }

    const payload = {
      createdAt: date,
      customerName,
      customerPhone,
      deliveryAddress: customerAddress,
      items: selectedItems,
      totalAmount: overallTotal(),
    };

    seedMutation.mutate(payload);
  };
  const resetForm = () => {
    setSelected({});
    setCustomerName("");
    setCustomerPhone("");
    setCustomerAddress("");
    setDate("");
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center flex-row gap-2">
        <div className="w-4 h-4 rounded-full bg-blue-700 animate-bounce"></div>
        <div className="w-4 h-4 rounded-full bg-blue-700 animate-bounce [animation-delay:-.3s]"></div>
        <div className="w-4 h-4 rounded-full bg-blue-700 animate-bounce [animation-delay:-.5s]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8 bg-white shadow-lg rounded-lg max-w-sm w-full">
        <h1 className="text-9xl font-extrabold text-red-600 mb-4">Error</h1>
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          Need to be fixed......
        </h2>
      </div>
    );
  }
  return (
    <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
      <h2 className="text-base md:text-2xl font-bold text-dark mb-3">
        Admin Seeder
      </h2>
      <Card>
        <CardHeader>
          <CardTitle>Order Data</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-gray-700">
                  Select date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="mt-2 border border-slate-300 rounded px-3 py-2 w-full"
                />
              </div>

              <div className="md:col-span-2 grid grid-cols-1 gap-3">
                <div className="flex gap-2">
                  <input
                    className="border rounded px-2 py-1 flex-1"
                    placeholder="Customer name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                  <input
                    className="border rounded px-2 py-1 w-40"
                    placeholder="Phone"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <input
                    className="border rounded px-2 py-1 flex-1"
                    placeholder="Address"
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                  />
                  <button
                    type="button"
                    className="px-3 py-1 bg-gray-100 rounded"
                    onClick={randomCustomer}
                  >
                    Generate Random Customer
                  </button>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="px-3 py-1 bg-gray-100 rounded"
                    onClick={randomizeProducts}
                  >
                    Random Products
                  </button>
                  <button
                    type="button"
                    className="px-3 py-1 bg-gray-100 rounded"
                    onClick={randomizeAll}
                  >
                    Randomize All
                  </button>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Products</h3>
              <div className="space-y-2 max-h-64 overflow-auto">
                {(data as any[]).map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between border rounded p-2"
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={!!selected[p.id]?.selected}
                        onChange={() => toggleSelect(p.id)}
                      />
                      <div>
                        <div className="font-medium">{p.name}</div>
                        <div className="text-sm text-gray-500">₹{p.price}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        min={1}
                        value={selected[p.id]?.quantity ?? 1}
                        onChange={(e) =>
                          setQuantity(p.id, Number(e.target.value))
                        }
                        className="w-20 border rounded px-2 py-1"
                      />
                      <div className="font-semibold">
                        ₹{totalFor(p).toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <div className="text-lg font-semibold">
                  Total: ₹{overallTotal().toFixed(2)}
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    className="px-4 py-2 bg-red-100 rounded"
                    onClick={resetForm}
                  >
                    Reset
                  </button>
                  <button
                    type="button"
                    className="px-4 py-2 bg-green-600 text-white rounded"
                    onClick={handleSubmit}
                    disabled={seedMutation.status === "pending"}
                  >
                    {seedMutation.status === "pending"
                      ? "Seeding..."
                      : "Create Orders"}
                  </button>
                  <button
                    type="button"
                    className="px-3 py-1 bg-gray-200 rounded"
                    onClick={() => setShowPreview((s) => !s)}
                  >
                    {showPreview ? "Hide Preview" : "Preview Payload"}
                  </button>
                </div>
              </div>

              {showPreview && (
                <div className="bg-gray-50 border rounded p-3">
                  <h4 className="font-medium mb-2">Payload Preview</h4>
                  <div className="mb-2 text-sm text-gray-700">
                    <div>
                      <strong>Date:</strong> {date || "—"}
                    </div>
                    <div>
                      <strong>Customer:</strong> {customerName || "—"} —{" "}
                      {customerPhone || "—"}
                    </div>
                    <div>
                      <strong>Address:</strong> {customerAddress || "—"}
                    </div>
                  </div>
                  <div className="overflow-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left">
                          <th className="pb-2">Product</th>
                          <th className="pb-2">Price</th>
                          <th className="pb-2">Qty</th>
                          <th className="pb-2">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedItems.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="py-2">
                              No items selected
                            </td>
                          </tr>
                        ) : (
                          selectedItems.map((it) => {
                            const p = (data as any[]).find(
                              (x) => x.id === it.productId
                            );
                            return (
                              <tr key={it.productId}>
                                <td className="py-1">{p?.name}</td>
                                <td className="py-1">₹{p?.price}</td>
                                <td className="py-1">{it.quantity}</td>
                                <td className="py-1">
                                  ₹
                                  {(
                                    Number(p?.price || 0) * it.quantity
                                  ).toFixed(2)}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colSpan={3} className="pt-2 font-semibold">
                            Overall
                          </td>
                          <td className="pt-2 font-semibold">
                            ₹{overallTotal().toFixed(2)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
