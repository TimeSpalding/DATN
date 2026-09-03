import React from 'react';
import { Shirt, Sparkles } from 'lucide-react';

const CATEGORIES = [
  { value: 'upper', label: 'Áo (Tops & Polo)', desc: 'Áo thun, sơ mi, polo' },
  { value: 'lower', label: 'Quần & Váy (Bottoms)', desc: 'Quần tây, jeans, chân váy' },
  { value: 'overall', label: 'Đầm & Set Bộ (Full Outfit)', desc: 'Váy dài, jumpsuit, suit' },
];

export default function CategorySelector({ value, onChange }) {
  return (
    <div className="inline-flex items-center p-1 rounded-full bg-[#f7f6f2] border border-[#ded8cc] shadow-2xs gap-1">
      {CATEGORIES.map((cat) => {
        const isActive = value === cat.value;
        return (
          <button
            key={cat.value}
            type="button"
            onClick={() => onChange(cat.value)}
            className={`
              px-3.5 py-1.5 rounded-full text-[11px] font-bold tracking-wider uppercase
              transition-all duration-200 ease-out cursor-pointer
              ${isActive
                ? 'bg-[#111215] text-white shadow-xs'
                : 'text-[#6e7382] hover:text-[#111215] hover:bg-white/80'
              }
            `}
          >
            {cat.label}
          </button>
        );
      })}
    </div>
  );
}
