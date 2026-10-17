import { useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FaSearch, FaImage, FaMicrophone } from 'react-icons/fa';
import { searchStore } from '../../utils/searchStore';
import CropModal from './CropModal'; 

const MAX_FILE_SIZE = 10 * 1024 * 1024; 

export const CompactSearchBar = ({ className = "" }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [isListening, setIsListening] = useState(false);
  const fileInputRef = useRef(null);

  const [showCropModal, setShowCropModal] = useState(false);
  const [tempImageUrl, setTempImageUrl] = useState(null);
  const [tempOriginalFile, setTempOriginalFile] = useState(null);
  const [fileError, setFileError] = useState('');

  const handleTextSearch = (e) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;
    
    navigate(`/search-result?type=text&q=${encodeURIComponent(query.trim())}&mode=SEMANTIC&page=1&size=20`, { replace: true });
  };

  // Voice Search (Web Speech API)
  const handleVoiceSearch = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Trình duyệt của bạn không hỗ trợ nhận diện giọng nói.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'vi-VN';
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event) => {
      setQuery(event.results[0][0].transcript);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    
    recognition.start();
  };

  const updateSelectedFile = (file) => {
    const isValidType = ['image/jpeg', 'image/png', 'image/webp'].includes(file.type);

    if (!isValidType) {
      setFileError('Vui lòng chọn ảnh JPG, PNG hoặc WebP.');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setFileError('Ảnh cần nhỏ hơn hoặc bằng 10MB.');
      return;
    }

    const tempUrl = URL.createObjectURL(file);
    setTempImageUrl(tempUrl);
    setTempOriginalFile(file);
    setShowCropModal(true);
    setFileError('');
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      updateSelectedFile(file);
    }
  };

  // Hoàn tất/Hủy Crop
  const handleCropComplete = (croppedFile) => {
    setShowCropModal(false);
    if (tempImageUrl) {
      URL.revokeObjectURL(tempImageUrl);
    }
    setTempImageUrl(null);

    searchStore.imageFile = croppedFile;
    navigate('/search-result?type=image&page=1&size=20', { replace: true });

    if (fileInputRef.current) {
      fileInputRef.current.value = ""; 
    }
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

  return (
    <div className={`w-full bg-[#FAF8F5] py-4 ${className}`}>
      <div className="mx-auto w-full max-w-3xl relative">
        <form 
          onSubmit={handleTextSearch} 
          className="flex w-full items-center gap-3 border border-[#E5E0D8] bg-[#FAF8F5] focus-within:border-[#161514] px-4 py-2.5 transition-all shadow-xs"
        >
          <button 
            type="submit"
            className="flex shrink-0 items-center justify-center p-1 text-[#8C8476] hover:text-[#C05A39] transition-colors cursor-pointer"
            title="Tìm kiếm"
          >
            <FaSearch className="size-4" />
          </button>

          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Nhập phong cách, chất liệu hoặc mô tả thiết kế..."
            className="flex-1 w-full bg-transparent px-2 text-xs sm:text-sm text-[#161514] placeholder:text-[#8C8476] focus:outline-none"
          />

          <div className="flex shrink-0 items-center gap-1.5 border-l pl-3 border-[#E5E0D8]">
            <button
              type="button"
              onClick={handleVoiceSearch}
              className={`group relative flex cursor-pointer items-center justify-center p-2 transition-colors ${
                isListening ? 'bg-[#C05A39]/10 text-[#C05A39]' : 'text-[#8C8476] hover:text-[#C05A39]'
              }`}
              title="Tìm bằng giọng nói"
            >
              <FaMicrophone className={`size-4 ${isListening ? 'animate-pulse' : ''}`} />
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="group relative flex cursor-pointer items-center justify-center p-2 text-[#8C8476] hover:text-[#C05A39] transition-colors"
              title="Tìm bằng hình ảnh"
            >
              <FaImage className="size-4" />
            </button>

            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/jpeg, image/png, image/webp"
              onChange={handleImageUpload}
            />
          </div>
        </form>

        {fileError && (
          <p className="absolute -bottom-5 left-2 text-[11px] font-medium text-[#C05A39]">
            {fileError}
          </p>
        )}
      </div>

      {/* Modal Crop */}
      {showCropModal && tempImageUrl && (
        <CropModal
          imageUrl={tempImageUrl}
          onCancel={handleCancelCrop}
          originalFile={tempOriginalFile}
          onCropComplete={handleCropComplete}
        />
      )}
    </div>
  );
};