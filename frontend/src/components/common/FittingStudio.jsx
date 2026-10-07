import React, { useState, useEffect, useRef } from 'react';
import { Plus, Equal, AlertCircle, Camera, Sparkles, Scissors, Zap, ShieldCheck } from 'lucide-react';
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

  // If initialGarment changes from outside (e.g. user clicked "Thử đồ ảo" in product card)
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
    showToast('Đã tải lên ảnh người mẫu của bạn!');
  };

  const handleCustomClothUpload = (file) => {
    if (!file) return;
    setClothImg(file);
    setClothPreview(setObjectPreview(clothObjectUrlRef, file));
    setSelectedGarment({
      id: `custom-${Date.now()}`,
      name: file.name.replace(/\.[^/.]+$/, ''),
      price: 'Mẫu Tải Lên',
      category: category,
      rawPrice: 350000,
      image: clothPreview
    });
    showToast('Đã tải lên ảnh trang phục tùy chọn!');
  };

  const handleSubmitTryOn = async (e) => {
    e.preventDefault();
    if (!personImg || !clothImg) {
      setErrorMsg('Vui lòng chọn hoặc tải đủ ảnh Người Mẫu & Trang Phục');
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
        showToast('Ướm thử thành công! Kết quả đã hiển thị trên gương số.');
      } else {
        throw new Error('Không nhận được dữ liệu kết quả từ hệ thống AI.');
      }
    } catch (err) {
      console.error('TryOn execution error:', err);
      setErrorMsg(err.message || 'Đã có lỗi xảy ra khi thực hiện thử đồ.');
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
    <section id="studio" className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Studio Header */}
      <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-[10px] font-bold uppercase tracking-[0.25em] text-blue-900 mb-3">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>PHÒNG THỬ ĐỒ KỸ THUẬT SỐ &bull; AI VIRTUAL TRY-ON</span>
        </div>

        <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-slate-950 tracking-tight">
          Gương Soi Thời Trang Kỹ Thuật Số
        </h2>

        <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed max-w-xl mx-auto">
          Ướm thử trang phục thời gian thực trên vóc dáng thật với độ rủ và chi tiết sợi vải chuẩn xác trước khi quyết định mua sắm.
        </p>

        {/* Feature bullets */}
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 mt-4 text-[11px] font-semibold text-slate-500">
          <span className="flex items-center gap-1">
            <Scissors className="w-3.5 h-3.5 text-blue-700" />
            <span>Mô phỏng sợi vải 4K</span>
          </span>
          <span className="text-slate-300">&bull;</span>
          <span className="flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-blue-700" />
            <span>Xem trước trong giây lát</span>
          </span>
          <span className="text-slate-300">&bull;</span>
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Bảo mật hình ảnh 100%</span>
          </span>
        </div>
      </div>

      {/* Main Studio Interactive Box */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 p-5 sm:p-7 lg:p-9 transition-all">
        <form onSubmit={handleSubmitTryOn}>
          {/* 3-Column Fitting Stage */}
          <div className="grid grid-cols-1 items-start gap-5 sm:gap-6 lg:grid-cols-[minmax(0,1fr)_2.5rem_minmax(0,1fr)_2.5rem_minmax(0,1fr)] lg:items-center lg:gap-4 xl:gap-6">
            
            {/* 1. Model Column */}
            <ImageUploader
              label="Người Mẫu"
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
                <div className="inline-flex items-center p-0.5 rounded-full bg-slate-100 border border-slate-200 text-[9.5px] font-bold uppercase gap-0.5">
                  <button
                    type="button"
                    onClick={() => loadModelPreset(PRESET_MODELS[0])}
                    className={`px-2.5 py-1 rounded-full transition-all cursor-pointer ${selectedModelId === 'studio-female' && !isCustomModel ? 'bg-slate-950 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-950'}`}
                  >
                    Nữ
                  </button>
                  <button
                    type="button"
                    onClick={() => loadModelPreset(PRESET_MODELS[1])}
                    className={`px-2.5 py-1 rounded-full transition-all cursor-pointer ${selectedModelId === 'studio-male' && !isCustomModel ? 'bg-slate-950 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-950'}`}
                  >
                    Nam
                  </button>
                  <label className={`px-2 py-1 rounded-full transition-all cursor-pointer flex items-center gap-1 ${isCustomModel ? 'bg-slate-950 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-950'}`}>
                    <Camera className="w-2.5 h-2.5 text-blue-700" />
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
            <div className="flex w-9 h-9 rounded-full bg-slate-100 border border-slate-200 shadow-2xs items-center justify-center justify-self-center text-slate-500 font-bold lg:mt-7">
              <Plus className="w-4 h-4" />
            </div>

            {/* 2. Garment Column */}
            <ImageUploader
              label="Trang Phục"
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
                <div className="inline-flex items-center p-0.5 rounded-full bg-slate-100 border border-slate-200 text-[9.5px] font-bold uppercase gap-0.5">
                  <button
                    type="button"
                    onClick={() => setCategory('upper')}
                    className={`px-2.5 py-1 rounded-full transition-all cursor-pointer ${category === 'upper' ? 'bg-slate-950 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-950'}`}
                  >
                    Áo
                  </button>
                  <button
                    type="button"
                    onClick={() => setCategory('lower')}
                    className={`px-2.5 py-1 rounded-full transition-all cursor-pointer ${category === 'lower' ? 'bg-slate-950 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-950'}`}
                  >
                    Quần
                  </button>
                  <button
                    type="button"
                    onClick={() => setCategory('overall')}
                    className={`px-2.5 py-1 rounded-full transition-all cursor-pointer ${category === 'overall' ? 'bg-slate-950 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-950'}`}
                  >
                    Đầm
                  </button>
                </div>
              }
              helperText="Chọn từ tủ đồ dưới hoặc tải ảnh của bạn"
            />

            {/* Equal Operator */}
            <div className="flex w-9 h-9 rounded-full bg-blue-900 text-white shadow-xs items-center justify-center justify-self-center font-bold lg:mt-7">
              <Equal className="w-4 h-4" />
            </div>

            {/* 3. Fitting Result Column */}
            <ResultViewer
              loading={loading}
              resultImgUrl={resultImgUrl}
              originalModelUrl={personPreview}
              elapsedTime={elapsedTime}
              onAddToCart={handleAddToCartResult}
              selectedGarment={selectedGarment}
              headerRight={
                resultImgUrl ? (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    Đã Xong
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                    Gương Số
                  </span>
                )
              }
            />
          </div>

          {/* Error Notice */}
          {errorMsg && (
            <div className="mt-5 max-w-md mx-auto">
              <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            </div>
          )}

          {/* Action Area */}
          <div className="mt-9 mb-2 flex flex-col items-center">
            <TryOnButton
              loading={loading}
              disabled={loading || !personImg || !clothImg}
              elapsedTime={elapsedTime}
            />

            <p className="text-[11px] text-slate-400 text-center mt-3.5">
              Gợi ý: Chọn ảnh người mẫu chụp chính diện, đứng thẳng và ánh sáng đồng đều để đạt độ rủ vải tự nhiên nhất.
            </p>
          </div>
        </form>
      </div>
    </section>
  );
}
