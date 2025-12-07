import AdminHeader from "@/components/layout/admin-header";
import AdminSidebar from "@/components/admin-sidebar";
import React, { ReactNode, ReactPortal, useState } from "react";
import AdminFooter from "./admin-footer";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };
  return (
    <div className="min-h-screen">
      <AdminHeader onSidebarToggle={toggleSidebar} />
      <div className="flex">
        <AdminSidebar isOpen={isSidebarOpen} onClose={toggleSidebar} />
        <main className="flex-1 p-4">{children}</main>
      </div>
      <AdminFooter />
    </div>
  );
};

export default AdminLayout;
