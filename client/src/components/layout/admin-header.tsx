import React from "react";
import { Link } from "wouter";
import { LogOut, User, UtensilsCrossed, Menu } from "lucide-react"; // Import Menu icon
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "../ui/dropdown-menu";

interface AdminHeaderProps {
  onSidebarToggle: () => void;
}

const AdminHeader = ({ onSidebarToggle }: AdminHeaderProps) => {
  const onLogout = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers: Record<string, string> = {};

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      const response = await fetch("/api/admin/logout", {
        method: "POST",
        headers,
      });
      if (response.ok) {
        localStorage.clear();
        window.location.replace("/admin/auth");
        window.location.replace("/");
        window.history.forward();
      }
    } catch (error) {
      alert("Logout failed");
    }
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-[100] border-b border-slate-200 pb-1">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            {/* Hamburger Menu Button - visible on small screens */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden mr-3"
              onClick={onSidebarToggle}
              data-testid="button-toggle-sidebar"
            >
              <Menu className="h-5 w-5" />
            </Button>

            <Link
              href="/admin/dashboard"
              className="flex items-center space-x-2"
              data-testid="link-home"
            >
              <div className="text-lg md:text-2xl font-bold text-primary flex items-center">
                <UtensilsCrossed className="inline mr-2" />
                <span className="hidden sm:inline">SkFoodDelight</span>
              </div>
            </Link>
          </div>

          <div className="flex items-center space-x-3">
            {/* Desktop: show labeled buttons */}
            <div className="hidden md:flex items-center space-x-3">
              <Button variant="outline" size={"sm"} className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Profile
              </Button>
              <Button variant="outline" size={"sm"} onClick={onLogout} className="flex items-center gap-2">
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>

            {/* Mobile: dropdown menu with profile/logout */}
            <div className="md:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Open menu">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent sideOffset={8} className="w-40">
                  <DropdownMenuItem asChild>
                    <Link href="/admin/profile">Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={onLogout}>Logout</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
