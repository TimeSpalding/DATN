import { useState, useEffect, useRef } from "react";
import { useMutation, useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { requestTryOn, getTryOnHistory, deleteTryOnHistory } from "../services/tryonService";
import { FiTrash2, FiClock, FiUploadCloud } from "react-icons/fi";
import { FaPlus, FaEquals } from "react-icons/fa";
import Swal from "sweetalert2";

// ─────────────────────────── Upload Box ───────────────────────────
function UploadBox({ label, icon, preview, onChange, disabled }) {
  const inputRef = useRef();
  return (
    <label
      className={`relative flex flex-col items-center justify-center rounded-2xl overflow-hidden border-2 border-dashed transition-all duration-300 shrink-0 cursor-pointer
        h-[380px] w-[250px] md:h-[430px] md:w-[280px]
        ${preview ? "border-transparent" : "border-gray-300 hover:border-indigo-400 bg-gray-50 hover:bg-indigo-50"}
        ${disabled ? "opacity-60 cursor-not-allowed pointer-events-none" : ""}
      `}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onChange}
        disabled={disabled}
      />
      {preview ? (
        <>
          <img src={preview} className="h-full w-full object-cover" alt={label} />
          <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-all flex items-center justify-center">
            <span className="opacity-0 hover:opacity-100 text-white font-bold text-sm bg-black/50 px-3 py-1 rounded-full">
              Đổi ảnh
            </span>
          </div>
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-3">
            <span className="text-white text-xs font-medium px-2 py-1 bg-black/40 rounded-full backdrop-blur-sm">
              {icon} {label}
            </span>
          </div>
        </>
      ) : (
        <div className="text-center p-5 select-none">
          <FiUploadCloud className="mx-auto mb-3 text-4xl text-gray-400" />
          <p className="font-semibold text-gray-600">{label}</p>
          <p className="text-xs text-gray-400 mt-1">Click để chọn ảnh</p>
        </div>
      )}
    </label>
  );
}

