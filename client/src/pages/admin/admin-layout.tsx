import AdminHeader from "@/components/admin-header";
import AdminSidebar from "@/components/admin-sidebar";
import React, { ReactNode, ReactPortal, useState } from "react";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };
  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader onSidebarToggle={toggleSidebar} />

      <div className="flex">
        <AdminSidebar isOpen={isSidebarOpen} onClose={toggleSidebar} />

        <main className="flex-1 p-4">{children}</main>
      </div>
    </div>
  );
};

export default AdminLayout;
