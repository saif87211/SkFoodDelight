import React from "react";
import { Link } from "wouter";
import { LogOut, User, UtensilsCrossed, Menu } from "lucide-react"; // Import Menu icon
import { Button } from "./ui/button";

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
        console.log("Logout");
        window.location.replace("/admin/auth");
        window.history.forward();
      }
    } catch (error) {
      alert("Logout failed");
    }
  };

  return (
    <header className="bg-white shadow-md sticky top-0 z-[100]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            {/* Hamburger Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden mr-4"
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
              <div className="text-lg md:text-2xl font-bold text-primary">
                <UtensilsCrossed className="inline mr-2" />
                SkFoodDelight
              </div>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-4">
              <Button variant="outline" size={"sm"} className="">
                Profile <User />{" "}
              </Button>
              <Button variant="outline" size={"sm"} onClick={onLogout}>
                Logout <LogOut />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