// ─────────────────────────── Result Box ───────────────────────────
function ResultBox({ loading, elapsedTime, resultUrl }) {
  return (
    <div
      className={`relative flex items-center justify-center rounded-2xl overflow-hidden transition-all duration-500 shrink-0
        h-[400px] w-[270px] md:h-[460px] md:w-[300px]
        ${resultUrl ? "border-4 border-indigo-500 shadow-2xl ring-4 ring-indigo-500/20" : "border-2 border-dashed border-gray-200 bg-gray-50"}
      `}
    >
      {loading ? (
        <div className="flex flex-col items-center gap-3 text-center px-4">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin" />
          <p className="text-indigo-600 font-bold animate-pulse">AI đang xử lý...</p>
          <p className="text-gray-400 text-sm">{elapsedTime}s</p>
          <p className="text-gray-400 text-xs">Thường mất 30–60 giây</p>
        </div>
      ) : resultUrl ? (
        <>
          <img src={resultUrl} className="h-full w-full object-cover" alt="Kết quả thử đồ" />
          <div className="absolute top-3 right-3 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-400 border border-white" />
          </div>
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-indigo-700/90 to-transparent p-4">
            <span className="text-white font-bold text-sm px-3 py-1 bg-black/30 backdrop-blur-md rounded-full border border-white/30">
              ✨ Kết quả
            </span>
          </div>
        </>
      ) : (
        <div className="text-center p-5 select-none">
          <span className="text-5xl text-gray-200 mb-3 block">🪄</span>
          <p className="text-gray-400 font-medium text-sm">Kết quả sẽ hiển thị ở đây</p>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────── History Card ───────────────────────────
function HistoryCard({ item, onDelete }) {
  return (
    <div className="group relative bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200">
      <div className="flex gap-0 h-[160px]">
        {[item.personImageUrl, item.clothImageUrl, item.resultImageUrl].map((url, i) => (
          <div key={i} className={`relative flex-1 overflow-hidden ${i === 2 ? "border-l-2 border-indigo-300" : ""}`}>
            {url ? (
              <img src={url} className="h-full w-full object-cover" alt="" />
            ) : (
              <div className="h-full w-full bg-gray-100 flex items-center justify-center text-gray-300 text-2xl">
                ?
              </div>
            )}
            {i === 2 && (
              <div className="absolute inset-0 bg-gradient-to-t from-indigo-600/40 to-transparent" />
            )}
          </div>
        ))}
      </div>
      <div className="p-3 flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-indigo-600 capitalize bg-indigo-50 px-2 py-0.5 rounded-full">
            {item.category}
          </span>
          <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
            <FiClock className="w-3 h-3" />
            {item.processingTimeMs ? `${(item.processingTimeMs / 1000).toFixed(1)}s` : "—"}
            &nbsp;·&nbsp;
            {new Date(item.createdAt).toLocaleDateString("vi-VN")}
          </div>
        </div>
        <button
          onClick={() => onDelete(item.id)}
          className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
        >
          <FiTrash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────── Main Page ───────────────────────────
export const TryOn = () => {
  const queryClient = useQueryClient();
  const [personFile, setPersonFile] = useState(null);
  const [clothFile, setClothFile] = useState(null);
  const [personPreview, setPersonPreview] = useState(null);
  const [clothPreview, setClothPreview] = useState(null);
  const [category, setCategory] = useState("overall");
  const [resultUrl, setResultUrl] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showHistory, setShowHistory] = useState(false);

  // Timer
  const { isPending: loading, mutate: doTryOn } = useMutation({
    mutationFn: () => requestTryOn({ personImage: personFile, clothImage: clothFile, category }),
    onSuccess: (data) => {
      setResultUrl(data?.data?.resultImageUrl || null);
      queryClient.invalidateQueries({ queryKey: ["tryon-history"] });
    },
    onError: (err) => {
      Swal.fire({
        icon: "error",
        title: "Thử đồ thất bại",
        text: err?.response?.data?.error?.message || err.message || "Đã có lỗi xảy ra",
        confirmButtonColor: "#4f46e5",
      });
    },
  });

  useEffect(() => {
    let timer;
    if (loading) {
      setElapsedTime(0);
      timer = setInterval(() => setElapsedTime((t) => t + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [loading]);

  const handlePersonChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPersonFile(file);
    setPersonPreview(URL.createObjectURL(file));
  };

  const handleClothChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setClothFile(file);
    setClothPreview(URL.createObjectURL(file));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!personFile || !clothFile) {
      Swal.fire({ icon: "warning", title: "Thiếu ảnh", text: "Vui lòng chọn đủ ảnh người mẫu và trang phục!", confirmButtonColor: "#4f46e5" });
      return;
    }
    setResultUrl(null);
    doTryOn();
  };

  // History
  const {
    data: historyData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["tryon-history"],
    queryFn: ({ pageParam = 0 }) => getTryOnHistory({ page: pageParam, size: 12 }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      const d = lastPage?.data;
      if (!d || d.last) return undefined;
      return d.page + 1;
    },
    enabled: showHistory,
  });

  const historyItems = historyData?.pages?.flatMap((p) => p?.data?.results ?? []) ?? [];

  const handleDeleteHistory = async (historyId) => {
    const result = await Swal.fire({
      icon: "warning",
      title: "Xoá lịch sử?",
      text: "Bạn có chắc muốn xóa record thử đồ này?",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonText: "Huỷ",
      confirmButtonText: "Xoá",
    });
    if (!result.isConfirmed) return;

    try {
      await deleteTryOnHistory(historyId);
      queryClient.invalidateQueries({ queryKey: ["tryon-history"] });
    } catch {
      Swal.fire({ icon: "error", title: "Lỗi", text: "Không thể xóa, thử lại sau." });
    }
  };

  const categoryOptions = [
    { value: "upper", label: "Áo (Upper)" },
    { value: "lower", label: "Quần/Váy (Lower)" },
    { value: "overall", label: "Đồ bộ / Áo dài (Overall)" },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto px-4">
      {/* Header */}
      <div className="text-center mb-8" data-aos="fade-down">
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight mb-2">
          ✨ AI Virtual Try-On
        </h1>
        <p className="text-gray-500 text-base">
          Tải lên ảnh người mẫu và trang phục để xem kết quả thử đồ ngay lập tức
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Category Selector */}
        <div className="flex flex-wrap justify-center gap-4 mb-8 bg-gray-50 rounded-2xl p-4 border border-gray-100" data-aos="fade-up">
          <span className="text-xs font-bold uppercase tracking-widest text-gray-500 self-center">Loại trang phục:</span>
          {categoryOptions.map(({ value, label }) => (
            <label key={value} className="flex items-center gap-2 cursor-pointer group">
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                  category === value ? "border-indigo-500" : "border-gray-400 group-hover:border-indigo-400"
                }`}
                onClick={() => setCategory(value)}
              >
                {category === value && <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full" />}
              </div>
              <input type="radio" name="category" value={value} checked={category === value} onChange={() => setCategory(value)} className="hidden" />
              <span className={`text-sm font-medium ${category === value ? "text-indigo-600" : "text-gray-600 group-hover:text-indigo-500"}`}>
                {label}
              </span>
            </label>
          ))}
        </div>

        {/* Equation: Person + Cloth = Result */}
        <div className="w-full overflow-x-auto pb-6" data-aos="fade-up" data-aos-delay="100">
          <div className="flex flex-row items-center justify-start md:justify-center gap-4 md:gap-5 min-w-max px-2">
            <UploadBox label="Người mẫu" icon="👤" preview={personPreview} onChange={handlePersonChange} disabled={loading} />

            <div className="flex items-center justify-center bg-white rounded-full h-12 w-12 border border-gray-200 shadow-sm shrink-0">
              <FaPlus className="text-gray-400 text-lg" />
            </div>

            <UploadBox label="Trang phục" icon="👗" preview={clothPreview} onChange={handleClothChange} disabled={loading} />

            <div className="flex items-center justify-center bg-indigo-500 rounded-full h-12 w-12 shadow-lg shrink-0 text-white">
              <FaEquals className="text-lg" />
            </div>

            <ResultBox loading={loading} elapsedTime={elapsedTime} resultUrl={resultUrl} />
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-center mt-6 mb-10">
          <button
            type="submit"
            disabled={loading || !personFile || !clothFile}
            className={`px-10 py-4 text-lg font-bold text-white rounded-full shadow-lg transition-all transform
              ${loading || !personFile || !clothFile
                ? "bg-gray-400 cursor-not-allowed shadow-none scale-100"
                : "bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 hover:scale-105 active:scale-95 hover:shadow-indigo-400/30"
              }`}
          >
            {loading ? `⏳ Đang xử lý AI... (${elapsedTime}s)` : "✨ BẮT ĐẦU THỬ ĐỒ"}
          </button>
        </div>
      </form>

      {/* Try-On History */}
      <div className="mt-4 border-t border-gray-100 pt-6">
        <button
          onClick={() => setShowHistory((s) => !s)}
          className="flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition mb-4"
        >
          <FiClock className="w-4 h-4" />
          {showHistory ? "Ẩn lịch sử thử đồ" : "Xem lịch sử thử đồ"}
        </button>

        {showHistory && (
          <>
            {historyItems.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-6">Chưa có lịch sử thử đồ nào.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {historyItems.map((item) => (
                  <HistoryCard key={item.id} item={item} onDelete={handleDeleteHistory} />
                ))}
              </div>
            )}
            {hasNextPage && (
              <div className="flex justify-center mt-6">
                <button
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  className="px-6 py-2 text-sm font-medium text-indigo-600 border border-indigo-200 rounded-full hover:bg-indigo-50 transition"
                >
                  {isFetchingNextPage ? "Đang tải..." : "Xem thêm"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
