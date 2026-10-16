/**
 * L'Atelier Central — Editorial Product Enrichment Engine
 * Generates rich bespoke tailoring attributes, invisible craftsmanship details,
 * fabric origins, care rituals, and stylist notes for products.
 */

const FABRIC_COMPOSITIONS = [
  {
    composition: '100% Cotton Pima Peru Sợi Dài 80/2',
    weight: '240 g/m² (Trọng lượng trung bình cao)',
    weave: 'Dệt kim Jacquard vân chìm mịn màng',
    origin: 'Sợi Pima vùng thung lũng ven biển Piura, Peru',
    touch: 'Mềm mượt như lụa, bề mặt xốp êm và thoáng khí tự nhiên',
  },
  {
    composition: '100% Linen Tự Nhiên Thu Hoạch Thủ Công',
    weight: '210 g/m² (Mát nhẹ, rủ tự nhiên)',
    weave: 'Dệt thoi sợi mộc vân cát đan thoáng',
    origin: 'Cánh đồng lanh vùng Normandy, miền Bắc nước Pháp',
    touch: 'Độ xốp mát đặc trưng của sợi thực vật, càng giặt càng mềm',
  },
  {
    composition: 'Poplin Cotton Ai Cập Giza 87 Chải Kỹ',
    weight: '185 g/m² (Thanh lịch, giữ phom phẳng)',
    weave: 'Dệt đôi Plain-weave mật độ sợi cao 120/2',
    origin: 'Châu thổ sông Nile, Ai Cập',
    touch: 'Mặt vải đanh chắc, ánh sáng bóng nhẹ sang trọng, ít nhăn',
  },
  {
    composition: 'Len Merino Siêu Mịn 19.5 Micron Pha Cashmere',
    weight: '290 g/m² (Ấm áp, mềm rũ)',
    weave: 'Dệt dập vân Herringbone tinh xảo',
    origin: 'Nông trại sinh thái New South Wales, Úc',
    touch: 'Không gây ngứa, cách nhiệt tuyệt hảo và co giãn nhẹ',
  },
  {
    composition: 'Cotton Mercerized Sinh Học Kết Hợp Tơ Tằm Tự Nhiên',
    weight: '220 g/m² (Ánh ngọc trai kín đáo)',
    weave: 'Dệt Interlock đôi đàn hồi cao cấp',
    origin: 'Xưởng dệt thủ công vùng Como, Ý',
    touch: 'Mát lịm khi chạm vào da, giữ màu chuẩn qua nhiều năm',
  },
];

const TAILORING_DETAILS = [
  {
    hardware: 'Khuy xà cừ tự nhiên Mother-of-pearl tiện thủ công',
    seam: 'Đường may cuộn lụa French seam giấu chỉ, êm ái khi mặc',
    lining: 'Lớp lót lụa Bemberg Cupro thoáng khí chống tĩnh điện',
    collar: 'Ve áo dựng phom bằng vải mùng canvas ngựa (horsehair) đàn hồi',
  },
  {
    hardware: 'Khóa kéo kim loại phủ mờ mạ đồng cổ antique brass',
    seam: 'Mũi may đôi gia cố chịu lực 7 mũi/inch theo tiêu chuẩn may đo Ý',
    lining: 'Bọc viền túi và nẹp cổ bằng vải dệt tơ tằm màu cát',
    collar: 'Cổ áo cắt vát theo đường cong giải phẫu học cổ, không gò bó',
  },
  {
    hardware: 'Khuy sừng trâu tự nhiên dập vân chìm biểu tượng Maison',
    seam: 'Gấu áo may giấu chỉ blind-stitch thủ công chuẩn Savile Row',
    lining: 'Cấu trúc nửa lót (half-lined) nhẹ nhàng thoáng mát mùa hè',
    collar: 'Cổ đứng đệm xơ bông tự nhiên tạo nếp gập mềm mại',
  },
  {
    hardware: 'Khuy bọc vải cùng màu phối chỉ tơ thêu tay tinh xảo',
    seam: 'Đường chần kim nổi đơn sắc với chỉ Coats Correspun độ bền cao',
    lining: 'Túi trong có khóa an toàn may ngầm kín đáo',
    collar: 'Đường cắt ve áo chữ V cổ điển phong cách Noucentisme',
  },
];

