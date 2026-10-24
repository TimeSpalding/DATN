import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
import { useEffect, useState } from "react";
import { FaBookmark, FaArrowUp, FaImage, FaTrash, FaTrashRestore, FaArrowLeft, FaHome, FaTimes } from "react-icons/fa";
import { useSearchParams, useNavigate } from "react-router-dom";
import { deleteBookmark, getBookmarks } from "../services/bookmarkService";
import { getImageBlob } from "../services/imageService";
import { resolveStorageUrl } from "../utils/imageUrl";
import AOS from "aos";
import { ImagePreviewModal } from "../components/common/ImagePreviewModal";

const PAGE_SIZE = 20;

const normalizeBookmarkResponse = (response) => {
  const data = response?.data || {};

  return {
    results: data.results || data.masks || [],
    page: data.page ?? data.pageNumber ?? 0,
    pageSize: data.pageSize ?? data.size ?? PAGE_SIZE,
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

const HighResPreviewModal = ({ bookmark, onClose }) => {
  const [blobUrl, setBlobUrl] = useState("");
  const [hasError, setHasError] = useState(false);

  const directUrl = bookmark.imageUrl || bookmark.storagePath || bookmark.thumbnailUrl;
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

  if (!imageUrl && !hasError) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#161514]/80 backdrop-blur-xs" onMouseDown={onClose}>
        <div className="animate-spin h-8 w-8 border border-[#FAF8F5] border-t-transparent"></div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#161514]/80 backdrop-blur-xs" onMouseDown={onClose}>
        <div className="bg-[#FAF8F5] p-8 text-center border border-[#E5E0D8] max-w-sm">
          <p className="text-xs text-[#C05A39] font-medium">Không thể tải ảnh độ phân giải cao.</p>
          <button onClick={onClose} className="mt-4 px-6 py-2 bg-[#161514] text-[#FAF8F5] text-xs uppercase tracking-wider">Đóng</button>
        </div>
      </div>
    );
  }

  return (
    <ImagePreviewModal
      imageId={bookmark.imageId}
      imageUrl={imageUrl}
      onClose={onClose}
    />
  );
};

