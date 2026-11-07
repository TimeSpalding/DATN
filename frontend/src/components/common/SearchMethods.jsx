import { FaAlignLeft, FaUpload } from "react-icons/fa";
import { SearchMethodCard } from "../ui/SearchMethodCard";

export const SearchMethods = () => {
  const searchMethods = [
    {
      iconBackgroundClassName: "bg-[#F3EFE6] border border-[#E5E0D8]",
      iconClassName: "text-[#161514]",
      Icon: FaUpload,
      title: "Tìm kiếm bằng hình ảnh",
      description:
        "Tải lên hình ảnh trang phục tham chiếu để tìm nhanh các mẫu thiết kế tương đồng trong bộ sưu tập.",
    },
    {
      iconBackgroundClassName: "bg-[#F3EFE6] border border-[#E5E0D8]",
      iconClassName: "text-[#C05A39]",
      Icon: FaAlignLeft,
      title: "Tìm kiếm theo mô tả",
      description:
        "Nhập từ khóa về kiểu dáng, màu sắc hoặc chất liệu sợi vải để lọc các thiết kế phù hợp.",
    },
  ];

  return (
    <div className="w-full max-w-[1200px] pt-8 flex flex-col justify-start items-center">
      <div className="w-full flex flex-col justify-start items-center gap-8">
        <h2 className="text-center font-serif-luxury text-2xl md:text-3xl font-normal text-[#161514]">
          Phương Thức Tìm Kiếm Trang Phục
        </h2>
        <div className="w-full flex flex-col md:flex-row justify-center items-stretch gap-6">
          {searchMethods.map((method) => (
            <SearchMethodCard key={method.title} {...method} />
          ))}
        </div>
      </div>
    </div>
  );
};
