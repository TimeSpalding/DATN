import os
import pandas as pd
from PIL import Image as PILImage
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.drawing.image import Image as OpenpyxlImage
from openpyxl.drawing.spreadsheet_drawing import OneCellAnchor, AnchorMarker
from openpyxl.drawing.xdr import XDRPositiveSize2D
from openpyxl.utils.units import pixels_to_EMU

RAW_LOGS_DIR = "research/vton-profiling-optimization/results/raw_logs"
THUMBNAIL_DIR = "research/vton-profiling-optimization/results/excel_thumbnails"
OUTPUT_EXCEL_PATH_1 = "bao_cao_hang_tuan/Bao_cao_danh_gia_25_cap_thu_do_CatVTON_va_phan_tich_loi.xlsx"
OUTPUT_EXCEL_PATH_1_ALT = "bao_cao_hang_tuan/Bao_cao_danh_gia_25_cap_thu_do_CatVTON_va_phan_tich_loi_chuan_hoa.xlsx"
OUTPUT_EXCEL_PATH_2 = "research/vton-profiling-optimization/results/CatVTON_25_Pairs_Benchmark_Visual_Analysis.xlsx"

os.makedirs(THUMBNAIL_DIR, exist_ok=True)
os.makedirs("bao_cao_hang_tuan", exist_ok=True)

