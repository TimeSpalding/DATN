import { useState, useEffect, useRef } from 'react';
import { FiX, FiZoomIn, FiZoomOut, FiMaximize } from 'react-icons/fi';
import { ImageWithFallback } from './ImageWithFallback';
import { resolveImageUrl } from '../../utils/imageUrl';

export const ImagePreviewModal = ({ imageId, imageUrl, onClose }) => {
  const [scale, setScale] = useState(1);
  const [origin, setOrigin] = useState({ x: 50, y: 50 });
  const dialogRef = useRef(null);
  const containerRef = useRef(null);

  const finalImageUrl = imageUrl || resolveImageUrl(undefined, imageId);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) {
      dialog.showModal();
    }
  }, []);

  const handleBackdropClick = (event) => {
    const dialog = dialogRef.current;
    if (!dialog || 'closedBy' in HTMLDialogElement.prototype) return;
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    const isDialogContent =
      rect.top <= event.clientY &&
      event.clientY <= rect.top + rect.height &&
      rect.left <= event.clientX &&
      event.clientX <= rect.left + rect.width;
    if (!isDialogContent) {
      dialog.close();
    }
  };

  const handleZoomIn = () => setScale((s) => Math.min(s + 0.5, 4));

  const handleZoomOut = () => {
    setScale((s) => {
      const newScale = Math.max(s - 0.5, 1);
      if (newScale === 1) {
        setOrigin({ x: 50, y: 50 });
      }
      return newScale;
    });
  };

  const handleReset = () => {
    setScale(1);
    setOrigin({ x: 50, y: 50 });
  };

  const handleWheel = (e) => {
    if (e.deltaY < 0) {
      handleZoomIn();
    } else {
      handleZoomOut();
    }
  };

  const handlePointerMove = (e) => {
    if (scale <= 1 || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    let clientX = e.clientX;
    let clientY = e.clientY;

    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    }

    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;

    setOrigin({ x, y });
  };

  const handleClick = (e) => {
    e.stopPropagation();

    if (scale > 1) {
      handleReset();
    } else {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        let clientX = e.clientX;
        let clientY = e.clientY;
        if (e.touches && e.touches.length > 0) {
          clientX = e.touches[0].clientX;
          clientY = e.touches[0].clientY;
        }
        const x = ((clientX - rect.left) / rect.width) * 100;
        const y = ((clientY - rect.top) / rect.height) * 100;
        setOrigin({ x, y });
      }
      setScale(2.5);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      closedby="any"
      aria-label="Xem ảnh phóng to"
      onClose={onClose}
      onClick={handleBackdropClick}
      className="m-auto w-[min(95vw,960px)] bg-[#161514] p-0 text-[#FAF8F5] border border-[#2E2B27] shadow-2xl backdrop:bg-[#161514]/85 backdrop:backdrop-blur-xs"
    >
      <div className="relative flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#2E2B27] bg-[#161514]">
          <span className="text-[10.5px] font-semibold uppercase tracking-[0.2em] text-[#D8D2C5]">
            Xem Chi Tiết Hình Ảnh
          </span>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 border border-[#2E2B27] px-2.5 py-1">
              <button
                type="button"
                onClick={handleZoomOut}
                className="text-[#D8D2C5] hover:text-[#C05A39] transition cursor-pointer"
                title="Thu nhỏ"
              >
                <FiZoomOut className="size-4" />
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="text-[#D8D2C5] hover:text-[#C05A39] transition cursor-pointer px-1 text-[10px] font-semibold"
                title="Kích thước gốc"
              >
                {Math.round(scale * 100)}%
              </button>
              <button
                type="button"
                onClick={handleZoomIn}
                className="text-[#D8D2C5] hover:text-[#C05A39] transition cursor-pointer"
                title="Phóng to"
              >
                <FiZoomIn className="size-4" />
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="text-[#D8D2C5] hover:text-[#C05A39] transition cursor-pointer"
                title="Đặt lại khung nhìn"
              >
                <FiMaximize className="size-3.5" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              aria-label="Đóng cửa sổ xem ảnh"
              className="p-1.5 text-[#D8D2C5] hover:text-[#FAF8F5] hover:bg-[#2E2B27] transition cursor-pointer"
            >
              <FiX className="size-5" />
            </button>
          </div>
        </div>

        <div
          ref={containerRef}
          className={`relative w-full h-[72vh] bg-[#1E1C1A] overflow-hidden flex items-center justify-center ${
            scale > 1 ? 'cursor-zoom-out' : 'cursor-zoom-in'
          }`}
          onClick={handleClick}
          onWheel={handleWheel}
          onMouseMove={handlePointerMove}
          onTouchMove={handlePointerMove}
        >
          <ImageWithFallback
            src={finalImageUrl}
            alt={`Xem ảnh ${imageId || ''}`}
            draggable={false}
            className="w-full h-full object-contain pointer-events-none select-none"
            style={{
              transform: `scale(${scale})`,
              transformOrigin: `${origin.x}% ${origin.y}%`,
              transition: 'transform 0.2s ease-out',
              imageRendering: scale > 1 ? 'crisp-edges' : 'auto',
            }}
          />
        </div>
      </div>
    </dialog>
  );
};
