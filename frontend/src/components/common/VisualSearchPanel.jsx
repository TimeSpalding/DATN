import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaAlignLeft, FaImage, FaSearch, FaUpload, FaTimes } from 'react-icons/fa';
import { MAX_FILE_SIZE } from '../../config/constants';
import SearchModeTabs from './SearchModeTabs';
import { searchStore } from '../../utils/searchStore';
import CropModal from './CropModal';

const searchModes = [
  {
    id: 'image',
    label: 'Khám Phá Bằng Hình Ảnh',
    icon: FaImage,
  },
  {
    id: 'description',
    label: 'Khám Phá Theo Mô Tả Phong Cách',
    icon: FaAlignLeft,
    placeholder: 'Ví dụ: Áo sơ mi poplin cổ tàu màu trắng ngà hoặc đầm xếp ly thanh lịch...',
  },
];

export default function VisualSearchPanel() {
  const navigate = useNavigate();
  const [activeMode, setActiveMode] = useState(() => {
    const savedModeId = sessionStorage.getItem('lastSearchMode');
    if (savedModeId) {
      return searchModes.find((m) => m.id === savedModeId) || searchModes[0];
    }
    return searchModes[0];
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [fileError, setFileError] = useState('');
  const [query, setQuery] = useState('');

  const [showCropModal, setShowCropModal] = useState(false);
  const [tempImageUrl, setTempImageUrl] = useState(null);
  const [tempOriginalFile, setTempOriginalFile] = useState(null);

  const fileInputRef = useRef(null);
  const previewUrlRef = useRef('');

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  const updateSelectedFile = (file) => {
    const isValidType = ['image/jpeg', 'image/png', 'image/webp'].includes(file.type);

    if (!isValidType) {
      setFileError('Vui lòng chọn ảnh định dạng JPG, PNG hoặc WebP.');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setFileError('Dung lượng tệp cần nhỏ hơn hoặc bằng 10MB.');
      return;
    }
    const tempUrl = URL.createObjectURL(file);
    setTempImageUrl(tempUrl);
    setTempOriginalFile(file);
    setShowCropModal(true);
    setFileError('');
  };

  const handleCropComplete = (croppedFile) => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
    }

    const nextPreviewUrl = URL.createObjectURL(croppedFile);
    previewUrlRef.current = nextPreviewUrl;

    setPreviewUrl(nextPreviewUrl);
    setSelectedFile(croppedFile);

    setShowCropModal(false);
    URL.revokeObjectURL(tempImageUrl);
    setTempImageUrl(null);
  };

  const handleCancelCrop = () => {
    setShowCropModal(false);
    if (tempImageUrl) {
      URL.revokeObjectURL(tempImageUrl);
    }
    setTempImageUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; 
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      updateSelectedFile(file);
    }
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setFileError("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file) {
      updateSelectedFile(file);
    }
  };

  const handleTabChange = (mode) => {
    setActiveMode(mode);
    setQuery('');
    sessionStorage.setItem('lastSearchMode', mode.id);
  };

  const handleImageSearch = () => {
    if (!selectedFile) {
      setFileError('Vui lòng chọn ảnh trước khi tìm kiếm.');
      return;
    }

    searchStore.imageFile = selectedFile;

    navigate('/search-result?type=image&page=1&size=20', {
      state: {
        type: 'image',
        imageFile: selectedFile,
      },
    });
  };

  const handleTextSearch = () => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      return;
    }

    const mode = activeMode.id === 'ocr' ? 'OCR' : 'SEMANTIC';
    const searchParams = new URLSearchParams({
      type: 'text',
      q: trimmedQuery,
      mode,
      page: '1',
      size: '20',
    });

    navigate(`/search-result?${searchParams.toString()}`, {
      state: {
        type: 'text',
        query: trimmedQuery,
        mode,
      },
    });
  };

  const handleTextSearchSubmit = (event) => {
    event.preventDefault();
    handleTextSearch();
  };

  const isImageMode = activeMode.id === 'image';

  return (
    <section className="w-full max-w-[896px] bg-[#FAF8F5] border border-[#E5E0D8] pb-10 shadow-xs">
      {/* Modal Crop */}
      {showCropModal && tempImageUrl && (
        <CropModal
          imageUrl={tempImageUrl}
          onCancel={handleCancelCrop}
          originalFile={tempOriginalFile}
          onCropComplete={handleCropComplete}
        />
      )}

      <SearchModeTabs
        activeMode={activeMode}
        modes={searchModes}
        onChange={handleTabChange}
      />

      <div className="px-6 pt-8 sm:px-10">
        {isImageMode ? (
          <div
            onDragOver={(event) => event.preventDefault()}
            onDrop={handleDrop}
            className="group flex min-h-[320px] flex-col items-center justify-center border border-dashed border-[#D8D2C5] bg-[#F7F5F0] hover:bg-[#FAF8F5] hover:border-[#161514] px-6 py-14 text-center transition-all duration-300"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="hidden"
            />

            {previewUrl ? (
              <div
                className="relative mb-5 cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <img
                  src={previewUrl}
                  alt="Ảnh đã chọn"
                  className="h-44 w-44 object-cover border border-[#E5E0D8] shadow-sm"
                />

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveImage();
                  }}
                  className="absolute -right-2 -top-2 cursor-pointer flex h-7 w-7 items-center justify-center bg-[#161514] text-[#FAF8F5] shadow transition hover:bg-[#C05A39]"
                  title="Xóa ảnh"
                >
                  <FaTimes className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <div className="mb-4 flex h-14 w-14 items-center justify-center bg-[#EAE5D9] text-[#161514] border border-[#D8D2C5]">
                <FaUpload className="h-5 w-5" />
              </div>
            )}

            {selectedFile && (
              <p className="mt-2 max-w-full truncate text-xs font-medium tracking-wider text-[#161514] uppercase">
                {selectedFile.name}
              </p>
            )}

            {fileError && (
              <p className="mt-3 text-xs font-medium text-[#C05A39]">
                {fileError}
              </p>
            )}

            {selectedFile ? (
              <div className="flex flex-col items-center">
                <p className="mt-2 text-xs text-[#8C8476]">
                  Nhấp vào ảnh để thay đổi tệp khác
                </p>
                <button
                  type="button"
                  onClick={handleImageSearch}
                  className="btn-terracotta mt-5 cursor-pointer"
                >
                  <FaSearch className="h-3.5 w-3.5 mr-1" />
                  <span>Tìm Kiếm Thiết Kế Tương Đồng</span>
                </button>
              </div>
            ) : (
              <div>
                <h3 className="font-serif-luxury text-xl sm:text-2xl text-[#161514] font-normal">
                  Kéo thả hình ảnh vào đây hoặc chọn tệp từ máy
                </h3>
                <p className="mt-2 text-xs text-[#8C8476] leading-relaxed">
                  Định dạng hỗ trợ: JPG, PNG, WebP. Dung lượng tối đa: 10MB.
                </p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="btn-noir mt-6 cursor-pointer"
                >
                  <span>Chọn Tệp Ảnh</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-[#F7F5F0] border border-[#E5E0D8] p-6 sm:p-8">
            <label htmlFor="visual-search-query" className="mb-3 block text-xs font-semibold tracking-[0.2em] text-[#161514] uppercase">
              Mô Tả Phong Cách Thiết Kế Quý Khách Đang Tìm Kiếm
            </label>
            <form className="flex flex-col gap-3 sm:flex-row mt-4" onSubmit={handleTextSearchSubmit}>
              <input
                id="visual-search-query"
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={activeMode.placeholder}
                className="min-h-12 flex-1 border border-[#D8D2C5] bg-[#FAF8F5] px-4 text-xs text-[#161514] outline-none transition placeholder:text-[#A8A196] focus:border-[#161514]"
              />
              <button
                type="submit"
                onClick={handleTextSearch}
                disabled={!query.trim()}
                className="btn-terracotta min-h-12 cursor-pointer disabled:opacity-50"
              >
                <FaSearch className="h-3.5 w-3.5 mr-1" />
                <span>Tìm Kiếm</span>
              </button>
            </form>
          </div>
        )}
      </div>
    </section>
  );
}
