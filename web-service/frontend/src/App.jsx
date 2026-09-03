import React, { useState, useEffect } from 'react';

function App() {
  const [personImg, setPersonImg] = useState(null);
  const [clothImg, setClothImg] = useState(null);
  const [personPreview, setPersonPreview] = useState(null);
  const [clothPreview, setClothPreview] = useState(null);
  const [category, setCategory] = useState('overall'); // Cập nhật mặc định là overall
  const [loading, setLoading] = useState(false);
  const [resultImgUrl, setResultImgUrl] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [elapsedTime, setElapsedTime] = useState(0);

  // Bộ đếm thời gian
  useEffect(() => {
    let timer;
    if (loading) {
      timer = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(timer);
    }
    return () => clearInterval(timer);
  }, [loading]);

  const handlePersonChange = (e) => {
    const file = e.target.files[0];
    setPersonImg(file);
    if (file) setPersonPreview(URL.createObjectURL(file));
  };

  const handleClothChange = (e) => {
    const file = e.target.files[0];
    setClothImg(file);
    if (file) setClothPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!personImg || !clothImg) {
      alert("Vui lòng chọn đủ 2 ảnh (Ảnh người mẫu và Ảnh trang phục)!");
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setResultImgUrl(null);
    setElapsedTime(0);

    const formData = new FormData();
    formData.append('person_image', personImg);
    formData.append('cloth_image', clothImg);
    formData.append('category', category);

    try {
      // Backend URL
      const response = await fetch('http://localhost:8080/api/tryon', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Server báo lỗi! Hãy kiểm tra lại Backend.');
      }

      const blob = await response.blob();
      const imageUrl = URL.createObjectURL(blob);
      setResultImgUrl(imageUrl);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans p-4 md:p-8 flex flex-col items-center justify-center">
      <div className="bg-white border border-gray-200 rounded-3xl p-6 md:p-10 shadow-xl max-w-7xl mx-auto w-full">
        
        {/* Header */}
        <div className="text-center mb-10">
          <h2 className="text-gray-900 font-extrabold text-3xl md:text-4xl mb-3 tracking-tight">✨ AI Virtual Try-On</h2>
          <p className="text-gray-500 text-base max-w-2xl mx-auto">
            Đồ án tốt nghiệp - Tự động ghép trang phục lên người mẫu bằng AI
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          
          {/* Cấu hình Category */}
          <div className="flex flex-col items-center justify-center mb-10 bg-gray-50 p-4 rounded-xl border border-gray-100">
            <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wider mb-4">Loại Trang Phục</h3>
            <div className="flex flex-wrap justify-center gap-4 md:gap-8">
              {['upper', 'lower', 'overall'].map((cat) => (
                <label key={cat} className="flex items-center space-x-2 cursor-pointer group">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${category === cat ? 'border-blue-500' : 'border-gray-400 group-hover:border-blue-400'}`}>
                    {category === cat && <div className="w-2.5 h-2.5 bg-blue-500 rounded-full" />}
                  </div>
                  <input 
                    type="radio" 
                    name="category" 
                    value={cat}
                    checked={category === cat}
                    onChange={(e) => setCategory(e.target.value)}
                    className="hidden"
                  />
                  <span className={`font-medium capitalize ${category === cat ? 'text-blue-600' : 'text-gray-600 group-hover:text-blue-500'}`}>
                    {cat === 'upper' ? 'Áo (Upper)' : cat === 'lower' ? 'Quần/Váy (Lower)' : 'Đồ bộ/Áo dài (Overall)'}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Vùng hiển thị phương trình A + B = C */}
          <div className="w-full overflow-x-auto pb-8 pt-4 custom-scrollbar">
            <div className="flex flex-row items-center justify-start md:justify-center gap-4 md:gap-6 min-w-max px-4">
              
              {/* 1. Ảnh Người */}
              <div className="flex flex-col items-center group">
                <label className="relative rounded-2xl overflow-hidden border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 cursor-pointer h-[400px] w-[260px] md:h-[450px] md:w-[290px] flex flex-col items-center justify-center transition-all duration-300 shrink-0">
                  <input type="file" accept="image/*" className="hidden" onChange={handlePersonChange} />
                  {personPreview ? (
                    <>
                      <img src={personPreview} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" alt="Person" />
                      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                        <span className="text-white font-medium text-sm px-3 py-1 bg-black/40 backdrop-blur-sm rounded-full border border-white/20">👤 Người mẫu</span>
                      </div>
                    </>
                  ) : (
                    <div className="text-center p-4">
                      <span className="text-4xl mb-2 block">🧍</span>
                      <span className="text-gray-500 font-medium group-hover:text-blue-500">Tải ảnh người lên</span>
                    </div>
                  )}
                </label>
              </div>
              
              {/* Dấu Cộng */}
              <div className="flex items-center justify-center bg-white rounded-full h-12 w-12 md:h-14 md:w-14 border border-gray-200 shadow-sm z-10 shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-6 h-6 text-gray-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </div>

              {/* 2. Ảnh Trang Phục */}
              <div className="flex flex-col items-center group">
                <label className="relative rounded-2xl overflow-hidden border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 cursor-pointer h-[400px] w-[260px] md:h-[450px] md:w-[290px] flex flex-col items-center justify-center transition-all duration-300 shrink-0">
                  <input type="file" accept="image/*" className="hidden" onChange={handleClothChange} />
                  {clothPreview ? (
                    <>
                      <img src={clothPreview} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" alt="Cloth" />
                      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                        <span className="text-white font-medium text-sm px-3 py-1 bg-black/40 backdrop-blur-sm rounded-full border border-white/20">👗 Trang phục</span>
                      </div>
                    </>
                  ) : (
                    <div className="text-center p-4">
                      <span className="text-4xl mb-2 block">👕</span>
                      <span className="text-gray-500 font-medium group-hover:text-blue-500">Tải ảnh trang phục</span>
                    </div>
                  )}
                </label>
              </div>
              
              {/* Dấu Bằng */}
              <div className="flex items-center justify-center bg-blue-500 rounded-full h-12 w-12 md:h-14 md:w-14 shadow-lg z-10 text-white shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="3" stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12h15m-15 4.5h15m-15-9h15" />
                </svg>
              </div>

              {/* 3. Kết Quả */}
              <div className="flex flex-col items-center group">
                <div className={`relative rounded-2xl overflow-hidden border-4 bg-gray-50 h-[420px] w-[280px] md:h-[480px] md:w-[310px] flex flex-col items-center justify-center transition-all duration-300 shrink-0 ${resultImgUrl ? 'border-blue-500 shadow-2xl ring-4 ring-blue-500/20' : 'border-gray-200 border-dashed'}`}>
                  
                  {loading ? (
                    <div className="text-center flex flex-col items-center">
                      <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mb-4"></div>
                      <p className="text-blue-500 font-bold animate-pulse">Đang xử lý AI...</p>
                      <p className="text-gray-400 text-sm mt-2">{elapsedTime} giây</p>
                    </div>
                  ) : resultImgUrl ? (
                    <>
                      <img src={resultImgUrl} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" alt="Result" />
                      <div className="absolute top-4 right-4">
                        <span className="flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-green-400 border border-white"></span>
                        </span>
                      </div>
                      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-blue-600/90 to-transparent p-5">
                        <span className="text-white font-bold text-sm px-4 py-1.5 bg-black/30 backdrop-blur-md rounded-full border border-white/30 shadow-sm flex items-center w-max">
                          ✨ Hoàn tất ({elapsedTime}s)
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="text-center p-4">
                      <span className="text-4xl mb-2 block text-gray-300">🪄</span>
                      <span className="text-gray-400 font-medium">Kết quả sẽ hiển thị ở đây</span>
                    </div>
                  )}
                </div>
              </div>
              
            </div>
          </div>

          {errorMsg && (
            <div className="bg-red-50 text-red-600 border border-red-200 p-4 rounded-xl text-center mb-8 max-w-2xl mx-auto">
              <strong>LỖI: </strong> {errorMsg}
            </div>
          )}

          {/* Button Submit */}
          <div className="text-center mt-6">
            <button 
              type="submit" 
              disabled={loading || !personImg || !clothImg}
              className={`px-10 py-4 text-lg font-bold text-white rounded-full shadow-lg transition-all transform hover:scale-105 active:scale-95 ${loading || !personImg || !clothImg ? 'bg-gray-400 cursor-not-allowed shadow-none hover:scale-100' : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 hover:shadow-blue-500/30'}`}
            >
              {loading ? `⏳ Đang Ghép Đồ... (${elapsedTime}s)` : '✨ BẮT ĐẦU GHÉP ĐỒ'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

export default App;
