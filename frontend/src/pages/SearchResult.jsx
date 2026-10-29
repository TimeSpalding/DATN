import { useMemo, useState, useEffect } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { keepPreviousData, useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FaAlignLeft, FaChevronLeft, FaChevronRight, FaFont, FaImage, FaArrowLeft, FaArrowUp, FaCheckCircle, FaSlidersH } from "react-icons/fa";
import { FiArrowDown, FiTrash2, FiCheck } from "react-icons/fi";
import { SearchDetailModal } from "../components/common/SearchDetailModal";
import { getMockSearchResponse } from "../mocks/searchResultsMock";
import { searchByImage, searchByText, searchByComposed } from "../services/searchService";
import { searchSimilarImages } from "../services/searchSimilarService";
import { deleteImageByAdmin, deleteImagesByAdmin } from "../services/adminImageService";
import { ImageWithFallback } from "../components/common/ImageWithFallback";
import { searchStore } from "../utils/searchStore";
import { useAuth } from "../contexts/AuthContext";
import AOS from 'aos';
import { lazy, Suspense } from "react";
import { CardSkeleton } from "../components/ui/CardSkeleton";
import { useInView } from "react-intersection-observer";
import { CompactSearchBar } from "../components/common/CompactSearchBar";
import VisualSearchPanel from "../components/common/VisualSearchPanel";
import Masonry from 'react-masonry-css';
import Swal from "sweetalert2";

const SearchResultCard = lazy(() =>
  import("../components/ui/SearchResultCard").then(module => ({ default: module.SearchResultCard }))
);


const PAGE_SIZE = 20;
const USE_MOCK_SEARCH_RESULTS = import.meta.env.VITE_USE_MOCK_SEARCH_RESULTS === "true";

const breakpointColumnsObj = {
  default: 4,
  1280: 4,
  1024: 3,
  768: 2,
  640: 2,
  500: 2
};

const getModeLabel = (type, mode) => {
  if (type === "composed") return "Tìm kiếm lai (Ảnh + Text)";
  if (type === "similar") return "Tìm ảnh tương tự";
  if (type === "image") return "Tìm bằng ảnh";
  if (mode === "OCR") return "Tìm chữ trong ảnh";
  return "Tìm bằng text";
};

const getDescriptionLabel = (type, mode) => {
  if (type === "composed") return "Mô tả điều chỉnh cho ảnh";
  if (type === "similar") return "Kết quả tương tự cho ảnh";
  if (type === "image") return "Kết quả cho ảnh";
  if (mode === "OCR") return "Kết quả cho chữ";
  return "Kết quả cho mô tả";
};

const normalizeSearchResponse = (response) => {
  const data = response?.data || {};

  return {
    results: (data.results || []).map((result) => ({
      ...result,
      score: result.score ?? result.similarityScore ?? 0,
    })),
    pageNumber: data.page ?? data.pageNumber ?? 0,
    pageSize: data.size ?? data.pageSize ?? PAGE_SIZE,
    totalElements: data.totalElements || 0,
    totalPages: data.totalPages || 0,
    processingTimeMs: data.processingTimeMs,
    queryImageUrl: data.queryImageUrl || null,
  };
};

const getApiErrorMessage = (error, fallback) => {
  return (
    error?.response?.data?.error?.message ||
    error?.response?.data?.message ||
    error?.message ||
    fallback
  );
};

