import React from "react";
import { Link, useLocation } from "wouter";
import {
  X,
  House,
  List,
  Box,
  UtensilsCrossed,
  Truck,
  LayoutGrid,
  Minus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const AdminSidebar = ({ isOpen, onClose }: AdminSidebarProps) => {
  const [location] = useLocation();
  const sidebarMenus = [
    {
      name: "Main Dashboard",
      icon: LayoutGrid,
      routes: [
        { name: "Dashboard", path: "/admin/dashboard" },
        { name: "Bills", path: "/admin/bills" },
      ],
    },
    {
      name: "Categories",
      icon: Box,
      routes: [
        { name: "Categories", path: "/admin/categories" },
        { name: "Add Category", path: "/admin/category-action" },
      ],
    },
    {
      name: "Products",
      icon: List,
      routes: [
        { name: "Products", path: "/admin/products" },
        { name: "Add Product", path: "/admin/product-action" },
      ],
    },
  ];
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
        className={`fixed top-0 left-0 h-screen w-60 p-4 bg-white border-r border-gray-200 z-50 transform transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        } md:w-64 md:sticky md:top-0`}
        data-testid="admin-sidebar"
      >
        <div className="flex flex-col h-full">
          {/* Header (mobile) */}
          <div className="md:hidden flex items-center justify-between border-b mb-4 border-gray-200">
            <div className="text-lg md:text-2xl font-bold text-orange-500 flex items-center">
              <UtensilsCrossed className="inline mr-2 text-orange-500" />
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
              <li>
                <Accordion
                  type="single"
                  collapsible
                  className="w-full mx-auto overflow-hidden"
                >
                  {sidebarMenus.map((menu) => (
                    <AccordionItem key={menu.name} value={menu.name}>
                      <AccordionTrigger className="hover:no-underline p-3 [&[data-state=open]]:bg-primary [&[data-state=open]]:text-white [&[data-state=open]>svg]:text-white text-slate-600 rounded-md">
                        <div className="inline-flex items-center justify-between w-full">
                          <div className="inline-flex items-center gap-2">
                            <menu.icon className="size-5" />
                            <span className="">{menu.name}</span>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <ul className="pl-2">
                          {menu.routes.map((route) => (
                            <li key={route.name}>
                              <Link
                                href={route.path}
                                className="flex items-center"
                              >
                                <Minus className="text-gray-400" />
                                <Button
                                  className={`w-full justify-start px-3 py-2 text-sm transition-all duration-300 ease-in-out hover:bg-transparent hover:text-primary hover:ml-4 ${
                                    location === route.path
                                      ? "font-semibold text-primary"
                                      : "text-gray-600 hover:bg-gray-50"
                                  }`}
                                  variant="ghost"
                                >
                                  <span className="ml-1">{route.name}</span>
                                </Button>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </li>
            </ul>
          </nav>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;
