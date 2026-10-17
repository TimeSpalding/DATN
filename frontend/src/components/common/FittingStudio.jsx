import React, { useState, useEffect, useRef } from 'react';
import { Plus, Equal, AlertCircle, Camera } from 'lucide-react';
import ImageUploader from './ImageUploader';
import ResultViewer from './ResultViewer';
import TryOnButton from './TryOnButton';
import { PRESET_MODELS, CATALOG_PRODUCTS } from '../../mocks/catalogData';
import { requestTryOn } from '../../services/tryonService';
import { useCart } from '../../contexts/CartContext';

export default function FittingStudio({ initialGarment = null }) {
  const { addToCart, showToast } = useCart();

  const [personImg, setPersonImg] = useState(null);
  const [clothImg, setClothImg] = useState(null);
  const [personPreview, setPersonPreview] = useState(null);
  const [clothPreview, setClothPreview] = useState(null);
  const [selectedModelId, setSelectedModelId] = useState('studio-female');
  const [isCustomModel, setIsCustomModel] = useState(false);
  const [selectedGarment, setSelectedGarment] = useState(initialGarment || CATALOG_PRODUCTS[0]);
  const [category, setCategory] = useState(initialGarment?.category || 'upper');
  const [loading, setLoading] = useState(false);
  const [resultImgUrl, setResultImgUrl] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [elapsedTime, setElapsedTime] = useState(0);

  const personObjectUrlRef = useRef(null);
  const clothObjectUrlRef = useRef(null);
  const resultObjectUrlRef = useRef(null);

  const revokeObjectUrl = (urlRef) => {
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }
  };

  const setObjectPreview = (urlRef, file) => {
    revokeObjectUrl(urlRef);
    const url = URL.createObjectURL(file);
    urlRef.current = url;
    return url;
  };

  useEffect(() => () => {
    revokeObjectUrl(personObjectUrlRef);
    revokeObjectUrl(clothObjectUrlRef);
    revokeObjectUrl(resultObjectUrlRef);
  }, []);

  // Loading timer
  useEffect(() => {
    let timer;
    if (loading) {
      timer = setInterval(() => setElapsedTime((p) => p + 1), 1000);
    } else {
      clearInterval(timer);
    }
    return () => clearInterval(timer);
  }, [loading]);

  // If initialGarment changes from outside
  useEffect(() => {
    if (initialGarment) {
      loadGarmentPreset(initialGarment);
    }
  }, [initialGarment]);

  // Initialize with preset on first load
  useEffect(() => {
    loadModelPreset(PRESET_MODELS[0]);
    if (!initialGarment) {
      loadGarmentPreset(CATALOG_PRODUCTS[0]);
    }
  }, []);

  const loadModelPreset = async (model) => {
    setSelectedModelId(model.id);
    setIsCustomModel(false);
    revokeObjectUrl(personObjectUrlRef);
    setPersonPreview(model.image);
    setPersonImg(model.image);
  };

  const loadGarmentPreset = async (garment) => {
    setSelectedGarment(garment);
    setCategory(garment.category || 'upper');
    revokeObjectUrl(clothObjectUrlRef);
    setClothPreview(garment.image);
    setClothImg(garment.image);
  };

  const handleCustomModelUpload = (file) => {
    if (!file) return;
    setPersonImg(file);
    setPersonPreview(setObjectPreview(personObjectUrlRef, file));
    setIsCustomModel(true);
    setSelectedModelId('custom');
    showToast('Đã tải lên ảnh chân dung của quý khách');
  };

  const handleCustomClothUpload = (file) => {
    if (!file) return;
    setClothImg(file);
    setClothPreview(setObjectPreview(clothObjectUrlRef, file));
    setSelectedGarment({
      id: `custom-${Date.now()}`,
      name: file.name.replace(/\.[^/.]+$/, ''),
      price: 'Thiết Kế Tùy Chọn',
      category: category,
      rawPrice: 450000,
      image: clothPreview
    });
    showToast('Đã tải lên ảnh trang phục tùy chọn');
  };

  const handleSubmitTryOn = async (e) => {
    e.preventDefault();
    if (!personImg || !clothImg) {
      setErrorMsg('Vui lòng chọn hoặc tải đủ ảnh Người Mặc & Trang Phục');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setResultImgUrl(null);
    setElapsedTime(0);

    try {
      const response = await requestTryOn({
        personImage: personImg,
        clothImage: clothImg,
        category: category,
        presetResultUrl: (selectedModelId === 'studio-female' && selectedGarment?.id === 'polo-retro-knit')
          ? '/samples/model-1.jpg'
          : null
      });

      if (response?.data?.resultImageUrl) {
        setResultImgUrl(response.data.resultImageUrl);
        showToast('Ướm thử hoàn tất. Kết quả hiển thị trên gương soi.');
      } else {
        throw new Error('Không nhận được dữ liệu kết quả từ phòng đo.');
      }
    } catch (err) {
      console.error('TryOn execution error:', err);
      setErrorMsg(err.message || 'Đã có sự cố khi kết nối phòng đo.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCartResult = () => {
    if (selectedGarment) {
      addToCart(selectedGarment, 'M', selectedGarment.colors?.[0]?.name, 1, true);
    }
  };

  return (
    <section id="studio" className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Studio Editorial Header */}
      <div className="text-center max-w-2xl mx-auto mb-12">
        <p className="text-[10px] font-semibold tracking-[0.25em] text-[#C05A39] uppercase mb-2">
          SUITE D'ESSAYAGE &bull; PHÒNG ƯỚM THỬ TƯ GIA
        </p>

        <h2 className="font-serif-luxury text-3xl sm:text-4xl md:text-5xl font-normal text-[#161514] tracking-wide">
          Gương Soi Thời Trang Kỹ Thuật Số
        </h2>

        <div className="w-12 h-[1px] bg-[#C05A39] mx-auto my-4" />

        <p className="text-xs sm:text-sm text-[#6B655D] leading-relaxed max-w-xl mx-auto">
          Mô phỏng chân thực độ rủ sợi dệt, nếp gấp vải và phom dáng trang phục trên người mặc theo tiêu chuẩn đo đạc riêng tư của Maison.
        </p>

        {/* Tailoring Sub-notes */}
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-4 text-[10.5px] font-medium tracking-wider uppercase text-[#8C8476]">
          <span>Mô Phỏng Cấu Trúc Sợi Dệt</span>
          <span>&bull;</span>
          <span>Kết Xuất Trong Giây Lát</span>
          <span>&bull;</span>
          <span>Bảo Mật Hình Ảnh Tuyệt Đối</span>
        </div>
      </div>

      {/* Main Studio Stage Box */}
      <div className="bg-[#FAF8F5] border border-[#E5E0D8] p-6 sm:p-8 lg:p-10 shadow-xs">
        <form onSubmit={handleSubmitTryOn}>
          {/* 3-Column Fitting Stage */}
          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_2.5rem_minmax(0,1fr)_2.5rem_minmax(0,1fr)] lg:items-center lg:gap-4 xl:gap-6">
            
            {/* 1. Model Column */}
            <ImageUploader
              label="01. Người Mặc"
              icon="person"
              file={personImg}
              preview={personPreview}
              onFileChange={handleCustomModelUpload}
              onClear={() => {
                revokeObjectUrl(personObjectUrlRef);
                setPersonImg(null);
                setPersonPreview(null);
                setIsCustomModel(false);
              }}
              headerRight={
                <div className="inline-flex items-center border border-[#E5E0D8] bg-[#F7F5F0] text-[9.5px] font-medium uppercase">
                  <button
                    type="button"
                    onClick={() => loadModelPreset(PRESET_MODELS[0])}
                    className={`px-2.5 py-1 transition-all cursor-pointer ${selectedModelId === 'studio-female' && !isCustomModel ? 'bg-[#161514] text-[#FAF8F5]' : 'text-[#6B655D] hover:text-[#161514]'}`}
                  >
                    Nữ
                  </button>
                  <button
                    type="button"
                    onClick={() => loadModelPreset(PRESET_MODELS[1])}
                    className={`px-2.5 py-1 transition-all cursor-pointer ${selectedModelId === 'studio-male' && !isCustomModel ? 'bg-[#161514] text-[#FAF8F5]' : 'text-[#6B655D] hover:text-[#161514]'}`}
                  >
                    Nam
                  </button>
                  <label className={`px-2 py-1 transition-all cursor-pointer flex items-center gap-1 ${isCustomModel ? 'bg-[#161514] text-[#FAF8F5]' : 'text-[#6B655D] hover:text-[#161514]'}`}>
                    <Camera className="w-2.5 h-2.5" />
                    <span>Tải ảnh</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && handleCustomModelUpload(e.target.files[0])}
                    />
                  </label>
                </div>
              }
              helperText="Tải ảnh chính diện hoặc chọn mẫu Nữ / Nam"
            />

            {/* Plus Operator */}
            <div className="flex w-8 h-8 bg-[#F3EFE6] border border-[#E5E0D8] items-center justify-center justify-self-center text-[#8C8476] lg:mt-6">
              <Plus className="w-3.5 h-3.5" />
            </div>

            {/* 2. Garment Column */}
            <ImageUploader
              label="02. Trang Phục"
              icon="cloth"
              file={clothImg}
              preview={clothPreview}
              onFileChange={handleCustomClothUpload}
              onClear={() => {
                revokeObjectUrl(clothObjectUrlRef);
                setClothImg(null);
                setClothPreview(null);
                setSelectedGarment(null);
              }}
              headerRight={
                <div className="inline-flex items-center border border-[#E5E0D8] bg-[#F7F5F0] text-[9.5px] font-medium uppercase">
                  <button
                    type="button"
                    onClick={() => setCategory('upper')}
                    className={`px-2.5 py-1 transition-all cursor-pointer ${category === 'upper' ? 'bg-[#161514] text-[#FAF8F5]' : 'text-[#6B655D] hover:text-[#161514]'}`}
                  >
                    Áo
                  </button>
                  <button
                    type="button"
                    onClick={() => setCategory('lower')}
                    className={`px-2.5 py-1 transition-all cursor-pointer ${category === 'lower' ? 'bg-[#161514] text-[#FAF8F5]' : 'text-[#6B655D] hover:text-[#161514]'}`}
                  >
                    Quần
                  </button>
                  <button
                    type="button"
                    onClick={() => setCategory('overall')}
                    className={`px-2.5 py-1 transition-all cursor-pointer ${category === 'overall' ? 'bg-[#161514] text-[#FAF8F5]' : 'text-[#6B655D] hover:text-[#161514]'}`}
                  >
                    Đầm
                  </button>
                </div>
              }
              helperText="Chọn từ tủ đồ hoặc tải ảnh của quý khách"
            />

            {/* Equal Operator */}
            <div className="flex w-8 h-8 bg-[#161514] text-[#FAF8F5] items-center justify-center justify-self-center lg:mt-6">
              <Equal className="w-3.5 h-3.5" />
            </div>

            {/* 3. Fitting Result Column */}
            <ResultViewer
              loading={loading}
              resultImgUrl={resultImgUrl}
              originalModelUrl={personPreview}
              elapsedTime={elapsedTime}
              onAddToCart={handleAddToCartResult}
              selectedGarment={selectedGarment}
            />
          </div>

          {/* Error Notice */}
          {errorMsg && (
            <div className="mt-6 max-w-md mx-auto">
              <div className="flex items-center gap-2.5 px-4 py-2.5 bg-[#FAF8F5] border border-[#C05A39] text-[#C05A39] text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            </div>
          )}

          {/* Action Area */}
          <div className="mt-10 mb-2 flex flex-col items-center">
            <TryOnButton
              loading={loading}
              disabled={loading || !personImg || !clothImg}
              elapsedTime={elapsedTime}
            />

            <p className="text-[11px] text-[#8C8476] text-center mt-4 max-w-md leading-relaxed">
              Lời khuyên ướm thử: Hãy chọn ảnh chụp toàn thân hoặc bán thân đứng thẳng với ánh sáng tự nhiên để đạt độ sắc nét và rủ vải tinh tế nhất.
            </p>
          </div>
        </form>
      </div>
    </section>
  );
}
