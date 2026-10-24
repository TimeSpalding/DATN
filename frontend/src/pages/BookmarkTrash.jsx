import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { FaChevronLeft, FaChevronRight, FaImage, FaTrash, FaArrowLeft, FaHome, FaTimes, FaTrashRestore, FaUndo } from "react-icons/fa";
import { useSearchParams, useNavigate } from "react-router-dom";
import { getDeletedBookmarks, restoreBookmark, permanentDeleteBookmark } from "../services/bookmarkService";
import { getImageBlob } from "../services/imageService";
import { resolveStorageUrl } from "../utils/imageUrl";
import AOS from "aos";
import Swal from 'sweetalert2';
import { ImagePreviewModal } from "../components/common/ImagePreviewModal";

const PAGE_SIZE = 20;

const normalizeBookmarkResponse = (response) => {
    const data = response?.data || {};
    return {
        results: data.results || data.masks || [],
        page: data.page ?? data.pageNumber ?? 0,
        pageSize: data.size ?? data.pageSize ?? PAGE_SIZE,
        totalElements: data.totalElements ?? data.totalItems ?? data.results?.length ?? 0,
        totalPages: data.totalPages ?? 0,
    };
};

const isDirectImageUrl = (value) => /^https?:\/\//i.test(value) || value?.startsWith("data:") || value?.startsWith("blob:");
const isInternalMinioUrl = (value) => {
    if (!/^https?:\/\//i.test(value || "")) return false;
    try {
        const url = new URL(value);
        return ["minio", "visualsearch-minio"].includes(url.hostname);
    } catch {
        return false;
    }
};

const BookmarkImage = ({ bookmark, fileName }) => {
    const directUrl = bookmark.thumbnailUrl || bookmark.imageUrl || bookmark.thumbnailPath || bookmark.storagePath;
    const [blobUrl, setBlobUrl] = useState("");
    const [hasError, setHasError] = useState(false);

    const canUseDirectUrl = isDirectImageUrl(directUrl) && !isInternalMinioUrl(directUrl);
    const imageUrl = canUseDirectUrl ? resolveStorageUrl(directUrl) : blobUrl;

    useEffect(() => {
        let isMounted = true;
        let objectUrl = "";

        if (!bookmark.imageId || canUseDirectUrl) {
            return undefined;
        }

        getImageBlob(bookmark.imageId)
            .then((blob) => {
                if (!isMounted) return;
                objectUrl = URL.createObjectURL(blob);
                setBlobUrl(objectUrl);
            })
            .catch(() => {
                if (isMounted) setHasError(true);
            });

        return () => {
            isMounted = false;
            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
            }
        };
    }, [bookmark.imageId, canUseDirectUrl]);

    if (hasError) {
        return (
            <div className="flex h-full w-full flex-col items-center justify-center bg-[#F3EFE6] p-4 text-center text-[#8C8476]">
                <FaImage className="mb-2 h-6 w-6 stroke-[1.25]" />
                <span className="text-[10px] uppercase tracking-wider">Không tải được ảnh</span>
            </div>
        );
    }

    if (!imageUrl) {
        return (
            <div className="flex h-full w-full items-center justify-center bg-[#F3EFE6]">
                <div className="h-6 w-6 border border-[#161514] border-t-transparent animate-spin" />
            </div>
        );
    }

    return (
        <img
            src={imageUrl}
            alt={fileName}
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            loading="lazy"
        />
    );
};

