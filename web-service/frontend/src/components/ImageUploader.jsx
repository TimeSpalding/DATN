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
      {/* Label Header with fixed height for pixel-perfect vertical alignment */}
      <div className="flex min-h-8 items-center justify-between gap-3 mb-2.5 px-1">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#111215] flex items-center gap-1.5 min-w-0">
          <IconComponent className="w-3.5 h-3.5 text-[#a88325]" />
          <span>{label}</span>
        </span>
        <div className="shrink-0 max-w-[68%]">
          {headerRight}
        </div>
      </div>

      {/* Card Stage with explicit height */}
      <div
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        role={!preview ? 'button' : undefined}
        tabIndex={!preview ? 0 : undefined}
        aria-label={!preview ? `Tải ảnh ${label}` : undefined}
        className={`
          relative group rounded-2xl overflow-hidden
          w-full aspect-[3/4] max-h-[380px]
          flex flex-col items-center justify-center
          transition-all duration-300 ease-out
          ${preview
            ? 'border border-[#ded8cc] shadow-sm bg-white'
            : 'border-2 border-dashed border-[#ded8cc] hover:border-[#111215]/50 bg-white/70 hover:bg-white cursor-pointer hover:shadow-xs'
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
              className="w-full h-full object-contain bg-[#f7f6f2] transition-transform duration-700 group-hover:scale-[1.02]"
            />
            {/* Subtle gradient vignette */}
            <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/65 via-black/20 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100" />
            
            {/* Bottom Status Tag */}
            <div className="absolute bottom-3 inset-x-3 flex items-center justify-between opacity-0 translate-y-1 transition-all duration-200 group-hover:opacity-100 group-hover:translate-y-0 group-focus-within:opacity-100 group-focus-within:translate-y-0">
              <span className="text-white text-[11px] font-semibold px-2.5 py-1 bg-white/20 backdrop-blur-md rounded-lg border border-white/20 line-clamp-1">
                {label} Đã Sẵn Sàng
              </span>

              {/* Replace trigger */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  inputRef.current?.click();
                }}
                className="w-7 h-7 rounded-lg bg-white/20 backdrop-blur-md text-white flex items-center justify-center hover:bg-white/35 transition-all cursor-pointer border border-white/20"
                title="Thay ảnh khác"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Clear button */}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onClear(); }}
              className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-black/40 backdrop-blur-md text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-black/65 cursor-pointer hover:scale-105"
              title="Xóa ảnh"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-3 p-6 text-center">
            <div className="w-13 h-13 rounded-2xl bg-[#f7f6f2] group-hover:bg-[#111215] flex items-center justify-center transition-all duration-300 border border-[#ece9e2]">
              <IconComponent className="w-6 h-6 text-[#8d887f] group-hover:text-white transition-colors duration-300" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#111215] tracking-wide uppercase">
                {label}
              </p>
              <p className="text-[11px] text-[#8d887f] mt-1 font-medium leading-normal">
                {helperText || 'Nhấp để tải ảnh lên hoặc kéo thả'}
              </p>
            </div>

            <span className="mt-1 inline-flex items-center gap-1.5 text-[11px] font-bold text-[#a88325] group-hover:underline">
              <Upload className="w-3 h-3" />
              <span>Tải file ảnh</span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
