import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FiChevronLeft, FiChevronRight, FiTrash2, FiArrowLeft, FiEye } from "react-icons/fi";
import { getIndexingJobItems, deleteJobImages } from "../../services/adminIndexingService";
import { ImageWithFallback } from "../../components/common/ImageWithFallback";
import { resolveImageUrl } from "../../utils/imageUrl";
import Swal from "sweetalert2";
import { ImagePreviewModal } from "../../components/common/ImagePreviewModal";
import { formatDateTime } from "../../utils/formatDateTime";

const statusStyles = {
  PENDING: "border-[#D8D2C5] bg-[#FAF8F5] text-[#6B655D]",
  RUNNING: "border-amber-200 bg-amber-50 text-amber-800",
  COMPLETED: "border-emerald-200 bg-emerald-50 text-emerald-800",
  FAILED: "border-rose-200 bg-rose-50 text-rose-800",
  PARTIALLY_FAILED: "border-orange-200 bg-orange-50 text-orange-800",
  PROCESSING: "border-amber-200 bg-amber-50 text-amber-800",
  INDEXED: "border-emerald-200 bg-emerald-50 text-emerald-800",
  UPLOADING: "border-[#161514] bg-[#161514] text-[#FAF8F5]",
  UPLOAD_FAILED: "border-rose-200 bg-rose-50 text-rose-800",
};

const StatusBadge = ({ status }) => (
  <span
    className={`inline-flex items-center border px-2.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-wider ${
      statusStyles[status] || "border-[#E5E0D8] bg-[#FAF8F5] text-[#6B655D]"
    }`}
  >
    {status || "UNKNOWN"}
  </span>
);

