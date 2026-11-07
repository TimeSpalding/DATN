import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  FiChevronLeft,
  FiChevronRight,
  FiImage,
  FiRefreshCw,
  FiRotateCcw,
  FiTrash2,
  FiUploadCloud,
  FiEye,
} from "react-icons/fi";
import {
  getIndexingJobItems,
  getIndexingJobs,
  retryIndexingJob,
  deleteMultipleIndexingJobs,
  deleteIndexingJob,
} from "../../services/adminIndexingService";
import { ImageWithFallback } from "../../components/common/ImageWithFallback";
import { uploadImages } from "../../services/imageService";
import { validateFile } from "../../utils/fileValidation";
import Swal from "sweetalert2";
import { SmoothProgressBar } from "../../components/ui/SmoothProgressBar";
import { formatDateTime } from "../../utils/formatDateTime";

const imagesPerPage = 20;

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

const StatusBadge = ({ status }) => (
  <span
    className={`inline-flex items-center border px-2.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-wider ${
      statusStyles[status] || "border-[#E5E0D8] bg-[#FAF8F5] text-[#6B655D]"
    }`}
  >
    {status || "UNKNOWN"}
  </span>
);

const StatCard = ({ label, value, hint }) => (
  <div className="border border-[#E5E0D8] bg-white p-5">
    <p className="text-[11px] font-semibold uppercase tracking-wider text-[#6B655D]">
      {label}
    </p>
    <p className="mt-2 font-serif-luxury text-2xl text-[#161514]">{value}</p>
    {hint && <p className="mt-1.5 text-[11px] text-[#8C8476]">{hint}</p>}
  </div>
);

