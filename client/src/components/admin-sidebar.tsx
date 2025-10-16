import React from "react";
import { Link, useLocation } from "wouter";
import { X, House, List, Box, UtensilsCrossed } from "lucide-react";
import { Button } from "@/components/ui/button";

const adminLinks = [
  { to: "/admin/dashboard", label: "Dashboard", icon: <House /> },
  { to: "/admin/category", label: "Categories", icon: <List /> },
  { to: "/admin/product", label: "Products", icon: <Box /> },
];

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const AdminSidebar = ({ isOpen, onClose }: AdminSidebarProps) => {
  const [location] = useLocation();

  return (
    <>
      {/* Backdrop for small screens */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={onClose}
          data-testid="admin-sidebar-backdrop"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-60 p-4 bg-gray-100 border-r border-gray-200 z-50 transform transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        } md:w-64 md:sticky md:top-0 md:h-screen`}
        data-testid="admin-sidebar"
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="md:hidden flex items-center justify-between border-b mb-4 border-gray-300">
            <div className="text-lg md:text-2xl font-bold text-primary">
              <UtensilsCrossed className="inline mr-2" />
              SkFoodDelight
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="md:hidden"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="overflow-y-auto">
            <ul className="space-y-2">
              {adminLinks.map((link) => (
                <li key={link.to}>
                  <Link href={link.to}>
                    <Button
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-md w-full transition-colors ${
                        location === link.to
                          ? ""
                          : "hover:bg-gray-300 text-gray-700"
                      }`}
                      variant={location === link.to ? "default" : "outline"}
                    >
                      <span>{link.icon}</span>
                      <span>{link.label}</span>
                    </Button>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;