export const SearchResult = () => {

  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { role } = useAuth();
  const searchState = location.state || {};
  const [selectedResult, setSelectedResult] = useState(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [selectedImageIds, setSelectedImageIds] = useState([]);

  const type = searchParams.get("type") || searchState.type || "text";
  const isImageSearch = type === "image";
  const isSimilarSearch = type === "similar";
  const isTextSearch = type === "text";
  const isComposedSearch = type === "composed";
  const isAdmin = role === "ADMIN";
  const canAdminBulkDelete = isAdmin && !USE_MOCK_SEARCH_RESULTS && (isImageSearch || isTextSearch || isSimilarSearch || isComposedSearch);

  const query = searchParams.get("q") || searchState.query || "";
  const modificationText = searchParams.get("text") || searchState.modificationText || query || "";
  const imageId = searchParams.get("imageId") || searchState.imageId || null;
  const mode = (searchParams.get("mode") || searchState.mode || "SEMANTIC").toUpperCase();

  const size = Number(searchParams.get("size")) || PAGE_SIZE;

  const imageFile = searchState.imageFile || searchStore.imageFile;

  const canSearch = isImageSearch
    ? !!imageFile
    : isSimilarSearch
      ? !!imageId
      : isComposedSearch
        ? (!!imageFile || !!imageId) && !!modificationText.trim()
        : !!query.trim();
  const canShowResults = USE_MOCK_SEARCH_RESULTS || canSearch;

  const initialPage = Math.max(Number(searchParams.get("page") || 1), 1);
  const searchQueryKey = ["search-results", type, query, mode, size, imageFile?.name, imageId, modificationText];

  const searchQuery = useInfiniteQuery({
    queryKey: searchQueryKey,
    initialPageParam: initialPage,
    queryFn: async ({ pageParam = initialPage }) => {

      if (USE_MOCK_SEARCH_RESULTS) {
        return getMockSearchResponse({
          page: pageParam,
          size,
          searchType: isImageSearch ? "IMAGE_TO_IMAGE" : isComposedSearch ? "COMPOSED" : mode,
        });
      }

      try {
        if (isComposedSearch) {
          const res = await searchByComposed({
            image: imageFile,
            imageId: imageId ? Number(imageId) : null,
            modificationText: modificationText,
            page: pageParam,
            size,
          });
          if (res?.data) return res;
        }

        if (isSimilarSearch && imageId) {
          const res = await searchSimilarImages(Number(imageId), pageParam, size);
          if (res?.data) return res;
        }

        if (isImageSearch) {
          const res = await searchByImage({ image: imageFile, page: pageParam, size });
          if (res?.data) return res;
        }

        if (isTextSearch) {
          const res = await searchByText({ query, mode, page: pageParam, size });
          if (res?.data) return res;
        }
      } catch (err) {
        console.warn("Backend search returned error:", err?.message);
        if (USE_MOCK_SEARCH_RESULTS) {
          return getMockSearchResponse({
            page: pageParam,
            size,
            searchType: isImageSearch ? "IMAGE_TO_IMAGE" : isComposedSearch ? "COMPOSED" : mode,
          });
        }
        throw err;
      }

      if (USE_MOCK_SEARCH_RESULTS) {
        return getMockSearchResponse({
          page: pageParam,
          size,
          searchType: isImageSearch ? "IMAGE_TO_IMAGE" : isComposedSearch ? "COMPOSED" : mode,
        });
      }

      return {
        data: {
          results: [],
          totalElements: 0,
          totalPages: 0,
          page: pageParam,
          size,
        }
      };
    },
    getNextPageParam: (lastPageRaw) => {
      const lastPage = normalizeSearchResponse(lastPageRaw);
      const current = lastPage.pageNumber + 1;
      if (current < lastPage.totalPages) {
        return current + 1;
      }
      return undefined;
    },
    enabled: canShowResults,
    placeholderData: keepPreviousData,

    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });


  const searchData = useMemo(() => {
    if (!searchQuery.data) return { results: [], totalElements: 0 };

    const allResults = searchQuery.data.pages.flatMap((pageRaw) => {
      const normalized = normalizeSearchResponse(pageRaw);
      return normalized.results;
    });

    const firstPageInfo = normalizeSearchResponse(searchQuery.data.pages[0]);

    return {
      results: allResults,
      totalElements: firstPageInfo.totalElements,
      queryImageUrl: firstPageInfo.queryImageUrl,
    };
  }, [searchQuery.data]);

  const { ref: loadMoreRef, inView } = useInView({
    rootMargin: '200px',
  });

  const deleteSelectedMutation = useMutation({
    mutationFn: deleteImagesByAdmin,
    onSuccess: async (data, deletedImageIds) => {
      const deletedCount = Number(data?.deletedCount ?? deletedImageIds?.length ?? 0);
      const deletedIdSet = new Set(deletedImageIds || []);

      queryClient.setQueryData(searchQueryKey, (oldData) => {
        if (!oldData?.pages) {
          return oldData;
        }

        return {
          ...oldData,
          pages: oldData.pages.map((page) => {
            if (!page?.data || !Array.isArray(page.data.results)) {
              return page;
            }

            return {
              ...page,
              data: {
                ...page.data,
                results: page.data.results.filter((item) => !deletedIdSet.has(item.imageId)),
                totalElements: Math.max(Number(page.data.totalElements ?? 0) - deletedCount, 0),
              },
            };
          }),
        };
      });

      setSelectedImageIds([]);
      setSelectedResult((prev) => (prev && deletedIdSet.has(prev.imageId) ? null : prev));

      await Swal.fire({
        title: "Xóa thành công",
        text: `Đã chuyển ${deletedCount} ảnh vào thùng rác.`,
        icon: "success",
        timer: 1800,
        showConfirmButton: false,
      });
    },
    onError: async (error) => {
      await Swal.fire({
        title: "Xóa thất bại",
        text: getApiErrorMessage(error, "Không thể xóa ảnh đã chọn."),
        icon: "error",
      });
    },
  });

  const deleteSingleMutation = useMutation({
    mutationFn: deleteImageByAdmin,
    onSuccess: async (_data, deletedImageId) => {
      const deletedIdSet = new Set([deletedImageId]);

      queryClient.setQueryData(searchQueryKey, (oldData) => {
        if (!oldData?.pages) {
          return oldData;
        }

        return {
          ...oldData,
          pages: oldData.pages.map((page) => {
            if (!page?.data || !Array.isArray(page.data.results)) {
              return page;
            }

            return {
              ...page,
              data: {
                ...page.data,
                results: page.data.results.filter((item) => !deletedIdSet.has(item.imageId)),
                totalElements: Math.max(Number(page.data.totalElements ?? 0) - 1, 0),
              },
            };
          }),
        };
      });

      setSelectedImageIds((prev) => prev.filter((id) => id !== deletedImageId));
      setSelectedResult((prev) => (prev && prev.imageId === deletedImageId ? null : prev));

      await Swal.fire({
        title: "Xóa thành công",
        text: `Ảnh #${deletedImageId} đã được chuyển vào thùng rác.`,
        icon: "success",
        timer: 1600,
        showConfirmButton: false,
      });
    },
    onError: async (error) => {
      await Swal.fire({
        title: "Xóa thất bại",
        text: getApiErrorMessage(error, "Không thể xóa ảnh."),
        icon: "error",
      });
    },
  });

  useEffect(() => {
    if (inView && searchQuery.hasNextPage && !searchQuery.isFetchingNextPage) {
      searchQuery.fetchNextPage();
    }
  }, [inView, searchQuery.hasNextPage, searchQuery.isFetchingNextPage, searchQuery.fetchNextPage]);

  useEffect(() => {
    if (!canAdminBulkDelete) {
      setSelectedImageIds([]);
      return;
    }

    const visibleImageIds = new Set(searchData.results.map((item) => item.imageId));
    setSelectedImageIds((prev) => prev.filter((id) => visibleImageIds.has(id)));
  }, [canAdminBulkDelete, searchData.results]);

  const previewImageUrl = useMemo(() => {
    if ((isImageSearch || isComposedSearch) && imageFile) return URL.createObjectURL(imageFile);
    if ((isSimilarSearch || isComposedSearch) && searchData?.queryImageUrl) {
      return searchData.queryImageUrl;
    }
    if (isComposedSearch && imageId) {
      return `/visual-search/v1/images/${imageId}`;
    }
    return null;
  }, [imageFile, isImageSearch, isSimilarSearch, isComposedSearch, imageId, searchData?.queryImageUrl]);

  useEffect(() => {
    setTimeout(() => {
      AOS.refresh();
    }, 100);
  }, [searchData.results]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };

    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);


  const scrollToTop = () => {
    const duration = 500; // Thời gian trượt (ms)
    const start = window.scrollY || document.documentElement.scrollTop;
    const startTime = performance.now();

    const easeOutCubic = (t) => --t * t * t + 1;
    const animateScroll = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = easeOutCubic(progress);

      window.scrollTo(0, start * (1 - easeProgress));

      if (progress < 1) {
        requestAnimationFrame(animateScroll);
      }
    };

    requestAnimationFrame(animateScroll);
  };

  const modeLabel = getModeLabel(type, mode);
  const descriptionLabel = getDescriptionLabel(type, mode);
  const descriptionValue = USE_MOCK_SEARCH_RESULTS
    ? "dữ liệu mock"
    : isComposedSearch
      ? modificationText
      : isSimilarSearch
        ? `ảnh có ID: #${imageId}`
        : isImageSearch
          ? imageFile?.name || "ảnh đã tải lên"
          : query;

  const visibleImageIds = useMemo(
    () => [...new Set(searchData.results.map((item) => item.imageId))],
    [searchData.results]
  );

  const selectedCount = selectedImageIds.length;
  const allVisibleSelected = visibleImageIds.length > 0
    && visibleImageIds.every((id) => selectedImageIds.includes(id));

  const toggleSelectImage = (targetImageId) => {
    if (!canAdminBulkDelete || deleteSelectedMutation.isPending) {
      return;
    }

    setSelectedImageIds((prev) => (
      prev.includes(targetImageId)
        ? prev.filter((id) => id !== targetImageId)
        : [...prev, targetImageId]
    ));
  };

  const toggleSelectAllVisible = () => {
    if (!canAdminBulkDelete || deleteSelectedMutation.isPending || visibleImageIds.length === 0) {
      return;
    }

    setSelectedImageIds((prev) => {
      if (allVisibleSelected) {
        return prev.filter((id) => !visibleImageIds.includes(id));
      }

      const next = new Set(prev);
      visibleImageIds.forEach((id) => next.add(id));
      return [...next];
    });
  };

  const handleDeleteSelected = async () => {
    if (!canAdminBulkDelete || selectedCount === 0 || deleteSelectedMutation.isPending) {
      return;
    }

    const confirmed = await Swal.fire({
      title: `Xóa ${selectedCount} ảnh đã chọn?`,
      text: "Ảnh sẽ được chuyển vào thùng rác.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Đồng ý xóa",
      cancelButtonText: "Hủy",
      confirmButtonColor: "#dc2626",
    });

    if (confirmed.isConfirmed) {
      deleteSelectedMutation.mutate(selectedImageIds);
    }
  };

  const handleDeleteSingle = async (targetImageId) => {
    if (!canAdminBulkDelete || deleteSingleMutation.isPending || deleteSelectedMutation.isPending) {
      return;
    }

    const confirmed = await Swal.fire({
      title: `Xóa ảnh #${targetImageId}?`,
      text: "Ảnh sẽ được chuyển vào thùng rác.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Đồng ý xóa",
      cancelButtonText: "Hủy",
      confirmButtonColor: "#dc2626",
    });

    if (confirmed.isConfirmed) {
      deleteSingleMutation.mutate(targetImageId);
    }
  };

  const handleSearchSimilar = (result) => {
    if (!result?.imageId) return;

    setSelectedResult(null);

    navigate(`/search-result?type=similar&imageId=${result.imageId}&page=1&size=${size}`);
    window.scrollTo(0, 0);
  };

  if (!canShowResults) {
    return (
      <div className="w-full flex flex-col items-center py-12 sm:py-16 px-4 sm:px-6 lg:px-8 bg-[#FAF8F5]">
        <div className="w-full max-w-4xl text-center mb-8">
          <p className="text-[10px] font-semibold tracking-[0.25em] text-[#C05A39] uppercase mb-2">
            CONCIERGE THỊ GIÁC &bull; TÌM KIẾM THỜI TRANG THÔNG MINH
          </p>
          <h1 className="font-serif-luxury text-3xl sm:text-4xl md:text-5xl font-normal text-[#161514] tracking-wide mb-3">
            Tìm Kiếm Trang Phục Qua Thị Giác
          </h1>
          <p className="max-w-xl mx-auto text-xs sm:text-sm text-[#6B655D] leading-relaxed">
            Hệ thống trí tuệ nhân tạo sẽ phân tích ảnh chụp trang phục hoặc diễn đạt phong cách sợi dệt của quý khách để tìm ra các sản phẩm thời trang tương đồng chính xác nhất.
          </p>
        </div>

        <div className="w-full max-w-4xl bg-[#FAF8F5] border border-[#E5E0D8] p-6 sm:p-10 shadow-xs">
          <VisualSearchPanel />
        </div>
      </div>
    );
  }

  return (
    <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex w-full items-center mb-6">
        <CompactSearchBar className="w-full md:flex-1" />
      </div>

      <div className="flex flex-col gap-6 border-b border-[#E5E0D8] pb-8 mb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[10px] font-semibold tracking-[0.25em] text-[#C05A39] uppercase mb-1.5">
              CONCIERGE THỊ GIÁC &bull; KẾT QUẢ TÌM KIẾM
            </p>
            <h1 className="font-serif-luxury text-3xl sm:text-4xl font-normal text-[#161514] tracking-wide">
              Kết Quả Định Vị Thị Giác
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-4">
              {isComposedSearch ? (
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-xs text-[#6B655D] uppercase tracking-wider">
                    Ảnh mẫu:
                  </span>
                  {previewImageUrl && (
                    <div className="h-20 w-20 overflow-hidden border border-[#E5E0D8] bg-[#F3EFE6] shadow-xs">
                      <ImageWithFallback
                        src={previewImageUrl}
                        alt="Ảnh mẫu"
                        className="h-full w-full object-cover p-1"
                      />
                    </div>
                  )}
                  <span className="text-[#8C8476] font-bold text-lg">+</span>
                  <span className="text-xs text-[#6B655D] uppercase tracking-wider">
                    Điều chỉnh:{" "}
                    <span className="font-serif-luxury text-base text-[#161514] font-medium lowercase italic px-2 py-0.5 border border-[#E5E0D8] bg-[#FAF8F5]">
                      &ldquo;{descriptionValue}&rdquo;
                    </span>
                  </span>
                </div>
              ) : isImageSearch || isSimilarSearch ? (
                <div className="flex items-center gap-3">
                  <span className="text-xs text-[#6B655D] uppercase tracking-wider">
                    {descriptionLabel}:
                  </span>

                  <div className="h-20 w-20 overflow-hidden border border-[#E5E0D8] bg-[#F3EFE6]">
                    <ImageWithFallback
                      src={previewImageUrl}
                      imageId={imageFile?.name}
                      alt={imageFile?.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                </div>
              ) : (
                <p className="text-xs text-[#6B655D] uppercase tracking-wider">
                  {descriptionLabel}:{" "}
                  <span className="font-serif-luxury text-base text-[#161514] font-medium lowercase italic">
                    &ldquo;{descriptionValue}&rdquo;
                  </span>
                </p>
              )}

              <span className="inline-flex items-center gap-1.5 px-3 py-1 border border-[#161514] bg-[#FAF8F5] text-[10px] font-medium tracking-widest uppercase text-[#161514]">
                {type === "composed" ? (
                  <FaSlidersH className="h-2.5 w-2.5" />
                ) : type === "image" ? (
                  <FaImage className="h-2.5 w-2.5" />
                ) : mode === "OCR" ? (
                  <FaFont className="h-2.5 w-2.5" />
                ) : (
                  <FaAlignLeft className="h-2.5 w-2.5" />
                )}
                {modeLabel}
              </span>
            </div>
          </div>

          {searchData.processingTimeMs && (
            <div className="px-3.5 py-2 border border-[#E5E0D8] bg-[#FAF8F5] text-[11px] text-[#8C8476] uppercase tracking-wider">
              Thời gian xử lý:{" "}
              <strong className="text-[#161514]">
                {searchData.processingTimeMs}ms
              </strong>
            </div>
          )}
        </div>

        {canAdminBulkDelete && searchData.results.length > 0 && (
          <div className={`flex flex-col gap-3 border p-4 transition-all sm:flex-row sm:items-center sm:justify-between ${selectedCount > 0
              ? "border-[#161514] bg-[#F3EFE6]"
              : "border-[#E5E0D8] bg-[#FAF8F5]"
            }`}>
            <div className="flex items-center justify-between">
              <label className="inline-flex cursor-pointer items-center gap-3 text-xs font-medium text-[#161514]">
                <input
                  type="checkbox"
                  checked={allVisibleSelected}
                  onChange={toggleSelectAllVisible}
                  disabled={deleteSelectedMutation.isPending || visibleImageIds.length === 0}
                  className="h-4 w-4 cursor-pointer border border-[#D8D2C5] accent-[#161514]"
                />
                <span className="uppercase tracking-wider text-[11px]">
                  Chọn toàn bộ ({searchData.results.length} ảnh)
                </span>
              </label>

              {selectedCount > 0 && (
                <span className="text-xs font-semibold text-[#C05A39] sm:hidden">
                  Đã chọn: {selectedCount}
                </span>
              )}
            </div>

            <div className="flex w-full items-center gap-3 sm:w-auto">
              {selectedCount > 0 && (
                <span className="hidden text-xs font-semibold text-[#C05A39] sm:inline-block">
                  Đã chọn: {selectedCount}
                </span>
              )}

              <button
                type="button"
                onClick={() => setSelectedImageIds([])}
                disabled={selectedCount === 0 || deleteSelectedMutation.isPending}
                className="flex-1 border border-[#D8D2C5] bg-[#FAF8F5] px-4 py-2 text-xs font-medium uppercase tracking-wider text-[#161514] hover:border-[#161514] disabled:opacity-40 sm:flex-none cursor-pointer"
              >
                Bỏ chọn
              </button>

              <button
                type="button"
                onClick={handleDeleteSelected}
                disabled={selectedCount === 0 || deleteSelectedMutation.isPending}
                className="flex-1 inline-flex items-center justify-center gap-2 border border-[#C05A39] bg-[#C05A39] px-4 py-2 text-xs font-medium uppercase tracking-wider text-[#FAF8F5] hover:bg-[#A64B2E] disabled:opacity-40 sm:flex-none cursor-pointer"
              >
                <FiTrash2 className="h-3.5 w-3.5" />
                <span>{deleteSelectedMutation.isPending ? "Đang xử lý..." : "Xóa đã chọn"}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {searchQuery.isLoading ? (
        <Masonry
          breakpointCols={breakpointColumnsObj}
          className="my-masonry-grid"
          columnClassName="my-masonry-grid_column"
        >
          {Array.from({ length: PAGE_SIZE }).map((_, index) => {
            const heights = ['h-64', 'h-80', 'h-96', 'h-72'];
            const randomHeight = heights[index % heights.length];

            return (
              <div key={index}>
                <CardSkeleton heightClass={randomHeight} />
              </div>
            );
          })}
        </Masonry>
      ) : searchQuery.isError ? (
        <div className="border border-[#C05A39]/30 bg-[#C05A39]/10 p-6 text-xs text-[#C05A39]">
          Không thể tải kết quả tìm kiếm. Vui lòng thử lại sau.
        </div>
      ) : searchData.results.length === 0 ? (
        <div className="border border-[#E5E0D8] bg-[#FAF8F5] p-16 text-center text-xs text-[#6B655D]">
          Không tìm thấy thiết kế hoặc hình ảnh phù hợp với tiêu chí tra cứu.
        </div>
      ) : (
        <>
          <Masonry
            breakpointCols={breakpointColumnsObj}
            className="my-masonry-grid"
            columnClassName="my-masonry-grid_column"
          >
            {searchData.results.map((result, index) => (
              <div
                key={`${result.imageId}-${result.rankPosition}`}
                data-aos="fade-up"
                data-aos-delay={index < 20 ? index * 20 : 0}
              >
                <Suspense fallback={<CardSkeleton />}>
                  <SearchResultCard
                    result={result}
                    onViewDetails={setSelectedResult}
                    isSelectable={canAdminBulkDelete}
                    isSelected={selectedImageIds.includes(result.imageId)}
                    onToggleSelect={toggleSelectImage}
                    showDeleteAction={canAdminBulkDelete}
                    onDelete={handleDeleteSingle}
                  />
                </Suspense>
              </div>
            ))}
          </Masonry>

          <div ref={loadMoreRef} className="flex justify-center py-10">
            {searchQuery.isFetchingNextPage ? (
              <div className="flex items-center gap-3 px-5 py-2.5 border border-[#161514] bg-[#FAF8F5]">
                <div className="h-4 w-4 animate-spin border border-[#161514] border-t-transparent" />
                <span className="text-xs uppercase tracking-widest text-[#161514]">
                  Đang tải thêm tác phẩm...
                </span>
              </div>
            ) : searchQuery.hasNextPage ? (
              <div className="flex items-center gap-2 text-xs text-[#8C8476] uppercase tracking-wider">
                <FiArrowDown className="animate-bounce" />
                <span>Cuộn xuống để xem thêm</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-[#8C8476] uppercase tracking-wider">
                <FaCheckCircle className="text-[#C05A39]" />
                <span>
                  Đã hiển thị toàn bộ {searchData.totalElements} kết quả định vị
                </span>
              </div>
            )}
          </div>

          {showScrollTop && (
            <button
              type="button"
              onClick={scrollToTop}
              className="fixed bottom-8 right-8 z-[999] h-10 w-10 flex items-center justify-center border border-[#161514] bg-[#161514] text-[#FAF8F5] hover:bg-[#C05A39] hover:border-[#C05A39] transition-all cursor-pointer shadow-lg"
              title="Lên đầu trang"
            >
              <FaArrowUp className="h-3.5 w-3.5" />
            </button>
          )}
        </>
      )}

      <SearchDetailModal
        isOpen={!!selectedResult}
        result={selectedResult}
        onClose={() => setSelectedResult(null)}
        onSearchSimilar={handleSearchSimilar}
      />
    </section>
  );
};
