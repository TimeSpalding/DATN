import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { History, Clock, Trash2, ArrowUpRight, Sparkles, AlertCircle } from 'lucide-react';
import FittingStudio from '../components/common/FittingStudio';
import GarmentCatalog from '../components/common/GarmentCatalog';
import StudioBenefits from '../components/common/StudioBenefits';
import { getTryOnHistory, deleteTryOnHistory } from '../services/tryonService';
import { useCart } from '../contexts/CartContext';

export default function TryOn() {
  const location = useLocation();
  const { showToast } = useCart();
  const initialGarment = location.state?.selectedGarment || null;

  const [activeGarment, setActiveGarment] = useState(initialGarment);
  const [historyItems, setHistoryItems] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await getTryOnHistory({ page: 0, size: 10 });
      setHistoryItems(res?.data?.results || []);
    } catch (e) {
      console.error('Failed to load history', e);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (showHistory) {
      fetchHistory();
    }
  }, [showHistory]);

  const handleDeleteRecord = async (id) => {
    try {
      await deleteTryOnHistory(id);
      setHistoryItems((prev) => prev.filter((item) => item.id !== id));
      showToast('Đã xóa phiên thử đồ khỏi lịch sử', 'info');
    } catch {
      showToast('Không thể xóa phiên thử đồ', 'error');
    }
  };

  return (
    <div className="w-full flex flex-col items-center pt-4 pb-16">
      {/* Fitting Studio Master Stage */}
      <FittingStudio initialGarment={activeGarment} />

      {/* History Drawer Trigger */}
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="flex items-center justify-between border-t border-slate-200 pt-6">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-800" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Lịch Sử Các Phiên Thử Đồ
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowHistory(!showHistory)}
            className="px-4 py-1.5 rounded-full text-xs font-semibold border border-slate-300 hover:border-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            {showHistory ? 'Thu gọn lịch sử' : 'Xem lịch sử thử đồ'}
          </button>
        </div>

        {/* History Accordion Body */}
        {showHistory && (
          <div className="mt-4 p-5 rounded-2xl bg-slate-50 border border-slate-200">
            {loadingHistory ? (
              <p className="text-xs text-slate-500 text-center py-6">Đang tải lịch sử...</p>
            ) : historyItems.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">Chưa có phiên thử đồ nào được lưu.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {historyItems.map((item) => (
                  <div
                    key={item.id}
                    className="relative group rounded-xl overflow-hidden bg-white border border-slate-200 shadow-2xs"
                  >
                    <div className="aspect-[3/4] bg-slate-100 overflow-hidden">
                      <img
                        src={item.resultImageUrl}
                        alt="Phiên thử đồ"
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="p-3 flex items-center justify-between text-[11px] text-slate-500">
                      <span>{new Date(item.createdAt).toLocaleDateString('vi-VN')}</span>
                      <button
                        type="button"
                        onClick={() => handleDeleteRecord(item.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                        title="Xóa phiên thử đồ"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quick Curated Garment Tray to Pick More Outfits */}
      <GarmentCatalog
        selectedGarmentId={activeGarment?.id}
        onSelectGarment={(garment) => {
          setActiveGarment(garment);
          const studioEl = document.getElementById('studio');
          if (studioEl) studioEl.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      {/* Store Benefits */}
      <StudioBenefits />
    </div>
  );
}
