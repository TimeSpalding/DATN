import { useId, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Image as ImageIcon, Mic, Search, SlidersHorizontal, Upload, X } from 'lucide-react';
import { MAX_FILE_SIZE } from '../../config/constants';
import { searchStore } from '../../utils/searchStore';
import CropModal from './CropModal';
import { ImageWithFallback } from './ImageWithFallback';

const VALID_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const MOBILE_TABS = [
  { id: 'image', label: 'Tìm bằng ảnh', icon: ImageIcon },
  { id: 'composed', label: 'Ảnh + Mô tả', icon: SlidersHorizontal },
  { id: 'text', label: 'Từ khóa', icon: Search },
];

export default function SearchModulesWorkspace({
  activeType = 'text',
  initialQuery = '',
  initialComposedText = '',
  activeImageFile = null,
  activeImageId = null,
  activePreviewUrl = null,
  hasActiveSearch = false,
  pageSize = 20,
}) {
  const navigate = useNavigate();
  const composedInputId = useId();
  const keywordInputId = useId();

  const defaultMobileTab =
    activeType === 'composed'
      ? 'composed'
      : activeType === 'image' || activeType === 'similar'
        ? 'image'
        : 'text';

  const [mobileTab, setMobileTab] = useState(defaultMobileTab);
  const [textInput, setTextInput] = useState(activeType === 'text' ? initialQuery : '');
  const [composedInput, setComposedInput] = useState(
    activeType === 'composed' ? initialComposedText : ''
  );
  const [isListening, setIsListening] = useState(false);

  // Local image override for Module 2 (Composed Search) before submitting
  const [localComposedFile, setLocalComposedFile] = useState(null);
  const [dismissedInheritedImage, setDismissedInheritedImage] = useState(false);

  // Crop modal state ('image' module vs 'composed' module)
  const [cropTargetModule, setCropTargetModule] = useState(null);
  const [tempImageUrl, setTempImageUrl] = useState(null);
  const [tempOriginalFile, setTempOriginalFile] = useState(null);

  const [imageModuleError, setImageModuleError] = useState('');
  const [composedModuleError, setComposedModuleError] = useState('');

  const imageInputRef = useRef(null);
  const composedFileInputRef = useRef(null);
  const composedTextInputRef = useRef(null);

  const localComposedPreviewUrl = useMemo(() => {
    if (!localComposedFile) return null;
    return URL.createObjectURL(localComposedFile);
  }, [localComposedFile]);

  const effectiveComposedFile = localComposedFile || (!dismissedInheritedImage ? activeImageFile : null);
  const effectiveComposedImageId =
    !localComposedFile && !dismissedInheritedImage && !activeImageFile ? activeImageId : null;
  const effectiveComposedPreviewUrl =
    localComposedPreviewUrl || (!dismissedInheritedImage ? activePreviewUrl : null);
  const hasComposedReference = Boolean(effectiveComposedFile || effectiveComposedImageId);

  const validateAndOpenCrop = (file, targetModule) => {
    const setError = targetModule === 'image' ? setImageModuleError : setComposedModuleError;

    if (!VALID_IMAGE_TYPES.includes(file.type)) {
      setError('Chỉ hỗ trợ ảnh định dạng JPG, PNG hoặc WebP.');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError('Dung lượng ảnh tối đa là 10MB.');
      return;
    }

    setError('');
    if (tempImageUrl) {
      URL.revokeObjectURL(tempImageUrl);
    }
    setTempImageUrl(URL.createObjectURL(file));
    setTempOriginalFile(file);
    setCropTargetModule(targetModule);
  };

  const closeCropModal = () => {
    if (tempImageUrl) {
      URL.revokeObjectURL(tempImageUrl);
    }
    setTempImageUrl(null);
    setTempOriginalFile(null);
    setCropTargetModule(null);
    if (imageInputRef.current) imageInputRef.current.value = '';
    if (composedFileInputRef.current) composedFileInputRef.current.value = '';
  };

  const handleCropComplete = (croppedFile) => {
    const target = cropTargetModule;
    closeCropModal();

    if (target === 'image') {
      searchStore.imageFile = croppedFile;
      navigate(`/search-result?type=image&page=1&size=${pageSize}`, {
        state: {
          type: 'image',
          imageFile: croppedFile,
        },
      });
      return;
    }

    if (target === 'composed') {
      setLocalComposedFile(croppedFile);
      setDismissedInheritedImage(false);
      setComposedModuleError('');
      setTimeout(() => {
        composedTextInputRef.current?.focus();
      }, 50);
    }
  };

  const handleComposedSubmit = (event) => {
    event.preventDefault();
    const trimmed = composedInput.trim();

    if (!hasComposedReference) {
      setComposedModuleError('Vui lòng chọn ảnh mẫu trước khi tìm kết hợp.');
      return;
    }

    if (!trimmed) {
      setComposedModuleError('Vui lòng nhập mô tả điều chỉnh (ví dụ: đổi màu, tay ngắn...).');
      composedTextInputRef.current?.focus();
      return;
    }

    setComposedModuleError('');

    if (effectiveComposedFile) {
      searchStore.imageFile = effectiveComposedFile;
      navigate(
        `/search-result?type=composed&text=${encodeURIComponent(trimmed)}&page=1&size=${pageSize}`,
        {
          state: {
            type: 'composed',
            imageFile: effectiveComposedFile,
            modificationText: trimmed,
          },
        }
      );
      return;
    }

    if (effectiveComposedImageId) {
      navigate(
        `/search-result?type=composed&imageId=${effectiveComposedImageId}&text=${encodeURIComponent(trimmed)}&page=1&size=${pageSize}`,
        {
          state: {
            type: 'composed',
            imageId: effectiveComposedImageId,
            modificationText: trimmed,
          },
        }
      );
    }
  };

  const handleTextSubmit = (event) => {
    event.preventDefault();
    const trimmed = textInput.trim();
    if (!trimmed) return;

    const params = new URLSearchParams({
      type: 'text',
      q: trimmed,
      mode: 'SEMANTIC',
      page: '1',
      size: String(pageSize),
    });

    navigate(`/search-result?${params.toString()}`, {
      state: {
        type: 'text',
        query: trimmed,
        mode: 'SEMANTIC',
      },
    });
  };

  const handleVoiceSearch = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Trình duyệt không hỗ trợ nhận diện giọng nói.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'vi-VN';
    recognition.interimResults = false;
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript || '';
      if (transcript) {
        setTextInput(transcript);
      }
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  const handleClearComposedImage = (event) => {
    event.stopPropagation();
    setLocalComposedFile(null);
    setDismissedInheritedImage(true);
    if (composedFileInputRef.current) {
      composedFileInputRef.current.value = '';
    }
  };

  const isImageActive = hasActiveSearch && (activeType === 'image' || activeType === 'similar');
  const isComposedActive = hasActiveSearch && activeType === 'composed';
  const isTextActive = hasActiveSearch && activeType === 'text';

  return (
    <div className="w-full">
      {cropTargetModule && tempImageUrl && (
        <CropModal
          imageUrl={tempImageUrl}
          originalFile={tempOriginalFile}
          onCancel={closeCropModal}
          onCropComplete={handleCropComplete}
        />
      )}

      {/* Mobile / Tablet Quick Module Switcher */}
      <div
        role="tablist"
        aria-label="Chọn phương thức tìm kiếm"
        className="mb-3 grid grid-cols-3 border border-[#E5E0D8] bg-[#FAF8F5] lg:hidden"
      >
        {MOBILE_TABS.map((tab) => {
          const Icon = tab.icon;
          const selected = mobileTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setMobileTab(tab.id)}
              className={`flex cursor-pointer items-center justify-center gap-1.5 border-b-2 px-2 py-3 text-[10.5px] font-semibold tracking-[0.12em] uppercase transition-colors ${
                selected
                  ? 'border-[#161514] bg-[#F3EFE6] text-[#161514]'
                  : 'border-transparent text-[#8C8476] hover:text-[#161514]'
              }`}
            >
              <Icon aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Always-Ready 3 Search Modules Deck */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* MODULE 01: IMAGE SEARCH */}
        <div
          className={`${
            mobileTab === 'image' ? 'flex' : 'hidden lg:flex'
          } flex-col justify-between border bg-[#FAF8F5] p-4 transition-colors sm:p-5 ${
            isImageActive ? 'border-[#161514] shadow-xs' : 'border-[#E5E0D8] hover:border-[#D8D2C5]'
          }`}
        >
          <div>
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <ImageIcon aria-hidden="true" className="h-3.5 w-3.5 text-[#C05A39]" />
                <span className="text-[10.5px] font-semibold tracking-[0.16em] text-[#161514] uppercase">
                  01 &bull; Tìm Bằng Hình Ảnh
                </span>
              </div>
              {isImageActive && (
                <span className="bg-[#F3EFE6] px-2 py-0.5 text-[9.5px] font-semibold tracking-wider text-[#C05A39] uppercase">
                  Đang dùng
                </span>
              )}
            </div>

            <input
              ref={imageInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) validateAndOpenCrop(file, 'image');
              }}
              className="hidden"
            />

            <div
              role="button"
              tabIndex={0}
              onClick={() => imageInputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  imageInputRef.current?.click();
                }
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files?.[0];
                if (file) validateAndOpenCrop(file, 'image');
              }}
              className="flex min-h-[84px] cursor-pointer items-center gap-3.5 border border-dashed border-[#D8D2C5] bg-[#F7F5F0] px-3.5 py-3 transition-colors hover:border-[#161514] hover:bg-[#F3EFE6]"
            >
              {isImageActive && activePreviewUrl ? (
                <>
                  <div className="h-14 w-12 shrink-0 overflow-hidden border border-[#E5E0D8] bg-[#FAF8F5]">
                    <ImageWithFallback
                      src={activePreviewUrl}
                      imageId={activeImageId}
                      alt="Ảnh đang tìm kiếm"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1 text-left">
                    <p className="text-xs font-medium text-[#161514]">
                      Đang tra cứu theo ảnh mẫu
                    </p>
                    <p className="mt-0.5 text-[11px] text-[#6B655D]">
                      Nhấn hoặc kéo thả ảnh mới để đổi mẫu khác
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-[#D8D2C5] bg-[#EAE5D9] text-[#161514]">
                    <Upload aria-hidden="true" className="h-4 w-4 stroke-[1.75]" />
                  </div>
                  <div className="min-w-0 flex-1 text-left">
                    <p className="text-xs font-medium text-[#161514]">
                      Tải ảnh lên hoặc kéo thả vào đây
                    </p>
                    <p className="mt-0.5 text-[11px] text-[#8C8476]">
                      Hỗ trợ JPG, PNG, WebP (tối đa 10MB)
                    </p>
                  </div>
                </>
              )}
            </div>

            {imageModuleError && (
              <p className="mt-2 text-[11px] font-medium text-[#C05A39]">{imageModuleError}</p>
            )}
          </div>

          <button
            type="button"
            onClick={() => imageInputRef.current?.click()}
            className="mt-3 flex h-9 w-full cursor-pointer items-center justify-center gap-2 bg-[#161514] px-4 text-[10.5px] font-semibold tracking-[0.16em] text-[#FAF8F5] uppercase transition-colors hover:bg-[#C05A39]"
          >
            <ImageIcon aria-hidden="true" className="h-3.5 w-3.5" />
            <span>{isImageActive ? 'Chọn Ảnh Khác' : 'Chọn Ảnh Tìm Kiếm'}</span>
          </button>
        </div>

        {/* MODULE 02: COMPOSED SEARCH (IMAGE + TEXT) */}
        <form
          onSubmit={handleComposedSubmit}
          className={`${
            mobileTab === 'composed' ? 'flex' : 'hidden lg:flex'
          } flex-col justify-between border bg-[#FAF8F5] p-4 transition-colors sm:p-5 ${
            isComposedActive ? 'border-[#161514] shadow-xs' : 'border-[#E5E0D8] hover:border-[#D8D2C5]'
          }`}
        >
          <div>
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <SlidersHorizontal aria-hidden="true" className="h-3.5 w-3.5 text-[#C05A39]" />
                <label
                  htmlFor={composedInputId}
                  className="text-[10.5px] font-semibold tracking-[0.16em] text-[#161514] uppercase"
                >
                  02 &bull; Kết Hợp Ảnh &amp; Mô Tả
                </label>
              </div>
              {isComposedActive && (
                <span className="bg-[#F3EFE6] px-2 py-0.5 text-[9.5px] font-semibold tracking-wider text-[#C05A39] uppercase">
                  Đang dùng
                </span>
              )}
            </div>

            <input
              ref={composedFileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) validateAndOpenCrop(file, 'composed');
              }}
              className="hidden"
            />

            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files?.[0];
                if (file) validateAndOpenCrop(file, 'composed');
              }}
              className="flex min-h-[84px] items-center gap-3 border border-[#E5E0D8] bg-[#F7F5F0] p-2.5"
            >
              {hasComposedReference && effectiveComposedPreviewUrl ? (
                <div className="relative h-14 w-12 shrink-0 border border-[#D8D2C5] bg-[#FAF8F5]">
                  <button
                    type="button"
                    onClick={() => composedFileInputRef.current?.click()}
                    title="Nhấn để đổi ảnh mẫu"
                    className="h-full w-full cursor-pointer overflow-hidden block"
                  >
                    <ImageWithFallback
                      src={effectiveComposedPreviewUrl}
                      imageId={effectiveComposedImageId}
                      alt="Ảnh mẫu kết hợp"
                      className="h-full w-full object-cover"
                    />
                  </button>
                  <button
                    type="button"
                    onClick={handleClearComposedImage}
                    aria-label="Gỡ ảnh mẫu"
                    className="absolute -top-1.5 -right-1.5 flex h-4.5 w-4.5 cursor-pointer items-center justify-center bg-[#161514] text-[#FAF8F5] hover:bg-[#C05A39]"
                  >
                    <X aria-hidden="true" className="h-2.5 w-2.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => composedFileInputRef.current?.click()}
                  className="flex h-14 w-14 shrink-0 cursor-pointer flex-col items-center justify-center gap-1 border border-dashed border-[#D8D2C5] bg-[#EAE5D9]/70 text-[#161514] transition-colors hover:border-[#161514] hover:bg-[#EAE5D9]"
                >
                  <Upload aria-hidden="true" className="h-3.5 w-3.5" />
                  <span className="text-[9px] font-semibold tracking-wider uppercase">Ảnh mẫu</span>
                </button>
              )}

              <div className="min-w-0 flex-1">
                <input
                  ref={composedTextInputRef}
                  id={composedInputId}
                  type="text"
                  value={composedInput}
                  onChange={(e) => {
                    setComposedInput(e.target.value);
                    if (composedModuleError) setComposedModuleError('');
                  }}
                  placeholder="VD: đổi sang màu đen, tay ngắn..."
                  className="h-9 w-full border border-[#D8D2C5] bg-[#FAF8F5] px-3 text-xs text-[#161514] placeholder:text-[#8C8476] focus:border-[#161514] focus:outline-none"
                />
                <div className="mt-1.5 flex items-center justify-between text-[10.5px] text-[#8C8476]">
                  <span className="truncate">
                    {hasComposedReference ? 'Đã có ảnh mẫu tham chiếu' : 'Bước 1: Chọn ảnh • Bước 2: Nhập thay đổi'}
                  </span>
                  {hasComposedReference && (
                    <button
                      type="button"
                      onClick={() => composedFileInputRef.current?.click()}
                      className="ml-2 shrink-0 cursor-pointer font-medium text-[#C05A39] hover:underline"
                    >
                      Đổi ảnh
                    </button>
                  )}
                </div>
              </div>
            </div>

            {composedModuleError && (
              <p className="mt-2 text-[11px] font-medium text-[#C05A39]">{composedModuleError}</p>
            )}
          </div>

          <button
            type="submit"
            className="mt-3 flex h-9 w-full cursor-pointer items-center justify-center gap-2 bg-[#161514] px-4 text-[10.5px] font-semibold tracking-[0.16em] text-[#FAF8F5] uppercase transition-colors hover:bg-[#C05A39]"
          >
            <SlidersHorizontal aria-hidden="true" className="h-3.5 w-3.5" />
            <span>Tìm Kết Hợp</span>
          </button>
        </form>

        {/* MODULE 03: KEYWORD / DESCRIPTION SEARCH */}
        <form
          onSubmit={handleTextSubmit}
          className={`${
            mobileTab === 'text' ? 'flex' : 'hidden lg:flex'
          } flex-col justify-between border bg-[#FAF8F5] p-4 transition-colors sm:p-5 ${
            isTextActive ? 'border-[#161514] shadow-xs' : 'border-[#E5E0D8] hover:border-[#D8D2C5]'
          }`}
        >
          <div>
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Search aria-hidden="true" className="h-3.5 w-3.5 text-[#C05A39]" />
                <label
                  htmlFor={keywordInputId}
                  className="text-[10.5px] font-semibold tracking-[0.16em] text-[#161514] uppercase"
                >
                  03 &bull; Tìm Bằng Từ Khóa
                </label>
              </div>
              {isTextActive && (
                <span className="bg-[#F3EFE6] px-2 py-0.5 text-[9.5px] font-semibold tracking-wider text-[#C05A39] uppercase">
                  Đang dùng
                </span>
              )}
            </div>

            <div className="flex min-h-[84px] flex-col justify-center border border-[#E5E0D8] bg-[#F7F5F0] p-2.5">
              <div className="flex h-9 w-full items-center border border-[#D8D2C5] bg-[#FAF8F5] focus-within:border-[#161514]">
                <input
                  id={keywordInputId}
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Nhập kiểu dáng, chất liệu, màu sắc..."
                  className="h-full flex-1 bg-transparent px-3 text-xs text-[#161514] placeholder:text-[#8C8476] focus:outline-none"
                />

                {textInput && (
                  <button
                    type="button"
                    onClick={() => setTextInput('')}
                    aria-label="Xóa từ khóa"
                    className="flex h-full cursor-pointer items-center justify-center px-2 text-[#8C8476] hover:text-[#161514]"
                  >
                    <X aria-hidden="true" className="h-3.5 w-3.5" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleVoiceSearch}
                  aria-label="Nhập bằng giọng nói"
                  title="Nhập bằng giọng nói"
                  className={`flex h-full cursor-pointer items-center justify-center border-l border-[#E5E0D8] px-2.5 transition-colors ${
                    isListening
                      ? 'bg-[#C05A39]/15 text-[#C05A39]'
                      : 'text-[#8C8476] hover:text-[#C05A39]'
                  }`}
                >
                  <Mic aria-hidden="true" className={`h-3.5 w-3.5 ${isListening ? 'animate-pulse' : ''}`} />
                </button>
              </div>

              <p className="mt-1.5 truncate text-[10.5px] text-[#8C8476]">
                Gợi ý: áo sơ mi trắng, đầm xếp ly, áo khoác len...
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={!textInput.trim()}
            className="mt-3 flex h-9 w-full cursor-pointer items-center justify-center gap-2 bg-[#161514] px-4 text-[10.5px] font-semibold tracking-[0.16em] text-[#FAF8F5] uppercase transition-colors hover:bg-[#C05A39] disabled:cursor-not-allowed disabled:opacity-45"
          >
            <Search aria-hidden="true" className="h-3.5 w-3.5" />
            <span>Tìm Theo Từ Khóa</span>
          </button>
        </form>
      </div>
    </div>
  );
}