# DỮ LIỆU MÔ TẢ VÀ ĐÁNH GIÁ THỊ GIÁC ĐỐI CHIẾU TRỰC TIẾP TỪNG ẢNH (P-01 ĐẾN P-25)
BENCHMARK_AUDIT_DATA = {
    "P-01": {
        "desc": "Hoán đổi: Áo sơ mi trắng cộc tay cổ trụ -> Áo thun dài tay cổ tròn rộng màu đỏ thẫm",
        "comment": (
            "Hoán đổi rõ nét từ áo trắng cộc tay sang áo đỏ thẫm dài tay cổ tròn rộng. "
            "Đường khoét cổ tròn mở đúng vị trí xương đòn, hai ống tay dài phủ kín cánh tay trần ban đầu, "
            "quần tối màu và khuôn mặt được giữ nguyên. Xuất hiện viền sáng mảnh nhẹ ở sát vai phải "
            "nơi tiếp giáp lọn tóc vàng và sắc độ vải đỏ có độ loang nhẹ ở vùng bụng."
        ),
        "grade": "Rất tốt (9.1/10)"
    },
    "P-02": {
        "desc": "Hoán đổi: Áo voan trắng sát nách -> Áo phông xanh lá đậm in chữ trắng 'HUSTLE'",
        "comment": (
            "Chuyển đổi từ áo trắng sát nách sang áo phông cộc tay màu xanh lá đậm. "
            "Mô hình bảo toàn tự nhiên lọn tóc nâu xõa trước ngực phải đè lên mặt áo, do đó dòng chữ in "
            "chỉ lộ phần 'HUST' bên trái (phần 'LE' khuất hợp lý dưới tóc). Bề mặt vải xanh xuất hiện "
            "nhiễu hạt lốm đốm nhẹ và vùng da hai cánh tay có vệt loang sáng nhẹ dọc rìa mặt nạ."
        ),
        "grade": "Tốt - Nhiễu hạt nhẹ (8.4/10)"
    },
    "P-03": {
        "desc": "Hoán đổi: Áo phông đen & quần đen đồng màu -> Áo cộc tay họa tiết hoa văn đỏ - trắng",
        "comment": (
            "Ca lỗi tràn mặt nạ xuống thân dưới: Do người mẫu gốc mặc áo đen tiệp màu với quần đen ống rộng, "
            "bộ phân đoạn AutoMasker nhận diện nhầm phần cạp và đùi quần trên là thân áo, khiến vạt áo hoa văn "
            "đỏ trắng bị kéo dài quá mức xuống ngang đùi. Chi tiết hoa văn mật độ cao ở nửa dưới thân áo bị nhòe bệt, "
            "làm SSIM vùng biên giảm còn 0.7545."
        ),
        "grade": "Trung bình - Tràn mặt nạ eo (6.8/10)"
    },
    "P-04": {
        "desc": "Hoán đổi: Áo form rộng xanh rêu tay lửng -> Áo thun tay lỡ kẻ sọc ngang đen - trắng",
        "comment": (
            "Xóa bỏ phom áo rộng màu xanh rêu cũ và tái tạo áo kẻ sọc ngang đen - trắng ôm gọn theo thân người "
            "trong tư thế tay trái giơ cao chạm tóc. Các đường sọc ở ngực trên rõ nét; tuy nhiên xuống vùng bụng dưới "
            "các sọc mảnh xuất hiện hiện tượng nhòe giao thoa tần số cao (moiré) và vùng cẳng tay trái giơ lên "
            "có vệt mờ nhẹ do thu ngắn ống tay cũ."
        ),
        "grade": "Tốt - Mờ nhẹ sọc dưới (8.6/10)"
    },
    "P-05": {
        "desc": "Hoán đổi: Áo phông trắng cộc tay -> Áo dài tay màu xanh tím than chấm bi trắng",
        "comment": (
            "Chuyển đổi đồng bộ từ áo trắng cộc tay sang áo dài tay màu xanh tím than họa tiết chấm bi trắng. "
            "Hai ống tay dài mới sinh ôm dọc cánh tay đến cổ tay, giữ nguyên lọn tóc nâu xõa qua vai trái và "
            "đường tiếp giáp cạp quần jeans xanh nhạt gọn gàng. Các chấm bi trắng nhỏ giảm nhẹ độ sắc cạnh "
            "qua bộ giải mã VAE nhưng phân bố đều trên toàn bộ bề mặt vải."
        ),
        "grade": "Xuất sắc (9.4/10)"
    },
    "P-06": {
        "desc": "Hoán đổi: Áo dài tay cổ tim xanh dương đậm -> Áo phông trắng in biểu tượng 'adidas' đen",
        "comment": (
            "Hoán đổi từ áo xanh dài tay sang áo phông trắng cộc tay: biểu tượng ba lá màu đen và dòng chữ 'adidas' "
            "trước ngực được tái tạo rõ nét, đúng tỷ lệ và đọc được từng ký tự. Tuy nhiên tại hai cổ tay còn sót "
            "hai vòng viền cổ tay áo màu xanh đậm từ trang phục gốc chưa được mặt nạ xóa hết, kèm vệt bóng mờ nhẹ "
            "trên da cẳng tay."
        ),
        "grade": "Tốt - Sót viền cổ tay cũ (8.5/10)"
    },
    "P-07": {
        "desc": "Hoán đổi: Áo thun cổ tim xám sáng trơn -> Áo phông xanh rêu in hình đầu hổ tròn trắng",
        "comment": (
            "Chuyển đổi đúng tông màu xanh rêu và bố cục hình in tròn màu trắng giữa ngực. Hình đầu hổ ở tâm "
            "giữ được mảng sáng tối chính, song dòng chữ nhỏ chạy vòng quanh viền tròn bị nhòe không đọc được ký tự rời "
            "do giới hạn nén không gian tiềm ẩn 8x của VAE; mặt vải xanh có gợn vân nhẹ. Quần đen và vùng cổ giữ nguyên."
        ),
        "grade": "Rất tốt (9.0/10)"
    },
    "P-08": {
        "desc": "Hoán đổi: Áo ba lỗ đen tuyền -> Áo tay ngắn kẻ sọc ngang bản lớn màu pastel xanh - cam - trắng",
        "comment": (
            "Thay thế áo sát nách đen bằng áo tay ngắn kẻ sọc ngang bản lớn đúng thứ tự dải màu xanh bạc hà, trắng "
            "và cam vàng. Hạn chế thị giác nằm ở các dải màu pastel sáng bị loang đốm xám nhạt không đồng đều trên thân áo, "
            "đồng thời dọc cánh tay phải xuất hiện quầng lem màu cam nhạt quanh biên mặt nạ."
        ),
        "grade": "Khá - Loang sắc độ pastel (7.7/10)"
    },
    "P-09": {
        "desc": "Hoán đổi: Áo thun cộc tay xám than tối -> Áo tay hến cổ tròn màu đỏ hồng san hô",
        "comment": (
            "Thay thế nền áo xám than tối bằng sắc đỏ san hô tươi sáng, phom tay hến ngắn mở đúng thiết kế sản phẩm mẫu. "
            "Tại vùng da bắp tay bên ngoài mép tay áo mới (vị trí ống tay xám cũ dài hơn tay hến mới) xuất hiện "
            "dải viền nhiễu mờ màu xám nhạt bao quanh cánh tay do vùng phục hồi da chưa đồng nhất."
        ),
        "grade": "Tốt - Viền mờ vùng bắp tay (8.5/10)"
    },
    "P-10": {
        "desc": "Hoán đổi: Áo dài tay màu đỏ rượu dáng trùm hông -> Áo phông trắng in chữ đỏ 'IAM SCARLETT'",
        "comment": (
            "Ca lỗi xóa trang phục cũ không triệt để khi chuyển từ áo dài tay tối màu dáng dài sang áo trắng cộc tay ngắn: "
            "Nửa ngực trên tái tạo rõ nền trắng và dòng chữ đỏ 'IAM SCARLETT', nhưng toàn bộ hai cẳng tay và vùng bụng dưới "
            "vẫn còn sót mảng ống tay đỏ sẫm và gấu áo tối màu loang lổ như mặc chồng hai lớp áo do mặt nạ không bao phủ hết áo gốc."
        ),
        "grade": "Lỗi nặng - Sót tay & gấu áo cũ (5.8/10)"
    },
    "P-11": {
        "desc": "Hoán đổi: Áo hai dây trắng bản to -> Áo dài tay xanh rêu phối ren cổ cao và gấu áo",
        "comment": (
            "Phủ kín vùng cổ trắng và hai cánh tay trần bằng dáng áo dài tay màu xanh rêu, bảo toàn rõ đường cạp quần tây xám. "
            "Tuy nhiên mô hình khuếch tán đã khái quát hóa chi tiết viền ren ở cổ và gấu áo mẫu thành họa tiết vân ren "
            "phủ khắp toàn bộ thân và tay áo (thay vì thân trơn phối ren), đồng thời phần cổ cao bị hạ thấp thành cổ tròn."
        ),
        "grade": "Khá - Biến đổi bề mặt vải (7.8/10)"
    },
    "P-12": {
        "desc": "Hoán đổi: Áo tay ngắn màu hồng đỏ (tay đặt hông) -> Áo dài tay màu đen cổ đắp chéo chữ V",
        "comment": (
            "Xóa sạch sắc hồng đỏ của áo cũ và kéo dài hai ống tay đen theo tư thế tay phải chống hông. "
            "Tuy nhiên phát sinh hai sai lệch thị giác: hai ống tay mới có kết cấu mắt lưới xuyên thấu thay vì vải thun đen đặc "
            "như ảnh mẫu, và vùng bụng dưới xuất hiện mảng hạt chấm vàng cam nhạt đè lên nền quần trắng tại ranh giới gấu áo."
        ),
        "grade": "Khá - Nhiễu lưới tay & eo (7.5/10)"
    },
    "P-13": {
        "desc": "Hoán đổi: Áo dài tay đen mỏng xuyên thấu -> Áo dài tay xám tiêu cổ chữ V đan dây chéo",
        "comment": (
            "Tái tạo chính xác bề mặt vải xám tiêu vân sợi dệt cùng chi tiết dây đan chéo ở cổ chữ V ngay giữa ngực. "
            "Phom áo ôm gọn tự nhiên thay thế hoàn toàn nền áo đen cũ trên thân người; chỉ còn sót một viền gấu tay màu đen "
            "rất hẹp sát mu bàn tay chưa nằm trọn trong vùng mặt nạ."
        ),
        "grade": "Rất tốt (9.2/10)"
    },
    "P-14": {
        "desc": "Hoán đổi: Áo sát nách xếp ly xanh cổ vịt -> Áo polo cộc tay có cổ bẻ màu đỏ tươi",
        "comment": (
            "Chuyển đổi tương phản màu mạnh từ xanh cổ vịt sang đỏ tươi rõ ràng: lá cổ bẻ polo và nẹp cúc dọc trước ngực "
            "được dựng khối cân đối, không còn dấu vết màu xanh cũ ở viền cổ hay nách. Dọc hai cánh tay trần có vệt bóng mờ "
            "nhẹ quanh biên mặt nạ cánh tay nhưng không làm biến dạng hình thể."
        ),
        "grade": "Rất tốt (9.1/10)"
    },
    "P-15": {
        "desc": "Hoán đổi: Áo thun trắng in chấm tròn pastel -> Áo tay cánh dơi kẻ sọc ngang xanh - trắng",
        "comment": (
            "Các đường kẻ sọc ngang xanh dương - trắng uốn liên tục theo độ rủ vai cánh dơi và nếp sơ vin nhẹ ở cạp quần jeans, "
            "xóa sạch họa tiết hình tròn cũ. Điểm hạn chế nhỏ là vùng da cổ và cẳng tay phải xuất hiện vài đốm loang màu cam nhạt "
            "do nhiễu tại ranh giới mặt nạ cổ thuyền rộng."
        ),
        "grade": "Tốt - Đốm nhiễu nhẹ cổ/tay (8.7/10)"
    },
    "P-16": {
        "desc": "Hoán đổi: Áo henley tay lỡ màu xám chì -> Áo khoét vai màu đỏ tươi họa tiết hoa trắng - xanh",
        "comment": (
            "Tái tạo đúng cấu trúc áo khoét hở hai mỏm vai (khôi phục hợp lý phần da vai dù trang phục gốc kín vai) "
            "và giữ được các cụm họa tiết hoa lá lớn màu trắng - xanh trên nền vải đỏ. Độ bão hòa màu đỏ trên ảnh kết quả "
            "cao hơn nhẹ so với ảnh sản phẩm gốc; đường gấu áo tiếp giáp quần tối màu gọn gàng."
        ),
        "grade": "Rất tốt (9.2/10)"
    },
    "P-17": {
        "desc": "Hoán đổi: Áo dài tay kẻ sọc xám - trắng -> Áo phông trắng tinh in chữ nhỏ 'RIOT' ngực trái",
        "comment": (
            "Ca thất bại nặng về chất lượng vùng thử đồ (dù SSIM ngoài mặt nạ đạt 0.9844 do đầu và quần giữ nguyên): "
            "Ảnh áo trắng trên nền trắng làm suy giảm tín hiệu đặc trưng biên, khiến áo sinh ra ngả màu xám đục, xuất hiện "
            "vệt nhiễu rách dọc màu nâu đen giữa ngực, chữ 'RIOT' biến dạng thành đốm nâu và rìa hai cánh tay bị tua nhiễu răng cưa."
        ),
        "grade": "Lỗi nặng - Vệt rách ngực & lem tay (4.8/10)"
    },
    "P-18": {
        "desc": "Hoán đổi: Áo dài tay cổ tròn rộng xám trắng sáng -> Áo dài tay cổ tim màu đen tuyền",
        "comment": (
            "Chuyển đổi sắc độ đối lập từ xám trắng sáng sang đen tuyền đồng nhất (SSIM ngoài mặt nạ 0.9869, PSNR 40.22 dB). "
            "Đường cắt cổ tim chữ V cân đối, bề mặt vải đen liền mạch không bị loang sáng; chỉ còn một đường viền trắng rất mảnh "
            "ở sát mép cổ tay do mặt nạ tay áo hụt vài pixel."
        ),
        "grade": "Xuất sắc (9.4/10)"
    },
    "P-19": {
        "desc": "Hoán đổi: Áo tay ngắn kẻ sọc đen - trắng -> Áo dài tay cổ lọ thấp màu hồng phấn pastel",
        "comment": (
            "Xóa bỏ hoàn toàn sọc đen trắng của áo cũ, dựng đúng phần cổ lọ thấp màu hồng phấn và giữ nguyên chân váy xanh nhạt. "
            "Tuy nhiên bề mặt vải hồng trên thân và hai ống tay dài sinh mới đè lên cánh tay trần bị nhòe mờ, loang đốm xám nâu "
            "và thiếu đường biên cổ tay sắc nét."
        ),
        "grade": "Trung bình - Nhòe mờ ống tay dài (6.5/10)"
    },
    "P-20": {
        "desc": "Hoán đổi (overall): Áo đỏ dài tay & quần đen -> Áo sát nách dáng dài xanh tím than",
        "comment": (
            "Ca lỗi xung đột danh mục overall: Thân trên được thay bằng áo sát nách tối màu và khôi phục hai cánh tay trần, "
            "nhưng do tham số overall mở rộng mặt nạ xóa luôn cả phần quần jeans đen phía dưới trong khi trang phục đầu vào "
            "không có chân váy/quần, mô hình sinh ảo giác mảng hạt nâu cam nhiễu loạn phủ kín vùng hông và đùi (SSIM giảm còn 0.7864)."
        ),
        "grade": "Lỗi nặng - Nhiễu loạn thân dưới (5.2/10)"
    },
    "P-21": {
        "desc": "Hoán đổi: Áo tay lỡ màu xanh tím than trơn -> Áo cộc tay kẻ sọc ngang cam đất - đen đính hoa ngực",
        "comment": (
            "Tái tạo rõ nét hệ sọc ngang nhỏ màu cam đất - đen, viền cổ tròn màu đen cùng chi tiết nơ hoa đen nhỏ đính bên ngực trái. "
            "Dây rút và cạp quần nỉ xám phía dưới được giữ nguyên vẹn; dọc rìa ngoài cẳng tay chỉ xuất hiện dải bóng mờ mảnh "
            "nơi ống tay lỡ cũ thu ngắn thành tay cộc."
        ),
        "grade": "Xuất sắc (9.3/10)"
    },
    "P-22": {
        "desc": "Hoán đổi: Áo ba lỗ xám ghi dáng nghiêng -> Áo phông đỏ rượu vang in chữ gothic 'Authentic'",
        "comment": (
            "Đắp thêm tự nhiên phần vai và hai ống tay cộc màu đỏ rượu vang lên vai trần của người mẫu ở tư thế đứng nghiêng. "
            "Dòng chữ trắng 'Authentic' giữ đúng kiểu chữ gothic và độ tương phản rõ ràng trên ngực, dù ký tự đầu 'A' hơi biến dạng nhẹ "
            "theo độ cong cơ thể và rìa cẳng tay trái có vệt viền xám mỏng."
        ),
        "grade": "Rất tốt (9.1/10)"
    },
    "P-23": {
        "desc": "Hoán đổi: Áo dài tay cổ tròn rộng màu đen -> Áo cộc tay xếp ly cổ màu vàng mù tạc",
        "comment": (
            "Phần thân áo chuyển đổi hoàn toàn từ đen tuyền sang vàng mù tạc kèm chi tiết xếp ly cổ tròn rõ ràng. "
            "Tuy nhiên hai phần cổ tay áo màu đen của trang phục gốc ở sát cổ tay không nằm trong mặt nạ xóa nên bị giữ lại "
            "như hai băng cổ tay đen, đồng thời vùng da cánh tay tái tạo có nhiễu hạt sáng tối."
        ),
        "grade": "Khá - Sót cổ tay áo đen cũ (7.6/10)"
    },
    "P-24": {
        "desc": "Hoán đổi: Áo sát nách đen họa tiết hoa ánh kim -> Áo dài tay kẻ sọc ngang trắng - xanh - đen",
        "comment": (
            "Chuyển đổi từ áo sát nách tối màu sang áo dài tay kẻ sọc ngang đa sắc: các đường sọc trắng, xanh dương, xanh lá và đen "
            "chạy đều qua thân áo và dọc hai ống tay dài mới sinh, giữ nguyên lọn tóc xõa vai. Tại cổ tay phải đặt ngang eo "
            "có sự hòa lẫn nhẹ giữa các vạch sọc của ống tay và thân áo."
        ),
        "grade": "Rất tốt (9.1/10)"
    },
    "P-25": {
        "desc": "Hoán đổi (overall): Áo trắng tay bèo & chân váy bò -> Áo hai dây dáng dài trắng trên nền trắng",
        "comment": (
            "Ca suy biến điều kiện hóa nghiêm trọng nhất (SSIM = 0.7648, PSNR = 14.54 dB): Mặt nạ overall xóa toàn bộ cả áo trắng "
            "lẫn chân váy bò xanh đậm, trong khi ảnh trang phục trắng tiệp vào nền trắng làm mất đặc trưng biên; mô hình sinh ảo giác "
            "thành một chiếc đầm dài tay cổ cao xếp ly dọc màu nâu xám hoàn toàn khác trang phục đầu vào."
        ),
        "grade": "Lỗi nặng - Suy biến màu & kiểu dáng (4.2/10)"
    }
}


