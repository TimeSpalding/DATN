import React, { useState, useEffect, useRef } from 'react';
import { Plus, Equal, AlertCircle, Sparkles, Camera } from 'lucide-react';
import Navbar from './components/Navbar';
import Header from './components/Header';
import { PRESET_MODELS } from './components/ModelSelector';
import ImageUploader from './components/ImageUploader';
import ResultViewer from './components/ResultViewer';
import TryOnButton from './components/TryOnButton';
import GarmentCatalog, { CATALOG_ITEMS } from './components/GarmentCatalog';
import StudioBenefits from './components/StudioBenefits';
import Footer from './components/Footer';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080').replace(/\/$/, '');

function App() {
  const [personImg, setPersonImg] = useState(null);
  const [clothImg, setClothImg] = useState(null);
  const [personPreview, setPersonPreview] = useState(null);
  const [clothPreview, setClothPreview] = useState(null);
  const [selectedModelId, setSelectedModelId] = useState('studio-female');
  const [isCustomModel, setIsCustomModel] = useState(false);
  const [selectedGarment, setSelectedGarment] = useState(CATALOG_ITEMS[0]);
  const [category, setCategory] = useState('upper');
  const [loading, setLoading] = useState(false);
  const [resultImgUrl, setResultImgUrl] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [elapsedTime, setElapsedTime] = useState(0);
  const [cartCount, setCartCount] = useState(0);
  const [toastMsg, setToastMsg] = useState('');
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

  // Auto-dismiss toast
  useEffect(() => {
    if (toastMsg) {
      const t = setTimeout(() => setToastMsg(''), 4000);
      return () => clearTimeout(t);
    }
  }, [toastMsg]);

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

  // Initialize with curated demo preset on first load
  useEffect(() => {
    loadModelPreset(PRESET_MODELS[0]);
    loadGarmentPreset(CATALOG_ITEMS[0]);
  }, []);

  const loadModelPreset = async (model) => {
    setSelectedModelId(model.id);
    setIsCustomModel(false);
    try {
      const res = await fetch(model.image);
      if (!res.ok) throw new Error(`Không thể tải ảnh mẫu (HTTP ${res.status}).`);
      const blob = await res.blob();
      const file = new File([blob], `${model.id}.jpg`, { type: blob.type || 'image/jpeg' });
      revokeObjectUrl(personObjectUrlRef);
      setPersonPreview(model.image);
      setPersonImg(file);
    } catch (e) {
      revokeObjectUrl(personObjectUrlRef);
      setPersonImg(null);
      setPersonPreview(null);
      setToastMsg(`Không thể tải ảnh người mẫu: ${e.message}`);
    }
  };

  const loadGarmentPreset = async (garment) => {
    setSelectedGarment(garment);
    setCategory(garment.category || 'upper');
    try {
      const res = await fetch(garment.image);
      if (!res.ok) throw new Error(`Không thể tải ảnh trang phục (HTTP ${res.status}).`);
      const blob = await res.blob();
      const file = new File([blob], `${garment.id}.jpg`, { type: blob.type || 'image/jpeg' });
      revokeObjectUrl(clothObjectUrlRef);
      setClothPreview(garment.image);
      setClothImg(file);
    } catch (e) {
      revokeObjectUrl(clothObjectUrlRef);
      setClothImg(null);
      setClothPreview(null);
      setToastMsg(`Không thể tải ảnh trang phục: ${e.message}`);
    }
  };

  const handleCustomModelUpload = (file) => {
    if (!file) return;
    setPersonImg(file);
    setPersonPreview(setObjectPreview(personObjectUrlRef, file));
    setIsCustomModel(true);
    setSelectedModelId('custom');
    setToastMsg('Đã tải lên ảnh người mẫu của bạn!');
  };

  const handleCustomClothUpload = (file) => {
    if (!file) return;
    setClothImg(file);
    setClothPreview(setObjectPreview(clothObjectUrlRef, file));
    setSelectedGarment({
      id: 'custom',
      name: file.name.replace(/\.[^/.]+$/, ''),
      price: 'Mẫu Tải Lên',
      category: category
    });
    setToastMsg('Đã tải lên ảnh trang phục tùy chọn!');
  };

  const handleSelectFromCatalog = (garment) => {
    loadGarmentPreset(garment);
    const studioEl = document.getElementById('studio');
    if (studioEl) {
      studioEl.scrollIntoView({ behavior: 'smooth' });
    }
    setToastMsg(`Đã đưa "${garment.name}" vào phòng thử đồ!`);
  };

  const handleAddToCart = () => {
    setCartCount((c) => c + 1);
    setToastMsg(`Đã thêm "${selectedGarment?.name || 'Trang phục'}" vào túi đồ của bạn!`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!personImg || !clothImg) return;

    setLoading(true);
    setErrorMsg('');
    revokeObjectUrl(resultObjectUrlRef);
    setResultImgUrl(null);
    setElapsedTime(0);

    const formData = new FormData();
    formData.append('person_image', personImg);
    formData.append('cloth_image', clothImg);
    formData.append('category', category);

    try {
      const response = await fetch(`${API_BASE_URL}/api/tryon`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Máy chủ AI trả về lỗi HTTP ${response.status}. Vui lòng thử lại sau.`);
      }

      const blob = await response.blob();
      resultObjectUrlRef.current = URL.createObjectURL(blob);
      setResultImgUrl(resultObjectUrlRef.current);
      setToastMsg('✨ Ướm thử trang phục thành công!');
    } catch (err) {
      setErrorMsg(err.message || `Không thể kết nối đến máy chủ AI tại ${API_BASE_URL}.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf9f6] text-[#111215] flex flex-col font-sans">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-20 right-5 z-50 animate-fade-in">
          <div className="bg-[#111215] text-[#fbfaf8] text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xl border border-white/15 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-[#d4af37]" />
            <span>{toastMsg}</span>
          </div>
        </div>
      )}

      {/* Luxury E-Commerce Navigation Bar */}
      <Navbar cartCount={cartCount} />

      {/* Main Content */}
      <main className="flex-1">
        {/* Studio Section */}
        <section id="studio" className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 pb-12">
          <Header />

          {/* Unified Studio Workbench Frame */}
          <div className="bg-white/90 backdrop-blur-md rounded-3xl border border-[#ded8cc] shadow-sm p-4 sm:p-6 lg:p-8 xl:p-10">
            <form onSubmit={handleSubmit}>
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
                    <div className="inline-flex items-center p-0.5 rounded-full bg-[#f6f5f1] border border-[#ded8cc] text-[9.5px] font-bold uppercase gap-0.5">
                      <button
                        type="button"
                        onClick={() => loadModelPreset(PRESET_MODELS[0])}
                        className={`px-2 py-0.5 rounded-full transition-all cursor-pointer ${selectedModelId === 'studio-female' && !isCustomModel ? 'bg-[#111215] text-white shadow-2xs' : 'text-[#6e7382] hover:text-[#111215]'}`}
                      >
                        Nữ
                      </button>
                      <button
                        type="button"
                        onClick={() => loadModelPreset(PRESET_MODELS[1])}
                        className={`px-2 py-0.5 rounded-full transition-all cursor-pointer ${selectedModelId === 'studio-male' && !isCustomModel ? 'bg-[#111215] text-white shadow-2xs' : 'text-[#6e7382] hover:text-[#111215]'}`}
                      >
                        Nam
                      </button>
                      <label className={`px-2 py-0.5 rounded-full transition-all cursor-pointer flex items-center gap-1 ${isCustomModel ? 'bg-[#111215] text-white shadow-2xs' : 'text-[#6e7382] hover:text-[#111215]'}`}>
                        <Camera className="w-2.5 h-2.5 text-[#a88325]" />
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
                <div className="flex w-8 h-8 rounded-full bg-[#f6f5f1] border border-[#ded8cc] shadow-2xs items-center justify-center justify-self-center text-[#8d887f] font-bold lg:mt-7">
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
                    <div className="inline-flex items-center p-0.5 rounded-full bg-[#f6f5f1] border border-[#ded8cc] text-[9.5px] font-bold uppercase gap-0.5">
                      <button
                        type="button"
                        onClick={() => setCategory('upper')}
                        className={`px-2 py-0.5 rounded-full transition-all cursor-pointer ${category === 'upper' ? 'bg-[#111215] text-white shadow-2xs' : 'text-[#6e7382] hover:text-[#111215]'}`}
                      >
                        Áo
                      </button>
                      <button
                        type="button"
                        onClick={() => setCategory('lower')}
                        className={`px-2 py-0.5 rounded-full transition-all cursor-pointer ${category === 'lower' ? 'bg-[#111215] text-white shadow-2xs' : 'text-[#6e7382] hover:text-[#111215]'}`}
                      >
                        Quần
                      </button>
                      <button
                        type="button"
                        onClick={() => setCategory('overall')}
                        className={`px-2 py-0.5 rounded-full transition-all cursor-pointer ${category === 'overall' ? 'bg-[#111215] text-white shadow-2xs' : 'text-[#6e7382] hover:text-[#111215]'}`}
                      >
                        Đầm
                      </button>
                    </div>
                  }
                  helperText="Chọn từ tủ đồ dưới hoặc tải ảnh áo của bạn"
                />

                {/* Equal Operator */}
                <div className="flex w-8 h-8 rounded-full bg-[#111215] text-[#d4af37] shadow-xs items-center justify-center justify-self-center font-bold lg:mt-7">
                  <Equal className="w-4 h-4" />
                </div>

                {/* 3. Fitting Result Column */}
                <ResultViewer
                  loading={loading}
                  resultImgUrl={resultImgUrl}
                  originalModelUrl={personPreview}
                  elapsedTime={elapsedTime}
                  onAddToCart={handleAddToCart}
                  selectedGarment={selectedGarment}
                  headerRight={
                    resultImgUrl ? (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        Đã Xong
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-[#8d887f] bg-[#f6f5f1] px-2.5 py-0.5 rounded-full border border-[#ded8cc]">
                        Gương Số
                      </span>
                    )
                  }
                />
              </div>

              {/* Error Notice */}
              {errorMsg && (
                <div className="mt-5 max-w-md mx-auto animate-fade-in">
                  <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                </div>
              )}

              {/* Action Area */}
              <div 
                style={{ 
                  marginTop: 36, 
                  marginBottom: 8, 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center' 
                }}
              >
                <TryOnButton
                  loading={loading}
                  disabled={loading || !personImg || !clothImg}
                  elapsedTime={elapsedTime}
                />

                <p className="text-[11px] text-[#8d887f] text-center mt-3.5">
                  💡 <strong>Gợi ý:</strong> Chọn ảnh người mẫu chính diện, đứng thẳng và ánh sáng tự nhiên để đạt độ rủ vải chuẩn xác nhất.
                </p>
              </div>
            </form>
          </div>
        </section>

        {/* Curated Garment Catalog */}
        <GarmentCatalog
          selectedGarmentId={selectedGarment?.id}
          onSelectGarment={handleSelectFromCatalog}
          onUploadCustomClick={() => {
            const studioEl = document.getElementById('studio');
            if (studioEl) studioEl.scrollIntoView({ behavior: 'smooth' });
          }}
        />

        {/* Store Benefits */}
        <StudioBenefits />
      </main>

      {/* Brand Footer */}
      <Footer />
    </div>
  );
}

export default App;
