import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const ATELIER_PILLARS = [
  {
    number: '01',
    title: 'Sợi Dệt Tự Nhiên Tuyển Lựa',
    subtitle: '100% Sợi Nguồn Gốc Sinh Thái',
    desc: 'Từng thớ sợi cotton Pima Peru, lanh Normandy và len Merino đều được kiểm định nguồn gốc sinh thái và chứng nhận an toàn cho làn da.'
  },
  {
    number: '02',
    title: 'Phòng Thử Đồ Tư Gia',
    subtitle: 'Mô Phỏng Độ Rủ Chuẩn Xác',
    desc: 'Trải nghiệm ướm thử kỹ thuật số tái hiện chính xác cấu trúc sợi vải và tỷ lệ vóc dáng của người mặc trước khi hoàn thiện đơn hàng.'
  },
  {
    number: '03',
    title: 'Chỉnh Sửa May Đo Tận Nơi',
    subtitle: 'Đặc Quyền Của Khách Hàng',
    desc: 'Mỗi thiết kế đều được hỗ trợ căn chỉnh đường may theo số đo riêng miễn phí và đổi trả tận nhà trong vòng 30 ngày.'
  },
  {
    number: '04',
    title: 'Đóng Gói Nghệ Thuật',
    subtitle: 'Hộp Quà Thủ Công Cao Cấp',
    desc: 'Trang phục được bọc trong giấy nến thơm, niêm phong sáp và đựng trong hộp cứng trang nhã như một món quà nghệ thuật.'
  }
];

export default function StudioBenefits() {
  return (
    <section className="border-t border-[#E5E0D8] bg-[#F3EFE6] py-20 w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-[10px] font-semibold tracking-[0.25em] text-[#C05A39] uppercase mb-2">
            NGUYÊN TẮC CỦA MAISON
          </p>
          <h2 className="font-serif-luxury text-3xl sm:text-4xl text-[#161514] font-normal tracking-wide">
            Cam Kết Về Đẳng Cấp &amp; Tay Nghề
          </h2>
          <div className="w-12 h-[1px] bg-[#C05A39] mx-auto mt-4" />
        </div>

        {/* 4 Pillars Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {ATELIER_PILLARS.map((item, idx) => (
            <div key={idx} className="flex flex-col border-t border-[#D8D2C5] pt-6 group">
              <span className="font-serif-luxury text-2xl text-[#8C8476] mb-3 group-hover:text-[#C05A39] transition-colors">
                {item.number}
              </span>
              <h3 className="font-serif-luxury text-xl text-[#161514] font-normal leading-snug mb-1">
                {item.title}
              </h3>
              <p className="text-[10.5px] font-medium tracking-[0.15em] text-[#8C8476] uppercase mb-3">
                {item.subtitle}
              </p>
              <p className="text-xs text-[#6B655D] leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Narrative Callout */}
        <div className="mt-16 pt-10 border-t border-[#D8D2C5] flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
          <p className="font-serif-luxury text-xl text-[#161514] italic max-w-2xl">
            "Sự sang trọng đích thực không nằm ở tiếng ồn, mà toát lên từ sự thấu hiểu chất liệu và đường cắt vừa vặn đến tuyệt mỹ."
          </p>
          <Link
            to="/about"
            className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.2em] uppercase text-[#161514] hover:text-[#C05A39] transition-colors shrink-0"
          >
            <span>Tìm Hiểu Câu Chuyện Maison</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

      </div>
    </section>
  );
}
