import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FaChevronLeft, FaChevronRight, FaTrash, FaArrowLeft, FaHome } from "react-icons/fa";
import { SearchHistoryCard } from "../components/ui/SearchHistoryCard";
import { deleteAllSearchHistory, getSearchHistory } from "../services/searchHistoryService";
import { SearchHistoryDetailModal } from "../components/common/SearchHistoryDetail";
import AOS from 'aos';

const PAGE_SIZE = 20;

const filters = [
  { label: "Tất cả", value: "" },
  { label: "Hình ảnh tham chiếu", value: "IMAGE_TO_IMAGE" },
  { label: "Mô tả chất liệu", value: "TEXT_SEMANTIC" },
];

const normalizeHistoryResponse = (response) => {
  const data = response?.data || {};
  const histories = data.queries || data.results || [];

  return {
    histories,
    pageNumber: data.pageNumber ?? data.page ?? 0,
    pageSize: data.pageSize ?? data.size ?? PAGE_SIZE,
    totalElements: data.totalElements ?? histories.length,
    totalPages: data.totalPages ?? 0,
    processingTimeMs: data.processingTimeMs,
  };
};

export const SearchHistory = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState("");
  const [page, setPage] = useState(0);

  const [selectedHistoryId, setSelectedHistoryId] = useState(null);
  const handleOpenDetail = (id) => {
    setSelectedHistoryId(id);
  };

  const historyQuery = useQuery({
    queryKey: ["search-history", activeFilter, page],
    queryFn: () => getSearchHistory({
      page,
      size: PAGE_SIZE,
      searchType: activeFilter,
    }),
    placeholderData: keepPreviousData,
  });

  const historyData = useMemo(
    () => normalizeHistoryResponse(historyQuery.data),
    [historyQuery.data]
  );

  const deleteAllMutation = useMutation({
    mutationFn: deleteAllSearchHistory,
    onSuccess: () => {
      setPage(0);
      queryClient.invalidateQueries({ queryKey: ["search-history"] });
    },
  });

  const handleFilterChange = (nextFilter) => {
    setActiveFilter(nextFilter);
    setPage(0);
  };

  const handleDeleteAll = () => {
    if (window.confirm("Quý khách có chắc chắn muốn dọn sạch toàn bộ nhật ký định vị phong cách?")) {
      deleteAllMutation.mutate(undefined);
    }
  };

  const currentPage = historyData.pageNumber + 1;
  const totalPages = historyData.totalPages || 1;

  return (
    <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      {/* Title Banner */}
      <div className="flex flex-col gap-6 border-b border-[#E5E0D8] pb-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold tracking-[0.25em] text-[#C05A39] uppercase mb-1.5">
              LE CONCIERGE &bull; HISTORIQUE DES RECHERCHES
            </p>
            <h1 className="font-serif-luxury text-3xl sm:text-4xl font-normal text-[#161514] tracking-wide">
              Nhật Ký Định Vị Thị Giác
            </h1>
            <p className="mt-2 text-xs text-[#6B655D] max-w-xl leading-relaxed">
              Lưu giữ các truy vấn tham chiếu hình ảnh, mô tả sợi vải dệt và chất liệu trang phục đã được hệ thống tư vấn phục vụ quý khách.
            </p>
          </div>

          {historyData.processingTimeMs !== undefined && (
            <p className="px-3.5 py-2 border border-[#E5E0D8] bg-[#FAF8F5] text-[11px] text-[#8C8476] uppercase tracking-wider">
              Thời gian xử lý: <strong className="text-[#161514]">{historyData.processingTimeMs}ms</strong>
            </p>
          )}
        </div>

        {/* Filters & Actions Bar */}
        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-4 pt-2">
          <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0">
            {filters.map((filter) => {
              const isActive = activeFilter === filter.value;
              return (
                <button
                  key={filter.label}
                  type="button"
                  onClick={() => handleFilterChange(filter.value)}
                  className={`px-4 py-2 text-[10.5px] font-medium tracking-widest uppercase transition-all border cursor-pointer ${
                    isActive
                      ? "border-[#161514] bg-[#161514] text-[#FAF8F5]"
                      : "border-[#E5E0D8] bg-[#FAF8F5] text-[#161514] hover:border-[#161514]"
                  }`}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={handleDeleteAll}
            disabled={deleteAllMutation.isPending || historyData.totalElements === 0}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-[#D8D2C5] text-xs font-medium text-[#C05A39] hover:border-[#C05A39] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed uppercase tracking-wider"
          >
            <FaTrash className="h-3 w-3" />
            <span>{deleteAllMutation.isPending ? "Đang làm sạch..." : "Làm sạch nhật ký"}</span>
          </button>
        </div>
      </div>

      {historyQuery.isLoading ? (
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: PAGE_SIZE }).map((_, index) => (
            <div key={index} className="aspect-[4/3] animate-pulse bg-[#F3EFE6] border border-[#E5E0D8]" />
          ))}
        </div>
      ) : historyData.histories.length === 0 ? (
        <div className="flex flex-col items-center border border-[#E5E0D8] bg-[#FAF8F5] p-16 text-center">
          <h2 className="font-serif-luxury text-2xl font-normal text-[#161514]">Chưa Có Lịch Sử Tra Cứu</h2>
          <p className="mt-2 max-w-sm text-xs text-[#6B655D] leading-relaxed">
            Mỗi lần quý khách sử dụng The Visual Concierge để định vị trang phục, truy vấn sẽ được lưu giữ tại đây.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {historyData.histories.map((history) => (
              <SearchHistoryCard
                key={history.searchId || history.id}
                history={history}
                onClick={() => handleOpenDetail(history.searchId || history.id)}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-12 pt-6 border-t border-[#E5E0D8] flex items-center justify-between">
              <button
                disabled={page <= 0}
                onClick={() => setPage((p) => Math.max(p - 1, 0))}
                className={`px-4 py-2 border text-xs font-medium tracking-wider uppercase transition-all ${
                  page <= 0 ? 'border-[#E5E0D8] text-[#D8D2C5]' : 'border-[#161514] text-[#161514] hover:bg-[#161514] hover:text-[#FAF8F5]'
                }`}
              >
                Trước
              </button>
              <span className="text-xs text-[#6B655D] tracking-widest uppercase">
                Trang {currentPage} / {totalPages}
              </span>
              <button
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
                className={`px-4 py-2 border text-xs font-medium tracking-wider uppercase transition-all ${
                  page >= totalPages - 1 ? 'border-[#E5E0D8] text-[#D8D2C5]' : 'border-[#161514] text-[#161514] hover:bg-[#161514] hover:text-[#FAF8F5]'
                }`}
              >
                Sau
              </button>
            </div>
          )}
        </>
      )}

      {selectedHistoryId && (
        <SearchHistoryDetailModal
          historyId={selectedHistoryId}
          onClose={() => setSelectedHistoryId(null)}
        />
      )}
    </section>
  );
};
export default SearchHistory;
