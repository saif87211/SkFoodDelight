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
      setLocation("/category", { replace: true });
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
    <main className="mx-auto p-5">
      <Card className="px-4 pb-4">
        <CardHeader>
          <CardTitle>Category Information</CardTitle>
        </CardHeader>
        <CardContent className="bg-white p-4 rounded-md">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
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
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category Description</FormLabel>
                    <FormControl>
                      <Textarea
                        className="border border-slate-300"
                        placeholder="Enter Category description"
                        rows={3}
                        data-testid="input-category-description"
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
                  <FormItem className="flex items-center gap-2">
                    <FormLabel className="mt-2">Category is Active?</FormLabel>
                    <FormControl>
                      <Checkbox
                        checked={!!field.value}
                        onCheckedChange={(checked) => field.onChange(checked)}
                        className="size-6"
                        data-testid="input-category-isActive"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
                data-testid="button-place-order"
              >
                {isEdit ? "Edit Category" : "Create new Category"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </main>
  );
}