def make_thumbnail(src_path, dst_path, size=(240, 320)):
    if not os.path.exists(src_path):
        return None
    try:
        with PILImage.open(src_path) as im:
            im = im.convert("RGB")
            im.thumbnail(size, PILImage.Resampling.LANCZOS)
            canvas = PILImage.new("RGB", size, (255, 255, 255))
            offset_x = (size[0] - im.width) // 2
            offset_y = (size[1] - im.height) // 2
            canvas.paste(im, (offset_x, offset_y))
            canvas.save(dst_path, "JPEG", quality=94)
        return dst_path
    except Exception as e:
        print(f"Error making thumbnail for {src_path}: {e}")
        return None


def add_centered_image(ws, thumb_path, col_idx_zero_based, row_idx_zero_based, width_px=116, height_px=154, pad_x_px=7, pad_y_px=6):
    img_obj = OpenpyxlImage(thumb_path)
    marker = AnchorMarker(
        col=col_idx_zero_based,
        colOff=pixels_to_EMU(pad_x_px),
        row=row_idx_zero_based,
        rowOff=pixels_to_EMU(pad_y_px),
    )
    size = XDRPositiveSize2D(pixels_to_EMU(width_px), pixels_to_EMU(height_px))
    img_obj.anchor = OneCellAnchor(_from=marker, ext=size)
    ws.add_image(img_obj)


