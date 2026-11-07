import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Crop, RotateCcw, X } from 'lucide-react';

export default function CropModal({ imageUrl, originalFile, onCancel, onCropComplete }) {
  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const dialogRef = useRef(null);
  const imgRef = useRef(null);
  const confirmedRef = useRef(false);
  const titleId = useId();

  const hasSelection = Boolean(completedCrop?.width && completedCrop?.height);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (!dialog.open) {
      dialog.showModal();
    }

    if (!('closedBy' in HTMLDialogElement.prototype)) {
      const isOutside = (event) => {
        const rect = dialog.getBoundingClientRect();
        return (
          event.clientX < rect.left ||
          event.clientX > rect.right ||
          event.clientY < rect.top ||
          event.clientY > rect.bottom
        );
      };

      let pressedOutside = false;
      const handlePointerDown = (event) => {
        pressedOutside = isOutside(event);
      };
      const handlePointerUp = (event) => {
        if (pressedOutside && isOutside(event)) {
          dialog.close();
        }
      };

      dialog.addEventListener('pointerdown', handlePointerDown);
      dialog.addEventListener('pointerup', handlePointerUp);
      return () => {
        dialog.removeEventListener('pointerdown', handlePointerDown);
        dialog.removeEventListener('pointerup', handlePointerUp);
      };
    }

    return undefined;
  }, []);

  const handleResetCrop = () => {
    setCrop(undefined);
    setCompletedCrop(null);
  };

  const handleRequestClose = () => {
    if (dialogRef.current?.open) {
      dialogRef.current.close();
    } else {
      onCancel?.();
    }
  };

  const handleDialogClose = () => {
    if (!confirmedRef.current) {
      onCancel?.();
    }
  };

  const handleConfirm = async () => {
    if (!hasSelection) {
      confirmedRef.current = true;
      onCropComplete(originalFile);
      return;
    }

    setIsProcessing(true);
    try {
      const image = imgRef.current;
      if (!image) return;

      const canvas = document.createElement('canvas');
      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;

      canvas.width = Math.max(1, Math.floor(completedCrop.width * scaleX));
      canvas.height = Math.max(1, Math.floor(completedCrop.height * scaleY));

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setIsProcessing(false);
        return;
      }

      ctx.drawImage(
        image,
        completedCrop.x * scaleX,
        completedCrop.y * scaleY,
        completedCrop.width * scaleX,
        completedCrop.height * scaleY,
        0,
        0,
        canvas.width,
        canvas.height
      );

      canvas.toBlob((blob) => {
        setIsProcessing(false);
        if (!blob) {
          console.error('Canvas is empty');
          return;
        }
        confirmedRef.current = true;
        const uniqueFileName = `cropped_${Date.now()}.jpeg`;
        const file = new File([blob], uniqueFileName, { type: 'image/jpeg' });
        onCropComplete(file);
      }, 'image/jpeg', 0.94);
    } catch (error) {
      console.error(error);
      setIsProcessing(false);
    }
  };

  return createPortal(
    <dialog
      ref={dialogRef}
      {...({ closedby: 'any' })}
      aria-labelledby={titleId}
      onClose={handleDialogClose}
      className="m-auto w-[calc(100%-1.5rem)] max-w-3xl border border-[#E5E0D8] bg-[#FAF8F5] p-0 text-[#161514] shadow-2xl"
    >
      <div className="flex max-h-[90vh] flex-col">
        {/* Editorial Header */}
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-[#E5E0D8] px-5 py-4 sm:px-7 sm:py-5">
          <div>
            <p className="mb-1 text-[10px] font-semibold tracking-[0.22em] text-[#C05A39] uppercase">
              Tìm Kiếm Bằng Hình Ảnh
            </p>
            <h2
              id={titleId}
              className="font-serif-luxury text-xl font-normal text-[#161514] sm:text-2xl"
            >
              Chọn Vùng Trang Phục Cần Tìm
            </h2>
          </div>

          <button
            type="button"
            onClick={handleRequestClose}
            aria-label="Đóng cửa sổ cắt ảnh"
            className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center border border-[#E5E0D8] bg-[#FAF8F5] text-[#161514] transition-colors hover:border-[#161514] hover:text-[#C05A39]"
          >
            <X aria-hidden="true" className="h-4 w-4 stroke-[1.75]" />
          </button>
        </div>

        {/* Crop Viewport */}
        <div className="mx-5 mt-5 flex max-h-[54vh] min-h-[220px] flex-1 items-center justify-center overflow-auto border border-[#E5E0D8] bg-[#F3EFE6] p-3 sm:mx-7 sm:p-4">
          <ReactCrop
            crop={crop}
            onChange={(c) => setCrop(c)}
            onComplete={(c) => setCompletedCrop(c)}
          >
            <img
              ref={imgRef}
              src={imageUrl}
              alt="Ảnh tải lên để chọn vùng trang phục"
              className="max-h-[48vh] w-auto object-contain"
            />
          </ReactCrop>
        </div>

        {/* Helper & Reset Row */}
        <div className="mx-5 mt-3 flex shrink-0 flex-wrap items-center justify-between gap-2 text-xs text-[#6B655D] sm:mx-7">
          <p className="flex items-center gap-2">
            <Crop aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-[#C05A39]" />
            <span>Kéo chuột trên ảnh để khoanh vùng sản phẩm cụ thể, hoặc tìm ngay bằng toàn bộ ảnh gốc.</span>
          </p>

          {hasSelection && (
            <button
              type="button"
              onClick={handleResetCrop}
              className="inline-flex cursor-pointer items-center gap-1.5 text-[11px] font-medium tracking-wider text-[#C05A39] uppercase transition-colors hover:text-[#161514]"
            >
              <RotateCcw aria-hidden="true" className="h-3 w-3" />
              <span>Bỏ vùng chọn</span>
            </button>
          )}
        </div>

        {/* Footer Actions */}
        <div className="mt-4 flex shrink-0 flex-col-reverse gap-2.5 border-t border-[#E5E0D8] bg-[#F7F5F0] px-5 py-4 sm:mt-5 sm:flex-row sm:items-center sm:justify-end sm:gap-3 sm:px-7">
          <button
            type="button"
            onClick={handleRequestClose}
            className="cursor-pointer border border-[#D8D2C5] bg-[#FAF8F5] px-5 py-2.5 text-[11px] font-semibold tracking-[0.16em] text-[#161514] uppercase transition-colors hover:border-[#161514]"
          >
            Hủy Bỏ
          </button>

          <button
            type="button"
            autoFocus
            onClick={handleConfirm}
            disabled={isProcessing}
            className="cursor-pointer bg-[#161514] px-6 py-2.5 text-[11px] font-semibold tracking-[0.16em] text-[#FAF8F5] uppercase transition-colors hover:bg-[#C05A39] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isProcessing
              ? 'Đang xử lý...'
              : hasSelection
                ? 'Cắt Vùng Chọn & Tìm Kiếm'
                : 'Tìm Bằng Ảnh Gốc'}
          </button>
        </div>
      </div>
    </dialog>,
    document.body
  );
}
