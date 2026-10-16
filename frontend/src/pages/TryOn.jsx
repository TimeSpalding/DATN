import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Clock, Trash2, ArrowRight } from 'lucide-react';
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
      showToast('Đã xóa phiên thử đồ khỏi nhật ký', 'info');
    } catch {
      showToast('Không thể xóa phiên thử đồ', 'error');
    }
  };

  return (
    <div className="w-full flex flex-col items-center pt-6 pb-20 bg-[#FAF8F5]">
      
      {/* 1. Fitting Studio Master Stage */}
      <FittingStudio initialGarment={activeGarment} />

      {/* 2. History Drawer Trigger */}
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
        <div className="flex items-center justify-between border-t border-[#E5E0D8] pt-8">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#8C8476]" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#161514]">
              NHẬT KÝ CÁC PHIÊN ƯỚM THỬ TƯ GIA
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowHistory(!showHistory)}
            className="px-4 py-2 text-[10.5px] font-medium tracking-wider uppercase border border-[#161514] text-[#161514] hover:bg-[#161514] hover:text-[#FAF8F5] transition-all cursor-pointer"
          >
            {showHistory ? 'Thu gọn nhật ký' : 'Mở nhật ký thử đồ'}
          </button>
        </div>

        {/* History Accordion Body */}
        {showHistory && (
          <div className="mt-6 p-6 bg-[#F7F5F0] border border-[#E5E0D8]">
            {loadingHistory ? (
              <p className="text-xs text-[#8C8476] text-center py-6">Đang tải nhật ký...</p>
            ) : historyItems.length === 0 ? (
              <p className="text-xs text-[#8C8476] text-center py-6">Chưa có phiên ướm thử nào được lưu trong kho dữ liệu.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                {historyItems.map((item) => (
                  <div
                    key={item.id}
                    className="relative group bg-[#FAF8F5] border border-[#E5E0D8]"
                  >
                    <div className="aspect-[3/4] bg-[#F3EFE6] overflow-hidden">
                      <img
                        src={item.resultImageUrl}
                        alt="Phiên thử đồ"
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="p-3 flex items-center justify-between text-[10px] tracking-wider text-[#8C8476] uppercase">
                      <span>{new Date(item.createdAt).toLocaleDateString('vi-VN')}</span>
                      <button
                        type="button"
                        onClick={() => handleDeleteRecord(item.id)}
                        className="p-1 text-[#8C8476] hover:text-[#C05A39] transition-colors"
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

      {/* 3. Quick Curated Garment Tray to Pick More Outfits */}
      <GarmentCatalog
        selectedGarmentId={activeGarment?.id}
        onSelectGarment={(garment) => {
          setActiveGarment(garment);
          const studioEl = document.getElementById('studio');
          if (studioEl) studioEl.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      {/* 4. Atelier Pillars */}
      <StudioBenefits />
    </div>
  );
}