export const AdminJobDetail = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [itemPage, setItemPage] = useState(1);
  const [selectedImages, setSelectedImages] = useState([]);
  const [previewImageId, setPreviewImageId] = useState(null);
  const [statusFilter, setStatusFilter] = useState("ALL");

  const itemsQuery = useQuery({
    queryKey: ["admin-indexing-job-items", jobId, itemPage, statusFilter],
    queryFn: () =>
      getIndexingJobItems(jobId, { page: itemPage, size: 10, status: statusFilter }),
    refetchInterval: (query) => {
      const statuses = query.state.data?.content?.map((item) => item.status) || [];
      return statuses.some((status) => status === "PENDING" || status === "PROCESSING")
        ? 5000
        : false;
    },
  });

  const selectedJobItems = itemsQuery.data?.content || [];

  const displayItems = selectedJobItems.filter((item) => {
    if (statusFilter === "ALL") return true;
    return item.status === statusFilter;
  });

  const deleteMutation = useMutation({
    mutationFn: (imageIds) => deleteJobImages(jobId, imageIds),
    onSuccess: (data, variables) => {
      setSelectedImages([]);
      queryClient.invalidateQueries({ queryKey: ["admin-indexing-job-items", jobId] });
      Swal.fire({
        title: "Thành công",
        text: `${data?.deletedCount || variables.length} ảnh đã được chuyển vào thùng rác.`,
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
      });
    },
    onError: (error) => {
      Swal.fire({
        title: "Không thể xóa ảnh",
        text: "Đã xảy ra lỗi khi chuyển ảnh vào thùng rác.",
        icon: "error",
      });
      console.error(error);
    },
  });

  const handleSelectAll = (e) => {
    const currentPageImageIds = displayItems.map((item) => item.imageId);
    if (e.target.checked) {
      setSelectedImages((prev) => Array.from(new Set([...prev, ...currentPageImageIds])));
    } else {
      setSelectedImages((prev) => prev.filter((id) => !currentPageImageIds.includes(id)));
    }
  };

  const handleSelectOne = (imageId) => {
    setSelectedImages((prev) =>
      prev.includes(imageId) ? prev.filter((id) => id !== imageId) : [...prev, imageId]
    );
  };

  const handleDelete = () => {
    Swal.fire({
      title: "Xác nhận chuyển vào thùng rác?",
      text: `Chuyển ${selectedImages.length} hình ảnh đã chọn vào thùng rác hệ thống?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#C05A39",
      cancelButtonColor: "#6B655D",
      confirmButtonText: "Đồng ý xóa",
      cancelButtonText: "Hủy",
    }).then((result) => {
      if (result.isConfirmed) {
        deleteMutation.mutate(selectedImages);
      }
    });
  };

  const isAllSelected =
    displayItems.length > 0 &&
    displayItems.every((item) => selectedImages.includes(item.imageId));

  return (
    <div className="max-w-7xl mx-auto w-full space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between pb-6 border-b border-[#E5E0D8] gap-4">
        <div>
          <button
            type="button"
            onClick={() => navigate("/admin/indexing")}
            className="inline-flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.2em] text-[#6B655D] hover:text-[#161514] mb-2 cursor-pointer"
          >
            <FiArrowLeft className="size-3.5" />
            <span>Quay lại danh sách tiến trình</span>
          </button>
          <h1 className="font-serif-luxury text-2xl sm:text-3xl font-normal text-[#161514]">
            Chi Tiết Tiến Trình Đồng Bộ #{jobId}
          </h1>
        </div>

        <button
          type="button"
          onClick={handleDelete}
          disabled={selectedImages.length === 0 || deleteMutation.isPending}
          className="inline-flex cursor-pointer items-center gap-2 bg-[#C05A39] px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-[#FAF8F5] transition hover:bg-[#A64B2E] disabled:cursor-not-allowed disabled:bg-[#E5E0D8] disabled:text-[#8C8476] self-start sm:self-auto"
        >
          <FiTrash2 className="size-3.5" />
          <span>
            {deleteMutation.isPending
              ? "Đang xử lý..."
              : `Xóa ảnh đã chọn (${selectedImages.length})`}
          </span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 border border-[#E5E0D8] bg-white p-4">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#6B655D]">
          Trạng thái xử lý:
        </span>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setItemPage(1);
          }}
          className="cursor-pointer border border-[#D8D2C5] bg-[#FAF8F5] px-3 py-2 text-xs text-[#161514] focus:border-[#161514] focus:outline-none"
        >
          <option value="ALL">Tất cả trạng thái</option>
          <option value="FAILED">Lỗi xử lý (FAILED)</option>
          <option value="INDEXED">Đã lập chỉ mục (INDEXED)</option>
          <option value="PENDING">Đang chờ (PENDING)</option>
        </select>
      </div>

      {/* Main Content Area */}
      <div className="overflow-hidden border border-[#E5E0D8] bg-white">
        {itemsQuery.isLoading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-24 animate-pulse bg-[#F3EFE6] lg:h-12"
              />
            ))}
          </div>
        ) : itemsQuery.isError ? (
          <div className="px-5 py-10 text-center text-xs text-[#C05A39]">
            Không tải được danh sách hình ảnh của tiến trình này.
          </div>
        ) : displayItems.length === 0 ? (
          <div className="px-5 py-10 text-center text-xs text-[#8C8476]">
            Không có hình ảnh nào phù hợp với bộ lọc hiện tại.
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 border-b border-[#E5E0D8] bg-[#FAF8F5] px-4 py-3 lg:hidden">
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={handleSelectAll}
                className="size-4 cursor-pointer accent-[#161514]"
              />
              <span className="text-xs font-semibold uppercase tracking-wider text-[#161514]">
                Chọn tất cả
              </span>
            </div>

            <div className="w-full p-4 lg:p-0 lg:overflow-x-auto">
              <table className="block w-full text-xs lg:table lg:min-w-[860px] lg:border-collapse">
                <thead className="hidden lg:table-header-group">
                  <tr className="bg-[#FAF8F5] text-left text-[10.5px] font-semibold uppercase tracking-wider text-[#6B655D] border-b border-[#E5E0D8]">
                    <th className="px-4 py-3.5 w-12 text-center">
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        onChange={handleSelectAll}
                        className="accent-[#161514] cursor-pointer"
                      />
                    </th>
                    <th className="px-4 py-3.5">Hình ảnh</th>
                    <th className="px-4 py-3.5">Mã ảnh</th>
                    <th className="px-4 py-3.5">Trạng thái</th>
                    <th className="px-4 py-3.5 text-right">Số lần thử lại</th>
                    <th className="px-4 py-3.5">Thời điểm xử lý</th>
                    <th className="px-4 py-3.5 text-center">Xem</th>
                  </tr>
                </thead>

                <tbody className="block lg:table-row-group space-y-4 lg:space-y-0 divide-y divide-[#E5E0D8]">
                  {displayItems.map((item) => (
                    <tr
                      key={item.id}
                      className={`block border border-[#E5E0D8] bg-white transition-all lg:table-row lg:border-0 lg:hover:bg-[#FAF8F5]/70 ${
                        selectedImages.includes(item.imageId)
                          ? "bg-[#FAF8F5]"
                          : ""
                      }`}
                    >
                      {/* Mobile */}
                      <td className="block p-4 lg:hidden">
                        <div className="flex gap-4">
                          <div className="flex flex-col items-center gap-3">
                            <input
                              type="checkbox"
                              checked={selectedImages.includes(item.imageId)}
                              onChange={() => handleSelectOne(item.imageId)}
                              className="size-4 accent-[#161514] cursor-pointer"
                            />
                            <div
                              className="h-20 w-20 shrink-0 cursor-pointer overflow-hidden border border-[#E5E0D8] bg-[#F3EFE6]"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPreviewImageId(item.imageId);
                              }}
                            >
                              <ImageWithFallback
                                src={resolveImageUrl(item.imageUrl, item.imageId)}
                                alt={`Ảnh ${item.imageId}`}
                                className="h-full w-full object-cover"
                              />
                            </div>
                          </div>

                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewImageId(item.imageId);
                            }}
                            className="flex flex-1 flex-col justify-between py-1"
                          >
                            <div>
                              <div className="flex flex-wrap items-start justify-between gap-2">
                                <span className="font-mono font-semibold text-[#161514]">
                                  #{item.imageId}
                                </span>
                                <StatusBadge status={item.status} />
                              </div>

                              <div className="mt-2 flex flex-col gap-1 text-xs text-[#6B655D]">
                                <div className="flex justify-between">
                                  <span>Thử lại:</span>
                                  <span className="font-medium text-[#161514]">
                                    {item.retryCount ?? 0}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Xử lý lúc:</span>
                                  <span className="font-medium text-[#161514]">
                                    {formatDateTime(item.processedAt)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Desktop */}
                      <td className="hidden lg:table-cell px-4 py-3.5 text-center">
                        <input
                          type="checkbox"
                          checked={selectedImages.includes(item.imageId)}
                          onChange={() => handleSelectOne(item.imageId)}
                          className="accent-[#161514] cursor-pointer"
                        />
                      </td>
                      <td className="hidden lg:table-cell px-4 py-3.5">
                        <div
                          className="h-16 w-20 cursor-pointer shrink-0 overflow-hidden border border-[#E5E0D8] bg-[#F3EFE6] transition-opacity hover:opacity-80"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewImageId(item.imageId);
                          }}
                        >
                          <ImageWithFallback
                            src={resolveImageUrl(item.imageUrl, item.imageId)}
                            alt={`Ảnh ${item.imageId}`}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      </td>
                      <td className="hidden lg:table-cell px-4 py-3.5 font-mono font-semibold text-[#161514]">
                        #{item.imageId}
                      </td>
                      <td className="hidden lg:table-cell px-4 py-3.5">
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="hidden lg:table-cell px-4 py-3.5 text-right text-[#6B655D]">
                        {item.retryCount ?? 0}
                      </td>
                      <td className="hidden lg:table-cell px-4 py-3.5 text-[#6B655D]">
                        {formatDateTime(item.processedAt)}
                      </td>
                      <td className="hidden lg:table-cell px-4 py-3.5 text-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewImageId(item.imageId);
                          }}
                          className="inline-flex cursor-pointer items-center justify-center border border-[#D8D2C5] bg-white p-2 text-[#161514] transition hover:border-[#161514] hover:bg-[#161514] hover:text-[#FAF8F5]"
                          title="Xem ảnh chi tiết"
                        >
                          <FiEye className="size-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {previewImageId && (
              <ImagePreviewModal
                imageId={previewImageId}
                onClose={() => setPreviewImageId(null)}
              />
            )}

            <div className="flex items-center justify-between border-t border-[#E5E0D8] bg-[#FAF8F5] px-4 py-3 text-xs text-[#6B655D]">
              <span>
                Tổng cộng{" "}
                <strong className="text-[#161514]">
                  {itemsQuery.data?.totalElements ?? displayItems.length}
                </strong>{" "}
                ảnh
                {statusFilter !== "ALL" && " (đã lọc)"}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={itemPage <= 1}
                  onClick={() => setItemPage((c) => Math.max(1, c - 1))}
                  className="inline-flex cursor-pointer items-center gap-1 border border-[#D8D2C5] bg-white px-3 py-1.5 font-semibold uppercase tracking-wider text-[#161514] disabled:cursor-not-allowed disabled:opacity-40 hover:border-[#161514] transition"
                >
                  <FiChevronLeft className="size-3.5" /> Trước
                </button>

                <span className="px-2 font-medium text-[#161514]">
                  Trang {itemPage} / {itemsQuery.data?.totalPages ?? 1}
                </span>

                <button
                  type="button"
                  disabled={!itemsQuery.data?.hasNext}
                  onClick={() => setItemPage((c) => c + 1)}
                  className="inline-flex cursor-pointer items-center gap-1 border border-[#D8D2C5] bg-white px-3 py-1.5 font-semibold uppercase tracking-wider text-[#161514] disabled:cursor-not-allowed disabled:opacity-40 hover:border-[#161514] transition"
                >
                  Sau <FiChevronRight className="size-3.5" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
