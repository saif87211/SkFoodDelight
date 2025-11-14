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
import { Category } from "@shared/schema";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useLocation, useParams } from "wouter";
import z from "zod";

const categoryActionSchema = z.object({
  name: z.string().min(4, "Name must be at least 4 characters"),
  description: z.string().min(4, "Provide small description"),
  isActive: z.boolean().default(false),
});

type NewCategory = Omit<Category, "id" | "createdAt" | "updatedAt">;
type CategoryActionForm = z.infer<typeof categoryActionSchema>;

export default function AdminCategoryAction() {
  const { id }: { id: string | undefined } = useParams();
  const { toast } = useToast();
  const isEdit = !!id;
  const [, setLocation] = useLocation();

  const form = useForm<CategoryActionForm>({
    resolver: zodResolver(categoryActionSchema),
    defaultValues: {
      name: "",
      description: "",
      isActive: false,
    },
  });

  const {
    data: category,
    isLoading,
    refetch,
    isStale,
  } = useQuery<Category>({
    queryKey: ["/api/categories", id],
    enabled: isEdit,
  });

  useEffect(() => {
    if (!isStale) {
      refetch();
    }
    if (category) {
      form.reset({
        name: category.name ?? "",
        description: category.description ?? "",
        isActive: !!category.isActive,
      });
    }
  }, [category]);

  const categoryActionMutation = useMutation({
    mutationFn: async (data: NewCategory) => {
      if (isEdit) {
        const response = await apiRequest(
          "PATCH",
          `/api/admin/categories/${id}`,
          data
        );
        return response.json();
      } else {
        const response = await apiRequest("POST", `/api/admin/categories`, data);
        return response.json();
      }
    },
    onSuccess: () => {
      toast({
        title: isEdit
          ? "Category Edited Successfully"
          : "Category Added successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/categories"] });
      setLocation("/admin/categories", { replace: true });
    },
    onError: (error) => {
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
    },
  });

  const onSubmit = (data: CategoryActionForm) => {
    categoryActionMutation.mutate({ imageUrl: "", slug: "", ...data });
  };

  return (
    <main className="mx-auto p-5 max-w-3xl">
      <Card className="px-4 pb-4 max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Category Information</CardTitle>
        </CardHeader>
        <CardContent className="bg-white p-4 rounded-md">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Category Name</FormLabel>
                      <FormControl>
                        <Input
                          className="border border-slate-300"
                          placeholder="Enter Category name"
                          data-testid="input-category-name"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="md:col-span-1 flex items-center gap-3">
                      <FormControl>
                        <Checkbox
                          checked={!!field.value}
                          onCheckedChange={(checked) => field.onChange(checked)}
                          className="size-6"
                          data-testid="input-category-isActive"
                        />
                      </FormControl>
                      <div>
                        <FormLabel className="mt-0 mb-3 block">Active</FormLabel>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="md:col-span-3">
                      <FormLabel>Category Description</FormLabel>
                      <FormControl>
                        <Textarea
                          className="border border-slate-300"
                          placeholder="Enter Category description"
                          rows={4}
                          data-testid="input-category-description"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  className="w-full md:w-48"
                  disabled={isLoading}
                  data-testid="button-place-order"
                >
                  {isEdit ? "Edit Category" : "Create new Category"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </main>
  );
}