def build_benchmark_excel():
    print("=== BAT DAU TAO TEP EXCEL BENCHMARK 25 CAP HOAN DOI VTON CHUAN HOA ===")

    df_all = pd.read_csv("research/vton-profiling-optimization/results/profiling_latency.csv")
    print(f"Tong so cap da load: {len(df_all)}")

    wb = openpyxl.Workbook()
    ws_main = wb.active
    ws_main.title = "25_Cap_Benchmark_Thi_Giac"
    ws_main.views.sheetView[0].showGridLines = True

    # Fonts & Styles
    font_title = Font(name="Segoe UI", size=14, bold=True, color="1B365D")
    font_subtitle = Font(name="Segoe UI", size=9, italic=True, color="475569")
    font_header = Font(name="Segoe UI", size=10, bold=True, color="FFFFFF")
    font_data = Font(name="Segoe UI", size=9, color="1E293B")
    font_bold = Font(name="Segoe UI", size=9, bold=True, color="1E293B")
    font_score_good = Font(name="Segoe UI", size=9, bold=True, color="047857")
    font_score_warn = Font(name="Segoe UI", size=9, bold=True, color="B45309")
    font_score_bad = Font(name="Segoe UI", size=9, bold=True, color="B91C1C")

    fill_header = PatternFill(start_color="1B365D", end_color="1B365D", fill_type="solid")
    fill_row_even = PatternFill(start_color="F8FAFC", end_color="F8FAFC", fill_type="solid")
    fill_row_odd = PatternFill(start_color="FFFFFF", end_color="FFFFFF", fill_type="solid")

    align_center = Alignment(horizontal="center", vertical="center", wrap_text=True)
    align_left = Alignment(horizontal="left", vertical="center", wrap_text=True)

    border_thin = Side(border_style="thin", color="CBD5E1")
    box_border = Border(left=border_thin, right=border_thin, top=border_thin, bottom=border_thin)

    # Title Block
    ws_main.merge_cells("A1:M1")
    ws_main["A1"] = "BẢNG ĐÁNH GIÁ THỊ GIÁC 25 CẶP THỬ ĐỒ HOÁN ĐỔI (UNPAIRED) TRÊN MÔ HÌNH CAT-VTON"
    ws_main["A1"].font = font_title
    ws_main["A1"].alignment = Alignment(horizontal="left", vertical="center")
    ws_main.row_dimensions[1].height = 28

    ws_main.merge_cells("A2:M2")
    ws_main["A2"] = (
        "Môi trường: NVIDIA Tesla T4 GPU (Kaggle) | Cấu hình: CatVTON FP16 (DPM++ 2M Karras, 20 bước, độ phân giải 768x1024) | "
        "Toàn bộ 25 cặp đều sử dụng trang phục đích khác biệt hoàn toàn với trang phục gốc của người mẫu và được đối chiếu trực quan từng ảnh"
    )
    ws_main["A2"].font = font_subtitle
    ws_main["A2"].alignment = Alignment(horizontal="left", vertical="center")
    ws_main.row_dimensions[2].height = 20

    headers = [
        ("A", "STT", 6),
        ("B", "Mã cặp", 10),
        ("C", "Chế độ", 12),
        ("D", "Danh mục", 11),
        ("E", "Mô tả ca hoán đổi trang phục thực tế", 34),
        ("F", "Ảnh người mẫu gốc", 19),
        ("G", "Ảnh trang phục đích", 19),
        ("H", "Kết quả CatVTON", 19),
        ("I", "Độ trễ suy diễn (s)", 14),
        ("J", "SSIM ngoài mặt nạ", 14),
        ("K", "PSNR (dB)", 12),
        ("L", "Nhận xét thị giác chi tiết bằng mắt thường", 68),
        ("M", "Xếp loại chất lượng", 22),
    ]

    header_row = 4
    ws_main.row_dimensions[header_row].height = 28

    for col_letter, col_name, col_width in headers:
        cell = ws_main[f"{col_letter}{header_row}"]
        cell.value = col_name
        cell.font = font_header
        cell.fill = fill_header
        cell.alignment = align_center
        cell.border = box_border
        ws_main.column_dimensions[col_letter].width = col_width

    start_row = 5
    for idx, r in df_all.iterrows():
        cur_row = start_row + idx
        pid = r["pair_id"]
        ws_main.row_dimensions[cur_row].height = 128
        row_fill = fill_row_even if idx % 2 == 0 else fill_row_odd

        p_img_path = os.path.join("datacard/test_img", str(r["person_image"]))
        c_img_path = os.path.join("datacard/test_color", str(r["cloth_image"]))
        res_img_path = os.path.join(RAW_LOGS_DIR, f"{pid}_profiled.png")

        p_thumb = os.path.join(THUMBNAIL_DIR, f"{pid}_person.jpg")
        c_thumb = os.path.join(THUMBNAIL_DIR, f"{pid}_cloth.jpg")
        res_thumb = os.path.join(THUMBNAIL_DIR, f"{pid}_result.jpg")

        make_thumbnail(p_img_path, p_thumb)
        make_thumbnail(c_img_path, c_thumb)
        make_thumbnail(res_img_path, res_thumb)

        audit_entry = BENCHMARK_AUDIT_DATA[pid]

        infer_val = round(float(r["inference_time_s"]), 2) if pd.notna(r["inference_time_s"]) else 0.0
        ssim_val = round(float(r["ssim_out_of_mask"]), 4) if pd.notna(r["ssim_out_of_mask"]) else 0.0
        psnr_val = round(float(r["psnr_db"]), 2) if pd.notna(r["psnr_db"]) else 0.0

        ws_main[f"A{cur_row}"] = int(idx + 1)
        ws_main[f"B{cur_row}"] = pid
        ws_main[f"C{cur_row}"] = str(r["mode"])
        ws_main[f"D{cur_row}"] = str(r["category"])
        ws_main[f"E{cur_row}"] = audit_entry["desc"]

        ws_main[f"F{cur_row}"] = ""
        ws_main[f"G{cur_row}"] = ""
        ws_main[f"H{cur_row}"] = ""

        ws_main[f"I{cur_row}"] = infer_val
        ws_main[f"I{cur_row}"].number_format = '0.00"s"'
        ws_main[f"J{cur_row}"] = ssim_val
        ws_main[f"J{cur_row}"].number_format = "0.0000"
        ws_main[f"K{cur_row}"] = psnr_val
        ws_main[f"K{cur_row}"].number_format = "0.00"

        ws_main[f"L{cur_row}"] = audit_entry["comment"]
        ws_main[f"M{cur_row}"] = audit_entry["grade"]

        for col_letter, _, _ in headers:
            c = ws_main[f"{col_letter}{cur_row}"]
            c.fill = row_fill
            c.border = box_border
            if col_letter in ["A", "B", "C", "D"]:
                c.font = font_bold
                c.alignment = align_center
            elif col_letter == "E":
                c.font = font_data
                c.alignment = align_left
            elif col_letter in ["I", "J", "K"]:
                c.font = font_data
                c.alignment = align_center
            elif col_letter == "L":
                c.font = font_data
                c.alignment = align_left
            elif col_letter == "M":
                grade_str = audit_entry["grade"]
                if "Xuất sắc" in grade_str or "Rất tốt" in grade_str:
                    c.font = font_score_good
                elif "Lỗi nặng" in grade_str or "Trung bình" in grade_str:
                    c.font = font_score_bad
                else:
                    c.font = font_score_warn
                c.alignment = align_center

        # Col F=5, G=6, H=7 (0-based indices)
        for col_zero_idx, thumb_path in [(5, p_thumb), (6, c_thumb), (7, res_thumb)]:
            if thumb_path and os.path.exists(thumb_path):
                add_centered_image(ws_main, thumb_path, col_zero_idx, cur_row - 1)

    # Sheet 2: Tổng quan & Phân tích lỗi
    ws_sum = wb.create_sheet(title="Tong_Quan_Va_Phan_Tich_Loi")
    ws_sum.views.sheetView[0].showGridLines = True

    ws_sum.merge_cells("A1:D1")
    ws_sum["A1"] = "BẢNG TỔNG HỢP HIỆU NĂNG VÀ PHÂN LOẠI LỖI THỊ GIÁC TRÊN 25 CẶP THỬ ĐỒ CAT-VTON"
    ws_sum["A1"].font = font_title
    ws_sum["A1"].alignment = Alignment(horizontal="left", vertical="center")
    ws_sum.row_dimensions[1].height = 28

    total_evaluated = len(df_all)
    mean_infer = df_all["inference_time_s"].astype(float).mean()
    mean_prep = df_all["preprocess_time_s"].astype(float).mean()
    mean_ssim = df_all["ssim_out_of_mask"].astype(float).mean()
    mean_psnr = df_all["psnr_db"].astype(float).mean()
    mean_e2e = df_all["e2e_latency_s"].astype(float).mean()
    upper_ssim = df_all[df_all["category"] == "upper"]["ssim_out_of_mask"].astype(float).mean()
    overall_ssim = df_all[df_all["category"] == "overall"]["ssim_out_of_mask"].astype(float).mean()

    kpis = [
        ("Tổng số cặp kiểm thử hoán đổi (Unpaired)", f"{total_evaluated} cặp (23 cặp thân trên upper, 2 cặp toàn thân overall)"),
        ("Phân bố chất lượng thị giác bằng mắt thường", "10 cặp Xuất sắc/Rất tốt, 9 cặp Tốt/Khá (lỗi biên nhỏ), 6 cặp Trung bình/Lỗi nặng"),
        ("Thời gian suy diễn trung bình (UNet Inference)", f"{mean_infer:.2f} giây / cặp"),
        ("Thời gian tiền xử lý trung bình (DensePose + SCHP)", f"{mean_prep:.2f} giây / cặp"),
        ("Tổng độ trễ đầu-cuối trung bình (E2E Latency)", f"{mean_e2e:.2f} giây / cặp"),
        ("Chỉ số SSIM ngoài mặt nạ trung bình (25 cặp)", f"{mean_ssim:.4f}"),
        ("SSIM ngoài mặt nạ nhóm thân trên (upper - 23 cặp)", f"{upper_ssim:.4f}"),
        ("SSIM ngoài mặt nạ nhóm toàn thân (overall - P-20, P-25)", f"{overall_ssim:.4f} (suy giảm mạnh do mặt nạ xóa vùng thân dưới)"),
        ("Tỷ số tín hiệu trên nhiễu đỉnh trung bình (PSNR)", f"{mean_psnr:.2f} dB"),
        ("Môi trường phần cứng và cấu hình suy diễn", "NVIDIA Tesla T4 16GB, CatVTON FP16, DPM++ 2M Karras (20 bước, 768x1024)"),
    ]

    ws_sum["A3"] = "1. CHỈ SỐ ĐO LƯỜNG TỔNG HỢP"
    ws_sum["A3"].font = Font(name="Segoe UI", size=11, bold=True, color="1B365D")

    ws_sum["A4"] = "Chỉ số đánh giá"
    ws_sum["B4"] = "Giá trị ghi nhận thực tế"
    ws_sum["A4"].font = font_header
    ws_sum["B4"].font = font_header
    ws_sum["A4"].fill = fill_header
    ws_sum["B4"].fill = fill_header
    ws_sum["A4"].border = box_border
    ws_sum["B4"].border = box_border

    for i, (kpi_name, kpi_val) in enumerate(kpis, start=5):
        ws_sum[f"A{i}"] = kpi_name
        ws_sum[f"B{i}"] = kpi_val
        ws_sum[f"A{i}"].font = font_data
        ws_sum[f"B{i}"].font = font_bold
        ws_sum[f"A{i}"].border = box_border
        ws_sum[f"B{i}"].border = box_border
        ws_sum[f"A{i}"].alignment = align_left
        ws_sum[f"B{i}"].alignment = align_left
        ws_sum.row_dimensions[i].height = 24

    start_fail_row = len(kpis) + 7
    ws_sum[f"A{start_fail_row}"] = "2. PHÂN LOẠI 5 NHÓM LỖI THỊ GIÁC QUAN SÁT TRỰC TIẾP TRÊN 25 CẶP THỰC NGHIỆM"
    ws_sum[f"A{start_fail_row}"].font = Font(name="Segoe UI", size=11, bold=True, color="1B365D")

    fail_headers = [
        ("A", "Nhóm lỗi thị giác", 34),
        ("B", "Biểu hiện cụ thể trên ảnh kết quả", 46),
        ("C", "Nguyên nhân kỹ thuật gốc rễ", 52),
        ("D", "Các cặp ghi nhận", 24),
    ]
    for letter, title, w in fail_headers:
        c = ws_sum[f"{letter}{start_fail_row+1}"]
        c.value = title
        c.font = font_header
        c.fill = fill_header
        c.border = box_border
        c.alignment = align_center
        ws_sum.column_dimensions[letter].width = w
    ws_sum.row_dimensions[start_fail_row+1].height = 26

    failure_data = [
        (
            "Sót phần ống tay hoặc gấu áo cũ khi đổi dài sang ngắn (Incomplete Garment Erasure)",
            "Còn sót vòng cổ tay áo tối màu ở sát hai cổ tay (P-06, P-23) hoặc sót cả mảng ống tay dài và gấu áo trùm hông màu đỏ sẫm (P-10).",
            "AutoMasker sinh mặt nạ sát theo khung trang phục đích ngắn hơn hoặc bỏ sót vùng cổ tay hẹp khi phân đoạn SCHP trên tay áo dài tối màu.",
            "P-06, P-10, P-13, P-18, P-23"
        ),
        (
            "Tràn mặt nạ qua ranh giới eo khi áo và quần tiệp màu (Mask Over-segmentation)",
            "Vạt áo hoa văn đỏ trắng bị kéo dài quá mức xuống ngang đùi đè lên phần quần đen ống rộng của người mẫu gốc.",
            "Khi trang phục thân trên và quần thân dưới cùng màu đen tuyền không có thắt lưng tách biệt, mạng phân đoạn SCHP gộp nhầm phần đùi trên vào nhãn thân áo.",
            "P-03"
        ),
        (
            "Suy biến điều kiện hóa với trang phục trắng trên nền trắng (White-on-White Conditioning Collapse)",
            "Áo trắng sinh ra bị xám đục kèm vệt nhiễu rách dọc giữa ngực (P-17), hoặc biến đổi hoàn toàn thành đầm xếp ly màu nâu xám (P-25).",
            "Ảnh sản phẩm màu trắng tinh đặt trên nền trắng đồng nhất làm triệt tiêu tương phản biên trong Reference UNet, khiến Cross-Attention mất tín hiệu hình học áo.",
            "P-17, P-25"
        ),
        (
            "Nhiễu kết cấu bề mặt và nhòe chữ in nhỏ (Texture Hallucination & Fine Text Blur)",
            "Chữ nhỏ vòng tròn bị nhòe (P-07), sọc mảnh bụng dưới giao thoa moiré (P-04), tay áo đen biến thành lưới (P-12), ống tay hồng nhòe mờ (P-19), ren lan toàn thân (P-11).",
            "Phép nén không gian tiềm ẩn 8x của VAE và 20 bước lấy mẫu DPM++ làm suy hao tần số không gian cao và khái quát hóa quá mức kết cấu cục bộ.",
            "P-02, P-04, P-07, P-08, P-11, P-12, P-19"
        ),
        (
            "Xung đột mặt nạ danh mục toàn thân (Overall Category Mask Misalignment)",
            "Phần quần jeans/chân váy gốc bị mặt nạ overall xóa bỏ và thay bằng mảng hạt nâu cam nhiễu loạn (P-20) hoặc đầm ảo giác (P-25).",
            "Tham số category='overall' mở rộng mặt nạ xóa toàn bộ thân dưới trong khi ảnh trang phục đầu vào từ tập VITON-HD chỉ chứa phần thân trên.",
            "P-20, P-25"
        ),
    ]

    for idx_f, (f_type, f_phenom, f_cause, f_cases) in enumerate(failure_data, start=start_fail_row+2):
        ws_sum[f"A{idx_f}"] = f_type
        ws_sum[f"B{idx_f}"] = f_phenom
        ws_sum[f"C{idx_f}"] = f_cause
        ws_sum[f"D{idx_f}"] = f_cases
        for letter, _, _ in fail_headers:
            c = ws_sum[f"{letter}{idx_f}"]
            c.font = font_bold if letter in ["A", "D"] else font_data
            c.border = box_border
            c.alignment = align_center if letter == "D" else align_left
        ws_sum.row_dimensions[idx_f].height = 48

    wb.save(OUTPUT_EXCEL_PATH_2)
    print(f"Saved: {OUTPUT_EXCEL_PATH_2}")

    try:
        wb.save(OUTPUT_EXCEL_PATH_1)
        print(f"Saved directly: {OUTPUT_EXCEL_PATH_1}")
    except PermissionError:
        wb.save(OUTPUT_EXCEL_PATH_1_ALT)
        print(f"WARNING: {OUTPUT_EXCEL_PATH_1} dang mo trong Excel -> Da luu ban chuan hoa tai: {OUTPUT_EXCEL_PATH_1_ALT}")


if __name__ == "__main__":
    build_benchmark_excel()
