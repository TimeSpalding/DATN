import React from 'react';

export default function SearchModeTabs({ activeMode, modes, onChange }) {
  return (
    <div className={`grid grid-cols-1 border-b border-[#E5E0D8] ${modes.length === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} bg-[#FAF8F5]`}>
      {modes.map((mode) => {
        const Icon = mode.icon;
        const isActive = mode.id === activeMode.id;

        return (
          <button
            key={mode.id}
            type="button"
            onClick={() => onChange(mode)}
            className={`flex cursor-pointer min-h-14 items-center justify-center gap-2.5 border-b-2 px-6 py-4 text-xs font-medium tracking-[0.18em] uppercase transition-all ${
              isActive
                ? "border-[#161514] bg-[#F7F5F0] text-[#161514] font-semibold"
                : "border-transparent text-[#8C8476] hover:bg-[#F3EFE6] hover:text-[#161514]"
            }`}
          >
            <Icon className="h-4 w-4 shrink-0 stroke-[1.75]" />
            <span>{mode.label}</span>
          </button>
        );
      })}
    </div>
  );
}
