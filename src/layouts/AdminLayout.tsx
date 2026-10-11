import { Outlet, Link, useLocation } from "react-router";

import { 
  LayoutDashboard, 
  Calendar, 
  Briefcase, 
  Users, 
  Settings, 
  LogOut,
  Code2,
  Inbox,
  Menu,
  X
} from "lucide-react";
import { useEffect, useState } from "react";

export function AdminLayout() {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const menuItems = [
    { name: "Dashboard", path: "/admin", icon: LayoutDashboard },
    { name: "Etkinlikler", path: "/admin/etkinlikler", icon: Calendar },
    { name: "Projeler", path: "/admin/projeler", icon: Briefcase },
    { name: "Başvurular", path: "/admin/basvurular", icon: Inbox },
    { name: "Ekip Yönetimi", path: "/admin/ekip", icon: Users },
    { name: "Geliştiriciler", path: "/admin/gelistiriciler", icon: Code2 },
    { name: "Ayarlar", path: "/admin/ayarlar", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-page flex transition-colors duration-300 relative overflow-x-hidden">
      {/* Mobile Backdrop Overlay */}
      {isMobileMenuOpen && (
        <div 
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static top-0 bottom-0 left-0 z-50 w-64 bg-surface border-r border-default flex flex-col transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full lg:translate-x-0"}
      `}>
        {/* Brand */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-default relative overflow-hidden">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 flex items-center justify-center text-[var(--brand-primary)]">
              <Code2 className="w-6 h-6" />
            </div>
            <span className="font-bold tracking-tighter text-[var(--brand-primary)] text-sm font-mono">root@ygk:~#</span>
          </div>
          {/* Close button on mobile */}
          <button 
            onClick={() => setIsMobileMenuOpen(false)}
            className="lg:hidden p-2 text-muted hover:text-primary rounded-lg transition-colors cursor-pointer"
            title="Kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-4 flex flex-col gap-2 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-md font-medium transition-all text-sm ${
                  isActive 
                    ? "bg-page text-[var(--brand-primary)] border-l-2 border-[var(--brand-primary)]" 
                    : "text-muted hover:bg-page hover:text-primary border-l-2 border-transparent"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'opacity-100' : 'opacity-70'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-default flex flex-col gap-2">
          <Link
            to="/"
            className="flex items-center gap-3 px-4 py-3 rounded-md font-medium text-muted hover:bg-page hover:text-[var(--color-danger)] transition-all text-sm"
          >
            <LogOut className="w-4 h-4" />
            <span className="opacity-90 font-mono">exit()</span>
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 w-full">
        {/* Topbar */}
        <header className="h-20 bg-surface border-b border-default px-4 sm:px-8 flex items-center justify-between transition-colors duration-300">
          <div className="flex items-center gap-3">
            {/* Hamburger Toggle for Mobile */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2.5 text-muted hover:text-primary bg-page border border-default rounded-xl transition-colors cursor-pointer"
              title="Menüyü Aç"
            >
              <Menu className="w-5 h-5" />
            </button>

            <h1 className="text-base sm:text-lg font-bold text-primary flex items-center gap-1.5 sm:gap-2">
              <span className="text-[var(--brand-primary)] font-normal font-mono">&gt; ./</span>
              <span className="font-mono">
                {menuItems.find(i => i.path === location.pathname)?.name.toLowerCase() || "dashboard"}
              </span>
              <span className="w-2 h-4 bg-[var(--brand-primary)] animate-pulse inline-block opacity-70 ml-1"></span>
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 pl-4">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-bold text-[var(--brand-primary)] font-mono">root_user</div>
                <div className="text-[10px] text-muted font-mono">UID: 0</div>
              </div>
              <div className="w-9 h-9 rounded-md bg-page border border-default text-[var(--brand-primary)] flex items-center justify-center font-bold text-sm font-mono">
                #
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto bg-page p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
