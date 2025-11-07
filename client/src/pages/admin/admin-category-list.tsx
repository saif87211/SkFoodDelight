import { Check, Pencil, Search, Trash, X } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Category } from "@shared/schema";
import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useLocation } from "wouter";

export default function AdminCategoryList() {
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/admin/categories"],
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [, navigate] = useLocation();

  // Use a fixed page size constant (change this value to control rows per page)
  const PAGE_SIZE = 20;
  const [page, setPage] = useState(1);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    setPage(1); // reset to first page when search changes
  }, [searchQuery]);

  const filteredCategories = useMemo(
    () =>
      categories.filter(
        (category) =>
          category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          category.description
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase())
      ),
    [categories, searchQuery]
  );

  const total = filteredCategories.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Ensure current page is within bounds if totalPages changes
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredCategories.slice(start, start + PAGE_SIZE);
  }, [filteredCategories, page]);

  // Small utility to build visible page buttons with ellipsis
  const visiblePageNumbers = useMemo(() => {
    const maxButtons = 5;
    if (totalPages <= maxButtons)
      return Array.from({ length: totalPages }, (_, i) => i + 1);

    const pages = new Set<number>();
    pages.add(1);
    pages.add(totalPages);
    pages.add(page);
    pages.add(Math.max(2, page - 1));
    pages.add(Math.min(totalPages - 1, page + 1));

    const sorted = Array.from(pages).sort((a, b) => a - b);
    const result: (number | "ellipsis")[] = [];
    for (let i = 0; i < sorted.length; i++) {
      if (i > 0 && sorted[i] - sorted[i - 1] > 1) result.push("ellipsis");
      result.push(sorted[i]);
    }
    return result;
  }, [totalPages, page]);

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      // this route is penditng
      // await apiRequest("DELETE", `/api/admin/category/${id}`);
      console.log("Delete id: ", id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/categories"] });
      toast({
        title: "Category deleted sucessfully.",
        className: "bg-green-400 text-white",
      });
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

  return (
    <main className="mx-auto p-5">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>All Category</CardTitle>
            <Button onClick={() => navigate("/admin/category-action")}>
              Create Category
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search Bar */}
          <div className="mb-8" data-testid="section-search">
            <div className="relative max-w-md">
              <Input
                type="text"
                placeholder="Search for category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 border border-slate-300"
                data-testid="input-search"
              />
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            </div>
          </div>

          <Table className="mb-0 border border-slate-200">
            <TableHeader className="align-bottom border-b">
              <TableRow className="">
                <TableHead className="text-center font-semibold">
                  Sr No.
                </TableHead>
                <TableHead className="text-center font-semibold">
                  Category Name
                </TableHead>
                <TableHead className="text-center font-semibold">
                  Category Description
                </TableHead>
                <TableHead className="text-center font-semibold">
                  Date
                </TableHead>
                <TableHead className="text-center font-semibold">
                  Is Active
                </TableHead>
                <TableHead className="text-center font-semibold">
                  Options
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody className="font-light">
              {paginated.length > 0 &&
                paginated.map((category, index) => (
                  <TableRow
                    key={category.id}
                    id={category.id}
                    className="text-center"
                  >
                    <TableCell className="py-3">
                      {(page - 1) * PAGE_SIZE + index + 1}.
                    </TableCell>
                    <TableCell className="py-3">{category.name}</TableCell>
                    <TableCell className="py-3">
                      {category.description}
                    </TableCell>
                    <TableCell className="py-3">
                      {new Date(category.createdAt!).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="py-3">
                      {category.isActive ? (
                        <Check className="text-green-500" />
                      ) : (
                        <X className="text-red-500" />
                      )}
                    </TableCell>
                    <TableCell className="flex justify-center items-center gap-1 py-3">
                      <Button
                        variant="secondary"
                        size="icon"
                        className="rounded-full bg-green-500"
                        aria-label={`Edit ${category.name}`}
                        onClick={() => navigate(`/admin/category-action/${category.id}`)}
                      >
                        <Pencil className="hover:text-white" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        className="rounded-full bg-red-500"
                        aria-label={`Delete ${category.name}`}
                        onClick={() =>
                          deleteCategoryMutation.mutate(category.id)
                        }
                      >
                        <Trash className="hover:text-white" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              {paginated.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    No categories found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>

            {/* Footer row kept inside table structure to preserve layout */}
            <TableFooter>
              <TableRow>
                <TableCell colSpan={6} className="py-4">
                  <nav
                    aria-label="Pagination"
                    className="flex items-center justify-end gap-2"
                  >
                    <Button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      size="sm"
                      data-testid="btn-prev"
                    >
                      Prev
                    </Button>

                    {visiblePageNumbers.map((p, i) =>
                      p === "ellipsis" ? (
                        <span key={`e-${i}`} className="px-2">
                          …
                        </span>
                      ) : (
                        <Button
                          key={p}
                          onClick={() => setPage(p)}
                          variant={p === page ? "default" : "ghost"}
                          size="sm"
                          aria-current={p === page ? "page" : undefined}
                          data-testid={`btn-page-${p}`}
                        >
                          {p}
                        </Button>
                      )
                    )}

                    <Button
                      onClick={() =>
                        setPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={page === totalPages}
                      size="sm"
                      data-testid="btn-next"
                    >
                      Next
                    </Button>
                  </nav>
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </CardContent>
      </Card>
    </main>
  );
}