const STYLING_NOTES = [
  'Được các nghệ nhân Maison tạo hình với phom dáng Regular Tailored ôm nhẹ khung vai và suông thẳng xuống eo, tạo cảm giác đĩnh đạc nhưng vẫn hoàn toàn thoải mái trong mọi cử động thường nhật.',
  'Thiết kế mang tinh thần Nouvelle Vague kết hợp sự tối giản đương đại. Dễ dàng chuyển tiếp từ không gian công sở thanh lịch sang buổi tiệc trà chiều hoặc dạo phố hoàng hôn.',
  'Tỷ lệ chiều dài và độ mở cổ được nghiên cứu kỹ lưỡng để tôn lên đường nét thanh thoát của cổ và xương quai xanh, lý tưởng khi phối layer cùng áo khoác dệt kim hoặc blazer mỏng.',
  'Sự kết hợp giữa nghệ thuật dệt may cổ điển và đường cắt phóng khoáng, mang lại phong thái tự tin tĩnh lặng (quiet luxury) không phô trương cho người mặc.',
];

const CARE_RITUALS = [
  [
    'Nên giặt khô chuyên nghiệp hoặc giặt tay nhẹ nhàng với nước mát dưới 30°C.',
    'Dùng dung dịch giặt dịu nhẹ có nguồn gốc thực vật, không ngâm quá 10 phút.',
    'Phơi phẳng tự nhiên trên mặt lưới trong bóng râm, tránh ánh nắng gắt trực tiếp.',
    'Ủi ở nhiệt độ trung bình mặt trái, khuyến khích sử dụng bàn là hơi nước đứng.',
    'Bảo quản trên mắc gỗ sồi vai rộng kèm túi bọc vải cotton thoáng khí của Maison.',
  ],
  [
    'Giặt máy ở chế độ Delicates/Silk với túi giặt chuyên dụng và nước lạnh.',
    'Vắt tốc độ chậm dưới 600 vòng/phút để bảo toàn cấu trúc sợi dệt tự nhiên.',
    'Không sử dụng hóa chất tẩy rửa mạnh chứa gốc Clo.',
    'Là ủi hơi nước nhẹ nhàng khi vải còn hơi ẩm để hồi phục nếp phẳng tự nhiên.',
    'Được bảo dưỡng và hỗ trợ may đo chỉnh size trọn đời tại mọi Atelier của chúng tôi.',
  ],
];

/**
 * Hash function to get deterministic index from string
 */
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Enrich a product with luxury tailoring details
 */
export function enrichProduct(product) {
  if (!product) return null;

  const seed = String(product.id || product.sku || product.name || 'atelier');
  const h = hashString(seed);

  const fabric = FABRIC_COMPOSITIONS[h % FABRIC_COMPOSITIONS.length];
  const tailoring = TAILORING_DETAILS[(h + 1) % TAILORING_DETAILS.length];
  const stylingNote = STYLING_NOTES[(h + 2) % STYLING_NOTES.length];
  const careRitual = CARE_RITUALS[(h + 3) % CARE_RITUALS.length];

  // Base description enhancement
  const cleanOriginalDesc = product.description && product.description.length > 20
    ? product.description
    : `Mẫu thiết kế cao cấp từ bộ sưu tập của Maison, được may đo thủ công tỉ mỉ với tỷ lệ vàng chuẩn mực.`;

  return {
    ...product,
    editorialTagline: `Maison Tailored Edition · ${fabric.composition.split(' ')[0]} ${fabric.composition.split(' ')[1] || ''}`,
    enrichedFabric: fabric,
    enrichedTailoring: tailoring,
    stylistNote: stylingNote,
    careRitual: careRitual,
    atelierCode: `GAC-${String(h % 900 + 100).padStart(3, '0')}`,
    certifications: [
      'Chứng nhận dệt may sinh thái OEKO-TEX Standard 100',
      'Tiêu chuẩn may đo thủ công Atelier 2026',
      'Kiểm định độ bền màu ISO 105-B02',
    ],
    silhouette: product.category === 'upper'
      ? 'Regular Tailored Fit (Vai đệm mỏng, suông nhẹ thân áo)'
      : product.category === 'lower'
      ? 'Tapered Silhouette (Cạp cao vừa, xếp ly nhẹ, ống suông nhẹ)'
      : 'Elegance Draping (Rủ mềm tự nhiên theo đường nét cơ thể)',
    sensoryDescription: `${cleanOriginalDesc} Trang phục được hoàn thiện bởi kỹ thuật ${tailoring.seam.toLowerCase()} và ${tailoring.hardware.toLowerCase()}. Bề mặt vải ${fabric.touch.toLowerCase()}, mang lại cảm giác dễ chịu suốt ngày dài. ${stylingNote}`,
  };
}
