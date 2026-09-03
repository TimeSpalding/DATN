import React from 'react';
import { RotateCcw, ShieldCheck, Truck, Sparkles, Award } from 'lucide-react';

const BENEFITS = [
  {
    icon: Sparkles,
    title: 'Phòng Thử Đồ Chuẩn 98%',
    desc: 'Công nghệ AI tái tạo chính xác độ rủ của vải và tỷ lệ cơ thể thực tế.'
  },
  {
    icon: RotateCcw,
    title: 'Đổi Trả Miễn Phí 30 Ngày',
    desc: 'Hỗ trợ đổi size tận nhà nếu trang phục không vừa vặn như mong đợi.'
  },
  {
    icon: Truck,
    title: 'Giao Hàng Nhanh Toàn Quốc',
    desc: 'Miễn phí vận chuyển cho tất cả đơn hàng từ 500.000₫.'
  },
  {
    icon: Award,
    title: 'Chất Liệu Tuyển Chọn',
    desc: '100% sợi dệt tự nhiên, thân thiện làn da và bền bỉ theo thời gian.'
  }
];

export default function StudioBenefits() {
  return (
    <section id="benefits" className="border-t border-b border-[#ece9e2] bg-white py-14 my-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {BENEFITS.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="flex flex-col items-center text-center sm:items-start sm:text-left">
                <div className="w-11 h-11 rounded-xl bg-[#f7f6f2] flex items-center justify-center text-[#111215] mb-4 border border-[#ece9e2]">
                  <Icon className="w-5 h-5 text-[#a88325]" />
                </div>
                <h4 className="font-bold text-sm text-[#111215] tracking-wide">
                  {item.title}
                </h4>
                <p className="text-xs text-[#6e7382] mt-1.5 leading-relaxed">
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
