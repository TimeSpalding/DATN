import React from 'react';
import Navbar from '../components/ui/Navbar';
import Footer from '../components/ui/Footer';
import CartDrawer from '../components/common/CartDrawer';
import { useCart } from '../contexts/CartContext';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

export default function MainLayout({ children }) {
  const { toastNotification } = useCart();

  return (
    <div className="min-h-screen flex flex-col font-sans text-slate-900 bg-white selection:bg-blue-900 selection:text-white">
      {/* Global Navbar */}
      <Navbar />

      {/* Global Slide-over Cart Drawer */}
      <CartDrawer />

      {/* Toast Notification Container */}
      {toastNotification && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce-in max-w-sm">
          <div className="bg-slate-950 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-800">
            {toastNotification.type === 'error' ? (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            ) : toastNotification.type === 'info' ? (
              <Info className="w-5 h-5 text-blue-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            )}
            <p className="text-xs font-semibold text-slate-100">{toastNotification.message}</p>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center w-full">
        {children}
      </main>

      {/* Global Footer */}
      <Footer />
    </div>
  );
}
