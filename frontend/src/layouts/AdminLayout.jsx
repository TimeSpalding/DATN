import { useState } from "react";
import { HeaderAdmin } from "../components/ui/HeaderAdmin";
import { SidebarAdmin } from "../components/ui/SidebarAdmin";

export default function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="h-screen overflow-hidden bg-[#F7F5F0] font-sans text-[#161514] selection:bg-[#C05A39] selection:text-[#FAF8F5]">
      <div className="flex h-full">
        <SidebarAdmin isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <HeaderAdmin onOpenSidebar={() => setSidebarOpen(true)} />
          <main className="flex-1 overflow-y-auto px-5 py-6 lg:px-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
