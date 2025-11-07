import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { zodResolver } from "@hookform/resolvers/zod";
import { Category, Product } from "@shared/schema";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useLocation, useParams } from "wouter";
import z from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectValue,
  SelectTrigger,
} from "@/components/ui/select";

const productSchema = z.object({
  name: z.string().min(4, "Name must be at least 4 characters"),
  description: z.string().min(4, "Provide small description"),
  price: z.string().min(1, "Price must be at least 1"),
  preparationTime: z.string().min(1, "Preparation time must be at least 1"),
  rating: z.string().min(1).max(5, "Rating must be between 1 and 5"),
  isAvailable: z.boolean().default(false),
  totalRatings: z.string().min(0, "Total ratings cannot be negative"),
  categoryId: z.string().min(1, "Category is required"),
});

type NewProduct = Omit<Product, "id" | "createdAt" | "updatedAt">;
type ProductActionForm = z.infer<typeof productSchema>;

export default function AdminProductAction() {
  const params = useParams();
  const id = (params as any).id as string | undefined;
  const isEdit = !!id;
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const form = useForm<ProductActionForm>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      price: "0",
      preparationTime: "0",
      rating: "0",
      isAvailable: false,
      totalRatings: "0",
      categoryId: "",
    },
  });

  // Fetch product only when id exists
  const {
    data: product,
    isLoading,
    refetch,
    isStale,
  } = useQuery<Product>({
    queryKey: ["/api/products", id],
    enabled: isEdit,
  });

  // Image preview state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/admin/categories"],
  });

  // When product is loaded (edit mode) populate form & preview
  useEffect(() => {
    if (!isStale) {
      refetch();
    }
    if (product) {
      form.reset({
        name: product.name ?? "",
        description: product.description ?? "",
        price: String(product.price ?? "0"),
        preparationTime: String(product.preparationTime ?? "0"),
        rating: String(product.rating ?? "0"),
        isAvailable: !!product.isAvailable,
        totalRatings: String(product.totalRatings ?? "0"),
        categoryId: product.categoryId ?? "",
      });
      setPreviewUrl(product.imageUrl ?? null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product]);

  // create object URL for selected file and cleanup
  useEffect(() => {
    if (!selectedFile) return;
    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [selectedFile]);

  const productMutation = useMutation({
    mutationFn: async (payload: { formValues: NewProduct; file?: File }) => {
      const { formValues, file } = payload;

      // If there is a file, send FormData (multipart)
      if (file) {
        const fd = new FormData();
        fd.append("image", file);
        // append the rest as strings
        Object.entries(formValues).forEach(([k, v]) =>
          fd.append(k, String((v as unknown) ?? ""))
        );

        const method = isEdit ? "PATCH" : "POST";
        const url = isEdit ? `/api/products/${id}` : `/api/products`;

        const res = await fetch(url, {
          method,
          body: fd,
        });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || "Failed to save product");
        }
        return res.json();
      }

      // No file — send JSON using existing apiRequest helper
      if (isEdit) {
        const response = await apiRequest(
          "PATCH",
          `/api/products/${id}`,
          formValues
        );
        return response.json();
      } else {
        const response = await apiRequest("POST", `/api/products`, formValues);
        return response.json();
      }
    },
    onSuccess: () => {
      toast({
        title: isEdit ? "Product updated" : "Product created",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/products"] });
      // redirect back to product list
      setLocation("/products", { replace: true });
    },
    onError: (error: any) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error?.message ?? "Failed to save product",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ProductActionForm) => {
    const payload: NewProduct = {
      name: data.name,
      description: data.description,
      price: String(data.price),
      preparationTime: Number.parseFloat(data.preparationTime),
      rating: data.rating,
      isAvailable: data.isAvailable,
      totalRatings: Number.parseFloat(data.totalRatings),
      imageUrl: previewUrl ?? "",
      categoryId: data.categoryId,
    };
    productMutation.mutate({
      formValues: payload,
      file: selectedFile ?? undefined,
    });
  };

  return (
    <main className="mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Card className="px-4 pb-4 max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>{isEdit ? "Edit Product" : "Create Product"}</CardTitle>
        </CardHeader>
        <CardContent className="bg-white p-4 rounded-md">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter product name"
                          className="border border-slate-300"
                          data-testid="input-product-name"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Price"
                          pattern="^\d+(\.\d+)?$"
                          step="0.1"
                          min="0"
                          className="border border-slate-300"
                          data-testid="input-product-price"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="preparationTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preparation Time (mins)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Preparation time"
                          className="border border-slate-300"
                          data-testid="input-product-prep"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="rating"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rating</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          min={0}
                          max={5}
                          placeholder="Rating"
                          className="border border-slate-300"
                          data-testid="input-product-rating"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={(val) => field.onChange(val)}
                          value={field.value}
                        >
                          <SelectTrigger className="border border-slate-300">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem value={category.id} key={category.id}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="totalRatings"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Ratings</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Total Ratings"
                          className="border border-slate-300"
                          data-testid="input-product-totalRatings"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter product description"
                        rows={4}
                        className="border border-slate-300"
                        data-testid="input-product-description"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                <div className="w-full md:w-1/2">
                  <FormField
                    control={form.control}
                    name="isAvailable"
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-2">
                        <FormControl>
                          <Checkbox
                            checked={!!field.value}
                            onCheckedChange={(checked) =>
                              field.onChange(checked)
                            }
                            className="size-6"
                            data-testid="input-product-available"
                          />
                        </FormControl>
                        <FormLabel className="mt-0">Available?</FormLabel>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Image upload & preview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                <div>
                  <FormLabel>Product Image</FormLabel>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const f = e.target.files?.[0] ?? null;
                      setSelectedFile(f);
                    }}
                    className="block w-full text-sm text-slate-700 mt-2"
                    data-testid="input-product-image"
                  />
                </div>

                <div className="flex items-center justify-center p-2 border border-slate-200 rounded-md bg-slate-50">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="max-h-48 w-auto object-contain"
                    />
                  ) : (
                    <div className="text-sm text-slate-500">
                      No image selected
                    </div>
                  )}
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
                data-testid="button-save-product"
              >
                {isEdit ? "Update Product" : "Create Product"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </main>
  );
}
