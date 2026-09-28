import React from 'react';
import { RotateCcw, ShieldCheck, Truck, Sparkles, Award } from 'lucide-react';

const BENEFITS = [
  {
    icon: Sparkles,
    title: 'Phòng Thử Đồ Chuẩn 98%',
    desc: 'Công nghệ AI tái tạo chính xác độ rủ tự nhiên của sợi vải và tỷ lệ cơ thể thực tế.'
  },
  {
    icon: RotateCcw,
    title: 'Đổi Trả Miễn Phí 30 Ngày',
    desc: 'Hỗ trợ đổi size tận nhà nếu trang phục không vừa vặn như mong đợi của bạn.'
  },
  {
    icon: Truck,
    title: 'Giao Hàng Nhanh Toàn Quốc',
    desc: 'Miễn phí vận chuyển cho tất cả đơn hàng từ 500.000₫, đóng gói hộp cao cấp.'
  },
  {
    icon: Award,
    title: 'Chất Liệu Tuyển Chọn',
    desc: '100% sợi dệt tự nhiên, thân thiện làn da và bền bỉ phom dáng theo thời gian.'
  }
];

export default function StudioBenefits() {
  return (
    <section id="benefits" className="border-t border-b border-slate-200 bg-slate-50/50 py-14 my-16 w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {BENEFITS.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="flex flex-col items-center text-center sm:items-start sm:text-left group">
                <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-blue-900 mb-4 border border-slate-200 shadow-2xs group-hover:border-blue-700 transition-colors">
                  <Icon className="w-5 h-5 text-blue-700" />
                </div>
                <h4 className="font-bold text-sm text-slate-900 tracking-wide">
                  {item.title}
                </h4>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
