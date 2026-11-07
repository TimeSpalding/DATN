import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  FiChevronLeft,
  FiChevronRight,
  FiRefreshCw,
  FiRotateCcw,
  FiTrash2,
} from "react-icons/fi";
import Swal from "sweetalert2";
import { ImageWithFallback } from "../../components/common/ImageWithFallback";
import { getTrashImageApiUrl } from "../../services/imageService";
import { ImagePreviewModal } from "../../components/common/ImagePreviewModal";
import {
  getTrashImages,
  getTrashPolicy,
  permanentlyDeleteAllTrashImages,
  permanentlyDeleteSelectedTrashImages,
  permanentlyDeleteTrashImage,
  restoreAllTrashImages,
  restoreSelectedTrashImages,
  restoreTrashImage,
} from "../../services/adminTrashService";
import { formatDateTime } from "../../utils/formatDateTime";

const getApiErrorMessage = (error, fallback) => {
  return (
    error?.response?.data?.error?.message ||
    error?.response?.data?.message ||
    error?.message ||
    fallback
  );
};

const formatFileSize = (value) => {
  if (!value) return "0 MB";
  return `${(value / 1024 / 1024).toFixed(2)} MB`;
};

export const AdminTrash = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [feedback, setFeedback] = useState("");
  const [selectedImageIds, setSelectedImageIds] = useState([]);
  const [previewImageId, setPreviewImageId] = useState(null);

  const trashQuery = useQuery({
    queryKey: ["admin-trash-images", page],
    queryFn: () => getTrashImages({ page, size: 10 }),
    refetchInterval: 10000,
  });

  const policyQuery = useQuery({
    queryKey: ["admin-trash-policy"],
    queryFn: getTrashPolicy,
  });

  const restoreMutation = useMutation({
    mutationFn: restoreTrashImage,
    onSuccess: (image) => {
      const restoredJobText = image?.restoredJobId
        ? ` và gán vào tiến trình #${image.restoredJobId}`
        : "";
      setFeedback(`Đã khôi phục ảnh #${image.id} thành công${restoredJobText}.`);
      queryClient.invalidateQueries({ queryKey: ["admin-trash-images"] });
      queryClient.invalidateQueries({ queryKey: ["admin-indexing-jobs"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard-stats"] });
    },
    onError: (error) => {
      setFeedback(getApiErrorMessage(error, "Không thể khôi phục ảnh."));
    },
  });

  const permanentDeleteMutation = useMutation({
    mutationFn: permanentlyDeleteTrashImage,
    onSuccess: () => {
      setFeedback("Đã xóa vĩnh viễn ảnh khỏi hệ thống.");
      queryClient.invalidateQueries({ queryKey: ["admin-trash-images"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard-stats"] });
    },
    onError: (error) => {
      setFeedback(getApiErrorMessage(error, "Không thể xóa vĩnh viễn ảnh."));
    },
  });

  const restoreSelectedMutation = useMutation({
    mutationFn: restoreSelectedTrashImages,
    onSuccess: (result) => {
      const affectedCount = Number(result?.affectedCount ?? 0);
      setFeedback(`Đã khôi phục ${affectedCount} ảnh đã chọn.`);
      setSelectedImageIds([]);
      queryClient.invalidateQueries({ queryKey: ["admin-trash-images"] });
      queryClient.invalidateQueries({ queryKey: ["admin-indexing-jobs"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard-stats"] });
    },
    onError: (error) => {
      setFeedback(getApiErrorMessage(error, "Không thể khôi phục ảnh đã chọn."));
    },
  });

  const deleteSelectedMutation = useMutation({
    mutationFn: permanentlyDeleteSelectedTrashImages,
    onSuccess: (result) => {
      const affectedCount = Number(result?.affectedCount ?? 0);
      setFeedback(`Đã xóa vĩnh viễn ${affectedCount} ảnh đã chọn.`);
      setSelectedImageIds([]);
      queryClient.invalidateQueries({ queryKey: ["admin-trash-images"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard-stats"] });
    },
    onError: (error) => {
      setFeedback(getApiErrorMessage(error, "Không thể xóa vĩnh viễn ảnh đã chọn."));
    },
  });

  const restoreAllMutation = useMutation({
    mutationFn: restoreAllTrashImages,
    onSuccess: (result) => {
      const affectedCount = Number(result?.affectedCount ?? 0);
      setFeedback(`Đã khôi phục toàn bộ ${affectedCount} ảnh trong thùng rác.`);
      setSelectedImageIds([]);
      queryClient.invalidateQueries({ queryKey: ["admin-trash-images"] });
      queryClient.invalidateQueries({ queryKey: ["admin-indexing-jobs"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard-stats"] });
    },
    onError: (error) => {
      setFeedback(getApiErrorMessage(error, "Không thể khôi phục toàn bộ ảnh."));
    },
  });

  const deleteAllMutation = useMutation({
    mutationFn: permanentlyDeleteAllTrashImages,
    onSuccess: (result) => {
      const affectedCount = Number(result?.affectedCount ?? 0);
      setFeedback(`Đã xóa vĩnh viễn toàn bộ ${affectedCount} ảnh trong thùng rác.`);
      setSelectedImageIds([]);
      queryClient.invalidateQueries({ queryKey: ["admin-trash-images"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard-stats"] });
    },
    onError: (error) => {
      setFeedback(
        getApiErrorMessage(error, "Không thể xóa toàn bộ ảnh trong thùng rác.")
      );
    },
  });

  const pagination = {
    page: trashQuery.data?.page || page,
    totalPages: trashQuery.data?.totalPages || 1,
    totalElements: trashQuery.data?.totalElements || 0,
    hasNext: trashQuery.data?.hasNext,
    hasPrevious: trashQuery.data?.hasPrevious,
  };

  const trashItems = trashQuery.data?.content || [];
  const retentionDays = policyQuery.data?.retentionDays ?? 30;
  const selectedCount = selectedImageIds.length;
  const currentPageImageIds = trashItems.map((item) => item.id);

  const allCurrentPageSelected =
    currentPageImageIds.length > 0 &&
    currentPageImageIds.every((id) => selectedImageIds.includes(id));

  const isAnyMutationPending =
    restoreMutation.isPending ||
    permanentDeleteMutation.isPending ||
    restoreSelectedMutation.isPending ||
    deleteSelectedMutation.isPending ||
    restoreAllMutation.isPending ||
    deleteAllMutation.isPending;

  const toggleSelectImage = (imageId) => {
    setSelectedImageIds((prev) =>
      prev.includes(imageId)
        ? prev.filter((id) => id !== imageId)
        : [...prev, imageId]
    );
  };

  const toggleSelectAllCurrentPage = () => {
    setSelectedImageIds((prev) => {
      if (allCurrentPageSelected) {
        return prev.filter((id) => !currentPageImageIds.includes(id));
      }
      const next = new Set(prev);
      currentPageImageIds.forEach((id) => next.add(id));
      return [...next];
    });
  };

  const confirmRestore = async (imageId) => {
    const result = await Swal.fire({
      title: "Khôi phục ảnh này?",
      text: "Ảnh sẽ được đưa trở lại kho dữ liệu tìm kiếm.",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#161514",
      confirmButtonText: "Khôi phục",
      cancelButtonText: "Hủy",
    });

    if (result.isConfirmed) {
      restoreMutation.mutate(imageId);
    }
  };

  const confirmPermanentDelete = async (imageId) => {
    const result = await Swal.fire({
      title: "Xóa vĩnh viễn ảnh này?",
      text: "Thao tác này xóa dữ liệu khỏi hệ thống và không thể hoàn tác.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Xóa vĩnh viễn",
      cancelButtonText: "Hủy",
      confirmButtonColor: "#C05A39",
    });

    if (result.isConfirmed) {
      permanentDeleteMutation.mutate(imageId);
    }
  };

  const confirmRestoreSelected = async () => {
    if (selectedCount === 0) return;

    const result = await Swal.fire({
      title: `Khôi phục ${selectedCount} ảnh đã chọn?`,
      text: "Các ảnh đã chọn sẽ được đưa ra khỏi thùng rác.",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#161514",
      confirmButtonText: "Khôi phục đã chọn",
      cancelButtonText: "Hủy",
    });

    if (result.isConfirmed) {
      restoreSelectedMutation.mutate(selectedImageIds);
    }
  };

  const confirmDeleteSelected = async () => {
    if (selectedCount === 0) return;

    const result = await Swal.fire({
      title: `Xóa vĩnh viễn ${selectedCount} ảnh đã chọn?`,
      text: "Không thể hoàn tác thao tác này.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Xóa đã chọn",
      cancelButtonText: "Hủy",
      confirmButtonColor: "#C05A39",
    });

    if (result.isConfirmed) {
      deleteSelectedMutation.mutate(selectedImageIds);
    }
  };

  const confirmRestoreAll = async () => {
    if (!pagination.totalElements) return;

    const result = await Swal.fire({
      title: "Khôi phục toàn bộ ảnh trong thùng rác?",
      text: `Tổng cộng ${pagination.totalElements} ảnh sẽ được khôi phục.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#161514",
      confirmButtonText: "Khôi phục tất cả",
      cancelButtonText: "Hủy",
    });

    if (result.isConfirmed) {
      restoreAllMutation.mutate();
    }
  };

  const confirmDeleteAll = async () => {
    if (!pagination.totalElements) return;

    const result = await Swal.fire({
      title: "Xóa vĩnh viễn toàn bộ thùng rác?",
      text: `Tổng cộng ${pagination.totalElements} ảnh sẽ bị xóa vĩnh viễn và không thể hoàn tác.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Xóa tất cả",
      cancelButtonText: "Hủy",
      confirmButtonColor: "#C05A39",
    });

    if (result.isConfirmed) {
      deleteAllMutation.mutate();
    }
  };

  return (
    <section className="mx-auto flex max-w-7xl flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 pb-6 border-b border-[#E5E0D8] sm:flex-row sm:items-end">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#C05A39] mb-1">
            LƯU TRỮ TẠM THỜI
          </p>
          <h1 className="font-serif-luxury text-2xl sm:text-3xl font-normal text-[#161514]">
            Quản Lý Thùng Rác Hệ Thống
          </h1>
          <p className="mt-1 text-xs text-[#6B655D]">
            Hình ảnh đã xóa được lưu tạm trong {retentionDays} ngày trước khi dọn dẹp vĩnh viễn khỏi máy chủ lưu trữ.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            trashQuery.refetch();
            policyQuery.refetch();
          }}
          className="inline-flex items-center justify-center gap-2 border border-[#D8D2C5] bg-white px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-[#161514] transition hover:border-[#161514] cursor-pointer self-start sm:self-auto"
        >
          <FiRefreshCw className="size-3.5" />
          <span>Làm mới</span>
        </button>
      </div>

      <div className="border border-[#E5E0D8] bg-white p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center justify-between lg:justify-start gap-4">
            <label className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#161514] cursor-pointer">
              <input
                type="checkbox"
                checked={allCurrentPageSelected}
                onChange={toggleSelectAllCurrentPage}
                disabled={!trashItems.length || isAnyMutationPending}
                className="size-4 accent-[#161514]"
              />
              <span className="hidden sm:inline">Chọn tất cả trang hiện tại</span>
              <span className="sm:hidden">Chọn tất cả</span>
            </label>

            <p className="text-xs text-[#6B655D] whitespace-nowrap">
              Đã chọn: <strong className="text-[#161514]">{selectedCount}</strong>
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            <button
              type="button"
              onClick={confirmRestoreSelected}
              disabled={!selectedCount || isAnyMutationPending}
              className="inline-flex cursor-pointer w-full sm:w-auto items-center justify-center gap-2 border border-[#161514] bg-white px-3.5 py-2 text-xs font-semibold uppercase tracking-wider text-[#161514] transition hover:bg-[#161514] hover:text-[#FAF8F5] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Khôi phục đã chọn
            </button>

            <button
              type="button"
              onClick={confirmDeleteSelected}
              disabled={!selectedCount || isAnyMutationPending}
              className="inline-flex cursor-pointer w-full sm:w-auto items-center justify-center gap-2 border border-[#C05A39] bg-white px-3.5 py-2 text-xs font-semibold uppercase tracking-wider text-[#C05A39] transition hover:bg-[#C05A39] hover:text-[#FAF8F5] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Xóa đã chọn
            </button>

            <button
              type="button"
              onClick={confirmRestoreAll}
              disabled={!pagination.totalElements || isAnyMutationPending}
              className="inline-flex cursor-pointer w-full sm:w-auto items-center justify-center gap-2 bg-[#161514] px-3.5 py-2 text-xs font-semibold uppercase tracking-wider text-[#FAF8F5] transition hover:bg-[#2A2725] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Khôi phục tất cả
            </button>

            <button
              type="button"
              onClick={confirmDeleteAll}
              disabled={!pagination.totalElements || isAnyMutationPending}
              className="inline-flex cursor-pointer w-full sm:w-auto items-center justify-center gap-2 bg-[#C05A39] px-3.5 py-2 text-xs font-semibold uppercase tracking-wider text-[#FAF8F5] transition hover:bg-[#A64B2E] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Xóa tất cả
            </button>
          </div>
        </div>
      </div>

      {feedback && (
        <div className="border border-[#9E7A52]/40 bg-[#F3EFE6] px-4 py-3 text-xs text-[#161514]">
          {feedback}
        </div>
      )}

      <div className="border border-[#E5E0D8] bg-white">
        <div className="border-b border-[#E5E0D8] px-5 py-4 bg-[#FAF8F5] flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-[#161514]">
            Danh sách hình ảnh đã xóa tạm
          </h3>
          <p className="text-xs text-[#6B655D]">
            Tổng số: <strong className="text-[#161514]">{pagination.totalElements}</strong> ảnh
          </p>
        </div>

        {trashQuery.isLoading ? (
          <div className="p-10 text-center text-xs text-[#8C8476]">
            Đang tải dữ liệu thùng rác...
          </div>
        ) : trashItems.length === 0 ? (
          <div className="p-14 text-center text-xs text-[#8C8476]">
            Thùng rác hệ thống hiện đang trống.
          </div>
        ) : (
          <div className="divide-y divide-[#E5E0D8]">
            {trashItems.map((item) => (
              <article
                key={item.id}
                className="grid gap-4 p-4 md:grid-cols-[150px_1fr_auto] lg:grid-cols-[170px_1fr_auto] hover:bg-[#FAF8F5]/60 transition-colors"
              >
                <div className="relative h-44 md:h-36 overflow-hidden bg-[#F3EFE6] border border-[#E5E0D8] group">
                  <div className="absolute top-2 left-2 z-10">
                    <label
                      className="inline-flex items-center gap-1.5 bg-[#FAF8F5]/95 border border-[#E5E0D8] px-2 py-1 text-xs cursor-pointer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={selectedImageIds.includes(item.id)}
                        onChange={() => toggleSelectImage(item.id)}
                        disabled={isAnyMutationPending}
                        className="size-4 accent-[#161514] cursor-pointer"
                      />
                    </label>
                  </div>

                  <ImageWithFallback
                    imageId={item.id}
                    src={getTrashImageApiUrl(item.id)}
                    alt={item.originalFileName || `Ảnh ${item.id}`}
                    className="h-full w-full object-cover cursor-pointer transition-transform duration-300 group-hover:scale-105"
                    onClick={() => setPreviewImageId(item.id)}
                  />
                </div>

                <div className="space-y-1 text-xs text-[#6B655D] flex flex-col justify-center">
                  <p className="text-sm font-semibold text-[#161514] truncate">
                    #{item.id} &bull; {item.originalFileName || "Hình ảnh lưu trữ"}
                  </p>
                  <p>Dung lượng: {formatFileSize(item.fileSize)} ({item.mimeType || "image/jpeg"})</p>
                  <p>
                    Kích thước khung hình: {item.width || "--"} &times; {item.height || "--"} px
                  </p>
                  <p>Thời điểm xóa: {formatDateTime(item.deletedAt)}</p>
                  <p>Hạn dọn dẹp tự động: {formatDateTime(item.expiresAt)}</p>
                  <p className="font-semibold text-[#C05A39] pt-0.5">
                    Thời hạn lưu giữ còn lại: {Number(item.daysUntilPermanentDeletion ?? 0)} ngày
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 md:flex md:flex-col md:items-stretch md:justify-center">
                  <button
                    type="button"
                    onClick={() => confirmRestore(item.id)}
                    disabled={isAnyMutationPending}
                    className="inline-flex cursor-pointer w-full items-center justify-center gap-1.5 border border-[#161514] bg-white px-3.5 py-2 text-xs font-semibold uppercase tracking-wider text-[#161514] transition hover:bg-[#161514] hover:text-[#FAF8F5] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <FiRotateCcw className="size-3.5" />
                    <span>Khôi phục</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => confirmPermanentDelete(item.id)}
                    disabled={isAnyMutationPending}
                    className="inline-flex cursor-pointer w-full items-center justify-center gap-1.5 border border-[#C05A39] bg-white px-3.5 py-2 text-xs font-semibold uppercase tracking-wider text-[#C05A39] transition hover:bg-[#C05A39] hover:text-[#FAF8F5] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <FiTrash2 className="size-3.5" />
                    <span>Xóa vĩnh viễn</span>
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between border-t border-[#E5E0D8] bg-[#FAF8F5] px-4 py-3 text-xs text-[#6B655D]">
          <button
            type="button"
            disabled={!pagination.hasPrevious}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            className="inline-flex cursor-pointer items-center gap-1 border border-[#D8D2C5] bg-white px-3 py-1.5 font-semibold uppercase tracking-wider text-[#161514] disabled:cursor-not-allowed disabled:opacity-40 hover:border-[#161514]"
          >
            <FiChevronLeft className="size-3.5" />
            <span>Trước</span>
          </button>

          <span>
            Trang <strong className="text-[#161514]">{pagination.page}</strong> /{" "}
            <strong className="text-[#161514]">{pagination.totalPages}</strong>
          </span>

          <button
            type="button"
            disabled={!pagination.hasNext}
            onClick={() => setPage((current) => current + 1)}
            className="inline-flex cursor-pointer items-center gap-1 border border-[#D8D2C5] bg-white px-3 py-1.5 font-semibold uppercase tracking-wider text-[#161514] disabled:cursor-not-allowed disabled:opacity-40 hover:border-[#161514]"
          >
            <span>Sau</span>
            <FiChevronRight className="size-3.5" />
          </button>
        </div>
      </div>

      {previewImageId && (
        <ImagePreviewModal
          imageId={previewImageId}
          imageUrl={getTrashImageApiUrl(previewImageId)}
          onClose={() => setPreviewImageId(null)}
        />
      )}
    </section>
  );
};