export const BookMark = () => {
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [previewImage, setPreviewImage] = useState(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const { ref, inView } = useInView();
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      removeToast(id);
    }, 2500);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError
  } = useInfiniteQuery({
    queryKey: ["bookmarks"],
    initialPageParam: 0,
    queryFn: ({ pageParam }) => getBookmarks({ page: pageParam, pageSize: PAGE_SIZE }),
    getNextPageParam: (lastPage, allPages) => {
      const normalizedLastPage = normalizeBookmarkResponse(lastPage);
      return normalizedLastPage.results?.length === PAGE_SIZE ? allPages.length : undefined;
    },
  });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const allBookmarks = data?.pages.flatMap((page) => {
    const normalizedPage = normalizeBookmarkResponse(page);
    return normalizedPage.results || [];
  }) || [];

  const bookmarkData = normalizeBookmarkResponse(data?.pages?.[0]);

  const deleteMutation = useMutation({
    mutationFn: deleteBookmark,
    onSuccess: (_, imageId) => {
      queryClient.setQueryData(["bookmarks"], (oldData) => {
        if (!oldData) return oldData;

        return {
          ...oldData,
          pages: oldData.pages.map((page) => {
            const normalizedPage = normalizeBookmarkResponse(page);
            const updatedResults = (normalizedPage.results || []).filter(
              (item) => item.imageId !== imageId
            );

            return {
              ...page,
              data: {
                ...page.data,
                results: updatedResults,
                totalElements: Math.max((normalizedPage.totalElements || 0) - 1, 0),
              },
            };
          }),
        };
      });

      addToast("Đã chuyển ảnh vào thùng rác", "info");
    },
    onError: () => {
      addToast("Không thể xóa ảnh. Vui lòng thử lại sau.", "error");
    },
  });

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 400) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
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
            L'ARCHIVE PRIVÉE &bull; SÉLECTION
          </p>
          <h1 className="font-serif-luxury text-3xl sm:text-4xl font-normal text-[#161514] tracking-wide">
            Tác Phẩm &amp; Hình Ảnh Đã Lưu
          </h1>
          <p className="mt-2 text-xs text-[#6B655D] max-w-xl leading-relaxed">
            Kho lưu trữ hình ảnh tư gia được đánh dấu trong quá trình tra cứu và định vị phong cách thời trang.
          </p>
        </div>

        <div className="flex items-center gap-3 mt-4 sm:mt-0">
          <div className="px-4 py-2.5 bg-[#FAF8F5] border border-[#E5E0D8] text-xs text-[#6B655D]">
            <span>Tổng số: </span>
            <strong className="text-[#161514] font-medium">{bookmarkData.totalElements}</strong> ảnh
          </div>

          <button
            type="button"
            onClick={() => navigate("/bookmarks/trash")}
            className="px-4 py-2.5 border border-[#161514] hover:bg-[#161514] hover:text-[#FAF8F5] text-[#161514] text-xs font-medium tracking-wider uppercase flex items-center gap-2 transition-all cursor-pointer"
          >
            <FaTrashRestore className="h-3 w-3 text-[#C05A39]" />
            <span>Thùng rác</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: PAGE_SIZE }).map((_, index) => (
            <div key={index} className="aspect-[3/4] animate-pulse bg-[#F3EFE6] border border-[#E5E0D8]" />
          ))}
        </div>
      ) : isError ? (
        <div className="border border-[#C05A39]/30 bg-[#C05A39]/10 p-6 text-xs text-[#C05A39]">
          Không thể tải danh mục hình ảnh lưu trữ. Vui lòng kiểm tra lại kết nối.
        </div>
      ) : allBookmarks.length === 0 ? (
        <div className="flex flex-col items-center border border-[#E5E0D8] bg-[#FAF8F5] p-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center border border-[#E5E0D8] bg-[#F3EFE6] text-[#8C8476] mb-4">
            <FaImage className="h-5 w-5 stroke-[1.25]" />
          </div>
          <h2 className="font-serif-luxury text-2xl font-normal text-[#161514]">Chưa Có Ảnh Đã Lưu</h2>
          <p className="mt-2 max-w-sm text-xs text-[#6B655D] leading-relaxed">
            Khi quý khách bấm lưu ảnh trong kết quả định vị phong cách, tác phẩm sẽ xuất hiện tại đây để tiện theo dõi.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {allBookmarks.map((bookmark) => {
              const fileName = bookmark.originalFilename || `Ảnh #${bookmark.imageId}`;
              const isDeleting = deleteMutation.isPending && deleteMutation.variables === bookmark.imageId;

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

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteMutation.mutate(bookmark.imageId);
                      }}
                      disabled={isDeleting || !bookmark.imageId}
                      aria-label="Xóa ảnh khỏi kho lưu trữ"
                      className="absolute right-2.5 top-2.5 cursor-pointer flex h-8 w-8 items-center justify-center bg-[#FAF8F5]/90 border border-[#E5E0D8] text-[#161514] hover:text-[#C05A39] hover:bg-[#FAF8F5] transition-all"
                    >
                      <FaTrash className="h-3 w-3" />
                    </button>
                  </div>

                  <div className="p-3 border-t border-[#E5E0D8] bg-[#FAF8F5]">
                    <p className="text-[11px] font-medium text-[#161514] truncate font-serif-luxury">
                      {fileName}
                    </p>
                    <span className="text-[9px] uppercase tracking-widest text-[#8C8476] mt-0.5 block">
                      ID: #{bookmark.imageId}
                    </span>
                  </div>
                </article>
              );
            })}
          </div>

          <div ref={ref} className="h-10 flex items-center justify-center">
            {isFetchingNextPage && (
              <div className="h-6 w-6 border border-[#161514] border-t-transparent animate-spin" />
            )}
          </div>
        </>
      )}

      {/* High-res Image Preview Modal */}
      {previewImage && (
        <HighResPreviewModal
          bookmark={previewImage}
          onClose={() => setPreviewImage(null)}
        />
      )}

      {/* Scroll to Top */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 z-40 w-10 h-10 border border-[#161514] bg-[#161514] text-[#FAF8F5] hover:bg-[#C05A39] hover:border-[#C05A39] flex items-center justify-center shadow-lg transition-all cursor-pointer"
          title="Lên đầu trang"
        >
          <FaArrowUp className="h-3.5 w-3.5" />
        </button>
      )}
    </section>
  );
};
export default BookMark;
