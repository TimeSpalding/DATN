import React, { useRef } from 'react';
import { Upload, User, Shirt, X, RefreshCw } from 'lucide-react';

export default function ImageUploader({ 
  label, 
  icon: iconType, 
  file, 
  preview, 
  onFileChange, 
  onClear,
  headerRight = null,
  helperText = ''
}) {
  const inputRef = useRef(null);
  const IconComponent = iconType === 'person' ? User : Shirt;

  const handleClick = () => {
    if (!preview) {
      inputRef.current?.click();
    }
  };

  const handleKeyDown = (event) => {
    if (!preview && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      handleClick();
    }
  };

  return (
    <div className="w-full max-w-[360px] lg:max-w-none lg:w-full flex flex-col justify-self-center">
      {/* Label Header */}
      <div className="flex min-h-8 items-center justify-between gap-3 mb-2 px-1">
        <span className="text-[10.5px] font-medium uppercase tracking-[0.2em] text-[#161514] flex items-center gap-1.5 min-w-0">
          <IconComponent className="w-3.5 h-3.5 text-[#8C8476] stroke-[1.75]" />
          <span>{label}</span>
        </span>
        <div className="shrink-0 max-w-[68%]">
          {headerRight}
        </div>
      </div>

      {/* Card Stage: Rectangular sharp framing */}
      <div
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        role={!preview ? 'button' : undefined}
        tabIndex={!preview ? 0 : undefined}
        aria-label={!preview ? `Tải ảnh ${label}` : undefined}
        className={`
          relative group overflow-hidden
          w-full aspect-[3/4] max-h-[380px]
          flex flex-col items-center justify-center
          transition-all duration-300 ease-out
          ${preview
            ? 'border border-[#E5E0D8] bg-[#FAF8F5]'
            : 'border border-dashed border-[#D8D2C5] hover:border-[#161514] bg-[#F7F5F0] hover:bg-[#FAF8F5] cursor-pointer'
          }
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => onFileChange(e.target.files?.[0])}
        />

        {preview ? (
          <>
            <img
              src={preview}
              alt={label}
              className="w-full h-full object-contain bg-[#F3EFE6] transition-transform duration-700 group-hover:scale-[1.02]"
            />
            
            {/* Subtle dark bottom vignette */}
            <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#161514]/80 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
            
            {/* Bottom Status Tag */}
            <div className="absolute bottom-3 inset-x-3 flex items-center justify-between opacity-0 translate-y-1 transition-all duration-200 group-hover:opacity-100 group-hover:translate-y-0">
              <span className="text-[#FAF8F5] text-[10px] font-medium tracking-[0.16em] uppercase px-2.5 py-1 bg-[#161514]/80 backdrop-blur-xs border border-white/10">
                {label} Đã Sẵn Sàng
              </span>

              {/* Replace trigger */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  inputRef.current?.click();
                }}
                className="w-7 h-7 bg-[#161514]/80 backdrop-blur-xs text-[#FAF8F5] flex items-center justify-center hover:bg-[#C05A39] transition-all cursor-pointer border border-white/10"
                title="Thay ảnh khác"
              >
                <RefreshCw className="w-3 h-3" />
              </button>
            </div>

            {/* Clear button */}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onClear(); }}
              className="absolute top-2.5 right-2.5 w-7 h-7 bg-[#161514]/80 backdrop-blur-xs text-[#FAF8F5] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-[#C05A39] cursor-pointer"
              title="Xóa ảnh"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-3 p-6 text-center">
            <div className="w-12 h-12 bg-[#EAE5D9] group-hover:bg-[#161514] flex items-center justify-center transition-all duration-300 border border-[#D8D2C5]">
              <IconComponent className="w-5 h-5 text-[#6B655D] group-hover:text-[#FAF8F5] transition-colors duration-300" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-[#161514] tracking-[0.18em] uppercase">
                {label}
              </p>
              <p className="text-[11px] text-[#8C8476] mt-1 font-normal leading-normal max-w-[200px]">
                {helperText || 'Nhấp để tải ảnh lên hoặc kéo thả'}
              </p>
            </div>

            <span className="mt-1 inline-flex items-center gap-1.5 text-[10.5px] font-semibold tracking-wider uppercase text-[#161514] group-hover:text-[#C05A39]">
              <Upload className="w-3 h-3" />
              <span>Tải Ảnh Lên</span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