export const BookmarkTrash = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    const page = Math.max(Number(searchParams.get("page") || 0), 0);
    const [previewImage, setPreviewImage] = useState(null);
    const [toasts, setToasts] = useState([]);

    const addToast = (message, type = "success") => {
        const id = Date.now();
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => removeToast(id), 2500);
    };

    const removeToast = (id) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    };

    const trashQuery = useQuery({
        queryKey: ["bookmarks-trash", page],
        queryFn: () => getDeletedBookmarks({ page, pageSize: PAGE_SIZE }),
        placeholderData: keepPreviousData,
    });

    const trashData = normalizeBookmarkResponse(trashQuery.data);

    const restoreMutation = useMutation({
        mutationFn: restoreBookmark,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["bookmarks-trash"] });
            queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
            addToast("Đã khôi phục ảnh về kho lưu trữ", "success");
        },
        onError: () => addToast("Không thể khôi phục ảnh", "error"),
    });

    const permanentDeleteMutation = useMutation({
        mutationFn: permanentDeleteBookmark,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["bookmarks-trash"] });
            addToast("Đã xóa vĩnh viễn ảnh", "success");
        },
        onError: () => addToast("Không thể xóa ảnh", "error"),
    });

    const handlePageChange = (newPage) => {
        setSearchParams({ page: newPage });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-12 space-y-10">
            {/* Toast Notifications */}
            <div className="fixed right-6 top-20 z-50 flex flex-col gap-2">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className="flex w-80 items-center justify-between px-4 py-3 bg-[#161514] text-[#FAF8F5] border border-[#9E7A52] text-xs shadow-xl tracking-wide"
                    >
                        <span>{toast.message}</span>
                        <button
                            onClick={() => removeToast(toast.id)}
                            className="p-1 hover:text-[#C05A39] transition-colors"
                        >
                            <FaTimes className="h-3 w-3" />
                        </button>
                    </div>
                ))}
            </div>

            {/* Header Banner */}
            <div className="flex flex-col gap-4 border-b border-[#E5E0D8] pb-8 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <p className="text-[10px] font-semibold tracking-[0.25em] text-[#C05A39] uppercase mb-1.5">
                        CORBEILLE &bull; ARCHIVE SUPPRIMÉE
                    </p>
                    <h1 className="font-serif-luxury text-3xl sm:text-4xl font-normal text-[#161514] tracking-wide">
                        Thùng Rác &amp; Ảnh Đã Xóa
                    </h1>
                    <p className="mt-2 text-xs text-[#6B655D] max-w-xl leading-relaxed">
                        Các hình ảnh được lưu giữ tạm thời trong 30 ngày trước khi xóa vĩnh viễn. Quý khách có thể khôi phục lại kho lưu trữ bất kỳ lúc nào.
                    </p>
                </div>

                <div className="flex items-center gap-3 mt-4 sm:mt-0">
                    <button
                        type="button"
                        onClick={() => navigate("/bookmarks")}
                        className="px-4 py-2.5 border border-[#161514] hover:bg-[#161514] hover:text-[#FAF8F5] text-[#161514] text-xs font-medium tracking-wider uppercase flex items-center gap-2 transition-all cursor-pointer"
                    >
                        <FaArrowLeft className="h-3 w-3" />
                        <span>Về kho lưu trữ</span>
                    </button>

                    <div className="px-4 py-2.5 bg-[#FAF8F5] border border-[#E5E0D8] text-xs text-[#6B655D]">
                        <span>Tổng số: </span>
                        <strong className="text-[#161514] font-medium">{trashData.totalElements}</strong> ảnh
                    </div>
                </div>
            </div>

            {trashQuery.isLoading ? (
                <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                    {Array.from({ length: PAGE_SIZE }).map((_, index) => (
                        <div key={index} className="aspect-[3/4] animate-pulse bg-[#F3EFE6] border border-[#E5E0D8]" />
                    ))}
                </div>
            ) : trashQuery.isError ? (
                <div className="border border-[#C05A39]/30 bg-[#C05A39]/10 p-6 text-xs text-[#C05A39]">
                    Không thể tải dữ liệu thùng rác. Vui lòng thử lại sau.
                </div>
            ) : trashData.results.length === 0 ? (
                <div className="flex flex-col items-center border border-[#E5E0D8] bg-[#FAF8F5] p-16 text-center">
                    <div className="flex h-12 w-12 items-center justify-center border border-[#E5E0D8] bg-[#F3EFE6] text-[#8C8476] mb-4">
                        <FaTrashRestore className="h-5 w-5 stroke-[1.25]" />
                    </div>
                    <h2 className="font-serif-luxury text-2xl font-normal text-[#161514]">Thùng Rác Trống</h2>
                    <p className="mt-2 max-w-sm text-xs text-[#6B655D] leading-relaxed">
                        Hiện tại không có hình ảnh nào trong thùng rác tạm thời.
                    </p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                        {trashData.results.map((bookmark) => {
                            const fileName = bookmark.originalFilename || `Ảnh #${bookmark.imageId}`;
                            const isRestoring = restoreMutation.isPending && restoreMutation.variables === bookmark.imageId;
                            const isDeleting = permanentDeleteMutation.isPending && permanentDeleteMutation.variables === bookmark.imageId;

                            return (
                                <article
                                    key={bookmark.bookmarkId || bookmark.id || bookmark.imageId}
                                    className="group relative border border-[#E5E0D8] bg-[#FAF8F5] hover:border-[#161514] transition-all duration-300 flex flex-col"
                                >
                                    <div
                                        className="relative aspect-[3/4] overflow-hidden cursor-pointer bg-[#F3EFE6]"
                                        onClick={() => setPreviewImage(bookmark)}
                                    >
                                        <BookmarkImage bookmark={bookmark} fileName={fileName} />

                                        {/* Desktop Hover Actions */}
                                        <div className="hidden md:flex absolute inset-0 flex-col items-center justify-center gap-2 opacity-0 transition-opacity bg-[#161514]/70 group-hover:opacity-100 z-10 p-4">
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    restoreMutation.mutate(bookmark.imageId);
                                                }}
                                                disabled={isRestoring || isDeleting}
                                                className="w-full py-2.5 bg-[#FAF8F5] hover:bg-[#FFFFFF] text-[#161514] text-[10.5px] font-medium tracking-widest uppercase flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                                            >
                                                <FaUndo className="h-3 w-3 text-[#C05A39]" />
                                                <span>Khôi phục</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (window.confirm('Xác nhận xóa vĩnh viễn ảnh này? Thao tác không thể hoàn tác.')) {
                                                        permanentDeleteMutation.mutate(bookmark.imageId);
                                                    }
                                                }}
                                                disabled={isRestoring || isDeleting}
                                                className="w-full py-2.5 bg-[#C05A39] hover:bg-[#A64B2E] text-[#FAF8F5] text-[10.5px] font-medium tracking-widest uppercase flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                                            >
                                                <FaTrash className="h-3 w-3" />
                                                <span>Xóa vĩnh viễn</span>
                                            </button>
                                        </div>

                                        {/* Remaining days pill */}
                                        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-[#161514]/90 to-transparent p-2 text-center text-[10px] text-[#FAF8F5] tracking-wider uppercase pointer-events-none">
                                            Còn lại {bookmark.remainingDays || 30} ngày
                                        </div>
                                    </div>

                                    {/* Mobile Actions Bar */}
                                    <div className="flex md:hidden w-full divide-x divide-[#E5E0D8] border-t border-[#E5E0D8] bg-[#F3EFE6]">
                                        <button
                                            type="button"
                                            onClick={() => restoreMutation.mutate(bookmark.imageId)}
                                            className="flex-1 py-2 text-[10.5px] font-medium text-[#161514] uppercase text-center"
                                        >
                                            Khôi phục
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (window.confirm('Xác nhận xóa vĩnh viễn ảnh này?')) {
                                                    permanentDeleteMutation.mutate(bookmark.imageId);
                                                }
                                            }}
                                            className="flex-1 py-2 text-[10.5px] font-medium text-[#C05A39] uppercase text-center"
                                        >
                                            Xóa
                                        </button>
                                    </div>
                                </article>
                            );
                        })}
                    </div>

                    {/* Pagination */}
                    {trashData.totalPages > 1 && (
                        <div className="mt-12 pt-6 border-t border-[#E5E0D8] flex items-center justify-between">
                            <button
                                disabled={page <= 0}
                                onClick={() => handlePageChange(page - 1)}
                                className={`px-4 py-2 border text-xs font-medium tracking-wider uppercase ${
                                    page <= 0 ? 'border-[#E5E0D8] text-[#D8D2C5]' : 'border-[#161514] text-[#161514] hover:bg-[#161514] hover:text-[#FAF8F5]'
                                }`}
                            >
                                Trang trước
                            </button>
                            <span className="text-xs text-[#6B655D]">Trang {page + 1} / {trashData.totalPages}</span>
                            <button
                                disabled={page >= trashData.totalPages - 1}
                                onClick={() => handlePageChange(page + 1)}
                                className={`px-4 py-2 border text-xs font-medium tracking-wider uppercase ${
                                    page >= trashData.totalPages - 1 ? 'border-[#E5E0D8] text-[#D8D2C5]' : 'border-[#161514] text-[#161514] hover:bg-[#161514] hover:text-[#FAF8F5]'
                                }`}
                            >
                                Trang sau
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* High-res Image Preview Modal */}
            {previewImage && (
                <ImagePreviewModal
                    imageId={previewImage.imageId}
                    imageUrl={previewImage.thumbnailUrl || previewImage.imageUrl}
                    onClose={() => setPreviewImage(null)}
                />
            )}
        </section>
    );
};
export default BookmarkTrash;