import React from 'react';
import { User, Upload, Check, Camera } from 'lucide-react';

export const PRESET_MODELS = [
  {
    id: 'studio-female',
    name: 'Người Mẫu Nữ Studio',
    subtitle: 'Chụp chính diện toàn thân chuẩn',
    image: '/samples/model-1.jpg'
  },
  {
    id: 'studio-male',
    name: 'Người Mẫu Nam Thời Trang',
    subtitle: 'Vóc dáng thể thao chuẩn size L',
    image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=600&q=80'
  }
];

export default function ModelSelector({ selectedModelId, onSelectPresetModel, onUploadCustomModel, isCustomModel }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      {/* Preset Model 1 & 2 */}
      {PRESET_MODELS.map((model) => {
        const isSelected = selectedModelId === model.id && !isCustomModel;

        return (
          <button
            key={model.id}
            type="button"
            onClick={() => onSelectPresetModel(model)}
            className={`
              flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border text-xs font-semibold transition-all cursor-pointer
              ${isSelected
                ? 'bg-[#111215] text-white border-[#111215] shadow-xs'
                : 'bg-white text-[#4a4f5c] border-[#ded8cc] hover:border-[#111215] hover:text-[#111215]'
              }
            `}
          >
            <img
              src={model.image}
              alt={model.name}
              className="w-5 h-5 rounded-full object-cover border border-white/40"
            />
            <span>{model.name}</span>
            {isSelected && <Check className="w-3 h-3 text-[#d4af37]" />}
          </button>
        );
      })}

      {/* Upload Custom Model Trigger */}
      <label className={`
        flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-semibold transition-all cursor-pointer
        ${isCustomModel
          ? 'bg-[#111215] text-white border-[#111215] shadow-xs'
          : 'bg-white text-[#4a4f5c] border-[#ded8cc] hover:border-[#111215] hover:text-[#111215]'
        }
      `}>
        <Camera className="w-3.5 h-3.5 text-[#a88325]" />
        <span>{isCustomModel ? 'Đang dùng ảnh của bạn' : 'Tải Ảnh Của Bạn'}</span>
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.[0]) {
              onUploadCustomModel(e.target.files[0]);
            }
          }}
        />
      </label>
    </div>
  );
}
