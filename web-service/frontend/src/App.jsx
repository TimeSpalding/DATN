import React, { useState } from 'react';

function App() {
  const [personImg, setPersonImg] = useState(null);
  const [clothImg, setClothImg] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resultImgUrl, setResultImgUrl] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!personImg || !clothImg) {
      alert("Vui lòng chọn đủ 2 ảnh (Ảnh người mẫu và Ảnh cái áo)!");
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setResultImgUrl(null);

    const formData = new FormData();
    formData.append('person_image', personImg);
    formData.append('cloth_image', clothImg);

    try {
      // Gửi yêu cầu sang Backend Localhost (cổng 8080)
      const response = await fetch('http://localhost:8080/api/tryon', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Server báo lỗi! Hãy kiểm tra lại link Ngrok bên Backend.');
      }

      // Backend trả về file ảnh (nhị phân), ta chuyển nó thành URL để hiển thị
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
    <div style={{ maxWidth: '800px', margin: '0 auto', fontFamily: 'Arial, sans-serif', padding: '20px' }}>
      <h1 style={{ textAlign: 'center', color: '#2c3e50' }}>👗 Thử Đồ Ảo Bằng AI (CatVTON)</h1>
      <p style={{ textAlign: 'center', color: '#7f8c8d' }}>Đồ án tốt nghiệp v1.0 - Kaggle GPU Backend</p>
      
      <form onSubmit={handleSubmit} style={{ backgroundColor: '#f9f9f9', border: '1px solid #ddd', padding: '20px', borderRadius: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ width: '45%' }}>
            <h3>🧍 Tải lên ảnh Người:</h3>
            <input type="file" accept="image/*" onChange={(e) => setPersonImg(e.target.files[0])} />
          </div>
          <div style={{ width: '45%' }}>
            <h3>👕 Tải lên ảnh Áo:</h3>
            <input type="file" accept="image/*" onChange={(e) => setClothImg(e.target.files[0])} />
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <button 
            type="submit" 
            disabled={loading}
            style={{ 
              padding: '12px 24px', 
              fontSize: '18px', 
              backgroundColor: loading ? '#95a5a6' : '#3498db', 
              color: 'white', 
              border: 'none', 
              borderRadius: '8px', 
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: 'bold',
              width: '100%'
            }}
          >
            {loading ? '⏳ Đang chờ AI ghép đồ (Mất khoảng 1 phút. Không bấm f5 nha)...' : '✨ BẮT ĐẦU GHÉP ĐỒ'}
          </button>
        </div>
      </form>

      {errorMsg && (
        <div style={{ backgroundColor: '#ffcccc', color: '#c0392b', padding: '15px', marginTop: '20px', borderRadius: '8px', textAlign: 'center' }}>
          <strong>LỖI: </strong> {errorMsg}
        </div>
      )}

      {resultImgUrl && (
        <div style={{ textAlign: 'center', marginTop: '40px' }}>
          <h2 style={{ color: '#27ae60' }}>🎉 KẾT QUẢ:</h2>
          <img 
            src={resultImgUrl} 
            alt="AI Generated Tryon" 
            style={{ 
              maxWidth: '100%', 
              borderRadius: '12px', 
              boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
              border: '4px solid #fff' 
            }} 
          />
        </div>
      )}
    </div>
  );
}

export default App;
