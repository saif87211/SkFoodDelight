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
      await apiRequest("DELETE", `/api/admin/categories/${id}`);
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

          {/* Mobile friendly list (visible on small screens) */}
          <div className="space-y-3 sm:hidden">
            {paginated.length > 0 ? (
              paginated.map((category, index) => (
                <div
                  key={category.id}
                  className="bg-white border border-slate-200 rounded-lg p-3 flex items-start justify-between"
                >
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold text-gray-800">{category.name}</div>
                      <div className="text-xs text-gray-500">#{(page - 1) * PAGE_SIZE + index + 1}</div>
                    </div>
                    <div className="text-sm text-gray-600 mt-1 line-clamp-2">{category.description}</div>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                      <div>{new Date(category.updatedAt!).toLocaleDateString()}</div>
                      <div>
                        {category.isActive ? (
                          <span className="text-green-500">Active</span>
                        ) : (
                          <span className="text-red-500">Inactive</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-center ml-3 gap-2">
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
                      onClick={() => deleteCategoryMutation.mutate(category.id)}
                    >
                      <Trash className="hover:text-white" />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-sm text-gray-500 py-6">No categories found.</div>
            )}
          </div>

          {/* Table view for larger screens */}
          <div className="hidden sm:block overflow-x-auto">
            <Table className="mb-0 min-w-full bg-white shadow-sm rounded-lg border border-slate-200">
              <TableHeader className="bg-gray-50">
                <TableRow className="">
                  <TableHead className="text-left text-sm font-semibold text-gray-700 px-4 py-3 w-16">#</TableHead>
                  <TableHead className="text-left text-sm font-semibold text-gray-700 px-4 py-3">Category</TableHead>
                  <TableHead className="text-left text-sm font-semibold text-gray-700 px-4 py-3 hidden md:table-cell">Description</TableHead>
                  <TableHead className="text-left text-sm font-semibold text-gray-700 px-4 py-3 hidden sm:table-cell">Created</TableHead>
                  <TableHead className="text-left text-sm font-semibold text-gray-700 px-4 py-3 w-24">Status</TableHead>
                  <TableHead className="text-left text-sm font-semibold text-gray-700 px-4 py-3 w-40">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody className="font-normal">
                {paginated.length > 0 &&
                  paginated.map((category, index) => (
                    <TableRow
                      key={category.id}
                      id={category.id}
                      className="odd:bg-white even:bg-slate-50 hover:bg-gray-50"
                    >
                      <TableCell className="py-3 px-4 align-top text-sm">{(page - 1) * PAGE_SIZE + index + 1}.</TableCell>
                      <TableCell className="py-3 px-4 align-top text-sm font-medium">{category.name}</TableCell>
                      <TableCell className="py-3 px-4 align-top text-sm hidden md:table-cell text-gray-600">{category.description}</TableCell>
                      <TableCell className="py-3 px-4 align-top text-sm hidden sm:table-cell text-gray-600">{new Date(category.updatedAt!).toLocaleDateString()}</TableCell>
                      <TableCell className="py-3 px-4 align-top text-sm">{category.isActive ? (<span className="text-green-600 font-medium">Active</span>) : (<span className="text-red-600 font-medium">Inactive</span>)}</TableCell>
                      <TableCell className="py-3 px-4 align-top text-sm">
                        <div className="flex items-center justify-end gap-2">
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
                            onClick={() => deleteCategoryMutation.mutate(category.id)}
                          >
                            <Trash className="hover:text-white" />
                          </Button>
                        </div>
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
          </div>
        </CardContent>
      </Card>
    </main>
  );
}