export const AdminIndexing = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [uploadMessage, setUploadMessage] = useState("");
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [jobPage, setJobPage] = useState(1);
  const [itemPage, setItemPage] = useState(1);
  const [localImages, setLocalImages] = useState([]);
  const [page, setPage] = useState(1);
  const previewUrlsRef = useRef([]);
  const [retryingJobId, setRetryingJobId] = useState(null);
  const [selectedJobIds, setSelectedJobIds] = useState([]);

  const [brandEnabled, setBrandEnabled] = useState(false);
  const [uploadBrand, setUploadBrand] = useState("");
  const [jobStatusFilter, setJobStatusFilter] = useState("ALL");

  const jobsQuery = useQuery({
    queryKey: ["admin-indexing-jobs", page, jobStatusFilter],
    queryFn: () =>
      getIndexingJobs({
        page,
        size: 10,
        status: jobStatusFilter === "ALL" ? undefined : jobStatusFilter,
      }),
    refetchInterval: (query) => {
      const jobs = query.state.data?.content || [];
      return jobs.some(
        (job) => job.status === "RUNNING" || job.status === "PENDING"
      )
        ? 5000
        : false;
    },
  });

  const deleteJobMutation = useMutation({
    mutationFn: deleteIndexingJob,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-indexing-jobs"] });
      setSelectedJobIds((prev) => prev.filter((id) => id !== selectedJobId));
      Swal.fire({
        title: "Đã xóa tiến trình",
        text: "Tiến trình đồng bộ đã được xóa khỏi hệ thống.",
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
      });
    },
    onError: (error) => {
      Swal.fire({
        title: "Không thể xóa",
        text: "Đã xảy ra lỗi khi xóa tiến trình đồng bộ.",
        icon: "error",
      });
      console.error(error);
    },
  });

  const deleteMultipleJobsMutation = useMutation({
    mutationFn: deleteMultipleIndexingJobs,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-indexing-jobs"] });
      setSelectedJobIds([]);
      Swal.fire({
        title: "Hoàn tất",
        text: "Đã xóa các tiến trình được chọn.",
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
      });
    },
    onError: (error) => {
      Swal.fire({
        title: "Không thể xóa",
        text: "Đã xảy ra lỗi khi xóa hàng loạt tiến trình.",
        icon: "error",
      });
      console.error(error);
    },
  });

  const jobs = jobsQuery.data?.content || [];

  const handleSelectJob = (jobId, isChecked) => {
    if (isChecked) {
      setSelectedJobIds((prev) => [...prev, jobId]);
    } else {
      setSelectedJobIds((prev) => prev.filter((id) => id !== jobId));
    }
  };

  const isAllCurrentPageSelected =
    jobs.length > 0 && jobs.every((job) => selectedJobIds.includes(job.id));

  const handleSelectAllCurrentPage = (isChecked) => {
    if (isChecked) {
      const newIds = jobs
        .map((j) => j.id)
        .filter((id) => !selectedJobIds.includes(id));
      setSelectedJobIds((prev) => [...prev, ...newIds]);
    } else {
      const currentPageIds = jobs.map((j) => j.id);
      setSelectedJobIds((prev) =>
        prev.filter((id) => !currentPageIds.includes(id))
      );
    }
  };

  const handleConfirmBulkDelete = () => {
    if (selectedJobIds.length === 0) return;
    Swal.fire({
      title: "Xác nhận xóa tiến trình?",
      text: `Xóa ${selectedJobIds.length} tiến trình đã chọn và toàn bộ ảnh liên quan? Thao tác này không thể hoàn tác.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#C05A39",
      cancelButtonColor: "#6B655D",
      confirmButtonText: `Xóa ${selectedJobIds.length} tiến trình`,
      cancelButtonText: "Hủy",
    }).then((result) => {
      if (result.isConfirmed) {
        deleteMultipleJobsMutation.mutate(selectedJobIds);
      }
    });
  };

  const pagination = {
    page: jobsQuery.data?.page || page,
    totalPages: jobsQuery.data?.totalPages || 1,
    totalElements: jobsQuery.data?.totalElements || jobs.length,
    hasNext: jobsQuery.data?.hasNext,
    hasPrevious: jobsQuery.data?.hasPrevious,
  };

  const effectiveSelectedJobId = selectedJobId ?? jobs[0]?.id ?? null;

  const itemsQuery = useQuery({
    queryKey: ["admin-indexing-job-items", effectiveSelectedJobId, itemPage],
    queryFn: () =>
      getIndexingJobItems(effectiveSelectedJobId, { page: itemPage, size: 10 }),
    enabled: !!effectiveSelectedJobId,
    refetchInterval: (query) => {
      const statuses =
        query.state.data?.content?.map((item) => item.status) || [];
      return statuses.some(
        (status) => status === "PENDING" || status === "PROCESSING"
      )
        ? 5000
        : false;
    },
  });

  const uploadImagesMutation = useMutation({
    mutationFn: uploadImages,
    onSuccess: (uploadedImages) => {
      const nextSelectedJobId = uploadedImages[0]?.indexJobId ?? null;
      const mappedImages = uploadedImages.map((image) => ({
        id: image.imageId,
        fileName: image.originalFileName,
        size: image.fileSize,
        previewUrl: image.thumbnailUrl || image.fileUrl,
        status: image.status,
        width: image.width,
        height: image.height,
      }));

      setLocalImages((current) => {
        const withoutUploading = current.filter(
          (image) => image.status !== "UPLOADING"
        );
        return [...mappedImages, ...withoutUploading];
      });
      setUploadMessage(
        `Tải lên thành công ${uploadedImages.length} ảnh. Hệ thống đang đồng bộ chỉ mục nền.`
      );
      setJobPage(1);
      setPage(1);
      setItemPage(1);
      if (nextSelectedJobId) {
        setSelectedJobId(nextSelectedJobId);
      }
      queryClient.invalidateQueries({ queryKey: ["admin-indexing-jobs"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard-stats"] });
    },
    onError: (error) => {
      setLocalImages((current) =>
        current.map((image) =>
          image.status === "UPLOADING"
            ? { ...image, status: "UPLOAD_FAILED" }
            : image
        )
      );
      setUploadMessage(getApiErrorMessage(error, "Tải ảnh lên không thành công"));
    },
  });

  const retryJobMutation = useMutation({
    mutationFn: retryIndexingJob,
    onSuccess: (job) => {
      setSelectedJobId(job.id);
      setItemPage(1);
      setUploadMessage(`Đã gửi yêu cầu chạy lại tiến trình #${job.id}.`);
      queryClient.invalidateQueries({ queryKey: ["admin-indexing-jobs"] });
    },
    onError: (error) => {
      setUploadMessage(
        getApiErrorMessage(error, "Không thể chạy lại tiến trình đồng bộ")
      );
    },
    onSettled: () => {
      setRetryingJobId(null);
    },
  });

  useEffect(() => {
    const previewUrls = previewUrlsRef.current;
    return () => {
      previewUrls.forEach((previewUrl) => URL.revokeObjectURL(previewUrl));
    };
  }, []);

  const totalImagePages = Math.max(
    1,
    Math.ceil(localImages.length / imagesPerPage)
  );
  const visibleImages = useMemo(() => {
    const start = (jobPage - 1) * imagesPerPage;
    return localImages.slice(start, start + imagesPerPage);
  }, [jobPage, localImages]);

  const selectedJob =
    jobs.find((job) => job.id === effectiveSelectedJobId) || null;

  useEffect(() => {
    if (
      selectedJob &&
      selectedJob.status === "COMPLETED" &&
      selectedJob.progressPercentage === 100
    ) {
      setUploadMessage(
        `Đồng bộ hoàn tất ${selectedJob.totalImages} hình ảnh!`
      );
    }
  }, [
    selectedJob?.status,
    selectedJob?.progressPercentage,
    selectedJob?.totalImages,
  ]);

  const handleUploadPreview = (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    const validImages = files.filter(validateFile).map((file) => {
      if (brandEnabled && uploadBrand.trim()) {
        const newName = `_BRAND_${uploadBrand.trim()}_BRAND_${file.name}`;
        return new File([file], newName, {
          type: file.type,
          lastModified: file.lastModified,
        });
      }
      return file;
    });
    const invalidCount = files.length - validImages.length;
    const previews = validImages.map((file) => {
      const previewUrl = URL.createObjectURL(file);
      previewUrlsRef.current.push(previewUrl);

      return {
        id: `${file.name}-${file.lastModified}-${Date.now()}-${Math.random()
          .toString(16)
          .slice(2)}`,
        fileName: file.name,
        size: file.size,
        previewUrl,
        status: "UPLOADING",
      };
    });

    setLocalImages((current) => [...previews, ...current]);
    setJobPage(1);
    setUploadMessage(
      invalidCount > 0
        ? `Đang tải lên ${validImages.length} ảnh hợp lệ. ${invalidCount} tệp bị bỏ qua do sai định dạng hoặc vượt 10MB.`
        : `Đang tải lên ${validImages.length} ảnh và khởi tạo tiến trình đồng bộ.`
    );
    event.target.value = "";

    if (validImages.length > 0) {
      uploadImagesMutation.mutate(validImages);
    }
  };

  const handleRemoveImage = (imageId) => {
    setLocalImages((current) => {
      const image = current.find((item) => item.id === imageId);
      if (image?.previewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(image.previewUrl);
        previewUrlsRef.current = previewUrlsRef.current.filter(
          (previewUrl) => previewUrl !== image.previewUrl
        );
      }

      const nextImages = current.filter((item) => item.id !== imageId);
      const nextTotalPages = Math.max(
        1,
        Math.ceil(nextImages.length / imagesPerPage)
      );
      setJobPage((currentPage) => Math.min(currentPage, nextTotalPages));
      return nextImages;
    });
  };

  return (
    <section className="mx-auto flex max-w-7xl flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 pb-6 border-b border-[#E5E0D8] sm:flex-row sm:items-end">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#C05A39] mb-1">
            CHỈ MỤC TÌM KIẾM SẢN PHẨM
          </p>
          <h1 className="font-serif-luxury text-2xl sm:text-3xl font-normal text-[#161514]">
            Tải Ảnh &amp; Đồng Bộ Dữ Liệu Tìm Kiếm
          </h1>
          <p className="mt-1 text-xs text-[#6B655D]">
            Nhập kho hình ảnh trang phục và theo dõi trạng thái trích xuất đặc trưng phục vụ tìm kiếm
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            jobsQuery.refetch();
            if (effectiveSelectedJobId) {
              itemsQuery.refetch();
            }
          }}
          className="inline-flex items-center justify-center gap-2 border border-[#D8D2C5] bg-white px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-[#161514] transition hover:border-[#161514] cursor-pointer self-start sm:self-auto"
        >
          <FiRefreshCw className="size-3.5" />
          <span>Làm mới</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Tiến trình đồng bộ"
          value={pagination.totalElements}
          hint="Tổng số tiến trình đã ghi nhận"
        />
        <StatCard
          label="Tiến trình đang chọn"
          value={selectedJob ? `#${selectedJob.id}` : "--"}
          hint={selectedJob?.status || "Chưa chọn tiến trình"}
        />
        <StatCard
          label="Ảnh vừa tải lên"
          value={localImages.length}
          hint="Số lượng ảnh trong phiên làm việc hiện tại"
        />
        <StatCard
          label="Số ảnh thuộc tiến trình"
          value={itemsQuery.data?.totalElements ?? 0}
          hint="Tổng số ảnh của tiến trình đang xem"
        />
      </div>

      <div className="border border-[#E5E0D8] bg-white">
        <div className="border-b border-[#E5E0D8] p-5">
          <div className="mb-4 border border-[#E5E0D8] bg-[#FAF8F5] p-4">
            <label className="flex items-center gap-2.5 cursor-pointer w-fit">
              <input
                type="checkbox"
                checked={brandEnabled}
                onChange={(e) => setBrandEnabled(e.target.checked)}
                className="size-4 cursor-pointer accent-[#161514]"
              />
              <span className="text-xs font-semibold uppercase tracking-wider text-[#161514]">
                Gán nhãn thương hiệu / Bộ sưu tập cho lô tải lên
              </span>
            </label>
            {brandEnabled && (
              <div className="mt-3">
                <input
                  type="text"
                  placeholder="Nhập tên bộ sưu tập hoặc thương hiệu (ví dụ: Grand Atelier AW26)"
                  value={uploadBrand}
                  onChange={(e) => setUploadBrand(e.target.value)}
                  className="w-full max-w-md border border-[#D8D2C5] bg-white px-3 py-2 text-xs text-[#161514] focus:border-[#161514] focus:outline-none"
                />
                <p className="mt-1.5 text-[11px] text-[#8C8476]">
                  Tất cả hình ảnh trong đợt tải lên này sẽ tự động gắn nhãn định danh trên.
                </p>
              </div>
            )}
          </div>

          <label className="flex cursor-pointer flex-col items-center justify-center border border-dashed border-[#C5BDB0] bg-[#FAF8F5] px-6 py-9 text-center transition hover:border-[#161514] hover:bg-[#F3EFE6]/60">
            <FiUploadCloud className="size-7 text-[#C05A39]" />
            <span className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#161514]">
              Chọn tệp ảnh trang phục để tải lên &amp; lập chỉ mục
            </span>
            <span className="mt-1 text-[11px] text-[#8C8476]">
              Hỗ trợ định dạng JPG, PNG, WebP &bull; Tối đa 10 MB mỗi ảnh
            </span>
            <input
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp"
              onChange={handleUploadPreview}
              disabled={uploadImagesMutation.isPending}
              className="sr-only"
            />
          </label>

          {uploadMessage && (
            <div className="mt-4 border border-[#9E7A52]/40 bg-[#F3EFE6] px-4 py-3 text-xs text-[#161514]">
              {uploadMessage}
            </div>
          )}

          {selectedJob && (
            <div className="mt-6">
              <SmoothProgressBar
                jobId={selectedJob.id}
                actualProgress={Number(selectedJob.progressPercentage || 0)}
                status={selectedJob.status}
              />

              <div className="flex flex-col gap-3 border border-[#E5E0D8] bg-[#FAF8F5] p-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#161514]">
                    Tiến trình đang theo dõi: #{selectedJob.id}
                  </p>
                  <p className="mt-1 text-xs text-[#6B655D]">
                    Trạng thái hiện tại: <strong className="text-[#161514]">{selectedJob.status}</strong>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => retryJobMutation.mutate(selectedJob.id)}
                  disabled={retryJobMutation.isPending}
                  className="inline-flex cursor-pointer items-center justify-center gap-2 border border-[#D8D2C5] bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[#161514] transition hover:border-[#161514] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <FiRotateCcw className="size-3.5" />
                  <span>{retryJobMutation.isPending ? "Đang gửi yêu cầu..." : "Chạy lại tiến trình"}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-[#161514]">
                Danh sách ảnh vừa tải lên
              </h3>
              <p className="text-xs text-[#8C8476] mt-0.5">
                {localImages.length} ảnh trong bộ nhớ tạm
              </p>
            </div>
            <div className="text-[11px] uppercase tracking-wider text-[#8C8476]">
              20 ảnh / trang
            </div>
          </div>

          {localImages.length === 0 ? (
            <div className="flex min-h-48 flex-col items-center justify-center border border-dashed border-[#D8D2C5] bg-[#FAF8F5]/60 p-8 text-center">
              <FiImage className="size-7 text-[#8C8476]" />
              <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-[#161514]">
                Chưa có ảnh mới trong phiên tải lên
              </p>
              <p className="mt-1 text-xs text-[#8C8476]">
                Hình ảnh tải lên sẽ hiển thị xem trước tại đây ngay khi bắt đầu xử lý.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {visibleImages.map((image) => (
                  <div
                    key={image.id}
                    className="group overflow-hidden border border-[#E5E0D8] bg-white"
                  >
                    <div className="relative aspect-[3/4] bg-[#F3EFE6]">
                      <ImageWithFallback
                        src={image.previewUrl}
                        imageId={typeof image.id === "number" ? image.id : undefined}
                        alt={image.fileName}
                        className="h-full w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(image.id)}
                        className="absolute right-2 top-2 inline-flex size-8 items-center justify-center bg-[#FAF8F5]/95 border border-[#E5E0D8] text-[#C05A39] opacity-0 transition hover:bg-[#C05A39] hover:text-[#FAF8F5] group-hover:opacity-100 focus:opacity-100 cursor-pointer"
                        aria-label={`Bỏ ảnh ${image.fileName}`}
                      >
                        <FiTrash2 className="size-3.5" />
                      </button>
                    </div>
                    <div className="p-3">
                      <p
                        className="truncate text-xs font-semibold text-[#161514]"
                        title={image.fileName}
                      >
                        {image.fileName}
                      </p>
                      <div className="mt-2 flex items-center justify-between gap-2 text-[11px] text-[#6B655D]">
                        <span>{formatFileSize(image.size)}</span>
                        <span className="border border-[#E5E0D8] bg-[#FAF8F5] px-2 py-0.5 text-[10px] font-semibold uppercase text-[#161514]">
                          {image.status}
                        </span>
                      </div>
                      {image.width && image.height && (
                        <p className="mt-1.5 text-[10.5px] text-[#8C8476]">
                          {image.width} &times; {image.height} px
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-[#E5E0D8] pt-4 text-xs text-[#6B655D]">
                <button
                  type="button"
                  disabled={jobPage <= 1}
                  onClick={() => setJobPage((current) => Math.max(1, current - 1))}
                  className="inline-flex items-center gap-1 border border-[#D8D2C5] bg-white px-3 py-1.5 font-semibold uppercase tracking-wider text-[#161514] disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
                >
                  <FiChevronLeft className="size-3.5" />
                  <span>Trước</span>
                </button>
                <span>
                  Trang <strong className="text-[#161514]">{jobPage}</strong> /{" "}
                  <strong className="text-[#161514]">{totalImagePages}</strong>
                </span>
                <button
                  type="button"
                  disabled={jobPage >= totalImagePages}
                  onClick={() =>
                    setJobPage((current) => Math.min(totalImagePages, current + 1))
                  }
                  className="inline-flex items-center gap-1 border border-[#D8D2C5] bg-white px-3 py-1.5 font-semibold uppercase tracking-wider text-[#161514] disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
                >
                  <span>Sau</span>
                  <FiChevronRight className="size-3.5" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Job Table */}
      <div className="border border-[#E5E0D8] bg-white">
        <div className="flex flex-col gap-4 border-b border-[#E5E0D8] p-5 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
            <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-[#161514]">
              Nhật ký tiến trình đồng bộ
            </h3>

            <div className="flex items-center gap-2">
              <span className="whitespace-nowrap text-xs text-[#6B655D]">
                Trạng thái:
              </span>
              <select
                value={jobStatusFilter}
                onChange={(e) => {
                  setJobStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="cursor-pointer border border-[#D8D2C5] bg-[#FAF8F5] px-3 py-1.5 text-xs text-[#161514] outline-none focus:border-[#161514]"
              >
                <option value="ALL">Tất cả</option>
                <option value="PENDING">PENDING</option>
                <option value="RUNNING">RUNNING</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="FAILED">FAILED</option>
                <option value="PARTIALLY_FAILED">PARTIALLY_FAILED</option>
              </select>
            </div>

            <div className="flex items-center gap-2.5 border border-[#E5E0D8] bg-[#FAF8F5] px-3 py-2 lg:hidden">
              <input
                type="checkbox"
                className="size-4 cursor-pointer accent-[#161514]"
                checked={isAllCurrentPageSelected}
                onChange={(e) => handleSelectAllCurrentPage(e.target.checked)}
                disabled={jobs.length === 0}
              />
              <span className="text-xs font-semibold uppercase tracking-wider text-[#161514]">
                Chọn tất cả
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleConfirmBulkDelete}
            disabled={
              selectedJobIds.length === 0 || deleteMultipleJobsMutation.isPending
            }
            className={`flex w-full cursor-pointer items-center justify-center gap-2 px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors md:w-auto ${
              selectedJobIds.length > 0 && !deleteMultipleJobsMutation.isPending
                ? "bg-[#C05A39] text-[#FAF8F5] hover:bg-[#A64B2E]"
                : "cursor-not-allowed bg-[#F3EFE6] text-[#8C8476]"
            }`}
          >
            {deleteMultipleJobsMutation.isPending ? (
              <FiRotateCcw className="size-3.5 animate-spin" />
            ) : (
              <FiTrash2 className="size-3.5" />
            )}
            <span>
              Xóa đã chọn {selectedJobIds.length > 0 ? `(${selectedJobIds.length})` : ""}
            </span>
          </button>
        </div>

        <div className="w-full lg:overflow-x-auto">
          <table className="w-full text-xs block lg:table lg:min-w-[1000px] lg:border-collapse">
            <thead className="hidden lg:table-header-group">
              <tr className="bg-[#FAF8F5] text-left text-[10.5px] font-semibold uppercase tracking-wider text-[#6B655D] border-b border-[#E5E0D8]">
                <th className="px-4 py-3.5 w-12">
                  <input
                    type="checkbox"
                    className="size-4 accent-[#161514] cursor-pointer"
                    checked={isAllCurrentPageSelected}
                    onChange={(e) => handleSelectAllCurrentPage(e.target.checked)}
                    disabled={jobs.length === 0}
                  />
                </th>
                <th className="px-4 py-3.5">Mã Job</th>
                <th className="px-4 py-3.5">Trạng thái</th>
                <th className="px-4 py-3.5 text-right">Tổng ảnh</th>
                <th className="px-4 py-3.5 text-right">Hoàn tất</th>
                <th className="px-4 py-3.5 text-right">Lỗi</th>
                <th className="px-4 py-3.5">Tiến độ</th>
                <th className="px-4 py-3.5">Khởi tạo</th>
                <th className="px-4 py-3.5">Hoàn thành</th>
                <th className="px-4 py-3.5 text-center">Thao tác</th>
              </tr>
            </thead>

            <tbody className="block lg:table-row-group divide-y divide-[#E5E0D8]">
              {jobsQuery.isLoading &&
                Array.from({ length: 4 }).map((_, index) => (
                  <tr
                    key={index}
                    className="block p-4 lg:table-row lg:p-0"
                  >
                    <td colSpan={10} className="lg:px-4 lg:py-3">
                      <div className="h-16 lg:h-8 animate-pulse bg-[#F3EFE6]" />
                    </td>
                  </tr>
                ))}

              {jobsQuery.isError && (
                <tr className="block lg:table-row">
                  <td
                    colSpan={10}
                    className="px-4 py-8 text-center text-xs text-[#C05A39] block lg:table-cell"
                  >
                    {getApiErrorMessage(
                      jobsQuery.error,
                      "Không tải được nhật ký tiến trình đồng bộ"
                    )}
                  </td>
                </tr>
              )}

              {!jobsQuery.isLoading && !jobsQuery.isError && jobs.length === 0 && (
                <tr className="block lg:table-row">
                  <td
                    colSpan={10}
                    className="px-4 py-12 text-center text-xs text-[#8C8476] block lg:table-cell"
                  >
                    Chưa ghi nhận tiến trình đồng bộ nào.
                  </td>
                </tr>
              )}

              {!jobsQuery.isLoading &&
                !jobsQuery.isError &&
                jobs.map((job) => (
                  <tr
                    key={job.id}
                    onClick={() => {
                      setSelectedJobId(job.id);
                      setItemPage(1);
                    }}
                    className={`cursor-pointer block bg-white transition-colors lg:table-row lg:hover:bg-[#FAF8F5]/80 ${
                      selectedJobIds.includes(job.id) ? "bg-[#FAF8F5]" : ""
                    }`}
                  >
                    {/* Mobile */}
                    <td className="block p-4 lg:hidden">
                      <div className="flex items-center justify-between border-b border-[#E5E0D8] pb-3">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            className="size-4 accent-[#161514] cursor-pointer"
                            checked={selectedJobIds.includes(job.id)}
                            onChange={(e) => handleSelectJob(job.id, e.target.checked)}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <span className="font-mono font-semibold text-[#161514] text-sm">
                            #{job.id}
                          </span>
                        </div>
                        <StatusBadge status={job.status} />
                      </div>

                      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                        <div className="bg-[#FAF8F5] border border-[#E5E0D8] py-2">
                          <p className="text-[10.5px] text-[#8C8476]">Tổng ảnh</p>
                          <p className="mt-0.5 font-semibold text-[#161514]">
                            {job.totalImages ?? 0}
                          </p>
                        </div>
                        <div className="bg-emerald-50/70 border border-emerald-200 py-2">
                          <p className="text-[10.5px] text-emerald-700">Hoàn tất</p>
                          <p className="mt-0.5 font-semibold text-emerald-800">
                            {job.successCount ?? 0}
                          </p>
                        </div>
                        <div className="bg-rose-50/70 border border-rose-200 py-2">
                          <p className="text-[10.5px] text-rose-700">Lỗi</p>
                          <p className="mt-0.5 font-semibold text-rose-800">
                            {job.failedCount ?? 0}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center gap-3">
                        <span className="text-[11px] text-[#6B655D] w-14">Tiến độ</span>
                        <div className="h-1.5 flex-1 overflow-hidden bg-[#F3EFE6]">
                          <div
                            className="h-full bg-[#161514] transition-all"
                            style={{
                              width: `${Math.min(
                                Number(job.progressPercentage || 0),
                                100
                              )}%`,
                            }}
                          />
                        </div>
                        <span className="text-[11px] font-semibold text-[#161514]">
                          {Number(job.progressPercentage || 0).toFixed(0)}%
                        </span>
                      </div>

                      <div className="mt-3 flex justify-end gap-2 pt-3 border-t border-[#E5E0D8]">
                        {["FAILED", "PARTIALLY_FAILED", "UPLOAD_FAILED"].includes(
                          job.status
                        ) && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setRetryingJobId(job.id);
                              retryJobMutation.mutate(job.id);
                            }}
                            disabled={
                              retryJobMutation.isPending && retryingJobId === job.id
                            }
                            className="inline-flex flex-1 cursor-pointer items-center justify-center gap-1.5 bg-white p-2 text-amber-800 border border-amber-200 text-xs font-semibold uppercase tracking-wider"
                          >
                            <FiRotateCcw className="size-3.5" />
                            <span>Chạy lại</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/admin/indexing/${job.id}`);
                          }}
                          className="inline-flex flex-1 cursor-pointer items-center justify-center gap-1.5 bg-white p-2 text-[#161514] border border-[#D8D2C5] text-xs font-semibold uppercase tracking-wider"
                        >
                          <FiEye className="size-3.5" />
                          <span>Chi tiết</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            Swal.fire({
                              title: "Xóa tiến trình này?",
                              text: `Xóa tiến trình #${job.id} và các ảnh liên quan?`,
                              icon: "warning",
                              showCancelButton: true,
                              confirmButtonColor: "#C05A39",
                              cancelButtonColor: "#6B655D",
                              confirmButtonText: "Xóa",
                              cancelButtonText: "Hủy",
                            }).then((result) => {
                              if (result.isConfirmed) {
                                deleteJobMutation.mutate(job.id);
                              }
                            });
                          }}
                          disabled={deleteJobMutation.isPending}
                          className="inline-flex cursor-pointer items-center justify-center bg-white p-2 text-[#C05A39] border border-[#C05A39]/40"
                        >
                          <FiTrash2 className="size-3.5" />
                        </button>
                      </div>
                    </td>

                    {/* Desktop */}
                    <td
                      className="hidden lg:table-cell px-4 py-3.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        className="size-4 accent-[#161514] cursor-pointer"
                        checked={selectedJobIds.includes(job.id)}
                        onChange={(e) => handleSelectJob(job.id, e.target.checked)}
                      />
                    </td>
                    <td className="hidden lg:table-cell px-4 py-3.5 font-mono font-semibold text-[#161514]">
                      #{job.id}
                    </td>
                    <td className="hidden lg:table-cell px-4 py-3.5">
                      <StatusBadge status={job.status} />
                    </td>
                    <td className="hidden lg:table-cell px-4 py-3.5 text-right text-[#2A2724]">
                      {job.totalImages ?? 0}
                    </td>
                    <td className="hidden lg:table-cell px-4 py-3.5 text-right text-emerald-800 font-medium">
                      {job.successCount ?? 0}
                    </td>
                    <td className="hidden lg:table-cell px-4 py-3.5 text-right text-rose-700 font-medium">
                      {job.failedCount ?? 0}
                    </td>
                    <td className="hidden lg:table-cell px-4 py-3.5">
                      <div className="flex min-w-32 items-center gap-3">
                        <div className="h-1.5 flex-1 overflow-hidden bg-[#F3EFE6]">
                          <div
                            className="h-full bg-[#161514]"
                            style={{
                              width: `${Math.min(
                                Number(job.progressPercentage || 0),
                                100
                              )}%`,
                            }}
                          />
                        </div>
                        <span className="w-10 text-right text-[11px] font-semibold text-[#161514]">
                          {Number(job.progressPercentage || 0).toFixed(0)}%
                        </span>
                      </div>
                    </td>
                    <td className="hidden lg:table-cell px-4 py-3.5 text-[#6B655D]">
                      {formatDateTime(job.startedAt || job.createdAt)}
                    </td>
                    <td className="hidden lg:table-cell px-4 py-3.5 text-[#6B655D]">
                      {formatDateTime(job.finishedAt)}
                    </td>
                    <td className="hidden lg:table-cell px-4 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {["FAILED", "PARTIALLY_FAILED", "UPLOAD_FAILED"].includes(
                          job.status
                        ) && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setRetryingJobId(job.id);
                              retryJobMutation.mutate(job.id);
                            }}
                            disabled={
                              retryJobMutation.isPending && retryingJobId === job.id
                            }
                            className="inline-flex cursor-pointer items-center justify-center bg-white p-2 text-amber-800 border border-amber-200 transition hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-50"
                            title="Chạy lại các ảnh lỗi"
                          >
                            <FiRotateCcw
                              className={`size-3.5 ${
                                retryJobMutation.isPending && retryingJobId === job.id
                                  ? "animate-spin"
                                  : ""
                              }`}
                            />
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/admin/indexing/${job.id}`);
                          }}
                          className="inline-flex cursor-pointer items-center justify-center bg-white p-2 text-[#161514] border border-[#D8D2C5] transition hover:border-[#161514] hover:bg-[#161514] hover:text-[#FAF8F5]"
                          title="Xem chi tiết"
                        >
                          <FiEye className="size-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            Swal.fire({
                              title: "Xóa tiến trình này?",
                              text: `Xóa tiến trình #${job.id} và các ảnh liên quan?`,
                              icon: "warning",
                              showCancelButton: true,
                              confirmButtonColor: "#C05A39",
                              cancelButtonColor: "#6B655D",
                              confirmButtonText: "Xóa",
                              cancelButtonText: "Hủy",
                            }).then((result) => {
                              if (result.isConfirmed) {
                                deleteJobMutation.mutate(job.id);
                              }
                            });
                          }}
                          disabled={deleteJobMutation.isPending}
                          className="inline-flex cursor-pointer items-center justify-center bg-white p-2 text-[#C05A39] border border-[#C05A39]/40 transition hover:bg-[#C05A39] hover:text-[#FAF8F5] disabled:cursor-not-allowed disabled:opacity-50"
                          title="Xóa tiến trình"
                        >
                          <FiTrash2 className="size-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-[#E5E0D8] bg-[#FAF8F5] px-4 py-3 text-xs text-[#6B655D] sm:flex-row sm:items-center sm:justify-between">
          <span>
            Tổng cộng <strong className="text-[#161514]">{pagination.totalElements}</strong> tiến trình &bull; 10 dòng / trang
          </span>
          <div className="flex items-center justify-between gap-2 sm:justify-end">
            <button
              type="button"
              disabled={!pagination.hasPrevious && page <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              className="inline-flex cursor-pointer items-center gap-1 border border-[#D8D2C5] bg-white px-3 py-1.5 font-semibold uppercase tracking-wider text-[#161514] disabled:cursor-not-allowed disabled:opacity-40 hover:border-[#161514]"
            >
              <FiChevronLeft className="size-3.5" />
              <span>Trước</span>
            </button>
            <span className="px-2">
              Trang <strong className="text-[#161514]">{pagination.page}</strong> /{" "}
              <strong className="text-[#161514]">{pagination.totalPages}</strong>
            </span>
            <button
              type="button"
              disabled={!pagination.hasNext && page >= pagination.totalPages}
              onClick={() => setPage((current) => current + 1)}
              className="inline-flex cursor-pointer items-center gap-1 border border-[#D8D2C5] bg-white px-3 py-1.5 font-semibold uppercase tracking-wider text-[#161514] disabled:cursor-not-allowed disabled:opacity-40 hover:border-[#161514]"
            >
              <span>Sau</span>
              <FiChevronRight className="size-3.5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
